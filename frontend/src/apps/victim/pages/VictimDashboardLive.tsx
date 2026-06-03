import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Download,
  FileText,
  HeartHandshake,
  Phone,
  Plus,
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
  getCaseSummaryText,
  getOfficerName,
  useVictimPortalData,
} from "@/apps/victim/lib/useVictimPortalData";
import { getUserFirstName } from "@/lib/auth";
import { exportToPDF } from "@/lib/exportUtils";
import { toast } from "sonner";

function normalizeStatusLabel(status?: string): string {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const VictimDashboardLive = () => {
  const navigate = useNavigate();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportCaseId, setExportCaseId] = useState("");
  const {
    currentUser,
    cases,
    currentCase,
    notifications,
    steps,
    currentStepIndex,
    normalizedStatus,
    isLoading,
  } = useVictimPortalData();

  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  const openExportDialog = () => {
    if (!cases.length) {
      toast.error("No case is available to export");
      return;
    }
    setExportCaseId(currentCase?.id || cases[0].id);
    setExportDialogOpen(true);
  };

  const handleExportCasePDF = () => {
    const selectedCase = cases.find((item) => item.id === exportCaseId) || currentCase;
    if (!selectedCase) return;

    exportToPDF(
      `Victim Case Detail - ${selectedCase.caseId}`,
      "Personal case summary from GBV Monitor",
      ["Field", "Value"],
      [
        ["Case ID", selectedCase.caseId],
        ["Status", normalizeStatusLabel(selectedCase.status)],
        ["Case Type", selectedCase.type || "Not available"],
        ["District", selectedCase.victim?.address || "Not provided"],
        ["Report Date", formatPortalDate(selectedCase.createdAt)],
        ["Last Updated", formatPortalDate(selectedCase.updatedAt)],
        ["Assigned Officer", getOfficerName(selectedCase)],
        ["Current Step", selectedCase.id === currentCase?.id ? steps[currentStepIndex] || "Not available" : "Open case page for latest progress"],
        ["Unread Updates", unreadNotifications],
      ],
      `victim-case-${selectedCase.caseId}`,
    );
    setExportDialogOpen(false);
    toast.success("Case detail exported as PDF");
  };

  return (
    <div className="flex min-h-screen w-full">
      <VictimSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Welcome{currentUser ? `, ${getUserFirstName(currentUser)}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground">You are not alone. We are here to help you.</p>
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Loading your victim portal...</p>
            </div>
          ) : currentCase ? (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <p className="label-text">YOUR CURRENT CASE</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{currentCase.caseId}</span>
                  <button
                    onClick={openExportDialog}
                    className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PDF
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                <p className="font-heading text-lg font-semibold text-foreground">{normalizedStatus}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-5">{getCaseSummaryText(currentCase)}</p>

              <div className="flex items-start justify-between gap-2">
                {steps.map((step, index) => (
                  <div key={step} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-200 ${
                      index < currentStepIndex
                        ? "bg-success/20 text-success"
                        : index === currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                    }`}>
                      {index < currentStepIndex ? "OK" : index + 1}
                    </div>
                    <p className={`text-[9px] text-center leading-tight ${
                      index === currentStepIndex ? "text-primary font-semibold" : "text-muted-foreground"
                    }`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">No case has been filed yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit your first report to start tracking it here.
                </p>
              </div>
              <button
                onClick={() => navigate("/victim/report")}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200"
              >
                Submit a Report
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="label-text mb-2">CASE STATUS</p>
              <p className="font-heading text-xl font-semibold text-foreground">
                {currentCase ? normalizedStatus : "No case yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {currentCase ? `Opened ${formatPortalDate(currentCase.createdAt)}` : "Reports you submit appear here instantly."}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="label-text mb-2">ASSIGNED OFFICER</p>
              <p className="font-heading text-xl font-semibold text-foreground">
                {currentCase ? getOfficerName(currentCase) : "Pending"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {currentCase?.assignedOfficer?.district || "A case officer will appear here once assigned."}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="label-text mb-2">UNREAD UPDATES</p>
              <p className="font-heading text-xl font-semibold text-foreground">{unreadNotifications}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Check notifications for case alerts, appointments, and support updates.
              </p>
            </div>
          </div>

          <div>
            <p className="font-heading text-base font-semibold text-foreground mb-3">
              What would you like to do?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <button
                onClick={() => navigate("/victim/case")}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 text-left"
              >
                <FileText className="w-8 h-8 text-primary mb-3" />
                <p className="font-heading text-sm font-semibold text-foreground">My Case</p>
                <p className="text-xs text-muted-foreground mt-1">See your case timeline and progress</p>
              </button>

              <button
                onClick={() => navigate("/victim/report")}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 text-left"
              >
                <Plus className="w-8 h-8 text-primary mb-3" />
                <p className="font-heading text-sm font-semibold text-foreground">New Report</p>
                <p className="text-xs text-muted-foreground mt-1">Submit a new report for support</p>
              </button>

              <button
                onClick={() => navigate("/victim/notifications")}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 text-left"
              >
                <Bell className="w-8 h-8 text-primary mb-3" />
                <p className="font-heading text-sm font-semibold text-foreground">Updates</p>
                <p className="text-xs text-muted-foreground mt-1">Read the notifications linked to your account</p>
              </button>

              <button
                onClick={() => navigate("/victim/support")}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 text-left"
              >
                <HeartHandshake className="w-8 h-8 text-primary mb-3" />
                <p className="font-heading text-sm font-semibold text-foreground">My Support</p>
                <p className="text-xs text-muted-foreground mt-1">Track support referrals and services</p>
              </button>
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 flex-wrap">
            <Phone className="w-5 h-5 text-destructive animate-pulse shrink-0" />
            <p className="text-sm font-medium text-foreground">Need immediate help?</p>
            <p className="text-sm text-destructive font-semibold ml-auto shrink-0">Call 0800 300 030 | Free, 24/7</p>
          </div>
        </main>
      </div>
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Choose case to export</AlertDialogTitle>
            <AlertDialogDescription>
              Select the case summary you want to save as a PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <label className="label-text mb-1.5 block">Case</label>
            <select
              value={exportCaseId}
              onChange={(event) => setExportCaseId(event.target.value)}
              className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.caseId} - {normalizeStatusLabel(item.status)} - {item.victim?.address || "No district"}
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleExportCasePDF();
              }}
            >
              Export PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VictimDashboardLive;
