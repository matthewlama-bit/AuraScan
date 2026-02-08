import React, { useState, useRef, useCallback } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Room, InventoryItem } from '../types';

const steps = [
  'Upload Floor Plan',
  'Define Rooms',
  'Assign Furniture',
];

const ROOM_COLORS = [
  { fill: 'rgba(168, 85, 247, 0.18)', stroke: '#a855f7', text: '#7e22ce' },
  { fill: 'rgba(59, 130, 246, 0.18)', stroke: '#3b82f6', text: '#1d4ed8' },
  { fill: 'rgba(16, 185, 129, 0.18)', stroke: '#10b981', text: '#047857' },
  { fill: 'rgba(245, 158, 11, 0.18)', stroke: '#f59e0b', text: '#b45309' },
  { fill: 'rgba(239, 68, 68, 0.18)', stroke: '#ef4444', text: '#b91c1c' },
  { fill: 'rgba(20, 184, 166, 0.18)', stroke: '#14b8a6', text: '#0f766e' },
  { fill: 'rgba(236, 72, 153, 0.18)', stroke: '#ec4899', text: '#be185d' },
  { fill: 'rgba(99, 102, 241, 0.18)', stroke: '#6366f1', text: '#4338ca' },
];

export interface RoomZone {
  roomId: string;
  roomName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colorIndex: number;
}

interface UnpackPanelProps {
  rooms: Room[];
  step: number;
  setStep: (step: number) => void;
  floorPlanUrl: string | null;
  setFloorPlanUrl: (url: string | null) => void;
  roomZones: RoomZone[];
  setRoomZones: React.Dispatch<React.SetStateAction<RoomZone[]>>;
  furnitureAssignment: Record<string, InventoryItem[]>;
  setFurnitureAssignment: (assignment: Record<string, InventoryItem[]>) => void;
}

