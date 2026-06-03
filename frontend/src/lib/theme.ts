export type ThemeMode = "dark" | "light";

export function getThemeMode(): ThemeMode {
  return (localStorage.getItem("gbv_theme") as ThemeMode) || "dark";
}

export function setThemeMode(mode: ThemeMode): void {
  localStorage.setItem("gbv_theme", mode);
  applyTheme(mode);
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === "light") {
    root.setAttribute("data-theme-mode", "light");
  } else {
    root.removeAttribute("data-theme-mode");
  }
}

export function initTheme(): void {
  applyTheme(getThemeMode());
}
