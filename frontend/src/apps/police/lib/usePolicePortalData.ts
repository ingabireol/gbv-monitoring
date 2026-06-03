import { useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  useGetAllReferralsQuery,
  useGetAssignedCasesQuery,
  useGetAssignedTimelineEventsQuery,
  useGetCasesQuery,
  useGetUsersQuery,
} from "@/store/api";

export interface PoliceCaseRecord {
  id: string;
  caseId: string;
  type: string;
  status: string;
  victimAccountId?: string | null;
  victim?: {
    name?: string;
    address?: string;
  };
  assignedOfficer?: {
    id?: string;
    username?: string;
    email?: string;
    displayName?: string;
    district?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  reportType?: string | null;
  incidentAt?: string | null;
  incidentLocation?: string | null;
  reporterName?: string | null;
  reporterContact?: string | null;
  witnessName?: string | null;
  witnessContact?: string | null;
  witnessLocation?: string | null;
}

export interface PoliceTimelineRecord {
  id: string;
  eventType?: string;
  description?: string;
  eventAt?: string;
}

export interface PoliceReferralRecord {
  id: string;
  caseUuid: string;
  caseId?: string;
  caseType?: string;
  victimName?: string;
  referredTo?: string;
  referredBy?: string;
  referredByRole?: string;
  institutionType?: string;
  reason?: string;
  urgency?: string;
  status?: string;
  dateAcknowledged?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PoliceUserRecord {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  district?: string;
}

export type PoliceUiStatus = "Accepted" | "Rejected" | "Active" | "Pending Review" | "Overdue" | "Resolved";
export type PoliceUiPriority = "Critical" | "High" | "Medium" | "Low";

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

export function formatPoliceDate(value?: string, includeTime = false): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString(undefined, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" });
}

export function normalizePoliceStatus(status?: string, daysOpen = 0): PoliceUiStatus {
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
    return "Active";
  }
  if (daysOpen > 14) {
    return "Overdue";
  }
  if (normalized.includes("PENDING") || normalized.includes("FILED")) {
    return "Pending Review";
  }
  return "Active";
}

export function normalizePolicePriority(status: PoliceUiStatus, daysOpen: number): PoliceUiPriority {
  if (status === "Resolved" || status === "Rejected") {
    return "Low";
  }
  if (status === "Overdue" || daysOpen > 10) {
    return "Critical";
  }
  if (daysOpen > 6) {
    return "High";
  }
  if (daysOpen > 2) {
    return "Medium";
  }
  return "Low";
}

export function getPoliceOfficerName(currentUser: ReturnType<typeof getCurrentUser>): string {
  return currentUser?.name || currentUser?.username || "Police Officer";
}

export function getPoliceOfficerMeta(currentUser: ReturnType<typeof getCurrentUser>): string {
  const parts = [
    currentUser?.district,
    currentUser?.institution,
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : "Police Portal";
}

function buildMonthBuckets(cases: PoliceCaseRecord[]) {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short" });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: formatter.format(date),
      gbv: 0,
      child: 0,
      resolved: 0,
      total: 0,
    };
  });

  cases.forEach((item) => {
    const created = item.createdAt ? new Date(item.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) {
      return;
    }
    const key = `${created.getFullYear()}-${created.getMonth()}`;
    const bucket = months.find((entry) => entry.key === key);
    if (!bucket) {
      return;
    }
    if ((item.type ?? "").toUpperCase() === "CA") {
      bucket.child += 1;
    } else {
      bucket.gbv += 1;
    }
    bucket.total += 1;
    if ((item.status ?? "").toUpperCase().includes("RESOLVED")) {
      bucket.resolved += 1;
    }
  });

  return months;
}

