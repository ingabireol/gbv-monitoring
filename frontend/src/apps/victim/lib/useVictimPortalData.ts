import { useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  useGetMilestonesQuery,
  useGetMyCasesQuery,
  useGetNotificationsQuery,
  useGetReferralsQuery,
  useGetTimelineEventsQuery,
} from "@/store/api";

export interface VictimCaseRecord {
  id: string;
  caseId: string;
  type: string;
  status: string;
  victim?: {
    name?: string;
    gender?: string;
    age?: number;
    address?: string;
  };
  assignedOfficer?: {
    displayName?: string;
    district?: string;
    institution?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface VictimMilestoneRecord {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
}

export interface VictimReferralRecord {
  id: string;
  caseId: string;
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

export interface VictimTimelineEventRecord {
  id: string;
  eventType?: string;
  description?: string;
  eventAt?: string;
}

export interface VictimNotificationRecord {
  id: string;
  type?: string;
  message?: string;
  read: boolean;
  createdAt?: string;
}

function normalizeStatus(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function rankCaseStatus(status?: string): number {
  switch ((status ?? "").toUpperCase()) {
    case "RESOLVED":
    case "CLOSED":
      return 3;
    case "SUPPORT":
      return 2;
    default:
      return 1;
  }
}

function pickCurrentCase(cases: VictimCaseRecord[]): VictimCaseRecord | null {
  if (!cases.length) {
    return null;
  }

  const sorted = [...cases].sort((left, right) => {
    const leftRank = rankCaseStatus(left.status);
    const rightRank = rankCaseStatus(right.status);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftTime = left.updatedAt ?? left.createdAt ?? "";
    const rightTime = right.updatedAt ?? right.createdAt ?? "";
    return new Date(rightTime).getTime() - new Date(leftTime).getTime();
  });

  return sorted[0];
}

export function formatPortalDate(value?: string, includeTime = false): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(undefined, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "long" });
}

export function formatRelativePortalTime(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatPortalDate(value);
}

export function getMilestoneSteps(milestones: VictimMilestoneRecord[]): string[] {
  return milestones.map((milestone) => milestone.name).filter(Boolean);
}

export function getCurrentStepIndex(milestones: VictimMilestoneRecord[], caseStatus?: string): number {
  if (milestones.length) {
    const nextPending = milestones.findIndex((milestone) => !milestone.completed);
    if (nextPending === -1) {
      return Math.max(milestones.length - 1, 0);
    }
    return nextPending;
  }

  switch ((caseStatus ?? "").toUpperCase()) {
    case "ASSIGNED":
      return 1;
    case "INVESTIGATION":
    case "IN_PROGRESS":
      return 2;
    case "SUPPORT":
      return 3;
    case "RESOLVED":
    case "CLOSED":
      return 4;
    default:
      return 0;
  }
}

export function getOfficerName(record: VictimCaseRecord | null): string {
  return record?.assignedOfficer?.displayName?.trim() || "Not assigned yet";
}

export function getOfficerMeta(record: VictimCaseRecord | null): string {
  const parts = [
    record?.assignedOfficer?.district,
    record?.assignedOfficer?.institution,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Your case is waiting for assignment.";
}

export function getCaseSummaryText(record: VictimCaseRecord | null): string {
  if (!record) {
    return "You have not submitted a report yet.";
  }

  const officerName = getOfficerName(record);
  if (officerName === "Not assigned yet") {
    return "Your report was received and is waiting for assignment.";
  }

  return `Your officer ${officerName} is following up on this case.`;
}

export function useVictimPortalData(selectedCaseId?: string) {
  const currentUser = getCurrentUser();

  const casesQuery = useGetMyCasesQuery(undefined, {
    skip: !currentUser,
    refetchOnMountOrArgChange: true,
  });

  const cases = useMemo<VictimCaseRecord[]>(
    () => ((casesQuery.data?.data ?? []) as VictimCaseRecord[]),
    [casesQuery.data],
  );

  const currentCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId || item.caseId === selectedCaseId) ?? pickCurrentCase(cases),
    [cases, selectedCaseId],
  );

  const timelineQuery = useGetTimelineEventsQuery(currentCase?.id ?? "", {
    skip: !currentCase?.id,
    refetchOnMountOrArgChange: true,
  });

  const milestonesQuery = useGetMilestonesQuery(currentCase?.id ?? "", {
    skip: !currentCase?.id,
    refetchOnMountOrArgChange: true,
  });

  const referralsQuery = useGetReferralsQuery({
    caseId: currentCase?.id ?? "",
    page: 0,
    size: 20,
  }, {
    skip: !currentCase?.id,
    refetchOnMountOrArgChange: true,
  });

  const notificationsQuery = useGetNotificationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
    refetchOnMountOrArgChange: true,
  });

  const timeline = useMemo<VictimTimelineEventRecord[]>(
    () => ((timelineQuery.data?.data ?? []) as VictimTimelineEventRecord[]),
    [timelineQuery.data],
  );

  const milestones = useMemo<VictimMilestoneRecord[]>(
    () => ((milestonesQuery.data?.data ?? []) as VictimMilestoneRecord[]),
    [milestonesQuery.data],
  );

  const referrals = useMemo<VictimReferralRecord[]>(
    () => ((referralsQuery.data?.data?.content ?? []) as VictimReferralRecord[]),
    [referralsQuery.data],
  );

  const notifications = useMemo<VictimNotificationRecord[]>(
    () => ((notificationsQuery.data?.data ?? []) as VictimNotificationRecord[]),
    [notificationsQuery.data],
  );

  return {
    currentUser,
    cases,
    currentCase,
    timeline,
    milestones,
    referrals,
    notifications,
    steps: getMilestoneSteps(milestones),
    currentStepIndex: getCurrentStepIndex(milestones, currentCase?.status),
    normalizedStatus: normalizeStatus(currentCase?.status),
    isLoading: casesQuery.isLoading || casesQuery.isFetching,
    isCaseDetailsLoading:
      timelineQuery.isLoading || timelineQuery.isFetching ||
      milestonesQuery.isLoading || milestonesQuery.isFetching ||
      referralsQuery.isLoading || referralsQuery.isFetching,
    hasError: Boolean(
      casesQuery.error ||
      timelineQuery.error ||
      milestonesQuery.error ||
      referralsQuery.error,
    ),
    refetchAll: () => {
      void casesQuery.refetch();
      if (currentCase?.id) {
        void timelineQuery.refetch();
        void milestonesQuery.refetch();
        void referralsQuery.refetch();
      }
      if (currentUser?.id) {
        void notificationsQuery.refetch();
      }
    },
  };
}
