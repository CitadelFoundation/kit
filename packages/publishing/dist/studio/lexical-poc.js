var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { $generateHtmlFromNodes } from "@lexical/html";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { HeadingNode, QuoteNode, registerRichText } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_EDITOR, createEditor, FORMAT_TEXT_COMMAND, REDO_COMMAND, SELECT_ALL_COMMAND, UNDO_COMMAND, } from "lexical";
import { PublishingElement, publishingTheme } from "../internal/ui.js";
import { createPublishingCommandStateMap, createPublishingEditorState, } from "./editor_contract.js";
const lexicalPocCommands = [
    {
        id: "bold",
        label: "Bold",
        shortLabel: "B",
        kind: "format",
        shortcut: "Mod+B",
    },
    {
        id: "italic",
        label: "Italic",
        shortLabel: "I",
        kind: "format",
        shortcut: "Mod+I",
    },
    {
        id: "undo",
        label: "Undo",
        shortLabel: "Undo",
        kind: "history",
        shortcut: "Mod+Z",
    },
    {
        id: "redo",
        label: "Redo",
        shortLabel: "Redo",
        kind: "history",
        shortcut: "Mod+Shift+Z",
    },
];
let KitLexicalPoc = class KitLexicalPoc extends PublishingElement {
    constructor() {
        super(...arguments);
        this.initialValue = "";
        this.editorLabel = "Lexical proof editor";
        this.readOnly = false;
        this.editorState = createPublishingEditorState({
            value: "",
            commands: lexicalPocCommands,
        });
        this.editor = null;
        this.editorRootElement = null;
        this.unregisterCallbacks = [];
        this.textSnapshot = "";
        this.htmlSnapshot = "";
        this.canUndo = false;
        this.canRedo = false;
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .lexical-poc-shell {
        display: grid;
        gap: 0.75rem;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .toolbar-button {
        border: 1px solid var(--kit-border-primary, #d1d5db);
        border-radius: 0.5rem;
        background: var(--kit-surface-primary, #ffffff);
        color: var(--kit-text-primary, #111827);
        cursor: pointer;
        font: inherit;
        min-width: 2.75rem;
        padding: 0.5rem 0.75rem;
      }

      .toolbar-button[data-active="true"] {
        background: var(--kit-color-primary, #111827);
        color: var(--kit-surface-primary, #ffffff);
      }

      .toolbar-button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .editor-host {
        min-height: 12rem;
      }

      .lexical-contenteditable {
        border: 1px solid var(--kit-border-primary, #d1d5db);
        border-radius: 0.75rem;
        min-height: 12rem;
        outline: none;
        padding: 1rem;
      }

      .lexical-contenteditable:focus {
        border-color: var(--kit-color-primary, #111827);
      }

      .lexical-contenteditable p {
        margin: 0;
      }
    `,
    ]; }
    connectedCallback() {
        super.connectedCallback();
        queueMicrotask(() => {
            if (this.isConnected && this.hasUpdated && this.editor === null) {
                this.mountEditor();
            }
        });
    }
    firstUpdated() {
        this.mountEditor();
    }
    updated(changedProperties) {
        if (changedProperties.has("readOnly") && this.editor !== null) {
            this.editor.setEditable(!this.readOnly);
            this.syncSnapshot();
        }
        if (changedProperties.has("editorLabel") &&
            this.editorRootElement !== null) {
            this.editorRootElement.setAttribute("aria-label", this.editorLabel);
        }
    }
    typeText(text) {
        if (this.editor === null || this.readOnly || text.length === 0) {
            return false;
        }
        this.editor.update(() => {
            const root = $getRoot();
            if (root.getChildrenSize() === 0) {
                root.append($createParagraphNode());
            }
            root.selectEnd();
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                selection.insertText(text);
            }
        });
        return true;
    }
    selectAllText() {
        if (this.editor === null) {
            return false;
        }
        return this.editor.dispatchCommand(SELECT_ALL_COMMAND, new KeyboardEvent("keydown"));
    }
    executeCommand(commandId) {
        if (this.editor === null) {
            return false;
        }
        if (this.readOnly) {
            return false;
        }
        switch (commandId) {
            case "bold":
                return this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            case "italic":
                return this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            case "undo":
                return this.editor.dispatchCommand(UNDO_COMMAND, undefined);
            case "redo":
                return this.editor.dispatchCommand(REDO_COMMAND, undefined);
        }
    }
    getEditorText() {
        return this.textSnapshot;
    }
    getEditorHtml() {
        return this.htmlSnapshot;
    }
    remountEditor() {
        this.disposeEditor();
        this.mountEditor();
    }
    disposeEditor() {
        while (this.unregisterCallbacks.length > 0) {
            this.unregisterCallbacks.pop()?.();
        }
        if (this.editor !== null) {
            this.editor.setRootElement(null);
        }
        this.editor = null;
        this.editorRootElement = null;
        this.canUndo = false;
        this.canRedo = false;
        this.editorHost?.replaceChildren();
    }
    cleanup() {
        this.disposeEditor();
    }
    renderContent() {
        return html `
      <div class="lexical-poc-shell">
        <div class="toolbar" aria-label="Lexical proof toolbar">
          ${lexicalPocCommands.map((command) => {
            const commandState = this.editorState.commandStates[command.id];
            return html `
              <button
                class="toolbar-button"
                type="button"
                data-command-id=${command.id}
                data-active=${String(commandState?.active ?? false)}
                ?disabled=${commandState?.disabled ?? true}
                @click=${() => {
                this.executeCommand(command.id);
            }}
              >
                ${command.shortLabel}
              </button>
            `;
        })}
        </div>
        <div class="editor-host" part="editor-host"></div>
      </div>
    `;
    }
    mountEditor() {
        if (!this.editorHost) {
            return;
        }
        this.disposeEditor();
        const rootElement = document.createElement("div");
        rootElement.className = "lexical-contenteditable";
        rootElement.contentEditable = this.readOnly ? "false" : "true";
        rootElement.setAttribute("role", "textbox");
        rootElement.setAttribute("aria-multiline", "true");
        rootElement.setAttribute("aria-label", this.editorLabel);
        this.editorHost.replaceChildren(rootElement);
        const editor = createEditor({
            editable: !this.readOnly,
            namespace: "citadel-publishing-lexical-poc",
            nodes: [HeadingNode, QuoteNode],
            onError(error) {
                throw error;
            },
        });
        editor.setRootElement(rootElement);
        this.editor = editor;
        this.editorRootElement = rootElement;
        this.unregisterCallbacks.push(registerRichText(editor));
        this.unregisterCallbacks.push(registerHistory(editor, createEmptyHistoryState(), 0));
        this.unregisterCallbacks.push(editor.registerCommand(CAN_UNDO_COMMAND, (payload) => {
            this.canUndo = payload;
            this.syncCommandState();
            return false;
        }, COMMAND_PRIORITY_EDITOR));
        this.unregisterCallbacks.push(editor.registerCommand(CAN_REDO_COMMAND, (payload) => {
            this.canRedo = payload;
            this.syncCommandState();
            return false;
        }, COMMAND_PRIORITY_EDITOR));
        this.unregisterCallbacks.push(editor.registerUpdateListener(() => {
            this.syncSnapshot(true);
        }));
        editor.update(() => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            if (this.initialValue.length > 0) {
                paragraph.append($createTextNode(this.initialValue));
            }
            root.append(paragraph);
            paragraph.selectEnd();
        });
        this.syncSnapshot();
    }
    syncSnapshot(emitChange = false) {
        if (this.editor === null) {
            this.editorState = createPublishingEditorState({
                value: this.textSnapshot,
                canRedo: this.canRedo,
                canUndo: this.canUndo,
                commands: lexicalPocCommands,
                commandStates: this.createCommandStates(null),
                readOnly: this.readOnly,
            });
            return;
        }
        const nextSnapshot = this.editor.getEditorState().read(() => {
            const nextText = $getRoot().getTextContent();
            const nextHtml = $generateHtmlFromNodes(this.editor, null);
            const commandStates = this.createCommandStates($getSelection());
            return {
                commandStates,
                html: nextHtml,
                text: nextText,
            };
        });
        const nextHtml = nextSnapshot.html;
        const nextText = nextSnapshot.text;
        const nextCommandStates = nextSnapshot.commandStates;
        const changed = nextText !== this.textSnapshot || nextHtml !== this.htmlSnapshot;
        this.textSnapshot = nextText;
        this.htmlSnapshot = nextHtml;
        this.editorRootElement?.setAttribute("contenteditable", this.readOnly ? "false" : "true");
        this.editorState = createPublishingEditorState({
            value: nextText,
            canRedo: this.canRedo,
            canUndo: this.canUndo,
            commands: lexicalPocCommands,
            commandStates: nextCommandStates,
            readOnly: this.readOnly,
        });
        if (emitChange && changed) {
            this.emitEvent("publishing-lexical-change", {
                text: nextText,
                html: nextHtml,
            });
        }
    }
    syncCommandState() {
        this.editorState = createPublishingEditorState({
            value: this.textSnapshot,
            canRedo: this.canRedo,
            canUndo: this.canUndo,
            commands: lexicalPocCommands,
            commandStates: this.editor === null
                ? this.createCommandStates(null)
                : this.editor.getEditorState().read(() => {
                    return this.createCommandStates($getSelection());
                }),
            readOnly: this.readOnly,
        });
    }
    createCommandStates(selection) {
        const commandStates = {
            ...createPublishingCommandStateMap(lexicalPocCommands, this.readOnly),
        };
        const isRangeSelection = $isRangeSelection(selection);
        const boldActive = isRangeSelection ? selection.hasFormat("bold") : false;
        const italicActive = isRangeSelection
            ? selection.hasFormat("italic")
            : false;
        commandStates.bold = {
            active: boldActive,
            disabled: this.readOnly,
        };
        commandStates.italic = {
            active: italicActive,
            disabled: this.readOnly,
        };
        commandStates.undo = {
            active: false,
            disabled: this.readOnly || !this.canUndo,
        };
        commandStates.redo = {
            active: false,
            disabled: this.readOnly || !this.canRedo,
        };
        return commandStates;
    }
};
__decorate([
    property()
], KitLexicalPoc.prototype, "initialValue", void 0);
__decorate([
    property({ attribute: "editor-label" })
], KitLexicalPoc.prototype, "editorLabel", void 0);
__decorate([
    property({ type: Boolean, attribute: "read-only", reflect: true })
], KitLexicalPoc.prototype, "readOnly", void 0);
__decorate([
    property({ attribute: false })
], KitLexicalPoc.prototype, "editorState", void 0);
__decorate([
    query(".editor-host")
], KitLexicalPoc.prototype, "editorHost", void 0);
KitLexicalPoc = __decorate([
    customElement("kit-lexical-poc")
], KitLexicalPoc);
export { KitLexicalPoc };
