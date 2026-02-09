// ── Care-level priority for sorting (lower = load earlier = further from door) ──
const CARE_PRIORITY: Record<CareLevel, number> = {
  'heavy-duty': 0,
  'standard': 1,
  'careful': 2,
  'fragile': 3,
};

export interface PlacedItem {
  x: number; y: number; width: number; length: number;
  z: number;        // vertical offset in metres (0 = floor)
  heightM: number;  // item height
  layer: number;    // 0 = ground floor, 1+ = stacked
  name: string;
  massKg: number;
  volumeM3: number;
  care: CareLevel;
  stackability: Stackability;
}

// Build the visual load-out plan from 3D-packed vehicles.
// Items are already placed by planPacking; this extracts the slot data
// and sorts within care-level priority for the loading order.
export function planLoadOut(inventory: InventoryItem[], availableVehicles = VEHICLE_TYPES) {
  const packed = planPacking(inventory, availableVehicles);

  return packed.map(vehicle => {
    const cargoWidth = vehicle.type.cargoW;
    const cargoLength = vehicle.type.cargoL;
    const cargoHeight = vehicle.type.cargoH;

    const slots = (vehicle as any)._slots as FloorSlot[] | undefined;
    let placed: PlacedItem[] = [];

    if (slots) {
      for (const slot of slots) {
        for (let li = 0; li < slot.items.length; li++) {
          const si = slot.items[li];
          placed.push({
            x: slot.x, y: slot.y,
            width: slot.w, length: slot.d,
            z: si.z,
            heightM: si.unit.heightM,
            layer: li,
            name: si.unit.name,
            massKg: si.unit.massKg,
            volumeM3: si.unit.volumeM3,
            care: si.unit.care,
            stackability: si.unit.stackability,
          });
        }
      }
    }

    // Sort for display: care priority, then by y (front-to-back), then layer
    placed.sort((a, b) => {
      const ca = CARE_PRIORITY[a.care];
      const cb = CARE_PRIORITY[b.care];
      if (ca !== cb) return ca - cb;
      if (Math.abs(a.y - b.y) > 0.01) return a.y - b.y;
      return a.layer - b.layer;
    });

    return {
      ...vehicle,
      loadOrder: placed,
      cargoWidth,
      cargoLength,
      cargoHeight,
    };
  });
}
import { InventoryItem } from '../types';

// Convert cubic feet to cubic meters
const FT3_TO_M3 = 0.0283168;

export interface VehicleType {
  id: string;
  name: string;
  maxVolumeM3: number;  // cubic metres (overall capacity)
  maxWeightKg: number;
  cargoW: number;       // interior width  (m)
  cargoL: number;       // interior length (m)
  cargoH: number;       // interior height (m)
}

export const VEHICLE_TYPES: VehicleType[] = [
  { id: 'small-van',  name: 'Small Van',   maxVolumeM3: 6,  maxWeightKg: 1000,  cargoW: 1.7, cargoL: 2.4, cargoH: 1.5 },
  { id: 'medium-van', name: 'Medium Van',  maxVolumeM3: 12, maxWeightKg: 2000,  cargoW: 1.8, cargoL: 3.2, cargoH: 1.9 },
  { id: 'box-truck',  name: 'Box Truck',   maxVolumeM3: 28, maxWeightKg: 5000,  cargoW: 2.2, cargoL: 5.0, cargoH: 2.3 },
  { id: 'large-truck', name: 'Large Truck', maxVolumeM3: 60, maxWeightKg: 12000, cargoW: 2.4, cargoL: 8.0, cargoH: 2.6 },
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

// ── Realistic item heights (metres) ──
const HEIGHT_OVERRIDES: Record<string, number> = {
  sofa: 0.85, couch: 0.85, sectional: 0.85, loveseat: 0.85,
  armchair: 0.9, recliner: 1.0, ottoman: 0.45, chair: 0.9, stool: 0.6,
  'dining table': 0.75, 'coffee table': 0.45, 'side table': 0.6, 'end table': 0.6,
  'console table': 0.8, nightstand: 0.6, table: 0.75, desk: 0.75,
  'king bed': 0.55, 'queen bed': 0.55, bed: 0.55, mattress: 0.25, crib: 0.9,
  dresser: 0.9, wardrobe: 1.8, bookshelf: 1.8, bookcase: 1.8, cabinet: 1.2,
  'filing cabinet': 1.0, shelf: 1.5,
  fridge: 1.7, refrigerator: 1.7, washer: 0.85, dryer: 0.85,
  dishwasher: 0.85, oven: 0.9, stove: 0.9, microwave: 0.35,
  tv: 0.7, television: 0.7, monitor: 0.4, computer: 0.45,
  lamp: 0.5, 'floor lamp': 1.6,
  rug: 0.25, carpet: 0.25, mirror: 0.9, painting: 0.8, art: 0.7,
  box: 0.4, suitcase: 0.35, bike: 1.0, bicycle: 1.0, piano: 1.0, treadmill: 1.4,
};

function inferHeight(name?: string, volumeM3 = 0): number {
  if (name) {
    const n = name.toLowerCase();
    const keys = Object.keys(HEIGHT_OVERRIDES).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (n.includes(k)) return HEIGHT_OVERRIDES[k];
    }
  }
  // Fallback: derive from volume and a 0.5×0.5 footprint
  return Math.min(Math.max(volumeM3 / 0.25, 0.3), 1.5);
}

