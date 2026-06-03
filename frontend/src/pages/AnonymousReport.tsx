import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Lock,
  Search,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { ReportMethodSelector, ReportMethod } from "@/components/ReportMethodSelector";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { useCreateAnonymousReportMutation } from "@/store/api";
import { toast } from "sonner";

const INCIDENT_TYPES = [
  "Domestic Violence",
  "Sexual Assault",
  "Child Neglect",
  "Physical Abuse",
  "Emotional Abuse",
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

const STEPS = ["Method", "Incident", "Your Report", "Evidence", "Confirm"];

const todayInputValue = () => new Date().toISOString().slice(0, 10);

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-colors duration-200 ${
                  done
                    ? "bg-success/15 border-success text-success"
                    : active
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <p className={`text-[9px] mt-1 font-medium ${active ? "text-primary" : done ? "text-success" : "text-muted-foreground"}`}>
                {label}
              </p>
            </div>
            {!isLast && (
              <div className={`w-8 h-0.5 mb-4 mx-1 rounded-full ${done ? "bg-success/40" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const AnonymousReport = () => {
  const navigate = useNavigate();
  const [createAnonymousReport, { isLoading: isSubmitting }] = useCreateAnonymousReportMutation();

  const [step, setStep] = useState(0);
  const [trackId, setTrackId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [caseId, setCaseId] = useState("");
  const [method, setMethod] = useState<ReportMethod | null>(null);
  const [incidentType, setIncidentType] = useState("");
  const [district, setDistrict] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [hasWitnesses, setHasWitnesses] = useState(false);
  const [witnessName, setWitnessName] = useState("");
  const [witnessContact, setWitnessContact] = useState("");
  const [witnessLocation, setWitnessLocation] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const canNext = () => {
    if (step === 0) return !!method;
    if (step === 1) return !!incidentType && !!district && !!date && date <= todayInputValue();
    if (step === 2) {
      if (method === "written") return description.trim().length >= 10;
      if (method === "voice") return !!voiceBlob;
      if (method === "media") return true;
      if (method === "all") return description.trim().length >= 10 || !!voiceBlob;
    }
    return true;
  };

  const handleTrackExisting = () => {
    const value = trackId.trim().toUpperCase();
    if (!value) {
      toast.error("Enter your anonymous reference or case ID.");
      return;
    }
    navigate(`/check-status?ref=${encodeURIComponent(value)}`);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/login");
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    const summary = [
      `Incident type: ${incidentType}`,
      `District: ${district}`,
      `Date: ${date}`,
      `Witnesses reported: ${hasWitnesses ? "Yes" : "No"}`,
      method ? `Submission method: ${method}` : null,
      description.trim() ? `Statement: ${description.trim()}` : "Statement: Voice/media-only anonymous submission",
    ].filter(Boolean).join("\n");

    formData.append("type", "ANON");
    formData.append("description", summary);
    formData.append("incidentDate", date);
    formData.append("incidentLocation", district);
    formData.append("victimName", "Anonymous Reporter");
    formData.append("victimAddress", district);
    formData.append("witnessName", witnessName.trim());
    formData.append("witnessContact", witnessContact.trim());
    formData.append("witnessLocation", witnessLocation.trim());

    files.forEach((file) => formData.append("files", file));
    if (voiceBlob) {
      formData.append(
        "files",
        new File([voiceBlob], `anonymous-report-${Date.now()}.webm`, {
          type: voiceBlob.type || "audio/webm",
        }),
      );
    }

    try {
      const response = await createAnonymousReport(formData).unwrap();
      const nextReference = response?.data?.reference;
      const nextCaseId = response?.data?.caseId;
      if (!nextReference) {
        throw new Error("No reference returned");
      }

      setReference(nextReference);
      setCaseId(nextCaseId || "");
      setSubmitted(true);
      toast.success("Anonymous incident report submitted successfully.");
    } catch {
      toast.error("Unable to submit the anonymous incident report.");
    }
  };

  const handleReset = () => {
    setStep(0);
    setSubmitted(false);
    setReference("");
    setCaseId("");
    setMethod(null);
    setIncidentType("");
    setDistrict("");
    setDate("");
    setDescription("");
    setVoiceBlob(null);
    setHasWitnesses(false);
    setWitnessName("");
    setWitnessContact("");
    setWitnessLocation("");
    setFiles([]);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-2">Report Submitted</h2>
            <p className="text-sm text-muted-foreground">
              Your anonymous report has been received successfully.
            </p>
          </div>
          <div className="w-full bg-secondary border border-border rounded-xl p-5">
            <p className="label-text mb-2">YOUR REFERENCE NUMBER</p>
            <p className="font-mono text-2xl font-bold text-primary">{reference}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Save this number to check your report status.
            </p>
          </div>
          {caseId && (
            <div className="w-full bg-secondary border border-border rounded-xl p-5">
              <p className="label-text mb-2">YOUR ANONYMOUS CASE ID</p>
              <p className="font-mono text-2xl font-bold text-primary">{caseId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                You can also use this case ID on the status tracking page.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => navigate(`/check-status?ref=${encodeURIComponent(reference)}`)}
              className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200"
            >
              Check Report Status
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full h-9 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Go to Login
            </button>
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 mt-1"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-8">
        <button
          onClick={handleGoBack}
          className="mb-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex flex-col items-center gap-2 text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Report an Incident</h1>
          <p className="text-xs text-muted-foreground">MIGEPROF - Government of Rwanda</p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border mb-6">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Anonymous Report</p>
              <p className="text-[10px] text-muted-foreground">This public form submits anonymously only.</p>
            </div>
          </div>
          <div className="relative w-10 h-5 rounded-full bg-primary">
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-foreground" />
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground mb-1">Already submitted anonymously?</p>
              <p className="text-[11px] text-muted-foreground mb-2">
                Enter your reference number or anonymous case ID to track it directly.
              </p>
              <input
                autoComplete="off"
                value={trackId}
                onChange={(event) => setTrackId(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleTrackExisting()}
                placeholder="ANON-2026-4821"
                className="h-9 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleTrackExisting}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Track
            </button>
          </div>
        </div>

        <StepIndicator current={step} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Choose the method that feels most comfortable for you.
            </p>
            <ReportMethodSelector selected={method} onSelect={setMethod} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="label-text">INCIDENT TYPE *</label>
              <select
                value={incidentType}
                onChange={(event) => setIncidentType(event.target.value)}
                className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="">Select type...</option>
                {INCIDENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label-text">DISTRICT WHERE IT HAPPENED *</label>
              <select
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="">Select district...</option>
                {DISTRICTS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label-text">DATE OF INCIDENT *</label>
              <input
                type="date"
                max={todayInputValue()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-9 w-full sm:w-56 rounded-lg bg-background border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {date && date > todayInputValue() && (
                <p className="text-[10px] text-destructive">The incident date cannot be in the future.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {(method === "written" || method === "all") && (
              <div className="space-y-1.5">
                {method === "all" && <p className="label-text">WRITTEN STATEMENT</p>}
                <label className="label-text">
                  WHAT HAPPENED? {method !== "all" && "*"}{" "}
                  <span className="text-muted-foreground font-normal normal-case">(min. 10 characters)</span>
                </label>
                <textarea
                  autoComplete="off"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what happened. Include any details you feel safe sharing..."
                  rows={5}
                  className="w-full rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            )}

            {(method === "voice" || method === "all") && (
              <div>
                {method === "all" && <p className="label-text mb-2">VOICE RECORDING</p>}
                <VoiceRecorder onRecorded={setVoiceBlob} />
              </div>
            )}

            {(method === "written" || method === "all") && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                  <div>
                    <p className="text-xs font-medium text-foreground">Were there witnesses?</p>
                    <p className="text-[10px] text-muted-foreground">Add details that can help investigators contact them</p>
                  </div>
                  <button
                    onClick={() => setHasWitnesses((value) => !value)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${hasWitnesses ? "bg-primary" : "bg-secondary border border-border"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-200 ${hasWitnesses ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {hasWitnesses && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      autoComplete="off"
                      value={witnessName}
                      onChange={(event) => setWitnessName(event.target.value)}
                      placeholder="Witness name"
                      className="h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      autoComplete="off"
                      value={witnessContact}
                      onChange={(event) => setWitnessContact(event.target.value)}
                      placeholder="Phone or email"
                      className="h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      autoComplete="off"
                      value={witnessLocation}
                      onChange={(event) => setWitnessLocation(event.target.value)}
                      placeholder="Where they were"
                      className="h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </>
            )}

            {method === "media" && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-info/10 border border-info/20">
                <Upload className="w-4 h-4 text-info shrink-0" />
                <p className="text-xs text-info">Your photos and documents will be uploaded in the next step.</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Upload supporting photos, audio, video, or documents. This step is optional.
            </p>
            <EvidenceUpload files={files} onChange={setFiles} />
            {files.length > 0 && (
              <button
                onClick={() => setFiles([])}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <X className="w-3 h-3" /> Clear all files
              </button>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
              <p className="label-text">REVIEW YOUR REPORT</p>
              {[
                { label: "Method", value: method ?? "-" },
                { label: "Incident Type", value: incidentType },
                { label: "District", value: district },
                { label: "Date", value: date },
                { label: "Witnesses", value: hasWitnesses ? "Yes" : "No" },
                { label: "Witness Name", value: witnessName || "-" },
                { label: "Witness Contact", value: witnessContact || "-" },
                { label: "Voice", value: voiceBlob ? "Recorded" : "None" },
                { label: "Files", value: files.length > 0 ? `${files.length} file(s)` : "None" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold w-24 shrink-0 pt-0.5">{label}</p>
                  <p className="text-xs text-foreground capitalize">{value}</p>
                </div>
              ))}
              {description && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Description</p>
                  <p className="text-xs text-foreground leading-relaxed line-clamp-4">{description}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-[10px] text-primary">
                This public reporting form submits anonymously only. No identity fields are sent with this report.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={() => step > 0 ? setStep((value) => value - 1) : handleGoBack()}
            className="h-9 px-4 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          {step === 3 && (
            <button
              onClick={() => setStep(4)}
              className="h-9 px-4 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Skip
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep((value) => value + 1)}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40 flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              <EyeOff className="w-3.5 h-3.5" /> {isSubmitting ? "Submitting..." : "Submit Anonymously"}
            </button>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
          <Lock className="w-2.5 h-2.5" />
          This form sends an anonymous incident report without collecting your identity.
        </p>
      </div>
    </div>
  );
};

export default AnonymousReport;

