import { CheckCircle, Clock, Circle, User, FileText, ArrowRightLeft, HeartHandshake, Shield, AlertTriangle, XCircle } from "lucide-react";

export interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  actor: string;
  actorRole: string;
  type: "case" | "assignment" | "update" | "referral" | "support" | "evidence" | "alert" | "closed";
  status: "completed" | "current" | "pending";
}

const typeConfig = {
  case: { icon: FileText, color: "text-primary", bg: "bg-primary/15", border: "border-primary/30" },
  assignment: { icon: User, color: "text-info", bg: "bg-info/15", border: "border-info/30" },
  update: { icon: Clock, color: "text-warning", bg: "bg-warning/15", border: "border-warning/30" },
  referral: { icon: ArrowRightLeft, color: "text-purple-400", bg: "bg-purple-400/15", border: "border-purple-400/30" },
  support: { icon: HeartHandshake, color: "text-success", bg: "bg-success/15", border: "border-success/30" },
  evidence: { icon: Shield, color: "text-muted-foreground", bg: "bg-secondary", border: "border-border" },
  alert: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/15", border: "border-destructive/30" },
  closed: { icon: CheckCircle, color: "text-success", bg: "bg-success/15", border: "border-success/30" },
};

interface CaseTimelineProps {
  events: TimelineEvent[];
  showAll?: boolean;
}

export function CaseTimeline({ events, showAll = true }: CaseTimelineProps) {
  const displayed = showAll ? events : events.slice(0, 4);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {displayed.map((event, index) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;
          const isLast = index === displayed.length - 1;

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon circle */}
              <div className={`relative z-10 w-10 h-10 rounded-full border-2 ${config.bg} ${config.border} flex items-center justify-center shrink-0`}>
                {event.status === "completed" ? (
                  <Icon className={`w-4 h-4 ${config.color}`} />
                ) : event.status === "current" ? (
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full ${config.bg} animate-ping opacity-75`} />
                    <Icon className={`w-4 h-4 ${config.color} relative z-10`} />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
                <div className={`bg-card border rounded-xl p-4 ${
                  event.status === "current"
                    ? `${config.border} shadow-sm`
                    : "border-border"
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm font-semibold ${
                      event.status === "current" ? config.color : "text-foreground"
                    }`}>
                      {event.title}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                      {event.time && <p className="text-[10px] text-muted-foreground">{event.time}</p>}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>

                  {/* Actor */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {event.actor} <span className="text-muted-foreground/60">·</span> {event.actorRole}
                    </span>
                    {event.status === "current" && (
                      <span className={`ml-auto text-[10px] font-bold uppercase ${config.color}`}>
                        Current Stage
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sample timeline data factory
export function generateSampleTimeline(caseId: string): TimelineEvent[] {
  return [
    {
      id: "1",
      date: "March 12, 2024",
      time: "09:15 AM",
      title: "Case Filed",
      description: `Case ${caseId} was registered in the system after the victim reported a domestic violence incident in Gasabo district.`,
      actor: "Amina Uwase",
      actorRole: "Social Worker",
      type: "case",
      status: "completed",
    },
    {
      id: "2",
      date: "March 12, 2024",
      time: "11:30 AM",
      title: "Case Priority Set to High",
      description: "Based on the severity of the reported incident the case was flagged as High priority for immediate attention.",
      actor: "System",
      actorRole: "Automated",
      type: "alert",
      status: "completed",
    },
    {
      id: "3",
      date: "March 13, 2024",
      time: "08:00 AM",
      title: "Officer Assigned",
      description: "Sgt. Uwimana from Gasabo District Police Station was assigned to investigate this case.",
      actor: "Emmanuel Ndayisaba",
      actorRole: "District Administrator",
      type: "assignment",
      status: "completed",
    },
    {
      id: "4",
      date: "March 14, 2024",
      time: "10:45 AM",
      title: "Investigation Started",
      description: "Sgt. Uwimana conducted an initial interview with the victim and began collecting evidence from the scene.",
      actor: "Sgt. Uwimana",
      actorRole: "Police Officer",
      type: "update",
      status: "completed",
    },
    {
      id: "5",
      date: "March 15, 2024",
      time: "02:00 PM",
      title: "Referred to Isange One Stop Centre",
      description: "Victim was referred to Isange One Stop Centre — Gasabo District Hospital for medical examination and psychological support.",
      actor: "Amina Uwase",
      actorRole: "Social Worker",
      type: "referral",
      status: "completed",
    },
    {
      id: "6",
      date: "March 16, 2024",
      time: "09:00 AM",
      title: "Medical Examination Completed",
      description: "Medical examination was conducted at Isange One Stop Centre. Medical report filed and attached to case.",
      actor: "Dr. Claire Mukamana",
      actorRole: "Partner Institution Officer",
      type: "evidence",
      status: "completed",
    },
    {
      id: "7",
      date: "March 20, 2024",
      time: "10:00 AM",
      title: "Counseling Session 1 of 8",
      description: "First psychological counseling session completed at Kigali Mental Health Center. Victim reported feeling more confident.",
      actor: "Rwanda Mental Health Programme",
      actorRole: "Support Provider",
      type: "support",
      status: "current",
    },
    {
      id: "8",
      date: "April 2, 2024",
      time: "Scheduled",
      title: "Legal Consultation",
      description: "Legal consultation scheduled with Rwanda Legal Aid Forum to discuss victim rights and court process.",
      actor: "Rwanda Legal Aid Forum",
      actorRole: "Partner Institution",
      type: "referral",
      status: "pending",
    },
    {
      id: "9",
      date: "TBD",
      time: "",
      title: "Case Resolution",
      description: "Case will be closed after all investigation steps are completed and victim support services are delivered.",
      actor: "Sgt. Uwimana",
      actorRole: "Police Officer",
      type: "closed",
      status: "pending",
    },
  ];
}