// Whether an item can have other items stacked on top of it
export type Stackability = 'base' | 'stackable' | 'top-only' | 'no-stack';

const STACKABILITY_OVERRIDES: Record<string, Stackability> = {
  // Flat, strong surfaces – great bases
  dresser: 'base', table: 'base', desk: 'base', 'dining table': 'base',
  'coffee table': 'base', 'side table': 'base', 'end table': 'base',
  'console table': 'base', nightstand: 'base', cabinet: 'base',
  washer: 'base', dryer: 'base', dishwasher: 'base', oven: 'base', stove: 'base',
  // Light items that go on top only
  lamp: 'top-only', 'floor lamp': 'no-stack', mirror: 'top-only',
  painting: 'top-only', art: 'top-only', box: 'stackable', suitcase: 'stackable',
  microwave: 'stackable', monitor: 'top-only', computer: 'stackable',
  // Cannot stack – fragile, tall, or awkward
  tv: 'no-stack', television: 'no-stack', chandelier: 'no-stack',
  vase: 'no-stack', china: 'no-stack', crystal: 'no-stack', glass: 'no-stack',
  wardrobe: 'no-stack', bookshelf: 'no-stack', bookcase: 'no-stack',
  fridge: 'no-stack', refrigerator: 'no-stack', piano: 'no-stack',
  bike: 'no-stack', bicycle: 'no-stack', treadmill: 'no-stack',
  bed: 'no-stack', mattress: 'stackable', sofa: 'no-stack', couch: 'no-stack',
  sectional: 'no-stack', armchair: 'no-stack', recliner: 'no-stack',
};

export function inferStackability(name?: string): Stackability {
  if (!name) return 'stackable';
  const n = name.toLowerCase();
  const keys = Object.keys(STACKABILITY_OVERRIDES).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (n.includes(k)) return STACKABILITY_OVERRIDES[k];
  }
  return 'stackable';
}

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
  heightM: number;
  footprint: { w: number; d: number };
  stackability: Stackability;
  care: CareLevel;
}

