// Recommend a load out plan for each vehicle: order items for optimal loading (heavy/big first, fragile last)
export function planLoadOut(inventory: InventoryItem[], availableVehicles = VEHICLE_TYPES) {
  const packed = planPacking(inventory, availableVehicles);
  // For each vehicle, order items: heavy and large at the bottom, fragile/small at the top/last
  // For now, we sort by mass*volume descending (proxy for "should be loaded first")
  // Optionally, could add a fragile flag to InventoryItem in the future
  return packed.map(vehicle => {
    const ordered = [...vehicle.items].sort((a, b) => {
      // Heavier and larger items first
      const aScore = a.massKg * a.volumeM3;
      const bScore = b.massKg * b.volumeM3;
      return bScore - aScore;
    });
    return {
      ...vehicle,
      loadOrder: ordered,
    };
  });
}
import { InventoryItem } from '../types';

// Convert cubic feet to cubic meters
const FT3_TO_M3 = 0.0283168;

export interface VehicleType {
  id: string;
  name: string;
  maxVolumeM3: number; // cubic meters
  maxWeightKg: number;
}

export const VEHICLE_TYPES: VehicleType[] = [
  { id: 'small-van', name: 'Small Van', maxVolumeM3: 6, maxWeightKg: 1000 },
  { id: 'medium-van', name: 'Medium Van', maxVolumeM3: 12, maxWeightKg: 2000 },
  { id: 'box-truck', name: 'Box Truck', maxVolumeM3: 28, maxWeightKg: 5000 },
  { id: 'large-truck', name: 'Large Truck', maxVolumeM3: 60, maxWeightKg: 12000 },
];

// Heuristic densities (kg per m3) for common furniture types. These are estimates
// used to infer mass from volume. We allow simple keyword matching on the item name.
// Note: Furniture is often quite dense due to wood, upholstery, metal frames, and padding.
const DENSITY_OVERRIDES: Record<string, number> = {
  sofa: 250,      // sofas are dense with wood frame, springs, padding, upholstery
  couch: 250,
  sectional: 250,
  mattress: 150,  // mattresses have springs and padding
  bed: 200,       // bed frames are heavy
  chair: 200,     // upholstered chairs with wood/metal frames
  ottoman: 200,
  table: 350,     // tables (dining, coffee) are solid wood/metal and heavy
  desk: 350,
  dresser: 400,   // dressers are heavy solid wood
  cabinet: 350,   // cabinets are dense
  bookshelf: 400, // loaded or empty, fairly heavy
  tv: 80,         // TVs are relatively light
  television: 80,
  lamp: 30,       // lamps are light
  rug: 50,        // rugs/carpets
  'box': 100,     // generic boxes
};

const DEFAULT_DENSITY_KG_M3 = 150; // increased default for generic furniture

function inferDensityKgPerM3(name?: string) {
  if (!name) return DEFAULT_DENSITY_KG_M3;
  const n = name.toLowerCase();
  for (const k of Object.keys(DENSITY_OVERRIDES)) {
    if (n.includes(k)) return DENSITY_OVERRIDES[k];
  }
  return DEFAULT_DENSITY_KG_M3;
}

export function estimateMassKg(item: InventoryItem): number {
  const volFt3 = item.volume_per_unit || 0;
  const volM3 = volFt3 * FT3_TO_M3;
  const density = inferDensityKgPerM3(item.item);
  const massKg = volM3 * density;
  // Add a tiny base weight to account for hardware/fittings
  return Math.max(0.1, massKg);
}

interface UnitItem {
  originalIndex: number;
  name: string;
  massKg: number;
  volumeM3: number;
}

// Expand inventory into individual units (so we can place single items across multiple vehicles)
function expandInventory(inventory: InventoryItem[]): UnitItem[] {
  const units: UnitItem[] = [];
  inventory.forEach((it, idx) => {
    const qty = it.quantity || 1;
    const volM3 = (it.volume_per_unit || 0) * FT3_TO_M3;
    const massKg = estimateMassKg(it);
    for (let i = 0; i < qty; i++) {
      units.push({ originalIndex: idx, name: it.item, massKg, volumeM3: volM3 });
    }
  });
  return units;
}

export interface PackedVehicle {
  type: VehicleType;
  items: UnitItem[];
  totalMassKg: number;
  totalVolumeM3: number;
}

