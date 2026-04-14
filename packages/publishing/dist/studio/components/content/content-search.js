var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@citadelfoundation/kit-ui/components/input";
import { PublishingElement, publishingTheme } from "../../../internal/ui.js";
let KitPublishingContentSearch = class KitPublishingContentSearch extends PublishingElement {
    constructor() {
        super(...arguments);
        this.items = [];
        this.query = "";
        this.debounceMs = 300;
        this.draftQuery = "";
        this.debounceTimer = null;
        this.handleSearchInput = (event) => {
            this.draftQuery = extractSearchValue(event);
            this.scheduleSearchCommit();
        };
        this.clearSearch = () => {
            this.clearDebounceTimer();
            this.draftQuery = "";
            this.query = "";
            this.emitSearchChange();
            void this.updateComplete.then(() => {
                this.searchInput?.focus();
                this.searchInput?.select?.();
            });
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .content-search {
        display: grid;
        gap: var(--kit-space-md);
      }

      .content-search-bar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--kit-space-sm);
        align-items: end;
      }

      .content-search-clear {
        appearance: none;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 80%, transparent);
        background: var(--kit-surface-primary);
        color: var(--kit-text-secondary);
        border-radius: var(--kit-radius-md);
        padding: 0.75rem 0.9rem;
        font: inherit;
        cursor: pointer;
      }

      .content-search-clear:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .content-search-summary {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .content-search-results {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--kit-space-sm);
      }

      .content-search-result {
        display: grid;
        gap: var(--kit-space-xs);
        padding: var(--kit-space-md);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 86%,
          transparent
        );
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 60%, transparent);
      }

      .content-search-title {
        margin: 0;
        font-size: var(--kit-font-size-md);
      }

      .content-search-content {
        margin: 0;
        color: var(--kit-text-secondary);
        line-height: 1.5;
      }

      .content-search-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-xs);
      }

      .content-search-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.2rem 0.55rem;
        border-radius: var(--kit-radius-full);
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 10%,
          var(--kit-surface-primary)
        );
        color: var(--kit-text-primary);
        font-size: var(--kit-font-size-xs);
      }

      .content-search-highlight {
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 18%,
          transparent
        );
        color: inherit;
        border-radius: 0.2rem;
        padding: 0 0.08rem;
      }

      .content-search-empty {
        margin: 0;
        color: var(--kit-text-secondary);
        font-style: italic;
      }
    `,
    ]; }
    connectedCallback() {
        super.connectedCallback();
        this.draftQuery = this.query;
    }
    disconnectedCallback() {
        this.clearDebounceTimer();
        super.disconnectedCallback();
    }
    renderContent() {
        const results = this.filteredItems();
        const hasQuery = this.query.trim().length > 0;
        return html `
      <section class="content-search" aria-label="Publishing content search">
        <div class="content-search-bar">
          <kit-input
            aria-label="Search content"
            class="content-search-input"
            label="Search"
            placeholder="Search title, content, or tags"
            type="search"
            .value=${this.draftQuery}
            @input=${this.handleSearchInput}
          ></kit-input>
          <button
            class="content-search-clear"
            type="button"
            ?disabled=${this.draftQuery.length === 0 && this.query.length === 0}
            @click=${this.clearSearch}
          >
            Clear search
          </button>
        </div>

        <p class="content-search-summary">
          ${hasQuery
            ? `${results.length} result${results.length === 1 ? "" : "s"} for “${this.query}”`
            : `${results.length} item${results.length === 1 ? "" : "s"} available`}
        </p>

        ${results.length > 0
            ? html `
              <ul class="content-search-results">
                ${results.map((item) => html `
                    <li class="content-search-result" data-item-id=${item.id}>
                      <h3 class="content-search-title">
                        ${this.renderHighlightedText(item.title, this.query)}
                      </h3>
                      <p class="content-search-content">
                        ${this.renderExcerpt(item.content, this.query)}
                      </p>
                      ${item.tags.length > 0
                ? html `
                            <div class="content-search-tags" aria-label="Tags">
                              ${item.tags.map((tag) => html `
                                  <span class="content-search-tag">
                                    ${this.renderHighlightedText(tag, this.query)}
                                  </span>
                                `)}
                            </div>
                          `
                : null}
                    </li>
                  `)}
              </ul>
            `
            : html `<p class="content-search-empty">
              No matching content found.
            </p>`}
      </section>
    `;
    }
    scheduleSearchCommit() {
        this.clearDebounceTimer();
        this.debounceTimer = globalThis.setTimeout(() => {
            this.debounceTimer = null;
            this.query = this.draftQuery.trim();
            this.emitSearchChange();
        }, this.debounceMs);
    }
    clearDebounceTimer() {
        if (this.debounceTimer === null) {
            return;
        }
        globalThis.clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
    }
    emitSearchChange() {
        this.emitEvent("content-search-change", {
            query: this.query,
            results: this.filteredItems(),
        });
    }
    filteredItems() {
        const normalizedQuery = normalizeSearch(this.query);
        if (normalizedQuery.length === 0) {
            return this.items;
        }
        return this.items.filter((item) => matchesQuery(item, normalizedQuery));
    }
    renderExcerpt(content, query) {
        const normalizedQuery = normalizeSearch(query);
        if (normalizedQuery.length === 0) {
            return content;
        }
        const lowerContent = content.toLowerCase();
        const matchIndex = lowerContent.indexOf(normalizedQuery);
        if (matchIndex < 0) {
            return content;
        }
        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(content.length, matchIndex + normalizedQuery.length + 60);
        const prefix = start > 0 ? "…" : "";
        const suffix = end < content.length ? "…" : "";
        return [
            prefix,
            ...this.renderHighlightedSegments(content.slice(start, end), query),
            suffix,
        ];
    }
    renderHighlightedText(text, query) {
        return this.renderHighlightedSegments(text, query);
    }
    renderHighlightedSegments(text, query) {
        const normalizedQuery = normalizeSearch(query);
        if (normalizedQuery.length === 0) {
            return [text];
        }
        const lowerText = text.toLowerCase();
        const segments = [];
        let cursor = 0;
        while (cursor < text.length) {
            const matchIndex = lowerText.indexOf(normalizedQuery, cursor);
            if (matchIndex < 0) {
                segments.push(text.slice(cursor));
                break;
            }
            if (matchIndex > cursor) {
                segments.push(text.slice(cursor, matchIndex));
            }
            segments.push(html `<mark class="content-search-highlight"
          >${text.slice(matchIndex, matchIndex + normalizedQuery.length)}</mark
        >`);
            cursor = matchIndex + normalizedQuery.length;
        }
        return segments.length > 0 ? segments : [text];
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingContentSearch.prototype, "items", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentSearch.prototype, "query", void 0);
__decorate([
    property({ type: Number, attribute: "debounce-ms" })
], KitPublishingContentSearch.prototype, "debounceMs", void 0);
__decorate([
    state()
], KitPublishingContentSearch.prototype, "draftQuery", void 0);
__decorate([
    state()
], KitPublishingContentSearch.prototype, "debounceTimer", void 0);
__decorate([
    query("kit-input")
], KitPublishingContentSearch.prototype, "searchInput", void 0);
KitPublishingContentSearch = __decorate([
    customElement("kit-publishing-content-search")
], KitPublishingContentSearch);
export { KitPublishingContentSearch };
function extractSearchValue(event) {
    const customEvent = event;
    if (typeof customEvent.detail?.value === "string") {
        return customEvent.detail.value;
    }
    const target = event.currentTarget;
    return target?.value ?? "";
}
function normalizeSearch(value) {
    return value.trim().toLowerCase();
}
function matchesQuery(item, normalizedQuery) {
    return (item.title.toLowerCase().includes(normalizedQuery) ||
        item.content.toLowerCase().includes(normalizedQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)));
}