// Expand inventory into individual units
function expandInventory(inventory: InventoryItem[]): UnitItem[] {
  const units: UnitItem[] = [];
  inventory.forEach((it, idx) => {
    const qty = it.quantity || 1;
    const volM3 = (it.volume_per_unit || 0) * FT3_TO_M3;
    const massKg = estimateMassKg(it);
    const heightM = inferHeight(it.item, volM3);
    const footprint = inferFootprint(it.item, volM3);
    const stackability = inferStackability(it.item);
    const care = inferCareLevel(it.item);
    for (let i = 0; i < qty; i++) {
      units.push({ originalIndex: idx, name: it.item, massKg, volumeM3: volM3, heightM, footprint, stackability, care });
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

// ── 3D-aware packing algorithm ──
// Uses a floor-area shelf algorithm with vertical stacking.
// Each "slot" on the floor has a height budget up to cargoH.
// Lighter/smaller items can stack on sturdy bases if room remains.
// Properly opens new vehicles when a truck is full (volume, weight, OR floor area).

interface FloorSlot {
  x: number;
  y: number;
  w: number;
  d: number;
  usedH: number;       // height consumed so far
  maxH: number;        // vehicle ceiling
  baseStackable: boolean; // can things stack here?
  items: { unit: UnitItem; z: number }[];
}

function tryFitInSlot(slot: FloorSlot, unit: UnitItem): boolean {
  // Item footprint must fit within slot footprint
  const fp = unit.footprint;
  if (fp.w > slot.w + 0.01 || fp.d > slot.d + 0.01) return false;
  // Must have vertical room
  if (slot.usedH + unit.heightM > slot.maxH + 0.01) return false;
  // Cannot stack on no-stack base, and top-only/no-stack items can't go under anything
  if (slot.items.length > 0) {
    if (!slot.baseStackable) return false;
    // fragile items should never be stacked under anything
    const lastItem = slot.items[slot.items.length - 1].unit;
    if (lastItem.care === 'fragile' || lastItem.stackability === 'no-stack' || lastItem.stackability === 'top-only') return false;
  }
  return true;
}

export function planPacking(inventory: InventoryItem[], availableVehicles = VEHICLE_TYPES): PackedVehicle[] {
  const units = expandInventory(inventory);

  // Sort: big/heavy first so they become floor items, small/light last so they stack
  units.sort((a, b) => {
    // no-stack items first (they need dedicated floor space)
    const sa = a.stackability === 'no-stack' ? 0 : 1;
    const sb = b.stackability === 'no-stack' ? 0 : 1;
    if (sa !== sb) return sa - sb;
    return b.volumeM3 - a.volumeM3 || b.massKg - a.massKg;
  });

  const vehicles: PackedVehicle[] = [];

  for (const unit of units) {
    let placed = false;

    // Try to fit into existing vehicles
    for (const v of vehicles) {
      // Weight check
      if (v.totalMassKg + unit.massKg > v.type.maxWeightKg) continue;

      // Try stacking on existing floor slots
      const vSlots = (v as any)._slots as FloorSlot[];
      for (const slot of vSlots) {
        if (tryFitInSlot(slot, unit)) {
          slot.items.push({ unit, z: slot.usedH });
          slot.usedH += unit.heightM;
          v.items.push(unit);
          v.totalMassKg += unit.massKg;
          v.totalVolumeM3 += unit.volumeM3;
          placed = true;
          break;
        }
      }
      if (placed) break;

      // Try placing as new floor item (shelf-pack)
      const shelfState = (v as any)._shelf as { x: number; y: number; rowH: number };
      const fp = unit.footprint;
      let fw = fp.w, fd = fp.d;
      // Rotate if needed
      if (fw > v.type.cargoW && fd <= v.type.cargoW) [fw, fd] = [fd, fw];
      fw = Math.min(fw, v.type.cargoW);

      if (shelfState.x + fw > v.type.cargoW + 0.01) {
        shelfState.x = 0;
        shelfState.y += shelfState.rowH;
        shelfState.rowH = 0;
      }
      // Check if there's floor length remaining
      if (shelfState.y + fd <= v.type.cargoL + 0.01) {
        const newSlot: FloorSlot = {
          x: shelfState.x, y: shelfState.y,
          w: fw, d: fd,
          usedH: unit.heightM, maxH: v.type.cargoH,
          baseStackable: unit.stackability === 'base' || unit.stackability === 'stackable',
          items: [{ unit, z: 0 }],
        };
        vSlots.push(newSlot);
        shelfState.x += fw;
        shelfState.rowH = Math.max(shelfState.rowH, fd);
        v.items.push(unit);
        v.totalMassKg += unit.massKg;
        v.totalVolumeM3 += unit.volumeM3;
        placed = true;
        break;
      }
    }

    if (placed) continue;

    // Open a new vehicle — pick the smallest that can fit this item
    let chosenType = availableVehicles.find(t =>
      unit.volumeM3 <= t.maxVolumeM3 &&
      unit.massKg <= t.maxWeightKg &&
      unit.footprint.w <= t.cargoW + 0.01 &&
      unit.footprint.d <= t.cargoL + 0.01 &&
      unit.heightM <= t.cargoH + 0.01
    );
    if (!chosenType) {
      // Try with rotation
      chosenType = availableVehicles.find(t =>
        unit.volumeM3 <= t.maxVolumeM3 &&
        unit.massKg <= t.maxWeightKg &&
        unit.footprint.d <= t.cargoW + 0.01 &&
        unit.footprint.w <= t.cargoL + 0.01 &&
        unit.heightM <= t.cargoH + 0.01
      );
    }
    if (!chosenType) chosenType = availableVehicles[availableVehicles.length - 1];

    const fp = unit.footprint;
    let fw = fp.w, fd = fp.d;
    if (fw > chosenType.cargoW && fd <= chosenType.cargoW) [fw, fd] = [fd, fw];
    fw = Math.min(fw, chosenType.cargoW);

    const newSlot: FloorSlot = {
      x: 0, y: 0,
      w: fw, d: fd,
      usedH: unit.heightM, maxH: chosenType.cargoH,
      baseStackable: unit.stackability === 'base' || unit.stackability === 'stackable',
      items: [{ unit, z: 0 }],
    };

    const newV: PackedVehicle = {
      type: chosenType,
      items: [unit],
      totalMassKg: unit.massKg,
      totalVolumeM3: unit.volumeM3,
    };
    (newV as any)._slots = [newSlot];
    (newV as any)._shelf = { x: fw, y: 0, rowH: fd };
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
