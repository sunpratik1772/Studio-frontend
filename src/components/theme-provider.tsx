import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light" | "claude" | "turquoise";
const STORAGE_KEY = "clawstudio.theme";
const VALID: Theme[] = ["dark", "light", "claude", "turquoise"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && VALID.includes(stored)) return stored;
  return "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Strip every theme class first so we don't accumulate state.
  root.classList.remove("dark", "claude", "turquoise");
  if (theme !== "light") root.classList.add(theme);
  // colorScheme drives native form controls / scrollbars.
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore quota / sandboxed storage errors
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
