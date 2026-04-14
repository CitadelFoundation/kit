/**
 * Publishing collection filter controls.
 *
 * @module @citadelfoundation/kit-publishing/studio/components/content/content-filters
 */
import { html } from "lit";
import "@citadelfoundation/kit-ui/components/input";
import "@citadelfoundation/kit-ui/components/select";
export function renderCollectionSearchInput(config) {
    return html `
    <kit-input
      class="collection-search-input"
      aria-label=${config.label}
      label=${config.label}
      placeholder=${config.placeholder}
      .value=${config.value}
      helper-text=${config.helperText ?? ""}
      @input=${(event) => {
        config.onChange?.(event.detail.value);
    }}
    ></kit-input>
  `;
}
export function renderCollectionFilterChip(config) {
    return html `
    <label class="filter-chip">
      ${config.prefix
        ? html `<span class="filter-chip-prefix">${config.prefix}</span>`
        : null}
      <select
        aria-label=${config.label}
        class="filter-chip-select"
        ?disabled=${config.disabled ?? false}
        .value=${config.value}
        @change=${(event) => {
        config.onChange?.(event.currentTarget.value);
    }}
      >
        ${config.options.map((option) => html `<option value=${option.value}>${option.label}</option>`)}
      </select>
      <span class="filter-chip-caret" aria-hidden="true">▾</span>
    </label>
  `;
}
export function renderCollectionSortSelect(config) {
    return html `
    <kit-select
      class="filter-chip-select"
      aria-label=${config.label}
      label=${config.label}
      .options=${config.options}
      .value=${config.value}
      ?disabled=${config.disabled ?? false}
      @change=${(event) => {
        config.onChange?.(event.detail.value);
    }}
    ></kit-select>
  `;
}
