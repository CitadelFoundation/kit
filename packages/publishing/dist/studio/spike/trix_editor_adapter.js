/**
 * Trix-backed comparison adapter used to evaluate Ghost-adjacent UI ergonomics.
 *
 * @module @citadelfoundation/kit-publishing/studio/spike/trix_editor_adapter
 */
import MarkdownIt from "markdown-it";
import TurndownService from "turndown";
import { createPublishingEditorState, } from "../editor_contract.js";
const markdownRenderer = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
});
const markdownSerializer = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    headingStyle: "atx",
    hr: "---",
});
const trixEditorCommands = [
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
        id: "quote",
        label: "Quote",
        shortLabel: "❝",
        kind: "format",
    },
    {
        id: "bulleted-list",
        label: "Bulleted list",
        shortLabel: "• List",
        kind: "insert",
    },
    {
        id: "numbered-list",
        label: "Numbered list",
        shortLabel: "1. List",
        kind: "insert",
    },
    {
        id: "code-block",
        label: "Code block",
        shortLabel: "{ }",
        kind: "insert",
    },
    {
        id: "link",
        label: "Link",
        shortLabel: "Link",
        kind: "insert",
    },
];
const trixEditorDescriptor = {
    id: "trix-bridge-spike",
    label: "Trix Bridge Prototype",
    family: "trix",
    canonicalMarkdown: "bridge",
    verdict: "reference-only",
    summary: "Strong web-component ergonomics, but it needs an HTML bridge to import and export markdown for Git-native publishing.",
    notes: [
        "Useful reference for writing feel and interaction restraint.",
        "Rejected as the canonical engine because markdown fidelity depends on an HTML conversion layer rather than native markdown state.",
    ],
};
/**
 * Create the Trix comparison adapter.
 */
export function createTrixEditorAdapter() {
    return {
        name: trixEditorDescriptor.id,
        descriptor: trixEditorDescriptor,
        commands: trixEditorCommands,
        mount(container, options) {
            const shell = document.createElement("div");
            shell.className = "publishing-rich-editor publishing-trix-editor";
            container.replaceChildren(shell);
            const toolbarId = `publishing-trix-toolbar-${crypto.randomUUID()}`;
            const inputId = `publishing-trix-input-${crypto.randomUUID()}`;
            const hiddenInput = document.createElement("input");
            hiddenInput.type = "hidden";
            hiddenInput.id = inputId;
            let hiddenToolbar = null;
            let editor = null;
            let disposed = false;
            let currentValue = options.value;
            let removeChangeListener = null;
            const emitState = () => {
                options.onStateChange?.(createPublishingEditorState({
                    value: editor ? getMarkdownValue(editor, hiddenInput.value) : currentValue,
                    commands: trixEditorCommands,
                    readOnly: options.readOnly,
                }));
            };
            const emitChange = () => {
                const value = editor ? getMarkdownValue(editor, hiddenInput.value) : currentValue;
                currentValue = value;
                options.onChange(value);
                emitState();
            };
            emitState();
            void initializeTrixEditor().catch(() => {
                emitState();
            });
            return {
                getValue() {
                    return editor ? getMarkdownValue(editor, hiddenInput.value) : currentValue;
                },
                setValue(value) {
                    currentValue = value;
                    const html = renderMarkdownForTrix(value);
                    hiddenInput.value = html;
                    if (editor?.editor?.loadHTML) {
                        editor.editor.loadHTML(html);
                    }
                    else if (editor) {
                        editor.value = html;
                    }
                    emitState();
                },
                getState() {
                    return createPublishingEditorState({
                        value: editor ? getMarkdownValue(editor, hiddenInput.value) : currentValue,
                        commands: trixEditorCommands,
                        readOnly: options.readOnly,
                    });
                },
                executeCommand(commandId) {
                    if (!editor) {
                        return;
                    }
                    if (commandId === "link") {
                        editor.editor?.insertHTML?.('<a href="https://example.com">link label</a>');
                        emitChange();
                        return;
                    }
                    const button = hiddenToolbar?.querySelector(`[data-publishing-command="${commandId}"]`);
                    button?.click();
                    emitChange();
                },
                focus() {
                    editor?.focus();
                },
                dispose() {
                    disposed = true;
                    removeChangeListener?.();
                    shell.remove();
                },
            };
            async function initializeTrixEditor() {
                await import("trix");
                if (disposed) {
                    return;
                }
                hiddenInput.value = renderMarkdownForTrix(currentValue);
                hiddenToolbar = document.createElement("trix-toolbar");
                hiddenToolbar.id = toolbarId;
                hiddenToolbar.hidden = true;
                hiddenToolbar.innerHTML = buildTrixToolbarMarkup();
                editor = document.createElement("trix-editor");
                editor.setAttribute("toolbar", toolbarId);
                editor.setAttribute("input", inputId);
                editor.setAttribute("data-publishing-role", "editor");
                editor.setAttribute("data-editor-style", trixEditorDescriptor.id);
                editor.setAttribute("aria-label", options.ariaLabel ?? "Publishing document editor");
                if (options.testId) {
                    editor.setAttribute("data-testid", options.testId);
                }
                if (options.readOnly) {
                    editor.setAttribute("disabled", "");
                }
                if (options.placeholder) {
                    editor.setAttribute("placeholder", options.placeholder);
                }
                editor.addEventListener("trix-change", emitChange);
                removeChangeListener = () => {
                    editor?.removeEventListener("trix-change", emitChange);
                };
                shell.replaceChildren(hiddenToolbar, hiddenInput, editor);
                emitState();
            }
        },
    };
}
/**
 * Render canonical markdown into HTML for Trix's HTML-first document model.
 */
export function renderMarkdownForTrix(markdown) {
    return markdownRenderer.render(markdown);
}
/**
 * Serialize HTML emitted by Trix back into markdown for comparison.
 */
export function serializeTrixHtmlToMarkdown(html) {
    return markdownSerializer.turndown(html).trim();
}
function getMarkdownValue(editor, fallbackHtml) {
    const html = editor.value ?? fallbackHtml;
    return serializeTrixHtmlToMarkdown(html);
}
function buildTrixToolbarMarkup() {
    return `
    <div class="trix-button-row">
      <button type="button" data-publishing-command="undo" data-trix-action="undo"></button>
      <button type="button" data-publishing-command="redo" data-trix-action="redo"></button>
      <button type="button" data-publishing-command="bold" data-trix-attribute="bold"></button>
      <button type="button" data-publishing-command="italic" data-trix-attribute="italic"></button>
      <button type="button" data-publishing-command="quote" data-trix-attribute="quote"></button>
      <button type="button" data-publishing-command="bulleted-list" data-trix-attribute="bullet"></button>
      <button type="button" data-publishing-command="numbered-list" data-trix-attribute="number"></button>
      <button type="button" data-publishing-command="code-block" data-trix-attribute="code"></button>
    </div>
  `;
}
