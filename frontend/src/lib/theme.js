const THEME_KEY = "theme";

export const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return "dark";
};

export const applyTheme = (theme) => {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  return next;
};

export const toggleTheme = (currentTheme) => {
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  return applyTheme(nextTheme);
};
