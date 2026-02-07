import { useState } from 'react';

import { Room } from '../types';

export function useFileUpload(updateActiveRoom: (updates: Partial<Room>) => void, activeRoom?: Room) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);

    const compressedImages: string[] = [];

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024; 
            const scale = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            compressedImages.push(compressedBase64);
            resolve();
          };
        };
        reader.readAsDataURL(file);
      });
    }

    // Update UI with the first image and store all compressed images
    updateActiveRoom({ image: compressedImages[0], images: compressedImages });

    try {
      const imageOffset = activeRoom?.images?.length || 0;
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: compressedImages, imageOffset }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      if (data.items) {
        const incoming = data.items.map((item: any) => ({ ...item, quantity: item.quantity || 1 }));

        // Merge incoming items with existing inventory by normalized item name
        const existing = activeRoom?.inventory || [];
        const map = new Map<string, any>();

        const normalize = (s: string) => (s || '').toString().trim().toLowerCase();

        // Seed map with existing items
        for (const it of existing) {
          const key = normalize(it.item);
          // normalize box_2d to array of boxes
          const boxes: number[][] = [];
          if (it.box_2d) {
            if (Array.isArray(it.box_2d[0])) boxes.push(...(it.box_2d as number[][]));
            else boxes.push(it.box_2d as number[]);
          }
          map.set(key, { ...it, box_2d: boxes, sources: Array.isArray(it.sources) ? [...it.sources] : [] });
        }

        // Merge incoming
        for (const it of incoming) {
          const key = normalize(it.item || it.name || '');
          const incomingBoxes: number[][] = [];
          if (it.box_2d) {
            if (Array.isArray(it.box_2d[0])) incomingBoxes.push(...(it.box_2d as number[][]));
            else incomingBoxes.push(it.box_2d as number[]);
          }
          const incomingSources = Array.isArray(it.sources) ? [...it.sources] : [];

          if (!map.has(key)) {
            map.set(key, { ...it, box_2d: incomingBoxes, sources: incomingSources });
          } else {
            const existingEntry = map.get(key);
            // sum quantities
            existingEntry.quantity = (existingEntry.quantity || 0) + (it.quantity || 0);
            // merge boxes
            existingEntry.box_2d = (existingEntry.box_2d || []).concat(incomingBoxes);
            // merge sources, avoid exact duplicate image+box combos
            const seen = new Set((existingEntry.sources || []).map((s: any) => `${s.image}_${JSON.stringify(s.box||null)}`));
            for (const s of incomingSources) {
              const id = `${s.image}_${JSON.stringify(s.box||null)}`;
              if (!seen.has(id)) {
                existingEntry.sources.push(s);
                seen.add(id);
              }
            }
            map.set(key, existingEntry);
          }
        }

        const merged = Array.from(map.values()).map((it: any) => {
          // if only one box, keep as single array; if multiple, keep as array of boxes
          const boxes = it.box_2d || [];
          return { ...it, box_2d: boxes.length === 1 ? boxes[0] : boxes };
        });

        updateActiveRoom({ inventory: merged });
      }
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Aura encountered an error scanning this photo. Try a smaller file.");
    } finally {
      setLoading(false);
    }
  };

  return { handleFileUpload, loading };
}