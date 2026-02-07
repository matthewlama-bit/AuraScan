import React, { useState } from 'react';
import FloorPlanUpload from './FloorPlanUpload';

// Stepper workflow steps
const steps = [
  'Upload Floor Plan',
  'Define Rooms',
  'AI Furniture Mapping',
  'Drag & Drop Furniture',
];

export default function UnpackPanel() {
  const [step, setStep] = useState(0);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  // Placeholder for room/area mapping and furniture mapping
  // const [roomAreas, setRoomAreas] = useState<any[]>([]);
  // const [furnitureMap, setFurnitureMap] = useState<any[]>([]);

  function handleUpload(file: File, url: string) {
    setFloorPlanFile(file);
    setFloorPlanUrl(url);
    setStep(1);
  }

  // Stepper UI
  function Stepper() {
    return (
      <div className="flex items-center justify-center gap-4 mb-6">
        {steps.map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs ${step === idx ? 'bg-blue-500 text-white' : 'bg-stone-200 text-stone-500'}`}>{idx + 1}</div>
            <div className={`ml-2 text-sm font-semibold ${step === idx ? 'text-blue-700' : 'text-stone-500'}`}>{label}</div>
            {idx < steps.length - 1 && <div className="mx-2 w-8 h-1 bg-stone-300 rounded" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Stepper />
      {step === 0 && (
        <FloorPlanUpload onUpload={handleUpload} />
      )}
      {step === 1 && floorPlanUrl && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 flex flex-col items-center">
          <img src={floorPlanUrl} alt="Floor plan preview" className="max-w-full max-h-96 rounded shadow mb-4" />
          <h3 className="font-bold text-stone-900 mb-2">Define Rooms</h3>
          <p className="text-sm text-stone-500 mb-4">Select a room from the survey, then draw its area on the floor plan.</p>
          {/* TODO: Room dropdown and area drawing UI */}
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setStep(2)}>Next: AI Mapping</button>
        </div>
      )}
      {step === 2 && floorPlanUrl && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 flex flex-col items-center">
          <img src={floorPlanUrl} alt="Floor plan preview" className="max-w-full max-h-96 rounded shadow mb-4" />
          <h3 className="font-bold text-stone-900 mb-2">AI Furniture Mapping</h3>
          <p className="text-sm text-stone-500 mb-4">Furniture from the survey will be mapped to rooms automatically.</p>
          {/* TODO: AI mapping logic and preview UI */}
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setStep(3)}>Next: Drag & Drop</button>
        </div>
      )}
      {step === 3 && floorPlanUrl && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 flex flex-col items-center">
          <img src={floorPlanUrl} alt="Floor plan preview" className="max-w-full max-h-96 rounded shadow mb-4" />
          <h3 className="font-bold text-stone-900 mb-2">Drag & Drop Furniture</h3>
          <p className="text-sm text-stone-500 mb-4">Move furniture to your preferred locations within each room.</p>
          {/* TODO: Drag-and-drop UI for furniture placement */}
        </div>
      )}
    </div>
  );
}