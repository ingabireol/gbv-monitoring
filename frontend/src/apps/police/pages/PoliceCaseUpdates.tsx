import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";
import { formatPoliceDate, usePolicePortalData } from "@/apps/police/lib/usePolicePortalData";
import {
  useCreateNotificationMutation,
  useLogTimelineEventMutation,
} from "@/store/api";

type UpdateType = "Status Change" | "Evidence Added" | "Witness Statement" | "Referral Made" | "Investigation Note";
type Visibility = "Internal" | "Visible to Victim";

const UPDATE_TYPES: UpdateType[] = [
  "Status Change",
  "Evidence Added",
  "Witness Statement",
  "Referral Made",
  "Investigation Note",
];

function toEventType(value: UpdateType): string {
  return value.toUpperCase().replace(/\s+/g, "_");
}

const PoliceCaseUpdates = () => {
  const { currentUser, assignedCases, recentActivity, refetchAll } = usePolicePortalData();
  const [selectedCase, setSelectedCase] = useState("");
  const [updateType, setUpdateType] = useState<UpdateType | "">("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Internal");
  const [logTimelineEvent, { isLoading: isSubmittingEvent }] = useLogTimelineEventMutation();
  const [createNotification, { isLoading: isSendingNotification }] = useCreateNotificationMutation();

  const selectedCaseRecord = useMemo(
    () => assignedCases.find((item) => item.id === selectedCase),
    [assignedCases, selectedCase],
  );

  const canSubmit = !!selectedCase && !!updateType && description.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedCaseRecord || !updateType) {
      return;
    }

    try {
      await logTimelineEvent({
        caseId: selectedCaseRecord.id,
        eventType: toEventType(updateType),
        description: `${description.trim()} (Officer: ${currentUser?.name || currentUser?.username || "Police Officer"})`,
      }).unwrap();

      if (visibility === "Visible to Victim" && selectedCaseRecord.victimAccountId) {
        await createNotification({
          userId: selectedCaseRecord.victimAccountId,
          type: toEventType(updateType),
          message: description.trim(),
        }).unwrap();
      }

      toast.success(`Update submitted for case ${selectedCaseRecord.caseId}`);
      setSelectedCase("");
      setUpdateType("");
      setDescription("");
      setVisibility("Internal");
      refetchAll();
    } catch {
      toast.error("Unable to submit the case update");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <PoliceSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Case Updates</h2>
            <p className="text-sm text-muted-foreground">Log updates against your assigned cases</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "ASSIGNED CASES", value: assignedCases.length, sub: "Cases available for updates", color: "text-success", bg: "bg-success/10 border-success/20" },
              { label: "RECENT RECORDS", value: recentActivity.length, sub: "Updates on record", color: "text-warning", bg: "bg-warning/10 border-warning/20" },
              { label: "TODAY'S ACTIVITY", value: recentActivity.filter((item) => item.eventAt && new Date(item.eventAt).toDateString() === new Date().toDateString()).length, sub: "Events logged today", color: "text-info", bg: "bg-info/10 border-info/20" },
            ].map((item) => (
              <div key={item.label} className={`bg-card border rounded-xl p-4 ${item.bg}`}>
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <p className="label-text mb-4">SUBMIT A CASE UPDATE</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Select Case</label>
                <div className="relative">
                  <select
                    value={selectedCase}
                    onChange={(event) => setSelectedCase(event.target.value)}
                    className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    <option value="">Choose a case...</option>
                    {assignedCases.map((item) => (
                      <option key={item.id} value={item.id}>{item.caseId} - {item.victim?.name || "Unknown victim"}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Update Type</label>
                <div className="relative">
                  <select
                    value={updateType}
                    onChange={(event) => setUpdateType(event.target.value as UpdateType)}
                    className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    <option value="">Choose a type...</option>
                    {UPDATE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground">Update Details</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the case update in detail..."
                  rows={4}
                  className="w-full rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground">Visibility:</span>
                <button
                  onClick={() => setVisibility("Internal")}
                  className={`h-7 px-3 rounded-lg text-[10px] font-medium border transition-colors duration-200 ${
                    visibility === "Internal"
                      ? "bg-warning/15 border-warning/30 text-warning"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Internal Only
                </button>
                <button
                  onClick={() => setVisibility("Visible to Victim")}
                  className={`h-7 px-3 rounded-lg text-[10px] font-medium border transition-colors duration-200 ${
                    visibility === "Visible to Victim"
                      ? "bg-info/15 border-info/30 text-info"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Visible to Victim
                </button>
                <button
                  disabled={!canSubmit || isSubmittingEvent || isSendingNotification}
                  onClick={() => void handleSubmit()}
                  className="ml-auto h-8 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40"
                >
                  {(isSubmittingEvent || isSendingNotification) ? "Submitting..." : "Submit Update"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="label-text">RECENT UPDATES</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Event Type", "Description", "Date Logged"].map((header) => (
                      <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentActivity.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{item.eventType || "Case update"}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[380px]">
                        <p className="truncate">{item.description || "No description"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatPoliceDate(item.eventAt, true)}</td>
                    </tr>
                  ))}
                  {recentActivity.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No timeline updates have been recorded for your assigned cases yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PoliceCaseUpdates;
