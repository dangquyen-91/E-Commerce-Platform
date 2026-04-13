"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  maxSizeMB = 5,
  onUpload,
  disabled = false,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(`Tối đa ${maxImages} ảnh`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Validate file sizes
    for (const file of filesToProcess) {
      if (file.size > maxSizeBytes) {
        setError(`Ảnh phải nhỏ hơn ${maxSizeMB}MB`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Chỉ chấp nhận file ảnh");
        return;
      }
    }

    setUploading(true);

    try {
      const newUrls: string[] = [];

      for (const file of filesToProcess) {
        if (onUpload) {
          // Use custom upload function if provided
          const url = await onUpload(file);
          newUrls.push(url);
        } else {
          // Default: convert to base64 data URL
          const dataUrl = await fileToDataUrl(file);
          newUrls.push(dataUrl);
        }
      }

      onChange([...images, ...newUrls]);
    } catch {
      setError("Lỗi khi tải ảnh lên");
    } finally {
      setUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    setError(null);
  };

  const canAddMore = images.length < maxImages && !disabled && !uploading;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border"
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canAddMore && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Thêm ảnh ({images.length}/{maxImages})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Helper function to convert file to data URL
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
