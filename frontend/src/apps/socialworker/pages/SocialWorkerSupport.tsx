import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  HeartHandshake,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { SocialWorkerSidebar } from "@/apps/socialworker/components/SocialWorkerSidebar";
import {
  BackendCase,
  formatDate,
  formatDateTime,
  getScopedDistrictCases,
  mapBackendCasesToRows,
} from "@/apps/socialworker/lib/socialWorkerData";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  useAddMilestoneMutation,
  useCompleteMilestoneMutation,
  useGetAllReferralsQuery,
  useGetCasesQuery,
  useGetMilestonesQuery,
  useGetTimelineEventsQuery,
  useLogTimelineEventMutation,
} from "@/store/api";
import { BackendReferral } from "@/lib/referralDb";

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

const SocialWorkerSupport = () => {
  const currentUser = getCurrentUser();
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [noteText, setNoteText] = useState("");

  const { data: casesData, isLoading: isLoadingCases, error: casesError, refetch: refetchCases } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: referralsData } = useGetAllReferralsQuery({});
  const [addMilestone, { isLoading: isAddingMilestone }] = useAddMilestoneMutation();
  const [completeMilestone, { isLoading: isCompletingMilestone }] = useCompleteMilestoneMutation();
  const [logTimelineEvent, { isLoading: isSavingNote }] = useLogTimelineEventMutation();

  const cases = useMemo(() => {
    const items = (casesData?.data?.content ?? []) as BackendCase[];
    return getScopedDistrictCases(mapBackendCasesToRows(items));
  }, [casesData]);

  useEffect(() => {
    if (!selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].uuid);
    }
  }, [cases, selectedCaseId]);

  const selectedCase = useMemo(
    () => cases.find((item) => item.uuid === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );

  const milestonesQuery = useGetMilestonesQuery(selectedCase?.uuid ?? "", {
    skip: !selectedCase?.uuid,
  });
  const timelineQuery = useGetTimelineEventsQuery(selectedCase?.uuid ?? "", {
    skip: !selectedCase?.uuid,
  });

  const milestones = ((milestonesQuery.data?.data ?? []) as BackendMilestone[])
    .slice()
    .sort((left, right) => Number(left.completed) - Number(right.completed) || left.name.localeCompare(right.name));

  const timelineEvents = ((timelineQuery.data?.data ?? []) as BackendTimelineEvent[])
    .slice()
    .sort((left, right) => new Date(right.eventAt ?? 0).getTime() - new Date(left.eventAt ?? 0).getTime());

  const allReferrals = (referralsData?.data?.content ?? []) as BackendReferral[];
  const selectedReferrals = selectedCase
    ? allReferrals.filter((item) => item.caseUuid === selectedCase.uuid || item.caseId === selectedCase.id)
    : [];

  const completedMilestones = milestones.filter((item) => item.completed).length;
  const progress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const openCases = cases.filter((item) => item.status !== "Resolved").length;

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

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      await completeMilestone(milestoneId).unwrap();
      toast.success("Milestone completed");
      await milestonesQuery.refetch();
    } catch {
      toast.error("Unable to complete milestone");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCase || !noteText.trim()) {
      return;
    }

    try {
      await logTimelineEvent({
        caseId: selectedCase.uuid,
        eventType: "SOCIAL_WORKER_NOTE",
        description: noteText.trim(),
      }).unwrap();
      toast.success("Support note saved");
      setNoteText("");
      await timelineQuery.refetch();
    } catch {
      toast.error("Unable to save note");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <SocialWorkerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Victim Support Tracking</h2>
            <p className="text-sm text-muted-foreground">
              Track case progress, milestones, and support notes in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "OPEN CASES", value: openCases, color: "text-foreground" },
              { label: "SELECTED PROGRESS", value: `${progress}%`, color: "text-primary" },
              { label: "MILESTONES DONE", value: completedMilestones, color: "text-success" },
              { label: "REFERRALS ON CASE", value: selectedReferrals.length, color: "text-warning" },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{card.label}</p>
                <p className={`text-2xl font-bold font-heading ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {isLoadingCases ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Loading support cases...
            </div>
          ) : casesError ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">Unable to load support cases</p>
              <button
                onClick={() => void refetchCases()}
                className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
              >
                Retry
              </button>
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              No cases are available yet for support tracking.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-4 bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
                  <p className="label-text">CASE QUEUE</p>
                  <span className="text-[10px] text-muted-foreground">{currentUser?.district || "Shared"} view</span>
                </div>
                <div className="divide-y divide-border">
                  {cases.map((item) => (
                    <button
                      key={item.uuid}
                      onClick={() => setSelectedCaseId(item.uuid)}
                      className={`w-full text-left px-5 py-4 transition-colors duration-150 ${
                        selectedCaseId === item.uuid ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold text-foreground">{item.id}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.victimName}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.status === "Resolved" ? "bg-success/15 text-success" :
                          item.status === "Overdue" ? "bg-destructive/15 text-destructive" :
                          item.status === "Pending" ? "bg-warning/15 text-warning" :
                          "bg-info/15 text-info"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-2">
                        <p className="text-[11px] text-muted-foreground">{item.type} - {item.district}</p>
                        <p className="text-[11px] text-muted-foreground">{item.daysOpen}d open</p>
                      </div>
                    </button>
                  ))}
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
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                              {selectedCase.type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedCase.victimName} - {selectedCase.district}
                          </p>
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                        {[
                          { label: "OFFICER", value: selectedCase.officer },
                          { label: "LAST UPDATED", value: selectedCase.lastUpdated },
                          { label: "OPENED", value: formatDate(selectedCase.createdAt) },
                        ].map((item) => (
                          <div key={item.label} className="bg-secondary border border-border rounded-xl p-4">
                            <p className="label-text mb-2">{item.label}</p>
                            <p className="text-sm text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="label-text">RECOVERY PROGRESS</p>
                          <p className="text-sm font-semibold text-primary">{progress}%</p>
                        </div>
                        <div className="h-3 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
                        <p className="label-text">MILESTONES</p>
                        <span className="text-[10px] text-muted-foreground">Milestones for this case</span>
                      </div>

                      {milestonesQuery.isLoading ? (
                        <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading milestones...</div>
                      ) : milestones.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-muted-foreground">No milestones found for this case yet.</div>
                      ) : (
                        <div className="divide-y divide-border">
                          {milestones.map((item) => (
                            <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {item.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                  ) : (
                                    <Clock3 className="w-4 h-4 text-warning shrink-0" />
                                  )}
                                  <p className={`text-sm font-medium ${item.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                    {item.name}
                                  </p>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {item.completed ? `Completed ${formatDateTime(item.completedAt)}` : "Pending completion"}
                                </p>
                              </div>
                              <button
                                disabled={item.completed || isCompletingMilestone}
                                onClick={() => void handleCompleteMilestone(item.id)}
                                className="h-8 px-3 rounded-lg bg-success/15 text-success text-xs font-medium hover:bg-success/25 disabled:opacity-40"
                              >
                                {item.completed ? "Completed" : "Mark Complete"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-5 border-t border-border bg-secondary/20">
                        <p className="label-text mb-3">ADD MILESTONE</p>
                        <div className="flex gap-3 flex-wrap">
                          <input
                            autoComplete="off"
                            value={newMilestoneName}
                            onChange={(event) => setNewMilestoneName(event.target.value)}
                            placeholder="Example: Counseling session scheduled"
                            className="flex-1 min-w-[220px] h-9 rounded-lg bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            disabled={!newMilestoneName.trim() || isAddingMilestone}
                            onClick={() => void handleAddMilestone()}
                            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1.5"
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
                          <p className="label-text">SUPPORT NOTES</p>
                        </div>
                        <div className="p-5 space-y-3">
                          <textarea
                            autoComplete="off"
                            value={noteText}
                            onChange={(event) => setNoteText(event.target.value)}
                            placeholder="Add a support update for this case."
                            rows={5}
                            className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                          <button
                            disabled={!noteText.trim() || isSavingNote}
                            onClick={() => void handleSaveNote()}
                            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40"
                          >
                            Save Support Note
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
                                  <p className="text-xs font-semibold text-foreground">{item.eventType.replace(/_/g, " ")}</p>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                <p className="text-[11px] text-muted-foreground mt-2">{formatDateTime(item.eventAt)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <HeartHandshake className="w-4 h-4 text-primary" />
                        <p className="label-text">SUPPORT SUMMARY</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This page shows milestone progress, case details, referral activity, and support notes for the selected case.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SocialWorkerSupport;
