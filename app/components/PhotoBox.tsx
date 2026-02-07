import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Room } from '../types';

interface PhotoBoxProps {
  activeRoom: Room;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  hoveredItemIndex?: number | null;
}

export default function PhotoBox({ activeRoom, handleFileUpload, loading, hoveredItemIndex }: PhotoBoxProps) {
  const hoveredIndexProp = hoveredItemIndex;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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
              const isActive = hoveredIndexProp === idx;
              
              // When active, show any box from this item (any image); otherwise show only from current image
              const boxesForImage: (number[] | undefined)[] = [];
              if (item.sources && Array.isArray(item.sources)) {
                for (const s of item.sources) {
                  if ((isActive || s.image === selectedIndex) && s.box) {
                    boxesForImage.push(s.box as number[]);
                  }
                }
              }
              if (boxesForImage.length === 0 && item.box_2d) {
                // fallback: render all boxes or the single box
                if (Array.isArray(item.box_2d[0])) boxesForImage.push(...(item.box_2d as number[][]));
                else boxesForImage.push(item.box_2d as number[]);
              }

              return boxesForImage.map((b, bi) => b ? (
                <div key={`box-${idx}-${bi}`} className="absolute">
                  <div
                    className={`absolute rounded-md pointer-events-none transition-all duration-200 ease-in-out ${isActive ? 'border-4 border-cyan-400 bg-cyan-500/30 z-20' : 'border-2 border-purple-500 bg-purple-500/20 opacity-40 z-10'}`}
                    style={{
                      top: `${b[0] / 10}%`,
                      left: `${b[1] / 10}%`,
                      height: `${(b[2] - b[0]) / 10}%`,
                      width: `${(b[3] - b[1]) / 10}%`
                    }}
                  />

                  {isActive && (
                    <div
                      className="absolute px-2 py-1 rounded-md bg-black text-white text-xs pointer-events-none z-30"
                      style={{ top: `${b[0] / 10}%`, left: `${b[1] / 10}%`, transform: 'translateY(-1.25rem)' }}
                    >
                      <div className="font-bold">{item.item}</div>
                      <div className="text-[11px] opacity-80">Vol: {item.volume_per_unit}</div>
                    </div>
                  )}
                </div>
              ) : null);
            })}

            {/* IMAGE TOGGLE + RE-UPLOAD */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
              {images.length > 1 && (
                <div className="flex items-center bg-white/90 p-2 rounded-full shadow-sm gap-2">
                  <div className="relative flex items-center gap-1 overflow-x-auto max-w-[220px]">
                    {images.map((src, i) => (
                      <button
                        key={`thumb-${i}`}
                        onClick={() => setSelectedIndex(i)}
                        onMouseEnter={() => setHoverIndex(i)}
                        onMouseLeave={() => setHoverIndex(null)}
                        onFocus={() => setHoverIndex(i)}
                        onBlur={() => setHoverIndex(null)}
                        className={`w-10 h-10 rounded-md overflow-hidden border-2 ${i === selectedIndex ? 'border-cyan-600 ring-2 ring-cyan-200' : 'border-transparent'} shrink-0`}
                        aria-label={`Select image ${i + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}

                    {hoverIndex !== null && images[hoverIndex] && (
                      <div className="absolute -top-24 right-0 w-40 h-24 rounded-md overflow-hidden shadow-lg z-30 hidden sm:block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={images[hoverIndex]} alt={`preview-${hoverIndex}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center bg-white/0 p-1 rounded">
                    <button onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))} className="p-1" aria-label="Prev image"><ChevronLeft size={16} /></button>
                    <div className="px-2 text-xs font-black">{selectedIndex + 1}/{images.length}</div>
                    <button onClick={() => setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1))} className="p-1" aria-label="Next image"><ChevronRight size={16} /></button>
                  </div>
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