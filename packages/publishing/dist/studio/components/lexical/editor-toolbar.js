var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../internal/ui.js";
import { createPublishingEditorState, markdownEditorCommands, } from "../../editor_contract.js";
export const lexicalEditorToolbarCommands = [
    {
        id: "undo",
        label: "Undo",
        shortLabel: "↶",
        kind: "history",
        shortcut: "Mod+Z",
    },
    {
        id: "redo",
        label: "Redo",
        shortLabel: "↷",
        kind: "history",
        shortcut: "Mod+Shift+Z",
    },
    ...markdownEditorCommands,
];
const compactToolbarCommandIds = new Set([
    "undo",
    "redo",
    "bold",
    "italic",
    "link",
    "image",
    "divider",
]);
export const lexicalCompactToolbarCommands = lexicalEditorToolbarCommands.filter((command) => compactToolbarCommandIds.has(command.id));
let KitLexicalEditorToolbar = class KitLexicalEditorToolbar extends PublishingElement {
    constructor() {
        super(...arguments);
        this.commands = lexicalEditorToolbarCommands;
        this.editorState = createPublishingEditorState({
            value: "",
            commands: lexicalEditorToolbarCommands,
        });
        this.onCommand = null;
        this.appearance = "default";
        this.showLabels = true;
        this.showShortcuts = true;
        this.toolbarLabel = "Editor formatting controls";
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--kit-space-xs);
        padding: var(--kit-space-xs);
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-editorial-chrome-surface);
      }

      .toolbar[data-appearance="compact"] {
        flex-wrap: nowrap;
        gap: 0.45rem;
        padding: 0.28rem;
        overflow-x: auto;
        border-color: var(--kit-editorial-chrome-border);
        border-radius: calc(var(--kit-radius-lg) + 0.2rem);
        background: color-mix(
          in srgb,
          var(--kit-editorial-chrome-surface) 98%,
          transparent
        );
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
      }

      .toolbar-button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.48rem 0.72rem;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 94%,
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

      .toolbar-button[data-appearance="compact"] {
        min-width: 2.2rem;
        justify-content: center;
        padding: 0.48rem 0.58rem;
        border-color: var(--kit-editorial-chrome-border);
        border-radius: calc(var(--kit-radius-md) + 0.1rem);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 96%,
          transparent
        );
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
      }

      .toolbar-button[data-appearance="compact"][data-active="true"] {
        box-shadow: var(--kit-editorial-focus-ring);
      }

      .toolbar-button-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.65rem;
        padding: 0.14rem 0.36rem;
        border-radius: var(--kit-radius-full);
        background: color-mix(
          in srgb,
          var(--kit-editorial-hover-surface) 100%,
          transparent
        );
        font-size: var(--kit-font-size-sm);
        line-height: 1;
      }

      .toolbar-button[data-appearance="compact"] .toolbar-button-icon {
        min-width: 1rem;
        padding: 0;
        background: transparent;
        font-size: 0.88rem;
      }

      .toolbar-button-label {
        font-size: var(--kit-font-size-sm);
        line-height: 1;
        white-space: nowrap;
      }

      .toolbar-button-shortcut {
        margin-left: 0.2rem;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
        line-height: 1;
        white-space: nowrap;
      }

      .toolbar-button[data-appearance="compact"] .toolbar-button-shortcut {
        display: none;
      }
    `,
    ]; }
    renderContent() {
        return html `
      <div
        class="toolbar"
        data-appearance=${this.appearance}
        part="toolbar"
        role="toolbar"
        aria-label=${this.toolbarLabel}
      >
        ${this.commands.map((command) => this.renderCommandButton(command))}
      </div>
    `;
    }
    renderCommandButton(command) {
        const commandState = this.editorState.commandStates[command.id];
        const isActive = commandState?.active ?? false;
        const isDisabled = commandState?.disabled ?? false;
        const shortcut = command.shortcut ?? "";
        const ariaLabel = shortcut.length > 0 ? `${command.label} (${shortcut})` : command.label;
        return html `
      <button
        class="toolbar-button"
        data-appearance=${this.appearance}
        aria-label=${ariaLabel}
        aria-keyshortcuts=${shortcut}
        aria-pressed=${isActive ? "true" : "false"}
        data-active=${isActive ? "true" : "false"}
        ?disabled=${isDisabled}
        title=${ariaLabel}
        @click=${() => this.handleCommand(command.id)}
        type="button"
      >
        <span class="toolbar-button-icon" aria-hidden="true"
          >${command.shortLabel}</span
        >
        ${this.showLabels
            ? html `<span class="toolbar-button-label">${command.label}</span>`
            : nothing}
        ${this.showShortcuts && shortcut.length > 0
            ? html `<span class="toolbar-button-shortcut" aria-hidden="true"
              >${shortcut}</span
            >`
            : nothing}
      </button>
    `;
    }
    handleCommand(commandId) {
        this.onCommand?.(commandId);
    }
};
__decorate([
    property({ attribute: false })
], KitLexicalEditorToolbar.prototype, "commands", void 0);
__decorate([
    property({ attribute: false })
], KitLexicalEditorToolbar.prototype, "editorState", void 0);
__decorate([
    property({ attribute: false })
], KitLexicalEditorToolbar.prototype, "onCommand", void 0);
__decorate([
    property()
], KitLexicalEditorToolbar.prototype, "appearance", void 0);
__decorate([
    property({ type: Boolean, attribute: "show-labels" })
], KitLexicalEditorToolbar.prototype, "showLabels", void 0);
__decorate([
    property({ type: Boolean, attribute: "show-shortcuts" })
], KitLexicalEditorToolbar.prototype, "showShortcuts", void 0);
__decorate([
    property({ attribute: "toolbar-label" })
], KitLexicalEditorToolbar.prototype, "toolbarLabel", void 0);
KitLexicalEditorToolbar = __decorate([
    customElement("kit-lexical-editor-toolbar")
], KitLexicalEditorToolbar);
export { KitLexicalEditorToolbar };
