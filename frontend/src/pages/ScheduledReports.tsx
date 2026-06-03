import { useMemo } from "react";
import { Calendar, Download, FileText, History, Mail } from "lucide-react";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { BackendCase, buildDistrictBreakdown, mapCasesToAdminRows } from "@/lib/adminData";
import { BackendReferral, formatDbDate, formatReferralStatus } from "@/lib/referralDb";
import {
  useGetAllReferralsQuery,
  useGetAuditLogsQuery,
  useGetCasesQuery,
  useGetTemplateNotificationsQuery,
} from "@/store/api";

interface TemplateNotification {
  id: string;
  name: string;
  trigger?: string;
  channel?: string;
  active?: boolean;
}

const ScheduledReports = () => {
  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });
  const referralsQuery = useGetAllReferralsQuery({});
  const auditLogsQuery = useGetAuditLogsQuery();
  const templatesQuery = useGetTemplateNotificationsQuery();

  const caseRows = useMemo(() => {
    const items = (casesQuery.data?.data?.content ?? []) as BackendCase[];
    return mapCasesToAdminRows(items);
  }, [casesQuery.data]);

  const referrals = (referralsQuery.data?.data?.content ?? []) as BackendReferral[];
  const templates = (templatesQuery.data?.data ?? []) as TemplateNotification[];
  const districtData = useMemo(() => buildDistrictBreakdown(caseRows), [caseRows]);

  const reportActivity = useMemo(() => {
    const items = (auditLogsQuery.data?.data ?? []) as Array<{ id: string; action: string; timestamp?: string; userId?: string }>;
    return items
      .filter((item) => /report|export|template/i.test(item.action))
      .sort((left, right) => new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime())
      .slice(0, 10);
  }, [auditLogsQuery.data]);

  const reportPacks = [
    {
      id: "case-summary",
      name: "Case Summary",
      description: "Overview of case volume, status, and district coverage.",
      rows: caseRows.map((item) => [item.id, item.victimName, item.type, item.district, item.status, item.reportedDate]),
      csvRows: caseRows.map((item) => ({
        Case_ID: item.id,
        Victim: item.victimName,
        Type: item.type,
        District: item.district,
        Status: item.status,
        Reported: item.reportedDate,
      })),
      headers: ["Case ID", "Victim", "Type", "District", "Status", "Reported"],
      filename: "scheduled-case-summary",
    },
    {
      id: "referral-summary",
      name: "Referral Summary",
      description: "Current referral destinations, urgency, and completion status.",
      rows: referrals.map((item) => [
        item.caseId || item.caseUuid || "Pending",
        item.referredTo || "Receiving institution pending",
        formatReferralStatus(item.status),
        item.urgency || "Normal",
        formatDbDate(item.updatedAt || item.createdAt),
      ]),
      csvRows: referrals.map((item) => ({
        Case: item.caseId || item.caseUuid || "Pending",
        Referred_To: item.referredTo || "Receiving institution pending",
        Status: formatReferralStatus(item.status),
        Urgency: item.urgency || "Normal",
        Updated: formatDbDate(item.updatedAt || item.createdAt),
      })),
      headers: ["Case", "Receiving Institution", "Status", "Urgency", "Updated"],
      filename: "scheduled-referral-summary",
    },
    {
      id: "district-overview",
      name: "District Overview",
      description: "District totals with resolved, pending, and critical counts.",
      rows: districtData.map((item) => [item.district, item.total, item.resolved, item.pending, item.critical, `${item.rate}%`]),
      csvRows: districtData.map((item) => ({
        District: item.district,
        Total: item.total,
        Resolved: item.resolved,
        Pending: item.pending,
        Critical: item.critical,
        Resolution_Rate: `${item.rate}%`,
      })),
      headers: ["District", "Total", "Resolved", "Pending", "Critical", "Resolution Rate"],
      filename: "scheduled-district-overview",
    },
  ];

  const stats = {
    reportPacks: reportPacks.length,
    activity: reportActivity.length,
    templates: templates.length,
    districts: districtData.length,
  };

  const exportPackAsPdf = (pack: (typeof reportPacks)[number]) => {
    exportToPDF(pack.name, pack.description, pack.headers, pack.rows, pack.filename);
    toast.success(`${pack.name} exported as PDF`);
  };

  const exportPackAsCsv = (pack: (typeof reportPacks)[number]) => {
    exportToCSV(pack.csvRows, pack.filename);
    toast.success(`${pack.name} exported as CSV`);
  };

  const isLoading = casesQuery.isLoading || referralsQuery.isLoading || auditLogsQuery.isLoading || templatesQuery.isLoading;
  const hasError = Boolean(casesQuery.error || referralsQuery.error || auditLogsQuery.error || templatesQuery.error);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Scheduled Reports</h2>
            <p className="text-sm text-muted-foreground">Generate current report packs and review recent reporting activity.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "REPORT PACKS", value: stats.reportPacks, color: "text-primary" },
              { label: "RECENT ACTIVITIES", value: stats.activity, color: "text-info" },
              { label: "MESSAGE TEMPLATES", value: stats.templates, color: "text-success" },
              { label: "DISTRICTS COVERED", value: stats.districts, color: "text-warning" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Loading report center...</div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Unable to load report center.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {reportPacks.map((pack) => (
                  <div key={pack.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-heading text-base font-semibold text-foreground">{pack.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{pack.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{pack.rows.length} record(s) ready for export.</div>
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => exportPackAsPdf(pack)}
                        className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={() => exportPackAsCsv(pack)}
                        className="flex-1 h-9 rounded-lg bg-secondary border border-border text-xs text-foreground hover:bg-secondary/80 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Recent Reporting Activity</h3>
                    <span className="label-text">LATEST EVENTS</span>
                  </div>
                  <div className="divide-y divide-border">
                    {reportActivity.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">No recent reporting activity was found.</div>
                    ) : (
                      reportActivity.map((item) => (
                        <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                            <History className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{item.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.userId || 'System user'} - {formatDbDate(item.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Message Templates</h3>
                    <span className="label-text">CURRENTLY AVAILABLE</span>
                  </div>
                  <div className="divide-y divide-border">
                    {templates.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">No templates are available yet.</div>
                    ) : (
                      templates.map((template) => (
                        <div key={template.id} className="px-5 py-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{template.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{template.trigger || 'Trigger pending'} - {(template.channel || 'both').toUpperCase()}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${template.active ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'}`}>
                            <Mail className="w-3 h-3 mr-1" />
                            {template.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-heading text-base font-semibold text-foreground">Reporting Notes</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This page uses the current case, referral, template, and audit records that are available today. Additional scheduling controls and delivery history can appear here when that feature is available.
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ScheduledReports;
