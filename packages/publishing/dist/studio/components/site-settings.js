var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../internal/ui.js";
let KitPublishingSiteSettings = class KitPublishingSiteSettings extends PublishingElement {
    constructor() {
        super(...arguments);
        this.settings = createDefaultSiteSettings();
        this.open = true;
        this.revision = 0;
        this.addSocialLink = () => {
            this.updateSettings({
                ...this.settings,
                socialLinks: [
                    ...this.settings.socialLinks,
                    { label: "New link", href: "https://", external: true },
                ],
            });
        };
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
      .preview,
      .meta,
      .empty-state {
        font-size: 0.8125rem;
        line-height: 1.45;
      }

      .counter,
      .helper,
      .preview,
      .meta,
      .empty-state {
        color: var(--kit-text-secondary, #4b5563);
      }

      input,
      textarea,
      select {
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
      textarea:focus,
      select:focus {
        outline: none;
        border-color: var(--kit-color-primary, #111827);
        box-shadow: 0 0 0 3px rgb(17 24 39 / 0.08);
      }

      input[data-invalid="true"],
      textarea[data-invalid="true"],
      select[data-invalid="true"] {
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

      .social-links {
        display: grid;
        gap: 0.75rem;
      }

      .social-link-card {
        display: grid;
        gap: 0.6rem;
        padding: 0.85rem;
        border-radius: var(--kit-radius-md, 0.5rem);
        border: 1px solid var(--kit-border-primary, #d1d5db);
        background: var(--kit-surface-secondary, #f8fafc);
      }

      .social-link-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
    `,
    ]; }
    updated(changedProperties) {
        if (changedProperties.has("settings")) {
            this.revision += 1;
            this.dispatchChange();
        }
    }
    getSettings() {
        return this.settings;
    }
    getValidationIssues() {
        return buildValidationIssues(this.settings);
    }
    renderContent() {
        const issues = this.getValidationIssues();
        const isValid = issues.length === 0;
        const seo = this.settings.seo ?? {};
        return html `
      <details ?open=${this.open} class="site-settings-panel">
        <summary>
          <div>
            Site settings
            <p class="panel-copy">
              Publication title, contact details, social links, and SEO.
            </p>
          </div>
          <span class="pill"
            >${isValid ? "Ready" : `${issues.length} issues`}</span
          >
        </summary>

        <div class="panel-grid">
          ${this.renderField("Publication title", this.settings.title, (value) => {
            this.updateSettings({ ...this.settings, title: value });
        }, { id: "title", type: "text", required: true })}
          ${this.renderField("Description", this.settings.description, (value) => {
            this.updateSettings({ ...this.settings, description: value });
        }, { id: "description", textarea: true, required: true })}
          ${this.renderField("Language", this.settings.language, (value) => {
            this.updateSettings({ ...this.settings, language: value });
        }, { id: "language", type: "text", required: true })}
          ${this.renderField("Contact email", this.settings.contactEmail, (value) => {
            this.updateSettings({ ...this.settings, contactEmail: value });
        }, { id: "contactEmail", type: "email", required: true })}
          ${this.renderField("Footer notice", this.settings.footerNotice, (value) => {
            this.updateSettings({ ...this.settings, footerNotice: value });
        }, { id: "footerNotice", textarea: true, required: true })}
          ${this.renderField("Theme color", this.settings.themeColor ?? "", (value) => {
            this.updateSettings({
                ...this.settings,
                themeColor: value.trim() || undefined,
            });
        }, { id: "themeColor", type: "color" })}
          ${this.renderField("SEO title", seo.title ?? "", (value) => {
            this.updateSettings({
                ...this.settings,
                seo: mergeSeo(seo, { title: value.trim() || undefined }),
            });
        }, { id: "seoTitle", type: "text" })}
          ${this.renderField("SEO description", seo.description ?? "", (value) => {
            this.updateSettings({
                ...this.settings,
                seo: mergeSeo(seo, { description: value.trim() || undefined }),
            });
        }, { id: "seoDescription", textarea: true })}

          <section class="field">
            <div class="label-row">
              <label>Social links</label>
              <button
                class="action-button"
                type="button"
                @click=${this.addSocialLink}
              >
                Add link
              </button>
            </div>
            <div class="social-links">
              ${this.settings.socialLinks.length > 0
            ? this.settings.socialLinks.map((link, index) => this.renderSocialLink(link, index))
            : html `<p class="empty-state">No social links configured.</p>`}
            </div>
          </section>

          <section class="field">
            <div class="label-row">
              <label>Validation</label>
              <span class="counter"
                >${issues.length} issue${issues.length === 1 ? "" : "s"}</span
              >
            </div>
            ${issues.length > 0
            ? html `
                  <ul class="validation-list">
                    ${issues.map((issue) => html `<li class="issue">
                          ${issue.field}: ${issue.message}
                        </li>`)}
                  </ul>
                `
            : html `<p class="empty-state">
                  All site settings fields are valid.
                </p>`}
          </section>
        </div>
      </details>
    `;
    }
    renderField(label, value, onChange, options) {
        const issue = this.getValidationIssues().find((entry) => entry.field === fieldNameForId(options.id));
        return html `
      <div class="field">
        <div class="label-row">
          <label for=${options.id}>${label}</label>
          ${options.required
            ? html `<span class="counter">Required</span>`
            : nothing}
        </div>
        ${options.textarea
            ? html `
              <textarea
                id=${options.id}
                data-invalid=${issue ? "true" : "false"}
                .value=${value}
                @input=${(event) => onChange(event.target.value)}
              ></textarea>
            `
            : html `
              <input
                id=${options.id}
                data-invalid=${issue ? "true" : "false"}
                .type=${options.type ?? "text"}
                .value=${value}
                @input=${(event) => onChange(event.target.value)}
              />
            `}
        ${issue ? html `<p class="issue">${issue.message}</p>` : nothing}
      </div>
    `;
    }
    renderSocialLink(link, index) {
        return html `
      <div class="social-link-card">
        ${this.renderField(`Label ${index + 1}`, link.label, (value) => {
            this.replaceSocialLink(index, { ...link, label: value });
        }, { id: `socialLabel-${index}`, required: true })}
        ${this.renderField(`Href ${index + 1}`, link.href, (value) => {
            this.replaceSocialLink(index, { ...link, href: value });
        }, { id: `socialHref-${index}`, required: true })}
        <label class="meta">
          <input
            type="checkbox"
            ?checked=${link.external ?? false}
            @change=${(event) => {
            this.replaceSocialLink(index, {
                ...link,
                external: event.target.checked || undefined,
            });
        }}
          />
          External link
        </label>
        <label class="meta">
          Description
          <textarea
            .value=${link.description ?? ""}
            @input=${(event) => {
            this.replaceSocialLink(index, {
                ...link,
                description: event.target.value.trim() ||
                    undefined,
            });
        }}
          ></textarea>
        </label>
        <div class="social-link-actions">
          <button
            class="action-button"
            type="button"
            @click=${() => this.moveSocialLink(index, -1)}
            ?disabled=${index === 0}
          >
            Move up
          </button>
          <button
            class="action-button"
            type="button"
            @click=${() => this.moveSocialLink(index, 1)}
            ?disabled=${index >= this.settings.socialLinks.length - 1}
          >
            Move down
          </button>
          <button
            class="action-button"
            type="button"
            @click=${() => this.removeSocialLink(index)}
          >
            Remove
          </button>
        </div>
      </div>
    `;
    }
    updateSettings(settings) {
        this.settings = settings;
        this.dispatchChange();
    }
    dispatchChange() {
        const issues = this.getValidationIssues();
        const detail = {
            settings: this.settings,
            issues,
            isValid: issues.length === 0,
        };
        this.dispatchEvent(new CustomEvent("publishing-site-settings-change", {
            detail,
            bubbles: true,
            composed: true,
        }));
    }
    removeSocialLink(index) {
        this.updateSettings({
            ...this.settings,
            socialLinks: this.settings.socialLinks.filter((_link, linkIndex) => linkIndex !== index),
        });
    }
    replaceSocialLink(index, link) {
        this.updateSettings({
            ...this.settings,
            socialLinks: this.settings.socialLinks.map((entry, entryIndex) => entryIndex === index ? link : entry),
        });
    }
    moveSocialLink(index, delta) {
        const nextIndex = index + delta;
        if (nextIndex < 0 || nextIndex >= this.settings.socialLinks.length) {
            return;
        }
        const nextLinks = [...this.settings.socialLinks];
        const [moving] = nextLinks.splice(index, 1);
        nextLinks.splice(nextIndex, 0, moving);
        this.updateSettings({ ...this.settings, socialLinks: nextLinks });
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingSiteSettings.prototype, "settings", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingSiteSettings.prototype, "open", void 0);
__decorate([
    state()
], KitPublishingSiteSettings.prototype, "revision", void 0);
KitPublishingSiteSettings = __decorate([
    customElement("kit-publishing-site-settings")
], KitPublishingSiteSettings);
export { KitPublishingSiteSettings };
export function createDefaultSiteSettings() {
    return {
        kind: "site_settings",
        title: "Citadel Foundation",
        description: "",
        language: "en",
        footerNotice: "",
        contactEmail: "",
        socialLinks: [],
        themeColor: undefined,
        seo: undefined,
    };
}
function buildValidationIssues(settings) {
    const issues = [];
    if (settings.title.trim().length === 0) {
        issues.push({ field: "title", message: "Publication title is required." });
    }
    if (settings.description.trim().length === 0) {
        issues.push({ field: "description", message: "Description is required." });
    }
    if (settings.language.trim().length < 2) {
        issues.push({
            field: "language",
            message: "Language must be at least 2 characters.",
        });
    }
    if (settings.footerNotice.trim().length === 0) {
        issues.push({
            field: "footerNotice",
            message: "Footer notice is required.",
        });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(settings.contactEmail.trim())) {
        issues.push({
            field: "contactEmail",
            message: "Contact email must be valid.",
        });
    }
    if (settings.themeColor && !/^#[0-9a-fA-F]{6}$/u.test(settings.themeColor)) {
        issues.push({
            field: "themeColor",
            message: "Theme color must be a hex value like #112233.",
        });
    }
    if (settings.seo?.title && settings.seo.title.length > 60) {
        issues.push({
            field: "seoTitle",
            message: "SEO title should be 60 characters or fewer.",
        });
    }
    if (settings.seo?.description && settings.seo.description.length > 160) {
        issues.push({
            field: "seoDescription",
            message: "SEO description should be 160 characters or fewer.",
        });
    }
    settings.socialLinks.forEach((link, index) => {
        if (link.label.trim().length === 0 || link.href.trim().length === 0) {
            issues.push({
                field: "socialLinks",
                message: `Social link ${index + 1} needs a label and href.`,
            });
        }
    });
    return issues;
}
function mergeSeo(base, update) {
    const next = { ...base, ...update };
    if ((next.title ?? "").trim().length === 0 &&
        (next.description ?? "").trim().length === 0) {
        return undefined;
    }
    return next;
}
function fieldNameForId(id) {
    switch (id) {
        case "title":
            return "title";
        case "description":
            return "description";
        case "language":
            return "language";
        case "footerNotice":
            return "footerNotice";
        case "contactEmail":
            return "contactEmail";
        case "themeColor":
            return "themeColor";
        case "seoTitle":
            return "seoTitle";
        case "seoDescription":
            return "seoDescription";
        default:
            return "socialLinks";
    }
}
