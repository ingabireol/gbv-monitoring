export interface AnonymousReport {
  referenceNumber: string;
  status: "received" | "under-review" | "closed";
  incidentType: string;
  district: string;
  dateSubmitted: string;
  lastUpdated: string;
  message: string;
}

let anonymousReports: AnonymousReport[] = [
  {
    referenceNumber: "ANON-2024-7823",
    status: "under-review",
    incidentType: "Domestic Violence",
    district: "Gasabo",
    dateSubmitted: "2024-03-12",
    lastUpdated: "2024-03-14",
    message: "Your report is being reviewed by a social protection officer. No further action is required from you at this time.",
  },
  {
    referenceNumber: "ANON-2024-5641",
    status: "closed",
    incidentType: "Child Neglect",
    district: "Huye",
    dateSubmitted: "2024-03-08",
    lastUpdated: "2024-03-18",
    message: "Your report has been reviewed and appropriate action has been taken. Thank you for your courage in reporting.",
  },
];

export function addAnonymousReport(report: Omit<AnonymousReport, "referenceNumber">): string {
  const refNumber = `ANON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  anonymousReports.push({ ...report, referenceNumber: refNumber });
  return refNumber;
}

export function findAnonymousReport(referenceNumber: string): AnonymousReport | null {
  return anonymousReports.find(r =>
    r.referenceNumber.toLowerCase() === referenceNumber.toLowerCase()
  ) || null;
}
