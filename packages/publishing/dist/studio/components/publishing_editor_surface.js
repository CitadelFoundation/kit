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
import { keyed } from "lit/directives/keyed.js";
import { PublishingElement, publishingTheme } from "../../internal/ui.js";
import "./lexical/editor-toolbar.js";
import { lexicalCompactToolbarCommands } from "./lexical/editor-toolbar.js";
import { createMarkdownEditorAdapter, } from "../editor_adapter.js";
import "./lexical/lexical-editor.js";
let KitPublishingEditorSurface = class KitPublishingEditorSurface extends PublishingElement {
    constructor() {
        super(...arguments);
        this.adapter = createMarkdownEditorAdapter();
        this.editorKind = "lexical";
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
        this.mediaAssets = [];
        this.externalSyncGeneration = 0;
        this.documentIdentity = "";
        this.insertPaletteOpen = false;
        this.insertQuery = "";
        this.editorHandle = null;
        this.pendingLinkResolver = null;
        this.linkComposerOpen = false;
        this.linkComposerHref = "";
        this.linkComposerSelection = "";
        this.handleLexicalChange = (event) => {
            this.value = event.detail.value;
            this.editorState = this.lexicalEditor?.editorState ?? this.editorState;
            this.emitEvent("publishing-change", event.detail);
        };
        this.handleLexicalStateChange = (event) => {
            this.editorState = event.detail.state;
        };
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
        gap: 0.9rem;
        min-height: 34rem;
        padding: 0;
      }

      .editor-topbar {
        display: grid;
        gap: 0.45rem;
      }

      .editor-toolbar-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.8rem 1rem;
        padding: 0.1rem 0 0.4rem;
        border-bottom: 1px solid var(--kit-editorial-chrome-border);
      }

      .editor-toolbar-cluster {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.65rem 0.85rem;
        min-width: 0;
      }

      .editor-utility-note {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.38rem 0.68rem;
        border-radius: var(--kit-radius-full);
        background: color-mix(
          in srgb,
          var(--kit-editorial-chrome-surface) 98%,
          transparent
        );
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-xs);
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .editor-utility-note code {
        font-family: inherit;
        font-weight: 700;
      }

      .editor-empty-prompt {
        margin: 0;
        color: color-mix(
          in srgb,
          var(--kit-editorial-muted-text) 90%,
          transparent
        );
        font-size: 1rem;
        line-height: 1.5;
      }

      .editor-meta {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        justify-content: flex-end;
        color: var(--kit-editorial-muted-text);
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
        padding-top: 0.3rem;
        border-top: 1px solid var(--kit-editorial-chrome-border);
      }

      .meta-save-state[data-state="unsaved"] {
        color: color-mix(in srgb, var(--kit-text-primary) 86%, transparent);
        font-weight: 600;
      }

      .meta-save-state[data-state="read-only"] {
        color: color-mix(in srgb, var(--kit-text-secondary) 88%, transparent);
      }

      .meta-save-state[data-state="saved"] {
        color: var(--kit-editorial-muted-text);
      }

      .composer-button {
        appearance: none;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
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
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 34%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 10%,
          var(--kit-surface-primary)
        );
      }

      .insert-palette {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-sm);
        border-radius: var(--kit-radius-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
      }

      .insert-palette-search {
        width: 100%;
        padding: 0.7rem 0.8rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
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
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
        cursor: pointer;
      }

      .insert-palette-button:hover {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 32%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 8%,
          var(--kit-surface-primary)
        );
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
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 90%,
          transparent
        );
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
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
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
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
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
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 92%,
          transparent
        );
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
        font: 400 1.0625rem / 1.647
          var(
            --kit-font-family-sans,
            "IBM Plex Sans",
            Inter,
            system-ui,
            sans-serif
          );
        letter-spacing: 0.004em;
        box-shadow: none;
      }

      .editor-shell[data-empty="true"]
        .editor-host
        :is(textarea, .publishing-textarea-adapter, trix-editor) {
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
        outline: 2px solid
          color-mix(in srgb, var(--kit-color-primary) 42%, transparent);
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
      .editor-shell[data-empty="true"]
        .editor-host
        .publishing-rich-editor__content {
        min-height: 31rem;
        padding-top: 0;
      }

      .editor-host .publishing-rich-editor__content,
      .editor-host trix-editor {
        min-height: 24rem;
        padding: 0 0 0.35rem;
        color: var(--kit-text-primary);
        font: 400 1.0625rem / 1.647
          var(
            --kit-font-family-sans,
            "IBM Plex Sans",
            Inter,
            system-ui,
            sans-serif
          );
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
        border-left: 3px solid
          color-mix(in srgb, var(--kit-color-primary) 28%, transparent);
        color: color-mix(in srgb, var(--kit-text-primary) 88%, transparent);
      }

      .editor-host .publishing-rich-editor__content hr {
        margin: 1.75rem 0;
        border: 0;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
      }

      .editor-host
        .publishing-rich-editor__content
        p.is-editor-empty:first-child::before {
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
        .editor-toolbar-row {
          align-items: flex-start;
        }

        .editor-meta {
          justify-content: flex-start;
        }
      }
    `,
    ]; }
    firstUpdated() {
        if (this.editorKind === "adapter") {
            this.mountEditor();
        }
    }
    updated(changedProperties) {
        if (changedProperties.has("editorKind")) {
            if (this.editorKind === "adapter") {
                this.mountEditor();
            }
            else {
                this.editorHandle?.dispose();
                this.editorHandle = null;
            }
        }
        if (this.editorKind === "adapter") {
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
        }
        if (this.editorKind === "lexical") {
            if (changedProperties.has("value")) {
                const nextMetrics = {
                    characters: this.value.length,
                    lines: this.value.length === 0 ? 1 : this.value.split(/\r?\n/).length,
                    words: this.value.trim().length === 0
                        ? 0
                        : this.value.trim().split(/\s+/).length,
                };
                const currentMetrics = this.editorState.metrics;
                if (currentMetrics.characters !== nextMetrics.characters ||
                    currentMetrics.lines !== nextMetrics.lines ||
                    currentMetrics.words !== nextMetrics.words) {
                    this.editorState = {
                        ...this.editorState,
                        metrics: nextMetrics,
                    };
                }
            }
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
        const isAdapterMode = this.editorKind === "adapter";
        const insertCommands = this.getFilteredInsertCommands();
        const hasBody = this.value.trim().length > 0;
        const showLexicalUtilityNote = !isAdapterMode && !this.readOnly && !hasBody && !this.dirty;
        const saveState = this.readOnly
            ? "read-only"
            : this.dirty
                ? "unsaved"
                : "saved";
        const saveStateLabel = saveState === "read-only"
            ? "Read only"
            : saveState === "unsaved"
                ? "Unsaved"
                : "Saved";
        const showSaveState = saveState !== "saved";
        const lexicalMeta = html `
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
    `;
        return html `
      <div
        class="editor-shell"
        data-empty=${hasBody ? "false" : "true"}
        data-editor-kind=${this.editorKind}
        data-publishing-role="editor-surface"
      >
        <div class="editor-topbar">
          ${isAdapterMode && !hasBody && !this.readOnly
            ? html `<p class="editor-empty-prompt">${this.placeholder}</p>`
            : null}
          ${isAdapterMode && this.showAdapterAnalysis
            ? html `
                <div
                  class="adapter-analysis"
                  aria-label="Editor engine analysis"
                >
                  <div class="analysis-pills">
                    <span
                      class="analysis-pill"
                      data-verdict=${this.adapter.descriptor.verdict}
                    >
                      ${this.adapter.descriptor.label}
                    </span>
                    <span class="analysis-pill">
                      Markdown: ${this.adapter.descriptor.canonicalMarkdown}
                    </span>
                  </div>
                  <p class="analysis-summary">
                    ${this.adapter.descriptor.summary}
                  </p>
                  <ul class="analysis-notes">
                    ${this.adapter.descriptor.notes.map((note) => html `<li class="analysis-note">${note}</li>`)}
                  </ul>
                </div>
              `
            : null}
          ${isAdapterMode && this.insertPaletteOpen
            ? html `
                <div
                  class="insert-palette"
                  aria-label="Publishing insert palette"
                >
                  <input
                    name="insert-palette-search"
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
                              <span
                                >${command.shortcut ?? "Palette command"}</span
                              >
                            </button>
                          `)
                : html `<p class="insert-palette-empty">
                          No insert commands match this search.
                        </p>`}
                  </div>
                </div>
              `
            : null}
          <div class="editor-toolbar-row">
            <div class="editor-toolbar-cluster">
              <kit-lexical-editor-toolbar
                .commands=${this.getPrimaryToolbarCommands()}
                .editorState=${this.editorState}
                .onCommand=${this.handleCommand}
                .appearance=${isAdapterMode ? "default" : "compact"}
                .showLabels=${isAdapterMode}
                .showShortcuts=${isAdapterMode}
                .toolbarLabel=${isAdapterMode
            ? "Editor formatting controls"
            : "Editor controls"}
              ></kit-lexical-editor-toolbar>
              ${showLexicalUtilityNote
            ? html `<span class="editor-utility-note"
                    >Press <code>/</code> to insert blocks</span
                  >`
            : null}
            </div>
            ${isAdapterMode ? null : lexicalMeta}
          </div>
        </div>

        ${isAdapterMode
            ? html `<div class="editor-host" part="editor-host"></div>`
            : keyed(this.documentIdentity || "__default-document__", html `
                <kit-lexical-editor
                  class="lexical-editor"
                  .value=${this.value}
                  .placeholder=${this.placeholder}
                  .editorLabel=${this.editorLabel}
                  .editorTestId=${this.editorTestId}
                  .readOnly=${this.readOnly}
                  .editorState=${this.editorState}
                  .mediaAssets=${this.mediaAssets}
                  .externalSyncGeneration=${this.externalSyncGeneration}
                  @publishing-change=${this.handleLexicalChange}
                  @publishing-editor-state-change=${this
                .handleLexicalStateChange}
                ></kit-lexical-editor>
              `)}
        ${isAdapterMode
            ? html `<div class="editor-footer">${lexicalMeta}</div>`
            : null}
        ${isAdapterMode && this.linkComposerOpen
            ? html `
              <div class="link-composer" aria-label="Publishing link composer">
                <div class="link-composer-header">
                  <p class="link-composer-title">
                    <strong>Insert link</strong>
                  </p>
                  <p class="link-composer-copy">
                    ${this.linkComposerSelection.length > 0
                ? `Selected text: “${this.linkComposerSelection}”`
                : "Add a canonical markdown link without leaving the writing flow."}
                  </p>
                </div>
                <label class="link-composer-label">
                  URL
                  <input
                    name="link-url"
                    class="link-composer-input"
                    aria-label="Link URL"
                    placeholder="https://example.org"
                    .value=${this.linkComposerHref}
                    @input=${this.handleLinkComposerInput}
                    @keydown=${this.handleLinkComposerKeydown}
                  />
                </label>
                <div class="link-composer-actions">
                  <button
                    class="composer-button"
                    type="button"
                    @click=${this.confirmLinkComposer}
                  >
                    Insert link
                  </button>
                  <button
                    class="composer-button"
                    type="button"
                    @click=${this.cancelLinkComposer}
                  >
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
        if (this.editorKind === "lexical") {
            this.lexicalEditor?.executeCommand(commandId);
            this.editorState = this.lexicalEditor?.editorState ?? this.editorState;
            return;
        }
        this.editorHandle?.executeCommand(commandId);
        this.editorState = this.editorHandle?.getState() ?? this.editorState;
    }
    executeCommand(commandId) {
        this.handleCommand(commandId);
    }
    focusEditor(target = "end") {
        if (this.editorKind === "lexical") {
            this.lexicalEditor?.focus(target);
            return;
        }
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
                this.emitEvent("publishing-change", {
                    value,
                    origin: "user",
                    editorKind: "adapter",
                });
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
        return this.editorKind === "lexical"
            ? lexicalCompactToolbarCommands
            : this.adapter.commands;
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
    property({ attribute: "editor-kind" })
], KitPublishingEditorSurface.prototype, "editorKind", void 0);
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
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "mediaAssets", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "externalSyncGeneration", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingEditorSurface.prototype, "documentIdentity", void 0);
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
    query("kit-lexical-editor")
], KitPublishingEditorSurface.prototype, "lexicalEditor", void 0);
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
