var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../internal/ui.js";
let KitPublishingMediaUpload = class KitPublishingMediaUpload extends PublishingElement {
    constructor() {
        super(...arguments);
        this.assets = [];
        this.accept = "image/*";
        this.disabled = false;
        this.uploadLabel = "Upload media";
        this.emptyLabel = "No media assets yet.";
        this.activeDrop = false;
        this.pendingUploads = [];
        this.handleFileInputChange = async (event) => {
            const input = event.target;
            const files = Array.from(input.files ?? []);
            if (files.length === 0) {
                return;
            }
            const pending = await Promise.all(files.map(async (file, index) => ({
                id: `${file.name}-${file.size}-${index}`,
                file,
                previewUrl: file.type.startsWith("image/")
                    ? await readFileAsDataUrl(file)
                    : undefined,
            })));
            this.pendingUploads = pending;
            this.dispatchEvent(new CustomEvent("publishing-media-upload", {
                detail: { files: pending },
                bubbles: true,
                composed: true,
            }));
        };
        this.handleDrop = async (event) => {
            event.preventDefault();
            this.activeDrop = false;
            const files = Array.from(event.dataTransfer?.files ?? []);
            if (files.length === 0) {
                return;
            }
            const pending = await Promise.all(files.map(async (file, index) => ({
                id: `${file.name}-${file.size}-${index}`,
                file,
                previewUrl: file.type.startsWith("image/")
                    ? await readFileAsDataUrl(file)
                    : undefined,
            })));
            this.pendingUploads = pending;
            this.dispatchEvent(new CustomEvent("publishing-media-upload", {
                detail: { files: pending },
                bubbles: true,
                composed: true,
            }));
        };
        this.handleDragEnter = (event) => {
            event.preventDefault();
            this.activeDrop = true;
        };
        this.handleDragOver = (event) => {
            event.preventDefault();
            this.activeDrop = true;
        };
        this.handleDragLeave = (event) => {
            event.preventDefault();
            this.activeDrop = false;
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .media-upload-shell {
        display: grid;
        gap: var(--kit-space-md);
      }

      .media-upload-dropzone {
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

      .media-upload-dropzone[data-active="true"] {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 42%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 10%,
          var(--kit-surface-secondary)
        );
      }

      .media-upload-title {
        margin: 0;
        font-size: var(--kit-font-size-lg);
        font-weight: 700;
      }

      .media-upload-copy,
      .media-upload-hint,
      .media-upload-empty,
      .media-upload-meta {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .media-upload-input {
        justify-self: center;
        max-width: 100%;
      }

      .media-upload-list {
        display: grid;
        gap: var(--kit-space-sm);
      }

      .media-upload-section-title {
        margin: 0;
        font-size: var(--kit-font-size-sm);
        font-weight: 650;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--kit-text-secondary);
      }

      .media-upload-grid {
        display: grid;
        gap: var(--kit-space-sm);
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      }

      .media-upload-card {
        display: grid;
        gap: 0.5rem;
        padding: var(--kit-space-sm);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-surface-primary);
      }

      .media-upload-thumb {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: var(--kit-radius-md);
        background: var(--kit-surface-secondary);
      }

      .media-upload-placeholder {
        display: grid;
        place-items: center;
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
      }

      .media-upload-card-title {
        margin: 0;
        font-weight: 650;
      }

      .media-upload-card-meta {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
      }

      .media-upload-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-xs);
      }

      .media-upload-button {
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

      .media-upload-button:hover:enabled,
      .media-upload-button:focus-visible {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 32%,
          transparent
        );
      }

      .media-upload-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
    ]; }
    renderContent() {
        return html `
      <section class="media-upload-shell">
        <div
          class="media-upload-dropzone"
          data-active=${this.activeDrop ? "true" : "false"}
          @dragenter=${this.handleDragEnter}
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <h2 class="media-upload-title">${this.uploadLabel}</h2>
          <p class="media-upload-copy">
            Drag and drop files here or choose them with the file picker.
          </p>
          <input
            class="media-upload-input"
            type="file"
            .accept=${this.accept}
            ?multiple=${true}
            ?disabled=${this.disabled}
            @change=${this.handleFileInputChange}
          />
          <p class="media-upload-hint">
            Supported files follow the configured accept pattern.
          </p>
        </div>

        <div class="media-upload-list">
          <p class="media-upload-section-title">Managed assets</p>
          ${this.assets.length > 0
            ? html `
                <div class="media-upload-grid">
                  ${this.assets.map((asset) => this.renderAssetCard(asset))}
                </div>
              `
            : html `<p class="media-upload-empty">${this.emptyLabel}</p>`}
        </div>

        ${this.pendingUploads.length > 0
            ? html `
              <div class="media-upload-list">
                <p class="media-upload-section-title">Pending uploads</p>
                <div class="media-upload-grid">
                  ${this.pendingUploads.map((item) => this.renderPendingCard(item))}
                </div>
              </div>
            `
            : nothing}
      </section>
    `;
    }
    renderAssetCard(asset) {
        const isImage = asset.mimeType?.startsWith("image/") ??
            /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(asset.path);
        return html `
      <article class="media-upload-card">
        ${isImage
            ? html `<img
              class="media-upload-thumb"
              alt=${asset.label}
              src=${asset.path}
            />`
            : html `<div class="media-upload-placeholder">
              ${asset.mimeType ?? "asset"}
            </div>`}
        <h3 class="media-upload-card-title">${asset.label}</h3>
        <p class="media-upload-card-meta">${asset.path}</p>
        <div class="media-upload-actions">
          <button
            class="media-upload-button"
            type="button"
            ?disabled=${this.disabled}
            @click=${() => this.emitRemove(asset)}
          >
            Remove
          </button>
        </div>
      </article>
    `;
    }
    renderPendingCard(item) {
        const isImage = item.file.type.startsWith("image/") ||
            /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(item.file.name);
        return html `
      <article class="media-upload-card">
        ${item.previewUrl && isImage
            ? html `<img
              class="media-upload-thumb"
              alt=${item.file.name}
              src=${item.previewUrl}
            />`
            : html `<div class="media-upload-placeholder">
              ${item.file.type || "file"}
            </div>`}
        <h3 class="media-upload-card-title">${item.file.name}</h3>
        <p class="media-upload-card-meta">${formatBytes(item.file.size)}</p>
      </article>
    `;
    }
    emitRemove(asset) {
        this.dispatchEvent(new CustomEvent("publishing-media-remove", {
            detail: { asset },
            bubbles: true,
            composed: true,
        }));
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingMediaUpload.prototype, "assets", void 0);
__decorate([
    property({ attribute: "accept" })
], KitPublishingMediaUpload.prototype, "accept", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingMediaUpload.prototype, "disabled", void 0);
__decorate([
    property({ attribute: "upload-label" })
], KitPublishingMediaUpload.prototype, "uploadLabel", void 0);
__decorate([
    property({ attribute: "empty-label" })
], KitPublishingMediaUpload.prototype, "emptyLabel", void 0);
__decorate([
    state()
], KitPublishingMediaUpload.prototype, "activeDrop", void 0);
__decorate([
    state()
], KitPublishingMediaUpload.prototype, "pendingUploads", void 0);
KitPublishingMediaUpload = __decorate([
    customElement("kit-publishing-media-upload")
], KitPublishingMediaUpload);
export { KitPublishingMediaUpload };
export async function readFileAsDataUrl(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type.length > 0 ? file.type : "application/octet-stream";
    return `data:${mimeType};base64,${base64}`;
}
function formatBytes(size) {
    if (size < 1024) {
        return `${size} B`;
    }
    const units = ["KB", "MB", "GB"];
    let value = size / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
