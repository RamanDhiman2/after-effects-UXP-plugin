import type { PluginState } from "../../app/types";

export function renderStatusBar(status: PluginState["status"]): string {
  return `<footer class="status-bar status-bar--${status.kind}" aria-live="polite">
    <span class="status-dot status-dot--${status.kind}"></span>
    <span>${status.message}</span>
  </footer>`;
}

