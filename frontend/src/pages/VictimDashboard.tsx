import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Phone, MessageSquare, CheckCircle2, Circle,
  Clock, HeartHandshake, Scale, Stethoscope, Home,
  LogOut, ChevronRight, AlertTriangle, Lock,
  FileText, UserCheck, Activity,
} from "lucide-react";
import { clearRole } from "@/lib/auth";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────── */
type MilestoneStatus = "done" | "current" | "pending";

interface Milestone {
  label: string;
  status: MilestoneStatus;
  date: string | null;
}

interface SupportService {
  name: string;
  Icon: React.ElementType;
  sessions: number;
  total: number;
  available: boolean;
}

/* ─── Data ───────────────────────────────────────────────── */
const MILESTONES: Milestone[] = [
  { label: "Case Filed",       status: "done",    date: "2024-09-10" },
  { label: "Officer Assigned", status: "done",    date: "2024-09-11" },
  { label: "Support Started",  status: "current", date: "2024-09-18" },
  { label: "Reintegration",    status: "pending", date: null },
  { label: "Case Closed",      status: "pending", date: null },
];

const SERVICES: SupportService[] = [
  { name: "Counseling",  Icon: HeartHandshake, sessions: 3, total: 8, available: true  },
  { name: "Medical",     Icon: Stethoscope,    sessions: 2, total: 3, available: true  },
  { name: "Legal Aid",   Icon: Scale,          sessions: 1, total: 4, available: true  },
  { name: "Safe Housing",Icon: Home,           sessions: 0, total: 0, available: false },
];

/* ─── Component ──────────────────────────────────────────── */
const VictimDashboard = () => {
  const navigate = useNavigate();
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "victim");
    return () => document.documentElement.removeAttribute("data-theme");
  }, []);

  const handleLogout = () => {
    clearRole();
    navigate("/login", { replace: true });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    toast.success("Message sent to your case officer");
    setMessage("");
    setMessageOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-background">

      {/* Top bar */}
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground font-heading">GBV Monitor</p>
            <p className="text-[9px] text-muted-foreground">Survivor Portal · MIGEPROF</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/25">
            <Lock className="w-3 h-3 text-success" />
            <span className="text-[10px] font-medium text-success">Private Session</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* Welcome */}
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Your case reference: <span className="text-foreground font-medium font-mono">GBV-2024-0142</span>
            &nbsp;·&nbsp;Victim #00142
          </p>
        </div>

        {/* Case Progress */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="label-text mb-4">CASE PROGRESS</p>
          <div className="space-y-0">
            {MILESTONES.map((m, idx) => {
              const isLast = idx === MILESTONES.length - 1;
              return (
                <div key={m.label} className="flex gap-3">
                  {/* Icon + line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                      m.status === "done"
                        ? "bg-success/15 border-success"
                        : m.status === "current"
                          ? "bg-primary/15 border-primary"
                          : "bg-secondary border-border"
                    }`}>
                      {m.status === "done"
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        : m.status === "current"
                          ? <Activity className="w-3.5 h-3.5 text-primary" />
                          : <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 ${m.status === "done" ? "bg-success/40" : "bg-border"}`} />
                    )}
                  </div>
                  {/* Text */}
                  <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                    <p className={`text-sm font-medium ${
                      m.status === "pending" ? "text-muted-foreground" : "text-foreground"
                    }`}>
                      {m.label}
                    </p>
                    {m.date && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {m.date}
                      </p>
                    )}
                    {m.status === "current" && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Officer */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="label-text mb-3">YOUR CASE OFFICER</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-info/15 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-info" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Insp. Uwimana</p>
              <p className="text-xs text-muted-foreground">Gasabo District · GBV Unit</p>
            </div>
            <button
              onClick={() => setMessageOpen(true)}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors duration-200"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message
            </button>
          </div>

          {/* Inline message box */}
          {messageOpen && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <textarea
                autoComplete="off"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message… (anonymized before sending)"
                rows={3}
                className="w-full rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setMessageOpen(false); setMessage(""); }}
                  className="flex-1 h-7 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="flex-1 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Support Services */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="label-text mb-3">YOUR SUPPORT SERVICES</p>
          <div className="space-y-3">
            {SERVICES.map((s) => {
              const pct = s.total > 0 ? Math.round((s.sessions / s.total) * 100) : 0;
              const ServiceIcon = s.Icon;
              return (
                <div key={s.name} className={`flex items-center gap-3 ${!s.available ? "opacity-50" : ""}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    s.available ? "bg-success/15" : "bg-secondary"
                  }`}>
                    <ServiceIcon className={`w-4 h-4 ${s.available ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-foreground">{s.name}</p>
                      {s.available
                        ? <span className="text-[10px] text-muted-foreground">{s.sessions}/{s.total} sessions</span>
                        : <span className="text-[10px] text-muted-foreground">Not yet arranged</span>
                      }
                    </div>
                    {s.available && s.total > 0 && (
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-success transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Resources */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="label-text mb-3">EMERGENCY RESOURCES</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "GBV Hotline",    value: "3512",                Icon: Phone,          cls: "text-destructive bg-destructive/10 border-destructive/20" },
              { label: "Isange One Stop",value: "+250 788 311 001",    Icon: HeartHandshake, cls: "text-info bg-info/10 border-info/20" },
              { label: "SMS Reporting",  value: "SMS 3560",            Icon: MessageSquare,  cls: "text-success bg-success/10 border-success/20" },
              { label: "Legal Aid",      value: "Rwanda Bar",          Icon: Scale,          cls: "text-warning bg-warning/10 border-warning/20" },
            ].map(({ label, value, Icon, cls }) => (
              <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${cls}`}>
                <Icon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-sm font-heading font-bold mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report anonymously */}
        <button
          onClick={() => navigate("/anonymous-report")}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary border border-border hover:bg-secondary/70 hover:border-primary transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Submit an Anonymous Report</p>
              <p className="text-xs text-muted-foreground">No identity required</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Privacy footer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary border border-border">
          <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your identity is protected. Only your assigned officer and authorized MIGEPROF staff can access your case. To exit safely, press <span className="text-foreground font-medium">Exit</span> above or close this tab.
          </p>
        </div>

      </main>
    </div>
  );
};

export default VictimDashboard;