export function usePolicePortalData() {
  const currentUser = getCurrentUser();

  const assignedCasesQuery = useGetAssignedCasesQuery(undefined, {
    skip: !currentUser,
    refetchOnMountOrArgChange: true,
  });
  const allCasesQuery = useGetCasesQuery({ page: 0, size: 300 }, {
    skip: !currentUser,
    refetchOnMountOrArgChange: true,
  });
  const timelineQuery = useGetAssignedTimelineEventsQuery(undefined, {
    skip: !currentUser,
    refetchOnMountOrArgChange: true,
  });
  const referralsQuery = useGetAllReferralsQuery({ page: 0, size: 300 }, {
    skip: !currentUser,
    refetchOnMountOrArgChange: true,
  });
  const officersQuery = useGetUsersQuery({ role: "POLICE", enabled: true });

  const assignedCases = useMemo<PoliceCaseRecord[]>(
    () => ((assignedCasesQuery.data?.data ?? []) as PoliceCaseRecord[]),
    [assignedCasesQuery.data],
  );
  const allCases = useMemo<PoliceCaseRecord[]>(
    () => ((allCasesQuery.data?.data?.content ?? []) as PoliceCaseRecord[]),
    [allCasesQuery.data],
  );
  const timelineEvents = useMemo<PoliceTimelineRecord[]>(
    () => ((timelineQuery.data?.data ?? []) as PoliceTimelineRecord[]),
    [timelineQuery.data],
  );
  const allReferrals = useMemo<PoliceReferralRecord[]>(
    () => ((referralsQuery.data?.data?.content ?? []) as PoliceReferralRecord[]),
    [referralsQuery.data],
  );
  const policeUsers = useMemo<PoliceUserRecord[]>(
    () => ((officersQuery.data?.data ?? []) as PoliceUserRecord[]),
    [officersQuery.data],
  );

  const assignedCaseIds = useMemo(
    () => new Set(assignedCases.map((item) => item.id)),
    [assignedCases],
  );

  const districtCases = useMemo(
    () => allCases.filter((item) => item.victim?.address === currentUser?.district),
    [allCases, currentUser?.district],
  );

  const casesByDistrict = useMemo(() => {
    const counts = allCases.reduce<Record<string, number>>((acc, item) => {
      const district = item.victim?.address || "Unknown";
      acc[district] = (acc[district] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([district, cases]) => ({ district, cases }))
      .sort((left, right) => right.cases - left.cases)
      .slice(0, 6);
  }, [allCases]);

  const relatedReferrals = useMemo(
    () => allReferrals.filter((item) =>
      assignedCaseIds.has(item.caseUuid)
      || item.referredBy === currentUser?.name
      || item.referredBy === currentUser?.username,
    ),
    [allReferrals, assignedCaseIds, currentUser?.name, currentUser?.username],
  );

  const assignedSummary = useMemo(() => assignedCases.map((item) => {
    const daysOpen = getDaysOpen(item.createdAt);
    const uiStatus = normalizePoliceStatus(item.status, daysOpen);
    const priority = normalizePolicePriority(uiStatus, daysOpen);
    return {
      ...item,
      daysOpen,
      uiStatus,
      priority,
    };
  }), [assignedCases]);

  const monthlyVolume = useMemo(
    () => buildMonthBuckets(districtCases).map((item) => ({
      month: item.month,
      gbv: item.gbv,
      child: item.child,
    })),
    [districtCases],
  );

  const resolutionTrend = useMemo(
    () => buildMonthBuckets(districtCases).map((item) => ({
      month: item.month,
      rate: item.total ? Math.round((item.resolved / item.total) * 100) : 0,
    })),
    [districtCases],
  );

  const typeDistribution = useMemo(() => {
    const counts = districtCases.reduce<Record<string, number>>((acc, item) => {
      const key = (item.type ?? "").toUpperCase() === "CA" ? "Child Abuse" : "GBV";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [districtCases]);

  const officerPerformance = useMemo(() => {
    const officerMap = policeUsers
      .filter((user) => !currentUser?.district || user.district === currentUser.district)
      .map((user) => {
        const officerCases = allCases.filter((item) => item.assignedOfficer?.id === user.id);
        const resolved = officerCases.filter((item) => (item.status ?? "").toUpperCase().includes("RESOLVED")).length;
        return {
          label: user.displayName || user.username || "Officer",
          assigned: officerCases.length,
          resolved,
        };
      });

    const currentOfficer = officerMap.find((item) => item.label === (currentUser?.name || currentUser?.username));
    const others = officerMap.filter((item) => item.label !== (currentUser?.name || currentUser?.username));
    const avgAssigned = others.length ? Math.round(others.reduce((sum, item) => sum + item.assigned, 0) / others.length) : 0;
    const avgResolved = others.length ? Math.round(others.reduce((sum, item) => sum + item.resolved, 0) / others.length) : 0;

    return [
      currentOfficer ?? { label: getPoliceOfficerName(currentUser), assigned: assignedCases.length, resolved: assignedCases.filter((item) => (item.status ?? "").toUpperCase().includes("RESOLVED")).length },
      { label: "District Average", assigned: avgAssigned, resolved: avgResolved },
    ];
  }, [allCases, assignedCases, currentUser, policeUsers]);

  const districtResolutionRate = districtCases.length
    ? Math.round((districtCases.filter((item) => (item.status ?? "").toUpperCase().includes("RESOLVED")).length / districtCases.length) * 100)
    : 0;

  const averageDaysToResolve = (() => {
    const resolved = districtCases.filter((item) => (item.status ?? "").toUpperCase().includes("RESOLVED"));
    if (!resolved.length) {
      return 0;
    }
    const total = resolved.reduce((sum, item) => {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      const updated = item.updatedAt ? new Date(item.updatedAt).getTime() : created;
      if (!created || !updated) {
        return sum;
      }
      return sum + Math.max(0, Math.round((updated - created) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Math.round(total / resolved.length);
  })();

  const recentActivity = useMemo(
    () => timelineEvents.slice(0, 8),
    [timelineEvents],
  );

  return {
    currentUser,
    assignedCases,
    allCases,
    assignedSummary,
    districtCases,
    casesByDistrict,
    relatedReferrals,
    recentActivity,
    monthlyVolume,
    resolutionTrend,
    typeDistribution,
    officerPerformance,
    districtResolutionRate,
    averageDaysToResolve,
    isLoading:
      assignedCasesQuery.isLoading || assignedCasesQuery.isFetching ||
      allCasesQuery.isLoading || allCasesQuery.isFetching ||
      timelineQuery.isLoading || timelineQuery.isFetching ||
      referralsQuery.isLoading || referralsQuery.isFetching,
    refetchAll: () => {
      void assignedCasesQuery.refetch();
      void allCasesQuery.refetch();
      void timelineQuery.refetch();
      void referralsQuery.refetch();
    },
  };
}
