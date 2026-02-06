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
        const itemsWithQty = data.items.map((item: { item: string; quantity?: number; volume_per_unit: number; box_2d?: number[] }) => ({
          ...item,
          quantity: item.quantity || 1
        }));
        updateActiveRoom({ inventory: itemsWithQty });
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