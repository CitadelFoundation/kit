var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../internal/ui.js";
import { migrateMdxSourceToLexicalJson, } from "../../content/content_migration.js";
let KitPublishingImportTools = class KitPublishingImportTools extends PublishingElement {
    constructor() {
        super(...arguments);
        this.accept = ".md,.mdx,text/markdown,text/x-markdown";
        this.disabled = false;
        this.title = "Import markdown files";
        this.emptyLabel = "No markdown files queued.";
        this.queue = [];
        this.busy = false;
        this.handleInputChange = async (event) => {
            const input = event.target;
            const files = Array.from(input.files ?? []);
            if (files.length === 0) {
                return;
            }
            await this.queueMarkdownFiles(files);
            this.dispatchEvent(new CustomEvent("publishing-import-tools-select", {
                detail: { files },
                bubbles: true,
                composed: true,
            }));
        };
        this.handleImportAll = () => {
            if (this.queue.length === 0) {
                return;
            }
            this.busy = true;
            this.dispatchEvent(new CustomEvent("publishing-import-tools-import", {
                detail: { items: this.queue },
                bubbles: true,
                composed: true,
            }));
            this.busy = false;
        };
        this.clearQueue = () => {
            this.queue = [];
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .import-tools-shell {
        display: grid;
        gap: var(--kit-space-md);
      }

      .import-tools-dropzone {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-lg);
        border: 1px dashed
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-lg);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 86%,
          transparent
        );
        text-align: center;
      }

      .import-tools-title {
        margin: 0;
        font-size: var(--kit-font-size-lg);
        font-weight: 700;
      }

      .import-tools-copy,
      .import-tools-meta,
      .import-tools-empty,
      .import-tools-detail {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .import-tools-input {
        justify-self: center;
        max-width: 100%;
      }

      .import-tools-list {
        display: grid;
        gap: var(--kit-space-sm);
      }

      .import-tools-section-title {
        margin: 0;
        font-size: var(--kit-font-size-sm);
        font-weight: 650;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--kit-text-secondary);
      }

      .import-tools-grid {
        display: grid;
        gap: var(--kit-space-sm);
      }

      .import-tools-card {
        display: grid;
        gap: 0.5rem;
        padding: var(--kit-space-sm);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-surface-primary);
      }

      .import-tools-card-title {
        margin: 0;
        font-weight: 650;
      }

      .import-tools-card-meta {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
      }

      .import-tools-preview {
        display: grid;
        gap: 0.35rem;
        padding: 0.7rem;
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 84%,
          transparent
        );
      }

      .import-tools-preview pre {
        margin: 0;
        max-height: 14rem;
        overflow: auto;
        white-space: pre-wrap;
        font-size: 0.75rem;
      }

      .import-tools-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-xs);
      }

      .import-tools-button {
        appearance: none;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        padding: 0.42rem 0.7rem;
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
        font-size: var(--kit-font-size-xs);
        font-weight: 600;
        cursor: pointer;
      }

      .import-tools-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
    ]; }
    renderContent() {
        return html `
      <section class="import-tools-shell">
        <div class="import-tools-dropzone">
          <h2 class="import-tools-title">${this.title}</h2>
          <p class="import-tools-copy">
            Select one or more Markdown / MDX files to convert them into Lexical
            JSON.
          </p>
          <input
            class="import-tools-input"
            type="file"
            .accept=${this.accept}
            ?multiple=${true}
            ?disabled=${this.disabled || this.busy}
            @change=${this.handleInputChange}
          />
          <p class="import-tools-meta">
            Frontmatter is preserved separately from the generated Lexical
            editor state.
          </p>
        </div>

        <div class="import-tools-list">
          <p class="import-tools-section-title">Queued files</p>
          ${this.queue.length > 0
            ? html `
                <div class="import-tools-grid">
                  ${this.queue.map((item) => this.renderQueueItem(item))}
                </div>
              `
            : html `<p class="import-tools-empty">${this.emptyLabel}</p>`}
        </div>

        <div class="import-tools-actions">
          <button
            class="import-tools-button"
            type="button"
            ?disabled=${this.disabled || this.busy || this.queue.length === 0}
            @click=${this.handleImportAll}
          >
            Import all
          </button>
          <button
            class="import-tools-button"
            type="button"
            ?disabled=${this.disabled || this.busy || this.queue.length === 0}
            @click=${this.clearQueue}
          >
            Clear queue
          </button>
        </div>
      </section>
    `;
    }
    renderQueueItem(item) {
        const { frontmatter, body, lexicalJson } = item.result;
        const previewLines = body.split("\n").slice(0, 5).join("\n");
        return html `
      <article class="import-tools-card">
        <h3 class="import-tools-card-title">${item.file.name}</h3>
        <p class="import-tools-card-meta">
          ${item.file.type || "text/markdown"} · ${formatBytes(item.file.size)}
          · ${Object.keys(frontmatter).length} frontmatter fields
        </p>
        <div class="import-tools-preview">
          <p class="import-tools-detail">Body preview</p>
          <pre>${previewLines}</pre>
        </div>
        <div class="import-tools-preview">
          <p class="import-tools-detail">Lexical JSON</p>
          <pre>
${lexicalJson.slice(0, 260)}${lexicalJson.length > 260 ? "…" : ""}</pre
          >
        </div>
        <div class="import-tools-actions">
          <button
            class="import-tools-button"
            type="button"
            @click=${() => this.removeQueueItem(item.id)}
          >
            Remove
          </button>
        </div>
      </article>
    `;
    }
    async queueMarkdownFiles(files) {
        const items = await Promise.all(files.map(async (file, index) => {
            const source = await file.text();
            return {
                id: `${file.name}-${file.size}-${index}`,
                file,
                result: migrateMdxSourceToLexicalJson(source, { pretty: false }),
            };
        }));
        this.queue = [...this.queue, ...items];
    }
    removeQueueItem(id) {
        this.queue = this.queue.filter((item) => item.id !== id);
    }
};
__decorate([
    property({ attribute: "accept" })
], KitPublishingImportTools.prototype, "accept", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingImportTools.prototype, "disabled", void 0);
__decorate([
    property({ attribute: "title" })
], KitPublishingImportTools.prototype, "title", void 0);
__decorate([
    property({ attribute: "empty-label" })
], KitPublishingImportTools.prototype, "emptyLabel", void 0);
__decorate([
    state()
], KitPublishingImportTools.prototype, "queue", void 0);
__decorate([
    state()
], KitPublishingImportTools.prototype, "busy", void 0);
KitPublishingImportTools = __decorate([
    customElement("kit-publishing-import-tools")
], KitPublishingImportTools);
export { KitPublishingImportTools };
function formatBytes(size) {
    if (size < 1024) {
        return `${size} B`;
    }
    const units = ["KB", "MB", "GB"];
    let value = size / 1024;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}
