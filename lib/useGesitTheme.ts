import { useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

export function useGesitTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const applyBoth = useCallback((dark: boolean) => {
    const val = dark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("data-theme", val);
    document.documentElement.style.colorScheme = val;
    if (document.body) {
      document.body.classList.toggle("dark", dark);
      document.body.setAttribute("data-theme", val);
    }
  }, []);

  useEffect(() => {
    applyBoth(isDark);
  }, [isDark, applyBoth]);

  const toggleTheme = useCallback(() => {
    const nextDark = !isDark;
    const nextVal = nextDark ? "dark" : "light";
    setTheme(nextVal);
    applyBoth(nextDark);
    window.dispatchEvent(new CustomEvent("gesit-theme-change", { detail: nextVal }));
  }, [isDark, setTheme, applyBoth]);

  return {
    theme: resolvedTheme || theme || "light",
    isDark,
    toggleTheme,
    setTheme,
  };
}

export default useGesitTheme;

