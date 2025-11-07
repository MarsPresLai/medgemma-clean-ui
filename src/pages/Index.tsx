import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, FileText, Image as ImageIcon } from "lucide-react";

const formSchema = z.object({
  mode: z.enum(["text", "image"]),
  prompt: z.string().trim().min(1, "Prompt is required").max(2000, "Prompt must be less than 2000 characters"),
  system: z.string().trim().max(500, "System message must be less than 500 characters"),
  chainedMode: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const Index = () => {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "text",
      prompt: "",
      system: "You are a helpful medical assistant.",
      chainedMode: false,
    },
  });

  const mode = form.watch("mode");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setImagePreview("");
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setResponse("");

    try {
      let fetchUrl: string;
      let requestBody: BodyInit;
      const headers: Record<string, string> = { accept: "application/json" };

      if (data.mode === "image") {
        if (!selectedImage) {
          toast.error("Please select an image before submitting");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("prompt", data.prompt);
        formData.append("image", selectedImage);

        fetchUrl = data.chainedMode ? "/predict/chained_image" : "/predict/image";
        requestBody = formData;
      } else {
        fetchUrl = data.chainedMode ? "/predict/chained_text" : "/predict/text";
        requestBody = JSON.stringify({ prompt: data.prompt, system: data.system });
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(fetchUrl, {
        method: "POST",
        headers: data.mode === "image" ? { accept: "application/json" } : headers,
        body: requestBody,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }

      const result = await res.json();

      if (result.final_response) {
        setResponse(result.final_response.trim());
      } else if (result.response) {
        setResponse(result.response.trim());
      } else {
        setResponse(JSON.stringify(result, null, 2));
      }

      toast.success("Response received successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setResponse(`Error: ${errorMessage}`);
      toast.error("Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            MedGemma API Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Medical inference powered by advanced language models
          </p>
        </header>

        <Card className="shadow-[var(--shadow-medium)] border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Inference Configuration
            </CardTitle>
            <CardDescription>
              Configure your inference parameters and submit your prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Inference Mode</Label>
                <RadioGroup
                  value={form.watch("mode")}
                  onValueChange={(value) => form.setValue("mode", value as "text" | "image")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 bg-secondary/50 px-4 py-3 rounded-lg transition-all hover:bg-secondary cursor-pointer">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text" className="cursor-pointer font-medium">
                      Text
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-secondary/50 px-4 py-3 rounded-lg transition-all hover:bg-secondary cursor-pointer">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image" className="cursor-pointer font-medium">
                      Image
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-base font-semibold">
                  Prompt
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your medical query or instruction..."
                  className="min-h-[120px] resize-none"
                  {...form.register("prompt")}
                />
                {form.formState.errors.prompt && (
                  <p className="text-sm text-destructive">{form.formState.errors.prompt.message}</p>
                )}
              </div>

              {mode === "text" && (
                <div className="space-y-2">
                  <Label htmlFor="system" className="text-base font-semibold">
                    System Message
                  </Label>
                  <Input
                    id="system"
                    placeholder="System instructions..."
                    {...form.register("system")}
                  />
                  {form.formState.errors.system && (
                    <p className="text-sm text-destructive">{form.formState.errors.system.message}</p>
                  )}
                </div>
              )}

              {mode === "image" && (
                <div className="space-y-3">
                  <Label htmlFor="image-upload" className="text-base font-semibold">
                    Upload Image
                  </Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => document.getElementById("image-upload")?.click()}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    {imagePreview && (
                      <div className="relative rounded-lg overflow-hidden border border-border shadow-[var(--shadow-soft)]">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto max-h-64 object-contain bg-muted"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 bg-secondary/30 px-4 py-3 rounded-lg">
                <Checkbox
                  id="chained-mode"
                  checked={form.watch("chainedMode")}
                  onCheckedChange={(checked) => form.setValue("chainedMode", checked as boolean)}
                />
                <Label htmlFor="chained-mode" className="cursor-pointer font-medium">
                  Enable Chained Mode
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {response && (
          <Card className="shadow-[var(--shadow-medium)] border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-accent" />
                Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {response}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
