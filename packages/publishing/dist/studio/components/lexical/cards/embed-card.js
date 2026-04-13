var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { $getNodeByKey, } from "lexical";
import { css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../../internal/ui.js";
import { PublishingCardNode, restorePublishingCardNode, } from "./card-node.js";
export function createEmbedCardViewElement(config) {
    const view = document.createElement("kit-publishing-embed-card-view");
    view.data = config.data;
    view.selected = config.selected ?? false;
    view.editable = config.editable ?? true;
    view.onChange = config.onChange ?? null;
    return view;
}
let KitPublishingEmbedCardView = class KitPublishingEmbedCardView extends PublishingElement {
    constructor() {
        super(...arguments);
        this.data = { url: "", caption: "", title: "" };
        this.selected = false;
        this.editable = true;
        this.onChange = null;
        this.embedError = null;
        this.handleUrlChange = (event) => {
            const value = event.target.value;
            this.setData({ ...this.data, url: value });
        };
        this.handleTitleChange = (event) => {
            const value = event.target.value;
            this.setData({ ...this.data, title: value });
        };
        this.handleCaptionChange = (event) => {
            const value = event.target.value;
            this.setData({ ...this.data, caption: value });
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .embed-card {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 88%, transparent);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-surface-primary);
      }

      :host([selected]) .embed-card {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 44%,
          transparent
        );
        box-shadow: 0 0 0 1px
          color-mix(in srgb, var(--kit-color-primary) 18%, transparent);
      }

      .embed-card-preview {
        display: grid;
        gap: var(--kit-space-xs);
      }

      .embed-card-frame {
        width: 100%;
        min-height: 16rem;
        border: 0;
        border-radius: var(--kit-radius-md);
        background: var(--kit-surface-secondary);
      }

      .embed-card-link {
        display: grid;
        gap: 0.25rem;
        padding: var(--kit-space-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        text-decoration: none;
        color: inherit;
        background: var(--kit-surface-secondary);
      }

      .embed-card-link-title {
        margin: 0;
        font-weight: 650;
      }

      .embed-card-link-url {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
      }

      .embed-card-caption {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .embed-card-controls {
        display: grid;
        gap: var(--kit-space-sm);
      }

      .embed-card-field {
        display: grid;
        gap: 0.25rem;
      }

      .embed-card-label {
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
        font-weight: 650;
      }

      .embed-card-input,
      .embed-card-textarea {
        width: 100%;
        padding: 0.5rem 0.7rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
      }

      .embed-card-textarea {
        min-height: 5rem;
        resize: vertical;
      }

      .embed-card-error {
        margin: 0;
        color: #b42318;
        font-size: var(--kit-font-size-xs);
      }
    `,
    ]; }
    renderContent() {
        const preview = resolveEmbedPreview(this.data.url, this.data.title);
        return html `
      <section class="embed-card">
        <div class="embed-card-preview">
          ${preview.kind === "iframe"
            ? html `
                <iframe
                  class="embed-card-frame"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy"
                  referrerpolicy="strict-origin-when-cross-origin"
                  src=${preview.embedUrl ?? preview.href}
                  title=${preview.label}
                ></iframe>
              `
            : html `
                <a
                  class="embed-card-link"
                  href=${preview.href}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  ${preview.thumbnail
                ? html `<img
                        alt=${preview.label}
                        class="embed-card-frame"
                        src=${preview.thumbnail}
                      />`
                : nothing}
                  <p class="embed-card-link-title">${preview.label}</p>
                  <p class="embed-card-link-url">${preview.href}</p>
                </a>
              `}
          ${this.data.caption.length > 0
            ? html `<p class="embed-card-caption">${this.data.caption}</p>`
            : nothing}
        </div>

        ${this.editable
            ? html `
              <div class="embed-card-controls">
                <label class="embed-card-field">
                  <span class="embed-card-label">Embed URL</span>
                  <input
                    class="embed-card-input"
                    type="url"
                    .value=${this.data.url}
                    placeholder="https://www.youtube.com/watch?v=..."
                    @change=${this.handleUrlChange}
                  />
                </label>

                <label class="embed-card-field">
                  <span class="embed-card-label">Title</span>
                  <input
                    class="embed-card-input"
                    type="text"
                    .value=${this.data.title}
                    placeholder="Optional title"
                    @change=${this.handleTitleChange}
                  />
                </label>

                <label class="embed-card-field">
                  <span class="embed-card-label">Caption</span>
                  <textarea
                    class="embed-card-textarea"
                    .value=${this.data.caption}
                    placeholder="Optional caption"
                    @change=${this.handleCaptionChange}
                  ></textarea>
                </label>

                ${this.embedError
                ? html `<p class="embed-card-error">${this.embedError}</p>`
                : nothing}
              </div>
            `
            : nothing}
      </section>
    `;
    }
    setData(data) {
        this.data = data;
        this.onChange?.(data);
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingEmbedCardView.prototype, "data", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingEmbedCardView.prototype, "selected", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingEmbedCardView.prototype, "editable", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingEmbedCardView.prototype, "onChange", void 0);
__decorate([
    state()
], KitPublishingEmbedCardView.prototype, "embedError", void 0);
KitPublishingEmbedCardView = __decorate([
    customElement("kit-publishing-embed-card-view")
], KitPublishingEmbedCardView);
export { KitPublishingEmbedCardView };
export class EmbedCardNode extends PublishingCardNode {
    static { this.cardType = "embed-card"; }
    static getType() {
        return EmbedCardNode.cardType;
    }
    static clone(node) {
        return new EmbedCardNode(node.getCardData(), node.getKey());
    }
    constructor(data, key) {
        super(data, key);
    }
    createDOM() {
        const element = document.createElement("div");
        element.dataset.cardType = this.getCardType();
        element.className = "publishing-embed-card-node";
        return element;
    }
    decorate(editor, _config) {
        const view = createEmbedCardViewElement({
            data: this.getCardData(),
            selected: false,
            editable: true,
            onChange: (data) => {
                editor.update(() => {
                    const node = $getNodeByKey(this.getKey());
                    if (node instanceof EmbedCardNode) {
                        node.setCardData(data);
                    }
                });
            },
        });
        return view;
    }
    exportJSON() {
        return {
            ...super.exportJSON(),
            type: this.getCardType(),
            version: 1,
            data: this.getCardData(),
        };
    }
    static importJSON(serializedNode) {
        return restorePublishingCardNode(EmbedCardNode, serializedNode);
    }
}
export function createEmbedCard(data) {
    return new EmbedCardNode(data);
}
export function resolveEmbedPreview(url, title) {
    const parsed = safeParseUrl(url);
    if (!parsed) {
        return {
            kind: "link",
            provider: "generic",
            href: url,
            label: title.length > 0 ? title : url,
        };
    }
    const youtube = resolveYouTubeEmbed(parsed);
    if (youtube) {
        return youtube;
    }
    const twitter = resolveTwitterEmbed(parsed);
    if (twitter) {
        return twitter;
    }
    return {
        kind: "link",
        provider: "generic",
        href: parsed.toString(),
        label: title.length > 0 ? title : parsed.hostname,
        thumbnail: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`,
    };
}
function resolveYouTubeEmbed(url) {
    if (!isYouTubeHost(url.hostname)) {
        return null;
    }
    const videoId = url.hostname.includes("youtu.be")
        ? url.pathname.replace(/^\//u, "")
        : (url.searchParams.get("v") ??
            url.pathname.split("/").filter(Boolean).pop() ??
            "");
    if (videoId.length === 0) {
        return null;
    }
    return {
        kind: "iframe",
        provider: "youtube",
        href: url.toString(),
        label: `YouTube video ${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`,
        thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
    };
}
function isYouTubeHost(hostname) {
    return /(?:^|\.)(?:youtube\.com|youtu\.be)$/iu.test(hostname);
}
function resolveTwitterEmbed(url) {
    if (!/^(?:x\.com|twitter\.com)$/iu.test(url.hostname)) {
        return null;
    }
    return {
        kind: "iframe",
        provider: "twitter",
        href: url.toString(),
        label: `Twitter post ${url.pathname}`,
        embedUrl: `https://platform.twitter.com/embed/index.html?url=${encodeURIComponent(url.toString())}`,
    };
}
function safeParseUrl(value) {
    try {
        return new URL(value);
    }
    catch {
        return null;
    }
}
