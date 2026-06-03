import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Search } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAssignOfficerMutation, useGetCasesQuery, useGetUsersQuery, useUpdateCaseStatusMutation } from "@/store/api";
import {
  BackendCase,
  BackendUser,
  DistrictCaseRow,
  getCurrentDistrict,
  mapBackendCasesToDistrictRows,
  scopeCasesToDistrict,
  scopeUsersToDistrict,
} from "@/apps/districtadmin/lib/districtAdminData";
import { toast } from "sonner";

const statusBadge: Record<DistrictCaseRow["status"], string> = {
  Critical: "bg-destructive/15 text-destructive",
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  "In Progress": "bg-info/15 text-info",
  Active: "bg-info/15 text-info",
  Pending: "bg-warning/15 text-warning",
  Resolved: "bg-success/15 text-success",
};

const DistrictAdminCases = () => {
  const currentDistrict = getCurrentDistrict();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [officerDrafts, setOfficerDrafts] = useState<Record<string, string>>({});
  const { data, error, isLoading, refetch } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: policeUsersData } = useGetUsersQuery({ role: "POLICE", enabled: true });
  const [assignOfficer, { isLoading: isAssigning }] = useAssignOfficerMutation();
  const [updateCaseStatus, { isLoading: isUpdatingStatus }] = useUpdateCaseStatusMutation();

  const allCases = useMemo<DistrictCaseRow[]>(() => {
    const items = (data?.data?.content ?? []) as BackendCase[];
    return scopeCasesToDistrict(mapBackendCasesToDistrictRows(items), currentDistrict);
  }, [currentDistrict, data]);

  const districtOptions = useMemo(
    () => ["All", ...Array.from(new Set(allCases.map((item) => item.district))).sort()],
    [allCases],
  );

  const districtOfficers = useMemo(() => {
    const users = (policeUsersData?.data ?? []) as BackendUser[];
    return scopeUsersToDistrict(users, currentDistrict);
  }, [currentDistrict, policeUsersData]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allCases.filter((item) => {
      const matchSearch = !query
        || item.id.toLowerCase().includes(query)
        || item.type.toLowerCase().includes(query)
        || item.victimName.toLowerCase().includes(query);
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchDistrict = districtFilter === "All" || item.district === districtFilter;
      return matchSearch && matchStatus && matchDistrict;
    });
  }, [allCases, districtFilter, search, statusFilter]);

  const handleStatusChange = async (item: DistrictCaseRow, status: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "RESOLVED") => {
    try {
      await updateCaseStatus({ id: item.uuid, status }).unwrap();
      toast.success(`Updated ${item.id}`);
      await refetch();
    } catch {
      toast.error("Unable to update case status");
    }
  };

  const handleAssign = async (item: DistrictCaseRow) => {
    const officerId = officerDrafts[item.uuid];
    if (!officerId) {
      toast.error("Choose an officer first");
      return;
    }

    try {
      await assignOfficer({ id: item.uuid, officerId }).unwrap();
      toast.success(`Assigned ${item.id}. The officer has been notified.`);
      setOfficerDrafts((current) => ({ ...current, [item.uuid]: "" }));
      await refetch();
    } catch {
      toast.error("Unable to assign officer");
    }
  };

  const isStatus = (item: DistrictCaseRow, status: DistrictCaseRow["status"]) => item.status === status;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Case Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage case records for {currentDistrict || "your district"}.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search case ID, victim, or type..."
                className="h-8 w-full pl-8 pr-3 rounded-lg bg-background border border-border text-sm text-primary placeholder:text-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer transition-colors duration-200"
              >
                {["All", "Accepted", "Rejected", "In Progress", "Active", "Pending", "Resolved", "Critical"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={districtFilter}
                onChange={(event) => setDistrictFilter(event.target.value)}
                className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer transition-colors duration-200"
              >
                {districtOptions.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="label-text">ALL CASES</p>
              <span className="text-[10px] text-muted-foreground">{filtered.length} case(s)</span>
            </div>

            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading cases...</div>
            ) : error ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-sm font-medium text-foreground">Unable to load cases</p>
                <button
                  onClick={() => refetch()}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Type", "Victim", "Status", "Assigned Officer", "District", "Reported Date", "Actions"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.id}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.type}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.victimName}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge[item.status]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-foreground">{item.assignedOfficer}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.district}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.reportedDate}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap items-center gap-2 min-w-[360px]">
                            <button
                              disabled={isUpdatingStatus || isStatus(item, "Accepted")}
                              onClick={() => void handleStatusChange(item, "ACCEPTED")}
                              className="h-7 px-2.5 rounded-lg bg-success/15 border border-success/30 text-[11px] text-success font-medium hover:bg-success/20 disabled:opacity-50 transition-colors duration-200"
                            >
                              {isStatus(item, "Accepted") ? "Accepted" : "Accept"}
                            </button>
                            <button
                              disabled={isUpdatingStatus || isStatus(item, "Rejected")}
                              onClick={() => void handleStatusChange(item, "REJECTED")}
                              className="h-7 px-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-[11px] text-destructive font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors duration-200"
                            >
                              {isStatus(item, "Rejected") ? "Rejected" : "Reject"}
                            </button>
                            <button
                              disabled={isUpdatingStatus || isStatus(item, "In Progress")}
                              onClick={() => void handleStatusChange(item, "IN_PROGRESS")}
                              className="h-7 px-2.5 rounded-lg bg-info/15 border border-info/30 text-[11px] text-info font-medium hover:bg-info/20 disabled:opacity-50 transition-colors duration-200"
                            >
                              {isStatus(item, "In Progress") ? "In Progress" : "Mark Progress"}
                            </button>
                            <button
                              disabled={isUpdatingStatus || isStatus(item, "Resolved")}
                              onClick={() => void handleStatusChange(item, "RESOLVED")}
                              className="h-7 px-2.5 rounded-lg bg-success/15 border border-success/30 text-[11px] text-success font-medium hover:bg-success/20 disabled:opacity-50 transition-colors duration-200 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {isStatus(item, "Resolved") ? "Resolved" : "Resolve"}
                            </button>
                            <select
                              value={officerDrafts[item.uuid] ?? ""}
                              onChange={(event) => setOfficerDrafts((current) => ({ ...current, [item.uuid]: event.target.value }))}
                              className="h-7 w-[150px] rounded-lg bg-background border border-border px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">{item.assignedOfficerId ? "Reassign officer" : "Assign officer"}</option>
                              {districtOfficers.map((officer) => (
                                <option key={officer.id} value={officer.id}>
                                  {officer.displayName || officer.username}
                                </option>
                              ))}
                            </select>
                            <button
                              disabled={isAssigning || !officerDrafts[item.uuid]}
                              onClick={() => void handleAssign(item)}
                              className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors duration-200"
                            >
                              Assign
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No cases match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DistrictAdminCases;
