import { MOCK_PROPERTIES } from "./mock-data";
import type { Property } from "./types";

export interface VisitRequest {
  id: string;
  propertyId: string;
  slot: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledFor: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  propertyId: string;
  buyerName: string;
  buyerPhoneMasked: string;
  message: string;
  channel: "whatsapp" | "call" | "chat";
  createdAt: string;
  status: "new" | "contacted" | "qualified" | "lost";
}

export interface SellerListing extends Property {
  views: number;
  leadsCount: number;
  status: "draft" | "pending_review" | "active" | "paused" | "sold" | "rejected";
}

export interface SearchAlert {
  id: string;
  label: string;
  filtersDescription: string;
  url: string;
  frequency: "instant" | "daily" | "weekly";
  newCount: number;
}

export interface Conversation {
  id: string;
  withName: string;
  withRole: "owner" | "agent" | "builder" | "support";
  withAvatar?: string;
  propertyId?: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  fromMe: boolean;
  text: string;
  at: string;
  read?: boolean;
}

const now = Date.now();
const isoAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();
const isoIn = (mins: number) => new Date(now + mins * 60_000).toISOString();

export const MOCK_VISITS: VisitRequest[] = [
  { id: "v1", propertyId: "p_003", slot: "3:00 PM", status: "confirmed", scheduledFor: isoIn(60 * 24 * 2 + 60 * 15), createdAt: isoAgo(60 * 18) },
  { id: "v2", propertyId: "p_008", slot: "12:00 PM", status: "pending",   scheduledFor: isoIn(60 * 24 * 4),           createdAt: isoAgo(60 * 4) },
  { id: "v3", propertyId: "p_001", slot: "5:30 PM", status: "completed", scheduledFor: isoAgo(60 * 24 * 3),          createdAt: isoAgo(60 * 24 * 5) },
];

export const MOCK_LEADS: Lead[] = [
  { id: "l1", propertyId: "p_002", buyerName: "Aarav Singh",  buyerPhoneMasked: "+91 98xxxxxx21", message: "Is this available next weekend?", channel: "whatsapp", createdAt: isoAgo(35),   status: "new" },
  { id: "l2", propertyId: "p_003", buyerName: "Meera Iyer",   buyerPhoneMasked: "+91 96xxxxxx88", message: "What's the final price?",         channel: "chat",     createdAt: isoAgo(85),   status: "contacted" },
  { id: "l3", propertyId: "p_004", buyerName: "Karan Mehta",  buyerPhoneMasked: "+91 99xxxxxx14", message: "Can I schedule a site visit?",    channel: "call",     createdAt: isoAgo(220),  status: "qualified" },
  { id: "l4", propertyId: "p_002", buyerName: "Pooja Sharma", buyerPhoneMasked: "+91 90xxxxxx45", message: "Loan options accepted?",          channel: "whatsapp", createdAt: isoAgo(60 * 8), status: "new" },
  { id: "l5", propertyId: "p_005", buyerName: "Rahul Bose",   buyerPhoneMasked: "+91 70xxxxxx02", message: "Floor plan please.",              channel: "chat",     createdAt: isoAgo(60 * 18), status: "lost" },
];

export const MOCK_SELLER_LISTINGS: SellerListing[] = MOCK_PROPERTIES.slice(0, 4).map((p, i) => ({
  ...p,
  views:       320 + Math.round(Math.random() * 1800),
  leadsCount:  MOCK_LEADS.filter((l) => l.propertyId === p.id).length,
  status:      (["active", "active", "pending_review", "paused"] as const)[i] ?? "active",
}));

export const MOCK_SEARCH_ALERTS: SearchAlert[] = [
  { id: "a1", label: "2 BHK Flats in Sodepur", filtersDescription: "Sodepur · Flat · 2 BHK · Up to ₹35 L", url: "/search?kind=flat&bhk=2&q=sodepur&budgetMax=3500000", frequency: "daily", newCount: 3 },
  { id: "a2", label: "Plots near New Town",     filtersDescription: "New Town · Plot · Within 5 km",        url: "/search?kind=plot&q=new+town&radiusKm=5",            frequency: "instant", newCount: 1 },
  { id: "a3", label: "Investment picks under ₹50 L", filtersDescription: "All cities · Trust > 85 · Up to ₹50 L", url: "/search?sort=trust&budgetMax=5000000", frequency: "weekly", newCount: 8 },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "c1", withName: "Rohan Mehta",   withRole: "owner",   withAvatar: "https://i.pravatar.cc/120?img=12", propertyId: "p_002", lastMessage: "I can show it Saturday at 3 PM.",      lastAt: isoAgo(8),   unread: 2 },
  { id: "c2", withName: "Priya Sharma",  withRole: "agent",   withAvatar: "https://i.pravatar.cc/120?img=47", propertyId: "p_003", lastMessage: "Sending the floor plan now.",          lastAt: isoAgo(45),  unread: 0 },
  { id: "c3", withName: "Anik Builders", withRole: "builder", withAvatar: "https://i.pravatar.cc/120?img=33", propertyId: "p_008", lastMessage: "Price is final, but flexible on terms.", lastAt: isoAgo(180), unread: 0 },
  { id: "c4", withName: "AapKaPlot Support", withRole: "support",                                                         lastMessage: "Welcome to AapKaPlot! Need help?",       lastAt: isoAgo(60 * 24 * 2), unread: 0 },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: "m1", conversationId: "c1", fromMe: false, text: "Hi! Saw your interest in the Sodepur flat. Are you looking to move soon?", at: isoAgo(60 * 5) },
    { id: "m2", conversationId: "c1", fromMe: true,  text: "Yes, within the next 2 months. Is the price negotiable?",                    at: isoAgo(60 * 5 - 10) },
    { id: "m3", conversationId: "c1", fromMe: false, text: "There's a small margin. When can you visit?",                                at: isoAgo(60 * 4 - 30) },
    { id: "m4", conversationId: "c1", fromMe: true,  text: "Weekend works. Saturday afternoon?",                                          at: isoAgo(60 * 2) },
    { id: "m5", conversationId: "c1", fromMe: false, text: "I can show it Saturday at 3 PM.",                                             at: isoAgo(8) },
  ],
  c2: [
    { id: "m6", conversationId: "c2", fromMe: false, text: "Hello! I represent the New Town property. Happy to help.", at: isoAgo(60 * 3) },
    { id: "m7", conversationId: "c2", fromMe: true,  text: "Could you share the latest floor plan and amenities list?", at: isoAgo(60 * 2) },
    { id: "m8", conversationId: "c2", fromMe: false, text: "Sending the floor plan now.",                                 at: isoAgo(45) },
  ],
  c3: [
    { id: "m9",  conversationId: "c3", fromMe: false, text: "Quick reminder — the launch offer ends this week.", at: isoAgo(60 * 24) },
    { id: "m10", conversationId: "c3", fromMe: true,  text: "Can you do ₹47 L instead of ₹48.5 L?",              at: isoAgo(60 * 20) },
    { id: "m11", conversationId: "c3", fromMe: false, text: "Price is final, but flexible on terms.",            at: isoAgo(180) },
  ],
  c4: [
    { id: "m12", conversationId: "c4", fromMe: false, text: "Welcome to AapKaPlot! Need help?", at: isoAgo(60 * 24 * 2) },
  ],
};

