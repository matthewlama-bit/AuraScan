'use client'

import { useState } from 'react';
import { ViewMode, Room, InventoryItem } from './types';
import { PRICE_PER_M3, BASE_SERVICE_FEE } from './constants';
import { useRooms } from './hooks/useRooms';
import { useFileUpload } from './hooks/useFileUpload';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PhotoBox from './components/PhotoBox';
import InventoryList from './components/InventoryList';

export default function AuraMultiRoom() {
  const [viewMode, setViewMode] = useState<ViewMode>("survey");
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);

  const {
    rooms,
    activeRoomId,
    activeRoom,
    setActiveRoomId,
    updateActiveRoom,
    updateQuantity,
    addRoom,
  } = useRooms();

  const { handleFileUpload, loading } = useFileUpload(updateActiveRoom, activeRoom);

  const calculateRoomVolume = (room: Room) =>
    room.inventory.reduce((sum: number, item: InventoryItem) => sum + (item.volume_per_unit * (item.quantity || 1)), 0);

  const totalVolume = rooms.reduce((acc, r) => acc + calculateRoomVolume(r), 0);
  const totalQuote = totalVolume > 0 ? (totalVolume * PRICE_PER_M3) + BASE_SERVICE_FEE : 0;

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col font-sans text-stone-900 overflow-x-hidden">
      <Header viewMode={viewMode} setViewMode={setViewMode} totalQuote={totalQuote} />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <Sidebar rooms={rooms} activeRoomId={activeRoomId} setActiveRoomId={setActiveRoomId} addRoom={addRoom} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white/50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <PhotoBox activeRoom={activeRoom} handleFileUpload={handleFileUpload} loading={loading} hoveredItemIndex={hoveredItemIndex} />
            <InventoryList activeRoom={activeRoom} updateQuantity={updateQuantity} loading={loading} hoveredItemIndex={hoveredItemIndex} setHoveredItemIndex={setHoveredItemIndex} />
          </div>
        </main>
      </div>
    </div>
  );
}