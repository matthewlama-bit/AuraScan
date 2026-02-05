"use client";
import { useState } from "react";

// --- CONFIGURATION ---
const PRICE_PER_M3 = 185;
const BASE_SERVICE_FEE = 250;

interface InventoryItem {
  item: string;
  quantity: number;
  volume_per_unit: number;
  box_2d?: number[]; 
  target_box_2d?: number[]; 
}

interface Room {
  id: string;
  name: string;
  image: string | null;       
  targetImage: string | null; 
  inventory: InventoryItem[];
}

export default function AuraMultiRoom() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: "1", name: "Living Room", image: null, targetImage: null, inventory: [] }
  ]);
  const [activeRoomId, setActiveRoomId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"survey" | "unpack">("survey");
  const [selectedItemToPlace, setSelectedItemToPlace] = useState<number | null>(null);

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  const updateActiveRoom = (updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, ...updates } : r));
  };

  // --- CORE LOGIC: Quantity Toggles ---
  const updateQuantity = (roomId: string, itemIndex: number, delta: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const newInventory = [...r.inventory];
      newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: Math.max(0, newInventory[itemIndex].quantity + delta) };
      return { ...r, inventory: newInventory };
    }));
  };

  // --- CORE LOGIC: Sidebar Management ---
  const removeRoom = (id: string) => {
    if (rooms.length <= 1) {
      startOver();
      return;
    }
    const newRooms = rooms.filter(r => r.id !== id);
    setRooms(newRooms);
    if (activeRoomId === id) setActiveRoomId(newRooms[0].id);
  };

  const startOver = () => {
    if (confirm("Reset everything? This wipes all rooms, photos, and inventory data.")) {
      const initialId = Date.now().toString();
      setRooms([{ id: initialId, name: "Living Room", image: null, targetImage: null, inventory: [] }]);
      setActiveRoomId(initialId);
      setViewMode("survey");
    }
  };

  const resetRoomUnpack = () => {
    if (confirm(`Clear all placements for ${activeRoom.name}? Inventory items will be kept.`)) {
      setRooms(prev => prev.map(r => {
        if (r.id !== activeRoomId) return r;
        return {
          ...r,
          inventory: r.inventory.map(item => ({ ...item, target_box_2d: undefined }))
        };
      }));
      setSelectedItemToPlace(null);
    }
  };

  // --- CORE LOGIC: File Processing ---
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, type: "survey" | "target") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      if (type === "target") { 
        updateActiveRoom({ targetImage: base64 }); 
        return; 
      }
      updateActiveRoom({ image: base64, inventory: [] });
      setLoading(true);
      try {
        const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
        const data = await res.json();
        updateActiveRoom({ 
          inventory: (data.items || []).map((it: any) => ({ ...it, quantity: Number(it.quantity) || 1, volume_per_unit: Number(it.volume_per_unit) || 0.5 })), 
          image: base64 
        });
      } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handlePlacementClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== "unpack" || selectedItemToPlace === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;

    setRooms(prev => prev.map(r => {
      if (r.id !== activeRoomId) return r;
      const newInv = [...r.inventory];
      newInv[selectedItemToPlace] = { ...newInv[selectedItemToPlace], target_box_2d: [y - 30, x - 40, y + 30, x + 40] };
      return { ...r, inventory: newInv };
    }));
    setSelectedItemToPlace(null);
  };

  const calculateRoomVolume = (room: Room) => room.inventory.reduce((sum, item) => sum + (item.volume_per_unit * item.quantity), 0);
  const totalVolume = rooms.reduce((acc, r) => acc + calculateRoomVolume(r), 0);
  const totalQuote = totalVolume > 0 ? (totalVolume * PRICE_PER_M3) + BASE_SERVICE_FEE : 0;

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col font-sans text-stone-900">
      <header className="p-6 bg-white border-b flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter">AURA LOGISTICS</h1>
          <div className="flex gap-3 mt-1">
            <button onClick={() => setViewMode("survey")} className={`text-[10px] font-black uppercase tracking-widest ${viewMode === "survey" ? "text-cyan-600 underline underline-offset-4" : "text-stone-300 hover:text-stone-400"}`}>1. Survey</button>
            <button onClick={() => setViewMode("unpack")} className={`text-[10px] font-black uppercase tracking-widest ${viewMode === "unpack" ? "text-purple-600 underline underline-offset-4" : "text-stone-300 hover:text-stone-400"}`}>2. Unpack</button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-stone-400 uppercase">Est. Total Quote</p>
          <p className="text-2xl font-black text-cyan-600">${totalQuote.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-stone-50 border-r p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 text-stone-400 px-2">Property Layout</h3>
            {rooms.map(room => (
              <div key={room.id} className="relative group">
                <button 
                  onClick={() => setActiveRoomId(room.id)} 
                  className={`w-full p-4 text-left rounded-lg transition-all border ${activeRoomId === room.id ? "bg-stone-900 text-white shadow-lg border-stone-900" : "bg-white border-stone-200 hover:bg-stone-100"}`}
                >
                  <p className="text-[10px] font-bold uppercase pr-6">{room.name}</p>
                  <p className="text-[9px] opacity-60 font-mono">{calculateRoomVolume(room).toFixed(2)} m³</p>
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeRoom(room.id); }} className="absolute top-4 right-3 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}
            <button onClick={() => { const id = Date.now().toString(); setRooms([...rooms, { id, name: `Room ${rooms.length + 1}`, image: null, targetImage: null, inventory: [] }]); setActiveRoomId(id); }} className="w-full mt-4 border-2 border-dashed p-4 text-[10px] font-bold text-stone-400 hover:border-cyan-500 hover:text-cyan-500 uppercase transition-all">+ Add Room</button>
          </div>

          <div className="mt-8 pt-4 border-t border-stone-200">
            <button onClick={startOver} className="w-full p-3 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">⚠ Start Over</button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto grid grid-cols-12 gap-8">
          <div className="col-span-12 xl:col-span-7">
            <div onClick={handlePlacementClick} className={`relative bg-black rounded-xl overflow-hidden border-4 border-white shadow-2xl min-h-[550px] flex items-center justify-center ${viewMode === "unpack" && selectedItemToPlace !== null ? "cursor-crosshair ring-4 ring-purple-500 ring-inset" : ""}`}>
              {((viewMode === "survey" && !activeRoom.image) || (viewMode === "unpack" && !activeRoom.targetImage)) ? (
                <label className="cursor-pointer text-center p-20 w-full group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold tracking-widest block">Upload {viewMode === "survey" ? "Survey" : "Unpack"} Photo</span>
                  <input type="file" hidden onChange={(e) => handleFile(e, viewMode === "survey" ? "survey" : "target")} accept="image/*" />
                </label>
              ) : (
                <div className="relative inline-flex leading-[0]">
                  <img src={viewMode === "survey" ? activeRoom.image! : activeRoom.targetImage!} className={`max-w-full h-auto block transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`} />
                  {activeRoom.inventory.map((item, i) => {
                    const box = viewMode === "survey" ? item.box_2d : item.target_box_2d;
                    if (!box || item.quantity === 0) return null;
                    const color = viewMode === "survey" ? "#00f2ff" : "#a855f7";
                    return (
                      <div key={i} style={{
                        position: 'absolute', top: `${box[0] / 10}%`, left: `${box[1] / 10}%`,
                        width: `${(box[3] - box[1]) / 10}%`, height: `${(box[2] - box[0]) / 10}%`,
                        border: `2px ${viewMode === "unpack" ? 'dashed' : 'solid'} ${color}`,
                        backgroundColor: `${color}1A`, zIndex: 10, pointerEvents: 'none'
                      }}>
                        <span className="absolute -top-5 left-0 text-black text-[8px] font-black px-1 uppercase whitespace-nowrap shadow-sm" style={{ backgroundColor: color }}>{item.item}</span>
                      </div>
                    );
                  })}
                  {loading && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"><div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5 space-y-4">
            <div className="bg-white p-6 border border-stone-200 shadow-sm rounded-lg">
              <input className="text-xl font-black uppercase tracking-tighter border-b w-full mb-6 focus:outline-none focus:border-cyan-400 pb-2 bg-transparent" value={activeRoom.name} onChange={(e) => updateActiveRoom({ name: e.target.value })} />
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                {activeRoom.inventory.map((item, i) => (
                  <div key={i} onClick={() => viewMode === "unpack" && setSelectedItemToPlace(i)} className={`flex justify-between items-center group pb-2 border-b border-stone-50 transition-all ${viewMode === "unpack" ? "cursor-pointer hover:bg-purple-50 p-2 rounded" : ""} ${selectedItemToPlace === i ? "bg-purple-100 border-purple-300" : ""}`}>
                    <div>
                      <p className="text-[11px] font-black uppercase text-stone-800">{item.item}</p>
                      <p className="text-[9px] text-stone-400 font-mono">{viewMode === "survey" ? `${(item.volume_per_unit * item.quantity).toFixed(2)} m³` : (item.target_box_2d ? "POSITION SET ✓" : "TAP TO PLACE")}</p>
                    </div>
                    {viewMode === "survey" ? (
                      <div className="flex items-center bg-stone-100 rounded-full border border-stone-200 overflow-hidden">
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(activeRoom.id, i, -1); }} className="px-3 py-1 hover:bg-red-500 hover:text-white transition-colors text-[10px] font-bold">—</button>
                        <span className="px-2 text-[11px] font-mono font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(activeRoom.id, i, 1); }} className="px-3 py-1 hover:bg-cyan-500 hover:text-white transition-colors text-[10px] font-bold">+</button>
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${item.target_box_2d ? "bg-purple-600 border-purple-600 text-white" : "border-stone-200 text-stone-300"}`}><span className="text-[8px] font-black">{item.target_box_2d ? "✓" : "P"}</span></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border-l-4 shadow-md transition-all ${viewMode === "survey" ? "bg-stone-900 border-cyan-400 text-white" : "bg-purple-900 border-purple-400 text-white"}`}>
               <div className="flex justify-between items-start mb-1">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{viewMode === "survey" ? "Surveying Origin" : "Unpacking Target"}</p>
                 {viewMode === "unpack" && <button onClick={resetRoomUnpack} className="text-[8px] font-black bg-purple-800 hover:bg-red-600 px-2 py-1 rounded transition-colors border border-purple-400/30 uppercase tracking-tighter">Clear Layout</button>}
               </div>
               <p className="text-[10px] italic">{viewMode === "survey" ? "Refine inventory volumes for quoting." : "Select an item and mark its new destination on the photo."}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}