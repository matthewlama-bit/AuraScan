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
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnAreas, setDrawnAreas] = useState<any[]>([]);

  function handleUpload(file: File, url: string) {
    setFloorPlanFile(file);
    setFloorPlanUrl(url);
    setStep(1);
  }

  function handleRoomChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedRoom(event.target.value);
  }

  function toggleDrawingMode() {
    setDrawingMode(!drawingMode);
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!drawingMode || !selectedRoom) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setDrawnAreas([...drawnAreas, { room: selectedRoom, x, y }]);
  }

  // Stepper UI
  function Stepper() {
    return (
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 mb-6 flex flex-col items-center">
        <h2 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-4">Unpack Workflow</h2>
        <div className="flex items-center justify-center gap-4">
          {steps.map((label, idx) => (
            <div key={idx} className="flex items-center">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-base ${step === idx ? 'bg-blue-500 text-white' : 'bg-stone-200 text-stone-500'} border-2 ${step === idx ? 'border-blue-500' : 'border-stone-200'}`}>{idx + 1}</div>
              <div className={`ml-2 text-sm font-black uppercase tracking-wider ${step === idx ? 'text-blue-700' : 'text-stone-500'}`}>{label}</div>
              {idx < steps.length - 1 && <div className="mx-2 w-8 h-1 bg-stone-300 rounded" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Stepper />
      {step === 0 && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
          <FloorPlanUpload onUpload={handleUpload} />
        </div>
      )}
      {step === 1 && floorPlanUrl && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 flex flex-col items-center">
          <img src={floorPlanUrl} alt="Floor plan preview" className="max-w-full max-h-96 rounded shadow mb-4" />
          <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">Define Rooms</h3>
          <p className="text-sm text-stone-500 mb-4">Select a room from the survey, then draw its area on the floor plan.</p>
          <div className="flex flex-col items-center">
            <label htmlFor="room-select" className="text-sm font-bold text-stone-700 mb-2">Select Room:</label>
            <select id="room-select" value={selectedRoom} onChange={handleRoomChange} className="border border-stone-300 rounded px-4 py-2 mb-4">
              <option value="">-- Select Room --</option>
              <option value="living-room">Living Room</option>
              <option value="kitchen">Kitchen</option>
              <option value="bedroom">Bedroom</option>
            </select>
            {selectedRoom && <p className="text-sm text-stone-700">Selected Room: {selectedRoom}</p>}
          </div>
          <div
            className="relative w-full h-96 bg-stone-100 border border-stone-300 rounded"
            onClick={handleCanvasClick}
          >
            {drawnAreas.map((area, index) => (
              <div
                key={index}
                className="absolute w-4 h-4 bg-blue-500 rounded-full"
                style={{ left: area.x, top: area.y }}
              />
            ))}
          </div>
          <button
            className={`mt-4 px-4 py-2 ${drawingMode ? 'bg-red-500' : 'bg-blue-500'} text-white rounded-xl font-bold shadow`}
            onClick={toggleDrawingMode}
          >
            {drawingMode ? 'Stop Drawing' : 'Start Drawing'}
          </button>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold shadow"
            onClick={() => setStep(2)}
          >
            Next: AI Mapping
          </button>
        </div>
      )}
      {step === 2 && floorPlanUrl && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 flex flex-col items-center">
          <img src={floorPlanUrl} alt="Floor plan preview" className="max-w-full max-h-96 rounded shadow mb-4" />
          <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">AI Furniture Mapping</h3>
          <p className="text-sm text-stone-500 mb-4">Furniture from the survey will be mapped to rooms automatically.</p>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold shadow" onClick={() => setStep(3)}>Next: Drag & Drop</button>
        </div>
      )}
      {step === 3 && floorPlanUrl && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 flex flex-col items-center">
          <img src={floorPlanUrl} alt="Floor plan preview" className="max-w-full max-h-96 rounded shadow mb-4" />
          <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">Drag & Drop Furniture</h3>
          <p className="text-sm text-stone-500 mb-4">Move furniture to your preferred locations within each room.</p>
        </div>
      )}
    </div>
  );
}