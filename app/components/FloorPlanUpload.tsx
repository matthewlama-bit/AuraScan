import React, { useRef, useState } from 'react';

interface FloorPlanUploadProps {
  onUpload: (file: File, url: string) => void;
}

export default function FloorPlanUpload({ onUpload }: FloorPlanUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onUpload(file, url);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-stone-200 flex flex-col items-center">
      <h3 className="font-bold text-stone-900 mb-2">Upload Target Property Floor Plan</h3>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        className="mb-4"
      />
      {preview && (
        <img src={preview} alt="Floor plan preview" className="max-w-full max-h-96 rounded shadow" />
      )}
    </div>
  );
}
