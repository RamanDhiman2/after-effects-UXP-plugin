import type { ScreenId } from "../../app/types";

const items: Array<{ id: ScreenId; label: string }> = [
  { id: "motion", label: "Motion" },
  { id: "presets", label: "Presets" },
  { id: "ai", label: "AI" },
  { id: "settings", label: "Settings" }
];

export function renderNavigation(activeScreen: ScreenId): string {
  return `<nav class="main-nav" aria-label="Plugin sections">${items.map(({ id, label }) => `
    <button class="nav-item${id === activeScreen ? " is-active" : ""}" data-screen="${id}" type="button" aria-current="${id === activeScreen ? "page" : "false"}">${label}</button>`).join("")}
  </nav>`;
}

