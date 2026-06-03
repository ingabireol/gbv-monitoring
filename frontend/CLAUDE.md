# GBV & Child Abuse Monitoring System — Claude Code Instructions

## Project Identity
**System Name:** GBV Monitor  
**Organization:** Ministry of Gender and Family Promotion (MIGEPROF), Government of Rwanda  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts  
**Purpose:** A government dashboard for monitoring, reporting, and managing Gender-Based Violence and Child Abuse cases across Rwanda.

---

## 🚨 Prime Directives (NEVER violate these)

1. **Victim privacy is sacred.** Never display real victim names. Always use anonymized IDs: `Victim #00142`, `Child #00089`. This is non-negotiable in ALL components.
2. **Consistent color coding.** Every status must use the SAME color everywhere — badge, chart bar, table row highlight, sparkline. No exceptions.
3. **Never break existing components.** When adding new pages/features, import and reuse existing components. Do not rewrite `DashboardSidebar`, `DashboardHeader`, or `MetricsGrid` unless explicitly asked.
4. **Dark theme only.** Never introduce light backgrounds. All new components must use CSS variables from `src/index.css`.
5. **Rwanda context always present.** Use real Rwanda district names in data, MIGEPROF branding in headers, Kinyarwanda/English bilingual labels where appropriate (e.g., `Raporo / Report`).

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui primitives — DO NOT MODIFY
│   ├── DashboardSidebar.tsx   # Main navigation — add new nav items here
│   ├── DashboardHeader.tsx    # Top bar — DO NOT MODIFY
│   ├── MetricsGrid.tsx        # KPI cards with sparklines
│   ├── DashboardCharts.tsx    # Recharts bar charts
│   └── RecentCasesTable.tsx   # Cases data table
├── pages/
│   ├── Index.tsx              # Dashboard / Case Overview (COMPLETE)
│   └── NotFound.tsx           # 404 page
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   └── utils.ts               # cn() utility
└── index.css                  # CSS variables & theme — source of truth for colors
```

---

## 🎨 Design System (Source of Truth)

### Color Variables (from `src/index.css`)
```css
--background: 210 30% 10%        /* #0f1923 — page background */
--card: 212 30% 14%              /* #162130 — card/surface background */
--primary: 14 74% 52%            /* #e05a2b — terracotta accent */
--secondary: 210 25% 17%         /* secondary surfaces */
--border: 208 30% 18%            /* #1e2d3d — card borders */
--muted-foreground: 213 18% 62%  /* #94a3b8 — body text */
--destructive: 0 84% 71%         /* #f87171 — Critical/red */
--success: 142 69% 58%           /* #4ade80 — Resolved/green */
--warning: 43 96% 56%            /* #fbbf24 — Pending/amber */
--info: 213 94% 68%              /* #60a5fa — In Progress/blue */
--sidebar-background: 210 35% 9% /* darker sidebar bg */
```

### Typography
- **Headings:** `font-heading` → Syne (imported in `main.tsx`)
- **Body:** `font-body` → DM Sans (imported in `main.tsx`)
- Add `font-heading` class for all page/section titles
- Add `font-body` or omit (it's the default) for body text

### Reusable CSS Classes (from `index.css`)
```css
.label-text           /* 10px bold uppercase tracking — for table headers, card labels */
.status-critical      /* Red pill styling */
.status-pending       /* Amber pill styling */
.status-in-progress   /* Blue pill styling */
.status-resolved      /* Green pill styling */
```

### Border Radius
- Cards: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Pills/badges: `rounded-full`

---

## 🧩 Component Patterns

### Page Layout (copy this for every new page)
```tsx
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";

const MyPage = () => {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Page title block */}
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Page Title
            </h2>
            <p className="text-sm text-muted-foreground">
              Subtitle / Kinyarwanda label — description
            </p>
          </div>
          {/* Page content here */}
        </main>
      </div>
    </div>
  );
};

export default MyPage;
```

### Card Pattern
```tsx
<div className="bg-card border border-border rounded-xl p-4">
  <p className="label-text mb-3">SECTION LABEL</p>
  {/* content */}
</div>
```

### Status Badge Pattern
```tsx
<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusClasses[status]}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
  {status}
</span>
```

### Button Pattern
```tsx
{/* Primary */}
<button className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors duration-200">
  Action
</button>

{/* Ghost/Icon */}
<button className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors duration-200">
  <Icon className="w-4 h-4 text-muted-foreground" />
</button>
```

### Form Input Pattern
```tsx
<input
  className="h-8 w-full rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
/>
```

### AI Insight Bar Pattern
```tsx
<div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary border border-border mb-4">
  <Sparkles className="w-4 h-4 text-primary shrink-0" />
  <p className="text-xs text-muted-foreground flex-1">Insight text here.</p>
  <Settings className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
