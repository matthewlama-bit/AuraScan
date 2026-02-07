import { Plus, Check, Edit2, X } from 'lucide-react';
import { useState } from 'react';
import { Room } from '../types';

interface SidebarProps {
  rooms: Room[];
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  addRoom: () => void;
  updateActiveRoom?: (updates: Partial<Room>) => void;
}

export default function Sidebar({ rooms, activeRoomId, setActiveRoomId, addRoom, updateActiveRoom }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const startEdit = (room: Room) => {
    setEditingId(room.id);
    setDraftName(room.name);
  };

  const saveEdit = (room: Room) => {
    if (!updateActiveRoom) return;
    updateActiveRoom({ name: draftName });
    setEditingId(null);
  };

  return (
    <aside className="hidden lg:flex w-64 bg-stone-50 border-r p-6 flex-col overflow-y-auto shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Rooms</h2>
        <button
          onClick={addRoom}
          className="p-1 hover:bg-stone-200 rounded-full transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-1">
        {rooms.map(room => {
          const isActive = activeRoomId === room.id;
          const auto = room.autoName;

          return (
            <div key={room.id} className={`w-full text-left px-0 py-0`}>
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-white shadow-sm text-stone-900 ring-1 ring-stone-200' : 'text-stone-400 hover:text-stone-600'}`}>
                <div className="flex items-center gap-2 w-full">
                  {editingId === room.id ? (
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm font-bold"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit(room);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                    />
                  ) : (
                    <button onClick={() => setActiveRoomId(room.id)} className="text-left w-full">
                      <div className="flex items-center gap-2">
                        <span>{room.name}</span>
                        {auto && <span className="ml-2 text-[10px] px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full font-black">auto</span>}
                      </div>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] opacity-50">{room.inventory.length}</span>
                  {auto && editingId !== room.id && (
                    <button onClick={() => {
                      if (updateActiveRoom) {
                        updateActiveRoom({ name: room.name });
                      }
                    }} className="p-1 hover:bg-stone-100 rounded">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => startEdit(room)} className="p-1 hover:bg-stone-100 rounded">
                    <Edit2 size={14} />
                  </button>
                  {editingId === room.id && (
                    <>
                      <button onClick={() => saveEdit(room)} className="p-1 hover:bg-stone-100 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => { setEditingId(null); setDraftName(''); }} className="p-1 hover:bg-stone-100 rounded">
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}