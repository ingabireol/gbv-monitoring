import { getCurrentUser } from "@/lib/auth";

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
    username?: string;
    email?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export type SocialWorkerPriority = "Critical" | "High" | "Medium" | "Low";
export type SocialWorkerStatus = "Accepted" | "Rejected" | "Active" | "Pending" | "Overdue" | "Resolved";

export interface SocialWorkerCaseRow {
  id: string;
  uuid: string;
  victimName: string;
  type: string;
  district: string;
  status: SocialWorkerStatus;
  priority: SocialWorkerPriority;
  officer: string;
  daysOpen: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
  isChildCase: boolean;
}

export const INCIDENT_TYPES = [
  "Domestic Violence",
  "Sexual Assault",
  "Child Neglect",
  "Physical Abuse",
  "Emotional Abuse",
  "Child Labor",
  "Early Marriage",
  "Economic Abuse",
  "Stalking/Harassment",
];

export const DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro",
];

export function getDaysOpen(createdAt?: string): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24)));
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
  if (!value) return "Unknown";
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

export function normalizeStatus(status?: string, daysOpen?: number): SocialWorkerStatus {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized.includes("RESOLVED") || normalized.includes("CLOSED")) return "Resolved";
  if (normalized.includes("REJECTED")) return "Rejected";
  if (normalized.includes("ACCEPTED")) return "Accepted";
  if (normalized.includes("IN_PROGRESS") || normalized.includes("INVESTIGATION")) return "Active";
  if ((daysOpen ?? 0) > 14) return "Overdue";
  if (normalized.includes("PENDING") || normalized.includes("FILED")) return "Pending";
  return "Active";
}

export function normalizePriority(status: SocialWorkerStatus, daysOpen: number): SocialWorkerPriority {
  if (status === "Resolved" || status === "Rejected") return "Low";
  if (status === "Overdue" || daysOpen > 10) return "Critical";
  if (daysOpen > 6) return "High";
  if (daysOpen > 2) return "Medium";
  return "Low";
}

export function mapBackendCasesToRows(items: BackendCase[]): SocialWorkerCaseRow[] {
  return items.map((item) => {
    const daysOpen = getDaysOpen(item.createdAt);
    const status = normalizeStatus(item.status, daysOpen);
    const priority = normalizePriority(status, daysOpen);

    return {
      id: item.caseId || item.id,
      uuid: item.id,
      victimName: item.victim?.name || "Unknown victim",
      type: item.type || "Unknown type",
      district: item.victim?.address || "Unknown district",
      status,
      priority,
      officer: item.assignedOfficer?.username || item.assignedOfficer?.email || "Unassigned",
      daysOpen,
      lastUpdated: formatDate(item.updatedAt),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isChildCase: Boolean(item.victim?.age !== null && item.victim?.age !== undefined && item.victim.age < 18),
    };
  });
}

export function mapIncidentTypeToCaseType(incidentType: string): string {
  const normalized = incidentType.toLowerCase();
  if (normalized.includes("child") || normalized.includes("early marriage")) {
    return "CA";
  }
  return "GBV";
}

export function getScopedDistrictCases(cases: SocialWorkerCaseRow[]): SocialWorkerCaseRow[] {
  const currentUser = getCurrentUser();
  const district = currentUser?.district?.trim();
  if (!district) {
    return cases;
  }

  const districtMatches = cases.filter((item) => item.district.trim().toLowerCase() === district.toLowerCase());
  return districtMatches.length > 0 ? districtMatches : cases;
}
