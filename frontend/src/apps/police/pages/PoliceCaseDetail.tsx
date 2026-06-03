import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Clock,
  FileText, Paperclip, ArrowRightLeft,
  ChevronDown, Calendar, MapPin, User, Printer,
} from "lucide-react";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CaseTimeline, generateSampleTimeline } from "@/components/CaseTimeline";
import AnonymousChatPanel from "@/components/AnonymousChatPanel";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────── */
type NoteVisibility  = "Internal" | "Visible to Victim";
type CaseStatus      = "Accepted" | "Rejected" | "Active" | "Pending Review" | "Overdue" | "Resolved";

interface OfficerNote {
  id: number;
  author: string;
  date: string;
  body: string;
  visibility: NoteVisibility;
}

/* ─── Case data ──────────────────────────────────────────── */
const CASE = {
  id:         "GBV-2024-0142",
  victimId:   "Victim #00142",
  type:       "Domestic Violence",
  district:   "Gasabo",
  reported:   "2024-09-10",
  daysOpen:   18,
  status:     "Overdue" as CaseStatus,
  priority:   "Critical",
};

const EVIDENCE_FILES = [
  { name: "interview_transcript_0142.pdf", size: "128 KB", date: "2024-09-18" },
  { name: "medical_report_0142.pdf",       size: "342 KB", date: "2024-09-19" },
  { name: "photo_evidence_01.jpg",         size: "1.2 MB", date: "2024-09-20" },
];

const EXISTING_NOTES: OfficerNote[] = [
  { id: 1, author: "Sgt. Uwimana", date: "2024-09-18", body: "Initial interview completed. Supporting evidence has been collected and is under review. Next steps communicated within 5 business days.", visibility: "Internal" },
  { id: 2, author: "Sgt. Uwimana", date: "2024-09-25", body: "Follow-up meeting scheduled for Oct 2nd. Counseling session also confirmed for same week.", visibility: "Visible to Victim" },
];

const STATUS_OPTIONS: CaseStatus[] = ["Accepted", "Rejected", "Active", "Pending Review", "Overdue", "Resolved"];

const statusClasses: Record<CaseStatus, string> = {
  Accepted:         "bg-success/15 text-success",
  Rejected:         "bg-destructive/15 text-destructive",
  Active:           "bg-success/15 text-success",
  "Pending Review": "bg-warning/15 text-warning",
  Overdue:          "bg-destructive/15 text-destructive",
  Resolved:         "bg-secondary text-muted-foreground",
};

