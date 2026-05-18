"use client";
import { useEffect, useState, useRef } from "react";
import { RefreshCw, Trash2, CheckCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";

export default function ImageUpload({ onUpload, currentUrl = null, label = "Upload Image" }) {
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!currentUrl);
  const inputRef = useRef(null);

  useEffect(() => {
    setPreview(currentUrl);
    setUploaded(!!currentUrl);
  }, [currentUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum 5MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post("/api/upload", formData);
      if (data.success) {
        setUploaded(true);
        onUpload?.(data.data.url);
        toast.success("Image uploaded");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploaded(false);
    onUpload?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="space-y-2">
          <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {uploaded && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-[var(--safe)] shadow-sm">
                <CheckCircle className="w-3 h-3" />
                Uploaded
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              {uploading ? (
                <span className="h-4 w-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--critical)]/30 bg-white px-3 text-sm font-medium text-[var(--critical)] transition hover:bg-[var(--critical)]/10 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors",
            "border-[var(--border)] text-[var(--text-muted)]",
            "hover:border-[var(--accent)] hover:text-[var(--accent)]",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm">{label}</span>
              <span className="text-xs">JPG, PNG, WebP up to 5MB</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
