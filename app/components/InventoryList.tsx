import { Box } from 'lucide-react';
import { Room } from '../types';

interface InventoryListProps {
  activeRoom: Room;
  updateQuantity: (roomId: string, itemIndex: number, delta: number) => void;
  loading: boolean;
  hoveredItemIndex?: number | null;
  setHoveredItemIndex?: (index: number | null) => void;
}

export default function InventoryList({ activeRoom, updateQuantity, loading, hoveredItemIndex, setHoveredItemIndex }: InventoryListProps) {
  return (
    <div className="lg:col-span-5">
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 min-h-[300px]">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Room Inventory</h3>
        <div className="space-y-3">
          {activeRoom.inventory.map((item, idx) => {
            const sourceCount = Array.isArray(item.box_2d) && Array.isArray(item.box_2d[0]) ? (item.box_2d as any[]).length : (item.box_2d ? 1 : 0);
            const isActive = hoveredItemIndex === idx;
            return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredItemIndex?.(idx)}
              onMouseLeave={() => setHoveredItemIndex?.(null)}
              onClick={() => setHoveredItemIndex?.(hoveredItemIndex === idx ? null : idx)}
              className={`flex items-center justify-between p-4 rounded-2xl border border-stone-200 cursor-pointer ${isActive ? 'ring-2 ring-cyan-200 bg-cyan-50 sm:bg-stone-50' : 'bg-stone-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-cyan-600 text-xs">
                  {item.item.substring(0, 1)}
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">{item.item}</p>
                  <p className="text-[10px] font-black text-stone-400 uppercase">Vol: {item.volume_per_unit} ft³ • Sources: {sourceCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(activeRoom.id, idx, -1)} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs shadow-sm">-</button>
                <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(activeRoom.id, idx, 1)} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs shadow-sm">+</button>
              </div>
              </div>
            );
          })}
          {!loading && activeRoom.inventory.length === 0 && (
            <div className="text-center py-10">
              <Box className="mx-auto text-stone-200 mb-2" size={32} />
              <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Inventory Empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}