</div>
```

---

## 📋 All System Modules & Their Pages

These are the 11 modules. Each maps to a sidebar nav item and a page in `src/pages/`:

| # | Module | Page File | Nav Group | Status |
|---|--------|-----------|-----------|--------|
| 1 | Incident Reporting | `IncidentReporting.tsx` | Case Management | 🔲 TODO |
| 2 | Case Management | `CaseManagement.tsx` | Case Management | 🔲 TODO |
| 3 | Victim Support Tracking | `VictimSupport.tsx` | Victim Services | 🔲 TODO |
| 4 | Inter-Agency Coordination | `InterAgency.tsx` | Coordination | 🔲 TODO |
| 5 | Data Analytics & Monitoring | `Analytics.tsx` | Analytics | 🔲 TODO |
| 6 | Notification & Alert | `Notifications.tsx` | Victim Services | 🔲 TODO |
| 7 | Security & Confidentiality | `Settings.tsx` | Administration | 🔲 TODO |
| 8 | Anonymous Reporting | `AnonymousReport.tsx` | Case Management | 🔲 TODO |
| 9 | Survivor Journey & Recovery | `RecoveryTracking.tsx` | Victim Services | 🔲 TODO |
| 10 | Scheduled Reports | `ScheduledReports.tsx` | Analytics | 🔲 TODO |
| 11 | Case Progress Notifications | `CaseNotifications.tsx` | Victim Services | 🔲 TODO |
| - | Dashboard Overview | `Index.tsx` | Overview | ✅ DONE |

---

## 🛣️ Routing

All routes are defined in `src/App.tsx`. When adding a new page:

1. Create `src/pages/PageName.tsx`
2. Add route in `src/App.tsx`:
```tsx
import PageName from "./pages/PageName.tsx";
// Inside <Routes>:
<Route path="/page-name" element={<PageName />} />
```
3. Update `DashboardSidebar.tsx` — change `href` on the matching nav item to the route path
4. Convert sidebar buttons to use `react-router-dom` `<Link>` or `useNavigate`

---

## 🗂️ Data Conventions

### Rwanda Districts (use these in sample data)
Kigali: `Gasabo`, `Kicukiro`, `Nyarugenge`  
Other: `Huye`, `Musanze`, `Rubavu`, `Kamonyi`, `Rwamagana`, `Nyagatare`, `Muhanga`, `Karongi`, `Rusizi`

### Case ID Format
- GBV cases: `GBV-2024-XXXX`
- Child abuse cases: `CA-2024-XXXX`

### Victim ID Format
- Adults: `Victim #XXXXX`
- Children: `Child #XXXXX`

### Officer Name Format
- `Sgt. [Rwandan surname]`, `Insp. [Rwandan surname]`, `Cpl. [Rwandan surname]`
- Use Rwandan names: Uwimana, Habimana, Mukiza, Ingabire, Nshuti, Kamana, Bizimana, Nkurunziza, Gasana, Mutesi

### Incident Types
`Domestic Violence`, `Sexual Assault`, `Child Neglect`, `Physical Abuse`, `Emotional Abuse`, `Child Labor`, `Early Marriage`, `Economic Abuse`, `Stalking/Harassment`

---

## 📦 Available Libraries

Already installed — use these, don't add new ones unless essential:
- `recharts` — all charts (BarChart, LineChart, PieChart, AreaChart)
- `lucide-react` — all icons (version 0.462.0)
- `react-router-dom` — routing
- `@tanstack/react-query` — data fetching (if needed)
- `react-hook-form` + `zod` — forms and validation
- `date-fns` — date formatting
- `sonner` — toast notifications
- All shadcn/ui components in `src/components/ui/`

---

## 🔒 Accessibility & Compliance

- Maintain WCAG 2.1 AA contrast ratios — test dark text on dark backgrounds
- All interactive elements must have `focus:outline-none focus:ring-1 focus:ring-primary`
- Tables must have proper `<thead>`, `<tbody>` structure
- Form inputs must have associated labels
- Sensitive data fields must never auto-fill (`autoComplete="off"`)

---

## ⚠️ Common Mistakes to Avoid

- ❌ Never use `drop-shadow` — use `border` for depth
- ❌ Never use `#fff` or `white` backgrounds — use `bg-background` or `bg-card`
- ❌ Never hardcode colors like `text-red-500` — use `text-destructive`
- ❌ Never add `<form>` tags — use `onSubmit` on a `<div>` or use react-hook-form's `<Form>`
- ❌ Never display full victim names — always anonymize
- ❌ Never import fonts manually — they're already loaded in `main.tsx`
- ✅ Always use `transition-colors duration-200` on interactive elements
- ✅ Always use `font-heading` class on page and card titles
- ✅ Always use `label-text` class for uppercase section labels