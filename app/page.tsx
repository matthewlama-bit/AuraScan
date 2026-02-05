'use client'

import { useState } from 'react';
import { Plus, Camera, Trash2, Box, Home as HomeIcon } from 'lucide-react';

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
  // --- STATE ---
  const [rooms, setRooms] = useState<Room[]>([
    { id: "1", name: "Living Room", image: null, targetImage: null, inventory: [] }
  ]);
  const [activeRoomId, setActiveRoomId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"survey" | "unpack">("survey");

  // --- HELPERS ---
  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  const updateActiveRoom = (updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, ...updates } : r));
  };

  const updateQuantity = (roomId: string, itemIndex: number, delta: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const newInventory = [...r.inventory];
      const currentQty = newInventory[itemIndex].quantity;
      newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: Math.max(0, currentQty + delta) };
      return { ...r, inventory: newInventory };
    }));
  };

  // --- FILE PROCESSING (Optimized for Mobile) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = async () => {
        // Create a canvas to compress the image
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 0.7 quality ensures we stay under Vercel's 4.5MB payload limit
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        // Update UI immediately with the photo
        updateActiveRoom({ image: compressedBase64 });

        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: compressedBase64 }),
          });

          if (!response.ok) throw new Error(`Server error: ${response.status}`);

          const data = await response.json();
          if (data.items) {
            // Map incoming items to include a default quantity of 1
            const itemsWithQty = data.items.map((item: any) => ({
              ...item,
              quantity: item.quantity || 1
            }));
            updateActiveRoom({ inventory: itemsWithQty });
          }
        } catch (error: any) {
          console.error("Scan failed:", error);
          alert("Aura encountered an error scanning this photo. Try a smaller file.");
        } finally {
          setLoading(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const calculateRoomVolume = (room: Room) => 
    room.inventory.reduce((sum, item) => sum + (item.volume_per_unit * (item.quantity || 1)), 0);
  
  const totalVolume = rooms.reduce((acc, r) => acc + calculateRoomVolume(r), 0);
  const totalQuote = totalVolume > 0 ? (totalVolume * PRICE_PER_M3) + BASE_SERVICE_FEE : 0;

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col font-sans text-stone-900 overflow-x-hidden">
      {/* HEADER */}
      <header className="p-4 md:p-6 bg-white border-b flex flex-col sm:flex-row justify-between items-center shadow-sm gap-4 sticky top-0 z-50">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-black uppercase tracking-tighter italic">AURA LOGISTICS</h1>
          <div className="flex gap-2 mt-2 justify-center sm:justify-start">
            <button 
              onClick={() => setViewMode('survey')}
              className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${viewMode === 'survey' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}
            >
              Survey
            </button>
            <button 
              onClick={() => setViewMode('unpack')}
              className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${viewMode === 'unpack' ? 'bg-purple-600 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}
            >
              Unpack
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-stone-50 px-4 py-2 rounded-xl border border-stone-100 w-full sm:w-auto justify-center">
          <div className="text-center sm:text-right">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Est. Quote</p>
            <p className="text-xl font-black text-cyan-600">${totalQuote.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* SIDEBAR - Desktop Only */}
        <aside className="hidden lg:flex w-64 bg-stone-50 border-r p-6 flex-col overflow-y-auto shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Rooms</h2>
            <button 
              onClick={() => {
                const newId = Date.now().toString();
                setRooms([...rooms, { id: newId, name: "New Room", image: null, targetImage: null, inventory: [] }]);
                setActiveRoomId(newId);
              }}
              className="p-1 hover:bg-stone-200 rounded-full transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${activeRoomId === room.id ? 'bg-white shadow-sm text-stone-900 ring-1 ring-stone-200' : 'text-stone-400 hover:text-stone-600'}`}
              >
                {room.name}
                <span className="text-[10px] opacity-50">{room.inventory.length}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white/50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* PHOTO BOX */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative w-full aspect-[4/3] md:aspect-video bg-stone-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
                {activeRoom.image ? (
                  <div className="relative w-full h-full">
                    <img src={activeRoom.image} alt="Room" className="w-full h-full object-contain" />
                    
                    {/* DRAWING BOXES */}
                    {activeRoom.inventory.map((item, idx) => item.box_2d && (
                      <div 
                        key={`box-${idx}`}
                        className="absolute border-2 border-purple-500 bg-purple-500/20 rounded-md pointer-events-none"
                        style={{
                          top: `${item.box_2d[0] / 10}%`,
                          left: `${item.box_2d[1] / 10}%`,
                          height: `${(item.box_2d[2] - item.box_2d[0]) / 10}%`,
                          width: `${(item.box_2d[3] - item.box_2d[1]) / 10}%`
                        }}
                      />
                    ))}

                    {/* RE-UPLOAD BUTTON */}
                    <label className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-full shadow-lg cursor-pointer z-20">
                      <Camera size={20} className="text-stone-900" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  </div>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-stone-100 hover:bg-stone-200 transition-colors">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                      <Camera size={48} className="text-stone-300 pointer-events-none" />
                    </div>
                    <p className="text-sm font-black text-stone-500 uppercase tracking-widest">Capture Room to Scan</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}

                {/* LOADING OVERLAY */}
                {loading && (
                  <div className="absolute inset-0 bg-stone-900/80 flex items-center justify-center backdrop-blur-md z-50">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white font-black uppercase tracking-widest text-xs italic">Aura Scanning...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* INVENTORY LIST */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 min-h-[300px]">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Room Inventory</h3>
                <div className="space-y-3">
                  {activeRoom.inventory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-cyan-600 text-xs">
                          {item.item.substring(0, 1)}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-sm">{item.item}</p>
                          <p className="text-[10px] font-black text-stone-400 uppercase">Vol: {item.volume_per_unit} ft³</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button onClick={() => updateQuantity(activeRoom.id, idx, -1)} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs shadow-sm">-</button>
                         <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(activeRoom.id, idx, 1)} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs shadow-sm">+</button>
                      </div>
                    </div>
                  ))}
                  {!loading && activeRoom.inventory.length === 0 && (
                    <div className="text-center py-10">
                      <Box className="mx-auto text-stone-200 mb-2" size={32} />
                      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Inventory Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}