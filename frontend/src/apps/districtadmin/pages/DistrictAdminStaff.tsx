import { useMemo, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BackendCase,
  BackendUser,
  formatDateTime,
  getCurrentDistrict,
  mapBackendCasesToDistrictRows,
  scopeCasesToDistrict,
  scopeUsersToDistrict,
} from "@/apps/districtadmin/lib/districtAdminData";
import { BackendReferral } from "@/lib/referralDb";
import { useCreateUserMutation, useDeleteUserMutation, useGetAllReferralsQuery, useGetCasesQuery, useGetUsersQuery, useUpdateUserMutation, useUpdateUserStatusMutation } from "@/store/api";
import { toast } from "sonner";

interface StaffRow {
  id: string;
  name: string;
  role: "Social Worker" | "Police Officer";
  district: string;
  workload: number;
  status: string;
  email: string;
  username: string;
  backendRole: "POLICE" | "SOCIAL_WORKER";
  lastLogin: string;
}

const statusBadge: Record<string, string> = {
  Active: "bg-success/15 text-success",
  Disabled: "bg-secondary text-muted-foreground",
};

const roleBadge: Record<StaffRow["role"], string> = {
  "Social Worker": "bg-info/15 text-info",
  "Police Officer": "bg-primary/15 text-primary",
};

