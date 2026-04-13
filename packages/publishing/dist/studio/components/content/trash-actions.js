/**
 * Trash/archive actions for publishing content.
 *
 * @module @citadelfoundation/kit-publishing/studio/components/content/trash-actions
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import "@citadelfoundation/kit-ui/components/dialog";
import "@citadelfoundation/kit-ui/components/select";
import "@citadelfoundation/kit-ui/components/tabs";
import { PublishingElement, publishingTheme } from "../../../internal/ui.js";
const trashViewOptions = [
    { value: "active", label: "Active" },
    { value: "archive", label: "Archive" },
    { value: "trash", label: "Trash" },
];
const trashKindFilterOptions = [
    { value: "all", label: "All content" },
    { value: "post", label: "Posts" },
    { value: "page", label: "Pages" },
    { value: "doc_page", label: "Docs" },
];
let KitPublishingTrashActions = class KitPublishingTrashActions extends PublishingElement {
    constructor() {
        super(...arguments);
        this.items = [];
        this.view = "active";
        this.kindFilter = "all";
        this.confirmationState = null;
        this.handleViewChange = (event) => {
            const detail = event.detail;
            const nextView = trashViewOptions[detail.currentIndex ?? 0]?.value ?? "active";
            this.view = nextView;
        };
        this.handleKindFilterChange = (event) => {
            const detail = event.detail;
            this.kindFilter = detail.value ?? "all";
        };
        this.closeConfirmation = () => {
            this.confirmationState = null;
        };
        this.confirmAction = () => {
            const state = this.confirmationState;
            if (!state) {
                return;
            }
            this.dispatchEvent(new CustomEvent("publishing-trash-action", {
                detail: {
                    action: state.action,
                    item: state.item,
                    nextStatus: nextStatusForTrashAction(state.action, state.item),
                    view: this.view,
                },
                bubbles: true,
                composed: true,
            }));
            this.closeConfirmation();
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .trash-actions-shell {
        display: grid;
        gap: var(--kit-space-lg);
      }

      .trash-actions-header {
        display: grid;
        gap: var(--kit-space-md);
      }

      .trash-actions-title {
        margin: 0;
        font-size: var(--kit-font-size-xl);
        font-weight: 700;
      }

      .trash-actions-subtitle {
        margin: 0;
        color: var(--kit-text-secondary);
      }

      .trash-actions-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-md);
        align-items: end;
      }

      .trash-actions-filter {
        min-width: 220px;
      }

      .trash-actions-list {
        display: grid;
        gap: var(--kit-space-md);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .trash-actions-item {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-md);
        border: 1px solid var(--kit-border-primary);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-surface-primary);
      }

      .trash-actions-item-header {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-sm);
        align-items: center;
        justify-content: space-between;
      }

      .trash-actions-item-title {
        margin: 0;
        font-weight: 600;
      }

      .trash-actions-item-meta {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .trash-actions-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-sm);
      }

      .trash-actions-empty {
        padding: var(--kit-space-lg);
        border: 1px dashed var(--kit-border-primary);
        border-radius: var(--kit-radius-lg);
        color: var(--kit-text-secondary);
      }
    `,
    ]; }
    renderContent() {
        const visibleItems = this.getVisibleItems();
        const emptyStateLabel = this.view === "trash"
            ? "trashed"
            : this.view === "archive"
                ? "archived"
                : "active";
        return html `
      <section
        class="trash-actions-shell"
        aria-label="Trash and archive actions"
      >
        <header class="trash-actions-header">
          <div>
            <h2 class="trash-actions-title">Trash and archive</h2>
            <p class="trash-actions-subtitle">
              Move content out of circulation, restore it later, or delete it
              permanently.
            </p>
          </div>

          <kit-tabs
            aria-label="Content lifecycle views"
            .selected=${this.getViewIndex()}
            @tab-change=${this.handleViewChange}
          >
            ${trashViewOptions.map((option) => html `<kit-tab slot="tab">${option.label}</kit-tab>`)}
          </kit-tabs>

          <div class="trash-actions-toolbar">
            <kit-select
              class="trash-actions-filter"
              label="Filter by content type"
              .options=${trashKindFilterOptions}
              .value=${this.kindFilter}
              @change=${this.handleKindFilterChange}
            ></kit-select>
          </div>
        </header>

        ${visibleItems.length > 0
            ? html `
              <ul class="trash-actions-list">
                ${repeat(visibleItems, (item) => item.id, (item) => this.renderItemRow(item))}
              </ul>
            `
            : html `
              <div class="trash-actions-empty">
                ${`No ${emptyStateLabel} content matches the current filter.`}
              </div>
            `}

        <kit-dialog
          ?open=${this.confirmationState !== null}
          title=${this.confirmationTitle()}
          size="sm"
        >
          ${this.confirmationState ? this.renderConfirmationDialog() : null}
        </kit-dialog>
      </section>
    `;
    }
    renderItemRow(item) {
        return html `
      <li class="trash-actions-item">
        <div class="trash-actions-item-header">
          <div>
            <p class="trash-actions-item-title">${item.title}</p>
            <p class="trash-actions-item-meta">${item.kind} · ${item.status}</p>
          </div>
          <span class="entry-badge collection-status" data-tone=${item.status}>
            ${item.status.toUpperCase()}
          </span>
        </div>

        <div class="trash-actions-buttons">
          ${this.renderActionButton("archive", item)}
          ${this.renderActionButton("trash", item)}
          ${this.renderActionButton("restore", item)}
          ${this.renderActionButton("delete", item)}
        </div>
      </li>
    `;
    }
    renderActionButton(action, item) {
        if (!this.isActionAvailable(action, item)) {
            return null;
        }
        return html `
      <button
        class="action-button"
        data-action=${action}
        type="button"
        @click=${() => this.openConfirmation(action, item)}
      >
        ${labelForTrashAction(action)}
      </button>
    `;
    }
    renderConfirmationDialog() {
        const state = this.confirmationState;
        if (!state) {
            return html ``;
        }
        return html `
      <div class="trash-actions-dialog">
        <p>${confirmationBodyForTrashAction(state.action, state.item)}</p>
        <div class="dialog-footer">
          <button
            class="action-button"
            type="button"
            @click=${this.closeConfirmation}
          >
            Cancel
          </button>
          <button
            class="action-button"
            data-variant="danger"
            type="button"
            @click=${this.confirmAction}
          >
            ${labelForTrashAction(state.action)}
          </button>
        </div>
      </div>
    `;
    }
    confirmationTitle() {
        const state = this.confirmationState;
        if (!state) {
            return "Confirm content action";
        }
        return `${labelForTrashAction(state.action)} ${state.item.title}`;
    }
    getViewIndex() {
        return trashViewOptions.findIndex((option) => option.value === this.view);
    }
    getVisibleItems() {
        return this.items.filter((item) => {
            if (!this.matchesView(item)) {
                return false;
            }
            return this.kindFilter === "all" || item.kind === this.kindFilter;
        });
    }
    matchesView(item) {
        if (this.view === "archive") {
            return item.status === "archived";
        }
        if (this.view === "trash") {
            return item.status === "trashed";
        }
        return item.status === "draft" || item.status === "published";
    }
    isActionAvailable(action, item) {
        if (action === "delete") {
            return item.status === "trashed" || item.status === "archived";
        }
        if (action === "restore") {
            return item.status === "archived" || item.status === "trashed";
        }
        if (action === "archive") {
            return (item.status === "draft" ||
                item.status === "published" ||
                item.status === "trashed");
        }
        return (item.status === "draft" ||
            item.status === "published" ||
            item.status === "archived");
    }
    openConfirmation(action, item) {
        this.confirmationState = { action, item };
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingTrashActions.prototype, "items", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingTrashActions.prototype, "view", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingTrashActions.prototype, "kindFilter", void 0);
__decorate([
    state()
], KitPublishingTrashActions.prototype, "confirmationState", void 0);
KitPublishingTrashActions = __decorate([
    customElement("kit-publishing-trash-actions")
], KitPublishingTrashActions);
export { KitPublishingTrashActions };
export function labelForTrashAction(action) {
    switch (action) {
        case "trash":
            return "Move to trash";
        case "archive":
            return "Archive";
        case "restore":
            return "Restore";
        case "delete":
            return "Delete permanently";
    }
}
export function nextStatusForTrashAction(action, item) {
    switch (action) {
        case "trash":
            return "trashed";
        case "archive":
            return "archived";
        case "restore":
            return item.restoreStatus ?? "draft";
        case "delete":
            return null;
    }
}
export function confirmationBodyForTrashAction(action, item) {
    switch (action) {
        case "trash":
            return `Move ${item.title} to trash so it can be restored later.`;
        case "archive":
            return `Archive ${item.title} to unpublish it while keeping the document.`;
        case "restore":
            return `Restore ${item.title} back into the active content list.`;
        case "delete":
            return `Permanently delete ${item.title}. This cannot be undone.`;
    }
}
