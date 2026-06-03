import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Search,
  Shield,
  Trash2,
  UserCheck,
} from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  formatPortalDate,
  getOfficerMeta,
  getOfficerName,
  useVictimPortalData,
} from "@/apps/victim/lib/useVictimPortalData";
import { CaseTimeline, TimelineEvent } from "@/components/CaseTimeline";
import { useDeleteCaseMutation, useUpdateVictimCaseDetailsMutation, useWithdrawVictimCaseMutation } from "@/store/api";
import { toast } from "sonner";

const DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro",
];

function toTitleCase(value?: string): string {
  if (!value) {
    return "Case Update";
  }

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapEventType(value?: string): TimelineEvent["type"] {
  const normalized = (value ?? "").toUpperCase();
  if (normalized.includes("ASSIGN")) {
    return "assignment";
  }
  if (normalized.includes("SUPPORT")) {
    return "support";
  }
  if (normalized.includes("ALERT")) {
    return "alert";
  }
  if (normalized.includes("CLOSE") || normalized.includes("RESOLVE")) {
    return "closed";
  }
  return "case";
}

function normalizeStatusLabel(status?: string): string {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusBucket(status?: string): "Open" | "Resolved" | "All" {
  const normalized = (status ?? "").toUpperCase();
  return normalized.includes("RESOLVED") || normalized.includes("CLOSED") || normalized.includes("WITHDRAWN") ? "Resolved" : "Open";
}

function canVictimManageCase(status?: string): boolean {
  const normalized = (status ?? "").toUpperCase();
  return !normalized.includes("RESOLVED") && !normalized.includes("CLOSED") && !normalized.includes("WITHDRAWN");
}

const VictimCaseStatusLive = () => {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Resolved">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editDistrict, setEditDistrict] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateVictimCaseDetails, { isLoading: isUpdatingCase }] = useUpdateVictimCaseDetailsMutation();
  const [withdrawVictimCase, { isLoading: isWithdrawingCase }] = useWithdrawVictimCaseMutation();
  const [deleteCase, { isLoading: isDeletingCase }] = useDeleteCaseMutation();
  const {
    cases,
    currentCase,
    timeline,
    milestones,
    referrals,
    normalizedStatus,
    isLoading,
    isCaseDetailsLoading,
    refetchAll,
  } = useVictimPortalData(selectedCaseId);

  useEffect(() => {
    if (!selectedCaseId && currentCase) {
      setSelectedCaseId(currentCase.id);
    }
  }, [currentCase, selectedCaseId]);

  const canManageCurrentCase = canVictimManageCase(currentCase?.status);

  const openEditDialog = () => {
    if (!currentCase) return;
    setEditDistrict(currentCase.victim?.address || "");
    setEditOpen(true);
  };

  const handleUpdateCase = async () => {
    if (!currentCase || !editDistrict.trim()) {
      toast.error("Please choose the district for this case.");
      return;
    }
    try {
      await updateVictimCaseDetails({ id: currentCase.id, victimAddress: editDistrict.trim() }).unwrap();
      toast.success("Case details updated");
      setEditOpen(false);
      refetchAll();
    } catch {
      toast.error("Unable to update case details");
    }
  };

  const handleWithdrawCase = async () => {
    if (!currentCase) return;
    try {
      await withdrawVictimCase(currentCase.id).unwrap();
      toast.success("Case withdrawn");
      setWithdrawOpen(false);
      refetchAll();
    } catch {
      toast.error("Unable to withdraw this case");
    }
  };

  const handleDeleteCase = async () => {
    if (!currentCase) return;
    try {
      await deleteCase(currentCase.id).unwrap();
      toast.success("Case deleted");
      setDeleteOpen(false);
      setSelectedCaseId("");
      refetchAll();
    } catch {
      toast.error("Unable to delete this case");
    }
  };

  const filteredCases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesStatus = statusFilter === "All" || statusBucket(item.status) === statusFilter;
      const matchesSearch = !query
        || item.caseId.toLowerCase().includes(query)
        || (item.type || "").toLowerCase().includes(query)
        || (item.victim?.address || "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [cases, searchTerm, statusFilter]);

  const timelineItems: TimelineEvent[] = [
    ...timeline.map((event) => ({
      id: event.id,
      date: formatPortalDate(event.eventAt),
      time: formatPortalDate(event.eventAt, true).split(", ").slice(1).join(", "),
      title: toTitleCase(event.eventType),
      description: event.description || "A case activity was recorded.",
      actor: currentCase?.assignedOfficer?.displayName || "GBV Monitor",
      actorRole: currentCase?.assignedOfficer?.displayName ? "Case Officer" : "System",
      type: mapEventType(event.eventType),
      status: "completed" as const,
    })),
    ...referrals.map((referral) => ({
      id: `referral-${referral.id}`,
      date: formatPortalDate(referral.createdAt),
      time: formatPortalDate(referral.createdAt, true).split(", ").slice(1).join(", "),
      title: `Referral to ${referral.referredTo || "Support Service"}`,
      description: referral.reason || "Support referral created for this case.",
      actor: referral.referredBy || "Referral Desk",
      actorRole: referral.referredByRole || referral.institutionType || "Support Provider",
      type: "referral" as const,
      status: (referral.status ?? "").toUpperCase() === "PENDING" ? "pending" as const : "completed" as const,
    })),
  ];

  return (
    <div className="flex min-h-screen w-full">
      <VictimSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">My Case</h2>
            <p className="text-sm text-muted-foreground">Follow all your case details, updates, and support progress.</p>
          </div>

        {isLoading ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Loading your case...</p>
          </div>
        ) : !currentCase ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-foreground">No case found for your account</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submit a report first and your case details will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
                <div>
                  <p className="label-text">MY CASES</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{cases.length} case(s) linked to your account</p>
                </div>
                <div className="flex-1" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "All" | "Open" | "Resolved")}
                  className="h-8 rounded-lg bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="All">All cases</option>
                  <option value="Open">Open cases</option>
                  <option value="Resolved">Resolved cases</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search my cases..."
                    className="h-8 w-[180px] pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="divide-y divide-border">
                {filteredCases.map((item) => {
                  const isSelected = currentCase?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCaseId(item.id)}
                      className={`w-full text-left px-4 py-3 transition-colors duration-150 ${
                        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-foreground">{item.caseId}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.type || "Case"} - {item.victim?.address || "District not provided"}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-info/15 text-info text-[10px] font-bold uppercase">
                          {normalizeStatusLabel(item.status)}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filteredCases.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No cases match your current filters.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <p className="label-text">CASE DETAILS</p>
                {canManageCurrentCase && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openEditDialog}
                      className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setWithdrawOpen(true)}
                      className="h-8 px-3 rounded-lg bg-warning/15 border border-warning/30 text-xs text-warning hover:bg-warning/20 transition-colors"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={() => setDeleteOpen(true)}
                      className="h-8 w-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/15 inline-flex items-center justify-center transition-colors"
                      title="Delete case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Case ID", value: currentCase.caseId, Icon: FileText },
                  { label: "Report Date", value: formatPortalDate(currentCase.createdAt), Icon: Calendar },
                  { label: "Case Type", value: currentCase.type, Icon: FileText },
                  { label: "District", value: currentCase.victim?.address || "Not provided", Icon: MapPin },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">{label}</p>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-info/15 text-info text-[10px] font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-info" />
                  {normalizedStatus}
                </span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="label-text">CASE TIMELINE</p>
                {isCaseDetailsLoading && <p className="text-[10px] text-muted-foreground">Refreshing...</p>}
              </div>
              {timelineItems.length ? (
                <CaseTimeline events={timelineItems} showAll={true} />
              ) : (
                <p className="text-sm text-muted-foreground">No timeline events have been recorded yet.</p>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-3">YOUR OFFICER</p>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-heading font-semibold text-foreground">{getOfficerName(currentCase)}</p>
                    <p className="text-xs text-muted-foreground">{getOfficerMeta(currentCase)}</p>
                    <div className="mt-3 p-3 rounded-lg bg-secondary border border-border">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentCase.assignedOfficer?.displayName
                          ? "Your assigned officer is following up on this case."
                          : "This case is registered and waiting for an officer assignment."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-3">CASE MILESTONES</p>
                <div className="space-y-3">
                  {milestones.length ? milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-start gap-3">
                      {milestone.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      ) : (
                        <Clock3 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{milestone.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {milestone.completed
                            ? `Completed ${formatPortalDate(milestone.completedAt)}`
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No milestones have been saved for this case yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="label-text">SUPPORT REFERRALS</p>
                <span className="text-[10px] text-muted-foreground">{referrals.length} item(s)</span>
              </div>
              <div className="divide-y divide-border">
                {referrals.length ? referrals.map((referral) => (
                  <div key={referral.id} className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium text-foreground">{referral.referredTo || "Support Service"}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatPortalDate(referral.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {referral.reason || "No referral notes were provided."}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold uppercase">
                        {referral.status || "Pending"}
                      </span>
                      {referral.urgency && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[9px] font-bold uppercase">
                          {referral.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">No referrals have been added to this case yet.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        </main>
      </div>
      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit case details</AlertDialogTitle>
            <AlertDialogDescription>
              You can update case details while the case is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <label className="label-text mb-1.5 block">District</label>
            <select
              value={editDistrict}
              onChange={(event) => setEditDistrict(event.target.value)}
              className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select district...</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpdatingCase}
              onClick={(event) => {
                event.preventDefault();
                void handleUpdateCase();
              }}
            >
              {isUpdatingCase ? "Saving..." : "Save changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent className="max-w-md border-warning/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this case?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the case as withdrawn. It will remain in your history, but it will no longer continue as an active case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep case open</AlertDialogCancel>
            <AlertDialogAction
              disabled={isWithdrawingCase}
              onClick={(event) => {
                event.preventDefault();
                void handleWithdrawCase();
              }}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {isWithdrawingCase ? "Withdrawing..." : "Withdraw case"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-md border-destructive/20">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle>Delete this case?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this open case and its related updates from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep case</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingCase}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteCase();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingCase ? "Deleting..." : "Delete case"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VictimCaseStatusLive;
