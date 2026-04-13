var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../internal/ui.js";
import { markdownEditorCommands, } from "../../editor_contract.js";
const lexicalOnlyCommands = [
    {
        id: "underline",
        label: "Underline",
        shortLabel: "U",
        kind: "format",
        shortcut: "Mod+U",
    },
    {
        id: "strikethrough",
        label: "Strikethrough",
        shortLabel: "S",
        kind: "format",
        shortcut: "Mod+Shift+S",
    },
    {
        id: "code",
        label: "Code",
        shortLabel: "{ }",
        kind: "format",
        shortcut: "Mod+E",
    },
];
const floatingToolbarSharedIds = new Set(["bold", "italic", "link"]);
const sharedFloatingToolbarCommands = markdownEditorCommands.filter((c) => floatingToolbarSharedIds.has(c.id));
export const lexicalFloatingToolbarCommands = [...sharedFloatingToolbarCommands, ...lexicalOnlyCommands];
let KitLexicalFloatingToolbar = class KitLexicalFloatingToolbar extends PublishingElement {
    constructor() {
        super(...arguments);
        this.commands = lexicalFloatingToolbarCommands;
        this.activeFormats = {
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            code: false,
            link: false,
        };
        this.visible = false;
        this.disabled = false;
        this.placement = null;
        this.toolbarLabel = "Selection formatting controls";
        this.onCommand = null;
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
        position: fixed;
        inset: 0 auto auto 0;
        z-index: 20;
        pointer-events: none;
      }

      .floating-toolbar {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 0.25rem;
        padding: 0.28rem;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: calc(var(--kit-radius-lg) + 0.125rem);
        background: var(--kit-editorial-overlay-surface);
        backdrop-filter: blur(12px);
        box-shadow: var(--kit-editorial-overlay-shadow);
        pointer-events: auto;
        transform: translate(-50%, calc(-100% - var(--kit-space-xs)));
      }

      .floating-toolbar[hidden] {
        display: none;
      }

      .toolbar-button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.05rem;
        padding: 0.42rem 0.54rem;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: calc(var(--kit-radius-md) + 0.1rem);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 95%,
          transparent
        );
        color: var(--kit-editorial-muted-text);
        font: inherit;
        font-weight: 500;
        cursor: pointer;
        transition:
          color 120ms ease,
          border-color 120ms ease,
          background 120ms ease;
      }

      .toolbar-button:hover:enabled {
        color: var(--kit-text-primary);
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 22%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 8%,
          var(--kit-surface-primary)
        );
      }

      .toolbar-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .toolbar-button[data-active="true"] {
        color: var(--kit-text-primary);
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 28%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 12%,
          var(--kit-surface-primary)
        );
        box-shadow: var(--kit-editorial-focus-ring);
      }

      .toolbar-button-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1rem;
        padding: 0;
        background: transparent;
        font-size: 0.88rem;
        line-height: 1;
      }

      .toolbar-button-label {
        display: none;
      }

      .toolbar-button-shortcut {
        display: none;
      }
    `,
    ]; }
    renderContent() {
        const placement = this.placement ?? { left: 0, top: 0 };
        const style = `left: ${placement.left}px; top: ${placement.top}px;`;
        return html `
      <div
        class="floating-toolbar"
        part="toolbar"
        role="toolbar"
        aria-hidden=${this.visible ? "false" : "true"}
        aria-label=${this.toolbarLabel}
        ?hidden=${!this.visible}
        style=${style}
      >
        ${this.commands.map((command) => this.renderCommandButton(command))}
      </div>
    `;
    }
    renderCommandButton(command) {
        const isActive = this.activeFormats[command.id] ?? false;
        const shortcut = command.shortcut ?? "";
        const ariaLabel = shortcut.length > 0 ? `${command.label} (${shortcut})` : command.label;
        return html `
      <button
        class="toolbar-button"
        aria-label=${ariaLabel}
        aria-keyshortcuts=${shortcut}
        aria-pressed=${isActive ? "true" : "false"}
        data-active=${isActive ? "true" : "false"}
        ?disabled=${this.disabled}
        title=${ariaLabel}
        @click=${() => this.handleCommand(command.id)}
        type="button"
      >
        <span class="toolbar-button-icon" aria-hidden="true"
          >${command.shortLabel}</span
        >
        <span class="toolbar-button-label">${command.label}</span>
        ${shortcut.length > 0
            ? html `<span class="toolbar-button-shortcut" aria-hidden="true"
              >${shortcut}</span
            >`
            : nothing}
      </button>
    `;
    }
    handleCommand(commandId) {
        if (this.disabled) {
            return;
        }
        this.onCommand?.(commandId);
    }
};
__decorate([
    property({ attribute: false })
], KitLexicalFloatingToolbar.prototype, "commands", void 0);
__decorate([
    property({ attribute: false })
], KitLexicalFloatingToolbar.prototype, "activeFormats", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitLexicalFloatingToolbar.prototype, "visible", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitLexicalFloatingToolbar.prototype, "disabled", void 0);
__decorate([
    property({ attribute: false })
], KitLexicalFloatingToolbar.prototype, "placement", void 0);
__decorate([
    property({ attribute: "toolbar-label" })
], KitLexicalFloatingToolbar.prototype, "toolbarLabel", void 0);
__decorate([
    property({ attribute: false })
], KitLexicalFloatingToolbar.prototype, "onCommand", void 0);
KitLexicalFloatingToolbar = __decorate([
    customElement("kit-lexical-floating-toolbar")
], KitLexicalFloatingToolbar);
export { KitLexicalFloatingToolbar };
