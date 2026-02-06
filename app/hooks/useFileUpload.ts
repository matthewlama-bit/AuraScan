import { useState } from 'react';

import { Room } from '../types';

export function useFileUpload(updateActiveRoom: (updates: Partial<Room>) => void) {
  const [loading, setLoading] = useState(false);

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
    };
    reader.readAsDataURL(file);
  };

  return { handleFileUpload, loading };
}