import { ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage, Language } from "@/lib/language";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const chooseLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="h-8 rounded-lg bg-background border border-border px-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-primary"
        title={t("language")}
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{language === "rw" ? "RW" : "EN"}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <button
            onClick={() => chooseLanguage("en")}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${
              language === "en" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span>EN</span>
            <span>{t("english")}</span>
            {language === "en" && <span className="ml-auto text-[10px] font-medium">{t("active")}</span>}
          </button>
          <button
            onClick={() => chooseLanguage("rw")}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${
              language === "rw" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span>RW</span>
            <span>{t("kinyarwanda")}</span>
            {language === "rw" && <span className="ml-auto text-[10px] font-medium">{t("active")}</span>}
          </button>
        </div>
      )}
    </div>
  );
}
