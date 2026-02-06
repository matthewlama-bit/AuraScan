import { Plus } from 'lucide-react';
import { Room } from '../types';

interface SidebarProps {
  rooms: Room[];
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  addRoom: () => void;
}

export default function Sidebar({ rooms, activeRoomId, setActiveRoomId, addRoom }: SidebarProps) {
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
  );
}