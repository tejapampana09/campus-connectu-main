import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  branch?: string;
  year?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  avatarSeed?: string;
  online?: boolean;
  status?: "idle" | "waiting" | "chatting";
  chatId?: string | null;
  lastSeen?: Timestamp;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "books" | "notes" | "electronics" | "cycles" | "other";
  imageUrl?: string;
  sellerId: string;
  sellerEmail: string;
  createdAt?: Timestamp;
}

export interface LostFoundItem {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  location: string;
  imageUrl?: string;
  status: "open" | "resolved";
  ownerId: string;
  ownerEmail: string;
  createdAt?: Timestamp;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: "workshop" | "hackathon" | "club" | "other";
  date: string; // ISO
  location: string;
  hostId: string;
  hostEmail: string;
  registered?: string[];
  createdAt?: Timestamp;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  members: string[];
  createdAt?: Timestamp;
}

export interface AppNotification {
  id: string;
  type: "friend_request" | "group_invite" | "marketplace" | "lost_found" | "event";
  title: string;
  body?: string;
  read: boolean;
  link?: string;
  createdAt?: Timestamp;
}
