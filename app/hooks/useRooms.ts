import { useState } from 'react';
import { Room } from '../types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: "1", name: "Living Room", image: null, targetImage: null, inventory: [] }
  ]);
  const [activeRoomId, setActiveRoomId] = useState("1");

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  const updateActiveRoom = (updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== activeRoomId) return r;
      // If caller provided `images`, append them to existing images array instead of replacing
      const incomingImages = (updates as any).images as string[] | undefined;
      const newImages = incomingImages ? ([...(r.images || []), ...incomingImages]) : r.images;

      // Determine the `image` to display: prefer explicit updates.image, otherwise default to first of images
      const incomingImage = (updates as any).image as string | undefined;
      const newImage = incomingImage ?? (newImages && newImages.length ? newImages[0] : updates.image ?? r.image);

      // Merge other fields normally
      const { images: _imgs, image: _img, ...rest } = updates as any;
      return { ...r, ...rest, images: newImages, image: newImage };
    }));
  };

  const updateQuantity = (roomId: string, itemIndex: number, delta: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const newInventory = [...r.inventory];
      const currentQty = newInventory[itemIndex].quantity;
      newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: Math.max(0, currentQty + delta) };
      return { ...r, inventory: newInventory };
    }));
  };

  const addRoom = () => {
    const newId = Date.now().toString();
    setRooms([...rooms, { id: newId, name: "New Room", image: null, targetImage: null, inventory: [] }]);
    setActiveRoomId(newId);
  };

  return {
    rooms,
    activeRoomId,
    activeRoom,
    setActiveRoomId,
    updateActiveRoom,
    updateQuantity,
    addRoom,
  };
}