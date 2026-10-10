import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    const isDark = resolved === "dark";
    root.classList.toggle("dark-mode", isDark);
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = resolved;
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const root = document.documentElement;
      const resolved = mq.matches ? "dark" : "light";
      const isDark = resolved === "dark";
      root.classList.toggle("dark-mode", isDark);
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = resolved;
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return <>{children}</>;
}
