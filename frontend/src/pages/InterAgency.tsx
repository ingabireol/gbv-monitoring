import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  Users,
  X,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import { BackendReferral, formatDbDate, formatReferralStatus, getReferralStatusClass } from "@/lib/referralDb";
import { useCreateReferralMutation, useGetAllReferralsQuery, useGetCasesQuery, useGetUsersQuery, useUpdateReferralStatusMutation } from "@/store/api";
import { toast } from "sonner";

interface BackendCase {
  id: string;
  caseId: string;
  type: string;
  victim?: { name?: string };
}

interface BackendUser {
  email?: string;
  institution?: string;
}

interface PartnerCard {
  institution: string;
  contact: string;
  active: number;
}

const STATUS_COLUMNS = ["PENDING", "SENT", "ACKNOWLEDGED", "COMPLETED"] as const;
const URGENCY_OPTIONS = ["NORMAL", "URGENT"] as const;

const InterAgency = () => {
  const currentUser = getCurrentUser();
  const isDistrictAdmin = currentUser?.role === "districtadmin";
  const districtName = currentUser?.district || "your district";
  const [showForm, setShowForm] = useState(false);
  const [formCaseId, setFormCaseId] = useState("");
  const [formAgency, setFormAgency] = useState("");
  const [formUrgency, setFormUrgency] = useState<(typeof URGENCY_OPTIONS)[number]>("NORMAL");
  const [formReason, setFormReason] = useState("");
  const { data: referralsData, isLoading, error, refetch } = useGetAllReferralsQuery({});
  const { data: casesData } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: partnersData } = useGetUsersQuery({ role: "PARTNER", enabled: true });
  const [createReferral, { isLoading: isCreating }] = useCreateReferralMutation();
  const [updateReferralStatus] = useUpdateReferralStatusMutation();

  const referrals = useMemo(
    () => (referralsData?.data?.content ?? []) as BackendReferral[],
    [referralsData],
  );
  const cases = useMemo(
    () => (casesData?.data?.content ?? []) as BackendCase[],
    [casesData],
  );
  const partnerUsers = useMemo(
    () => (partnersData?.data ?? []) as BackendUser[],
    [partnersData],
  );

  const partnerOptions = useMemo(() => {
    const names = new Set<string>();
    partnerUsers.forEach((item) => {
      if (item.institution) names.add(item.institution);
    });
    referrals.forEach((item) => {
      if (item.referredTo) names.add(item.referredTo);
    });
    return Array.from(names).sort();
  }, [partnerUsers, referrals]);

  const partnerCards = useMemo<PartnerCard[]>(() => {
    return partnerOptions.map((institution) => {
      const referralItems = referrals.filter((item) => item.referredTo === institution);
      const contact = partnerUsers.find((item) => item.institution === institution)?.email || "No contact on file";
      return {
        institution,
        contact,
        active: referralItems.filter((item) => (item.status ?? "").toUpperCase() !== "COMPLETED").length,
      };
    });
  }, [partnerOptions, partnerUsers, referrals]);

  const stats = {
    total: referrals.length,
    pending: referrals.filter((item) => ["PENDING", "SENT"].includes((item.status ?? "").toUpperCase())).length,
    acknowledged: referrals.filter((item) => ["ACKNOWLEDGED", "IN_PROGRESS"].includes((item.status ?? "").toUpperCase())).length,
    completed: referrals.filter((item) => (item.status ?? "").toUpperCase() === "COMPLETED").length,
  };

  const handleAdvance = async (referral: BackendReferral) => {
    const current = (referral.status ?? "").toUpperCase();
    const next = current === "PENDING"
      ? "SENT"
      : current === "SENT"
        ? "ACKNOWLEDGED"
        : current === "ACKNOWLEDGED"
          ? "COMPLETED"
          : null;

    if (!next) return;

    try {
      await updateReferralStatus({ id: referral.id, status: next }).unwrap();
      toast.success(`Referral moved to ${formatReferralStatus(next)}`);
      await refetch();
    } catch {
      toast.error("Unable to update referral");
    }
  };

  const handleCreate = async () => {
    const selectedCase = cases.find((item) => item.id === formCaseId);
    if (!selectedCase || !formAgency) {
      toast.error("Select a case and receiving institution.");
      return;
    }

    try {
      await createReferral({
        caseId: selectedCase.id,
        referredTo: formAgency,
        referredBy: currentUser?.name || currentUser?.username || "System user",
        referredByRole: isDistrictAdmin ? "DISTRICT_ADMIN" : "ADMIN",
        institutionType: "Partner",
        reason: formReason,
        urgency: formUrgency,
      }).unwrap();
      toast.success(`Referral created for ${selectedCase.caseId}`);
      setShowForm(false);
      setFormCaseId("");
      setFormAgency("");
      setFormUrgency("NORMAL");
      setFormReason("");
      await refetch();
    } catch {
      toast.error("Unable to create referral");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
                {isDistrictAdmin ? "District Coordination" : "Inter-Agency Coordination"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isDistrictAdmin
                  ? `Coordinate referrals and partner handoffs for cases in ${districtName}.`
                  : "Coordinate referrals and partner handoffs across institutions."}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-2 hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" /> New Referral
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TOTAL REFERRALS", value: stats.total, color: "text-primary" },
              { label: "PENDING / SENT", value: stats.pending, color: "text-warning" },
              { label: "ACKNOWLEDGED", value: stats.acknowledged, color: "text-info" },
              { label: "COMPLETED", value: stats.completed, color: "text-success" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-foreground">Referral Workflow</h3>
              <span className="label-text">{referrals.length} REFERRALS</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading referrals...</div>
            ) : error ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm text-foreground">Unable to load referrals.</p>
                <button
                  onClick={() => void refetch()}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-3" style={{ minWidth: "860px" }}>
                  {STATUS_COLUMNS.map((status) => {
                    const items = referrals.filter((item) => (item.status ?? "").toUpperCase() === status);
                    return (
                      <div key={status} className="flex-1 min-w-[210px] flex flex-col gap-2">
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg border bg-secondary/70 border-border">
                          <span className="text-xs font-semibold text-foreground">{formatReferralStatus(status)}</span>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-background text-foreground">
                            {items.length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 min-h-[80px]">
                          {items.map((item) => (
                            <div key={item.id} className="bg-background border border-border rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[10px] text-primary truncate">{item.caseId || item.id}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getReferralStatusClass(item.status)}`}>
                                  {item.urgency === "URGENT" ? "Urgent" : "Normal"}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">{item.victimName || "Unknown victim"}</p>
                                <p className="text-[10px] text-muted-foreground">{item.caseType || "Unknown case type"}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                <p className="text-[10px] text-muted-foreground truncate">{item.referredTo || "Unknown institution"}</p>
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">{formatDbDate(item.createdAt)}</span>
                                </div>
                                {status !== "COMPLETED" ? (
                                  <button
                                    onClick={() => void handleAdvance(item)}
                                    className="h-6 px-2 rounded-md bg-primary/15 border border-primary/30 text-[10px] font-medium text-primary flex items-center gap-1 hover:bg-primary/25"
                                  >
                                    Advance <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                                )}
                              </div>
                            </div>
                          ))}
                          {items.length === 0 && (
                            <div className="flex items-center justify-center h-16 rounded-lg border border-dashed border-border">
                              <span className="text-[10px] text-muted-foreground">No referrals</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-base font-semibold text-foreground">Partner Institutions</h3>
              <span className="label-text">{partnerCards.length} PARTNERS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {partnerCards.map((partner) => (
                <div key={partner.institution} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{partner.institution}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{partner.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{partner.active}</span> active referrals
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFormAgency(partner.institution);
                        setShowForm(true);
                      }}
                      className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90"
                    >
                      Refer
                    </button>
                  </div>
                </div>
              ))}
              {partnerCards.length === 0 && (
                <div className="col-span-full bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                  No partner institutions are available yet.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-background/60 transition-opacity duration-200 ${
          showForm ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowForm(false)}
      />

      <div
        className={`fixed right-0 top-0 h-full w-[360px] z-50 bg-card border-l border-border flex flex-col transition-transform duration-300 ${
          showForm ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">New Referral</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Create a referral using available cases and partner accounts.</p>
          </div>
          <button
            onClick={() => setShowForm(false)}
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="label-text">CASE *</label>
            <div className="relative">
              <select
                value={formCaseId}
                onChange={(event) => setFormCaseId(event.target.value)}
                className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 pr-8 appearance-none"
              >
                <option value="">Select case...</option>
                {cases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.caseId} - {item.victim?.name || "Unknown victim"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label-text">RECEIVING AGENCY *</label>
            <div className="relative">
              <select
                value={formAgency}
                onChange={(event) => setFormAgency(event.target.value)}
                className="h-9 w-full rounded-lg bg-background border border-border text-sm text-foreground px-3 pr-8 appearance-none"
              >
                <option value="">Select partner...</option>
                {partnerOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label-text">URGENCY</label>
            <div className="grid grid-cols-2 gap-2">
              {URGENCY_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => setFormUrgency(value)}
                  className={`h-9 rounded-lg border text-xs font-medium ${
                    formUrgency === value
                      ? value === "URGENT"
                        ? "bg-destructive/15 border-destructive/30 text-destructive"
                        : "bg-primary/15 border-primary/30 text-primary"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {value === "URGENT" ? "Urgent" : "Normal"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label-text">REFERRAL NOTES</label>
            <textarea
              value={formReason}
              onChange={(event) => setFormReason(event.target.value)}
              rows={4}
              placeholder="Describe the referral context..."
              className="w-full rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3 shrink-0">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 h-9 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            disabled={!formCaseId || !formAgency || isCreating}
            onClick={() => void handleCreate()}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Send Referral
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterAgency;
