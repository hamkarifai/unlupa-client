import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: "light" | "dark";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  const isDark = resolved === "dark";
  
  root.classList.toggle("dark-mode", isDark);
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = resolved;
  
  return resolved;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "dark",
      
      setTheme: (theme: Theme) => {
        const resolved = applyTheme(theme);
        set({ theme, resolvedTheme: resolved });
      },
      
      toggleTheme: () => {
        const current = get().theme;
        const next = current === "dark" ? "light" : current === "light" ? "system" : "dark";
        get().setTheme(next);
      },
    }),
    {
      name: "unlupa-theme",
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            applyTheme(state.theme);
          }
        };
      },
    }
  )
);

// Initialize theme on load
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("unlupa-theme");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const theme = parsed?.state?.theme || "system";
      applyTheme(theme as Theme);
    } catch {
      applyTheme("system");
    }
  } else {
    applyTheme("system");
  }
  
  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const current = useThemeStore.getState().theme;
    if (current === "system") {
      applyTheme("system");
    }
  });
}
