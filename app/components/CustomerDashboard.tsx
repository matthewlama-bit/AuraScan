'use client'

import { useState } from 'react';
import { ViewMode, Room, InventoryItem, Job, Bid } from '../types';
import { PRICE_PER_M3, BASE_SERVICE_FEE } from '../constants';
import { useRooms } from '../hooks/useRooms';
import { useFileUpload } from '../hooks/useFileUpload';
import Header from './Header';
import Sidebar from './Sidebar';
import PhotoBox from './PhotoBox';
import InventoryList from './InventoryList';
import LogisticsPanel from './LogisticsPanel';
import AggregatedLogisticsPanel from './AggregatedLogisticsPanel';
import UnpackPanel, { RoomZone } from './UnpackPanel';
import { MOCK_JOBS } from '../data/mockData';
import { MapPin, Calendar, DollarSign, Eye, Send, CheckCircle2, Clock, Gavel, FileText, ArrowRight, Truck, Package, Star, MessageSquare, ChevronDown, ChevronUp, X } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  draft:         'bg-stone-100 text-stone-600',
  published:     'bg-cyan-50 text-cyan-700',
  bidding:       'bg-amber-50 text-amber-700',
  awarded:       'bg-emerald-50 text-emerald-700',
  'in-progress': 'bg-blue-50 text-blue-700',
  completed:     'bg-green-50 text-green-700',
  cancelled:     'bg-red-50 text-red-600',
};

