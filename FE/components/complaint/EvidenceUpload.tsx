"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, FileText, Film, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { uploadService } from "@/lib/services/upload.service";

export type EvidenceType = "Screenshot" | "Image" | "Video" | "Document";

export interface EvidenceItem {
  type: EvidenceType;
  url: string;
  description?: string;
}

interface EvidenceUploadProps {
  evidence: EvidenceItem[];
  onChange: (evidence: EvidenceItem[]) => void;
  maxItems?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string; icon: typeof ImageIcon }[] = [
  { value: "Screenshot", label: "Ảnh màn hình", icon: ImageIcon },
  { value: "Image", label: "Hình ảnh", icon: ImageIcon },
  { value: "Video", label: "Video", icon: Film },
  { value: "Document", label: "Tài liệu", icon: FileText },
];

const ACCEPT_BY_TYPE: Record<EvidenceType, string> = {
  Screenshot: "image/*",
  Image: "image/*",
  Video: "video/*",
  Document: "image/*,.pdf,.doc,.docx",
};

export function EvidenceUpload({
  evidence,
  onChange,
  maxItems = 10,
  maxSizeMB = 10,
  disabled = false,
  className,
}: EvidenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<EvidenceType>("Screenshot");
  const [description, setDescription] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (evidence.length >= maxItems) {
      setError(`Tối đa ${maxItems} bằng chứng`);
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File phải nhỏ hơn ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const result = await uploadService.uploadFile(file);

      const newEvidence: EvidenceItem = {
        type: selectedType,
        url: result.url,
        description: description.trim() || undefined,
      };

      onChange([...evidence, newEvidence]);
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải file lên");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removeEvidence = (index: number) => {
    onChange(evidence.filter((_, i) => i !== index));
    setError(null);
  };

  const canAddMore = evidence.length < maxItems && !disabled && !uploading;

  const getTypeIcon = (type: EvidenceType) => {
    const option = EVIDENCE_TYPE_OPTIONS.find((o) => o.value === type);
    const Icon = option?.icon || ImageIcon;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeLabel = (type: EvidenceType) => {
    const option = EVIDENCE_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Evidence List */}
      {evidence.length > 0 && (
        <div className="space-y-3">
          {evidence.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
            >
              {/* Preview */}
              <div className="w-20 h-20 rounded border overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                {item.type === "Video" ? (
                  <Film className="h-8 w-8 text-muted-foreground" />
                ) : item.type === "Document" && !item.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <img
                    src={item.url}
                    alt={`Bằng chứng ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {getTypeIcon(item.type)}
                  <span>{getTypeLabel(item.type)}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {item.description}
                  </p>
                )}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 block truncate"
                >
                  {item.url}
                </a>
              </div>

              {/* Remove */}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => removeEvidence(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Section */}
      {canAddMore && (
        <div className="space-y-3 p-4 border rounded-lg border-dashed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Type Selection */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Loại bằng chứng</label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as EvidenceType)}
                disabled={uploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mô tả (tùy chọn)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về bằng chứng..."
                disabled={uploading}
              />
            </div>
          </div>

          {/* File Input */}
          <div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_BY_TYPE[selectedType]}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="w-full gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Chọn file ({evidence.length}/{maxItems})
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Empty State */}
      {evidence.length === 0 && !canAddMore && (
        <div className="text-sm text-muted-foreground text-center py-4">
          Chưa có bằng chứng nào
        </div>
      )}
    </div>
  );
}
