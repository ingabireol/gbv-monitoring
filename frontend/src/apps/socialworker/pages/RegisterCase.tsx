import { useMemo, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  EyeOff,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { SocialWorkerSidebar } from "@/apps/socialworker/components/SocialWorkerSidebar";
import {
  DISTRICTS,
  INCIDENT_TYPES,
  mapIncidentTypeToCaseType,
} from "@/apps/socialworker/lib/socialWorkerData";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  useCreateAnonymousReportMutation,
  useCreateReportMutation,
} from "@/store/api";

type ReporterType = "self" | "behalf" | "anonymous";
type VictimGender = "Female" | "Male" | "Other";
type Severity = "Low" | "Medium" | "High" | "Critical";

const SEVERITIES: Severity[] = ["Low", "Medium", "High", "Critical"];
const GENDERS: VictimGender[] = ["Female", "Male", "Other"];
const todayInputValue = () => new Date().toISOString().slice(0, 10);

const SuccessScreen = ({
  caseId,
  isChildCase,
  reporterType,
  onReset,
}: {
  caseId: string;
  isChildCase: boolean;
  reporterType: ReporterType;
  onReset: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7 text-success" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Case Registered</h3>
      <p className="text-sm text-muted-foreground mb-1">The case and report were saved successfully.</p>
      <p className="font-mono text-2xl font-bold text-primary mb-6">{caseId}</p>

      <div className="w-full max-w-sm bg-secondary border border-border rounded-xl p-4 text-left space-y-2 mb-6">
        <p className="label-text mb-3">NEXT STEPS</p>
        {[
          "The case and report were created successfully.",
          "Initial milestones and a timeline entry were seeded automatically.",
          reporterType === "anonymous" ? "This record was stored through the anonymous report flow." : "This record was stored through the authenticated report flow.",
          isChildCase ? "The case was stored with the child-protection case type." : "The case was stored with the GBV case type.",
          "Continue follow-up from Cases, Support, and Referrals.",
        ].map((step) => (
          <div key={step} className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{step}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/socialworker/cases")}
          className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors duration-200"
        >
          View All Cases
        </button>
        <button
          onClick={onReset}
          className="h-8 px-4 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          Register Another
        </button>
      </div>
    </div>
  );
};

const RegisterCase = () => {
  const currentUser = getCurrentUser();
  const [createReport, { isLoading: isSubmittingReport }] = useCreateReportMutation();
  const [createAnonymousReport, { isLoading: isSubmittingAnonymous }] = useCreateAnonymousReportMutation();

  const [reporterType, setReporterType] = useState<ReporterType | null>(null);
  const [submittedCaseId, setSubmittedCaseId] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [incidentDistrict, setIncidentDistrict] = useState("");
  const [victimDistrict, setVictimDistrict] = useState("");
  const [victimName, setVictimName] = useState("");
  const [victimGender, setVictimGender] = useState<VictimGender>("Female");
  const [victimAge, setVictimAge] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [witnessName, setWitnessName] = useState("");
  const [witnessContact, setWitnessContact] = useState("");
  const [witnessStatement, setWitnessStatement] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const isSubmitting = isSubmittingReport || isSubmittingAnonymous;
  const victimAgeValue = victimAge.trim() ? Number(victimAge) : undefined;
  const isChildCase = Boolean(victimAgeValue && victimAgeValue < 18) || incidentType.toLowerCase().includes("child") || incidentType.toLowerCase().includes("early marriage");

  const canSubmit = useMemo(() => {
    if (!reporterType) return false;
    if (!incidentType || !incidentDate || incidentDate > todayInputValue() || !incidentDistrict || description.trim().length < 10) return false;
    if (reporterType !== "anonymous" && !victimName.trim()) return false;
    if (victimAge.trim() && Number.isNaN(Number(victimAge))) return false;
    return true;
  }, [description, incidentDate, incidentDistrict, incidentType, reporterType, victimAge, victimName]);

  const resetForm = () => {
    setReporterType(null);
    setSubmittedCaseId("");
    setIncidentType("");
    setIncidentDate("");
    setIncidentTime("");
    setIncidentDistrict("");
    setVictimDistrict("");
    setVictimName("");
    setVictimGender("Female");
    setVictimAge("");
    setPhone("");
    setDescription("");
    setSeverity("Medium");
    setWitnessName("");
    setWitnessContact("");
    setWitnessStatement("");
    setFiles([]);
  };

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((current) => [...current, ...droppedFiles]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !reporterType) return;

    const formData = new FormData();
    const fullDescription = [
      `Reporter Type: ${reporterType}`,
      `Incident Type: ${incidentType}`,
      `Incident Date: ${incidentDate}`,
      incidentTime ? `Incident Time: ${incidentTime}` : null,
      `Incident District: ${incidentDistrict}`,
      victimDistrict ? `Victim District: ${victimDistrict}` : null,
      phone.trim() ? `Contact: ${phone.trim()}` : null,
      `Severity: ${severity}`,
      currentUser ? `Recorded By: ${currentUser.name || currentUser.username}` : null,
      witnessName.trim() ? `Witness Name: ${witnessName.trim()}` : null,
      witnessContact.trim() ? `Witness Contact: ${witnessContact.trim()}` : null,
      witnessStatement.trim() ? `Witness Statement: ${witnessStatement.trim()}` : null,
      `Narrative: ${description.trim()}`,
    ].filter(Boolean).join("\n");

    formData.append("type", mapIncidentTypeToCaseType(incidentType));
    formData.append("description", fullDescription);
    formData.append("incidentDate", incidentDate);
    formData.append("incidentTime", incidentTime);
    formData.append("incidentLocation", incidentDistrict);
    formData.append("reporterName", currentUser?.name || currentUser?.username || "");
    formData.append("reporterContact", phone.trim());
    formData.append("witnessName", witnessName.trim());
    formData.append("witnessContact", witnessContact.trim());
    formData.append("witnessStatement", witnessStatement.trim());
    formData.append("victimAddress", victimDistrict || incidentDistrict);

    if (reporterType !== "anonymous") {
      formData.append("victimName", victimName.trim());
      formData.append("victimGender", victimGender);
      if (victimAgeValue !== undefined && !Number.isNaN(victimAgeValue)) {
        formData.append("victimAge", String(victimAgeValue));
      }
    }

    files.forEach((file) => formData.append("files", file));

    try {
      const response = reporterType === "anonymous"
        ? await createAnonymousReport(formData).unwrap()
        : await createReport(formData).unwrap();

      const nextCaseId = response?.data?.caseId;
      if (!nextCaseId) {
        throw new Error("No case ID returned");
      }

      setSubmittedCaseId(nextCaseId);
      toast.success(`Case ${nextCaseId} was created successfully.`);
    } catch {
      toast.error("Unable to register the case right now.");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <SocialWorkerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Register New Case
            </h2>
            <p className="text-sm text-muted-foreground">
              Record a case and save it from the social worker portal.
            </p>
          </div>

          {currentUser && (
            <div className="bg-secondary border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">
                Signed in as <span className="text-foreground font-medium">{currentUser.name || currentUser.username}</span>.
                Signed-in submissions are linked to your account. Anonymous submissions are saved without victim identity details.
              </p>
            </div>
          )}

          {submittedCaseId ? (
            <div className="bg-card border border-border rounded-xl">
              <SuccessScreen
                caseId={submittedCaseId}
                isChildCase={isChildCase}
                reporterType={reporterType ?? "self"}
                onReset={resetForm}
              />
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="label-text mb-4">WHO IS REPORTING?</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { type: "self" as ReporterType, Icon: User, label: "Victim Present", desc: "The victim is present and details are entered directly." },
                    { type: "behalf" as ReporterType, Icon: Users, label: "On Behalf", desc: "You are recording the case for a victim who is not self-submitting." },
                    { type: "anonymous" as ReporterType, Icon: EyeOff, label: "Anonymous", desc: "Save the report without identifying victim details." },
                  ].map(({ type, Icon, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => setReporterType(type)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors duration-200 ${
                        reporterType === type
                          ? "border-primary bg-primary/5"
                          : "border-border bg-secondary hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        reporterType === type ? "bg-primary/20" : "bg-background"
                      }`}>
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {reporterType && (
                <div className="space-y-5">
                  {reporterType !== "anonymous" && (
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="label-text mb-4">SECTION A - VICTIM INFORMATION</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Victim Name *</label>
                          <input
                            autoComplete="off"
                            value={victimName}
                            onChange={(event) => setVictimName(event.target.value)}
                            placeholder="Full name"
                            className="h-8 w-full rounded-lg bg-background border border-border text-xs text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Contact Number</label>
                          <input
                            autoComplete="off"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="+250 7XX XXX XXX"
                            className="h-8 w-full rounded-lg bg-background border border-border text-xs text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Gender</label>
                          <div className="relative">
                            <select
                              value={victimGender}
                              onChange={(event) => setVictimGender(event.target.value as VictimGender)}
                              className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                            >
                              {GENDERS.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Age</label>
                          <input
                            type="number"
                            min={0}
                            value={victimAge}
                            onChange={(event) => setVictimAge(event.target.value)}
                            placeholder="Enter age"
                            className="h-8 w-full rounded-lg bg-background border border-border text-xs text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-medium text-foreground">District of Residence</label>
                          <div className="relative">
                            <select
                              value={victimDistrict}
                              onChange={(event) => setVictimDistrict(event.target.value)}
                              className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                            >
                              <option value="">Select district...</option>
                              {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="label-text mb-4">SECTION B - INCIDENT DETAILS</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Incident Type *</label>
                        <div className="relative">
                          <select
                            value={incidentType}
                            onChange={(event) => setIncidentType(event.target.value)}
                            className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                          >
                            <option value="">Select type...</option>
                            {INCIDENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">District of Incident *</label>
                        <div className="relative">
                          <select
                            value={incidentDistrict}
                            onChange={(event) => setIncidentDistrict(event.target.value)}
                            className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                          >
                            <option value="">Select district...</option>
                            {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Date of Incident *</label>
                        <input
                          type="date"
                          max={todayInputValue()}
                          value={incidentDate}
                          onChange={(event) => setIncidentDate(event.target.value)}
                          className="h-8 w-full rounded-lg bg-background border border-border text-xs text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {incidentDate && incidentDate > todayInputValue() && (
                          <p className="text-[10px] text-destructive">Incident date cannot be in the future.</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Time</label>
                        <input
                          type="time"
                          value={incidentTime}
                          onChange={(event) => setIncidentTime(event.target.value)}
                          className="h-8 w-full rounded-lg bg-background border border-border text-xs text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-foreground">Severity</label>
                        <div className="flex gap-2 flex-wrap">
                          {SEVERITIES.map((item) => (
                            <button
                              key={item}
                              onClick={() => setSeverity(item)}
                              className={`h-7 px-4 rounded-full text-xs font-medium border transition-colors duration-200 ${
                                severity === item
                                  ? item === "Critical" ? "bg-destructive/15 border-destructive text-destructive"
                                    : item === "High" ? "bg-warning/15 border-warning text-warning"
                                    : item === "Medium" ? "bg-info/15 border-info text-info"
                                    : "bg-success/15 border-success text-success"
                                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-foreground">Narrative *</label>
                        <textarea
                          autoComplete="off"
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          placeholder="Describe what happened as clearly as possible."
                          rows={5}
                          className="w-full rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                        <p className={`text-[10px] ${description.trim().length >= 10 ? "text-success" : "text-muted-foreground"}`}>
                          {description.trim().length} characters
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="label-text mb-4">SECTION C - EVIDENCE</p>
                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleFileDrop}
                      className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-center hover:border-primary/50 transition-colors duration-200"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">Drag files here or click to upload</p>
                      <p className="text-xs text-muted-foreground">Uploaded files will be attached to this case report.</p>
                      <label className="mt-2 h-7 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer">
                        Browse Files
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            const nextFiles = Array.from(event.target.files ?? []);
                            setFiles((current) => [...current, ...nextFiles]);
                          }}
                        />
                      </label>
                    </div>
                    {files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {files.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center gap-2 p-2 rounded-lg bg-secondary border border-border">
                            <Upload className="w-3.5 h-3.5 text-primary shrink-0" />
                            <p className="text-xs text-foreground flex-1 truncate">{file.name}</p>
                            <button
                              onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-background transition-colors duration-200"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="label-text mb-4">SECTION D - WITNESS INFORMATION</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Witness Name</label>
                        <input
                          autoComplete="off"
                          value={witnessName}
                          onChange={(event) => setWitnessName(event.target.value)}
                          placeholder="Full name"
                          className="h-8 w-full rounded-lg bg-background border border-border text-xs text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Witness Contact</label>
                        <input
                          autoComplete="off"
                          value={witnessContact}
                          onChange={(event) => setWitnessContact(event.target.value)}
                          placeholder="Phone or email"
                          className="h-8 w-full rounded-lg bg-background border border-border text-xs text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-foreground">Witness Statement</label>
                        <textarea
                          autoComplete="off"
                          value={witnessStatement}
                          onChange={(event) => setWitnessStatement(event.target.value)}
                          placeholder="Optional witness notes to include with this case."
                          rows={3}
                          className="w-full rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      Required fields must be completed before the case is saved.
                    </p>
                    <button
                      disabled={!canSubmit || isSubmitting}
                      onClick={() => void handleSubmit()}
                      className="h-9 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Submitting..." : "Register Case"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default RegisterCase;
