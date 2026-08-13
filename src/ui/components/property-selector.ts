const properties = ["Position", "Scale", "Rotation", "Anchor Point", "Opacity"];

export function renderPropertySelector(selected: string): string {
  return `
    <section class="control-section property-selector" aria-labelledby="property-label">
      <label id="property-label" for="property-select">PROPERTY</label>
      <select id="property-select" data-action="property">
        ${properties.map((property) => `<option${property === selected ? " selected" : ""}>${property}</option>`).join("")}
      </select>
    </section>`;
}

