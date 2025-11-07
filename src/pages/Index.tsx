import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Cpu, Image as ImageIcon, Zap } from "lucide-react";

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
      // Auto-switch to image mode when image is uploaded
      form.setValue("mode", "image");
    } else {
      setSelectedImage(null);
      setImagePreview("");
      // Auto-switch to text mode when image is removed
      form.setValue("mode", "text");
    }
  };

  // Watch for image changes to auto-update mode
  useEffect(() => {
    if (selectedImage) {
      form.setValue("mode", "image");
    } else {
      form.setValue("mode", "text");
    }
  }, [selectedImage, form]);

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[var(--gradient-glow)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                <Cpu className="h-12 w-12 text-primary animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-primary/50" />
              </div>
            </div>
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]">
              MedGemma AI
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Next-generation medical inference powered by advanced language models
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-primary/80">
              <Zap className="h-4 w-4" />
              <span>Intelligent • Precise • Secure</span>
              <Zap className="h-4 w-4" />
            </div>
          </header>

          <Card className="shadow-[var(--shadow-medium)] border border-border/50 bg-[var(--gradient-card)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-primary" />
                Inference Configuration
              </CardTitle>
              <CardDescription className="text-base">
                {mode === "image" 
                  ? "Analyzing medical imagery with advanced AI vision" 
                  : "Configure your text-based inference parameters"}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
                {/* Image Upload Section - Always visible */}
                <div className="space-y-3">
                  <Label htmlFor="image-upload" className="text-base font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Medical Image Upload
                    <span className="text-xs font-normal text-muted-foreground ml-2">(Optional - Auto-switches to image mode)</span>
                  </Label>
                  <div className="space-y-4">
                    <div className="relative group">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer bg-secondary/50 border-2 border-dashed border-border hover:border-primary/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    {imagePreview && (
                      <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 shadow-[var(--shadow-glow)] animate-in fade-in-50 slide-in-from-bottom-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto max-h-80 object-contain bg-secondary/30 backdrop-blur-sm"
                        />

                        <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground flex items-center gap-1.5">
                          <ImageIcon className="h-3 w-3" />
                          Image Mode Active
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Prompt
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder={mode === "image" 
                      ? "Describe what you'd like to analyze in the medical image..." 
                      : "Enter your medical query or instruction..."}
                    className="min-h-[140px] resize-none bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    {...form.register("prompt")}
                  />
                  {form.formState.errors.prompt && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
                      {form.formState.errors.prompt.message}
                    </p>
                  )}
                </div>

                {mode === "text" && (
                  <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-3">
                    <Label htmlFor="system" className="text-base font-semibold flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      System Message
                    </Label>
                    <Input
                      id="system"
                      placeholder="System instructions..."
                      className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      {...form.register("system")}
                    />
                    {form.formState.errors.system && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
                        {form.formState.errors.system.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-3 bg-secondary/20 backdrop-blur-sm px-5 py-4 rounded-xl border border-border/30 hover:border-primary/30 transition-all group">
                  <Checkbox
                    id="chained-mode"
                    checked={form.watch("chainedMode")}
                    onCheckedChange={(checked) => form.setValue("chainedMode", checked as boolean)}
                    className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="chained-mode" className="cursor-pointer font-medium flex items-center gap-2 flex-1">
                    <Zap className="h-4 w-4 text-accent group-hover:text-primary transition-colors" />
                    Enable Chained Mode
                    <span className="text-xs text-muted-foreground ml-auto">Enhanced multi-step inference</span>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Start Inference
                        <Sparkles className="h-5 w-5" />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {response && (
            <Card className="shadow-[var(--shadow-medium)] border border-primary/20 bg-[var(--gradient-card)] backdrop-blur-xl relative overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Cpu className="h-6 w-6 text-primary animate-pulse" />
                  AI Response
                  <span className="ml-auto text-sm font-normal text-muted-foreground">Inference Complete</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-8 border border-border/30 font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                  {response}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
