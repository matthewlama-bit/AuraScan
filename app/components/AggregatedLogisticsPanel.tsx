import { Truck, Package, MapPin, AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { Room } from '../types';
import { recommendVehiclesSummary, estimateMassKg, aggregateInventories, planLoadOut, inferCareLevel, CareLevel } from '../utils/logistics';

// Distinct colors for items so each is visually distinguishable in the van
const ITEM_COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171',
  '#2dd4bf', '#f472b6', '#818cf8', '#fb923c', '#a3e635',
  '#e879f9', '#38bdf8', '#4ade80', '#facc15', '#fb7185',
  '#22d3ee', '#c084fc', '#fdba74', '#86efac', '#fca5a5',
];

const CARE_STYLES: Record<CareLevel, { label: string; border: string; dash: string; badge: string; badgeText: string; icon: string }> = {
  'fragile':    { label: 'Fragile',     border: '#ef4444', dash: '6,3', badge: 'bg-red-100 text-red-700 border-red-300', badgeText: 'FRAGILE', icon: '⚠' },
  'careful':    { label: 'Handle with care', border: '#f59e0b', dash: '4,4', badge: 'bg-amber-100 text-amber-700 border-amber-300', badgeText: 'CAREFUL', icon: '!' },
  'standard':   { label: 'Standard',    border: '', dash: '', badge: '', badgeText: '', icon: '' },
  'heavy-duty': { label: 'Heavy duty',  border: '#3b82f6', dash: '', badge: 'bg-blue-100 text-blue-700 border-blue-300', badgeText: 'HEAVY', icon: '▼' },
};

interface AggregatedLogisticsPanelProps {
  rooms: Room[];
}