const DistrictAdminStaff = () => {
  const currentDistrict = getCurrentDistrict();
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"POLICE" | "SOCIAL_WORKER">("POLICE");
  const [newPassword, setNewPassword] = useState("");
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);
  const [deleteStaffTarget, setDeleteStaffTarget] = useState<StaffRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"POLICE" | "SOCIAL_WORKER">("POLICE");
  const [editPassword, setEditPassword] = useState("");
  const { data: casesData, isLoading: isLoadingCases, error: casesError } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: referralsData, isLoading: isLoadingReferrals, error: referralsError } = useGetAllReferralsQuery({});
  const { data: policeUsersData, isLoading: isLoadingPolice, refetch: refetchPolice } = useGetUsersQuery({ role: "POLICE" });
  const { data: socialWorkerUsersData, isLoading: isLoadingSocialWorkers, refetch: refetchSocialWorkers } = useGetUsersQuery({ role: "SOCIAL_WORKER" });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const districtCases = useMemo(() => {
    const items = (casesData?.data?.content ?? []) as BackendCase[];
    return scopeCasesToDistrict(mapBackendCasesToDistrictRows(items), currentDistrict);
  }, [casesData, currentDistrict]);

  const districtReferrals = useMemo(() => {
    const items = (referralsData?.data?.content ?? []) as BackendReferral[];
    const districtCaseIds = new Set(districtCases.map((item) => item.id));
    const districtCaseUuids = new Set(districtCases.map((item) => item.uuid));
    return items.filter((item) => districtCaseIds.has(item.caseId ?? "") || districtCaseUuids.has(item.caseUuid ?? ""));
  }, [districtCases, referralsData]);

  const districtPolice = scopeUsersToDistrict(((policeUsersData?.data ?? []) as BackendUser[]), currentDistrict);
  const districtSocialWorkers = scopeUsersToDistrict(((socialWorkerUsersData?.data ?? []) as BackendUser[]), currentDistrict);

  const assignedCaseCounts = districtCases.reduce<Record<string, number>>((acc, item) => {
    const key = item.assignedOfficer;
    if (key && key !== "Unassigned") {
      acc[key.toLowerCase()] = (acc[key.toLowerCase()] ?? 0) + 1;
    }
    return acc;
  }, {});

  const referralCountsByWorker = districtReferrals.reduce<Record<string, number>>((acc, item) => {
    const candidates = [item.referredBy];
    candidates.forEach((candidate) => {
      if (!candidate) return;
      const key = candidate.toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
    });
    return acc;
  }, {});

  const rows = useMemo<StaffRow[]>(() => {
    const policeRows = districtPolice.map((user) => ({
      id: user.id,
      name: user.displayName || user.username,
      role: "Police Officer" as const,
      district: user.district || currentDistrict || "Unknown district",
      workload: assignedCaseCounts[(user.username || "").toLowerCase()] ?? assignedCaseCounts[(user.email || "").toLowerCase()] ?? 0,
      status: user.enabled === false ? "Disabled" : "Active",
      email: user.email || "No email",
      username: user.username || user.email || "",
      backendRole: "POLICE" as const,
      lastLogin: formatDateTime(user.lastLoginAt),
    }));

    const socialWorkerRows = districtSocialWorkers.map((user) => ({
      id: user.id,
      name: user.displayName || user.username,
      role: "Social Worker" as const,
      district: user.district || currentDistrict || "Unknown district",
      workload:
        referralCountsByWorker[(user.displayName || "").toLowerCase()] ??
        referralCountsByWorker[(user.username || "").toLowerCase()] ??
        referralCountsByWorker[(user.email || "").toLowerCase()] ??
        0,
      status: user.enabled === false ? "Disabled" : "Active",
      email: user.email || "No email",
      username: user.username || user.email || "",
      backendRole: "SOCIAL_WORKER" as const,
      lastLogin: formatDateTime(user.lastLoginAt),
    }));

    return [...socialWorkerRows, ...policeRows].sort((left, right) => {
      if (left.role !== right.role) return left.role.localeCompare(right.role);
      return right.workload - left.workload || left.name.localeCompare(right.name);
    });
  }, [assignedCaseCounts, currentDistrict, districtPolice, districtSocialWorkers, referralCountsByWorker]);

  const totalStaff = rows.length;
  const socialWorkers = rows.filter((item) => item.role === "Social Worker").length;
  const policeOfficers = rows.filter((item) => item.role === "Police Officer").length;
  const isLoading = isLoadingCases || isLoadingReferrals || isLoadingPolice || isLoadingSocialWorkers;
  const hasError = Boolean(casesError || referralsError);

  const refreshStaff = async () => {
    await Promise.all([refetchPolice(), refetchSocialWorkers()]);
  };

  const handleCreateUser = async () => {
    const displayName = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!displayName || !email || !newPassword.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }

    try {
      await createUser({
        username: email,
        displayName,
        email,
        password: newPassword.trim(),
        role: newRole,
        district: currentDistrict,
      }).unwrap();
      toast.success("Staff account created");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("POLICE");
      await refreshStaff();
    } catch {
      toast.error("Unable to create staff account");
    }
  };

  const handleToggleStatus = async (item: StaffRow) => {
    try {
      await updateUserStatus({ id: item.id, enabled: item.status !== "Active" }).unwrap();
      toast.success("Staff status updated");
      await refreshStaff();
    } catch {
      toast.error("Unable to update staff status");
    }
  };

  const openEditModal = (item: StaffRow) => {
    setEditingStaff(item);
    setEditName(item.name);
    setEditUsername(item.username);
    setEditEmail(item.email === "No email" ? "" : item.email);
    setEditRole(item.backendRole);
    setEditPassword("");
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    if (!editName.trim() || !editUsername.trim() || !editEmail.trim()) {
      toast.error("Name, username, and email are required");
      return;
    }

    try {
      await updateUser({
        id: editingStaff.id,
        body: {
          username: editUsername.trim(),
          displayName: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          password: editPassword.trim() || null,
          role: editRole,
          district: currentDistrict,
        },
      }).unwrap();
      toast.success("Staff account updated");
      setEditingStaff(null);
      await refreshStaff();
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Unable to update staff account");
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaffTarget) return;
    try {
      await deleteUser(deleteStaffTarget.id).unwrap();
      toast.success("Staff account deleted");
      setDeleteStaffTarget(null);
      await refreshStaff();
    } catch {
      toast.error("Unable to delete staff account");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Staff Directory
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentDistrict || "District"} staff accounts for social workers and police officers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "TOTAL STAFF", value: totalStaff, color: "text-primary" },
              { label: "SOCIAL WORKERS", value: socialWorkers, color: "text-primary" },
              { label: "POLICE OFFICERS", value: policeOfficers, color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-secondary border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              Workload is based on assigned cases for police officers and recorded referral activity for social workers.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Full name"
                className="h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className="h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as "POLICE" | "SOCIAL_WORKER")}
                className="h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="POLICE">Police Officer</option>
                <option value="SOCIAL_WORKER">Social Worker</option>
              </select>
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Temporary password"
                type="password"
                className="h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                disabled={isCreating}
                onClick={() => void handleCreateUser()}
                className="h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors duration-200"
              >
                Create Staff
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="label-text">STAFF ROSTER</p>
            </div>

            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading staff directory...</div>
            ) : hasError ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Staff information is unavailable right now.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Name", "Role", "District", "Workload", "Account Status", "Email", "Last Login", "Actions"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleBadge[item.role]}`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.district}</td>
                        <td className="px-4 py-2.5 text-foreground">{item.workload}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge[item.status]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.email}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.lastLogin}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(item)}
                              className="h-7 w-7 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors duration-200"
                              title="Edit staff"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={isUpdatingStatus}
                              onClick={() => void handleToggleStatus(item)}
                              className="h-7 px-2.5 rounded-lg bg-secondary border border-border text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors duration-200"
                            >
                              {item.status === "Active" ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => setDeleteStaffTarget(item)}
                              className="h-7 w-7 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/15 inline-flex items-center justify-center transition-colors duration-200"
                              title="Delete staff"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No staff accounts were found for this district.
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

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingStaff(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="mb-5">
              <h3 className="font-heading text-lg font-semibold text-foreground">Edit Staff Account</h3>
              <p className="text-xs text-muted-foreground mt-1">Manage this {currentDistrict || "district"} staff profile.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-text mb-1.5 block">Full Name</label>
                <input value={editName} onChange={(event) => setEditName(event.target.value)} className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Username</label>
                <input value={editUsername} onChange={(event) => setEditUsername(event.target.value)} className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Email</label>
                <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Role</label>
                <select value={editRole} onChange={(event) => setEditRole(event.target.value as "POLICE" | "SOCIAL_WORKER")} className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="POLICE">Police Officer</option>
                  <option value="SOCIAL_WORKER">Social Worker</option>
                </select>
              </div>
              <div>
                <label className="label-text mb-1.5 block">New Password</label>
                <input type="password" placeholder="Leave blank to keep current password" value={editPassword} onChange={(event) => setEditPassword(event.target.value)} className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setEditingStaff(null)} className="h-10 rounded-lg bg-secondary border border-border text-sm text-foreground">Cancel</button>
              <button disabled={isUpdatingUser} onClick={() => void handleUpdateStaff()} className="h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {isUpdatingUser ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteStaffTarget !== null} onOpenChange={(open) => !open && setDeleteStaffTarget(null)}>
        <AlertDialogContent className="max-w-md border-destructive/20">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-foreground">Delete staff account?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This permanently removes <span className="font-medium text-foreground">{deleteStaffTarget?.name}</span> from the district staff directory.
              Any assigned cases or audit history will remain available without this account attached.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-lg border-border bg-secondary text-sm text-foreground hover:bg-secondary/80">
              Keep account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteStaff();
              }}
              className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingUser}
            >
              {isDeletingUser ? "Deleting..." : "Delete staff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DistrictAdminStaff;
