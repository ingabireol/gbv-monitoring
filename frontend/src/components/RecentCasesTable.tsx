import { Search, MoreHorizontal } from "lucide-react";

interface CaseRow {
  id: string;
  victim: string;
  type: string;
  district: string;
  status: "Critical" | "Pending" | "In Progress" | "Resolved";
  officer: string;
  date: string;
}

const cases: CaseRow[] = [
  { id: "GBV-2024-0142", victim: "Victim #00142", type: "Domestic Violence", district: "Gasabo", status: "Critical", officer: "Sgt. Uwimana", date: "2024-03-12" },
  { id: "CA-2024-0089", victim: "Victim #00089", type: "Child Neglect", district: "Kicukiro", status: "Pending", officer: "Insp. Habimana", date: "2024-03-11" },
  { id: "GBV-2024-0138", victim: "Victim #00138", type: "Sexual Assault", district: "Nyarugenge", status: "In Progress", officer: "Cpl. Mukiza", date: "2024-03-10" },
  { id: "CA-2024-0085", victim: "Victim #00085", type: "Physical Abuse", district: "Huye", status: "Resolved", officer: "Sgt. Ingabire", date: "2024-03-09" },
  { id: "GBV-2024-0135", victim: "Victim #00135", type: "Emotional Abuse", district: "Musanze", status: "Pending", officer: "Insp. Nshuti", date: "2024-03-08" },
  { id: "CA-2024-0082", victim: "Victim #00082", type: "Child Labor", district: "Rubavu", status: "In Progress", officer: "Sgt. Kamana", date: "2024-03-07" },
  { id: "GBV-2024-0130", victim: "Victim #00130", type: "Domestic Violence", district: "Kamonyi", status: "Critical", officer: "Cpl. Bizimana", date: "2024-03-06" },
];

const statusClasses: Record<string, string> = {
  Critical: "status-critical",
  Pending: "status-pending",
  "In Progress": "status-in-progress",
  Resolved: "status-resolved",
};

const dotColors: Record<string, string> = {
  Critical: "bg-destructive",
  Pending: "bg-warning",
  "In Progress": "bg-info",
  Resolved: "bg-success",
};

export function RecentCasesTable() {
  return (
    <div className="bg-card border border-border rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Recent Incident Reports
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              placeholder="Search reports…"
              className="h-8 w-[180px] pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Case ID", "Victim", "Incident Type", "District", "Status", "Assigned Officer", "Date", ""].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left label-text">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border hover:bg-secondary/50 transition-colors duration-200"
              >
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{c.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{c.victim}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.type}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.district}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusClasses[c.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColors[c.status]}`} />
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.officer}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.date}</td>
                <td className="px-4 py-3">
                  <button className="w-7 h-7 rounded-md hover:bg-secondary flex items-center justify-center transition-colors duration-200">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
