import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  Shield,
  Users,
} from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { ReportMethod, ReportMethodSelector } from "@/components/ReportMethodSelector";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { getCurrentUser } from "@/lib/auth";
import { useCreateReportMutation } from "@/store/api";
import { toast } from "sonner";

const INCIDENT_TYPES = [
  "Domestic Violence",
  "Sexual Assault",
  "Physical Abuse",
  "Emotional Abuse",
  "Child Neglect",
  "Child Labor",
  "Early Marriage",
  "Economic Abuse",
  "Stalking/Harassment",
];

const DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro",
];

const STEP_LABELS = ["Method", "Details", "Report", "Confirm"];
const todayInputValue = () => new Date().toISOString().slice(0, 10);

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-6">
      {STEP_LABELS.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        const isLast = idx === STEP_LABELS.length - 1;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                done ? "bg-primary border-primary" : active ? "bg-primary/15 border-primary" : "bg-secondary border-border"
              }`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  : <span className={`text-xs font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{idx + 1}</span>}
              </div>
              <p className={`text-[9px] mt-1 font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </p>
            </div>
            {!isLast && (
              <div className={`h-0.5 w-8 sm:w-14 mx-1 rounded-full mb-3 ${idx < current ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function mapIncidentTypeToCaseType(incidentType: string): string {
  const normalized = incidentType.toLowerCase();
  if (normalized.includes("child") || normalized.includes("early marriage")) {
    return "CA";
  }
  return "GBV";
}

const VictimNewReportLive = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [createReport, { isLoading: isSubmitting }] = useCreateReportMutation();

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState("");
  const [method, setMethod] = useState<ReportMethod | null>(null);
  const [incidentType, setIncidentType] = useState("");
  const [district, setDistrict] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [witnesses, setWitnesses] = useState(false);
  const [description, setDescription] = useState("");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const canNext = () => {
    if (step === 0) return !!method;
    if (step === 1) return !!incidentType && !!district && !!date && date <= todayInputValue();
    if (step === 2) {
      if (method === "written") return description.trim().length >= 10;
      if (method === "voice") return !!voiceBlob;
      if (method === "media") return files.length > 0;
      if (method === "all") return description.trim().length >= 10 || !!voiceBlob || files.length > 0;
    }
    return true;
  };

  const resetForm = () => {
    setStep(0);
    setSubmitted(false);
    setCaseId("");
    setMethod(null);
    setIncidentType("");
    setDistrict("");
    setDate("");
    setTime("");
    setWitnesses(false);
    setDescription("");
    setVoiceBlob(null);
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Your session is missing. Please sign in again.");
      return;
    }

    const formData = new FormData();
    const summary = [
      `Incident type: ${incidentType}`,
      `District: ${district}`,
      `Date: ${date}`,
      time ? `Time: ${time}` : null,
      `Witnesses reported: ${witnesses ? "Yes" : "No"}`,
      method ? `Submission method: ${method}` : null,
      description.trim() ? `Statement: ${description.trim()}` : "Statement: Voice or media submission",
      `Reported by authenticated victim account: ${currentUser.username}`,
    ].filter(Boolean).join("\n");

    formData.append("type", mapIncidentTypeToCaseType(incidentType));
    formData.append("description", summary);
    formData.append("incidentDate", date);
    formData.append("incidentTime", time);
    formData.append("incidentLocation", district);
    formData.append("victimName", currentUser.name || currentUser.username);
    formData.append("victimAddress", district);

    files.forEach((file) => formData.append("files", file));
    if (voiceBlob) {
      formData.append(
        "files",
        new File([voiceBlob], `victim-report-${Date.now()}.webm`, {
          type: voiceBlob.type || "audio/webm",
        }),
      );
    }

    try {
      const response = await createReport(formData).unwrap();
      const nextCaseId = response?.data?.caseId;
      if (!nextCaseId) {
        throw new Error("No case ID returned");
      }

      setCaseId(nextCaseId);
      setSubmitted(true);
      toast.success(`Report submitted and linked to case ${nextCaseId}.`);
    } catch {
      toast.error("Unable to submit the report right now.");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <VictimSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-5">
            <div className="max-w-xl mx-auto bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-sm font-medium text-foreground">No active victim session</p>
              <p className="text-xs text-muted-foreground mt-1">Sign in again to submit a report from your account.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <VictimSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-5 flex items-center justify-center">
            <div className="max-w-md w-full text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-success/15 border-2 border-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Report Submitted</h2>
                <p className="text-sm text-muted-foreground">Your report has been saved to your victim account.</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="label-text mb-2">YOUR CASE REFERENCE</p>
                <p className="font-heading text-2xl font-bold text-primary font-mono">{caseId}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  You can track this case from your dashboard, case page, and notifications.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 h-9 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Submit Another
                </button>
                <button
                  onClick={() => navigate("/victim/case")}
                  className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors duration-200"
                >
                  <FileText className="w-4 h-4" /> Go to My Case
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <VictimSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Submit a Report</h2>
            <p className="text-sm text-muted-foreground">This report will be securely linked to your logged-in victim account.</p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-primary">
              Signed in as <span className="font-medium">{currentUser.name || currentUser.username}</span>. Your report will appear on your victim pages after submission.
            </p>
          </div>

          <StepIndicator current={step} />

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            {step === 0 && (
              <>
                <p className="label-text">STEP 1 | HOW WOULD YOU LIKE TO REPORT?</p>
                <p className="text-xs text-muted-foreground">
                  Choose the method that feels most comfortable for you.
                </p>
                <ReportMethodSelector selected={method} onSelect={setMethod} />
              </>
            )}

            {step === 1 && (
              <>
                <p className="label-text">STEP 2 | INCIDENT DETAILS</p>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Incident Type *</label>
                  <select
                    value={incidentType}
                    onChange={(event) => setIncidentType(event.target.value)}
                    className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                  >
                    <option value="">Select incident type...</option>
                    {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">District *</label>
                  <select
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                    className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                  >
                    <option value="">Select district...</option>
                    {DISTRICTS.map((districtName) => <option key={districtName} value={districtName}>{districtName}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Date *</label>
                    <input
                      type="date"
                      max={todayInputValue()}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                    />
                    {date && date > todayInputValue() && (
                      <p className="text-[10px] text-destructive mt-1">Incident date cannot be in the future.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setWitnesses((value) => !value)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Were there witnesses?</p>
                  </div>
                  <span className={`text-xs font-medium ${witnesses ? "text-primary" : "text-muted-foreground"}`}>
                    {witnesses ? "Yes" : "No"}
                  </span>
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="label-text">STEP 3 | YOUR REPORT</p>

                {(method === "written" || method === "all") && (
                  <div>
                    {method === "all" && (
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase mb-1.5 tracking-wide">Written Statement</p>
                    )}
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={5}
                      placeholder="Describe what happened in your own words..."
                      className="w-full rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200 resize-none"
                    />
                    <p className={`text-[10px] mt-1 ${description.length < 10 ? "text-muted-foreground" : "text-success"}`}>
                      {description.length} characters {description.length < 10 ? "(minimum 10)" : "| ready"}
                    </p>
                  </div>
                )}

                {(method === "voice" || method === "all") && (
                  <div>
                    {method === "all" && (
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase mb-1.5 tracking-wide">Voice Recording</p>
                    )}
                    <VoiceRecorder onRecorded={setVoiceBlob} />
                  </div>
                )}

                {(method === "media" || method === "all") && (
                  <div>
                    {method === "all" && (
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase mb-1.5 tracking-wide">Photos and Documents</p>
                    )}
                    <EvidenceUpload files={files} onChange={setFiles} />
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <p className="label-text">STEP 4 | REVIEW YOUR REPORT</p>
                <div className="space-y-3 bg-secondary rounded-lg p-4 border border-border">
                  {[
                    { label: "Account", value: currentUser.name || currentUser.username },
                    { label: "Method", value: method ?? "-" },
                    { label: "Incident Type", value: incidentType },
                    { label: "District", value: district },
                    { label: "Date", value: date },
                    { label: "Time", value: time || "Not provided" },
                    { label: "Witnesses", value: witnesses ? "Yes" : "No" },
                    { label: "Voice Recording", value: voiceBlob ? "Recorded" : "None" },
                    { label: "Evidence Files", value: files.length > 0 ? `${files.length} file(s)` : "None" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold shrink-0">{label}</p>
                      <p className="text-xs text-foreground text-right">{value}</p>
                    </div>
                  ))}
                  {description && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-1">Description</p>
                      <p className="text-xs text-foreground leading-relaxed">{description}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Lock className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-primary">
                    This report uses your authenticated account so it can appear on your dashboard, case page, notifications, and support pages.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            {step > 0 && (
              <button
                onClick={() => setStep((value) => value - 1)}
                className="h-9 px-4 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            <button
              onClick={() => {
                if (step < 3) {
                  setStep((value) => value + 1);
                  return;
                }
                void handleSubmit();
              }}
              disabled={step < 3 ? !canNext() : isSubmitting}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? (isSubmitting ? "Submitting..." : "Submit Report") : "Next"}
              {step < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VictimNewReportLive;