// Primary packing algorithm: first-fit decreasing on volume, constrained by volume + weight.
export function planPacking(inventory: InventoryItem[], availableVehicles = VEHICLE_TYPES): PackedVehicle[] {
  const units = expandInventory(inventory);

  // sort descending by volume then mass so big/heavy items placed first
  units.sort((a, b) => b.volumeM3 - a.volumeM3 || b.massKg - a.massKg);

  const vehicles: PackedVehicle[] = [];

  for (const unit of units) {
    // Try to fit into existing vehicles
    let placed = false;
    for (const v of vehicles) {
      const newVol = v.totalVolumeM3 + unit.volumeM3;
      const newMass = v.totalMassKg + unit.massKg;
      if (newVol <= v.type.maxVolumeM3 && newMass <= v.type.maxWeightKg) {
        v.items.push(unit);
        v.totalVolumeM3 = newVol;
        v.totalMassKg = newMass;
        placed = true;
        break;
      }
    }

    if (placed) continue;

    // Need to open a new vehicle. Choose the smallest vehicle type that can fit this unit alone
    let chosenType = availableVehicles.find(t => unit.volumeM3 <= t.maxVolumeM3 && unit.massKg <= t.maxWeightKg);
    if (!chosenType) {
      // fallback to largest vehicle
      chosenType = availableVehicles[availableVehicles.length - 1];
    }

    const newV: PackedVehicle = {
      type: chosenType,
      items: [unit],
      totalMassKg: unit.massKg,
      totalVolumeM3: unit.volumeM3,
    };
    vehicles.push(newV);
  }

  return vehicles;
}

export function recommendVehiclesSummary(inventory: InventoryItem[]) {
  const vehicles = planPacking(inventory);
  const summary = vehicles.map(v => ({
    type: v.type.name,
    count: v.items.length,
    totalVolumeM3: Number(v.totalVolumeM3.toFixed(3)),
    totalMassKg: Number(v.totalMassKg.toFixed(1)),
  }));
  return { vehicles, summary };
}

// Aggregate inventory across multiple room inventories
export function aggregateInventories(roomInventories: InventoryItem[][]): InventoryItem[] {
  const map = new Map<string, InventoryItem>();
  const normalize = (s: string) => (s || '').toString().trim().toLowerCase();

  for (const inventory of roomInventories) {
    for (const it of inventory) {
      const key = normalize(it.item);
      if (!map.has(key)) {
        map.set(key, { ...it });
      } else {
        const existing = map.get(key)!;
        existing.quantity = (existing.quantity || 1) + (it.quantity || 1);
      }
    }
  }

  return Array.from(map.values());
}

// Example usage (for debugging):
// const { vehicles, summary } = recommendVehiclesSummary(room.inventory);
// console.log(summary);

// Infer a room name from inventory items using keyword scoring
export function inferRoomName(inventory: InventoryItem[]): string | null {
  if (!inventory || inventory.length === 0) return null;
  const scores: Record<string, number> = {};

  const categories: Record<string, string[]> = {
    'Bedroom': ['bed', 'mattress', 'dresser', 'nightstand', 'wardrobe'],
    'Living Room': ['sofa', 'couch', 'tv', 'television', 'coffee table', 'armchair', 'sectional'],
    'Kitchen': ['fridge', 'refrigerator', 'oven', 'stove', 'microwave', 'kitchen', 'cabinet'],
    'Dining Room': ['dining table', 'dining', 'chair', 'table'],
    'Office': ['desk', 'bookshelf', 'bookcase', 'monitor', 'chair', 'office'],
    'Bathroom': ['toilet', 'sink', 'bathtub', 'shower', 'vanity', 'bathroom'],
    'Garage': ['tool', 'bike', 'ladder', 'toolbox', 'garage'],
    'Storage': ['box', 'crate', 'storage', 'suitcase'],
  };

  const normalize = (s: string) => (s || '').toLowerCase();

  for (const it of inventory) {
    const name = normalize(it.item || '');
    for (const cat of Object.keys(categories)) {
      for (const kw of categories[cat]) {
        if (name.includes(kw)) {
          scores[cat] = (scores[cat] || 0) + 1;
        }
      }
    }
  }

  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  // require at least one match and clear winner (or accept tie with top score)
  if (!top) return null;
  return top[0];
}
