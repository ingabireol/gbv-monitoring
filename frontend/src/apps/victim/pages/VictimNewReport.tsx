import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, CheckCircle2,
  EyeOff, Users, FileText,
} from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import { ReportMethodSelector, ReportMethod } from "@/components/ReportMethodSelector";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { toast } from "sonner";

/* ─── Constants ──────────────────────────────────────────── */
const INCIDENT_TYPES = [
  "Domestic Violence", "Sexual Assault", "Physical Abuse", "Emotional Abuse",
  "Child Neglect", "Child Labor", "Early Marriage", "Economic Abuse", "Stalking/Harassment",
];

const DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro",
];

const STEP_LABELS = ["Method", "Details", "Your Report", "Confirm"];
const todayInputValue = () => new Date().toISOString().slice(0, 10);

/* ─── Step indicator ─────────────────────────────────────── */
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-6">
      {STEP_LABELS.map((label, idx) => {
        const done   = idx < current;
        const active = idx === current;
        const isLast = idx === STEP_LABELS.length - 1;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                done   ? "bg-primary border-primary" :
                active ? "bg-primary/15 border-primary" :
                         "bg-secondary border-border"
              }`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  : <span className={`text-xs font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{idx + 1}</span>
                }
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

/* ─── Toggle ─────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-secondary border border-border"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

/* ─── Component ──────────────────────────────────────────── */
const VictimNewReport = () => {
  const navigate = useNavigate();
  const [step, setStep]           = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId]       = useState("");

  /* form state */
  const [method, setMethod]         = useState<ReportMethod | null>(null);
  const [anonymous, setAnonymous]   = useState(true);
  const [incidentType, setIncidentType] = useState("");
  const [district, setDistrict]     = useState("");
  const [date, setDate]             = useState("");
  const [time, setTime]             = useState("");
  const [witnesses, setWitnesses]   = useState(false);
  const [description, setDescription] = useState("");
  const [voiceBlob, setVoiceBlob]   = useState<Blob | null>(null);
  const [files, setFiles]           = useState<File[]>([]);

  /* ── validation ── */
  const canNext = () => {
    if (step === 0) return !!method;
    if (step === 1) return !!incidentType && !!district && !!date && date <= todayInputValue();
    if (step === 2) {
      if (method === "written") return description.trim().length >= 10;
      if (method === "voice")   return !!voiceBlob;
      if (method === "media")   return files.length > 0;
      if (method === "all")     return description.trim().length >= 10 || !!voiceBlob || files.length > 0;
    }
    return true;
  };

  const handleSubmit = () => {
    const id = `GBV-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setCaseId(id);
    setSubmitted(true);
    toast.success(`Report submitted — Case ${id} created`);
  };

  const handleReset = () => {
    setStep(0); setSubmitted(false); setCaseId("");
    setMethod(null); setAnonymous(true);
    setIncidentType(""); setDistrict(""); setDate(""); setTime("");
    setWitnesses(false); setDescription("");
    setVoiceBlob(null); setFiles([]);
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <VictimSidebar />
        <main className="flex-1 overflow-y-auto p-5 flex items-center justify-center">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-success/15 border-2 border-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Report Submitted</h2>
              <p className="text-sm text-muted-foreground">Your report has been received safely.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="label-text mb-2">YOUR CASE REFERENCE</p>
              <p className="font-heading text-2xl font-bold text-primary font-mono">{caseId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Save this reference. You can use it to track your case at any time.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
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
    );
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <VictimSidebar />
      <main className="flex-1 overflow-y-auto p-5">
        <div className="max-w-xl mx-auto">

          {/* Page title */}
          <div className="mb-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Submit a Report
            </h2>
            <p className="text-sm text-muted-foreground">
              Your information is private and protected
            </p>
          </div>

          <StepIndicator current={step} />

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">

            {/* ── Step 0: Method ── */}
            {step === 0 && (
              <>
                <p className="label-text">STEP 1 — HOW WOULD YOU LIKE TO REPORT?</p>
                <p className="text-xs text-muted-foreground">
                  Choose the method that feels most comfortable for you.
                </p>
                <ReportMethodSelector selected={method} onSelect={setMethod} />
              </>
            )}

            {/* ── Step 1: Details ── */}
            {step === 1 && (
              <>
                <p className="label-text">STEP 2 — INCIDENT DETAILS</p>

                {/* Anonymous toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Submit anonymously</p>
                      <p className="text-[10px] text-muted-foreground">Your identity will not be stored</p>
                    </div>
                  </div>
                  <Toggle checked={anonymous} onChange={() => setAnonymous((v) => !v)} />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Incident Type *</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                  >
                    <option value="">Select incident type…</option>
                    {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">District *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                  >
                    <option value="">Select district…</option>
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Date *</label>
                    <input
                      type="date"
                      autoComplete="off"
                      max={todayInputValue()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                    />
                    {date && date > todayInputValue() && (
                      <p className="text-[10px] text-destructive mt-1">Incident date cannot be in the future.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">
                      Time <span className="text-muted-foreground/60">(optional)</span>
                    </label>
                    <input
                      type="time"
                      autoComplete="off"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Were there witnesses?</p>
                  </div>
                  <Toggle checked={witnesses} onChange={() => setWitnesses((v) => !v)} />
                </div>
              </>
            )}

            {/* ── Step 2: Your Report ── */}
            {step === 2 && (
              <>
                <p className="label-text">STEP 3 — YOUR REPORT</p>

                {/* Written */}
                {(method === "written" || method === "all") && (
                  <div>
                    {method === "all" && (
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase mb-1.5 tracking-wide">Written Statement</p>
                    )}
                    <textarea
                      autoComplete="off"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Describe what happened in your own words…"
                      className="w-full rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200 resize-none"
                    />
                    <p className={`text-[10px] mt-1 ${description.length < 10 ? "text-muted-foreground" : "text-success"}`}>
                      {description.length} characters {description.length < 10 ? "(minimum 10)" : "✓"}
                    </p>
                  </div>
                )}

                {/* Voice */}
                {(method === "voice" || method === "all") && (
                  <div>
                    {method === "all" && (
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase mb-1.5 tracking-wide">Voice Recording</p>
                    )}
                    <VoiceRecorder onRecorded={setVoiceBlob} />
                  </div>
                )}

                {/* Media */}
                {(method === "media" || method === "all") && (
                  <div>
                    {method === "all" && (
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase mb-1.5 tracking-wide">Photos & Documents</p>
                    )}
                    <EvidenceUpload files={files} onChange={setFiles} />
                  </div>
                )}
              </>
            )}

            {/* ── Step 3: Confirm ── */}
            {step === 3 && (
              <>
                <p className="label-text">STEP 4 — REVIEW YOUR REPORT</p>
                <p className="text-xs text-muted-foreground">
                  Please review your information before submitting. Your case will be assigned within 24 hours.
                </p>
                <div className="space-y-3 bg-secondary rounded-lg p-4 border border-border">
                  {[
                    { label: "Reporting Method", value: method ?? "—" },
                    { label: "Submission Mode",  value: anonymous ? "Anonymous" : "Identified" },
                    { label: "Incident Type",    value: incidentType },
                    { label: "District",         value: district },
                    { label: "Date",             value: date },
                    { label: "Time",             value: time || "Not provided" },
                    { label: "Witnesses",        value: witnesses ? "Yes" : "No" },
                    { label: "Voice Recording",  value: voiceBlob ? "Recorded" : "None" },
                    { label: "Evidence Files",   value: files.length > 0 ? `${files.length} file(s)` : "None" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold shrink-0">{label}</p>
                      <p className="text-xs text-foreground text-right capitalize">{value}</p>
                    </div>
                  ))}
                  {description && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-1">Description</p>
                      <p className="text-xs text-foreground leading-relaxed">{description}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-4">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="h-9 px-4 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            <button
              onClick={() => {
                if (step < 3) setStep((s) => s + 1);
                else handleSubmit();
              }}
              disabled={!canNext()}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Submit Report" : "Next"}
              {step < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default VictimNewReport;
