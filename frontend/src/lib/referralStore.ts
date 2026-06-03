export interface SharedReferral {
  id: string;
  caseId: string;
  victimId: string;
  referredBy: string;
  referredByRole: string;
  institution: string;
  institutionType: string;
  reason: string;
  urgency: "normal" | "urgent";
  status: "sent" | "acknowledged" | "in-progress" | "completed" | "cannot-assist";
  dateSent: string;
  dateAcknowledged?: string;
  dateCompleted?: string;
  notes?: string;
  daysWaiting: number;
}

// Shared referral data accessible across all portals
let referrals: SharedReferral[] = [
  {
    id: "REF-001",
    caseId: "GBV-2024-0142",
    victimId: "Victim #00142",
    referredBy: "Amina Uwase",
    referredByRole: "Social Worker",
    institution: "Isange One Stop Centre",
    institutionType: "Medical",
    reason: "Victim requires immediate medical examination and psychological support following domestic violence incident.",
    urgency: "urgent",
    status: "acknowledged",
    dateSent: "2024-03-15",
    dateAcknowledged: "2024-03-15",
    daysWaiting: 4,
  },
  {
    id: "REF-002",
    caseId: "CA-2024-0089",
    victimId: "Child #00089",
    referredBy: "Amina Uwase",
    referredByRole: "Social Worker",
    institution: "National Child Development Agency",
    institutionType: "Government",
    reason: "Child neglect case requiring foster care assessment and school reintegration support.",
    urgency: "urgent",
    status: "in-progress",
    dateSent: "2024-03-14",
    dateAcknowledged: "2024-03-14",
    daysWaiting: 5,
  },
  {
    id: "REF-003",
    caseId: "GBV-2024-0138",
    victimId: "Victim #00138",
    referredBy: "Sgt. Uwimana",
    referredByRole: "Police Officer",
    institution: "Rwanda Legal Aid Forum",
    institutionType: "Legal",
    reason: "Victim needs legal representation for court proceedings related to sexual assault case.",
    urgency: "normal",
    status: "sent",
    dateSent: "2024-03-16",
    daysWaiting: 3,
  },
  {
    id: "REF-004",
    caseId: "GBV-2024-0135",
    victimId: "Victim #00135",
    referredBy: "Amina Uwase",
    referredByRole: "Social Worker",
    institution: "Rwanda Mental Health Programme",
    institutionType: "Medical",
    reason: "Victim showing signs of severe trauma and PTSD following prolonged emotional abuse.",
    urgency: "normal",
    status: "completed",
    dateSent: "2024-03-10",
    dateAcknowledged: "2024-03-11",
    dateCompleted: "2024-03-18",
    daysWaiting: 0,
  },
  {
    id: "REF-005",
    caseId: "GBV-2024-0130",
    victimId: "Victim #00130",
    referredBy: "Sgt. Uwimana",
    referredByRole: "Police Officer",
    institution: "Isange One Stop Centre",
    institutionType: "Medical",
    reason: "Critical domestic violence case requiring immediate medical attention and police statement.",
    urgency: "urgent",
    status: "sent",
    dateSent: "2024-03-17",
    daysWaiting: 2,
  },
];

// Get all referrals
export function getAllReferrals(): SharedReferral[] {
  return [...referrals];
}

// Get referrals for a specific institution
export function getReferralsByInstitution(institution: string): SharedReferral[] {
  return referrals.filter(r => r.institution === institution);
}

// Get referrals created by a specific person
export function getReferralsByCreator(name: string): SharedReferral[] {
  return referrals.filter(r => r.referredBy === name);
}

// Add a new referral
export function addReferral(referral: Omit<SharedReferral, "id" | "daysWaiting">): SharedReferral {
  const newReferral: SharedReferral = {
    ...referral,
    id: `REF-${String(referrals.length + 1).padStart(3, "0")}`,
    daysWaiting: 0,
  };
  referrals = [newReferral, ...referrals];
  return newReferral;
}

// Update referral status
export function updateReferralStatus(
  id: string,
  status: SharedReferral["status"],
  notes?: string
): SharedReferral | null {
  const index = referrals.findIndex(r => r.id === id);
  if (index === -1) return null;

  referrals[index] = {
    ...referrals[index],
    status,
    notes: notes || referrals[index].notes,
    dateAcknowledged: status === "acknowledged" || status === "in-progress" || status === "completed"
      ? referrals[index].dateAcknowledged || new Date().toISOString().split("T")[0]
      : referrals[index].dateAcknowledged,
    dateCompleted: status === "completed"
      ? new Date().toISOString().split("T")[0]
      : referrals[index].dateCompleted,
  };

  return referrals[index];
}
