import { getCurrentUser } from "@/lib/auth";
import { rwandaDistrictData } from "@/components/RwandaMap";

export interface BackendCase {
  id: string;
  caseId: string;
  type: string;
  status: string;
  victim?: {
    name?: string;
    age?: number | null;
    address?: string;
  };
  assignedOfficer?: {
    id?: string;
    username?: string;
    email?: string;
  } | null;
  victimAccountId?: string | null;
  victimDistrict?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DistrictCaseRow {
  id: string;
  uuid: string;
  victimAccountId?: string | null;
  victimName: string;
  type: string;
  status: "Critical" | "Accepted" | "Rejected" | "In Progress" | "Active" | "Pending" | "Resolved";
  district: string;
  assignedOfficer: string;
  assignedOfficerId?: string;
  createdAt?: string;
  updatedAt?: string;
  reportedDate: string;
  daysOpen: number;
  isChildCase: boolean;
}

export interface BackendUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  role?: string;
  enabled?: boolean;
  district?: string;
  institution?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export function getCurrentDistrict(): string | null {
  return getCurrentUser()?.district?.trim() || null;
}

export function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDaysOpen(createdAt?: string): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

export function normalizeDistrictStatus(status?: string, createdAt?: string): DistrictCaseRow["status"] {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized.includes("RESOLVED") || normalized.includes("CLOSED")) return "Resolved";
  if (normalized.includes("REJECTED")) return "Rejected";
  if (normalized.includes("ACCEPTED")) return "Accepted";
  if (normalized.includes("IN_PROGRESS") || normalized.includes("INVESTIGATION")) return "In Progress";
  if (normalized.includes("PENDING") || normalized.includes("FILED")) return "Pending";
  if (createdAt) {
    const daysOpen = getDaysOpen(createdAt);
    if (daysOpen > 14) return "Critical";
  }
  return "Active";
}

export function mapBackendCasesToDistrictRows(items: BackendCase[]): DistrictCaseRow[] {
  return items.map((item) => ({
    id: item.caseId || item.id,
    uuid: item.id,
    victimAccountId: item.victimAccountId,
    victimName: item.victim?.name || "Unknown victim",
    type: item.type || "Unknown type",
    status: normalizeDistrictStatus(item.status, item.createdAt),
    district: item.victim?.address || item.victimDistrict || "Unknown district",
    assignedOfficer: item.assignedOfficer?.username || item.assignedOfficer?.email || "Unassigned",
    assignedOfficerId: item.assignedOfficer?.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    reportedDate: formatDateTime(item.createdAt),
    daysOpen: getDaysOpen(item.createdAt),
    isChildCase: Boolean(item.victim?.age !== null && item.victim?.age !== undefined && item.victim.age < 18),
  }));
}

export function scopeCasesToDistrict(cases: DistrictCaseRow[], district?: string | null): DistrictCaseRow[] {
  const resolvedDistrict = district?.trim() || getCurrentDistrict();
  if (!resolvedDistrict) {
    return cases;
  }

  return cases.filter((item) => item.district.trim().toLowerCase() === resolvedDistrict.toLowerCase());
}

export function scopeUsersToDistrict(users: BackendUser[], district?: string | null): BackendUser[] {
  const resolvedDistrict = district?.trim() || getCurrentDistrict();
  if (!resolvedDistrict) {
    return users;
  }

  return users.filter((item) => (item.district ?? "").trim().toLowerCase() === resolvedDistrict.toLowerCase());
}

export function getDistrictCoordinates(name: string): { lat: number; lng: number } | null {
  const district = rwandaDistrictData.find((item) => item.name === name);
  if (!district) return null;
  return { lat: district.lat, lng: district.lng };
}

export function getMonthLabel(monthOffset: number): string {
  const now = new Date();
  const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  return monthDate.toLocaleDateString("en-RW", { month: "short" });
}
