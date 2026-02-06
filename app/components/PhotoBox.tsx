import { Camera } from 'lucide-react';
import { Room } from '../types';

interface PhotoBoxProps {
  activeRoom: Room;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export default function PhotoBox({ activeRoom, handleFileUpload, loading }: PhotoBoxProps) {
  return (
    <div className="lg:col-span-7 space-y-4">
      <div className="relative w-full aspect-[4/3] md:aspect-video bg-stone-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
        {activeRoom.image ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
  );
}