export default function UnpackPanel({ rooms, step, setStep, floorPlanUrl, setFloorPlanUrl, roomZones, setRoomZones, furnitureAssignment, setFurnitureAssignment }: UnpackPanelProps) {
  // Drawing state (transient, OK to reset on unmount)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativePos = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent) {
    if (!selectedRoomId || roomZones.some(z => z.roomId === selectedRoomId)) return;
    const pos = getRelativePos(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDrawing) return;
    setDrawCurrent(getRelativePos(e));
  }

  function handleMouseUp() {
    if (!isDrawing || !drawStart || !drawCurrent || !selectedRoomId) {
      setIsDrawing(false);
      return;
    }
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);

    if (w > 2 && h > 2) {
      const room = rooms.find(r => r.id === selectedRoomId);
      setRoomZones(prev => [...prev, {
        roomId: selectedRoomId,
        roomName: room?.name || selectedRoomId,
        x, y, width: w, height: h,
        colorIndex: prev.length % ROOM_COLORS.length,
      }]);
      setSelectedRoomId('');
    }
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }

  function removeZone(roomId: string) {
    setRoomZones(prev => prev.filter(z => z.roomId !== roomId));
  }

  function assignFurniture() {
    const assignment: Record<string, InventoryItem[]> = {};
    for (const zone of roomZones) assignment[zone.roomId] = [];

    for (const room of rooms) {
      const zone = roomZones.find(z => z.roomId === room.id);
      if (zone) {
        assignment[zone.roomId] = [...(assignment[zone.roomId] || []), ...room.inventory];
      } else if (roomZones.length > 0) {
        assignment[roomZones[0].roomId] = [...(assignment[roomZones[0].roomId] || []), ...room.inventory];
      }
    }
    setFurnitureAssignment(assignment);
    setStep(2);
  }

  const previewRect = isDrawing && drawStart && drawCurrent ? {
    x: Math.min(drawStart.x, drawCurrent.x),
    y: Math.min(drawStart.y, drawCurrent.y),
    width: Math.abs(drawCurrent.x - drawStart.x),
    height: Math.abs(drawCurrent.y - drawStart.y),
  } : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-stone-100">
        <h2 className="text-center text-lg font-black text-stone-900 uppercase tracking-widest mb-6">Unpack Workflow</h2>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {steps.map((label, idx) => (
            <div key={idx} className="flex items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-sm transition-all ${step === idx ? 'bg-purple-600 text-white shadow-lg' : step > idx ? 'bg-purple-200 text-purple-600' : 'bg-stone-200 text-stone-500'}`}>
                {step > idx ? '✓' : idx + 1}
              </div>
              <div className={`ml-2 text-xs font-black uppercase tracking-wider transition-all ${step === idx ? 'text-purple-600' : 'text-stone-400'}`}>{label}</div>
              {idx < steps.length - 1 && <div className="mx-3 w-8 h-0.5 bg-stone-200 rounded" />}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 0: Upload Floor Plan */}
      {step === 0 && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">Upload Floor Plan</h3>
            <p className="text-sm text-stone-500 mb-6">Upload an image of your target property floor plan.</p>
            <div className="relative w-full aspect-[4/3] md:aspect-video bg-stone-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
              {floorPlanUrl ? (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={floorPlanUrl} alt="Floor plan" className="w-full h-full object-contain" />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
                    <label className="bg-white/90 p-3 rounded-full shadow-lg cursor-pointer">
                      <Camera size={20} className="text-stone-900" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setFloorPlanUrl(URL.createObjectURL(file)); }
                      }} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-stone-100 hover:bg-stone-200 transition-colors">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <Camera size={48} className="text-stone-300 pointer-events-none" />
                  </div>
                  <p className="text-sm font-black text-stone-500 uppercase tracking-widest">Upload Floor Plan Image</p>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setFloorPlanUrl(URL.createObjectURL(file)); }
                  }} />
                </label>
              )}
            </div>
            {floorPlanUrl && (
              <button className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all" onClick={() => setStep(1)}>
                Next: Define Rooms →
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 1: Define Rooms */}
      {step === 1 && floorPlanUrl && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
          <div className="flex flex-col items-center mb-4">
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">Define Rooms</h3>
            <p className="text-sm text-stone-500 mb-4">Select a room from the list, then draw a box on the floor plan to mark its area.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Room list sidebar */}
            <div className="lg:w-64 shrink-0 space-y-3">
              <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Scanned Rooms</div>
              {rooms.map((room) => {
                const zone = roomZones.find(z => z.roomId === room.id);
                const isSelected = selectedRoomId === room.id;
                const color = zone ? ROOM_COLORS[zone.colorIndex] : null;
                return (
                  <button
                    key={room.id}
                    onClick={() => { if (!zone) setSelectedRoomId(room.id); }}
                    disabled={!!zone}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      zone ? 'opacity-80 cursor-default'
                        : isSelected ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-stone-200 bg-stone-50 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer'
                    }`}
                    style={zone ? { borderColor: color!.stroke, backgroundColor: color!.fill } : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-stone-900">{room.name}</div>
                        <div className="text-[10px] text-stone-500">{room.inventory.length} items</div>
                      </div>
                      {zone ? (
                        <button onClick={(e) => { e.stopPropagation(); removeZone(room.id); }} className="p-1 rounded-full hover:bg-red-100 transition-colors">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      ) : isSelected ? (
                        <div className="text-[9px] font-black text-purple-600 uppercase">Draw →</div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
              {selectedRoomId && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 mt-2">
                  <p className="text-[10px] font-black text-purple-600 uppercase">
                    ✎ Draw a rectangle on the floor plan for: {rooms.find(r => r.id === selectedRoomId)?.name}
                  </p>
                </div>
              )}
            </div>

            {/* Floor plan with drawable overlay */}
            <div className="flex-1">
              <div
                ref={containerRef}
                className="relative w-full bg-stone-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl select-none"
                style={{ cursor: selectedRoomId ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={floorPlanUrl} alt="Floor plan" className="w-full h-auto pointer-events-none" draggable={false} />

                {/* Drawn room zones */}
                {roomZones.map((zone) => {
                  const color = ROOM_COLORS[zone.colorIndex];
                  return (
                    <div key={zone.roomId} className="absolute rounded-lg border-2 flex items-center justify-center pointer-events-none" style={{
                      left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%`,
                      backgroundColor: color.fill, borderColor: color.stroke,
                    }}>
                      <span className="text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md" style={{ color: color.text, backgroundColor: 'rgba(255,255,255,0.85)' }}>
                        {zone.roomName}
                      </span>
                    </div>
                  );
                })}

                {/* Live drawing preview */}
                {previewRect && selectedRoomId && (
                  <div className="absolute rounded-lg border-2 border-dashed border-purple-500 bg-purple-500/10 pointer-events-none" style={{
                    left: `${previewRect.x}%`, top: `${previewRect.y}%`, width: `${previewRect.width}%`, height: `${previewRect.height}%`,
                  }} />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <button className="px-5 py-2.5 bg-stone-200 text-stone-700 rounded-full font-black text-xs uppercase tracking-widest hover:bg-stone-300 transition-all" onClick={() => setStep(0)}>
              ← Back
            </button>
            <div className="text-xs text-stone-400 font-bold">{roomZones.length} / {rooms.length} rooms defined</div>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed" onClick={assignFurniture} disabled={roomZones.length === 0}>
              Assign Furniture →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Furniture Assignment */}
      {step === 2 && floorPlanUrl && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
          <div className="flex flex-col items-center mb-6">
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-2">Furniture Assignment</h3>
            <p className="text-sm text-stone-500">Furniture from the survey has been assigned to your designated rooms.</p>
          </div>

          {/* Floor plan with zones and item counts */}
          <div className="relative w-full bg-stone-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={floorPlanUrl} alt="Floor plan" className="w-full h-auto pointer-events-none" draggable={false} />
            {roomZones.map((zone) => {
              const color = ROOM_COLORS[zone.colorIndex];
              const items = furnitureAssignment[zone.roomId] || [];
              const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0);
              return (
                <div key={zone.roomId} className="absolute rounded-lg border-2 flex flex-col items-center justify-center pointer-events-none" style={{
                  left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%`,
                  backgroundColor: color.fill, borderColor: color.stroke,
                }}>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ color: color.text, backgroundColor: 'rgba(255,255,255,0.9)' }}>
                    {zone.roomName} ({itemCount})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Room-by-room inventory list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomZones.map((zone) => {
              const color = ROOM_COLORS[zone.colorIndex];
              const items = furnitureAssignment[zone.roomId] || [];
              return (
                <div key={zone.roomId} className="rounded-xl p-4 border-2" style={{ borderColor: color.stroke, backgroundColor: color.fill }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.stroke }} />
                    <h4 className="text-sm font-black uppercase tracking-wider" style={{ color: color.text }}>{zone.roomName}</h4>
                    <span className="text-[10px] text-stone-500 ml-auto">{items.reduce((s, i) => s + (i.quantity || 1), 0)} items</span>
                  </div>
                  {items.length > 0 ? (
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-center justify-between text-xs bg-white/80 rounded-lg px-3 py-2">
                          <span className="font-bold text-stone-900">{item.item}</span>
                          <span className="text-stone-500">×{item.quantity || 1}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-stone-400 italic">No items assigned</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <button className="px-5 py-2.5 bg-stone-200 text-stone-700 rounded-full font-black text-xs uppercase tracking-widest hover:bg-stone-300 transition-all" onClick={() => setStep(1)}>
              ← Redefine Rooms
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
