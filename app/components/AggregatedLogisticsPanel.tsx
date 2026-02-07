import { Truck, Package, MapPin } from 'lucide-react';
import { Room } from '../types';
import { recommendVehiclesSummary, estimateMassKg, aggregateInventories, planLoadOut } from '../utils/logistics';

interface AggregatedLogisticsPanelProps {
  rooms: Room[];
}

export default function AggregatedLogisticsPanel({ rooms }: AggregatedLogisticsPanelProps) {
  // Aggregate all inventories
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
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
        <h2 className="text-xl font-black text-stone-900 uppercase tracking-widest mb-6">Complete Logistics Plan</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
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
            <div className="text-2xl font-black text-cyan-600">{vehicles.length}</div>
            <div className="text-[9px] text-cyan-500">required</div>
          </div>
        </div>

        {/* Load Out Plan Visualization */}
        <div className="mt-8">
          <h4 className="text-sm font-black text-blue-700 uppercase tracking-wider mb-2">Load Out Plan</h4>
          {loadOutPlan.map((vehicle, vIdx) => (
            <div key={vIdx} className="mb-8">
              <div className="font-bold text-blue-900 mb-1">{vehicle.type.name} #{vIdx + 1}</div>
              <div className="overflow-x-auto">
                <svg
                  width={vehicle.cargoWidth * 120}
                  height={vehicle.cargoLength * 120}
                  viewBox={`0 0 ${vehicle.cargoWidth} ${vehicle.cargoLength}`}
                  style={{ border: '1px solid #60a5fa', background: '#f0f9ff', borderRadius: 8 }}
                >
                  {/* Draw cargo area outline */}
                  <rect x={0} y={0} width={vehicle.cargoWidth} height={vehicle.cargoLength} fill="#e0f2fe" stroke="#60a5fa" strokeWidth={0.03} rx={0.1} />
                  {vehicle.loadOrder.map((item, i) => (
                    <rect
                      key={i}
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.length}
                      fill="#38bdf8"
                      stroke="#0ea5e9"
                      strokeWidth={0.02}
                      rx={0.04}
                      opacity={0.85}
                    />
                  ))}
                </svg>
              </div>
              {/* Legend for item names and details */}
              <ol className="list-decimal ml-6 text-[10px] text-blue-800 mt-2">
                {vehicle.loadOrder.map((item, i) => (
                  <li key={i} className="mb-0.5 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#38bdf8', border: '1px solid #0ea5e9' }}></span>
                    <span className="font-semibold">{item.name}</span> ({item.volumeM3.toFixed(2)} m³, {item.massKg.toFixed(1)} kg)
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        {/* Aggregated Inventory Breakdown by Room */}
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
              <p className="text-sm font-bold text-amber-900">Multi-Room Logistics Strategy</p>
              <ul className="text-xs text-stone-700 mt-2 space-y-2">
                <li>✓ <strong>Load by vehicle type:</strong> Smaller items go in smaller vans, larger items in box trucks</li>
                <li>✓ <strong>Distribute by room:</strong> Keep items from the same room together if possible for unpacking efficiency</li>
                <li>✓ <strong>Weight distribution:</strong> Place heavier items (sofas, tables) in the base; lighter items on top</li>
                <li>✓ <strong>Trip optimization:</strong> Vehicles are planned to minimize the number of trips needed</li>
                <li>✓ <strong>Unloading order:</strong> Load vehicles in reverse order of their destination room</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
