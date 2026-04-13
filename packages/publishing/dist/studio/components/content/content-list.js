var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../internal/ui.js";
let KitPublishingContentList = class KitPublishingContentList extends PublishingElement {
    constructor() {
        super(...arguments);
        this.entries = [];
        this.emptyState = null;
        this.onEditEntry = null;
        this.onPreviewEntry = null;
        this.onDuplicateEntry = null;
        this.canEditEntry = null;
        this.canPreviewEntry = null;
        this.canDuplicateEntry = null;
        this.busy = false;
        this.caption = "Content list";
        this.selectedRoute = "";
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .content-list {
        display: block;
      }

      .content-list-empty {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-xl, 2rem) var(--kit-space-lg);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 76%, transparent);
        border-radius: var(--kit-radius-lg);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 64%,
          transparent
        );
      }

      .content-list-empty-title {
        margin: 0;
        font-size: var(--kit-font-size-lg, 1.05rem);
        font-weight: 650;
        color: var(--kit-text-primary);
      }

      .content-list-empty-copy {
        margin: 0;
        color: var(--kit-text-secondary);
      }

      .content-list-empty-action {
        justify-self: start;
      }

      .content-list-table {
        width: 100%;
      }

      .collection-table {
        display: grid;
        gap: 0;
        padding: 0.35rem 0;
      }

      .collection-table-head,
      .collection-row-shell {
        display: grid;
        grid-template-columns: minmax(0, 2.8fr) 0.9fr 1fr 1fr 1.2fr;
        gap: var(--kit-space-sm);
        align-items: center;
      }

      .collection-table-head {
        padding: 0 0 0.7rem;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-xs);
        font-weight: 650;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border-bottom: 1px solid var(--kit-editorial-chrome-border);
      }

      .collection-row-shell {
        position: relative;
        padding: 1rem 0.2rem;
        border: 0;
        border-bottom: 1px solid var(--kit-editorial-chrome-border);
        border-radius: 0;
        background: transparent;
        transition:
          background 140ms ease,
          border-color 140ms ease;
      }

      .collection-row-shell[data-clickable="true"] {
        cursor: pointer;
      }

      .collection-row-shell[data-clickable="true"]:hover {
        background: var(--kit-editorial-hover-surface);
      }

      .collection-row-shell[data-clickable="true"]:focus-visible {
        outline: 2px solid
          color-mix(in srgb, var(--kit-color-primary) 28%, transparent);
        outline-offset: -4px;
      }

      .collection-row-shell[data-selected="true"] {
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 5%,
          var(--kit-surface-primary)
        );
        border-bottom-color: color-mix(
          in srgb,
          var(--kit-color-primary) 20%,
          transparent
        );
      }

      .collection-row-shell[data-selected="true"]::before {
        content: "";
        position: absolute;
        inset: 0 auto 0 -0.35rem;
        width: 0.18rem;
        border-radius: var(--kit-radius-full);
        background: var(--kit-color-primary);
      }

      .collection-row-status,
      .collection-row-author-cell,
      .collection-row-date-cell {
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-sm);
      }

      .collection-row-primary {
        display: grid;
        gap: 0.45rem;
      }

      .collection-row-title {
        display: block;
        font-size: 1rem;
        font-weight: 650;
        color: var(--kit-text-primary);
        letter-spacing: -0.01em;
      }

      .collection-row-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-xs);
      }

      .collection-row-meta-copy {
        color: inherit;
      }

      .collection-row-primary-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.18rem 0.52rem;
        border-radius: var(--kit-radius-full);
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 14%,
          var(--kit-surface-primary)
        );
        color: var(--kit-text-primary);
        font-weight: 600;
      }

      .collection-row-author-avatar-image,
      .collection-row-author-avatar-fallback {
        inline-size: 1.5rem;
        block-size: 1.5rem;
        border-radius: 999px;
      }

      .collection-row-author-avatar-image {
        object-fit: cover;
      }

      .collection-row-author-avatar-fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 78%,
          transparent
        );
        color: var(--kit-text-primary);
        font-size: 0.72rem;
        font-weight: 700;
      }

      .content-list-status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.2rem 0.56rem;
        border-radius: var(--kit-radius-full);
        font-size: var(--kit-font-size-xs);
        font-weight: 650;
        letter-spacing: 0.03em;
        text-transform: capitalize;
      }

      .content-list-status-badge[data-tone="draft"] {
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 82%,
          transparent
        );
        color: var(--kit-text-secondary);
      }

      .content-list-status-badge[data-tone="published"] {
        background: color-mix(in srgb, #10b981 18%, var(--kit-surface-primary));
        color: #047857;
      }

      .content-list-status-badge[data-tone="scheduled"] {
        background: color-mix(in srgb, #f59e0b 18%, var(--kit-surface-primary));
        color: #b45309;
      }

      .content-list-actions {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--kit-space-xs);
        justify-content: flex-end;
      }

      .collection-row-trailing {
        display: inline-flex;
        justify-content: flex-end;
        inline-size: 100%;
      }

      .collection-row-trailing-actions {
        display: inline-flex;
        flex-wrap: wrap;
        gap: var(--kit-space-xs);
      }

      .content-list-action-button {
        appearance: none;
        border: 1px solid
          color-mix(
            in srgb,
            var(--kit-editorial-chrome-border) 100%,
            transparent
          );
        border-radius: var(--kit-radius-md);
        padding: 0.34rem 0.62rem;
        background: color-mix(
          in srgb,
          var(--kit-editorial-chrome-surface) 96%,
          transparent
        );
        color: var(--kit-editorial-muted-text);
        font: inherit;
        font-size: var(--kit-font-size-xs);
        font-weight: 600;
        cursor: pointer;
        transition:
          opacity 140ms ease,
          color 140ms ease,
          border-color 140ms ease,
          background 140ms ease;
      }

      .content-list-action-button:hover:enabled,
      .content-list-action-button:focus-visible {
        color: var(--kit-text-primary);
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 28%,
          transparent
        );
      }

      .content-list-action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (pointer: fine) {
        .collection-row-trailing-actions {
          opacity: 0.52;
          transition: opacity 140ms ease;
        }

        .collection-row-shell:hover .collection-row-trailing-actions,
        .collection-row-shell:focus-within .collection-row-trailing-actions,
        .collection-row-shell[data-selected="true"]
          .collection-row-trailing-actions {
          opacity: 1;
        }
      }

      @media (max-width: 980px) {
        .collection-table-head {
          display: none;
        }

        .collection-row-shell {
          grid-template-columns: minmax(0, 1fr);
          gap: 0.7rem;
          padding: 0.95rem 0;
        }

        .collection-row-status,
        .collection-row-author-cell,
        .collection-row-date-cell {
          font-size: var(--kit-font-size-xs);
        }

        .collection-row-trailing {
          justify-content: flex-start;
        }

        .content-list-actions {
          justify-content: flex-start;
        }
      }
    `,
    ]; }
    renderContent() {
        if (this.entries.length === 0) {
            return this.renderEmptyState();
        }
        return html `
      <div class="content-list">
        <div
          class="collection-table content-list-table"
          aria-label=${this.caption}
        >
          <div class="collection-table-head" aria-hidden="true">
            <span>Title</span>
            <span>Status</span>
            <span>Author</span>
            <span>Date</span>
            <span>Actions</span>
          </div>
          ${this.rows.map((row, index) => {
            const canEditRow = this.onEditEntry !== null;
            const isSelected = row.entry.route === this.selectedRoute;
            return html `
              <div
                class="collection-row collection-row-shell"
                data-clickable=${canEditRow ? "true" : "false"}
                data-kind=${row.entry.kind}
                data-route=${row.entry.route}
                data-selected=${isSelected ? "true" : "false"}
                aria-current=${isSelected ? "page" : "false"}
                tabindex=${canEditRow ? "0" : "-1"}
                @click=${() => this.handleRowClick(row, index)}
                @keydown=${(event) => this.handleRowKeyDown(event, row, index)}
              >
                <div>
                  ${renderPublishingContentListTitleCell(row.entry, row.title)}
                </div>
                <div class="collection-row-status">
                  ${this.renderStatusBadge(row.status)}
                </div>
                <div class="collection-row-author-cell">
                  ${row.author || "—"}
                </div>
                <div class="collection-row-date-cell">
                  ${this.renderDateLabel(row.publishedAt, row.status)}
                </div>
                <div>${this.renderActions(row.entry)}</div>
              </div>
            `;
        })}
        </div>
      </div>
    `;
    }
    get rows() {
        return createPublishingContentListRows(this.entries);
    }
    renderEmptyState() {
        if (this.emptyState === null) {
            return nothing;
        }
        return renderPublishingContentListEmptyState(this.emptyState);
    }
    handleRowClick(rowOrEvent, _index) {
        const row = "detail" in rowOrEvent ? rowOrEvent.detail.row : rowOrEvent;
        if (this.busy || !this.onEditEntry) {
            return;
        }
        this.onEditEntry(row.entry);
    }
    handleRowKeyDown(event, row, index) {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }
        event.preventDefault();
        this.handleRowClick(row, index);
    }
    renderStatusBadge(status) {
        return renderPublishingContentListStatusBadge(status);
    }
    renderDateLabel(value, status) {
        if (value.trim().length === 0) {
            return status === "draft" ? "Draft" : "—";
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
    }
    renderActions(entry) {
        const buttons = [];
        if (this.onPreviewEntry && (this.canPreviewEntry?.(entry) ?? true)) {
            buttons.push(html `
        <button
          class="content-list-action-button"
          data-row-action="preview"
          type="button"
          ?disabled=${this.busy}
          @click=${(event) => {
                event.stopPropagation();
                this.onPreviewEntry?.(entry);
            }}
        >
          Preview
        </button>
      `);
        }
        if (this.onEditEntry && (this.canEditEntry?.(entry) ?? true)) {
            buttons.push(html `
        <button
          class="content-list-action-button"
          data-row-action="edit"
          type="button"
          ?disabled=${this.busy}
          @click=${(event) => {
                event.stopPropagation();
                this.onEditEntry?.(entry);
            }}
        >
          Edit
        </button>
      `);
        }
        if (this.onDuplicateEntry && (this.canDuplicateEntry?.(entry) ?? true)) {
            buttons.push(html `
        <button
          class="content-list-action-button"
          data-row-action="duplicate"
          type="button"
          ?disabled=${this.busy}
          @click=${(event) => {
                event.stopPropagation();
                this.onDuplicateEntry?.(entry);
            }}
        >
          Duplicate
        </button>
      `);
        }
        return html `
      <span class="collection-row-trailing">
        <span
          class="collection-row-trailing-actions content-list-actions"
          data-kind=${entry.kind}
          data-route=${entry.route}
        >
          ${buttons}
        </span>
      </span>
    `;
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "entries", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "emptyState", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "onEditEntry", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "onPreviewEntry", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "onDuplicateEntry", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "canEditEntry", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "canPreviewEntry", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingContentList.prototype, "canDuplicateEntry", void 0);
__decorate([
    property({ type: Boolean })
], KitPublishingContentList.prototype, "busy", void 0);
__decorate([
    property({ attribute: "caption" })
], KitPublishingContentList.prototype, "caption", void 0);
__decorate([
    property({ attribute: "selected-route" })
], KitPublishingContentList.prototype, "selectedRoute", void 0);
KitPublishingContentList = __decorate([
    customElement("kit-publishing-content-list")
], KitPublishingContentList);
export { KitPublishingContentList };
function normalizeLabel(value) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : "—";
}
function statusForEntry(entry) {
    if (entry.status === "draft") {
        return "draft";
    }
    if (entry.publishedAt) {
        const publishedAt = new Date(entry.publishedAt).getTime();
        if (Number.isFinite(publishedAt) && publishedAt > Date.now()) {
            return "scheduled";
        }
    }
    return "published";
}
export function createPublishingContentListRows(entries) {
    return entries.map((entry) => ({
        entry,
        title: entry.title,
        status: statusForEntry(entry),
        author: normalizeLabel(entry.authorName),
        publishedAt: entry.publishedAt ?? "",
    }));
}
export function createPublishingContentListColumns(handlers) {
    return [
        {
            key: "title",
            label: "Title",
            sortable: true,
            render: (value, row) => html `
        <div
          class="collection-row-primary"
          data-kind=${row.entry.kind}
          data-route=${row.entry.route}
        >
          <span class="collection-row-title content-list-title">${value}</span>
          <span class="collection-row-meta">
            ${renderPublishingContentListAuthorCue(row.entry)}
            <span class="collection-row-meta-copy"
              >${formatPublishingContentListMeta(row.entry)}</span
            >
            ${renderPublishingContentListPrimaryTag(row.entry)}
          </span>
          ${row.entry.route !== ""
                ? html `<span class="content-list-route" aria-hidden="true"
                >${row.entry.route}</span
              >`
                : null}
        </div>
      `,
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (value) => handlers.renderStatusBadge(value),
        },
        {
            key: "author",
            label: "Author",
            sortable: true,
            render: (value) => html `<span>${value || "—"}</span>`,
        },
        {
            key: "publishedAt",
            label: "Date",
            sortable: true,
            render: (value, row) => html `<span>${handlers.renderDateLabel(value, row.status)}</span>`,
        },
        {
            key: "entry",
            label: "Actions",
            render: (_value, row) => handlers.renderActions(row.entry),
        },
    ];
}
function renderPublishingContentListAuthorCue(entry) {
    const authorName = normalizePublishingContentListAuthor(entry.authorName);
    if (!authorName) {
        return nothing;
    }
    if (typeof entry.authorAvatarUrl === "string" &&
        entry.authorAvatarUrl !== "") {
        return html `
      <img
        alt=""
        class="collection-row-author-avatar-image"
        src=${entry.authorAvatarUrl}
      />
    `;
    }
    return html `
    <span class="collection-row-author-avatar-fallback" aria-hidden="true">
      ${initialsForPublishingContentListLabel(authorName)}
    </span>
  `;
}
function renderPublishingContentListTitleCell(entry, title) {
    return html `
    <div
      class="collection-row-primary"
      data-kind=${entry.kind}
      data-route=${entry.route}
    >
      <span class="collection-row-title content-list-title">${title}</span>
      <span class="collection-row-meta">
        ${renderPublishingContentListAuthorCue(entry)}
        <span class="collection-row-meta-copy"
          >${formatPublishingContentListMeta(entry)}</span
        >
        ${renderPublishingContentListPrimaryTag(entry)}
      </span>
      ${entry.route !== ""
        ? html `<span class="content-list-route" aria-hidden="true"
            >${entry.route}</span
          >`
        : null}
    </div>
  `;
}
function renderPublishingContentListPrimaryTag(entry) {
    const primaryTag = normalizePublishingContentListTag(entry.tags?.[0]);
    if (!primaryTag) {
        return nothing;
    }
    return html ` <span class="collection-row-primary-tag">${primaryTag}</span> `;
}
function formatPublishingContentListMeta(entry) {
    const metadata = [labelForPublishingContentListAccess(entry.access)];
    const authorName = normalizePublishingContentListAuthor(entry.authorName);
    if (authorName) {
        metadata.push(`By ${authorName}`);
    }
    if (entry.kind === "doc_page" && entry.sectionTitle) {
        metadata.push(entry.sectionTitle);
    }
    metadata.push(entry.publishedAt
        ? formatPublishingContentListDate(entry.publishedAt)
        : entry.status === "published"
            ? "Published"
            : "Draft");
    return metadata.join(" • ");
}
function formatPublishingContentListDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}
function labelForPublishingContentListAccess(value) {
    switch (value) {
        case "public":
            return "Public access";
        case "members":
            return "Members only";
        case "paid_members":
            return "Paid members only";
    }
}
function normalizePublishingContentListAuthor(value) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
}
function normalizePublishingContentListTag(value) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
}
function initialsForPublishingContentListLabel(value) {
    return value
        .split(/\s+/u)
        .filter((part) => part.length > 0)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}
export function renderPublishingContentListEmptyState(emptyState) {
    return html `
    <section
      class="content-list-empty"
      data-empty-kind=${emptyState.kind}
      data-parity-region="collection-empty-state"
    >
      <h2 class="content-list-empty-title">${emptyState.title}</h2>
      <p class="content-list-empty-copy">${emptyState.message}</p>
      ${emptyState.actionLabel && emptyState.onAction
        ? html `
            <button
              class="content-list-action-button content-list-empty-action"
              data-empty-action="clear-filters"
              data-variant="quiet"
              type="button"
              @click=${emptyState.onAction}
            >
              ${emptyState.actionLabel}
            </button>
          `
        : null}
    </section>
  `;
}
function labelForStatus(status) {
    switch (status) {
        case "draft":
            return "Draft";
        case "published":
            return "Published";
        case "scheduled":
            return "Scheduled";
    }
}
export function labelForPublishingContentListStatus(status) {
    return labelForStatus(status);
}
export function renderPublishingContentListStatusBadge(status) {
    return html `
    <span class="content-list-status-badge" data-tone=${status}>
      ${labelForPublishingContentListStatus(status)}
    </span>
  `;
}
