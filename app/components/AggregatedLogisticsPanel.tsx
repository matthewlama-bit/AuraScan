import { Truck, Package, MapPin, AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { Room } from '../types';
import { recommendVehiclesSummary, estimateMassKg, aggregateInventories, planLoadOut, inferCareLevel, CareLevel, PlacedItem, Stackability } from '../utils/logistics';

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
        const floorItems = vehicle.loadOrder.filter((it: any) => it.layer === 0).length;
        const stackedItems = vehicle.loadOrder.filter((it: any) => it.layer > 0).length;

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
                  <p className="text-[10px] text-stone-500">{vehicle.loadOrder.length} items ({floorItems} floor{stackedItems > 0 ? `, ${stackedItems} stacked` : ''}) · {usedVolume.toFixed(1)} m³ · {usedMass.toFixed(0)} kg</p>
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

            <div className="space-y-6">
              {/* ═══ PLAN VIEW (Top-Down) ═══ */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-stone-800 flex items-center justify-center"><span className="text-white text-[8px] font-black">A</span></div>
                  <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Plan View — Top-Down</span>
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex justify-center overflow-x-auto">
                    <svg width={svgW + 80} height={svgH + 120} className="font-mono" style={{ minWidth: svgW + 80 }}>
                      <defs>
                        <pattern id={`grid-${vIdx}`} width={scale} height={scale} patternUnits="userSpaceOnUse" x={40} y={50}>
                          <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#d4d4d8" strokeWidth={0.3} />
                        </pattern>
                        <pattern id={`hatch-${vIdx}`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                          <line x1={0} y1={0} x2={0} y2={6} stroke="#cbd5e1" strokeWidth={0.5} />
                        </pattern>
                        <marker id={`arrow-${vIdx}`} markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#64748b" /></marker>
                        <marker id={`arrowR-${vIdx}`} markerWidth={8} markerHeight={6} refX={0} refY={3} orient="auto"><path d="M8,0 L0,3 L8,6 Z" fill="#64748b" /></marker>
                      </defs>

                      {/* Title block */}
                      <text x={svgW / 2 + 40} y={16} textAnchor="middle" fill="#334155" fontSize={10} fontWeight="bold" fontFamily="monospace">
                        PLAN VIEW — {vehicle.type.name.toUpperCase()} #{vIdx + 1}
                      </text>

                      {/* Outer wall (thick) */}
                      <rect x={35} y={46} width={svgW + 10} height={svgH + 8} rx={2} fill="none" stroke="#334155" strokeWidth={2.5} />

                      {/* Cab */}
                      <rect x={35} y={20} width={svgW + 10} height={30} rx={8} fill="none" stroke="#334155" strokeWidth={2} strokeDasharray="8,3" />
                      <text x={svgW / 2 + 40} y={40} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">CAB (FRONT)</text>

                      {/* Inner cargo floor with grid */}
                      <rect x={40} y={50} width={svgW} height={svgH} fill={`url(#grid-${vIdx})`} stroke="#94a3b8" strokeWidth={1} />

                      {/* Packed items — floor items first, then stacked */}
                      {vehicle.loadOrder
                        .slice()
                        .sort((a: any, b: any) => (a.layer || 0) - (b.layer || 0))
                        .map((item: any, i: number) => {
                        const origIdx = vehicle.loadOrder.indexOf(item);
                        const color = ITEM_COLORS[origIdx % ITEM_COLORS.length];
                        const layer: number = item.layer || 0;
                        const stackOffset = layer * 3;
                        const rx = 40 + item.x * scale + stackOffset;
                        const ry = 50 + item.y * scale + stackOffset;
                        const rw = Math.max(item.width * scale - stackOffset * 2, 4);
                        const rh = Math.max(item.length * scale - stackOffset * 2, 4);
                        const care: CareLevel = item.care || 'standard';
                        const cs = CARE_STYLES[care];
                        const maxChars = Math.max(2, Math.floor(rw / 7));
                        const label = item.name.length > maxChars ? item.name.slice(0, maxChars - 1) + '…' : item.name;
                        const showLabel = rw > 30 && rh > 18;
                        const opacity = layer === 0 ? 0.85 : 0.7;

                        return (
                          <g key={`plan-${origIdx}`}>
                            {layer > 0 && <rect x={rx + 1.5} y={ry + 1.5} width={rw} height={rh} fill="rgba(0,0,0,0.1)" rx={1} />}
                            <rect x={rx} y={ry} width={rw} height={rh} fill={color} stroke={cs.border || '#475569'} strokeWidth={cs.border ? 2 : 0.8} strokeDasharray={cs.dash} rx={1} opacity={opacity} />
                            {showLabel && (
                              <text x={rx + rw / 2} y={ry + rh / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="rgba(0,0,0,0.75)" fontSize={Math.min(10, rh * 0.5, rw * 0.22)} fontWeight="bold" fontFamily="monospace">
                                {label}
                              </text>
                            )}
                            <circle cx={rx + 7} cy={ry + 7} r={6} fill="rgba(0,0,0,0.55)" />
                            <text x={rx + 7} y={ry + 7} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={7} fontWeight="bold" fontFamily="monospace">{origIdx + 1}</text>
                            {layer > 0 && rw > 18 && rh > 18 && (
                              <>
                                <rect x={rx + 1} y={ry + rh - 13} width={18} height={11} rx={2} fill="rgba(0,0,0,0.55)" />
                                <text x={rx + 10} y={ry + rh - 7} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={7} fontWeight="bold" fontFamily="monospace">L{layer + 1}</text>
                              </>
                            )}
                            {care !== 'standard' && rw > 20 && rh > 20 && (
                              <>
                                <circle cx={rx + rw - 7} cy={ry + 7} r={7} fill={cs.border} opacity={0.85} />
                                <text x={rx + rw - 7} y={ry + 8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={8} fontWeight="bold">{cs.icon}</text>
                              </>
                            )}
                          </g>
                        );
                      })}

                      {/* Rear door opening */}
                      <line x1={40 + svgW * 0.15} y1={svgH + 50} x2={40 + svgW * 0.15} y2={svgH + 58} stroke="#334155" strokeWidth={2.5} />
                      <line x1={40 + svgW * 0.85} y1={svgH + 50} x2={40 + svgW * 0.85} y2={svgH + 58} stroke="#334155" strokeWidth={2.5} />
                      <line x1={40 + svgW * 0.15} y1={svgH + 58} x2={40 + svgW * 0.35} y2={svgH + 66} stroke="#334155" strokeWidth={1.5} />
                      <line x1={40 + svgW * 0.85} y1={svgH + 58} x2={40 + svgW * 0.65} y2={svgH + 66} stroke="#334155" strokeWidth={1.5} />
                      <text x={svgW / 2 + 40} y={svgH + 76} textAnchor="middle" fill="#334155" fontSize={8} fontFamily="monospace" fontWeight="bold">REAR DOORS (LOADING)</text>

                      {/* Dimension annotations — Width */}
                      <line x1={40} y1={svgH + 90} x2={40 + svgW} y2={svgH + 90} stroke="#64748b" strokeWidth={0.8} markerStart={`url(#arrowR-${vIdx})`} markerEnd={`url(#arrow-${vIdx})`} />
                      <text x={svgW / 2 + 40} y={svgH + 102} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">{vehicle.cargoWidth.toFixed(2)}m</text>

                      {/* Dimension annotations — Length */}
                      <line x1={svgW + 58} y1={50} x2={svgW + 58} y2={50 + svgH} stroke="#64748b" strokeWidth={0.8} markerStart={`url(#arrowR-${vIdx})`} markerEnd={`url(#arrow-${vIdx})`} />
                      <text x={svgW + 70} y={50 + svgH / 2} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace" transform={`rotate(90, ${svgW + 70}, ${50 + svgH / 2})`}>{vehicle.cargoLength.toFixed(2)}m</text>

                      {/* Scale reference */}
                      <text x={40} y={svgH + 115} fill="#94a3b8" fontSize={7} fontFamily="monospace">Scale: 1m = {scale.toFixed(0)}px</text>
                    </svg>
                  </div>

                  {/* Loading manifest */}
                  <div className="lg:w-80 shrink-0">
                    <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">Loading Order (First → Last)</div>
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                      {vehicle.loadOrder.map((item: any, i: number) => {
                        const color = ITEM_COLORS[i % ITEM_COLORS.length];
                        const care: CareLevel = item.care || 'standard';
                        const cs = CARE_STYLES[care];
                        const layer: number = item.layer || 0;
                        return (
                          <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2 border border-stone-200">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ backgroundColor: color }}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-black text-stone-900 truncate">{item.name}</div>
                              <div className="text-[9px] text-stone-500">
                                {item.volumeM3.toFixed(2)} m³ · {item.massKg.toFixed(1)} kg · h{item.heightM?.toFixed(2) || '?'}m
                                {layer > 0 && <span className="ml-1 text-indigo-600 font-bold">· L{layer + 1}</span>}
                              </div>
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
                        <div className="flex items-center gap-2 text-[10px]"><span className="w-3 h-3 rounded-sm bg-indigo-200 border border-indigo-400 shrink-0 relative"><span className="absolute -top-0.5 -right-0.5 text-[6px] font-bold text-indigo-700">L2</span></span> <span className="text-indigo-700 font-bold">Stacked</span> <span className="text-stone-400">— lighter items on sturdy bases</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ SIDE ELEVATION ═══ */}
              {(() => {
                const sideW = svgW + 80;
                const sideScaleX = svgW / vehicle.cargoLength;
                const sideScaleY = svgW / vehicle.cargoLength * (vehicle.cargoLength / vehicle.cargoHeight);
                const sideH_px = vehicle.cargoHeight * sideScaleX;
                const totalSvgH = sideH_px + 100;

                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded bg-stone-800 flex items-center justify-center"><span className="text-white text-[8px] font-black">B</span></div>
                      <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Side Elevation — Length × Height</span>
                    </div>
                    <div className="overflow-x-auto">
                      <svg width={sideW} height={totalSvgH} className="font-mono" style={{ minWidth: sideW }}>
                        <defs>
                          <pattern id={`sgrid-${vIdx}`} width={sideScaleX} height={sideScaleX} patternUnits="userSpaceOnUse" x={40} y={30}>
                            <path d={`M ${sideScaleX} 0 L 0 0 0 ${sideScaleX}`} fill="none" stroke="#e4e4e7" strokeWidth={0.3} />
                          </pattern>
                        </defs>

                        {/* Title */}
                        <text x={sideW / 2} y={16} textAnchor="middle" fill="#334155" fontSize={10} fontWeight="bold" fontFamily="monospace">
                          SIDE ELEVATION — {vehicle.type.name.toUpperCase()} #{vIdx + 1}
                        </text>

                        {/* Outer wall */}
                        <rect x={40} y={30} width={svgW} height={sideH_px} fill={`url(#sgrid-${vIdx})`} stroke="#334155" strokeWidth={2.5} rx={1} />

                        {/* Floor line */}
                        <line x1={35} y1={30 + sideH_px} x2={40 + svgW + 5} y2={30 + sideH_px} stroke="#334155" strokeWidth={3} />

                        {/* Ceiling line */}
                        <line x1={35} y1={30} x2={40 + svgW + 5} y2={30} stroke="#334155" strokeWidth={1.5} strokeDasharray="6,3" />
                        <text x={40 + svgW + 8} y={34} fill="#94a3b8" fontSize={7} fontFamily="monospace">CEILING</text>

                        {/* Cab indicator (left side) */}
                        <rect x={6} y={30} width={30} height={sideH_px} rx={4} fill="none" stroke="#334155" strokeWidth={1.5} strokeDasharray="6,3" />
                        <text x={21} y={30 + sideH_px / 2} textAnchor="middle" fill="#64748b" fontSize={7} fontFamily="monospace" transform={`rotate(-90, 21, ${30 + sideH_px / 2})`}>CAB</text>

                        {/* Items in side view: x-axis = y (depth into van), y-axis = z + height */}
                        {vehicle.loadOrder
                          .slice()
                          .sort((a: any, b: any) => (a.layer || 0) - (b.layer || 0))
                          .map((item: any, i: number) => {
                          const origIdx = vehicle.loadOrder.indexOf(item);
                          const color = ITEM_COLORS[origIdx % ITEM_COLORS.length];
                          const care: CareLevel = item.care || 'standard';
                          const cs = CARE_STYLES[care];
                          const layer: number = item.layer || 0;

                          // Side view: x maps to y (depth front-to-back), y maps to z (height from floor, inverted)
                          const sx = 40 + item.y * sideScaleX;
                          const sw = Math.max(item.length * sideScaleX, 3);
                          const sh = Math.max((item.heightM || 0.3) * sideScaleX, 3);
                          const sy = 30 + sideH_px - (item.z || 0) * sideScaleX - sh;
                          const opacity = layer === 0 ? 0.85 : 0.7;

                          const maxChars = Math.max(2, Math.floor(sw / 7));
                          const label = item.name.length > maxChars ? item.name.slice(0, maxChars - 1) + '…' : item.name;
                          const showLabel = sw > 30 && sh > 14;

                          return (
                            <g key={`side-${origIdx}`}>
                              {layer > 0 && <rect x={sx + 1} y={sy + 1} width={sw} height={sh} fill="rgba(0,0,0,0.08)" rx={1} />}
                              <rect x={sx} y={sy} width={sw} height={sh} fill={color} stroke={cs.border || '#475569'} strokeWidth={cs.border ? 2 : 0.8} strokeDasharray={cs.dash} rx={1} opacity={opacity} />
                              {showLabel && (
                                <text x={sx + sw / 2} y={sy + sh / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="rgba(0,0,0,0.75)" fontSize={Math.min(9, sh * 0.6, sw * 0.2)} fontWeight="bold" fontFamily="monospace">
                                  {label}
                                </text>
                              )}
                              <circle cx={sx + 7} cy={sy + 7} r={5.5} fill="rgba(0,0,0,0.55)" />
                              <text x={sx + 7} y={sy + 7} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={6.5} fontWeight="bold" fontFamily="monospace">{origIdx + 1}</text>
                              {care !== 'standard' && sw > 18 && sh > 18 && (
                                <>
                                  <circle cx={sx + sw - 7} cy={sy + 7} r={6} fill={cs.border} opacity={0.85} />
                                  <text x={sx + sw - 7} y={sy + 8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={7} fontWeight="bold">{cs.icon}</text>
                                </>
                              )}
                            </g>
                          );
                        })}

                        {/* Rear door arrow (right side) */}
                        <text x={40 + svgW + 8} y={30 + sideH_px - 4} fill="#334155" fontSize={7} fontFamily="monospace" fontWeight="bold">REAR →</text>

                        {/* Dimension — Length (horizontal) */}
                        <line x1={40} y1={30 + sideH_px + 18} x2={40 + svgW} y2={30 + sideH_px + 18} stroke="#64748b" strokeWidth={0.8} markerStart={`url(#arrowR-${vIdx})`} markerEnd={`url(#arrow-${vIdx})`} />
                        <text x={40 + svgW / 2} y={30 + sideH_px + 30} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">{vehicle.cargoLength.toFixed(2)}m</text>

                        {/* Dimension — Height (vertical, left side) */}
                        <line x1={2} y1={30} x2={2} y2={30 + sideH_px} stroke="#64748b" strokeWidth={0.8} markerStart={`url(#arrowR-${vIdx})`} markerEnd={`url(#arrow-${vIdx})`} />
                        <text x={-4} y={30 + sideH_px / 2} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace" transform={`rotate(-90, -4, ${30 + sideH_px / 2})`}>{(vehicle as any).cargoHeight?.toFixed(2) || '?'}m</text>

                        {/* Scale */}
                        <text x={40} y={30 + sideH_px + 42} fill="#94a3b8" fontSize={7} fontFamily="monospace">Scale: 1m = {sideScaleX.toFixed(0)}px</text>
                      </svg>
                    </div>
                  </div>
                );
              })()}
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
              <li className="text-indigo-700">⬆ <strong>Stacked items (L2+)</strong> are lighter items placed on top of sturdy bases — the truck is packed in 3D to maximize space</li>
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
