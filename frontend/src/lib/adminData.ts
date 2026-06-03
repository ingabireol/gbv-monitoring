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

export interface BackendUser {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  role?: string;
  enabled?: boolean;
  district?: string;
  institution?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export type AdminCaseStatus = "Critical" | "Accepted" | "Rejected" | "In Progress" | "Pending" | "Resolved";

export interface AdminCaseRow {
  id: string;
  uuid: string;
  victimAccountId?: string | null;
  victimDistrict?: string | null;
  victimName: string;
  type: string;
  district: string;
  status: AdminCaseStatus;
  officer: string;
  createdAt?: string;
  updatedAt?: string;
  reportedDate: string;
  lastUpdated: string;
  daysOpen: number;
  isAssigned: boolean;
  isChildCase: boolean;
}

export interface NamedValue {
  name: string;
  value: number;
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

export const CASE_STATUS_CLASSES: Record<AdminCaseStatus, string> = {
  Critical: "status-critical",
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Pending: "status-pending",
  "In Progress": "status-in-progress",
  Resolved: "status-resolved",
};

export function formatDate(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDaysOpen(createdAt?: string): number {
  if (!createdAt) {
    return 0;
  }

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return 0;
  }

  return Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

export function normalizeCaseStatus(status?: string, assignedOfficer?: BackendCase["assignedOfficer"], daysOpen = 0): AdminCaseStatus {
  const normalized = status?.toUpperCase() ?? "";

  if (normalized.includes("RESOLVED") || normalized.includes("CLOSED")) {
    return "Resolved";
  }
  if (normalized.includes("REJECTED")) {
    return "Rejected";
  }
  if (normalized.includes("ACCEPTED")) {
    return "Accepted";
  }
  if (normalized.includes("IN_PROGRESS") || normalized.includes("INVESTIGATION")) {
    return "In Progress";
  }
  if (normalized.includes("CRITICAL") || daysOpen > 14) {
    return "Critical";
  }
  if (normalized.includes("PENDING") || normalized.includes("FILED") || !assignedOfficer?.id) {
    return "Pending";
  }
  return "In Progress";
}

export function mapCasesToAdminRows(items: BackendCase[]): AdminCaseRow[] {
  return items.map((item) => {
    const daysOpen = getDaysOpen(item.createdAt);
    const isAssigned = Boolean(item.assignedOfficer?.id || item.assignedOfficer?.username || item.assignedOfficer?.email);
    const status = normalizeCaseStatus(item.status, item.assignedOfficer, daysOpen);

    return {
      id: item.caseId || item.id,
      uuid: item.id,
      victimAccountId: item.victimAccountId,
      victimDistrict: item.victimDistrict,
      victimName: item.victim?.name || "Unknown victim",
      type: item.type || "Unknown type",
      district: item.victim?.address || item.victimDistrict || "Unknown district",
      status,
      officer: item.assignedOfficer?.username || item.assignedOfficer?.email || "Unassigned",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      reportedDate: formatDate(item.createdAt),
      lastUpdated: formatDate(item.updatedAt),
      daysOpen,
      isAssigned,
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

export function getCasePriorityScore(status: AdminCaseStatus, daysOpen: number, isAssigned: boolean): number {
  if (status === "Resolved" || status === "Rejected") {
    return 20;
  }

  const base = status === "Critical"
    ? 90
    : status === "Pending"
      ? 60
      : 72;

  const ageBoost = Math.min(daysOpen * 2, 20);
  const assignmentBoost = isAssigned ? 0 : 10;
  return Math.min(100, base + ageBoost + assignmentBoost);
}

export function getPriorityBarClass(score: number): string {
  if (score >= 80) return "bg-destructive";
  if (score >= 60) return "bg-warning";
  return "bg-info";
}

export function getPriorityTextClass(score: number): string {
  if (score >= 80) return "text-destructive";
  if (score >= 60) return "text-warning";
  return "text-info";
}

export function mapRecordToChartData(record: Record<string, unknown> | undefined): NamedValue[] {
  if (!record) {
    return [];
  }

  return Object.entries(record)
    .map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
}

export function buildMonthlyCaseSeries(items: AdminCaseRow[], months = 6): Array<{ month: string; cases: number; resolved: number }> {
  return Array.from({ length: months }, (_, index) => {
    const offset = months - index - 1;
    const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    const cases = items.filter((item) => {
      if (!item.createdAt) return false;
      const date = new Date(item.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;

    const resolved = items.filter((item) => {
      if (item.status !== "Resolved" || !item.updatedAt) return false;
      const date = new Date(item.updatedAt);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;

    return {
      month: monthDate.toLocaleDateString("en-RW", { month: "short" }),
      cases,
      resolved,
    };
  });
}

export function buildDistrictBreakdown(items: AdminCaseRow[]): Array<{ district: string; total: number; resolved: number; pending: number; critical: number; rate: number }> {
  const grouped = new Map<string, { district: string; total: number; resolved: number; pending: number; critical: number }>();

  items.forEach((item) => {
    const key = item.district || "Unknown district";
    const current = grouped.get(key) || { district: key, total: 0, resolved: 0, pending: 0, critical: 0 };
    current.total += 1;
    if (item.status === "Resolved") current.resolved += 1;
    if (item.status === "Pending") current.pending += 1;
    if (item.status === "Critical") current.critical += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      rate: item.total ? Math.round((item.resolved / item.total) * 100) : 0,
    }))
    .sort((left, right) => right.total - left.total);
}

export function buildTypeBreakdown(items: AdminCaseRow[]): NamedValue[] {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
}

export function getRoleLabel(role?: string): string {
  switch ((role ?? "").toUpperCase()) {
    case "ADMIN":
      return "System Administrator";
    case "POLICE":
      return "Police Officer";
    case "SOCIAL_WORKER":
      return "Social Worker";
    case "DISTRICT_ADMIN":
      return "District Administrator";
    case "PARTNER":
      return "Partner Officer";
    case "VICTIM":
      return "Victim";
    default:
      return "Team Member";
  }
}

export function getUserDisplayName(user?: Pick<BackendUser, "displayName" | "username" | "email"> | null): string {
  if (!user) {
    return "Unknown user";
  }
  return user.displayName || user.username || user.email || "Unknown user";
}

export function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "NA";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
