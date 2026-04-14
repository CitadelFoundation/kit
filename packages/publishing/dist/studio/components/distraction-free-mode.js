var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../internal/ui.js";
let KitPublishingDistractionFreeMode = class KitPublishingDistractionFreeMode extends PublishingElement {
    constructor() {
        super(...arguments);
        this.active = false;
        this.routeLabel = "/";
        this.statusLabel = "Editing";
        this.surfaceLabel = "Posts";
        this.workflowState = "draft";
        this.showWorkspace = true;
        this.showSettings = true;
        this.canPreview = true;
        this.canReview = true;
        this.canConfirmPublish = false;
        this.canPublish = false;
        this.actions = {};
        this.description = "";
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .distraction-free-shell {
        display: grid;
        gap: 0.75rem;
      }

      .write-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-lg);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
      }

      .write-status-info {
        display: grid;
        gap: 0.35rem;
      }

      .write-status-meta {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }

      .status-chip,
      .summary-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.6rem;
        padding: 0.18rem 0.55rem;
        border-radius: var(--kit-radius-full);
        font-size: var(--kit-font-size-xs);
        font-weight: 650;
      }

      .status-chip {
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 12%,
          var(--kit-surface-primary)
        );
      }

      .summary-pill {
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 88%,
          transparent
        );
        color: var(--kit-text-secondary);
      }

      .write-status-message {
        margin: 0;
        color: var(--kit-text-primary);
        font-weight: 600;
      }

      .write-status-copy {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .write-status-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .hero-card {
        display: grid;
        gap: 0.4rem;
        padding: 1rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        border-radius: var(--kit-radius-lg);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 86%,
          transparent
        );
      }

      .hero-card-title {
        margin: 0;
        font-size: var(--kit-font-size-lg);
        font-weight: 700;
      }

      .hero-card-copy,
      .canvas-status {
        margin: 0;
        color: var(--kit-text-secondary);
      }

      .canvas-status {
        padding: 0.25rem 0.1rem;
      }

      .writing-column {
        min-height: 18rem;
      }
    `,
    ]; }
    renderContent() {
        return html `
      <section
        class="distraction-free-shell"
        data-active=${this.active ? "true" : "false"}
      >
        ${this.active ? this.renderMinimalChrome() : this.renderHeroChrome()}
        <div class="writing-column" data-parity-region="writing-column">
          <slot></slot>
        </div>
      </section>
    `;
    }
    renderMinimalChrome() {
        return html `
      <section class="write-status-bar" aria-label="Write mode status bar">
        <div class="write-status-info">
          <div class="write-status-meta">
            <span class="status-chip" data-tone="ready">Write</span>
            <span class="summary-pill">${this.workflowState}</span>
            <span class="summary-pill">${this.surfaceLabel}</span>
          </div>
          <p class="write-status-message">
            ${this.statusLabel} ${this.routeLabel}
          </p>
          ${this.description.length > 0
            ? html `<p class="write-status-copy">${this.description}</p>`
            : nothing}
        </div>

        <div class="write-status-actions">
          ${this.showWorkspace
            ? html `
                <button
                  class="action-button"
                  aria-label="Show workspace context"
                  data-variant="quiet"
                  type="button"
                  @click=${() => this.actions.onToggleWorkspace?.()}
                >
                  Workspace
                </button>
              `
            : nothing}
          ${this.showSettings
            ? html `
                <button
                  class="action-button"
                  aria-label="Show page settings"
                  data-variant="quiet"
                  type="button"
                  @click=${() => this.actions.onToggleSettings?.()}
                >
                  Page settings
                </button>
              `
            : nothing}
          ${this.canPreview
            ? html `
                <button
                  class="action-button"
                  aria-label="Preview current draft"
                  data-action="preview"
                  data-variant="primary"
                  type="button"
                  @click=${() => this.actions.onPreview?.()}
                >
                  Preview
                </button>
              `
            : nothing}
          ${this.canReview
            ? html `
                <button
                  class="action-button"
                  aria-label="Review publish diff"
                  data-action="review-publish"
                  data-variant="default"
                  type="button"
                  @click=${() => this.actions.onReview?.()}
                >
                  Review Publish
                </button>
              `
            : nothing}
          ${this.canConfirmPublish
            ? html `
                <button
                  class="action-button"
                  aria-label="Confirm publish current draft"
                  data-action="confirm-publish"
                  data-variant="success"
                  ?disabled=${!this.canPublish}
                  type="button"
                  @click=${() => this.actions.onConfirmPublish?.()}
                >
                  Confirm Publish
                </button>
              `
            : nothing}
        </div>
      </section>
    `;
    }
    renderHeroChrome() {
        return html `
      <section class="hero-card" aria-label="Write mode hero chrome">
        <h2 class="hero-card-title">${this.surfaceLabel}</h2>
        <p class="hero-card-copy">
          ${this.description || `Editing ${this.routeLabel}`}
        </p>
        <div class="canvas-status">
          Focus mode keeps the writing canvas visible and reduces surrounding
          chrome.
        </div>
      </section>
    `;
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingDistractionFreeMode.prototype, "active", void 0);
__decorate([
    property({ attribute: "route-label" })
], KitPublishingDistractionFreeMode.prototype, "routeLabel", void 0);
__decorate([
    property({ attribute: "status-label" })
], KitPublishingDistractionFreeMode.prototype, "statusLabel", void 0);
__decorate([
    property({ attribute: "surface-label" })
], KitPublishingDistractionFreeMode.prototype, "surfaceLabel", void 0);
__decorate([
    property({ attribute: "workflow-state" })
], KitPublishingDistractionFreeMode.prototype, "workflowState", void 0);
__decorate([
    property({ type: Boolean, attribute: "show-workspace" })
], KitPublishingDistractionFreeMode.prototype, "showWorkspace", void 0);
__decorate([
    property({ type: Boolean, attribute: "show-settings" })
], KitPublishingDistractionFreeMode.prototype, "showSettings", void 0);
__decorate([
    property({ type: Boolean, attribute: "can-preview" })
], KitPublishingDistractionFreeMode.prototype, "canPreview", void 0);
__decorate([
    property({ type: Boolean, attribute: "can-review" })
], KitPublishingDistractionFreeMode.prototype, "canReview", void 0);
__decorate([
    property({ type: Boolean, attribute: "can-confirm-publish" })
], KitPublishingDistractionFreeMode.prototype, "canConfirmPublish", void 0);
__decorate([
    property({ type: Boolean, attribute: "can-publish" })
], KitPublishingDistractionFreeMode.prototype, "canPublish", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingDistractionFreeMode.prototype, "actions", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingDistractionFreeMode.prototype, "description", void 0);
KitPublishingDistractionFreeMode = __decorate([
    customElement("kit-publishing-distraction-free-mode")
], KitPublishingDistractionFreeMode);
export { KitPublishingDistractionFreeMode };