/* ─── Component ──────────────────────────────────────────── */
const PoliceCaseDetail = () => {
  const navigate = useNavigate();
  const { id: caseUuid } = useParams<{ id: string }>();
  const [caseStatus, setCaseStatus] = useState<CaseStatus>(CASE.status);
  const [noteText, setNoteText]     = useState("");
  const [noteVis, setNoteVis]       = useState<NoteVisibility>("Internal");
  const [notes, setNotes]           = useState<OfficerNote[]>(EXISTING_NOTES);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNotes((prev) => [
      ...prev,
      { id: Date.now(), author: "Sgt. Uwimana", date: new Date().toISOString().split("T")[0], body: noteText.trim(), visibility: noteVis },
    ]);
    setNoteText("");
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <PoliceSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Back button */}
          <button
            onClick={() => navigate("/police/cases")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cases
          </button>

          {/* Case header */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="font-mono text-2xl font-bold text-foreground">{CASE.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusClasses[caseStatus]}`}>
                    {caseStatus}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-destructive/15 text-destructive">
                    {CASE.priority}
                  </span>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="no-print h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground flex items-center gap-1.5 hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Victim ID",  value: CASE.victimId,  Icon: User },
                { label: "Type",       value: CASE.type,      Icon: FileText },
                { label: "District",   value: CASE.district,  Icon: MapPin },
                { label: "Reported",   value: CASE.reported,  Icon: Calendar },
                { label: "Days Open",  value: `${CASE.daysOpen}d`, Icon: Clock },
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
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-12 gap-5">

            {/* LEFT — Timeline (8 cols) */}
            <div className="col-span-12 lg:col-span-8 space-y-5">

              {/* Case Timeline */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="label-text mb-4">CASE TIMELINE</p>
                <CaseTimeline events={generateSampleTimeline(CASE.id)} showAll={true} />
              </div>

            </div>

            {/* RIGHT — Status + Evidence + Referral (4 cols) */}
            <div className="col-span-12 lg:col-span-4 space-y-4">

              {/* Status update card */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-3">UPDATE STATUS</p>
                <div className="relative mb-3">
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                    className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
                <button
                  onClick={() => toast.success(`Case status updated to "${caseStatus}"`)}
                  className="w-full h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors duration-200"
                >
                  Save Status
                </button>
              </div>

              {/* Evidence files card */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">EVIDENCE FILES</p>
                  <button
                    onClick={() => toast.info("File attachment will be available after backend integration.")}
                    className="h-6 px-2 rounded bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
                  >
                    <Paperclip className="w-3 h-3" /> Attach
                  </button>
                </div>
                <div className="space-y-2">
                  {EVIDENCE_FILES.map((f) => (
                    <div key={f.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary border border-border">
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-foreground truncate">{f.name}</p>
                        <p className="text-[9px] text-muted-foreground">{f.size} · {f.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral card */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-3">REFERRALS</p>
                <div className="space-y-2">
                  {[
                    { name: "Isange One Stop Centre", type: "Medical", status: "Acknowledged", statusCls: "bg-info/15 text-info" },
                    { name: "Rwanda Bar Association",  type: "Legal",   status: "Sent",         statusCls: "bg-warning/15 text-warning" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-secondary border border-border">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-foreground">{r.name}</p>
                          <p className="text-[9px] text-muted-foreground">{r.type}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${r.statusCls}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => toast.info("Use the Inter-Agency Referrals page to create new referrals.")}
                  className="w-full mt-3 h-7 rounded-lg bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <ArrowRightLeft className="w-3 h-3" /> New Referral
                </button>
              </div>

            </div>
          </div>

          {/* Anonymous reporter chat — shown when navigated from a real case UUID */}
          {caseUuid && (
            <AnonymousChatPanel caseUuid={caseUuid} />
          )}

          {/* Officer notes — full width */}
          <div id="add-note-section" className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="label-text">OFFICER NOTES</p>
            </div>
            {/* Existing notes */}
            <div className="divide-y divide-border">
              {notes.map((note) => (
                <div key={note.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground">{note.author}</p>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        note.visibility === "Internal"
                          ? "bg-warning/15 text-warning"
                          : "bg-info/15 text-info"
                      }`}>
                        {note.visibility}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{note.body}</p>
                </div>
              ))}
            </div>
            {/* Add note form */}
            <div className="p-4 border-t border-border space-y-3">
              <p className="label-text">ADD NOTE</p>
              <textarea
                autoComplete="off"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter case note…"
                rows={3}
                className="w-full rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNoteVis("Internal")}
                    className={`h-7 px-3 rounded-lg text-[10px] font-medium border transition-colors duration-200 ${
                      noteVis === "Internal"
                        ? "bg-warning/15 border-warning/30 text-warning"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Internal
                  </button>
                  <button
                    onClick={() => setNoteVis("Visible to Victim")}
                    className={`h-7 px-3 rounded-lg text-[10px] font-medium border transition-colors duration-200 ${
                      noteVis === "Visible to Victim"
                        ? "bg-info/15 border-info/30 text-info"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Visible to Victim
                  </button>
                </div>
                <button
                  disabled={!noteText.trim()}
                  onClick={handleAddNote}
                  className="ml-auto h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40"
                >
                  Submit Note
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default PoliceCaseDetail;
