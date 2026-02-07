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
import LogisticsPanel from './components/LogisticsPanel';
import AggregatedLogisticsPanel from './components/AggregatedLogisticsPanel';
import UnpackPanel from './components/UnpackPanel';

export default function AuraMultiRoom() {
  const [viewMode, setViewMode] = useState<ViewMode | 'unpack'>("survey");
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
      {/* TEMP: Add a button to switch to unpack mode for demo */}
      <div className="flex gap-2 p-2 bg-white border-b border-stone-200">
        <button className={`px-3 py-1 rounded ${viewMode === 'survey' ? 'bg-blue-100' : ''}`} onClick={() => setViewMode('survey')}>Survey</button>
        <button className={`px-3 py-1 rounded ${viewMode === 'logistics' ? 'bg-blue-100' : ''}`} onClick={() => setViewMode('logistics')}>Logistics</button>
        <button className={`px-3 py-1 rounded ${viewMode === 'unpack' ? 'bg-blue-100' : ''}`} onClick={() => setViewMode('unpack')}>Unpack</button>
      </div>
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {viewMode !== 'logistics' && viewMode !== 'unpack' && <Sidebar rooms={rooms} activeRoomId={activeRoomId} setActiveRoomId={setActiveRoomId} addRoom={addRoom} updateActiveRoom={updateActiveRoom} />}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white/50">
          {viewMode === 'logistics' ? (
            <div className="max-w-6xl mx-auto">
              <AggregatedLogisticsPanel rooms={rooms} />
            </div>
          ) : viewMode === 'unpack' ? (
            <UnpackPanel />
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <PhotoBox activeRoom={activeRoom} handleFileUpload={handleFileUpload} loading={loading} hoveredItemIndex={hoveredItemIndex} />
              <InventoryList activeRoom={activeRoom} updateQuantity={updateQuantity} loading={loading} hoveredItemIndex={hoveredItemIndex} setHoveredItemIndex={setHoveredItemIndex} />
              {activeRoom && activeRoom.inventory.length > 0 && <LogisticsPanel activeRoom={activeRoom} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}