"use client";

import { useState, useRef } from "react";

interface Props {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export default function ImageUpload({ images, onChange, max = 6 }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [...images];

    for (const file of Array.from(files)) {
      if (newUrls.length >= max) break;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        newUrls.push(data.data.url);
        onChange(newUrls);
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
        {images.map((url, i) => (
          <div key={i} style={{ width: "100px", height: "100px", borderRadius: "6px", overflow: "hidden", position: "relative", border: "1px solid #e5e7eb" }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              type="button"
              onClick={() => removeImage(i)}
              style={{
                position: "absolute", top: "4px", right: "4px",
                width: "20px", height: "20px", borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", color: "#fff",
                border: "none", cursor: "pointer", fontSize: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <div
            onClick={() => { if (!uploading) inputRef.current?.click(); }}
            style={{
              width: "100px", height: "100px", borderRadius: "6px",
              border: "2px dashed #d1d5db", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.5 : 1,
              fontSize: "24px", color: "#aaa",
            }}
          >
            {uploading ? "..." : "+"}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        style={{ display: "none" }}
      />
      <p style={{ fontSize: "11px", color: "#aaa" }}>
        支持 JPG/PNG/WebP，每张最大 5MB，最多 {max} 张
      </p>
    </div>
  );
}
