import { useMemo, useState } from "react";
import {
  Building2,
  Edit2,
  Handshake,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DISTRICTS } from "@/lib/adminData";
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
import { useCreateUserMutation, useDeleteUserMutation, useGetUsersQuery, useUpdateUserMutation, useUpdateUserStatusMutation } from "@/store/api";
import { toast } from "sonner";

type UserRole = "ADMIN" | "POLICE" | "SOCIAL_WORKER" | "DISTRICT_ADMIN" | "PARTNER" | "VICTIM";

interface BackendUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  role?: UserRole;
  enabled?: boolean;
  district?: string;
  institution?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

const roleConfig = {
  ADMIN: { label: "System Administrator", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: LayoutDashboard },
  POLICE: { label: "Police Officer", color: "text-[hsl(217,91%,60%)]", bg: "bg-[hsl(217,91%,60%)]/10", border: "border-[hsl(217,91%,60%)]/20", icon: Shield },
  SOCIAL_WORKER: { label: "Social Worker", color: "text-[hsl(168,70%,40%)]", bg: "bg-[hsl(168,70%,40%)]/10", border: "border-[hsl(168,70%,40%)]/20", icon: Users },
  DISTRICT_ADMIN: { label: "District Administrator", color: "text-[hsl(280,65%,50%)]", bg: "bg-[hsl(280,65%,50%)]/10", border: "border-[hsl(280,65%,50%)]/20", icon: Building2 },
  PARTNER: { label: "Partner Institution Officer", color: "text-[hsl(35,90%,50%)]", bg: "bg-[hsl(35,90%,50%)]/10", border: "border-[hsl(35,90%,50%)]/20", icon: Handshake },
  VICTIM: { label: "Victim", color: "text-info", bg: "bg-info/10", border: "border-info/20", icon: Users },
} as const;

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<BackendUser | null>(null);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("POLICE");
  const [newDistrict, setNewDistrict] = useState("");
  const [newInstitution, setNewInstitution] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("POLICE");
  const [editDistrict, setEditDistrict] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const { data, isLoading, error, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const users = (data?.data ?? []) as BackendUser[];

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = (user.displayName || user.username || "").toLowerCase().includes(searchTerm.toLowerCase())
        || (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !filterRole || user.role === filterRole;
      const matchesStatus = !filterStatus || String(Boolean(user.enabled)) === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [filterRole, filterStatus, searchTerm, users]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.enabled).length,
    inactiveUsers: users.filter((user) => !user.enabled).length,
    recentUsers: users.filter((user) => user.createdAt && new Date(user.createdAt).getTime() >= Date.now() - (1000 * 60 * 60 * 24 * 30)).length,
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Fill in the required fields.");
      return;
    }

    try {
      await createUser({
        username: newUsername,
        displayName: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        district: newRole === "PARTNER" ? null : newDistrict || null,
        institution: newRole === "PARTNER" ? newInstitution || null : null,
      }).unwrap();
      toast.success(`Account created for ${newName}`);
      setShowAddModal(false);
      setNewName("");
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewDistrict("");
      setNewInstitution("");
      setNewRole("POLICE");
      await refetch();
    } catch {
      toast.error("Unable to create user");
    }
  };

  const handleToggleStatus = async (user: BackendUser) => {
    try {
      await updateUserStatus({ id: user.id, enabled: !user.enabled }).unwrap();
      toast.success(`${user.displayName || user.username} ${user.enabled ? "deactivated" : "activated"}`);
      setActionMenu(null);
      await refetch();
    } catch {
      toast.error("Unable to update account status");
    }
  };

  const openEditModal = (user: BackendUser) => {
    setEditingUser(user);
    setEditName(user.displayName || user.username || "");
    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditRole((user.role || "POLICE") as UserRole);
    setEditDistrict(user.district || "");
    setEditInstitution(user.institution || "");
    setEditPassword("");
    setActionMenu(null);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editName.trim() || !editUsername.trim() || !editEmail.trim()) {
      toast.error("Name, username, and email are required.");
      return;
    }

    try {
      await updateUser({
        id: editingUser.id,
        body: {
          username: editUsername,
          displayName: editName,
          email: editEmail,
          password: editPassword || null,
          role: editRole,
          district: editRole === "PARTNER" ? null : editDistrict || null,
          institution: editRole === "PARTNER" ? editInstitution || null : null,
        },
      }).unwrap();
      toast.success("User account updated");
      setEditingUser(null);
      await refetch();
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Unable to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      await deleteUser(deleteUserTarget.id).unwrap();
      toast.success(`${deleteUserTarget.displayName || deleteUserTarget.username} deleted`);
      setDeleteUserTarget(null);
      setActionMenu(null);
      await refetch();
    } catch {
      toast.error("Unable to delete user");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">User Management</h2>
            <p className="text-sm text-muted-foreground">Review and manage staff accounts.</p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "TOTAL USERS", value: stats.totalUsers, color: "text-foreground" },
              { label: "ACTIVE", value: stats.activeUsers, color: "text-success" },
              { label: "INACTIVE", value: stats.inactiveUsers, color: "text-destructive" },
              { label: "ADDED THIS MONTH", value: stats.recentUsers, color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-3">
              <h3 className="font-heading text-base font-semibold text-foreground">Staff Accounts</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    placeholder="Search by name or email..."
                    className="h-8 w-[200px] pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <select
                  className="h-8 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterRole}
                  onChange={(event) => setFilterRole(event.target.value)}
                >
                  <option value="">All Roles</option>
                  {Object.entries(roleConfig).map(([role, cfg]) => (
                    <option key={role} value={role}>{cfg.label}</option>
                  ))}
                </select>
                <select
                  className="h-8 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Staff Account
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">Loading users...</div>
            ) : error ? (
              <div className="px-4 py-12 text-center space-y-3">
                <p className="text-sm text-foreground">Unable to load users.</p>
                <button
                  onClick={() => void refetch()}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Name", "Email", "Role", "District / Institution", "Status", "Last Login", "Created", "Actions"].map((header) => (
                        <th key={header} className="px-4 py-3 text-left label-text">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => {
                      const role = roleConfig[(user.role || "VICTIM") as keyof typeof roleConfig];
                      const RoleIcon = role.icon;
                      return (
                        <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{user.displayName || user.username}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{user.email || "No email"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${role.bg} ${role.color} ${role.border}`}>
                              <RoleIcon className="w-3 h-3" />
                              {role.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{user.district || user.institution || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              user.enabled
                                ? "bg-success/10 text-success border border-success/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                            }`}>
                              {user.enabled ? "active" : "inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-RW") : "Never"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-RW") : "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <button
                                onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                                className="w-7 h-7 rounded-md hover:bg-secondary flex items-center justify-center transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                              </button>
                              {actionMenu === user.id && (
                                <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg z-20 w-44 overflow-hidden">
                                  <button
                                    onClick={() => openEditModal(user)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit Account
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(user)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${
                                      user.enabled
                                        ? "text-destructive hover:bg-destructive/10"
                                        : "text-success hover:bg-success/10"
                                    }`}
                                  >
                                    {user.enabled ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                    {user.enabled ? "Deactivate Account" : "Activate Account"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteUserTarget(user);
                                      setActionMenu(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Account
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          No users found.
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="label-text mb-1.5 block">Full Name</label>
                <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={newName} onChange={(event) => setNewName(event.target.value)} />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Username</label>
                <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={newUsername} onChange={(event) => setNewUsername(event.target.value)} />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Work Email</label>
                <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Role</label>
                <select className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={newRole} onChange={(event) => setNewRole(event.target.value as UserRole)}>
                  {Object.entries(roleConfig).filter(([role]) => role !== "VICTIM").map(([role, cfg]) => (
                    <option key={role} value={role}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              {newRole !== "PARTNER" ? (
                <div>
                  <label className="label-text mb-1.5 block">District</label>
                  <select className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={newDistrict} onChange={(event) => setNewDistrict(event.target.value)}>
                    <option value="">Select district</option>
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label-text mb-1.5 block">Institution</label>
                  <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={newInstitution} onChange={(event) => setNewInstitution(event.target.value)} />
                </div>
              )}
              <div>
                <label className="label-text mb-1.5 block">Temporary Password</label>
                <input type="password" className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="h-10 rounded-lg bg-secondary border border-border text-sm text-foreground">Cancel</button>
              <button disabled={isCreating} onClick={() => void handleCreateUser()} className="h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Create Account</button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingUser(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5">
              <h3 className="font-heading text-lg font-semibold text-foreground">Edit Staff Account</h3>
              <p className="text-xs text-muted-foreground mt-1">Update identity, role, and placement details.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-text mb-1.5 block">Full Name</label>
                <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={editName} onChange={(event) => setEditName(event.target.value)} />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Username</label>
                <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={editUsername} onChange={(event) => setEditUsername(event.target.value)} />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Work Email</label>
                <input type="email" className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Role</label>
                <select className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={editRole} onChange={(event) => setEditRole(event.target.value as UserRole)}>
                  {Object.entries(roleConfig).filter(([role]) => role !== "VICTIM").map(([role, cfg]) => (
                    <option key={role} value={role}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              {editRole !== "PARTNER" ? (
                <div>
                  <label className="label-text mb-1.5 block">District</label>
                  <select className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={editDistrict} onChange={(event) => setEditDistrict(event.target.value)}>
                    <option value="">Select district</option>
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label-text mb-1.5 block">Institution</label>
                  <input className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={editInstitution} onChange={(event) => setEditInstitution(event.target.value)} />
                </div>
              )}
              <div>
                <label className="label-text mb-1.5 block">New Password</label>
                <input type="password" placeholder="Leave blank to keep current password" className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm" value={editPassword} onChange={(event) => setEditPassword(event.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setEditingUser(null)} className="h-10 rounded-lg bg-secondary border border-border text-sm text-foreground">Cancel</button>
              <button disabled={isUpdatingUser} onClick={() => void handleUpdateUser()} className="h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {isUpdatingUser ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteUserTarget !== null} onOpenChange={(open) => !open && setDeleteUserTarget(null)}>
        <AlertDialogContent className="max-w-md border-destructive/20">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-foreground">Delete this account?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This will permanently remove <span className="font-medium text-foreground">{deleteUserTarget?.displayName || deleteUserTarget?.username}</span>.
              Existing cases and audit records will stay in the system, but this user will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-lg border-border bg-secondary text-sm text-foreground hover:bg-secondary/80">
              Keep account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteUser();
              }}
              className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingUser}
            >
              {isDeletingUser ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
