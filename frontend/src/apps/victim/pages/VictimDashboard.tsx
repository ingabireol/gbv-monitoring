import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  FileText,
  HeartHandshake,
  Moon,
  Phone,
  Plus,
  Sun,
} from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import {
  formatPortalDate,
  getCaseSummaryText,
  getOfficerName,
  useVictimPortalData,
} from "@/apps/victim/lib/useVictimPortalData";
import { getThemeMode, setThemeMode, ThemeMode } from "@/lib/theme";

const VictimDashboard = () => {
  const navigate = useNavigate();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode());
  const {
    currentUser,
    currentCase,
    notifications,
    steps,
    currentStepIndex,
    normalizedStatus,
    isLoading,
  } = useVictimPortalData();

  const handleThemeToggle = () => {
    const newMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(newMode);
    setThemeModeState(newMode);
  };

  const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  const STEPS = steps;
  const CURRENT_STEP = currentStepIndex;

  return (
    <div className="flex min-h-screen w-full">
      <VictimSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-5 space-y-5">

          <div className="flex justify-end mb-4">
            <button
              onClick={handleThemeToggle}
              title={themeMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors duration-200"
            >
              {themeMode === "dark"
                ? <Sun className="w-4 h-4 text-muted-foreground" />
                : <Moon className="w-4 h-4 text-muted-foreground" />
              }
            </button>
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Welcome{currentUser?.name ? `, ${currentUser.name}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground">You are not alone. We are here to help you.</p>
          </div>

          {/* Case status banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="label-text">YOUR CASE</p>
              <span className="font-mono text-xs text-muted-foreground">GBV-2024-0142</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              <p className="font-heading text-lg font-semibold text-foreground">Investigation In Progress</p>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Your officer Sgt. Uwimana is working on your case
            </p>

            {/* Step indicator */}
            <div className="flex items-start justify-between">
              {STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-200 ${
                    i < CURRENT_STEP
                      ? "bg-success/20 text-success"
                      : i === CURRENT_STEP
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {i < CURRENT_STEP ? "✓" : i + 1}
                  </div>
                  <p className={`text-[9px] text-center leading-tight ${
                    i === CURRENT_STEP ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action cards */}
          <div>
            <p className="font-heading text-base font-semibold text-foreground mb-3">
              What would you like to do?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <button
                onClick={() => navigate("/victim/case")}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 text-left"
              >
                <FileText className="w-8 h-8 text-primary mb-3" />
                <p className="font-heading text-sm font-semibold text-foreground">My Case</p>
                <p className="text-xs text-muted-foreground mt-1">See your case timeline and updates</p>
              </button>

              <button
                onClick={() => navigate("/victim/report")}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 text-left"
              >
                <Plus className="w-8 h-8 text-primary mb-3" />
                <p className="font-heading text-sm font-semibold text-foreground">New Report</p>
                <p className="text-xs text-muted-foreground mt-1">Report a new incident or add information</p>
              </button>

              <button
                onClick={() => navigate("/victim/support")}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 text-left"
              >
                <HeartHandshake className="w-8 h-8 text-primary mb-3" />
                <p className="font-heading text-sm font-semibold text-foreground">My Support</p>
                <p className="text-xs text-muted-foreground mt-1">Counseling, medical and legal services</p>
              </button>

            </div>
          </div>

          {/* Emergency banner */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-destructive animate-pulse shrink-0" />
            <p className="text-sm font-medium text-foreground">Need immediate help?</p>
            <p className="text-sm text-destructive font-semibold ml-auto shrink-0">Call 0800 300 030 — Free, 24/7</p>
          </div>

        </main>
      </div>
    </div>
  );
};

export default VictimDashboard;
