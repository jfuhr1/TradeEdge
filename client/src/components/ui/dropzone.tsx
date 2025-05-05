import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Image } from "lucide-react";

interface FileDropzoneProps {
  onFileAccepted: (fileDataUrl: string) => void;
  value?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
}

export function FileDropzone({
  onFileAccepted,
  value,
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".gif"],
  },
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = "Drag & drop an image here, or click to select"
}: FileDropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        onFileAccepted(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const handleRemove = () => {
    setPreviewUrl(null);
    onFileAccepted("");
  };

  return (
    <div className="w-full">
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 cursor-pointer text-center flex flex-col items-center justify-center transition-colors
            ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-accent"}
            min-h-[200px]
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      ) : (
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-auto max-h-[400px] object-contain"
            />
            <Button
              onClick={handleRemove}
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              {...getRootProps()}
              variant="outline"
              className="absolute bottom-2 right-2"
            >
              <input {...getInputProps()} />
              <Image className="h-4 w-4 mr-2" /> Change
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}