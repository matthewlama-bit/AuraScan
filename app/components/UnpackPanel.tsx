import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Room } from '../types';

// Stepper workflow steps
const steps = [
  'Upload Floor Plan',
  'Define Rooms',
  'AI Furniture Mapping',
  'Drag & Drop Furniture',
];

interface UnpackPanelProps {
  rooms: Room[];
}

export default function UnpackPanel({ rooms }: UnpackPanelProps) {
  const [step, setStep] = useState(0);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnAreas, setDrawnAreas] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  function handleUpload(file: File, url: string) {
    setFloorPlanFile(file);
    setFloorPlanUrl(url);
    setStep(1);
  }

  function handleImageLoad() {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Set canvas dimensions to match the image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
  }

  function handleRoomChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedRoom(event.target.value);
  }

  function toggleDrawingMode() {
    setDrawingMode(!drawingMode);
  }

  function handleCanvasMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawingMode || !selectedRoom) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

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
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">Upload Floor Plan</h3>
            <p className="text-sm text-stone-500 mb-6">Upload an image of your floor plan to begin the unpacking process.</p>
            <label className="flex flex-col items-center justify-center w-full aspect-video bg-stone-100 hover:bg-stone-200 transition-colors rounded-[2rem] cursor-pointer border-4 border-dashed border-stone-300">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <Camera size={48} className="text-stone-300 pointer-events-none" />
              </div>
              <p className="text-sm font-black text-stone-500 uppercase tracking-widest">Upload Floor Plan Image</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setFloorPlanFile(file);
                    setFloorPlanUrl(url);
                    setStep(1);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
      {step === 1 && floorPlanUrl && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 flex flex-col items-center">
          <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">Define Rooms</h3>
          <p className="text-sm text-stone-500 mb-4">Select a room from the survey, then draw its area on the floor plan.</p>
          <div className="flex flex-col items-center mb-4">
            <label htmlFor="room-select" className="text-sm font-bold text-stone-700 mb-2">Select Room:</label>
            <select id="room-select" value={selectedRoom} onChange={handleRoomChange} className="border border-stone-300 rounded px-4 py-2 mb-2">
              <option value="">-- Select Room --</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {selectedRoom && <p className="text-sm text-stone-700">Selected Room: {rooms.find(r => r.id === selectedRoom)?.name}</p>}
          </div>
          
          {/* Overlay Container */}
          <div className="relative inline-block mb-4">
            <img
              ref={imageRef}
              src={floorPlanUrl}
              alt="Floor plan preview"
              className="max-w-full max-h-96 rounded shadow"
              onLoad={handleImageLoad}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 rounded cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              style={{ display: drawingMode ? 'block' : 'none' }}
            />
          </div>

          <button
            className={`px-4 py-2 ${drawingMode ? 'bg-red-500' : 'bg-blue-500'} text-white rounded-xl font-bold shadow mb-4`}
            onClick={toggleDrawingMode}
          >
            {drawingMode ? 'Stop Drawing' : 'Start Drawing'}
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold shadow"
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