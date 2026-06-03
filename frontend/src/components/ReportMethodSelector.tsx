import { FileText, Mic, Image, LayoutList } from "lucide-react";

export type ReportMethod = "written" | "voice" | "media" | "all";

interface MethodCard {
  id: ReportMethod;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const METHODS: MethodCard[] = [
  {
    id: "written",
    icon: FileText,
    title: "Written Statement",
    description: "Type your account of what happened in your own words",
    color: "text-info",
  },
  {
    id: "voice",
    icon: Mic,
    title: "Voice Recording",
    description: "Record an audio statement if typing is difficult",
    color: "text-primary",
  },
  {
    id: "media",
    icon: Image,
    title: "Photos & Documents",
    description: "Upload photos, screenshots, or supporting documents",
    color: "text-success",
  },
  {
    id: "all",
    icon: LayoutList,
    title: "Full Report",
    description: "Use all methods — written, voice, and media together",
    color: "text-warning",
  },
];

interface ReportMethodSelectorProps {
  selected: ReportMethod | null;
  onSelect: (method: ReportMethod) => void;
}

export function ReportMethodSelector({ selected, onSelect }: ReportMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {METHODS.map((m) => {
        const Icon = m.icon;
        const isSelected = selected === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:border-border/80 hover:bg-secondary/80"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
              isSelected ? "bg-primary/20" : "bg-background"
            }`}>
              <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : m.color}`} />
            </div>
            <p className={`text-sm font-semibold mb-0.5 ${isSelected ? "text-primary" : "text-foreground"}`}>
              {m.title}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {m.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
