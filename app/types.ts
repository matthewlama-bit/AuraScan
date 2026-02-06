export interface InventoryItem {
  item: string;
  quantity: number;
  volume_per_unit: number;
  box_2d?: number[];
  target_box_2d?: number[];
}

export interface Room {
  id: string;
  name: string;
  image: string | null;
  targetImage: string | null;
  inventory: InventoryItem[];
}

export type ViewMode = "survey" | "unpack";