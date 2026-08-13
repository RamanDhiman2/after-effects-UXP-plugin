export function renderHeader(): string {
  return `
    <header class="plugin-header">
      <div class="brand-lockup">
        <span class="brand-mark" aria-hidden="true">N</span>
        <h1>NotFakePlugdAll</h1>
      </div>
      <div class="host-status" aria-label="Host status ready">
        <span class="status-dot status-dot--ready"></span>
        <span>READY</span>
      </div>
    </header>`;
}

