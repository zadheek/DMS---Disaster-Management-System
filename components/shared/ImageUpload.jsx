"use client";
import { useState, useRef } from "react";
import { Upload, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";

export default function ImageUpload({ onUpload, currentUrl = null, label = "Upload Image" }) {
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!currentUrl);
  const inputRef = useRef(null);

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
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[var(--border)]">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-[var(--bg-elevated)]/80 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <X className="w-4 h-4" />
          </button>
          {uploaded && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-[var(--safe)]">
              <CheckCircle className="w-3 h-3" />
              Uploaded
            </div>
          )}
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
