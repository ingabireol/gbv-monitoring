import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Shield, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { formatDateTime, getRoleLabel, getUserDisplayName } from "@/lib/adminData";
import { useGetAuditLogsQuery, useGetUsersQuery, useUpdateUserStatusMutation } from "@/store/api";

const Settings = () => {
  const usersQuery = useGetUsersQuery();
  const logsQuery = useGetAuditLogsQuery();
  const [updateUserStatus, { isLoading: isUpdating }] = useUpdateUserStatusMutation();

  const users = (usersQuery.data?.data ?? []) as Array<{
    id: string;
    displayName?: string;
    username?: string;
    email?: string;
    role?: string;
    enabled?: boolean;
    district?: string;
    institution?: string;
    createdAt?: string;
    lastLoginAt?: string;
  }>;

  const logs = (logsQuery.data?.data ?? []) as Array<{
    id: string;
    action: string;
    timestamp?: string;
    userId?: string;
  }>;

  const roleCounts = useMemo(() => {
    return Object.entries(users.reduce<Record<string, number>>((acc, user) => {
      const role = getRoleLabel(user.role);
      acc[role] = (acc[role] ?? 0) + 1;
      return acc;
    }, {})).sort((left, right) => right[1] - left[1]);
  }, [users]);

  const riskEvents = useMemo(
    () => logs.filter((item) => /fail|suspend|deactivate|delete|export/i.test(item.action)).slice(0, 8),
    [logs],
  );

  const dormantUsers = useMemo(
    () => users.filter((user) => !user.lastLoginAt).slice(0, 6),
    [users],
  );

  const stats = {
    activeUsers: users.filter((user) => user.enabled !== false).length,
    inactiveUsers: users.filter((user) => user.enabled === false).length,
    riskEvents: riskEvents.length,
    roles: roleCounts.length,
  };

  const handleToggleStatus = async (user: { id: string; enabled?: boolean; displayName?: string; username?: string }) => {
    try {
      await updateUserStatus({ id: user.id, enabled: !(user.enabled ?? true) }).unwrap();
      toast.success(`${getUserDisplayName(user)} ${user.enabled === false ? 'activated' : 'deactivated'}`);
      void usersQuery.refetch();
    } catch {
      toast.error("Unable to update account status.");
    }
  };

  const isLoading = usersQuery.isLoading || logsQuery.isLoading;
  const hasError = Boolean(usersQuery.error || logsQuery.error);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Settings</h2>
              <p className="text-sm text-muted-foreground">Review account access, recent security signals, and user availability.</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-success">Security overview</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "ACTIVE USERS", value: stats.activeUsers, color: "text-primary" },
              { label: "INACTIVE USERS", value: stats.inactiveUsers, color: "text-warning" },
              { label: "RECENT RISK EVENTS", value: stats.riskEvents, color: "text-destructive" },
              { label: "ROLES IN USE", value: stats.roles, color: "text-info" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Loading settings overview...</div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Unable to load settings overview.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-4">Role Coverage</h3>
                  <div className="space-y-3">
                    {roleCounts.map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{role}</span>
                        <span className="font-semibold text-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="xl:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Account Access</h3>
                    <span className="label-text">CURRENT USERS</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          {['Name', 'Role', 'District / Institution', 'Status', 'Last Login', 'Action'].map((header) => (
                            <th key={header} className="px-5 py-3 text-left label-text">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 12).map((user) => (
                          <tr key={user.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                            <td className="px-5 py-3">
                              <p className="font-medium text-foreground">{getUserDisplayName(user)}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{user.email || 'No email'}</p>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">{getRoleLabel(user.role)}</td>
                            <td className="px-5 py-3 text-muted-foreground">{user.district || user.institution || 'Not assigned'}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.enabled === false ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.enabled === false ? 'bg-warning' : 'bg-success'}`} />
                                {user.enabled === false ? 'Inactive' : 'Active'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">{formatDateTime(user.lastLoginAt)}</td>
                            <td className="px-5 py-3">
                              <button
                                disabled={isUpdating}
                                onClick={() => void handleToggleStatus(user)}
                                className={`inline-flex items-center gap-1 text-[10px] font-medium ${user.enabled === false ? 'text-success' : 'text-destructive'}`}
                              >
                                {user.enabled === false ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                {user.enabled === false ? 'Activate' : 'Deactivate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Recent Security Signals</h3>
                    <span className="label-text">AUDIT REVIEW</span>
                  </div>
                  <div className="divide-y divide-border">
                    {riskEvents.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">No recent risk events were found.</div>
                    ) : (
                      riskEvents.map((item) => (
                        <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.userId || 'System user'} - {formatDateTime(item.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Attention Needed</h3>
                    <span className="label-text">ACCOUNT FOLLOW-UP</span>
                  </div>
                  <div className="divide-y divide-border">
                    {dormantUsers.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">Everyone in this view has signed in before.</div>
                    ) : (
                      dormantUsers.map((user) => (
                        <div key={user.id} className="px-5 py-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-info" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{getUserDisplayName(user)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">No sign-in activity has been recorded yet for this account.</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading text-base font-semibold text-foreground mb-3">Settings Notes</h3>
                <p className="text-sm text-muted-foreground">
                  This page uses the current user directory and audit history that are available now. Additional saved preferences can appear here when that feature is available.
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
