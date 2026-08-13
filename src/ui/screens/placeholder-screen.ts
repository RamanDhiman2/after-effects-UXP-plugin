import type { ScreenId } from "../../app/types";

export function renderPlaceholderScreen(screen: Exclude<ScreenId, "motion">): string {
  const label = screen === "ai" ? "AI" : `${screen[0].toUpperCase()}${screen.slice(1)}`;
  return `<section class="placeholder-screen" aria-labelledby="placeholder-title">
    <div class="placeholder-icon" aria-hidden="true">+</div>
    <p class="section-note">${label.toUpperCase()}</p>
    <h2 id="placeholder-title">Coming in a later phase</h2>
    <p>This workspace is intentionally reserved for the planned workflow.</p>
  </section>`;
}

