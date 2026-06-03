import {
  UserCheck, FileText, MapPin, Calendar,
} from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import { CaseTimeline, generateSampleTimeline } from "@/components/CaseTimeline";

/* ─── Case notes ─────────────────────────────────────────── */
const NOTES = [
  {
    id: 1,
    date: "2024-09-18",
    author: "Sgt. Uwimana",
    body: "Initial interview completed. Supporting evidence has been collected and is under review. Next steps will be communicated within 5 business days.",
  },
  {
    id: 2,
    date: "2024-09-25",
    author: "Sgt. Uwimana",
    body: "Follow-up meeting scheduled for October 2nd. Please bring any additional documentation you may have. Counseling session also confirmed for the same week.",
  },
];

/* ─── Component ──────────────────────────────────────────── */
const VictimCaseStatus = () => {
  return (
    <div className="flex min-h-screen w-full">
      <VictimSidebar />
      <main className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Page title */}
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
            My Case
          </h2>
          <p className="text-sm text-muted-foreground">
            Full details and current progress
          </p>
        </div>

        {/* Case header card */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="label-text mb-4">CASE DETAILS</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Case ID",        value: "GBV-2024-0142",    Icon: FileText },
              { label: "Report Date",    value: "September 10, 2024", Icon: Calendar },
              { label: "Incident Type",  value: "Domestic Violence", Icon: FileText },
              { label: "District",       value: "Gasabo",            Icon: MapPin },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">{label}</p>
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-info/15 text-info text-[10px] font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-info" />
              Investigation In Progress
            </span>
          </div>
        </div>

        {/* Case Timeline */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="label-text mb-4">CASE TIMELINE</p>
          <CaseTimeline events={generateSampleTimeline("GBV-2024-0142")} showAll={true} />
        </div>

        {/* Assigned officer card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="label-text mb-3">YOUR OFFICER</p>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-heading font-semibold text-foreground">Sgt. Uwimana</p>
              <p className="text-xs text-muted-foreground">Sergeant · Gasabo District · GBV Unit</p>
              <div className="mt-3 p-3 rounded-lg bg-secondary border border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are in good hands. Sgt. Uwimana is dedicated to your case and will contact you
                  for any updates. Your safety and well-being are our priority. If you have urgent concerns,
                  call <span className="text-foreground font-medium">0800 300 030</span> at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Case notes — read only */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="label-text">CASE NOTES</p>
            <span className="text-[10px] text-muted-foreground">Visible to you only</span>
          </div>
          <div className="divide-y divide-border">
            {NOTES.map((note) => (
              <div key={note.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">{note.author}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{note.date}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{note.body}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default VictimCaseStatus;
