import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, Clock3, Edit2, FileText, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/DashboardSidebar";
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
  BackendCase,
  CASE_STATUS_CLASSES,
  mapCasesToAdminRows,
} from "@/lib/adminData";
import { BackendReferral, formatReferralStatus } from "@/lib/referralDb";
import {
  useAddMilestoneMutation,
  useDeleteMilestoneMutation,
  useGetAllReferralsQuery,
  useGetCasesQuery,
  useGetCurrentProfileQuery,
  useGetMilestonesQuery,
  useGetTimelineEventsQuery,
  useLogTimelineEventMutation,
  useUpdateMilestoneMutation,
} from "@/store/api";
import { getCurrentUser } from "@/lib/auth";

interface BackendMilestone {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
}

interface BackendTimelineEvent {
  id: string;
  eventType: string;
  description: string;
  eventAt?: string;
}

const RecoveryTracking = () => {
  const location = useLocation();
  const currentUser = getCurrentUser();
  const { data: profileData } = useGetCurrentProfileQuery(undefined, { skip: !currentUser });
  const currentProfile = profileData?.data;
  const isDistrictAdmin = location.pathname.startsWith("/districtadmin/")
    || currentUser?.role === "districtadmin"
    || currentProfile?.role === "DISTRICT_ADMIN";
  const districtName = currentProfile?.district || currentUser?.district || "";
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState("");
  const [editingMilestoneName, setEditingMilestoneName] = useState("");
  const [deleteMilestoneTarget, setDeleteMilestoneTarget] = useState<BackendMilestone | null>(null);

  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });
  const referralsQuery = useGetAllReferralsQuery({});
  const [addMilestone, { isLoading: isAddingMilestone }] = useAddMilestoneMutation();
  const [updateMilestone, { isLoading: isUpdatingMilestone }] = useUpdateMilestoneMutation();
  const [deleteMilestone, { isLoading: isDeletingMilestone }] = useDeleteMilestoneMutation();
  const [logTimelineEvent, { isLoading: isSavingNote }] = useLogTimelineEventMutation();

  const caseRows = useMemo(() => {
    const items = (casesQuery.data?.data?.content ?? []) as BackendCase[];
    return mapCasesToAdminRows(items);
  }, [casesQuery.data]);

  const scopedCaseRows = useMemo(() => {
    if (!isDistrictAdmin || !districtName.trim()) {
      return caseRows;
    }

    const normalizedDistrict = districtName.trim().toLowerCase();
    return caseRows.filter((item) =>
      item.district.trim().toLowerCase() === normalizedDistrict ||
      (item.victimDistrict || "").trim().toLowerCase() === normalizedDistrict
    );
  }, [caseRows, districtName, isDistrictAdmin]);

  useEffect(() => {
    if (!selectedCaseId && scopedCaseRows.length > 0) {
      setSelectedCaseId(scopedCaseRows[0].uuid);
      return;
    }
    if (selectedCaseId && !scopedCaseRows.some((item) => item.uuid === selectedCaseId)) {
      setSelectedCaseId(scopedCaseRows[0]?.uuid || "");
    }
  }, [scopedCaseRows, selectedCaseId]);

  const selectedCase = useMemo(
    () => scopedCaseRows.find((item) => item.uuid === selectedCaseId) ?? null,
    [scopedCaseRows, selectedCaseId],
  );

  const referrals = (referralsQuery.data?.data?.content ?? []) as BackendReferral[];
  const selectedReferrals = selectedCase
    ? referrals.filter((item) => item.caseUuid === selectedCase.uuid || item.caseId === selectedCase.id)
    : [];

  const milestonesQuery = useGetMilestonesQuery(selectedCase?.uuid ?? "", { skip: !selectedCase?.uuid });
  const timelineQuery = useGetTimelineEventsQuery(selectedCase?.uuid ?? "", { skip: !selectedCase?.uuid });

  const milestones = ((milestonesQuery.data?.data ?? []) as BackendMilestone[])
    .slice()
    .sort((left, right) => Number(left.completed) - Number(right.completed) || left.name.localeCompare(right.name));

  const timelineEvents = ((timelineQuery.data?.data ?? []) as BackendTimelineEvent[])
    .slice()
    .sort((left, right) => new Date(right.eventAt ?? 0).getTime() - new Date(left.eventAt ?? 0).getTime());

  const progress = milestones.length > 0
    ? Math.round((milestones.filter((item) => item.completed).length / milestones.length) * 100)
    : 0;

  const stats = {
    trackedCases: scopedCaseRows.length,
    casesWithReferrals: scopedCaseRows.filter((item) => referrals.some((referral) => referral.caseUuid === item.uuid || referral.caseId === item.id)).length,
    resolvedCases: scopedCaseRows.filter((item) => item.status === "Resolved").length,
    avgDaysOpen: scopedCaseRows.length ? Math.round(scopedCaseRows.reduce((sum, item) => sum + item.daysOpen, 0) / scopedCaseRows.length) : 0,
  };

  const handleAddMilestone = async () => {
    if (!selectedCase || !newMilestoneName.trim()) {
      return;
    }

    try {
      await addMilestone({ caseId: selectedCase.uuid, name: newMilestoneName.trim() }).unwrap();
      toast.success("Milestone added");
      setNewMilestoneName("");
      await milestonesQuery.refetch();
    } catch {
      toast.error("Unable to add milestone");
    }
  };

  const startEditingMilestone = (milestone: BackendMilestone) => {
    setEditingMilestoneId(milestone.id);
    setEditingMilestoneName(milestone.name);
  };

  const handleUpdateMilestoneName = async () => {
    if (!editingMilestoneId || !editingMilestoneName.trim()) {
      return;
    }

    try {
      await updateMilestone({ id: editingMilestoneId, name: editingMilestoneName.trim() }).unwrap();
      toast.success("Milestone updated");
      setEditingMilestoneId("");
      setEditingMilestoneName("");
      await milestonesQuery.refetch();
    } catch {
      toast.error("Unable to update milestone");
    }
  };

  const handleToggleMilestone = async (milestone: BackendMilestone) => {
    try {
      await updateMilestone({ id: milestone.id, completed: !milestone.completed }).unwrap();
      toast.success(milestone.completed ? "Milestone reopened" : "Milestone completed");
      await milestonesQuery.refetch();
    } catch {
      toast.error("Unable to update milestone status");
    }
  };

  const handleDeleteMilestone = async () => {
    if (!deleteMilestoneTarget) {
      return;
    }

    try {
      await deleteMilestone(deleteMilestoneTarget.id).unwrap();
      toast.success("Milestone deleted");
      setDeleteMilestoneTarget(null);
      await milestonesQuery.refetch();
    } catch {
      toast.error("Unable to delete milestone");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCase || !noteText.trim()) {
      return;
    }

    try {
      await logTimelineEvent({
        caseId: selectedCase.uuid,
        eventType: "RECOVERY_NOTE",
        description: noteText.trim(),
      }).unwrap();
      toast.success("Recovery note saved");
      setNoteText("");
      await timelineQuery.refetch();
    } catch {
      toast.error("Unable to save note");
    }
  };

  const isLoading = casesQuery.isLoading || referralsQuery.isLoading;
  const hasError = Boolean(casesQuery.error || referralsQuery.error);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Recovery Tracking</h2>
            <p className="text-sm text-muted-foreground">Track milestones, support notes, and referral progress on a selected case.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TRACKED CASES", value: stats.trackedCases, color: "text-primary" },
              { label: "CASES WITH REFERRALS", value: stats.casesWithReferrals, color: "text-info" },
              { label: "RESOLVED CASES", value: stats.resolvedCases, color: "text-success" },
              { label: "AVG DAYS OPEN", value: stats.avgDaysOpen, color: "text-warning" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Loading recovery tracking...</div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Unable to load recovery tracking.</div>
          ) : scopedCaseRows.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
              {isDistrictAdmin && districtName
                ? `No recovery cases are available for ${districtName}.`
                : "No cases are available yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-4 bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <p className="label-text">CASE QUEUE</p>
                </div>
                <div className="divide-y divide-border">
                  {scopedCaseRows.map((item) => {
                    const referralCount = referrals.filter((referral) => referral.caseUuid === item.uuid || referral.caseId === item.id).length;
                    return (
                      <button
                        key={item.uuid}
                        onClick={() => setSelectedCaseId(item.uuid)}
                        className={`w-full text-left px-5 py-4 transition-colors ${selectedCaseId === item.uuid ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-secondary/30'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm text-foreground">{item.id}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.victimName}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CASE_STATUS_CLASSES[item.status]}`}>
                            <span className="w-1 h-1 rounded-full bg-current" />
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">{item.type} - {item.district}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{referralCount} referral(s), {item.daysOpen} days open</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-8 space-y-5">
                {selectedCase && (
                  <>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading text-lg font-semibold text-foreground">{selectedCase.id}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CASE_STATUS_CLASSES[selectedCase.status]}`}>
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {selectedCase.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{selectedCase.victimName} - {selectedCase.type} - {selectedCase.district}</p>
                        </div>
                        <button
                          onClick={() => {
                            void milestonesQuery.refetch();
                            void timelineQuery.refetch();
                          }}
                          className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Refresh
                        </button>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="label-text">MILESTONE PROGRESS</p>
                          <p className="text-sm font-semibold text-primary">{progress}%</p>
                        </div>
                        <div className="h-3 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full ${progress === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                        <div className="bg-secondary border border-border rounded-xl p-4">
                          <p className="label-text mb-2">ASSIGNED OFFICER</p>
                          <p className="text-sm text-foreground">{selectedCase.officer}</p>
                        </div>
                        <div className="bg-secondary border border-border rounded-xl p-4">
                          <p className="label-text mb-2">REFERRAL STATUS</p>
                          <p className="text-sm text-foreground">{selectedReferrals[0] ? formatReferralStatus(selectedReferrals[0].status) : 'No referrals yet'}</p>
                        </div>
                        <div className="bg-secondary border border-border rounded-xl p-4">
                          <p className="label-text mb-2">CASE AGE</p>
                          <p className="text-sm text-foreground">{selectedCase.daysOpen} day(s)</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-border">
                        <p className="label-text">MILESTONES</p>
                      </div>
                      {milestonesQuery.isLoading ? (
                        <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading milestones...</div>
                      ) : milestones.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-muted-foreground">No milestones have been recorded for this case yet.</div>
                      ) : (
                        <div className="divide-y divide-border">
                          {milestones.map((item) => (
                            <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {editingMilestoneId === item.id ? (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                      value={editingMilestoneName}
                                      onChange={(event) => setEditingMilestoneName(event.target.value)}
                                      className="h-8 flex-1 rounded-lg bg-background border border-border px-3 text-xs text-foreground"
                                    />
                                    <button
                                      disabled={!editingMilestoneName.trim() || isUpdatingMilestone}
                                      onClick={() => void handleUpdateMilestoneName()}
                                      className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingMilestoneId("");
                                        setEditingMilestoneName("");
                                      }}
                                      className="h-8 w-8 rounded-lg bg-secondary border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                                      title="Cancel edit"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      {item.completed ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Clock3 className="w-4 h-4 text-warning" />}
                                      <p className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>{item.name}</p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1">{item.completed ? `Completed ${item.completedAt || ''}` : 'Pending completion'}</p>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  disabled={isUpdatingMilestone}
                                  onClick={() => void handleToggleMilestone(item)}
                                  className="h-7 px-2.5 rounded-lg bg-secondary border border-border text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                                >
                                  {item.completed ? "Reopen" : "Complete"}
                                </button>
                                <button
                                  onClick={() => startEditingMilestone(item)}
                                  className="h-7 w-7 rounded-lg bg-secondary border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                                  title="Edit milestone"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteMilestoneTarget(item)}
                                  className="h-7 w-7 rounded-lg bg-destructive/10 border border-destructive/20 inline-flex items-center justify-center text-destructive hover:bg-destructive/15"
                                  title="Delete milestone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-5 border-t border-border bg-secondary/20">
                        <p className="label-text mb-3">ADD MILESTONE</p>
                        <div className="flex gap-3 flex-wrap">
                          <input
                            value={newMilestoneName}
                            onChange={(event) => setNewMilestoneName(event.target.value)}
                            placeholder="Example: Counseling session scheduled"
                            className="flex-1 min-w-[220px] h-9 rounded-lg bg-background border border-border px-3 text-xs text-foreground"
                          />
                          <button
                            disabled={!newMilestoneName.trim() || isAddingMilestone}
                            onClick={() => void handleAddMilestone()}
                            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Milestone
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border">
                          <p className="label-text">RECOVERY NOTES</p>
                        </div>
                        <div className="p-5 space-y-3">
                          <textarea
                            value={noteText}
                            onChange={(event) => setNoteText(event.target.value)}
                            placeholder="Add a recovery update for this case."
                            rows={5}
                            className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm text-foreground resize-none"
                          />
                          <button
                            disabled={!noteText.trim() || isSavingNote}
                            onClick={() => void handleSaveNote()}
                            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>

                      <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
                          <p className="label-text">TIMELINE ACTIVITY</p>
                          <span className="text-[10px] text-muted-foreground">{timelineEvents.length} event(s)</span>
                        </div>
                        {timelineQuery.isLoading ? (
                          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading timeline...</div>
                        ) : timelineEvents.length === 0 ? (
                          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No timeline events recorded yet.</div>
                        ) : (
                          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                            {timelineEvents.map((item) => (
                              <div key={item.id} className="px-5 py-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-3.5 h-3.5 text-primary" />
                                  <p className="text-xs font-semibold text-foreground">{item.eventType.replace(/_/g, ' ')}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <p className="text-[11px] text-muted-foreground mt-2">{item.eventAt || 'Time pending'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      <AlertDialog open={deleteMilestoneTarget !== null} onOpenChange={(open) => !open && setDeleteMilestoneTarget(null)}>
        <AlertDialogContent className="max-w-md border-destructive/20">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-foreground">Delete milestone?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This removes <span className="font-medium text-foreground">{deleteMilestoneTarget?.name}</span> from this case recovery plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-lg border-border bg-secondary text-sm text-foreground hover:bg-secondary/80">
              Keep milestone
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteMilestone();
              }}
              className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingMilestone}
            >
              {isDeletingMilestone ? "Deleting..." : "Delete milestone"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecoveryTracking;
