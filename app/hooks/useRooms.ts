import { useState } from 'react';
import { Room } from '../types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: "1", name: "Living Room", image: null, targetImage: null, inventory: [] }
  ]);
  const [activeRoomId, setActiveRoomId] = useState("1");

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  const updateActiveRoom = (updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, ...updates } : r));
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