export default function AggregatedLogisticsPanel({ rooms }: AggregatedLogisticsPanelProps) {
  const roomInventories = rooms.map(r => r.inventory || []);
  const aggregated = aggregateInventories(roomInventories);

  if (!aggregated || aggregated.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
          <h2 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-4">Complete Logistics Plan</h2>
          <p className="text-sm text-stone-500">Add inventory to rooms to see the aggregated logistics plan</p>
        </div>
      </div>
    );
  }

  const { vehicles, summary } = recommendVehiclesSummary(aggregated);
  const loadOutPlan = planLoadOut(aggregated);

  const totalItems = aggregated.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const totalMassKg = aggregated.reduce((sum, it) => sum + estimateMassKg(it) * (it.quantity || 1), 0);
  const totalVolumeM3 = aggregated.reduce((sum, it) => sum + (it.volume_per_unit || 0) * 0.0283168 * (it.quantity || 1), 0);

  return (
    <div className="w-full space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
        <h2 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-6">Complete Logistics Plan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="text-[9px] font-black text-stone-400 uppercase mb-2">Rooms</div>
            <div className="text-2xl font-black text-stone-900">{rooms.length}</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="text-[9px] font-black text-stone-400 uppercase mb-2">Total Items</div>
            <div className="text-2xl font-black text-stone-900">{totalItems}</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="text-[9px] font-black text-stone-400 uppercase mb-2">Total Volume</div>
            <div className="text-2xl font-black text-stone-900">{totalVolumeM3.toFixed(1)}</div>
            <div className="text-[9px] text-stone-500">m³</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="text-[9px] font-black text-stone-400 uppercase mb-2">Total Weight</div>
            <div className="text-2xl font-black text-stone-900">{totalMassKg.toFixed(0)}</div>
            <div className="text-[9px] text-stone-500">kg</div>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
            <div className="text-[9px] font-black text-cyan-600 uppercase mb-2">Vehicles</div>
            <div className="text-2xl font-black text-cyan-600">{loadOutPlan.length}</div>
            <div className="text-[9px] text-cyan-500">required</div>
          </div>
        </div>
      </div>

      {/* Vehicle Load-Out Plans */}
      {loadOutPlan.map((vehicle, vIdx) => {
        const usedVolume = vehicle.loadOrder.reduce((s: number, it: any) => s + it.volumeM3, 0);
        const usedMass = vehicle.loadOrder.reduce((s: number, it: any) => s + it.massKg, 0);
        const fillPct = Math.min(100, (usedVolume / vehicle.type.maxVolumeM3) * 100);

        // SVG dimensions — we render a top-down view of the cargo area
        const svgW = 400;
        const svgH = (vehicle.cargoLength / vehicle.cargoWidth) * svgW;
        const scale = svgW / vehicle.cargoWidth;

        return (
          <div key={vIdx} className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
            {/* Vehicle header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200">
                  <Truck size={24} className="text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 uppercase tracking-widest">{vehicle.type.name} #{vIdx + 1}</h3>
                  <p className="text-[10px] text-stone-500">{vehicle.loadOrder.length} items · {usedVolume.toFixed(1)} m³ · {usedMass.toFixed(0)} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[9px] font-black text-stone-400 uppercase">Capacity Used</div>
                  <div className="text-lg font-black text-cyan-600">{fillPct.toFixed(0)}%</div>
                </div>
                <div className="w-24 h-3 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, backgroundColor: fillPct > 85 ? '#ef4444' : fillPct > 60 ? '#f59e0b' : '#10b981' }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Van visualization */}
              <div className="flex-1 flex justify-center">
                <div className="relative">
                  {/* Van shape label */}
                  <div className="text-center mb-2">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Top-Down Loading View</span>
                  </div>
                  <svg width={svgW + 40} height={svgH + 80} className="drop-shadow-lg">
                    {/* Van body outline */}
                    {/* Cab (front of van) */}
                    <rect x={10} y={0} width={svgW + 20} height={40} rx={16} fill="#94a3b8" stroke="#64748b" strokeWidth={2} />
                    <text x={svgW / 2 + 20} y={25} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">CAB</text>

                    {/* Cargo area */}
                    <rect x={10} y={36} width={svgW + 20} height={svgH + 8} rx={4} fill="#e2e8f0" stroke="#64748b" strokeWidth={2} />

                    {/* Inner cargo floor */}
                    <rect x={20} y={40} width={svgW} height={svgH} rx={2} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1} />

                    {/* Grid lines for reference */}
                    {Array.from({ length: Math.floor(vehicle.cargoWidth) }, (_, i) => (
                      <line key={`vl-${i}`} x1={20 + (i + 1) * scale} y1={40} x2={20 + (i + 1) * scale} y2={40 + svgH} stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="4,4" />
                    ))}
                    {Array.from({ length: Math.floor(vehicle.cargoLength) }, (_, i) => (
                      <line key={`hl-${i}`} x1={20} y1={40 + (i + 1) * scale} x2={20 + svgW} y2={40 + (i + 1) * scale} stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="4,4" />
                    ))}

                    {/* Packed items */}
                    {vehicle.loadOrder.map((item: any, i: number) => {
                      const color = ITEM_COLORS[i % ITEM_COLORS.length];
                      const rx = 20 + item.x * scale;
                      const ry = 40 + item.y * scale;
                      const rw = item.width * scale;
                      const rh = item.length * scale;
                      const care: CareLevel = item.care || 'standard';
                      const cs = CARE_STYLES[care];
                      // Truncate label to fit
                      const maxChars = Math.max(2, Math.floor(rw / 7));
                      const label = item.name.length > maxChars ? item.name.slice(0, maxChars - 1) + '…' : item.name;
                      const showLabel = rw > 28 && rh > 16;

                      return (
                        <g key={i}>
                          {/* Item fill */}
                          <rect x={rx} y={ry} width={rw} height={rh} fill={color} stroke={cs.border || 'rgba(0,0,0,0.3)'} strokeWidth={cs.border ? 2.5 : 1} strokeDasharray={cs.dash} rx={3} opacity={0.9} />
                          {/* Label */}
                          {showLabel && (
                            <text x={rx + rw / 2} y={ry + rh / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="rgba(0,0,0,0.7)" fontSize={Math.min(11, rh * 0.6, rw * 0.25)} fontWeight="bold">
                              {label}
                            </text>
                          )}
                          {/* Item number badge */}
                          <circle cx={rx + 8} cy={ry + 8} r={7} fill="rgba(0,0,0,0.5)" />
                          <text x={rx + 8} y={ry + 8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={8} fontWeight="bold">
                            {i + 1}
                          </text>
                          {/* Fragile / careful warning badge (top-right) */}
                          {care !== 'standard' && rw > 20 && rh > 20 && (
                            <>
                              <circle cx={rx + rw - 8} cy={ry + 8} r={8} fill={cs.border} opacity={0.85} />
                              <text x={rx + rw - 8} y={ry + 9} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight="bold">
                                {cs.icon}
                              </text>
                            </>
                          )}
                        </g>
                      );
                    })}

                    {/* Rear door indicator */}
                    <rect x={10} y={svgH + 44} width={svgW + 20} height={24} rx={4} fill="#64748b" />
                    <text x={svgW / 2 + 20} y={svgH + 60} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">▼ REAR DOOR (LOAD HERE) ▼</text>

                    {/* Dimension labels */}
                    <text x={svgW / 2 + 20} y={svgH + 78} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                      {vehicle.cargoWidth.toFixed(1)}m × {vehicle.cargoLength.toFixed(1)}m cargo area
                    </text>
                  </svg>
                </div>
              </div>

              {/* Loading manifest / legend */}
              <div className="lg:w-80 shrink-0">
                <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">Loading Order (First → Last)</div>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {vehicle.loadOrder.map((item: any, i: number) => {
                    const color = ITEM_COLORS[i % ITEM_COLORS.length];
                    const care: CareLevel = item.care || 'standard';
                    const cs = CARE_STYLES[care];
                    return (
                      <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2 border border-stone-200">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ backgroundColor: color }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-stone-900 truncate">{item.name}</div>
                          <div className="text-[9px] text-stone-500">{item.volumeM3.toFixed(2)} m³ · {item.massKg.toFixed(1)} kg</div>
                        </div>
                        {care !== 'standard' && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border shrink-0 ${cs.badge}`}>{cs.badgeText}</span>
                        )}
                        <div className="w-5 h-5 rounded-sm shrink-0" style={{ backgroundColor: color, opacity: 0.4, border: cs.border ? `2px ${cs.dash ? 'dashed' : 'solid'} ${cs.border}` : undefined }} />
                      </div>
                    );
                  })}
                </div>

                {/* Care level key */}
                <div className="mt-4 pt-3 border-t border-stone-200">
                  <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Handling Key</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px]"><span className="w-3 h-3 rounded-sm border-2 border-dashed border-red-500 bg-red-50 shrink-0" /> <span className="text-red-700 font-bold">Fragile</span> <span className="text-stone-400">— load last, offload first</span></div>
                    <div className="flex items-center gap-2 text-[10px]"><span className="w-3 h-3 rounded-sm border-2 border-dashed border-amber-500 bg-amber-50 shrink-0" /> <span className="text-amber-700 font-bold">Careful</span> <span className="text-stone-400">— electronics, instruments</span></div>
                    <div className="flex items-center gap-2 text-[10px]"><span className="w-3 h-3 rounded-sm border-2 border-blue-500 bg-blue-50 shrink-0" /> <span className="text-blue-700 font-bold">Heavy</span> <span className="text-stone-400">— secure against cab wall</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Room-by-Room Summary */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
        <h3 className="text-sm font-black text-stone-700 uppercase tracking-wider mb-4">Room-by-Room Summary</h3>
        <div className="space-y-3">
          {rooms.map((room) => {
            const roomTotal = room.inventory.reduce((sum, it) => sum + estimateMassKg(it) * (it.quantity || 1), 0);
            const roomVolume = room.inventory.reduce((sum, it) => sum + (it.volume_per_unit || 0) * 0.0283168 * (it.quantity || 1), 0);
            const roomItems = room.inventory.reduce((sum, it) => sum + (it.quantity || 1), 0);
            return (
              <div key={room.id} className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-stone-500" />
                  <p className="font-bold text-stone-900">{room.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[9px]">
                  <div>
                    <div className="text-stone-500 uppercase mb-1">Items</div>
                    <div className="font-black text-stone-900">{roomItems}</div>
                  </div>
                  <div>
                    <div className="text-stone-500 uppercase mb-1">Volume</div>
                    <div className="font-black text-stone-900">{roomVolume.toFixed(1)} m³</div>
                  </div>
                  <div>
                    <div className="text-stone-500 uppercase mb-1">Weight</div>
                    <div className="font-black text-stone-900">{roomTotal.toFixed(0)} kg</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logistics Tips */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
        <div className="flex gap-3">
          <Package size={20} className="text-amber-600 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-bold text-amber-900">Loading Crew Guide</p>
            <ul className="text-xs text-stone-700 mt-2 space-y-2">
              <li>✓ <strong>Load numbered items in order</strong> — heavy-duty and large items are placed first (towards the cab)</li>
              <li>✓ <strong>Match colors to the diagram</strong> — each item has a unique color for easy identification</li>
              <li className="text-red-700">⚠ <strong>Fragile items (red dashed border)</strong> are loaded last and positioned near the rear door so they can be offloaded first without moving other items</li>
              <li className="text-amber-700">! <strong>Careful items (amber dashed border)</strong> — electronics, instruments, and delicate items need padding and should not bear weight</li>
              <li className="text-blue-700">▼ <strong>Heavy-duty items (blue border)</strong> — appliances and dense items go against the cab wall, strapped to anchor points</li>
              <li>✓ <strong>Weight distribution:</strong> Keep heavy items low and centered for safe driving</li>
              <li>✓ <strong>Secure everything:</strong> Use ratchet straps at each row to prevent shifting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
