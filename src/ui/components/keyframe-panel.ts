export function renderKeyframePanel(): string {
  return `
    <section class="keyframe-panel panel-section" aria-labelledby="keyframe-title">
      <div class="section-heading"><span id="keyframe-title">KEYFRAMES</span><span class="section-note">MOCK TIMELINE</span></div>
      <div class="mock-timeline" aria-label="Visual keyframe timeline mockup">
        <span class="timeline-line"></span><span class="keyframe-dot"></span><span class="keyframe-dot"></span><span class="keyframe-dot"></span>
      </div>
      <div class="keyframe-actions">
        <button type="button" data-keyframe-action="extract">EXTRACT</button>
        <button type="button" data-keyframe-action="link">LINK</button>
        <button type="button" data-keyframe-action="reset">RESET</button>
      </div>
    </section>`;
}

