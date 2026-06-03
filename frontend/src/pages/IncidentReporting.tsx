import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Calendar, Eye, EyeOff, Save, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
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
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import {
  BackendCase,
  CASE_STATUS_CLASSES,
  DISTRICTS,
  INCIDENT_TYPES,
  mapCasesToAdminRows,
  mapIncidentTypeToCaseType,
} from "@/lib/adminData";
import {
  useCreateAnonymousReportMutation,
  useCreateReportMutation,
  useDeleteCaseMutation,
  useGetCasesQuery,
  useUpdateCaseStatusMutation,
} from "@/store/api";

const CASE_STATUS_OPTIONS = [
  { label: "Pending", value: "FILED" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Critical", value: "CRITICAL" },
  { label: "Resolved", value: "RESOLVED" },
];

function mapAdminStatusToBackend(status: string): string {
  switch (status) {
    case "Resolved":
      return "RESOLVED";
    case "Accepted":
      return "ACCEPTED";
    case "Rejected":
      return "REJECTED";
    case "Critical":
      return "CRITICAL";
    case "In Progress":
      return "IN_PROGRESS";
    default:
      return "FILED";
  }
}

function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const IncidentReporting = () => {
  const currentUser = getCurrentUser();
  const isDistrictAdmin = currentUser?.role === "districtadmin";
  const districtName = currentUser?.district || "";
  const submitLockedRef = useRef(false);
  const currentSubmissionKeyRef = useRef<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [victimName, setVictimName] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [district, setDistrict] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [casePendingDelete, setCasePendingDelete] = useState<{ id: string; caseId: string; victimName: string } | null>(null);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);

  const [createReport, { isLoading: isCreatingReport }] = useCreateReportMutation();
  const [createAnonymousReport, { isLoading: isCreatingAnonymous }] = useCreateAnonymousReportMutation();
  const [updateCaseStatus, { isLoading: isUpdatingCase }] = useUpdateCaseStatusMutation();
  const [deleteCase, { isLoading: isDeletingCase }] = useDeleteCaseMutation();
  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });

  useEffect(() => {
    if (isDistrictAdmin && districtName) {
      setDistrict(districtName);
      setIsAnonymous(false);
    }
  }, [districtName, isDistrictAdmin]);

  const caseRows = useMemo(() => {
    const items = (casesQuery.data?.data?.content ?? []) as BackendCase[];
    return mapCasesToAdminRows(items);
  }, [casesQuery.data]);

  const recentCases = useMemo(
    () => [...caseRows]
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
      .filter((item) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;
        return item.id.toLowerCase().includes(query)
          || item.district.toLowerCase().includes(query)
          || item.type.toLowerCase().includes(query)
          || item.victimName.toLowerCase().includes(query);
      })
      .slice(0, 8),
    [caseRows, searchTerm],
  );

  const stats = {
    submittedThisMonth: caseRows.filter((item) => {
      if (!item.createdAt) return false;
      const dateValue = new Date(item.createdAt);
      const now = new Date();
      return dateValue.getMonth() === now.getMonth() && dateValue.getFullYear() === now.getFullYear();
    }).length,
    pendingReview: caseRows.filter((item) => item.status === "Pending").length,
    resolvedCases: caseRows.filter((item) => item.status === "Resolved").length,
  };

  const isSubmitting = isSubmitLocked || isCreatingReport || isCreatingAnonymous;
  const maxIncidentDate = todayInputValue();
  const isFutureIncidentDate = Boolean(date && date > maxIncidentDate);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
  };

  const resetForm = () => {
    setVictimName("");
    setIncidentType("");
    setDistrict(isDistrictAdmin ? districtName : "");
    setDate("");
    setDescription("");
    setFiles([]);
    setIsAnonymous(false);
    currentSubmissionKeyRef.current = null;
  };

  const getSubmissionKey = () => {
    if (!currentSubmissionKeyRef.current) {
      currentSubmissionKeyRef.current = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `incident-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return currentSubmissionKeyRef.current;
  };

  const handleSubmit = async () => {
    if (submitLockedRef.current) {
      return;
    }

    submitLockedRef.current = true;
    setIsSubmitLocked(true);

    if (!incidentType || !district || !date || !description.trim()) {
      toast.error("Please fill in all required fields.");
      submitLockedRef.current = false;
      setIsSubmitLocked(false);
      return;
    }

    if (isFutureIncidentDate) {
      toast.error("The incident date cannot be in the future.");
      submitLockedRef.current = false;
      setIsSubmitLocked(false);
      return;
    }

    if (!isAnonymous && !victimName.trim()) {
      toast.error("Please add the victim name or switch to anonymous mode.");
      submitLockedRef.current = false;
      setIsSubmitLocked(false);
      return;
    }

    const formData = new FormData();
    formData.append("type", mapIncidentTypeToCaseType(incidentType));
    formData.append("submissionKey", getSubmissionKey());
    formData.append("incidentDate", date);
    formData.append("incidentLocation", district);
    formData.append(
      "description",
      [
        `Incident type: ${incidentType}`,
        `District: ${district}`,
        `Date: ${date}`,
        `Details: ${description.trim()}`,
      ].join("\n"),
    );
    formData.append("victimAddress", district);

    if (!isAnonymous) {
      formData.append("victimName", victimName.trim());
    }

    files.forEach((file) => formData.append("files", file));

    try {
      const response = isAnonymous && !isDistrictAdmin
        ? await createAnonymousReport(formData).unwrap()
        : await createReport(formData).unwrap();

      const nextReference = response?.data?.reference || response?.data?.caseId;
      toast.success(nextReference ? `Report submitted. Reference: ${nextReference}` : "Report submitted successfully.");
      resetForm();
      void casesQuery.refetch();
    } catch (error) {
      const message = typeof error === "object" && error !== null && "data" in error
        ? ((error as { data?: { message?: string } }).data?.message ?? "Unable to submit this report.")
        : "Unable to submit this report.";
      toast.error(message);
    } finally {
      submitLockedRef.current = false;
      setIsSubmitLocked(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const status = statusDrafts[id] ?? mapAdminStatusToBackend(currentStatus);
    try {
      await updateCaseStatus({ id, status }).unwrap();
      toast.success("Case status updated.");
      setStatusDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      void casesQuery.refetch();
    } catch (error) {
      const message = typeof error === "object" && error !== null && "data" in error
        ? ((error as { data?: { message?: string } }).data?.message ?? "Unable to update this case.")
        : "Unable to update this case.";
      toast.error(message);
    }
  };

  const handleDeleteCase = async () => {
    if (!casePendingDelete) {
      return;
    }

    try {
      await deleteCase(casePendingDelete.id).unwrap();
      toast.success(`Case ${casePendingDelete.caseId} deleted.`);
      setCasePendingDelete(null);
      void casesQuery.refetch();
    } catch (error) {
      const message = typeof error === "object" && error !== null && "data" in error
        ? ((error as { data?: { message?: string } }).data?.message ?? "Unable to delete this case.")
        : "Unable to delete this case.";
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              {isDistrictAdmin ? "District Incident Reports" : "Incident Reports"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isDistrictAdmin
                ? `Submit new incidents and review recent case registrations in ${districtName || "your district"}.`
                : "Submit new incidents and review the most recent case registrations."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "REPORTS THIS MONTH", value: stats.submittedThisMonth, color: "text-primary" },
              { label: "PENDING REVIEW", value: stats.pendingReview, color: "text-warning" },
              { label: "RESOLVED CASES", value: stats.resolvedCases, color: "text-success" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-heading text-base font-semibold text-foreground">New Incident Report</h3>
              {!isDistrictAdmin && (
                <div className="flex items-center gap-2.5">
                  {isAnonymous ? <EyeOff className="w-4 h-4 text-warning" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">Anonymous</span>
                  <button
                    onClick={() => setIsAnonymous((value) => !value)}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${isAnonymous ? 'bg-warning' : 'bg-secondary border border-border'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-200 ${isAnonymous ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              {isAnonymous && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <EyeOff className="w-4 h-4 text-warning shrink-0" />
                  <p className="text-xs text-warning">Anonymous reporting is enabled for this submission.</p>
                </div>
              )}

              {!isAnonymous && (
                <div className="space-y-1.5">
                  <label className="label-text">VICTIM NAME *</label>
                  <input
                    value={victimName}
                    onChange={(event) => setVictimName(event.target.value)}
                    placeholder="Enter victim name"
                    className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label-text">INCIDENT TYPE *</label>
                  <select
                    value={incidentType}
                    onChange={(event) => setIncidentType(event.target.value)}
                    className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select incident type...</option>
                    {INCIDENT_TYPES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="label-text">DISTRICT *</label>
                  <select
                    value={district}
                    onChange={(event) => setDistrict(isDistrictAdmin ? districtName : event.target.value)}
                    disabled={isDistrictAdmin}
                    className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    <option value="">Select district...</option>
                    {(isDistrictAdmin && districtName ? [districtName] : DISTRICTS).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-text">DATE OF INCIDENT *</label>
                <div className="relative max-w-xs">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    max={maxIncidentDate}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className={`h-9 w-full rounded-lg bg-background border text-sm text-foreground pl-9 pr-3 focus:outline-none focus:ring-1 ${
                      isFutureIncidentDate
                        ? "border-destructive focus:ring-destructive"
                        : "border-border focus:ring-primary"
                    }`}
                  />
                </div>
                {isFutureIncidentDate && (
                  <p className="text-[10px] text-destructive">
                    The incident date cannot be after today.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="label-text">DESCRIPTION *</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what happened, where it happened, and any immediate concerns."
                  rows={5}
                  className="w-full rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-text">SUPPORTING FILES</label>
                <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-lg border-2 border-dashed border-border bg-background hover:border-primary/50 cursor-pointer transition-colors duration-200">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload photos, audio, video, or documents</span>
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>
                {files.length > 0 && (
                  <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={resetForm}
                  className="h-9 px-4 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
                <button
                  disabled={isSubmitting || isFutureIncidentDate}
                  onClick={() => void handleSubmit()}
                  className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border gap-3">
              <h3 className="font-heading text-base font-semibold text-foreground">Recent Submissions</h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search recent reports..."
                  className="h-8 w-[190px] pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Case ID', 'Victim', 'Type', 'District', 'Status', 'Reported', 'Actions'].map((header) => (
                      <th key={header} className="px-4 py-3 text-left label-text">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((item) => (
                    <tr key={item.uuid} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono text-primary">{item.id}</td>
                      <td className="px-4 py-3 text-foreground">{item.victimName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.district}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CASE_STATUS_CLASSES[item.status]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.reportedDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[210px]">
                          <select
                            value={statusDrafts[item.uuid] ?? mapAdminStatusToBackend(item.status)}
                            onChange={(event) => setStatusDrafts((current) => ({
                              ...current,
                              [item.uuid]: event.target.value,
                            }))}
                            className="h-8 w-28 rounded-lg bg-background border border-border px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {CASE_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <button
                            disabled={isUpdatingCase}
                            onClick={() => void handleUpdateStatus(item.uuid, item.status)}
                            className="h-8 w-8 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 inline-flex items-center justify-center"
                            title="Update status"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={isDeletingCase}
                            onClick={() => setCasePendingDelete({
                              id: item.uuid,
                              caseId: item.id,
                              victimName: item.victimName,
                            })}
                            className="h-8 w-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/15 disabled:opacity-50 inline-flex items-center justify-center"
                            title="Delete case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentCases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No recent submissions match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      <AlertDialog open={casePendingDelete !== null} onOpenChange={(open) => !open && setCasePendingDelete(null)}>
        <AlertDialogContent className="max-w-md border-destructive/20">
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-foreground">Delete incident report?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This will permanently remove case{" "}
              <span className="font-mono font-semibold text-foreground">{casePendingDelete?.caseId}</span>
              {casePendingDelete?.victimName ? (
                <>
                  {" "}for <span className="font-medium text-foreground">{casePendingDelete.victimName}</span>
                </>
              ) : null}
              , including its report, evidence records, timeline entries, milestones, and referrals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            This action cannot be undone.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-lg border-border bg-secondary text-sm text-foreground hover:bg-secondary/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingCase}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteCase();
              }}
              className="h-9 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeletingCase ? "Deleting..." : "Delete case"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IncidentReporting;