export function getPropertyById(id: string) {
  return MOCK_PROPERTIES.find((p) => p.id === id);
}

/* ---------- Admin mocks ---------- */
export interface ModerationItem {
  id: string;
  propertyId: string;
  reportedBy?: string;
  reason: "fake-photos" | "duplicate" | "unrealistic-price" | "spam";
  severity: "low" | "medium" | "high";
  createdAt: string;
  status: "open" | "approved" | "rejected";
}

export const MOCK_MODERATION: ModerationItem[] = [
  { id: "mod1", propertyId: "p_006", reason: "duplicate",          severity: "medium", createdAt: isoAgo(60 * 1),  status: "open" },
  { id: "mod2", propertyId: "p_009", reason: "unrealistic-price",  severity: "high",   createdAt: isoAgo(60 * 3),  status: "open" },
  { id: "mod3", propertyId: "p_005", reason: "fake-photos",        severity: "high",   createdAt: isoAgo(60 * 18), status: "open" },
  { id: "mod4", propertyId: "p_010", reason: "spam",               severity: "low",    createdAt: isoAgo(60 * 30), status: "approved" },
];

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: "buyer" | "seller" | "agent" | "admin";
  verified: boolean;
  listings: number;
  joinedAt: string;
  status: "active" | "suspended";
}

export const MOCK_USERS: AdminUser[] = [
  { id: "u_001", name: "Rohan Mehta",   phone: "+91 98xxxxxx12", email: "rohan@example.com",  role: "seller", verified: true,  listings: 3,  joinedAt: "2024-04-12T00:00:00Z", status: "active" },
  { id: "u_002", name: "Priya Sharma",  phone: "+91 98xxxxxx45", email: "priya@example.com",  role: "agent",  verified: true,  listings: 27, joinedAt: "2022-09-03T00:00:00Z", status: "active" },
  { id: "u_003", name: "Anik Builders", phone: "+91 98xxxxxx91", email: "anik@example.com",   role: "seller", verified: true,  listings: 12, joinedAt: "2021-01-21T00:00:00Z", status: "active" },
  { id: "u_004", name: "Aarav Singh",   phone: "+91 98xxxxxx21",                                role: "buyer",  verified: false, listings: 0,  joinedAt: "2025-12-04T00:00:00Z", status: "active" },
  { id: "u_005", name: "Meera Iyer",    phone: "+91 96xxxxxx88", email: "meera@example.com",  role: "buyer",  verified: true,  listings: 0,  joinedAt: "2025-10-19T00:00:00Z", status: "active" },
  { id: "u_006", name: "Spam Account",  phone: "+91 98xxxxxx00",                                role: "buyer",  verified: false, listings: 0,  joinedAt: "2026-05-01T00:00:00Z", status: "suspended" },
];

export const MOCK_ADMIN_KPIS = {
  totalUsers: 24_812,
  activeListings: 18_204,
  monthlyLeads: 4_356,
  monthlyRevenueInr: 18_45_000,
  weeklySignups: 412,
};

/** 24×7 heatmap of search activity (rows = hours, cols = days). */
export function buildHeatmap(): number[][] {
  const rows = 24;
  const cols = 7;
  const data: number[][] = [];
  for (let h = 0; h < rows; h++) {
    const row: number[] = [];
    for (let d = 0; d < cols; d++) {
      // Stronger at evenings + weekends.
      const peak = h >= 17 && h <= 22 ? 0.7 : h >= 10 && h <= 16 ? 0.35 : 0.1;
      const weekendBoost = d >= 5 ? 0.25 : 0;
      row.push(Math.min(1, peak + weekendBoost + Math.random() * 0.15));
    }
    data.push(row);
  }
  return data;
}
