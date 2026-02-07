import { Truck, Package } from 'lucide-react';
import { Room } from '../types';
import { recommendVehiclesSummary, estimateMassKg, planLoadOut } from '../utils/logistics';

interface LogisticsPanelProps {
  activeRoom: Room;
}

export default function LogisticsPanel({ activeRoom }: LogisticsPanelProps) {
  if (!activeRoom.inventory || activeRoom.inventory.length === 0) {
    return (
      <div className="lg:col-span-12">
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Logistics Plan</h3>
          <p className="text-xs text-stone-500">Add inventory to see vehicle recommendations</p>
        </div>
      </div>
    );
  }

  const { vehicles, summary } = recommendVehiclesSummary(activeRoom.inventory);
  const loadOutPlan = planLoadOut(activeRoom.inventory);
        {/* Load Out Plan */}
        <div className="mt-8">
          <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-2">Load Out Plan</h4>
          {loadOutPlan.map((vehicle, vIdx) => (
            <div key={vIdx} className="mb-4">
              <div className="font-bold text-blue-900 mb-1">{vehicle.type.name} #{vIdx + 1}</div>
              <ol className="list-decimal ml-6 text-[10px] text-blue-800">
                {vehicle.loadOrder.map((item, i) => (
                  <li key={i} className="mb-0.5">
                    <span className="font-semibold">{item.name}</span> ({item.volumeM3.toFixed(2)} m³, {item.massKg.toFixed(1)} kg)
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

  const totalItems = activeRoom.inventory.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const totalMassKg = activeRoom.inventory.reduce((sum, it) => sum + estimateMassKg(it) * (it.quantity || 1), 0);
  const totalVolumeM3 = activeRoom.inventory.reduce((sum, it) => sum + (it.volume_per_unit || 0) * 0.0283168 * (it.quantity || 1), 0);

  return (
    <div className="lg:col-span-12">
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Logistics Plan</h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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

        {/* Vehicle Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Vehicle Breakdown</h4>
          {vehicles.map((vehicle, idx) => (
            <div key={idx} className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center shrink-0">
                    <Truck size={20} className="text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 text-sm">
                      {vehicle.type.name} #{idx + 1}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1">
                      {vehicle.items.length} item{vehicle.items.length !== 1 ? 's' : ''} • 
                      {' '}{vehicle.totalVolumeM3.toFixed(2)} m³ • 
                      {' '}{vehicle.totalMassKg.toFixed(0)} kg
                    </p>
                    
                    {/* Utilization bars */}
                    <div className="mt-2 space-y-1">
                      <div>
                        <div className="text-[9px] text-stone-500 mb-1">Volume: {((vehicle.totalVolumeM3 / vehicle.type.maxVolumeM3) * 100).toFixed(0)}%</div>
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-400 transition-all"
                            style={{ width: `${(vehicle.totalVolumeM3 / vehicle.type.maxVolumeM3) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-stone-500 mb-1">Weight: {((vehicle.totalMassKg / vehicle.type.maxWeightKg) * 100).toFixed(0)}%</div>
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-400 transition-all"
                            style={{ width: `${(vehicle.totalMassKg / vehicle.type.maxWeightKg) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item list for this vehicle */}
              <div className="mt-3 ml-13 text-[9px]">
                <details className="cursor-pointer">
                  <summary className="font-bold text-stone-600 hover:text-stone-900">Show items ({vehicle.items.length})</summary>
                  <div className="mt-2 space-y-1 text-stone-500">
                    {vehicle.items.map((item, i) => (
                      <div key={i} className="text-[8px]">
                        • {item.name} ({item.volumeM3.toFixed(3)} m³, {item.massKg.toFixed(1)} kg)
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>

        {/* Packing Tips */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex gap-2">
            <Package size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">Packing Tips</p>
              <ul className="text-[9px] text-amber-800 mt-1 space-y-1">
                <li>• Load heavier items first (bottom of vehicle)</li>
                <li>• Distribute weight evenly across the vehicle</li>
                <li>• Secure items to prevent shifting during transport</li>
                <li>• Items are sorted by volume for optimal space usage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
