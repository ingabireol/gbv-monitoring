import {
  HeartHandshake, Stethoscope, Scale, Calendar,
  CheckCircle2, Clock, Circle,
} from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";

/* ─── Types ──────────────────────────────────────────────── */
type ServiceStatus = "Active" | "Scheduled" | "Completed" | "Pending";

interface SupportService {
  name: string;
  Icon: React.ElementType;
  status: ServiceStatus;
  provider: string;
  sessions: number;
  total: number;
  nextAppt: string | null;
  notes: string;
}

interface Appointment {
  id: number;
  service: string;
  provider: string;
  date: string;
  time: string;
  location: string;
  status: "Upcoming" | "Completed" | "Cancelled";
}

/* ─── Data ───────────────────────────────────────────────── */
const SERVICES: SupportService[] = [
  {
    name: "Counseling",
    Icon: HeartHandshake,
    status: "Active",
    provider: "Isange One Stop Centre",
    sessions: 3,
    total: 8,
    nextAppt: "Dec 10, 2024 at 10:00",
    notes: "Sessions ongoing. Focus on trauma recovery and coping strategies.",
  },
  {
    name: "Medical Support",
    Icon: Stethoscope,
    status: "Active",
    provider: "Kacyiru Police Hospital",
    sessions: 2,
    total: 3,
    nextAppt: "Dec 12, 2024 at 09:00",
    notes: "Medical examination completed. Follow-up care in progress.",
  },
  {
    name: "Legal Aid",
    Icon: Scale,
    status: "Scheduled",
    provider: "Rwanda Bar Association",
    sessions: 1,
    total: 4,
    nextAppt: "Dec 15, 2024 at 14:00",
    notes: "Initial legal consultation completed. Documentation review upcoming.",
  },
];

const APPOINTMENTS: Appointment[] = [
  { id: 1, service: "Counseling",     provider: "Isange One Stop Centre",    date: "Dec 10, 2024", time: "10:00", location: "Isange Centre, Gasabo", status: "Upcoming"  },
  { id: 2, service: "Medical",        provider: "Kacyiru Police Hospital",   date: "Dec 12, 2024", time: "09:00", location: "Kacyiru Hospital",        status: "Upcoming"  },
  { id: 3, service: "Legal Aid",      provider: "Rwanda Bar Association",    date: "Dec 15, 2024", time: "14:00", location: "RBA Office, Kigali",       status: "Upcoming"  },
  { id: 4, service: "Counseling",     provider: "Isange One Stop Centre",    date: "Nov 26, 2024", time: "10:00", location: "Isange Centre, Gasabo",    status: "Completed" },
  { id: 5, service: "Medical",        provider: "Kacyiru Police Hospital",   date: "Nov 20, 2024", time: "09:30", location: "Kacyiru Hospital",         status: "Completed" },
];

/* ─── Helpers ────────────────────────────────────────────── */
const serviceStatusConfig: Record<ServiceStatus, { label: string; cls: string }> = {
  Active:    { label: "Active",    cls: "bg-success/15 text-success" },
  Scheduled: { label: "Scheduled", cls: "bg-info/15 text-info" },
  Completed: { label: "Completed", cls: "bg-secondary text-muted-foreground" },
  Pending:   { label: "Pending",   cls: "bg-warning/15 text-warning" },
};

const apptStatusIcon = (s: Appointment["status"]) =>
  s === "Completed" ? CheckCircle2 :
  s === "Cancelled" ? Circle : Clock;

const apptStatusCls = (s: Appointment["status"]) =>
  s === "Completed" ? "text-success" :
  s === "Cancelled" ? "text-muted-foreground" : "text-primary";

/* ─── Component ──────────────────────────────────────────── */
const VictimSupportTracking = () => {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <VictimSidebar />
      <main className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Page title */}
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
            My Support Services
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your counseling, medical, and legal support
          </p>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SERVICES.map((s) => {
            const pct = Math.round((s.sessions / s.total) * 100);
            const SIcon = s.Icon;
            const { label, cls } = serviceStatusConfig[s.status];
            return (
              <div key={s.name} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <SIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${cls}`}>
                    {label}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{s.provider}</p>
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Sessions</span>
                    <span className="text-[10px] font-medium text-foreground">{s.sessions}/{s.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {s.nextAppt && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>Next: <span className="text-foreground">{s.nextAppt}</span></span>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{s.notes}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Appointments list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="label-text">APPOINTMENT HISTORY</p>
          </div>
          <div className="divide-y divide-border">
            {APPOINTMENTS.map((a) => {
              const AIcon = apptStatusIcon(a.status);
              const aCls  = apptStatusCls(a.status);
              return (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <AIcon className={`w-4 h-4 shrink-0 mt-0.5 ${aCls}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">{a.service}</p>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        a.status === "Completed" ? "bg-success/15 text-success" :
                        a.status === "Cancelled" ? "bg-destructive/15 text-destructive" :
                        "bg-primary/15 text-primary"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.provider}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {a.date} at {a.time}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{a.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <HeartHandshake className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Need additional support?</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Contact Isange One Stop Centre at <span className="text-foreground font-medium">+250 788 311 001</span> or
              call the GBV Hotline <span className="text-foreground font-medium">0800 300 030</span> (free, 24/7).
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default VictimSupportTracking;
