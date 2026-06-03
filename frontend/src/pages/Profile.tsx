import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { BadgeCheck, Building2, Mail, MapPin, Phone, Save, User } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PartnerSidebar } from "@/apps/partner/components/PartnerSidebar";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";
import { SocialWorkerSidebar } from "@/apps/socialworker/components/SocialWorkerSidebar";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import { getCurrentUser, StoredUser } from "@/lib/auth";
import { DISTRICTS, getInitials, getRoleLabel } from "@/lib/adminData";
import { useLanguage } from "@/lib/language";
import { useGetCurrentProfileQuery, useUpdateCurrentProfileMutation } from "@/store/api";

function SidebarForRole({ user }: { user: StoredUser }) {
  if (user.role === "victim") return <VictimSidebar />;
  if (user.role === "police") return <PoliceSidebar />;
  if (user.role === "socialworker") return <SocialWorkerSidebar />;
  if (user.role === "districtadmin") return <DashboardSidebar />;
  if (user.role === "partner") return <PartnerSidebar />;
  return <DashboardSidebar />;
}

export default function Profile() {
  const currentUser = getCurrentUser();
  const { t } = useLanguage();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [district, setDistrict] = useState(currentUser?.district ?? "");
  const [institution, setInstitution] = useState(currentUser?.institution ?? "");
  const { data: profileData, refetch: refetchProfile } = useGetCurrentProfileQuery(undefined, { skip: !currentUser });
  const [updateCurrentProfile, { isLoading: isSaving }] = useUpdateCurrentProfileMutation();

  const initials = useMemo(() => getInitials(name || currentUser?.username || "User"), [currentUser?.username, name]);

  useEffect(() => {
    const profile = profileData?.data;
    if (!profile) return;
    setName(profile.displayName || profile.username || "");
    setEmail(profile.email || "");
    setDistrict(profile.district || "");
    setInstitution(profile.institution || "");
  }, [profileData]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const roleLabel = getRoleLabel(currentUser.role);

  const isVictim = currentUser.role === "victim";

  const handleSave = async () => {
    try {
      const response = await updateCurrentProfile({
        displayName: name.trim() || currentUser.username,
        email: email.trim(),
        district: district.trim() || null,
        institution: isVictim ? null : institution.trim() || null,
      }).unwrap();
      const saved = response?.data;

      setName(saved?.displayName || name.trim() || currentUser.username);
      setEmail(saved?.email || email.trim());
      setDistrict(saved?.district || "");
      setInstitution(isVictim ? "" : saved?.institution || "");
      await refetchProfile();
      toast.success(t("profileSaved"));
    } catch {
      toast.error("Unable to save profile");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarForRole user={currentUser} />
      <main className="flex-1 min-w-0">
        <DashboardHeader />
        <div className="p-6 space-y-6 max-w-5xl">
          <section className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-bold text-foreground">{t("profileTitle")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("profileSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              <BadgeCheck className="w-4 h-4" />
              {roleLabel}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-base font-semibold text-foreground mb-4">{t("contact")}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-1.5">
                  <span className="label-text flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {t("name")}</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="label-text">{t("username")}</span>
                  <input
                    value={currentUser.username}
                    readOnly
                    className="h-10 w-full rounded-lg bg-secondary border border-border px-3 text-sm text-muted-foreground"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="label-text flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {t("email")}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="label-text flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {t("phone")}</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="label-text flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {t("district")}</span>
                  <select
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                    className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select district</option>
                    {DISTRICTS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                {!isVictim && (
                  <label className="space-y-1.5">
                    <span className="label-text flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {t("institution")}</span>
                    <input
                      value={institution}
                      onChange={(event) => setInstitution(event.target.value)}
                      placeholder="Optional"
                      className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-5 h-10 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : t("saveChanges")}
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h2 className="font-heading text-base font-semibold text-foreground">{t("profile")}</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="label-text">{t("role")}</p>
                  <p className="text-foreground mt-1">{roleLabel}</p>
                </div>
                <div>
                  <p className="label-text">{t("email")}</p>
                  <p className="text-foreground mt-1 break-all">{email || currentUser.email || "-"}</p>
                </div>
                <div>
                  <p className="label-text">{t("district")}</p>
                  <p className="text-foreground mt-1">{district || currentUser.district || "-"}</p>
                </div>
                {!isVictim && (
                  <div>
                    <p className="label-text">{t("institution")}</p>
                    <p className="text-foreground mt-1">{institution || currentUser.institution || "Optional"}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
