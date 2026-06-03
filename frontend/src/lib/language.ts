import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "rw";

export type TranslationKey =
  | "active"
  | "administration"
  | "analytics"
  | "assignedCases"
  | "back"
  | "caseAssignments"
  | "caseManagement"
  | "caseOverview"
  | "caseSummary"
  | "caseUpdates"
  | "contact"
  | "coordination"
  | "dashboard"
  | "darkMode"
  | "district"
  | "districtAnalytics"
  | "districtPortal"
  | "email"
  | "english"
  | "exitPortal"
  | "help"
  | "home"
  | "institution"
  | "interAgencyReferrals"
  | "incidentReports"
  | "kinyarwanda"
  | "language"
  | "lightMode"
  | "myCase"
  | "myDashboard"
  | "myDistrict"
  | "myPortal"
  | "myProfile"
  | "name"
  | "notifications"
  | "officerPortal"
  | "overview"
  | "partnerInstitutions"
  | "partnerPortal"
  | "phone"
  | "privateEncryptedSession"
  | "profile"
  | "profileSaved"
  | "profileSubtitle"
  | "profileTitle"
  | "recoveryJourney"
  | "referrals"
  | "report"
  | "reports"
  | "reportsAndTrends"
  | "role"
  | "saveChanges"
  | "scheduledReports"
  | "searchPlaceholder"
  | "services"
  | "settings"
  | "signOut"
  | "staffDirectory"
  | "supportTracking"
  | "systemLogs"
  | "userManagement"
  | "username"
  | "victimServices"
  | "workerPortal"
  | "workspace";

const STORAGE_KEY = "gbv_language";

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    active: "Active",
    administration: "Administration",
    analytics: "Analytics",
    assignedCases: "Assigned Cases",
    back: "Back",
    caseAssignments: "Case Assignments",
    caseManagement: "Case Management",
    caseOverview: "Case Overview",
    caseSummary: "Case Summary",
    caseUpdates: "Case Updates",
    contact: "Contact",
    coordination: "Coordination",
    dashboard: "Dashboard",
    darkMode: "Dark Mode",
    district: "District",
    districtAnalytics: "District Analytics",
    districtPortal: "District Portal",
    email: "Email",
    english: "English",
    exitPortal: "Exit Portal",
    help: "Help",
    home: "Home",
    institution: "Institution",
    interAgencyReferrals: "Inter-Agency Referrals",
    incidentReports: "Incident Reports",
    kinyarwanda: "Kinyarwanda",
    language: "Language",
    lightMode: "Light Mode",
    myCase: "My Case",
    myDashboard: "My Dashboard",
    myDistrict: "My District",
    myPortal: "My Portal",
    myProfile: "My Profile",
    name: "Name",
    notifications: "Notifications",
    officerPortal: "Officer Portal",
    overview: "Overview",
    partnerInstitutions: "Partner Institutions",
    partnerPortal: "Partner Portal",
    phone: "Phone",
    privateEncryptedSession: "Private & Encrypted Session",
    profile: "Profile",
    profileSaved: "Profile saved",
    profileSubtitle: "Review your account details and update the information shown in your dashboard.",
    profileTitle: "My Profile",
    recoveryJourney: "Recovery Journey",
    referrals: "Referrals",
    report: "Report",
    reports: "Reports",
    reportsAndTrends: "Reports & Trends",
    role: "Role",
    saveChanges: "Save Changes",
    scheduledReports: "Scheduled Reports",
    searchPlaceholder: "Search cases, victims, or officers...",
    services: "Services",
    settings: "Settings",
    signOut: "Sign Out",
    staffDirectory: "Staff Directory",
    supportTracking: "Support Tracking",
    systemLogs: "System Logs",
    userManagement: "User Management",
    username: "Username",
    victimServices: "Victim Services",
    workerPortal: "Worker Portal",
    workspace: "Workspace",
  },
  rw: {
    active: "Ikoreshwa",
    administration: "Ubuyobozi",
    analytics: "Isesengura",
    assignedCases: "Dosiye Nahawe",
    back: "Subira inyuma",
    caseAssignments: "Gutanga Dosiye",
    caseManagement: "Gucunga Dosiye",
    caseOverview: "Incamake ya Dosiye",
    caseSummary: "Inshamake ya Dosiye",
    caseUpdates: "Amakuru ya Dosiye",
    contact: "Uko waboneka",
    coordination: "Guhuza ibikorwa",
    dashboard: "Ahabanza",
    darkMode: "Uburyo bw'ijoro",
    district: "Akarere",
    districtAnalytics: "Isesengura ry'Akarere",
    districtPortal: "Urubuga rw'Akarere",
    email: "Imeyili",
    english: "Icyongereza",
    exitPortal: "Sohoka",
    help: "Ubufasha",
    home: "Ahabanza",
    institution: "Ikigo",
    interAgencyReferrals: "Kohereza hagati y'inzego",
    incidentReports: "Raporo z'ibyabaye",
    kinyarwanda: "Ikinyarwanda",
    language: "Ururimi",
    lightMode: "Uburyo bw'amanywa",
    myCase: "Dosiye yanjye",
    myDashboard: "Ahabanza hanjye",
    myDistrict: "Akarere kanjye",
    myPortal: "Urubuga rwanjye",
    myProfile: "Umwirondoro wanjye",
    name: "Amazina",
    notifications: "Ubutumwa",
    officerPortal: "Urubuga rw'Umupolisi",
    overview: "Incamake",
    partnerInstitutions: "Ibigo bifatanyabikorwa",
    partnerPortal: "Urubuga rw'Umufatanyabikorwa",
    phone: "Telefoni",
    privateEncryptedSession: "Igihe cyihariye kandi kirinzwe",
    profile: "Umwirondoro",
    profileSaved: "Umwirondoro wabitswe",
    profileSubtitle: "Reba amakuru ya konti yawe kandi uhindure agaragara kuri dashboard yawe.",
    profileTitle: "Umwirondoro wanjye",
    recoveryJourney: "Urugendo rwo kwisubiza",
    referrals: "Kohereza",
    report: "Tanga raporo",
    reports: "Raporo",
    reportsAndTrends: "Raporo n'imigendekere",
    role: "Inshingano",
    saveChanges: "Bika impinduka",
    scheduledReports: "Raporo zateganyijwe",
    searchPlaceholder: "Shakisha dosiye, abagizweho ingaruka, cyangwa abapolisi...",
    services: "Serivisi",
    settings: "Igenamiterere",
    signOut: "Sohoka",
    staffDirectory: "Urutonde rw'abakozi",
    supportTracking: "Gukurikirana ubufasha",
    systemLogs: "Amateka ya sisitemu",
    userManagement: "Gucunga abakoresha",
    username: "Izina ukoresha",
    victimServices: "Serivisi z'abagizweho ingaruka",
    workerPortal: "Urubuga rw'umukozi",
    workspace: "Aho ukorera",
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function getLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "rw" ? "rw" : "en";
}

export function setLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent("gbv-language-change", { detail: lang }));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getLanguage);

  useEffect(() => {
    const handleLanguageChange = () => setLanguageState(getLanguage());
    window.addEventListener("gbv-language-change", handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);
    return () => {
      window.removeEventListener("gbv-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "rw" ? "rw" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        setLanguage(nextLanguage);
        setLanguageState(nextLanguage);
      },
      t: (key) => translations[language][key] ?? translations.en[key],
    }),
    [language],
  );

  return React.createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
