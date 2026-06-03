import { ReactNode, useMemo, useState } from "react";
import { ArrowRightLeft, Bell, ChevronDown, Pencil, X } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import {
  BackendReferral,
  formatDbDate,
  formatReferralStatus,
  getDaysWaiting,
  getReferralStatusClass,
  getReferralUrgencyClass,
} from "@/lib/referralDb";
import {
  useCreateReferralMutation,
  useGetAssignedCasesQuery,
  useGetAllReferralsQuery,
  useGetCasesQuery,
  useGetUsersQuery,
  useUpdateReferralMutation,
  useUpdateReferralStatusMutation,
} from "@/store/api";
import { toast } from "sonner";

interface BackendCase {
  id: string;
  caseId: string;
  victim?: { name?: string };
}

type ReferralMode = "creator" | "institution" | "all";

interface DbReferralWorkspaceProps {
  theme?: string;
  sidebar: ReactNode;
  title: string;
  description: string;
  mode: ReferralMode;
  createRole?: string;
  caseSource?: "all" | "assigned";
}

const DbReferralWorkspace = ({
  sidebar,
  title,
  description,
  mode,
  createRole = "SOCIAL_WORKER",
  caseSource = "all",
}: Omit<DbReferralWorkspaceProps, 'theme'>) => {
  const currentUser = getCurrentUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<BackendReferral | null>(null);
  const [editingReferral, setEditingReferral] = useState<BackendReferral | null>(null);
  const [formCase, setFormCase] = useState("");
  const [formInstitution, setFormInstitution] = useState("");
  const [formReason, setFormReason] = useState("");
  const [urgent, setUrgent] = useState(false);
  const { data: referralsData, isLoading, error, refetch } = useGetAllReferralsQuery({});
  const useAssignedCaseSource = caseSource === "assigned";
  const { data: casesData } = useGetCasesQuery({ page: 0, size: 100 }, { skip: useAssignedCaseSource });
  const { data: assignedCasesData } = useGetAssignedCasesQuery(undefined, { skip: !useAssignedCaseSource });
  const { data: partnersData } = useGetUsersQuery({ role: "PARTNER", enabled: true });
  const [createReferral, { isLoading: isCreating }] = useCreateReferralMutation();
  const [updateReferral, { isLoading: isSaving }] = useUpdateReferralMutation();
  const [updateReferralStatus, { isLoading: isUpdating }] = useUpdateReferralStatusMutation();

  const allReferrals = (referralsData?.data?.content ?? []) as BackendReferral[];
  const isPoliceCreator = createRole.toUpperCase() === "POLICE";
  const cases = (useAssignedCaseSource ? assignedCasesData?.data ?? [] : casesData?.data?.content ?? []) as BackendCase[];
  const partners = (partnersData?.data ?? []) as Array<{ institution?: string }>;

  const institutions = useMemo(() => {
    const values = new Set<string>();
    partners.forEach((partner) => {
      if (partner.institution) values.add(partner.institution);
    });
    allReferrals.forEach((referral) => {
      if (referral.referredTo) values.add(referral.referredTo);
    });
    return Array.from(values).sort();
  }, [allReferrals, partners]);

  const referrals = useMemo(() => {
    if (mode === "creator") {
      return allReferrals.filter((item) => item.referredBy === currentUser?.name || item.referredBy === currentUser?.username);
    }
    if (mode === "institution") {
      return allReferrals.filter((item) => item.referredTo === currentUser?.institution || item.referredTo === currentUser?.name);
    }
    return allReferrals;
  }, [allReferrals, currentUser, mode]);

  const completedCount = referrals.filter((item) => (item.status ?? "").toUpperCase() === "COMPLETED").length;
  const pendingCount = referrals.filter((item) => !["COMPLETED", "CANNOT_ASSIST"].includes((item.status ?? "").toUpperCase())).length;
  const needFollowUp = referrals.filter((item) => getDaysWaiting(item.createdAt) >= 3 && (item.status ?? "").toUpperCase() !== "COMPLETED");

  const resetForm = () => {
    setFormCase("");
    setFormInstitution("");
    setFormReason("");
    setUrgent(false);
    setEditingReferral(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (referral: BackendReferral) => {
    setEditingReferral(referral);
    setFormCase(referral.caseUuid || "");
    setFormInstitution(referral.referredTo || "");
    setFormReason(referral.reason || "");
    setUrgent((referral.urgency ?? "").toUpperCase() === "URGENT");
    setModalOpen(true);
  };

  const closeFormModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!formCase || !formInstitution || !formReason.trim()) return;

    try {
      await createReferral({
        caseId: formCase,
        referredTo: formInstitution,
        referredBy: currentUser?.name || currentUser?.username || "System user",
        referredByRole: createRole,
        institutionType: "Partner",
        reason: formReason,
        urgency: urgent ? "URGENT" : "NORMAL",
      }).unwrap();
      toast.success("Referral created");
      closeFormModal();
      await refetch();
    } catch {
      toast.error("Unable to create referral");
    }
  };

  const handleEdit = async () => {
    if (!editingReferral || !formCase || !formInstitution || !formReason.trim()) return;

    try {
      await updateReferral({
        id: editingReferral.id,
        caseId: formCase,
        referredTo: formInstitution,
        institutionType: "Partner",
        reason: formReason,
        urgency: urgent ? "URGENT" : "NORMAL",
      }).unwrap();
      toast.success("Referral updated");
      closeFormModal();
      await refetch();
    } catch {
      toast.error("Unable to update referral");
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selected) return;

    try {
      await updateReferralStatus({ id: selected.id, status }).unwrap();
      toast.success("Referral status updated");
      setSelected(null);
      await refetch();
    } catch {
      toast.error("Unable to update referral");
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {mode === "creator" && (
              <button
                onClick={openCreateModal}
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> New Referral
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: mode === "institution" ? "TOTAL RECEIVED" : "TOTAL REFERRALS", value: referrals.length, color: "text-foreground" },
              { label: "PENDING RESPONSE", value: pendingCount, color: "text-warning" },
              { label: "COMPLETED", value: completedCount, color: "text-success" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="label-text">REFERRAL HISTORY</p>
            </div>

            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading referrals...</div>
            ) : error ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-sm text-foreground">Unable to load referrals.</p>
                <button
                  onClick={() => void refetch()}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Victim", "Referred By", "Referred To", "Date", "Urgency", "Status", "Actions"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {referrals.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-secondary/40 transition-colors duration-150 ${getDaysWaiting(item.createdAt) >= 3 && (item.status ?? "").toUpperCase() !== "COMPLETED" ? "border-l-2 border-l-warning" : ""}`}
                      >
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId || item.id}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.victimName || "Unknown victim"}</td>
                        <td className="px-4 py-2.5 text-foreground">{item.referredBy || "System"}</td>
                        <td className="px-4 py-2.5 text-foreground">{item.referredTo || "Unknown institution"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatDbDate(item.createdAt)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getReferralUrgencyClass(item.urgency)}`}>
                            {(item.urgency ?? "NORMAL").toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getReferralStatusClass(item.status)}`}>
                            {formatReferralStatus(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {mode === "institution" ? (
                            <button
                              onClick={() => setSelected(item)}
                              className="h-6 px-2 rounded bg-primary/15 text-primary text-[10px] font-medium hover:bg-primary/25"
                            >
                              Update
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toast.success(item.reason || "No extra referral notes were stored for this record.")}
                                className="h-6 px-2 rounded bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                View
                              </button>
                              {mode === "creator" && (
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="h-6 px-2 rounded bg-primary/15 text-primary text-[10px] font-medium hover:bg-primary/25 inline-flex items-center gap-1"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {referrals.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No referrals found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {mode !== "institution" && needFollowUp.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <Bell className="w-3.5 h-3.5 text-warning shrink-0" />
                <p className="label-text text-warning">FOLLOW-UP REQUIRED - NO RESPONSE AFTER 3+ DAYS</p>
              </div>
              <div className="divide-y divide-border">
                {needFollowUp.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{`${item.caseId} to ${item.referredTo}`}</p>
                      <p className="text-[10px] text-muted-foreground">{item.victimName || "Unknown victim"} · Sent {formatDbDate(item.createdAt)} · {getDaysWaiting(item.createdAt)} days waiting</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${getReferralStatusClass(item.status)}`}>
                      {formatReferralStatus(item.status)}
                    </span>
                    <button
                      onClick={() => toast.success(`Reminder noted for ${item.referredTo}`)}
                      className="h-6 px-2 rounded bg-warning/15 text-warning text-[10px] font-medium hover:bg-warning/25"
                    >
                      Send Reminder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {mode === "creator" && modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-heading text-sm font-semibold text-foreground">{editingReferral ? "Edit Referral" : "New Referral"}</p>
              <button
                onClick={closeFormModal}
                className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-background"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="label-text">SELECT CASE</label>
                <div className="relative">
                  <select
                    value={formCase}
                    onChange={(event) => setFormCase(event.target.value)}
                    className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    <option value="">Choose a case...</option>
                    {cases.map((item) => (
                      <option key={item.id} value={item.id}>{item.caseId} - {item.victim?.name || "Unknown victim"}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
                {isPoliceCreator && cases.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">No assigned cases are available for referral.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="label-text">SELECT INSTITUTION</label>
                <div className="relative">
                  <select
                    value={formInstitution}
                    onChange={(event) => setFormInstitution(event.target.value)}
                    className="w-full h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    <option value="">Choose an institution...</option>
                    {institutions.map((institution) => (
                      <option key={institution} value={institution}>{institution}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-text">REASON FOR REFERRAL</label>
                <textarea
                  autoComplete="off"
                  value={formReason}
                  onChange={(event) => setFormReason(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Urgency:</span>
                {[false, true].map((value) => (
                  <button
                    key={String(value)}
                    onClick={() => setUrgent(value)}
                    className={`h-7 px-3 rounded-lg text-[10px] font-medium border ${
                      urgent === value
                        ? value
                          ? "bg-destructive/15 border-destructive/30 text-destructive"
                          : "bg-secondary border-primary text-foreground"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {value ? "Urgent" : "Normal"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={closeFormModal}
                className="flex-1 h-8 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={!formCase || !formInstitution || !formReason.trim() || isCreating || isSaving}
                onClick={() => void (editingReferral ? handleEdit() : handleCreate())}
                className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40"
              >
                {editingReferral ? "Save Changes" : "Submit Referral"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "institution" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-heading text-sm font-semibold text-foreground">Update Referral Status</p>
              <p className="text-[10px] text-muted-foreground mt-1">{selected.caseId} · {selected.victimName}</p>
            </div>
            <div className="p-5 space-y-2">
              {["RECEIVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANNOT_ASSIST"].map((status) => (
                <button
                  key={status}
                  disabled={isUpdating}
                  onClick={() => void handleStatusChange(status)}
                  className="w-full text-left h-9 px-3 rounded-lg bg-secondary border border-border text-xs text-foreground hover:bg-background transition-colors duration-200"
                >
                  {formatReferralStatus(status)}
                </button>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <button
                onClick={() => setSelected(null)}
                className="w-full h-8 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DbReferralWorkspace;
