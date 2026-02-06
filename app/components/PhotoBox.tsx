import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Room } from '../types';

interface PhotoBoxProps {
  activeRoom: Room;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export default function PhotoBox({ activeRoom, handleFileUpload, loading }: PhotoBoxProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeRoom.images]);

  const images = activeRoom.images && activeRoom.images.length > 0 ? activeRoom.images : (activeRoom.image ? [activeRoom.image] : []);
  const displayImage = images[selectedIndex] || null;

  return (
    <div className="lg:col-span-7 space-y-4">
      <div className="relative w-full aspect-[4/3] md:aspect-video bg-stone-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
        {displayImage ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayImage} alt={`Room ${selectedIndex + 1}`} className="w-full h-full object-contain" />

            {/* DRAWING BOXES (show boxes only for selected image when sources are present) */}
            {activeRoom.inventory.map((item, idx) => {
              const boxesForImage: (number[] | undefined)[] = [];
              if (item.sources && Array.isArray(item.sources)) {
                for (const s of item.sources) {
                  if (s.image === selectedIndex && s.box) boxesForImage.push(s.box as number[]);
                }
              }
              if (boxesForImage.length === 0 && item.box_2d) {
                // fallback: render all boxes or the single box
                if (Array.isArray(item.box_2d[0])) boxesForImage.push(...(item.box_2d as number[][]));
                else boxesForImage.push(item.box_2d as number[]);
              }

              return boxesForImage.map((b, bi) => b ? (
                <div
                  key={`box-${idx}-${bi}`}
                  className="absolute border-2 border-purple-500 bg-purple-500/20 rounded-md pointer-events-none"
                  style={{
                    top: `${b[0] / 10}%`,
                    left: `${b[1] / 10}%`,
                    height: `${(b[2] - b[0]) / 10}%`,
                    width: `${(b[3] - b[1]) / 10}%`
                  }}
                />
              ) : null);
            })}

            {/* IMAGE TOGGLE + RE-UPLOAD */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
              {images.length > 1 && (
                <div className="flex items-center bg-white/90 p-1 rounded-full shadow-sm">
                  <button onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))} className="p-1" aria-label="Prev image"><ChevronLeft size={16} /></button>
                  <div className="px-2 text-xs font-black">{selectedIndex + 1}/{images.length}</div>
                  <button onClick={() => setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1))} className="p-1" aria-label="Next image"><ChevronRight size={16} /></button>
                </div>
              )}
              <label className="bg-white/90 p-3 rounded-full shadow-lg cursor-pointer">
                <Camera size={20} className="text-stone-900" />
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-stone-100 hover:bg-stone-200 transition-colors">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <Camera size={48} className="text-stone-300 pointer-events-none" />
            </div>
            <p className="text-sm font-black text-stone-500 uppercase tracking-widest">Capture Room Images to Scan</p>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
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