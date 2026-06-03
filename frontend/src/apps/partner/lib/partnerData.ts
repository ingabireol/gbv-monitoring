import { StoredUser } from "@/lib/auth";
import { BackendCase, formatDate, formatDateTime } from "@/lib/adminData";
import { BackendReferral, formatDbDate, formatReferralStatus, getDaysWaiting, getReferralStatusClass, getReferralUrgencyClass } from "@/lib/referralDb";

export interface PartnerReferralRow {
  id: string;
  caseId: string;
  caseUuid?: string;
  victimName: string;
  caseType: string;
  referredBy: string;
  referredTo: string;
  status: string;
  statusLabel: string;
  urgencyLabel: string;
  urgencyClass: string;
  statusClass: string;
  referredDate: string;
  updatedDate: string;
  daysWaiting: number;
  serviceName: string;
  progress: number;
}

export function getPartnerInstitutionName(user: StoredUser | null): string {
  return user?.institution?.trim() || user?.name?.trim() || "Partner institution";
}

export function getPartnerLocation(user: StoredUser | null): string {
  return user?.district?.trim() || "Location not set";
}

export function getPartnerAccountLabel(user: StoredUser | null): string {
  return user?.email || user?.username || user?.id || "Partner account";
}

export function filterPartnerReferrals(referrals: BackendReferral[], user: StoredUser | null): BackendReferral[] {
  const institution = getPartnerInstitutionName(user).toLowerCase();
  return referrals.filter((item) => (item.referredTo || "").trim().toLowerCase() === institution);
}

export function getServiceName(referral: BackendReferral, linkedCase?: BackendCase | null): string {
  const text = `${referral.reason || ""} ${referral.institutionType || ""} ${linkedCase?.type || referral.caseType || ""}`.toLowerCase();

  if (text.includes("medical") || text.includes("exam") || text.includes("sexual") || text.includes("isange")) {
    return "Medical Support";
  }
  if (text.includes("psycho") || text.includes("counsel") || text.includes("mental")) {
    return "Psychosocial Support";
  }
  if (text.includes("legal") || text.includes("court") || text.includes("justice")) {
    return "Legal Aid";
  }
  if (text.includes("shelter") || text.includes("safe house") || text.includes("housing")) {
    return "Shelter Support";
  }
  if (text.includes("child") || text.includes("ca") || text.includes("protection")) {
    return "Child Protection";
  }
  return "Case Follow-Up";
}

export function getProgressFromStatus(status?: string): number {
  switch ((status ?? "").toUpperCase()) {
    case "PENDING":
      return 20;
    case "SENT":
      return 30;
    case "ACKNOWLEDGED":
      return 50;
    case "IN_PROGRESS":
      return 75;
    case "COMPLETED":
      return 100;
    case "CANNOT_ASSIST":
      return 100;
    default:
      return 0;
  }
}

export function mapPartnerReferralRows(referrals: BackendReferral[], cases: BackendCase[]): PartnerReferralRow[] {
  return referrals.map((item) => {
    const linkedCase = cases.find((entry) => entry.id === item.caseUuid || entry.caseId === item.caseId) || null;
    return {
      id: item.id,
      caseId: item.caseId || linkedCase?.caseId || item.caseUuid || item.id,
      caseUuid: item.caseUuid,
      victimName: item.victimName || linkedCase?.victim?.name || "Unknown victim",
      caseType: linkedCase?.type || item.caseType || "Case support",
      referredBy: item.referredBy || "System user",
      referredTo: item.referredTo || "Receiving institution pending",
      status: item.status || "PENDING",
      statusLabel: formatReferralStatus(item.status),
      urgencyLabel: (item.urgency || "NORMAL").toLowerCase(),
      urgencyClass: getReferralUrgencyClass(item.urgency),
      statusClass: getReferralStatusClass(item.status),
      referredDate: formatDbDate(item.createdAt),
      updatedDate: formatDate(item.updatedAt || item.createdAt),
      daysWaiting: getDaysWaiting(item.createdAt),
      serviceName: getServiceName(item, linkedCase),
      progress: getProgressFromStatus(item.status),
    };
  });
}

export function formatPartnerDateTime(value?: string): string {
  return formatDateTime(value);
}
