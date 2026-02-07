import React, { useState } from 'react';
import FloorPlanUpload from './FloorPlanUpload';

export default function UnpackPanel() {
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);

  function handleUpload(file: File, url: string) {
    setFloorPlanFile(file);
    setFloorPlanUrl(url);
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <FloorPlanUpload onUpload={handleUpload} />
      {/* Future: Room drawing and item mapping UI goes here */}
      {floorPlanUrl && (
        <div className="text-xs text-stone-500 mt-2">Floor plan uploaded. Next: define rooms/areas.</div>
      )}
    </div>
  );
}