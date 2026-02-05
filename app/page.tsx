'use client' // <--- 1. Flag first!

import { useState, useEffect } from 'react'; // <--- 2. React imports
import { Plus, Camera, Trash2, Box, Home as HomeIcon } from 'lucide-react'; // <--- 3. Icons

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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setLoading(true); // Start the loading spinner/status

  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64Image = event.target?.result as string;

    // 1. Update the UI immediately so the user sees their photo
    updateActiveRoom({ image: base64Image });

    try {
      // 2. Call the AI API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();

      if (data.items) {
        // 3. Update the room with the AI's findings
        updateActiveRoom({ inventory: data.items });
      }
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Scan timed out or failed. Please try a smaller photo.");
    } finally {
      setLoading(false); // Stop the loading status
    }
  };
    reader.readAsDataURL(file);
  }; // <-- Add this closing brace to end handleFileUpload
  
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
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Status</p>
          <p className="text-xl font-black text-cyan-600">{loading ? 'SCANNING...' : 'READY'}</p>
        </div>
      </div>
    </header>

    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-stone-50 border-r p-6 flex-col overflow-y-auto shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Rooms</h2>
          <button onClick={() => setRooms([...rooms, { id: Date.now().toString(), name: "New Room", image: null, targetImage: null, inventory: [] }])} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* PHOTO BOX */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative w-full aspect-[4/3] md:aspect-video bg-stone-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl group">
              {activeRoom.image ? (
                <div className="relative w-full h-full">
                  <img src={activeRoom.image} alt="Room View" className="w-full h-full object-cover" />
                  {activeRoom.inventory.map((item, idx) => item.box_2d && (
                    <div 
                      key={idx}
                      className="absolute border-2 border-purple-500 bg-purple-500/20 rounded-md"
                      style={{
                        top: `${item.box_2d[0] / 10}%`,
                        left: `${item.box_2d[1] / 10}%`,
                        height: `${(item.box_2d[2] - item.box_2d[0]) / 10}%`,
                        width: `${(item.box_2d[3] - item.box_2d[1]) / 10}%`
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Camera size={48} className="text-stone-300 mb-4" />
                  <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Capture Room to Start Survey</p>
                  {/* You'll need to link your file upload handler here */}
                </div>
              )}
            </div>
          </div>

          {/* INVENTORY LIST */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Inventory</h3>
              <div className="space-y-3">
                {activeRoom.inventory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-transparent hover:border-cyan-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-cyan-600 text-xs">
                        {item.item.substring(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{item.item}</p>
                        <p className="text-[10px] font-black text-stone-400 uppercase">Qty: {item.quantity} | Vol: {item.volume_per_unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {activeRoom.inventory.length === 0 && (
                  <p className="text-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest">No items scanned yet</p>
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