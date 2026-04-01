import { useEffect } from "react";

export function useInitPreferences() {
  useEffect(() => {
    const savedColorObj = localStorage.getItem("accentColorObj");
    if (savedColorObj) {
      try {
        const colorObj = JSON.parse(savedColorObj);
        if (colorObj && colorObj.value) {
          document.documentElement.style.setProperty("--color-accent", colorObj.value);
          if (colorObj.bg) document.documentElement.style.setProperty("--accent-bg", colorObj.bg);
          if (colorObj.border) document.documentElement.style.setProperty("--accent-border", colorObj.border);
        }
      } catch (e) {
        console.error("Erro ao aplicar cor de destaque:", e);
      }
    }

    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);
}