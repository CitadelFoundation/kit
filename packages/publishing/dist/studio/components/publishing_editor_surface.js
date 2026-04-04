/**
 * Native editor boundary for publishing drafts.
 *
 * @module @citadelfoundation/kit-publishing/studio/components/publishing_editor_surface
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { PublishingElement, publishingTheme, } from "../../internal/ui.js";
import { createPublishingTiptapEditorAdapter, } from "../editor_adapter.js";
let KitPublishingEditorSurface = class KitPublishingEditorSurface extends PublishingElement {
    constructor() {
        super(...arguments);
        this.adapter = createPublishingTiptapEditorAdapter();
        this.value = "";
        this.placeholder = "Start drafting...";
        this.editorLabel = "Publishing document editor";
        this.editorTestId = "publishing-document-editor";
        this.readOnly = false;
        this.dirty = false;
        this.editorState = {
            metrics: {
                characters: 0,
                lines: 1,
                words: 0,
            },
            canUndo: false,
            canRedo: false,
            commandStates: {},
        };
        this.showAdapterAnalysis = false;
        this.insertPaletteOpen = false;
        this.insertQuery = "";
        this.editorHandle = null;
        this.pendingLinkResolver = null;
        this.linkComposerOpen = false;
        this.linkComposerHref = "";
        this.linkComposerSelection = "";
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .editor-shell {
        display: grid;
        gap: 0.75rem;
        min-height: 36rem;
        padding: 0;
      }

      .editor-topbar {
        display: grid;
        gap: 0.75rem;
      }

      .editor-empty-prompt {
        margin: 0;
        color: color-mix(in srgb, var(--kit-text-secondary) 76%, transparent);
        font-size: 1rem;
        line-height: 1.5;
      }

      .editor-meta {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
        line-height: 1.45;
      }

      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        white-space: nowrap;
      }

      .editor-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem 1rem;
      }

      .meta-save-state[data-state="unsaved"] {
        color: color-mix(in srgb, var(--kit-text-primary) 86%, transparent);
        font-weight: 600;
      }

      .meta-save-state[data-state="read-only"] {
        color: color-mix(in srgb, var(--kit-text-secondary) 88%, transparent);
      }

      .editor-inline-controls {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.2rem;
      }

      .editor-inline-button {
        appearance: none;
        border: 0;
        border-radius: var(--kit-radius-md);
        padding: 0.24rem 0.36rem;
        color: color-mix(in srgb, var(--kit-text-secondary) 92%, transparent);
        background: transparent;
        font: inherit;
        font-weight: 500;
        cursor: pointer;
        transition:
          color 120ms ease,
          background 120ms ease;
      }

      .editor-inline-button:hover:enabled {
        color: var(--kit-text-primary);
        background: color-mix(in srgb, var(--kit-surface-secondary) 82%, transparent);
      }

      .editor-inline-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .editor-inline-button[data-active="true"] {
        color: var(--kit-text-primary);
        background: color-mix(in srgb, var(--kit-surface-secondary) 92%, transparent);
      }

      .composer-button {
        appearance: none;
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        padding: 0.4rem 0.65rem;
        color: var(--kit-text-primary);
        background: var(--kit-surface-primary);
        font: inherit;
        font-weight: 500;
        cursor: pointer;
        transition:
          border-color 120ms ease,
          background 120ms ease;
      }

      .composer-button:hover:enabled {
        border-color: color-mix(in srgb, var(--kit-color-primary) 34%, transparent);
        background: color-mix(in srgb, var(--kit-color-primary) 10%, var(--kit-surface-primary));
      }

      .insert-palette {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-sm);
        border-radius: var(--kit-radius-md);
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(in srgb, var(--kit-surface-secondary) 92%, transparent);
      }

      .insert-palette-search {
        width: 100%;
        padding: 0.7rem 0.8rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
      }

      .insert-palette-grid {
        display: grid;
        gap: var(--kit-space-xs);
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      }

      .insert-palette-button {
        appearance: none;
        display: grid;
        gap: 0.2rem;
        text-align: left;
        padding: 0.75rem 0.8rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
        cursor: pointer;
      }

      .insert-palette-button:hover {
        border-color: color-mix(in srgb, var(--kit-color-primary) 32%, transparent);
        background: color-mix(in srgb, var(--kit-color-primary) 8%, var(--kit-surface-primary));
      }

      .insert-palette-button strong {
        font-size: var(--kit-font-size-sm);
      }

      .insert-palette-empty {
        margin: 0;
        color: var(--kit-text-secondary);
      }

      .link-composer {
        display: grid;
        gap: 0.75rem;
        padding: 0.9rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(in srgb, var(--kit-surface-secondary) 90%, transparent);
      }

      .link-composer-header {
        display: grid;
        gap: 0.25rem;
      }

      .link-composer-title,
      .link-composer-copy {
        margin: 0;
      }

      .link-composer-copy {
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .link-composer-label {
        display: grid;
        gap: 0.35rem;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .link-composer-input {
        width: 100%;
        padding: 0.72rem 0.8rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
      }

      .link-composer-actions {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.55rem;
      }

      .adapter-analysis {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-sm);
        border-radius: var(--kit-radius-md);
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(in srgb, var(--kit-surface-secondary) 92%, transparent);
      }

      .analysis-summary {
        margin: 0;
        color: var(--kit-text-secondary);
      }

      .analysis-pills,
      .analysis-notes {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-xs);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .analysis-pill,
      .analysis-note {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.55rem;
        border-radius: var(--kit-radius-full);
        border: 1px solid color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(in srgb, var(--kit-surface-primary) 92%, transparent);
        font-size: var(--kit-font-size-xs);
      }

      .analysis-pill[data-verdict="winner"] {
        border-color: color-mix(in srgb, #16a34a 30%, transparent);
        background: color-mix(in srgb, #16a34a 12%, var(--kit-surface-primary));
      }

      .analysis-pill[data-verdict="reference-only"] {
        border-color: color-mix(in srgb, #f59e0b 30%, transparent);
        background: color-mix(in srgb, #f59e0b 12%, var(--kit-surface-primary));
      }

      .editor-host {
        min-height: 24rem;
      }

      .editor-shell[data-empty="true"] .editor-host {
        min-height: 31rem;
      }

      .editor-host :is(textarea, .publishing-textarea-adapter, trix-editor) {
        width: 100%;
        min-height: 24rem;
        resize: vertical;
        padding: 0 0 0.35rem;
        color: var(--kit-text-primary);
        background: transparent;
        border: 0;
        border-radius: 0;
        font:
          400
          1.0625rem / 1.647
          var(--kit-font-family-sans, "IBM Plex Sans", Inter, system-ui, sans-serif);
        letter-spacing: 0.004em;
        box-shadow: none;
      }

      .editor-shell[data-empty="true"] .editor-host :is(
          textarea,
          .publishing-textarea-adapter,
          trix-editor
        ) {
        min-height: 31rem;
        padding-top: 0;
      }

      .editor-host textarea::placeholder {
        color: color-mix(in srgb, var(--kit-text-secondary) 78%, transparent);
        opacity: 1;
      }

      .editor-host textarea:focus-visible,
      .editor-host trix-editor:focus-visible,
      .editor-host .publishing-rich-editor__content:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--kit-color-primary) 42%, transparent);
        outline-offset: 2px;
      }

      .editor-host .publishing-rich-editor {
        min-height: 24rem;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

      .editor-shell[data-empty="true"] .editor-host .publishing-rich-editor,
      .editor-shell[data-empty="true"] .editor-host .publishing-rich-editor__content {
        min-height: 31rem;
        padding-top: 0;
      }

      .editor-host .publishing-rich-editor__content,
      .editor-host trix-editor {
        min-height: 24rem;
        padding: 0 0 0.35rem;
        color: var(--kit-text-primary);
        font:
          400
          1.0625rem / 1.647
          var(--kit-font-family-sans, "IBM Plex Sans", Inter, system-ui, sans-serif);
        letter-spacing: 0.004em;
      }

      .editor-host .publishing-rich-editor__content > :first-child,
      .editor-host trix-editor > :first-child {
        margin-top: 0;
      }

      .editor-host .publishing-rich-editor__content h1 {
        font-size: 2.75rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.1;
        margin: 1.5rem 0 1rem;
      }

      .editor-host .publishing-rich-editor__content h2,
      .editor-host .publishing-rich-editor__content h3 {
        letter-spacing: -0.02em;
        line-height: 1.16;
        margin: 2rem 0 0.8rem;
      }

      .editor-host .publishing-rich-editor__content p,
      .editor-host .publishing-rich-editor__content ul,
      .editor-host .publishing-rich-editor__content ol,
      .editor-host .publishing-rich-editor__content blockquote,
      .editor-host .publishing-rich-editor__content pre {
        margin: 0 0 1rem;
      }

      .editor-host .publishing-rich-editor__content blockquote {
        margin-left: 0;
        padding-left: 1rem;
        border-left: 3px solid color-mix(in srgb, var(--kit-color-primary) 28%, transparent);
        color: color-mix(in srgb, var(--kit-text-primary) 88%, transparent);
      }

      .editor-host .publishing-rich-editor__content hr {
        margin: 1.75rem 0;
        border: 0;
        border-top: 1px solid color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
      }

      .editor-host .publishing-rich-editor__content p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        color: var(--kit-text-secondary);
        float: left;
        height: 0;
        pointer-events: none;
      }

      .editor-host .publishing-trix-editor trix-toolbar {
        display: none;
      }

      .editor-host trix-editor {
        border: 0;
        background: transparent;
      }

      @media (max-width: 900px) {
        .editor-status {
          align-items: flex-start;
        }

        .status-row {
          align-items: flex-start;
        }
      }
    `,
    ]; }
    firstUpdated() {
        this.mountEditor();
    }
    updated(changedProperties) {
        if (changedProperties.has("adapter") ||
            changedProperties.has("placeholder") ||
            changedProperties.has("editorLabel") ||
            changedProperties.has("editorTestId") ||
            changedProperties.has("readOnly")) {
            this.mountEditor();
            return;
        }
        if (changedProperties.has("value") &&
            this.editorHandle &&
            this.editorHandle.getValue() !== this.value) {
            this.editorHandle.setValue(this.value);
            this.editorState = this.editorHandle.getState();
        }
        if (changedProperties.has("insertPaletteOpen") && this.insertPaletteOpen) {
            this.focusInsertPaletteSearch();
        }
        if (changedProperties.has("linkComposerOpen") && this.linkComposerOpen) {
            queueMicrotask(() => {
                this.linkComposerInput?.focus();
                this.linkComposerInput?.select();
            });
        }
    }
    renderContent() {
        const insertCommands = this.getFilteredInsertCommands();
        const toolbarCommands = this.getPrimaryToolbarCommands();
        const hasBody = this.value.trim().length > 0;
        const saveState = this.readOnly ? "read-only" : this.dirty ? "unsaved" : "saved";
        const saveStateLabel = saveState === "read-only" ? "Read only" : saveState === "unsaved" ? "Unsaved" : "Saved";
        const showSaveState = saveState !== "saved";
        return html `
      <div
        class="editor-shell"
        data-empty=${hasBody ? "false" : "true"}
        data-publishing-role="editor-surface"
      >
        <div class="editor-topbar">
          ${!hasBody && !this.readOnly
            ? html `<p class="editor-empty-prompt">${this.placeholder}</p>`
            : null}
          ${this.showAdapterAnalysis
            ? html `
                <div class="adapter-analysis" aria-label="Editor engine analysis">
                  <div class="analysis-pills">
                    <span class="analysis-pill" data-verdict=${this.adapter.descriptor.verdict}>
                      ${this.adapter.descriptor.label}
                    </span>
                    <span class="analysis-pill">
                      Markdown: ${this.adapter.descriptor.canonicalMarkdown}
                    </span>
                  </div>
                  <p class="analysis-summary">${this.adapter.descriptor.summary}</p>
                  <ul class="analysis-notes">
                    ${this.adapter.descriptor.notes.map((note) => html `<li class="analysis-note">${note}</li>`)}
                  </ul>
                </div>
              `
            : null}

          ${this.insertPaletteOpen
            ? html `
                <div class="insert-palette" aria-label="Publishing insert palette">
                  <input
                    class="insert-palette-search"
                    aria-label="Insert palette search"
                    placeholder="Search headings, lists, quotes, code, links, or dividers"
                    .value=${this.insertQuery}
                    @input=${this.handleInsertQuery}
                  />
                  <div class="insert-palette-grid">
                    ${insertCommands.length > 0
                ? insertCommands.map((command) => html `
                            <button
                              class="insert-palette-button"
                              aria-label=${`Insert ${command.label}`}
                              @click=${() => this.handleInsertPaletteCommand(command.id)}
                              type="button"
                            >
                              <strong>${command.label}</strong>
                              <span>${command.shortcut ?? "Palette command"}</span>
                            </button>
                          `)
                : html `<p class="insert-palette-empty">No insert commands match this search.</p>`}
                  </div>
                </div>
              `
            : null}
        </div>

        <div class="editor-host" part="editor-host"></div>

        <div class="editor-footer">
          ${toolbarCommands.length > 0
            ? html `
                <div class="editor-inline-controls" aria-label="Editor formatting controls">
                  ${toolbarCommands.map((command) => {
                const commandState = this.editorState.commandStates[command.id];
                const disabled = commandState?.disabled ?? this.readOnly;
                return html `
                      <button
                        class="editor-inline-button"
                        aria-label=${this.inlineCommandAriaLabel(command)}
                        aria-pressed=${commandState?.active ? "true" : "false"}
                        data-active=${commandState?.active ? "true" : "false"}
                        data-command-id=${command.id}
                        ?disabled=${disabled}
                        @click=${() => this.handleCommand(command.id)}
                        type="button"
                      >
                        ${this.inlineCommandLabel(command)}
                      </button>
                    `;
            })}
                </div>
              `
            : null}

          <div class="editor-meta" aria-label="Editor metadata">
            <span class="meta-item">${this.editorState.metrics.words} words</span>
            ${showSaveState
            ? html `
                  <span class="meta-item meta-save-state" data-state=${saveState}>
                    ${saveStateLabel}
                  </span>
                `
            : null}
          </div>
        </div>

        ${this.linkComposerOpen
            ? html `
              <div class="link-composer" aria-label="Publishing link composer">
                <div class="link-composer-header">
                  <p class="link-composer-title"><strong>Insert link</strong></p>
                  <p class="link-composer-copy">
                    ${this.linkComposerSelection.length > 0
                ? `Selected text: “${this.linkComposerSelection}”`
                : "Add a canonical markdown link without leaving the writing flow."}
                  </p>
                </div>
                <label class="link-composer-label">
                  URL
                  <input
                    class="link-composer-input"
                    aria-label="Link URL"
                    placeholder="https://example.org"
                    .value=${this.linkComposerHref}
                    @input=${this.handleLinkComposerInput}
                    @keydown=${this.handleLinkComposerKeydown}
                  />
                </label>
                <div class="link-composer-actions">
                  <button class="composer-button" type="button" @click=${this.confirmLinkComposer}>
                    Insert link
                  </button>
                  <button class="composer-button" type="button" @click=${this.cancelLinkComposer}>
                    Cancel
                  </button>
                </div>
              </div>
            `
            : null}
      </div>
    `;
    }
    cleanup() {
        this.pendingLinkResolver?.(null);
        this.pendingLinkResolver = null;
        this.editorHandle?.dispose();
        this.editorHandle = null;
    }
    handleCommand(commandId) {
        this.editorHandle?.executeCommand(commandId);
        this.editorState = this.editorHandle?.getState() ?? this.editorState;
    }
    executeCommand(commandId) {
        this.handleCommand(commandId);
    }
    focusEditor(target = "end") {
        this.editorHandle?.focus(target);
    }
    mountEditor() {
        if (!this.editorHost) {
            return;
        }
        this.editorHandle?.dispose();
        this.editorHandle = this.adapter.mount(this.editorHost, {
            value: this.value,
            placeholder: this.placeholder,
            readOnly: this.readOnly,
            ariaLabel: this.editorLabel,
            testId: this.editorTestId,
            onChange: (value) => {
                this.value = value;
                this.emitEvent("publishing-change", { value });
            },
            onStateChange: (state) => {
                this.editorState = state;
            },
            onInsertRequest: (request) => {
                this.handleInsertRequest(request);
            },
            resolveLinkHref: (request) => {
                return this.openLinkComposer(request.initialHref, request.selectedText);
            },
        });
        this.editorState = this.editorHandle.getState();
    }
    getFilteredInsertCommands() {
        const query = this.insertQuery.trim().toLowerCase();
        const commands = this.adapter.commands.filter((command) => command.kind === "insert");
        if (query.length === 0) {
            return commands;
        }
        return commands.filter((command) => {
            return (command.label.toLowerCase().includes(query) ||
                command.shortLabel.toLowerCase().includes(query));
        });
    }
    getPrimaryToolbarCommands() {
        const preferredOrder = [
            "bold",
            "italic",
            "heading-1",
            "heading-2",
            "quote",
            "link",
            "code-block",
        ];
        return preferredOrder
            .map((commandId) => this.adapter.commands.find((command) => command.id === commandId))
            .filter((command) => Boolean(command));
    }
    inlineCommandLabel(command) {
        if (command.id === "code-block") {
            return "{}";
        }
        return command.shortLabel;
    }
    inlineCommandAriaLabel(command) {
        if (command.id === "code-block") {
            return "Create snippet";
        }
        return command.label;
    }
    handleInsertQuery(event) {
        const target = event.currentTarget;
        this.insertQuery = target.value;
    }
    handleInsertPaletteCommand(commandId) {
        this.handleCommand(commandId);
        this.insertPaletteOpen = false;
        this.insertQuery = "";
        this.focusEditor();
    }
    handleInsertRequest(request) {
        this.insertPaletteOpen = true;
        this.insertQuery = request.query;
        this.focusInsertPaletteSearch();
    }
    handleLinkComposerInput(event) {
        const target = event.currentTarget;
        this.linkComposerHref = target.value;
    }
    handleLinkComposerKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.confirmLinkComposer();
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            this.cancelLinkComposer();
        }
    }
    confirmLinkComposer() {
        this.finishLinkComposer(this.linkComposerHref.trim() || null);
    }
    cancelLinkComposer() {
        this.finishLinkComposer(null);
    }
    openLinkComposer(initialHref, selectedText) {
        this.linkComposerHref = initialHref;
        this.linkComposerSelection = selectedText;
        this.linkComposerOpen = true;
        return new Promise((resolve) => {
            this.pendingLinkResolver = resolve;
        });
    }
    finishLinkComposer(value) {
        const resolve = this.pendingLinkResolver;
        this.pendingLinkResolver = null;
        this.linkComposerOpen = false;
        this.linkComposerHref = "";
        this.linkComposerSelection = "";
        resolve?.(value);
        this.focusEditor();
    }
    focusInsertPaletteSearch() {
        void this.updateComplete.then(() => {
            this.insertPaletteSearch?.focus();
            if (this.insertQuery.length > 0) {
                this.insertPaletteSearch?.setSelectionRange(this.insertQuery.length, this.insertQuery.length);
                return;
            }
            this.insertPaletteSearch?.select();
        });
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "adapter", void 0);
__decorate([
    property()
], KitPublishingEditorSurface.prototype, "value", void 0);
__decorate([
    property()
], KitPublishingEditorSurface.prototype, "placeholder", void 0);
__decorate([
    property({ attribute: "editor-label" })
], KitPublishingEditorSurface.prototype, "editorLabel", void 0);
__decorate([
    property({ attribute: "editor-testid" })
], KitPublishingEditorSurface.prototype, "editorTestId", void 0);
__decorate([
    property({ type: Boolean, attribute: "read-only", reflect: true })
], KitPublishingEditorSurface.prototype, "readOnly", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingEditorSurface.prototype, "dirty", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "editorState", void 0);
__decorate([
    property({ type: Boolean, attribute: "show-adapter-analysis" })
], KitPublishingEditorSurface.prototype, "showAdapterAnalysis", void 0);
__decorate([
    property({ type: Boolean, attribute: "insert-palette-open", reflect: true })
], KitPublishingEditorSurface.prototype, "insertPaletteOpen", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "insertQuery", void 0);
__decorate([
    query(".editor-host")
], KitPublishingEditorSurface.prototype, "editorHost", void 0);
__decorate([
    query(".insert-palette-search")
], KitPublishingEditorSurface.prototype, "insertPaletteSearch", void 0);
__decorate([
    query(".link-composer-input")
], KitPublishingEditorSurface.prototype, "linkComposerInput", void 0);
__decorate([
    property({ type: Boolean, attribute: "link-composer-open", reflect: true })
], KitPublishingEditorSurface.prototype, "linkComposerOpen", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "linkComposerHref", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "linkComposerSelection", void 0);
KitPublishingEditorSurface = __decorate([
    customElement("kit-publishing-editor-surface")
], KitPublishingEditorSurface);
export { KitPublishingEditorSurface };
