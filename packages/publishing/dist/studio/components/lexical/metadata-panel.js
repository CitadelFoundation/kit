var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../internal/ui.js";
const MAX_SEO_TITLE_LENGTH = 60;
const MAX_SEO_DESCRIPTION_LENGTH = 160;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
let KitPublishingMetadataPanel = class KitPublishingMetadataPanel extends PublishingElement {
    constructor() {
        super(...arguments);
        this.seoTitle = "";
        this.seoDescription = "";
        this.excerpt = "";
        this.slug = "";
        this.tags = "";
        this.open = true;
        this.revision = 0;
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
        width: 100%;
      }

      details {
        border: 1px solid var(--kit-border-primary, #d1d5db);
        border-radius: var(--kit-radius-lg, 0.75rem);
        background: var(--kit-surface-primary, #fcfcfd);
        padding: 1rem;
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
      }

      summary {
        cursor: pointer;
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        font-weight: 600;
        color: var(--kit-text-primary, #111827);
      }

      summary::-webkit-details-marker {
        display: none;
      }

      .panel-copy {
        margin: 0.35rem 0 0;
        color: var(--kit-text-secondary, #4b5563);
        font-size: 0.875rem;
      }

      .panel-grid {
        display: grid;
        gap: 0.9rem;
        margin-top: 1rem;
      }

      .field {
        display: grid;
        gap: 0.35rem;
      }

      .label-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: baseline;
      }

      label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--kit-text-primary, #111827);
      }

      .counter,
      .helper,
      .issue,
      .preview {
        font-size: 0.8125rem;
        line-height: 1.45;
      }

      .counter,
      .helper {
        color: var(--kit-text-secondary, #4b5563);
      }

      .preview {
        color: var(--kit-text-tertiary, #6b7280);
      }

      input,
      textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--kit-border-primary, #d1d5db);
        border-radius: var(--kit-radius-md, 0.5rem);
        background: var(--kit-surface-secondary, #f8fafc);
        color: var(--kit-text-primary, #111827);
        padding: 0.75rem;
        font: inherit;
      }

      textarea {
        resize: vertical;
        min-height: 5.5rem;
      }

      input:focus,
      textarea:focus {
        outline: none;
        border-color: var(--kit-color-primary, #111827);
        box-shadow: 0 0 0 3px rgb(17 24 39 / 0.08);
      }

      input[data-invalid="true"],
      textarea[data-invalid="true"] {
        border-color: var(--kit-color-danger, #dc2626);
      }

      .validation-list {
        display: grid;
        gap: 0.4rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .issue {
        margin: 0;
        color: var(--kit-color-danger, #dc2626);
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.55rem;
        border-radius: 999px;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 88%,
          transparent
        );
        color: var(--kit-text-secondary, #4b5563);
        font-size: 0.75rem;
      }
    `,
    ]; }
    updated(changedProperties) {
        if (changedProperties.has("seoTitle") ||
            changedProperties.has("seoDescription") ||
            changedProperties.has("excerpt") ||
            changedProperties.has("slug") ||
            changedProperties.has("tags")) {
            this.revision += 1;
            this.dispatchMetadataChange();
        }
    }
    getMetadata() {
        return {
            seoTitle: this.seoTitle.trim(),
            seoDescription: this.seoDescription.trim(),
            excerpt: this.excerpt.trim(),
            slug: this.slug.trim(),
            tags: this.getParsedTags(),
        };
    }
    getValidationIssues() {
        return this.buildValidationIssues();
    }
    render() {
        const metadata = this.getMetadata();
        const issues = this.buildValidationIssues();
        const isValid = issues.length === 0;
        const titleCount = this.seoTitle.length;
        const descriptionCount = this.seoDescription.length;
        const tagCount = metadata.tags.length;
        const normalizedSlug = normalizeSlug(metadata.slug);
        return html `
      <details ?open=${this.open} class="metadata-panel">
        <summary>
          <div>
            Metadata panel
            <p class="panel-copy">
              SEO, excerpt, slug, and tags for the publishing studio editor.
            </p>
          </div>
          <span class="pill"
            >${isValid ? "Ready" : `${issues.length} issues`}</span
          >
        </summary>

        <div class="panel-grid">
          <div class="field">
            <div class="label-row">
              <label for="seo-title">SEO title</label>
              <span class="counter">${titleCount}/${MAX_SEO_TITLE_LENGTH}</span>
            </div>
            <input
              id="seo-title"
              data-invalid=${this.seoTitle.length > MAX_SEO_TITLE_LENGTH
            ? "true"
            : "false"}
              maxlength=${MAX_SEO_TITLE_LENGTH}
              value=${this.seoTitle}
              @input=${this.handleSeoTitleInput}
            />
            <p class="helper">Target length: 60 characters or fewer.</p>
          </div>

          <div class="field">
            <div class="label-row">
              <label for="seo-description">SEO description</label>
              <span class="counter"
                >${descriptionCount}/${MAX_SEO_DESCRIPTION_LENGTH}</span
              >
            </div>
            <textarea
              id="seo-description"
              data-invalid=${this.seoDescription.length >
            MAX_SEO_DESCRIPTION_LENGTH
            ? "true"
            : "false"}
              maxlength=${MAX_SEO_DESCRIPTION_LENGTH}
              .rows=${4}
              .value=${this.seoDescription}
              @input=${this.handleSeoDescriptionInput}
            ></textarea>
            <p class="helper">
              Keep this under 160 characters for search results.
            </p>
          </div>

          <div class="field">
            <div class="label-row">
              <label for="excerpt">Excerpt / summary</label>
              <span class="counter">${this.excerpt.length} chars</span>
            </div>
            <textarea
              id="excerpt"
              .rows=${4}
              .value=${this.excerpt}
              @input=${this.handleExcerptInput}
            ></textarea>
            <p class="helper">Short summary shown in listings and previews.</p>
          </div>

          <div class="field">
            <div class="label-row">
              <label for="slug">URL slug</label>
              <span class="counter">${normalizedSlug.length} chars</span>
            </div>
            <input
              id="slug"
              data-invalid=${issues.some((issue) => issue.field === "slug")
            ? "true"
            : "false"}
              value=${this.slug}
              @input=${this.handleSlugInput}
            />
            <p class="helper">Use lowercase letters, numbers, and hyphens.</p>
            <p class="preview">Normalized preview: ${normalizedSlug || "—"}</p>
          </div>

          <div class="field">
            <div class="label-row">
              <label for="tags">Tags</label>
              <span class="counter">${tagCount} selected</span>
            </div>
            <input
              id="tags"
              value=${this.tags}
              @input=${this.handleTagsInput}
            />
            <p class="helper">
              Comma-separated tags; duplicates are removed automatically.
            </p>
            <div class="meta-row">
              ${metadata.tags.map((tag) => html `<span class="pill">#${tag}</span>`)}
            </div>
          </div>

          ${issues.length > 0
            ? html `
                <ul class="validation-list" aria-live="polite">
                  ${issues.map((issue) => html `<li class="issue">${issue.message}</li>`)}
                </ul>
              `
            : html `<p class="helper">All metadata fields are valid.</p>`}
        </div>
      </details>
    `;
    }
    handleSeoTitleInput(event) {
        this.seoTitle = this.readInputValue(event);
    }
    handleSeoDescriptionInput(event) {
        this.seoDescription = this.readTextareaValue(event);
    }
    handleExcerptInput(event) {
        this.excerpt = this.readTextareaValue(event);
    }
    handleSlugInput(event) {
        this.slug = this.readInputValue(event);
    }
    handleTagsInput(event) {
        this.tags = this.readInputValue(event);
    }
    readInputValue(event) {
        const target = event.currentTarget;
        return target instanceof HTMLInputElement ? target.value : "";
    }
    readTextareaValue(event) {
        const target = event.currentTarget;
        return target instanceof HTMLTextAreaElement ? target.value : "";
    }
    dispatchMetadataChange() {
        const issues = this.buildValidationIssues();
        this.dispatchEvent(new CustomEvent("publishing-metadata-change", {
            detail: {
                metadata: this.getMetadata(),
                issues,
                isValid: issues.length === 0,
            },
            bubbles: true,
            composed: true,
        }));
    }
    buildValidationIssues() {
        const issues = [];
        if (this.seoTitle.length > MAX_SEO_TITLE_LENGTH) {
            issues.push({
                field: "seoTitle",
                message: `SEO title must be ${MAX_SEO_TITLE_LENGTH} characters or fewer.`,
            });
        }
        if (this.seoDescription.length > MAX_SEO_DESCRIPTION_LENGTH) {
            issues.push({
                field: "seoDescription",
                message: `SEO description must be ${MAX_SEO_DESCRIPTION_LENGTH} characters or fewer.`,
            });
        }
        const slug = this.slug.trim();
        if (slug.length === 0) {
            issues.push({
                field: "slug",
                message: "URL slug is required.",
            });
        }
        else {
            const normalizedSlug = normalizeSlug(slug);
            if (normalizedSlug.length === 0 ||
                normalizedSlug !== slug ||
                !SLUG_PATTERN.test(normalizedSlug)) {
                issues.push({
                    field: "slug",
                    message: "URL slug must use lowercase letters, numbers, and hyphens only.",
                });
            }
        }
        return issues;
    }
    getParsedTags() {
        const seen = new Set();
        const tags = [];
        for (const tag of this.tags.split(",")) {
            const normalized = tag.trim();
            if (normalized.length === 0) {
                continue;
            }
            const key = normalized.toLowerCase();
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            tags.push(normalized);
        }
        return tags;
    }
};
__decorate([
    property({ attribute: "seo-title" })
], KitPublishingMetadataPanel.prototype, "seoTitle", void 0);
__decorate([
    property({ attribute: "seo-description" })
], KitPublishingMetadataPanel.prototype, "seoDescription", void 0);
__decorate([
    property()
], KitPublishingMetadataPanel.prototype, "excerpt", void 0);
__decorate([
    property()
], KitPublishingMetadataPanel.prototype, "slug", void 0);
__decorate([
    property()
], KitPublishingMetadataPanel.prototype, "tags", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingMetadataPanel.prototype, "open", void 0);
__decorate([
    state()
], KitPublishingMetadataPanel.prototype, "revision", void 0);
KitPublishingMetadataPanel = __decorate([
    customElement("kit-publishing-metadata-panel")
], KitPublishingMetadataPanel);
export { KitPublishingMetadataPanel };
function normalizeSlug(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
