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
  // whether the current room name was auto-inferred and not yet accepted
  autoName?: boolean;
}

export type ViewMode = "survey" | "unpack" | "logistics";

/* ────────────────────────────────────────────────────────────────
   MULTI-ROLE PLATFORM TYPES
   ──────────────────────────────────────────────────────────────── */

export type UserRole = "customer" | "removalist" | "admin";

export type JobStatus =
  | "draft"         // customer still scanning
  | "published"     // open for bids
  | "bidding"       // bids received
  | "awarded"       // customer accepted a bid
  | "in-progress"   // move underway
  | "completed"     // move done
  | "cancelled";

export type BidStatus = "pending" | "accepted" | "declined" | "withdrawn";

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  // removalist-specific
  companyName?: string;
  subscription?: SubscriptionTier;
  subscriptionExpiresAt?: string;
  abn?: string;
  phone?: string;
}

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  status: JobStatus;
  title: string;
  fromAddress: Address;
  toAddress: Address;
  preferredDate: string;
  flexibleDates: boolean;
  rooms: Room[];
  totalVolumeM3: number;
  estimatedQuote: number;
  vehiclesRequired: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  bids: Bid[];
  awardedBidId?: string;
  notes?: string;
}

export interface Bid {
  id: string;
  jobId: string;
  removalistId: string;
  companyName: string;
  amount: number;
  message: string;
  crewSize: number;
  estimatedHours: number;
  insuranceIncluded: boolean;
  packingIncluded: boolean;
  availableDate: string;
  status: BidStatus;
  createdAt: string;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;            // $/month
  bidsPerMonth: number;     // 0 = unlimited
  features: string[];
  highlighted?: boolean;
}

export interface PlatformStats {
  totalJobs: number;
  activeJobs: number;
  totalBids: number;
  totalRevenue: number;
  activeRemovalists: number;
  activeCustomers: number;
  avgBidAmount: number;
  conversionRate: number;   // % of published jobs that get awarded
}