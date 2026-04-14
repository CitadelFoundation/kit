var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../internal/ui.js";
import { serializeFrontmatterDocument } from "../../content/frontmatter.js";
let KitPublishingExportFunctionality = class KitPublishingExportFunctionality extends PublishingElement {
    constructor() {
        super(...arguments);
        this.document = null;
        this.baseName = "export";
        this.title = "Export content";
        this.handleExportJson = () => {
            const target = this.exportJson();
            if (!target)
                return;
            this.dispatchExport(target);
        };
        this.handleExportMarkdown = () => {
            const target = this.exportMarkdown();
            if (!target)
                return;
            this.dispatchExport(target);
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .export-shell {
        display: grid;
        gap: var(--kit-space-md);
        padding: var(--kit-space-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-surface-primary);
      }

      .export-header {
        display: grid;
        gap: 0.25rem;
      }

      .export-title {
        margin: 0;
        font-size: var(--kit-font-size-lg);
        font-weight: 700;
      }

      .export-copy,
      .export-preview-meta,
      .export-disabled {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .export-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-sm);
      }

      .export-button {
        appearance: none;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        padding: 0.48rem 0.78rem;
        background: var(--kit-surface-secondary);
        color: var(--kit-text-primary);
        font: inherit;
        font-size: var(--kit-font-size-sm);
        font-weight: 650;
        cursor: pointer;
      }

      .export-button[data-tone="primary"] {
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 12%,
          var(--kit-surface-primary)
        );
      }

      .export-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .export-preview {
        display: grid;
        gap: 0.35rem;
        padding: var(--kit-space-sm);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 84%,
          transparent
        );
      }

      .export-preview pre {
        margin: 0;
        max-height: 18rem;
        overflow: auto;
        white-space: pre-wrap;
        font-size: 0.76rem;
      }
    `,
    ]; }
    renderContent() {
        const jsonTarget = this.document
            ? buildPublishingExportTarget(this.document, "json", this.baseName)
            : null;
        const markdownTarget = this.exportMarkdown();
        return html `
      <section class="export-shell">
        <div class="export-header">
          <h2 class="export-title">${this.title}</h2>
          <p class="export-copy">
            Export the current document as canonical JSON, or as markdown when
            the document is markdown-backed.
          </p>
        </div>

        <div class="export-actions">
          <button
            class="export-button"
            data-tone="primary"
            ?disabled=${jsonTarget === null}
            type="button"
            @click=${this.handleExportJson}
          >
            Export JSON
          </button>
          <button
            class="export-button"
            ?disabled=${markdownTarget === null}
            type="button"
            @click=${this.handleExportMarkdown}
          >
            Export Markdown
          </button>
        </div>

        ${jsonTarget
            ? html `
              <div class="export-preview">
                <p class="export-preview-meta">
                  ${jsonTarget.filename} · ${jsonTarget.mimeType}
                </p>
                <pre>
${jsonTarget.contents.slice(0, 320)}${jsonTarget.contents.length > 320
                ? "…"
                : ""}</pre
                >
              </div>
            `
            : nothing}
        ${!markdownTarget &&
            this.document !== null &&
            !isMarkdownExportableDocument(this.document)
            ? html `<p class="export-disabled">
              Markdown export is unavailable for this document kind.
            </p>`
            : nothing}
      </section>
    `;
    }
    exportJson() {
        return this.document
            ? buildPublishingExportTarget(this.document, "json", this.baseName)
            : null;
    }
    exportMarkdown() {
        return this.document && isMarkdownExportableDocument(this.document)
            ? buildPublishingExportTarget(this.document, "markdown", this.baseName)
            : null;
    }
    dispatchExport(target) {
        this.dispatchEvent(new CustomEvent("publishing-export", {
            detail: { target },
            bubbles: true,
            composed: true,
        }));
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingExportFunctionality.prototype, "document", void 0);
__decorate([
    property({ attribute: "base-name" })
], KitPublishingExportFunctionality.prototype, "baseName", void 0);
__decorate([
    property({ attribute: "title" })
], KitPublishingExportFunctionality.prototype, "title", void 0);
KitPublishingExportFunctionality = __decorate([
    customElement("kit-publishing-export-functionality")
], KitPublishingExportFunctionality);
export { KitPublishingExportFunctionality };
export function buildPublishingExportTarget(document, format, baseName = "export") {
    if (format === "markdown") {
        if (!isMarkdownExportableDocument(document)) {
            throw new Error(`Markdown export is not supported for ${document.kind} documents.`);
        }
        const contents = serializeFrontmatterDocument(omitDocumentBody(document), document.body);
        return {
            format,
            filename: `${normalizeExportBaseName(baseName, document)}.mdx`,
            mimeType: "text/markdown",
            contents,
        };
    }
    return {
        format,
        filename: `${normalizeExportBaseName(baseName, document)}.json`,
        mimeType: "application/json",
        contents: `${JSON.stringify(document, null, 2)}\n`,
    };
}
export function isMarkdownExportableDocument(document) {
    return (document.kind === "post" ||
        document.kind === "page" ||
        document.kind === "doc_page");
}
function normalizeExportBaseName(baseName, document) {
    const source = baseName.trim().length > 0 ? baseName : document.kind;
    return source
        .replace(/[^a-z0-9._-]+/giu, "-")
        .replace(/-{2,}/gu, "-")
        .replace(/^-|-$/gu, "");
}
function omitDocumentBody(document) {
    const record = { ...document };
    delete record.body;
    return record;
}
