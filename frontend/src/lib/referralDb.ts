export interface BackendReferral {
  id: string;
  caseUuid?: string;
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

export function formatDbDate(value?: string): string {
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

export function formatReferralStatus(status?: string): string {
  switch ((status ?? "").toUpperCase()) {
    case "PENDING":
      return "Pending";
    case "SENT":
      return "Sent";
    case "ACKNOWLEDGED":
      return "Acknowledged";
    case "RECEIVED":
      return "Received";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    case "REJECTED":
      return "Rejected";
    case "CANNOT_ASSIST":
      return "Cannot Assist";
    default:
      return status || "Unknown";
  }
}

export function getReferralStatusClass(status?: string): string {
  switch ((status ?? "").toUpperCase()) {
    case "PENDING":
      return "bg-warning/15 text-warning";
    case "SENT":
      return "bg-primary/15 text-primary";
    case "ACKNOWLEDGED":
    case "RECEIVED":
    case "IN_PROGRESS":
      return "bg-info/15 text-info";
    case "COMPLETED":
      return "bg-success/15 text-success";
    case "REJECTED":
    case "CANNOT_ASSIST":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

export function getReferralUrgencyClass(urgency?: string): string {
  return (urgency ?? "").toUpperCase() === "URGENT"
    ? "bg-destructive/15 text-destructive"
    : "bg-secondary text-muted-foreground";
}

export function getDaysWaiting(createdAt?: string): number {
  if (!createdAt) {
    return 0;
  }

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return 0;
  }

  return Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24)));
}
