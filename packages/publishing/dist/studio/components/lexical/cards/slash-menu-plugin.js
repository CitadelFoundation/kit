var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../../internal/ui.js";
import { INSERT_CARD_COMMAND, } from "./commands.js";
import { publishingCardRegistry, } from "./card-registry.js";
const EMPTY_SLASH_MENU_STATE = {
    open: false,
    query: "",
    activeIndex: 0,
    placement: null,
};
let KitPublishingSlashMenuPlugin = class KitPublishingSlashMenuPlugin extends PublishingElement {
    constructor() {
        super(...arguments);
        this.editor = null;
        this.menuState = EMPTY_SLASH_MENU_STATE;
        this.menuItems = [];
        this.rootElement = null;
        this.rootDisposer = null;
        this.rootKeyDownListener = null;
        this.handleRootKeyDown = (event) => {
            if (event.key === "/" &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey) {
                this.openMenu();
                return;
            }
            if (!this.menuState.open) {
                return;
            }
            switch (event.key) {
                case "ArrowDown":
                    event.preventDefault();
                    this.moveActive(1);
                    return;
                case "ArrowUp":
                    event.preventDefault();
                    this.moveActive(-1);
                    return;
                case "Enter":
                    event.preventDefault();
                    this.confirmActiveItem();
                    return;
                case "Escape":
                    event.preventDefault();
                    this.closeMenu();
                    return;
                case "Backspace":
                    this.updateQuery(this.menuState.query.slice(0, -1));
                    return;
                default:
                    break;
            }
            if (event.key.length === 1 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey) {
                if (/^[\w-]$/u.test(event.key)) {
                    this.updateQuery(`${this.menuState.query}${event.key.toLowerCase()}`);
                }
                else if (event.key === " ") {
                    this.closeMenu();
                }
            }
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: contents;
      }

      .slash-menu {
        position: fixed;
        z-index: 40;
        min-width: 16rem;
        max-width: 24rem;
        pointer-events: auto;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 86%, transparent);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-surface-primary);
        box-shadow: 0 18px 44px
          color-mix(in srgb, var(--kit-text-primary) 14%, transparent);
        overflow: hidden;
      }

      .slash-menu[hidden] {
        display: none;
      }

      .slash-menu-header {
        display: grid;
        gap: 0.125rem;
        padding: var(--kit-space-sm) var(--kit-space-md);
        border-bottom: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 88%, transparent);
      }

      .slash-menu-title {
        margin: 0;
        font-size: var(--kit-font-size-sm);
        font-weight: 700;
      }

      .slash-menu-query {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
      }

      .slash-menu-list {
        margin: 0;
        padding: 0.25rem;
        list-style: none;
        display: grid;
      }

      .slash-menu-option {
        all: unset;
        display: grid;
        gap: 0.125rem;
        padding: 0.7rem 0.8rem;
        border-radius: var(--kit-radius-md);
        cursor: pointer;
      }

      .slash-menu-option[data-active="true"] {
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 10%,
          var(--kit-surface-secondary)
        );
      }

      .slash-menu-option-label {
        font-size: var(--kit-font-size-sm);
        font-weight: 600;
      }

      .slash-menu-option-description {
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
      }

      .slash-menu-empty {
        padding: var(--kit-space-md);
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }
    `,
    ]; }
    updated(changedProperties) {
        if (changedProperties.has("editor")) {
            this.bindEditor();
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.unbindEditor();
    }
    renderContent() {
        const activeItem = this.getActiveItem();
        const placement = this.menuState.placement ?? { left: 0, top: 0 };
        const filteredCount = this.menuItems.length;
        return html `
      <div
        class="slash-menu"
        ?hidden=${!this.menuState.open}
        role="listbox"
        aria-label="Insert card menu"
        aria-activedescendant=${activeItem
            ? this.optionIdFor(activeItem.type)
            : ""}
        style=${`left: ${placement.left}px; top: ${placement.top}px;`}
      >
        <header class="slash-menu-header">
          <p class="slash-menu-title">Insert card</p>
          <p class="slash-menu-query">
            ${this.menuState.query.length > 0
            ? `/${this.menuState.query}`
            : "/"}
            ${filteredCount > 0
            ? ` · ${filteredCount} result${filteredCount === 1 ? "" : "s"}`
            : ""}
          </p>
        </header>

        ${filteredCount > 0
            ? html `
              <ul class="slash-menu-list">
                ${this.menuItems.map((item, index) => this.renderMenuItem(item, index))}
              </ul>
            `
            : html `<div class="slash-menu-empty">
              No cards match “${this.menuState.query}”.
            </div>`}
      </div>
    `;
    }
    renderMenuItem(item, index) {
        const active = index === this.menuState.activeIndex;
        return html `
      <li>
        <button
          id=${this.optionIdFor(item.type)}
          class="slash-menu-option"
          data-active=${active ? "true" : "false"}
          aria-selected=${active ? "true" : "false"}
          type="button"
          @click=${() => this.selectMenuItem(item)}
        >
          <span class="slash-menu-option-label">${item.label}</span>
          <span class="slash-menu-option-description">${item.description}</span>
        </button>
      </li>
    `;
    }
    bindEditor() {
        this.unbindEditor();
        if (this.editor === null) {
            this.resetMenu();
            return;
        }
        this.rootDisposer = this.editor.registerRootListener((rootElement) => {
            if (this.rootElement !== null && this.rootKeyDownListener !== null) {
                this.rootElement.removeEventListener("keydown", this.rootKeyDownListener);
            }
            this.rootElement = rootElement;
            if (rootElement === null) {
                this.resetMenu();
                return;
            }
            this.rootKeyDownListener = this.handleRootKeyDown;
            rootElement.addEventListener("keydown", this.rootKeyDownListener);
        });
    }
    unbindEditor() {
        if (this.rootElement !== null && this.rootKeyDownListener !== null) {
            this.rootElement.removeEventListener("keydown", this.rootKeyDownListener);
        }
        this.rootKeyDownListener = null;
        this.rootElement = null;
        this.rootDisposer?.();
        this.rootDisposer = null;
    }
    openMenu() {
        this.menuState = {
            open: true,
            query: "",
            activeIndex: 0,
            placement: this.resolvePlacement(),
        };
        this.menuItems = filterSlashMenuItems(publishingCardRegistry.kgMenu(), "");
    }
    closeMenu() {
        this.menuState = EMPTY_SLASH_MENU_STATE;
        this.menuItems = [];
    }
    resetMenu() {
        this.menuState = EMPTY_SLASH_MENU_STATE;
        this.menuItems = [];
    }
    updateQuery(query) {
        const normalizedQuery = normalizeSlashMenuQuery(query);
        this.menuItems = filterSlashMenuItems(publishingCardRegistry.kgMenu(), normalizedQuery);
        this.menuState = {
            ...this.menuState,
            open: true,
            query: normalizedQuery,
            activeIndex: this.menuItems.length === 0
                ? 0
                : Math.min(this.menuState.activeIndex, this.menuItems.length - 1),
            placement: this.resolvePlacement(),
        };
    }
    moveActive(delta) {
        if (this.menuItems.length === 0) {
            return;
        }
        const nextIndex = (this.menuState.activeIndex + delta + this.menuItems.length) %
            this.menuItems.length;
        this.menuState = { ...this.menuState, activeIndex: nextIndex };
    }
    confirmActiveItem() {
        const item = this.getActiveItem();
        if (!item) {
            return;
        }
        this.selectMenuItem(item);
    }
    selectMenuItem(item) {
        this.editor?.dispatchCommand(INSERT_CARD_COMMAND, {
            type: item.type,
            data: {},
            position: "replace",
        });
        this.closeMenu();
    }
    getActiveItem() {
        return this.menuItems[this.menuState.activeIndex] ?? null;
    }
    resolvePlacement() {
        const selection = window.getSelection();
        if (selection !== null && selection.rangeCount > 0) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                return { left: rect.left, top: rect.bottom + 8 };
            }
        }
        const rootRect = this.rootElement?.getBoundingClientRect();
        if (rootRect !== undefined && rootRect !== null) {
            return { left: rootRect.left, top: rootRect.bottom + 8 };
        }
        return { left: 0, top: 0 };
    }
    optionIdFor(type) {
        return `slash-menu-option-${type}`;
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingSlashMenuPlugin.prototype, "editor", void 0);
__decorate([
    state()
], KitPublishingSlashMenuPlugin.prototype, "menuState", void 0);
__decorate([
    state()
], KitPublishingSlashMenuPlugin.prototype, "menuItems", void 0);
KitPublishingSlashMenuPlugin = __decorate([
    customElement("kit-publishing-slash-menu-plugin")
], KitPublishingSlashMenuPlugin);
export { KitPublishingSlashMenuPlugin };
export function normalizeSlashMenuQuery(query) {
    return query.replace(/[^\w-]/gu, "").toLowerCase();
}
export function filterSlashMenuItems(items, query) {
    const normalizedQuery = normalizeSlashMenuQuery(query);
    if (normalizedQuery.length === 0) {
        return items;
    }
    return items.filter((item) => {
        const haystack = `${item.type} ${item.label} ${item.description}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });
}
