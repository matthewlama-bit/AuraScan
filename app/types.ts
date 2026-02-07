export interface InventoryItem {
  item: string;
  quantity: number;
  volume_per_unit: number;
  // allow a single box or an array of boxes (from multi-image merge)
  box_2d?: number[] | number[][];
  target_box_2d?: number[] | number[][];
  sources?: { image: number; box?: number[] | null }[];
}

export interface Room {
  id: string;
  name: string;
  image: string | null;
  images?: string[];
  targetImage: string | null;
  inventory: InventoryItem[];
}

export type ViewMode = "survey" | "unpack" | "logistics";