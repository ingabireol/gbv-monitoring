import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Search, CheckCircle2, Clock, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
  useLazyGetAnonymousReportStatusQuery,
  useUpdateAnonymousContactDetailsMutation,
} from "@/store/api";

const STEPS = [
  { label: "Report Received", Icon: CheckCircle2 },
  { label: "Under Review", Icon: Clock },
  { label: "Case Closed", Icon: FolderOpen },
];

const CheckStatus = () => {
  const navigate = useNavigate();
  const [refInput, setRefInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessContact, setWitnessContact] = useState("");
  const [getAnonymousReportStatus, { isFetching }] = useLazyGetAnonymousReportStatusQuery();
  const [updateAnonymousContactDetails, { isLoading: isSaving }] = useUpdateAnonymousContactDetailsMutation();

  const normalizedStatus = report?.aCase?.status?.toUpperCase?.() ?? "";
  const currentStep = normalizedStatus.includes("CLOSED") || normalizedStatus.includes("RESOLVED")
    ? 2
    : report?.aCase?.assignedOfficer ? 1 : 0;

  const handleCheck = async () => {
    if (!refInput.trim()) return;

    try {
      const result = await getAnonymousReportStatus(refInput.trim()).unwrap();
      const found = Boolean(result?.success && result?.data);
      setReport(found ? result.data : null);
      setReporterName(result?.data?.reporterName || "");
      setReporterContact(result?.data?.reporterContact || "");
      setIncidentLocation(result?.data?.incidentLocation || result?.data?.aCase?.victim?.address || "");
      setWitnessName(result?.data?.witnessName || "");
      setWitnessContact(result?.data?.witnessContact || "");
      setNotFound(!found);
      setChecked(true);
    } catch {
      setReport(null);
      setNotFound(true);
      setChecked(true);
    }
  };

  const handleSaveDetails = async () => {
    if (!report) return;

    try {
      await updateAnonymousContactDetails({
        reference: refInput.trim(),
        body: {
          reporterName,
          reporterContact,
          incidentLocation,
          witnessName,
          witnessContact,
        },
      }).unwrap();
      toast.success("Your follow-up details were saved.");
    } catch {
      toast.error("Unable to save follow-up details.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground mt-1">Check Report Status</h1>
          <p className="text-xs text-muted-foreground">GBV Monitor - MIGEPROF - Government of Rwanda</p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Enter your reference number or case ID</p>
              <p className="text-xs text-muted-foreground mb-4">
                Use the reference or anonymous case ID you received after submitting your anonymous report.
              </p>
              <div className="flex gap-2">
                <input
                  autoComplete="off"
                  value={refInput}
                  onChange={(event) => {
                    setRefInput(event.target.value);
                    setChecked(false);
                    setNotFound(false);
                  }}
                  onKeyDown={(event) => event.key === "Enter" && void handleCheck()}
                  placeholder="e.g. ANON-2026-4821"
                  className="flex-1 h-9 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200 font-mono"
                />
                <button
                  onClick={() => void handleCheck()}
                  disabled={!refInput.trim() || isFetching}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" /> {isFetching ? "Checking..." : "Check"}
                </button>
              </div>
            </div>
          </div>

          {checked && (
            <div className="border-t border-border">
              {notFound ? (
                <div className="px-6 py-5 text-center">
                  <p className="text-sm font-medium text-destructive mb-1">Reference not found</p>
                  <p className="text-xs text-muted-foreground">
                    The number <span className="font-mono text-foreground">{refInput.trim()}</span> does not match an anonymous report.
                  </p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="label-text">REFERENCE</p>
                    <span className="font-mono text-sm font-semibold text-foreground">{report?.reference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="label-text">CASE ID</p>
                    <span className="font-mono text-sm font-semibold text-foreground">{report?.aCase?.caseId || "-"}</span>
                  </div>

                  <div className="relative flex items-start justify-between">
                    <div className="absolute top-4 left-4 right-4 h-px bg-border" style={{ left: "calc(16.67% - 8px)", right: "calc(16.67% - 8px)" }} />
                    {STEPS.map((step, index) => {
                      const { Icon } = step;
                      const isActive = index === currentStep;
                      const isComplete = index < currentStep;
                      const iconCls = isComplete
                        ? "bg-success/20 text-success border-success/30"
                        : isActive
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-secondary text-muted-foreground border-border";
                      const labelCls = isActive ? "text-foreground font-semibold" : isComplete ? "text-success" : "text-muted-foreground";

                      return (
                        <div key={step.label} className="relative flex flex-col items-center gap-2 flex-1">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center z-10 ${iconCls}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <p className={`text-[11px] text-center ${labelCls}`}>{step.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                    <p className="text-xs text-foreground font-medium mb-0.5">Your report status is {report?.aCase?.status || "received"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      You can add names, contact details, location, or witness information so investigators can follow up.
                    </p>
                  </div>

                  <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
                    <p className="label-text">ADD FOLLOW-UP DETAILS</p>
                    {[
                      ["Your name (optional)", reporterName, setReporterName],
                      ["Phone or email", reporterContact, setReporterContact],
                      ["More exact location", incidentLocation, setIncidentLocation],
                      ["Witness name", witnessName, setWitnessName],
                      ["Witness phone or email", witnessContact, setWitnessContact],
                    ].map(([placeholder, value, setter]) => (
                      <input
                        key={placeholder as string}
                        value={value as string}
                        onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                        placeholder={placeholder as string}
                        className="h-9 w-full rounded-lg bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    ))}
                    <button
                      disabled={isSaving}
                      onClick={() => void handleSaveDetails()}
                      className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Details"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => navigate("/anonymous-report")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Submit a new report
          </button>
          <span className="text-border">-</span>
          <button
            onClick={() => navigate("/login")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Staff login
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckStatus;