export default function CustomerDashboard() {
  const [activeView, setActiveView] = useState<'my-jobs' | 'new-job' | 'job-detail'>('my-jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);

  /* ── new-job sub-flow (the existing scan → logistics → unpack) ── */
  const [viewMode, setViewMode] = useState<ViewMode>('survey');
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [unpackStep, setUnpackStep] = useState(0);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [roomZones, setRoomZones] = useState<RoomZone[]>([]);
  const [furnitureAssignment, setFurnitureAssignment] = useState<Record<string, InventoryItem[]>>({});
  const { rooms, activeRoomId, activeRoom, setActiveRoomId, updateActiveRoom, updateQuantity, addRoom } = useRooms();
  const { handleFileUpload, loading } = useFileUpload(updateActiveRoom, activeRoom);
  const calculateRoomVolume = (room: Room) =>
    room.inventory.reduce((sum: number, item: InventoryItem) => sum + (item.volume_per_unit * (item.quantity || 1)), 0);
  const totalVolume = rooms.reduce((acc, r) => acc + calculateRoomVolume(r), 0);
  const totalQuote = totalVolume > 0 ? (totalVolume * PRICE_PER_M3) + BASE_SERVICE_FEE : 0;

  // My jobs = the mock data filtered to this customer
  const myJobs = MOCK_JOBS.filter(j => j.customerId === 'cust-001');
  const selectedJob = MOCK_JOBS.find(j => j.id === selectedJobId) ?? null;

  if (activeView === 'job-detail' && selectedJob) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Back button */}
        <button onClick={() => { setActiveView('my-jobs'); setSelectedJobId(null); }} className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 transition-colors">
          ← Back to my jobs
        </button>

        {/* Job header */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[selectedJob.status]}`}>{selectedJob.status}</span>
                <span className="text-[10px] text-stone-400 font-mono">{selectedJob.id}</span>
              </div>
              <h2 className="text-xl font-black text-stone-800">{selectedJob.title}</h2>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Guide Price</p>
              <p className="text-2xl font-black text-cyan-600">${selectedJob.estimatedQuote.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-stone-400" />
              <div>
                <p className="text-[9px] text-stone-400 font-bold uppercase">From</p>
                <p className="text-xs font-semibold text-stone-700">{selectedJob.fromAddress.city}, {selectedJob.fromAddress.state}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-cyan-500" />
              <div>
                <p className="text-[9px] text-stone-400 font-bold uppercase">To</p>
                <p className="text-xs font-semibold text-stone-700">{selectedJob.toAddress.city}, {selectedJob.toAddress.state}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-stone-400" />
              <div>
                <p className="text-[9px] text-stone-400 font-bold uppercase">Date</p>
                <p className="text-xs font-semibold text-stone-700">{selectedJob.preferredDate || 'TBD'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-stone-400" />
              <div>
                <p className="text-[9px] text-stone-400 font-bold uppercase">Volume</p>
                <p className="text-xs font-semibold text-stone-700">{selectedJob.totalVolumeM3} m³ · {selectedJob.vehiclesRequired} vehicle{selectedJob.vehiclesRequired !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bids section */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h3 className="text-sm font-black text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Gavel size={16} className="text-amber-500" />
            Bids Received ({selectedJob.bids.length})
          </h3>

          {selectedJob.bids.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold">No bids yet</p>
              <p className="text-xs mt-1">Removalists are reviewing your job — bids usually arrive within 24 hours.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedJob.bids.map((bid: Bid) => {
                const expanded = expandedBidId === bid.id;
                return (
                  <div key={bid.id} className={`border rounded-xl p-4 transition-all ${bid.status === 'accepted' ? 'border-emerald-300 bg-emerald-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedBidId(expanded ? null : bid.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600">
                          {bid.companyName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-800">{bid.companyName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-stone-400">{bid.crewSize} crew · {bid.estimatedHours}h</span>
                            {bid.insuranceIncluded && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">INSURED</span>}
                            {bid.packingIncluded && <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">PACKING</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-black text-stone-800">${bid.amount.toLocaleString()}</p>
                          {bid.status === 'accepted' && <span className="text-[9px] font-bold text-emerald-600">✓ Accepted</span>}
                          {bid.status === 'declined' && <span className="text-[9px] font-bold text-red-400">Declined</span>}
                        </div>
                        {expanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex items-start gap-2 mb-4">
                          <MessageSquare size={14} className="text-stone-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-stone-600 italic">&ldquo;{bid.message}&rdquo;</p>
                        </div>
                        {bid.status === 'pending' && (
                          <div className="flex gap-2">
                            <button className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1">
                              <CheckCircle2 size={14} /> Accept Bid
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-stone-100 text-stone-500 text-xs font-bold hover:bg-stone-200 transition-colors">
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'new-job') {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Sub-nav for the new-job flow */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('my-jobs')} className="text-sm text-stone-400 hover:text-stone-700">← Back</button>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex gap-1">
              {(['survey', 'logistics', 'unpack'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${viewMode === v ? (v === 'survey' ? 'bg-stone-900 text-white' : v === 'logistics' ? 'bg-cyan-600 text-white' : 'bg-purple-600 text-white') : 'bg-stone-100 text-stone-400'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Est. Quote</p>
              <p className="text-lg font-black text-cyan-600">${totalQuote.toLocaleString()}</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-40" disabled={totalVolume === 0}>
              <Send size={14} /> Publish Job
            </button>
          </div>
        </div>

        {/* Existing scan flow */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {viewMode === 'survey' && <Sidebar rooms={rooms} activeRoomId={activeRoomId} setActiveRoomId={setActiveRoomId} addRoom={addRoom} updateActiveRoom={updateActiveRoom} />}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white/50">
            {viewMode === 'logistics' ? (
              <div className="max-w-6xl mx-auto"><AggregatedLogisticsPanel rooms={rooms} /></div>
            ) : viewMode === 'unpack' ? (
              <UnpackPanel rooms={rooms} step={unpackStep} setStep={setUnpackStep} floorPlanUrl={floorPlanUrl} setFloorPlanUrl={setFloorPlanUrl} roomZones={roomZones} setRoomZones={setRoomZones} furnitureAssignment={furnitureAssignment} setFurnitureAssignment={setFurnitureAssignment} />
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

  /* ── My Jobs list (default) ─────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">My Moves</h2>
          <p className="text-sm text-stone-400 mt-1">Track your moving jobs and review bids</p>
        </div>
        <button
          onClick={() => setActiveView('new-job')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-200 hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Package size={16} /> New Move
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Jobs', value: myJobs.filter(j => !['completed','cancelled','draft'].includes(j.status)).length, color: 'text-cyan-600' },
          { label: 'Bids Received', value: myJobs.reduce((s, j) => s + j.bids.length, 0), color: 'text-amber-600' },
          { label: 'Completed', value: myJobs.filter(j => j.status === 'completed').length, color: 'text-emerald-600' },
          { label: 'Drafts', value: myJobs.filter(j => j.status === 'draft').length, color: 'text-stone-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-black ${s.color}">{s.value}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="space-y-3">
        {myJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
            <FileText size={40} className="mx-auto mb-3 text-stone-300" />
            <p className="text-stone-500 font-semibold">No jobs yet</p>
            <p className="text-xs text-stone-400 mt-1">Start a new move to scan your rooms and get quotes</p>
          </div>
        ) : (
          myJobs.map(job => (
            <div
              key={job.id}
              onClick={() => { setSelectedJobId(job.id); setActiveView('job-detail'); }}
              className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800 group-hover:text-cyan-700 transition-colors">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[job.status]}`}>{job.status}</span>
                      <span className="text-[10px] text-stone-400">{job.totalVolumeM3} m³</span>
                      <span className="text-[10px] text-stone-400">{job.vehiclesRequired} truck{job.vehiclesRequired !== 1 ? 's' : ''}</span>
                      {job.bids.length > 0 && <span className="text-[10px] text-amber-600 font-semibold">{job.bids.length} bid{job.bids.length !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-black text-stone-700">${job.estimatedQuote.toLocaleString()}</p>
                    <p className="text-[9px] text-stone-400">{job.preferredDate || 'No date'}</p>
                  </div>
                  <ArrowRight size={16} className="text-stone-300 group-hover:text-cyan-500 transition-colors" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
