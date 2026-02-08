// ── Care-level priority for sorting (lower = load earlier = further from door) ──
const CARE_PRIORITY: Record<CareLevel, number> = {
  'heavy-duty': 0,   // heaviest/sturdiest → cab end (loaded first)
  'standard': 1,
  'careful': 2,
  'fragile': 3,      // fragile → rear door (loaded last, offloaded first)
};

// Recommend a load out plan for each vehicle: heavy/sturdy items first (cab), fragile last (rear door)
// Uses realistic 2D footprints so the SVG reflects actual item sizes.
export function planLoadOut(inventory: InventoryItem[], availableVehicles = VEHICLE_TYPES) {
  const packed = planPacking(inventory, availableVehicles);

  return packed.map(vehicle => {
    const cargoWidth = 2; // metres
    const cargoLength = Math.max(vehicle.type.maxVolumeM3 / cargoWidth, 2);

    // Sort items: heavy-duty → standard → careful → fragile
    // Within same care level, bigger volume first
    const sorted = [...vehicle.items].sort((a, b) => {
      const ca = CARE_PRIORITY[inferCareLevel(a.name)];
      const cb = CARE_PRIORITY[inferCareLevel(b.name)];
      if (ca !== cb) return ca - cb;
      return b.volumeM3 - a.volumeM3;
    });

    // Shelf-pack using realistic footprints
    let x = 0, y = 0, rowHeight = 0;
    const placed = sorted.map((item, i) => {
      const foot = inferFootprint(item.name, item.volumeM3);
      let width = foot.w;
      let length = foot.d;

      // If item is wider than cargo, rotate it
      if (width > cargoWidth && length <= cargoWidth) {
        [width, length] = [length, width];
      }
      // Clamp to cargo width
      width = Math.min(width, cargoWidth);

      // Start new row if won't fit
      if (x + width > cargoWidth + 0.01) {
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }

      const care = inferCareLevel(item.name);
      const pos = {
        x, y, width, length,
        name: item.name,
        massKg: item.massKg,
        volumeM3: item.volumeM3,
        care,
      };
      x += width;
      rowHeight = Math.max(rowHeight, length);
      return pos;
    });

    return {
      ...vehicle,
      loadOrder: placed,
      cargoWidth,
      cargoLength,
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

// ── Realistic top-down footprints (width × depth in metres) ──
// These represent the actual floor-space an item occupies when viewed from above.
const FOOTPRINT_OVERRIDES: Record<string, { w: number; d: number }> = {
  // Seating
  sofa:        { w: 2.0, d: 0.9 },
  couch:       { w: 2.0, d: 0.9 },
  sectional:   { w: 2.8, d: 1.6 },
  loveseat:    { w: 1.5, d: 0.85 },
  armchair:    { w: 0.85, d: 0.85 },
  recliner:    { w: 0.9, d: 0.9 },
  ottoman:     { w: 0.6, d: 0.6 },
  chair:       { w: 0.5, d: 0.5 },
  stool:       { w: 0.4, d: 0.4 },
  // Tables
  'dining table': { w: 1.6, d: 0.9 },
  'coffee table': { w: 1.2, d: 0.6 },
  'side table':   { w: 0.5, d: 0.5 },
  'end table':    { w: 0.5, d: 0.5 },
  'console table':{ w: 1.2, d: 0.35 },
  nightstand:  { w: 0.5, d: 0.4 },
  table:       { w: 1.2, d: 0.75 },
  desk:        { w: 1.4, d: 0.7 },
  // Bedroom
  'king bed':  { w: 2.0, d: 2.1 },
  'queen bed': { w: 1.6, d: 2.1 },
  bed:         { w: 1.6, d: 2.1 },
  mattress:    { w: 1.6, d: 2.1 },
  crib:        { w: 0.7, d: 1.3 },
  // Storage
  dresser:     { w: 1.3, d: 0.5 },
  wardrobe:    { w: 1.2, d: 0.6 },
  bookshelf:   { w: 0.9, d: 0.35 },
  bookcase:    { w: 0.9, d: 0.35 },
  cabinet:     { w: 0.9, d: 0.45 },
  'filing cabinet': { w: 0.45, d: 0.6 },
  shelf:       { w: 0.8, d: 0.3 },
  // Appliances
  fridge:      { w: 0.7, d: 0.7 },
  refrigerator:{ w: 0.7, d: 0.7 },
  washer:      { w: 0.6, d: 0.65 },
  dryer:       { w: 0.6, d: 0.65 },
  dishwasher:  { w: 0.6, d: 0.6 },
  oven:        { w: 0.6, d: 0.6 },
  stove:       { w: 0.6, d: 0.6 },
  microwave:   { w: 0.5, d: 0.4 },
  // Electronics
  tv:          { w: 1.2, d: 0.15 },
  television:  { w: 1.2, d: 0.15 },
  monitor:     { w: 0.6, d: 0.15 },
  computer:    { w: 0.5, d: 0.45 },
  // Misc
  lamp:        { w: 0.35, d: 0.35 },
  'floor lamp': { w: 0.35, d: 0.35 },
  rug:         { w: 0.4, d: 1.2 },  // rolled up
  carpet:      { w: 0.4, d: 1.2 },
  mirror:      { w: 0.6, d: 0.1 },
  painting:    { w: 0.8, d: 0.1 },
  art:         { w: 0.7, d: 0.1 },
  box:         { w: 0.45, d: 0.45 },
  suitcase:    { w: 0.5, d: 0.35 },
  bike:        { w: 0.6, d: 1.8 },
  bicycle:     { w: 0.6, d: 1.8 },
  piano:       { w: 1.5, d: 0.65 },
  treadmill:   { w: 0.7, d: 1.8 },
};

// ── Fragility / handling-care classification ──
export type CareLevel = 'fragile' | 'careful' | 'standard' | 'heavy-duty';

const CARE_OVERRIDES: Record<string, CareLevel> = {
  // Fragile – glass, screens, ceramics
  tv: 'fragile',
  television: 'fragile',
  monitor: 'fragile',
  mirror: 'fragile',
  lamp: 'fragile',
  'floor lamp': 'fragile',
  painting: 'fragile',
  art: 'fragile',
  vase: 'fragile',
  chandelier: 'fragile',
  glass: 'fragile',
  china: 'fragile',
  crystal: 'fragile',
  // Careful – electronics, musical instruments, antiques
  computer: 'careful',
  printer: 'careful',
  guitar: 'careful',
  speaker: 'careful',
  record: 'careful',
  turntable: 'careful',
  clock: 'careful',
  aquarium: 'careful',
  microwave: 'careful',
  // Heavy-duty – appliances, large dense items
  fridge: 'heavy-duty',
  refrigerator: 'heavy-duty',
  washer: 'heavy-duty',
  dryer: 'heavy-duty',
  dishwasher: 'heavy-duty',
  oven: 'heavy-duty',
  stove: 'heavy-duty',
  piano: 'heavy-duty',
  treadmill: 'heavy-duty',
};

export function inferCareLevel(name?: string): CareLevel {
  if (!name) return 'standard';
  const n = name.toLowerCase();
  // Check longest keys first (multi-word) for best match
  const keys = Object.keys(CARE_OVERRIDES).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (n.includes(k)) return CARE_OVERRIDES[k];
  }
  return 'standard';
}

function inferFootprint(name?: string, volumeM3 = 0): { w: number; d: number } {
  if (name) {
    const n = name.toLowerCase();
    // Check longest keys first for best match (e.g. 'dining table' before 'table')
    const keys = Object.keys(FOOTPRINT_OVERRIDES).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (n.includes(k)) return FOOTPRINT_OVERRIDES[k];
    }
  }
  // Fallback: derive from volume assuming height ≈ 0.8m, keep width ≤ 1.0m
  const area = Math.max(volumeM3 / 0.8, 0.1);
  const w = Math.min(Math.sqrt(area), 1.0);
  const d = Math.max(area / w, 0.15);
  return { w, d };
}

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
