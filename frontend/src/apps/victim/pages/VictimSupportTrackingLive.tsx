import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  HeartHandshake,
  Scale,
  ShieldPlus,
  Stethoscope,
} from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { formatPortalDate, useVictimPortalData } from "@/apps/victim/lib/useVictimPortalData";

type ServiceKind = "Counseling" | "Medical Support" | "Legal Aid" | "General Support";

function classifyService(label?: string, reason?: string): ServiceKind {
  const haystack = `${label ?? ""} ${reason ?? ""}`.toLowerCase();
  if (haystack.includes("legal") || haystack.includes("court") || haystack.includes("law")) {
    return "Legal Aid";
  }
  if (haystack.includes("medical") || haystack.includes("hospital") || haystack.includes("health")) {
    return "Medical Support";
  }
  if (haystack.includes("mental") || haystack.includes("psych") || haystack.includes("counsel")) {
    return "Counseling";
  }
  return "General Support";
}

const serviceIcons: Record<ServiceKind, typeof HeartHandshake> = {
  Counseling: HeartHandshake,
  "Medical Support": Stethoscope,
  "Legal Aid": Scale,
  "General Support": ShieldPlus,
};

const VictimSupportTrackingLive = () => {
  const { currentCase, referrals, isLoading, isCaseDetailsLoading } = useVictimPortalData();

  const groupedServices = Object.entries(
    referrals.reduce<Record<ServiceKind, typeof referrals>>((acc, referral) => {
      const service = classifyService(referral.referredTo, referral.reason);
      acc[service] = [...(acc[service] ?? []), referral];
      return acc;
    }, {
      Counseling: [],
      "Medical Support": [],
      "Legal Aid": [],
      "General Support": [],
    }),
  ).filter(([, items]) => items.length > 0);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <VictimSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-1">My Support Services</h2>
          <p className="text-sm text-muted-foreground">Track the real support referrals attached to your case</p>
        </div>

        {isLoading ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Loading support services...</p>
          </div>
        ) : !currentCase ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-foreground">No case available yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Support services appear here after a report is filed and referrals are created.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="label-text">CASE</p>
                <p className="text-sm font-medium text-foreground mt-1">{currentCase.caseId}</p>
              </div>
              {isCaseDetailsLoading && <p className="text-xs text-muted-foreground">Refreshing support records...</p>}
            </div>

            {groupedServices.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {groupedServices.map(([service, items]) => {
                  const Icon = serviceIcons[service as ServiceKind];
                  const latest = [...items].sort(
                    (left, right) => new Date(right.updatedAt ?? right.createdAt ?? "").getTime() - new Date(left.updatedAt ?? left.createdAt ?? "").getTime(),
                  )[0];
                  return (
                    <div key={service} className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{service}</p>
                            <p className="text-[10px] text-muted-foreground">{items.length} referral(s)</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold uppercase">
                          {latest?.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Latest provider: {latest?.referredTo || "Support partner"}
                      </p>
                      <div className="pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {latest?.reason || "Support notes will appear here once saved by staff."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-foreground">No support referrals recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This page is now live, but your case does not have any referrals in the database yet.
                </p>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="label-text">REFERRAL HISTORY</p>
              </div>
              <div className="divide-y divide-border">
                {referrals.length ? referrals.map((referral) => {
                  const isCompleted = (referral.status ?? "").toUpperCase() !== "PENDING";
                  const StatusIcon = isCompleted ? CheckCircle2 : (referral.dateAcknowledged ? Clock : Circle);
                  return (
                    <div key={referral.id} className="flex items-start gap-3 px-4 py-3">
                      <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isCompleted ? "text-success" : "text-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-xs font-medium text-foreground">{referral.referredTo || "Support Service"}</p>
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {referral.status || "Pending"}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {referral.referredBy || "Case Team"}{referral.referredByRole ? ` · ${referral.referredByRole}` : ""}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Created {formatPortalDate(referral.createdAt)}
                          </span>
                          {referral.dateAcknowledged && (
                            <span className="text-[10px] text-muted-foreground">
                              Acknowledged {formatPortalDate(referral.dateAcknowledged)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                          {referral.reason || "No referral notes were provided."}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="px-4 py-4">
                    <p className="text-sm text-muted-foreground">No referral history available.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <HeartHandshake className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Need additional support?</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Contact Isange One Stop Centre at <span className="text-foreground font-medium">+250 788 311 001</span> or
                  call the GBV Hotline <span className="text-foreground font-medium">0800 300 030</span> for immediate assistance.
                </p>
              </div>
            </div>
          </>
        )}
        </main>
      </div>
    </div>
  );
};

export default VictimSupportTrackingLive;
