/**
 * Shared adapter contract and baseline markdown-first adapters.
 *
 * @module @citadelfoundation/kit-publishing/studio/editor_contract
 */
/**
 * Shared baseline command list for the markdown-first textarea adapter.
 */
export const markdownEditorCommands = [
    {
        id: "heading-1",
        label: "Heading 1",
        shortLabel: "H1",
        kind: "format",
        shortcut: "Mod+Alt+1",
    },
    {
        id: "heading-2",
        label: "Heading 2",
        shortLabel: "H2",
        kind: "format",
        shortcut: "Mod+Alt+2",
    },
    {
        id: "heading-3",
        label: "Heading 3",
        shortLabel: "H3",
        kind: "format",
        shortcut: "Mod+Alt+3",
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
        shortcut: "Mod+Shift+.",
    },
    {
        id: "bulleted-list",
        label: "Bulleted list",
        shortLabel: "• List",
        kind: "insert",
        shortcut: "Mod+Shift+7",
    },
    {
        id: "numbered-list",
        label: "Numbered list",
        shortLabel: "1. List",
        kind: "insert",
        shortcut: "Mod+Shift+8",
    },
    {
        id: "code-block",
        label: "Code block",
        shortLabel: "{ }",
        kind: "insert",
        shortcut: "Mod+Alt+C",
    },
    {
        id: "link",
        label: "Link",
        shortLabel: "Link",
        kind: "insert",
        shortcut: "Mod+K",
    },
    {
        id: "divider",
        label: "Divider",
        shortLabel: "—",
        kind: "insert",
    },
];
const markdownEditorDescriptor = {
    id: "markdown-pro",
    label: "Markdown Pro Fallback",
    family: "baseline",
    canonicalMarkdown: "native",
    verdict: "baseline",
    summary: "Textarea-based markdown authoring with command helpers and predictable Git output.",
    notes: [
        "Retained as a fallback and comparison path, not the primary editorial experience.",
        "Markdown fidelity remains strong because the editor value is the source text itself.",
    ],
};
/**
 * Create an empty command state map for an adapter command list.
 */
export function createPublishingCommandStateMap(commands, readOnly = false) {
    return Object.fromEntries(commands.map((command) => [
        command.id,
        {
            active: false,
            disabled: readOnly,
        },
    ]));
}
/**
 * Compute editor metrics for markdown or plain-text values.
 */
export function createPublishingEditorMetrics(value) {
    return {
        characters: value.length,
        lines: value.length === 0 ? 1 : value.split(/\r?\n/).length,
        words: value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length,
    };
}
/**
 * Build a minimal editor state object from the current value.
 */
export function createPublishingEditorState(options) {
    return {
        metrics: createPublishingEditorMetrics(options.value),
        canUndo: options.canUndo ?? false,
        canRedo: options.canRedo ?? false,
        commandStates: options.commandStates ??
            createPublishingCommandStateMap(options.commands, options.readOnly),
    };
}
/**
 * Create the fallback markdown-first editor adapter.
 */
export function createMarkdownEditorAdapter() {
    return {
        name: markdownEditorDescriptor.id,
        descriptor: markdownEditorDescriptor,
        commands: markdownEditorCommands,
        mount(container, options) {
            const editor = document.createElement("textarea");
            editor.className = "publishing-textarea-adapter";
            editor.name = options.testId ?? "publishing-document-editor";
            editor.value = options.value;
            editor.placeholder = options.placeholder ?? "";
            editor.readOnly = options.readOnly ?? false;
            editor.spellcheck = true;
            editor.autocapitalize = "sentences";
            editor.setAttribute("aria-label", options.ariaLabel ?? "Publishing document editor");
            editor.setAttribute("data-publishing-role", "editor");
            editor.setAttribute("data-editor-style", "markdown-pro");
            if (options.testId) {
                editor.setAttribute("data-testid", options.testId);
            }
            const emitState = () => {
                options.onStateChange?.(createPublishingEditorState({
                    value: editor.value,
                    commands: markdownEditorCommands,
                    readOnly: editor.readOnly,
                }));
            };
            const emitChange = () => {
                options.onChange(editor.value);
                emitState();
            };
            editor.addEventListener("input", emitChange);
            editor.addEventListener("keydown", (event) => {
                if (!isModifierShortcut(event)) {
                    return;
                }
                const commandId = commandIdForShortcut(event);
                if (!commandId) {
                    return;
                }
                event.preventDefault();
                executeMarkdownCommand(editor, commandId);
                emitChange();
            });
            container.replaceChildren(editor);
            emitState();
            return {
                getValue() {
                    return editor.value;
                },
                setValue(value) {
                    editor.value = value;
                    emitState();
                },
                getState() {
                    return createPublishingEditorState({
                        value: editor.value,
                        commands: markdownEditorCommands,
                        readOnly: editor.readOnly,
                    });
                },
                executeCommand(commandId) {
                    executeMarkdownCommand(editor, commandId);
                    emitChange();
                },
                focus() {
                    editor.focus();
                },
                dispose() {
                    editor.remove();
                },
            };
        },
    };
}
/**
 * Legacy plain textarea adapter retained for tests or fallback mounts.
 */
export function createTextareaEditorAdapter() {
    return {
        name: "textarea",
        descriptor: {
            id: "textarea",
            label: "Textarea Fallback",
            family: "baseline",
            canonicalMarkdown: "native",
            verdict: "baseline",
            summary: "Minimal plain-text fallback with no formatting command support.",
            notes: ["Useful for smoke tests and last-resort mounts only."],
        },
        commands: [],
        mount(container, options) {
            const editor = document.createElement("textarea");
            editor.className = "publishing-textarea-adapter";
            editor.name = options.testId ?? "publishing-document-editor";
            editor.value = options.value;
            editor.placeholder = options.placeholder ?? "";
            editor.readOnly = options.readOnly ?? false;
            editor.setAttribute("aria-label", options.ariaLabel ?? "Publishing document editor");
            editor.setAttribute("data-publishing-role", "editor");
            if (options.testId) {
                editor.setAttribute("data-testid", options.testId);
            }
            const emitState = () => {
                options.onStateChange?.(createPublishingEditorState({
                    value: editor.value,
                    commands: [],
                    readOnly: editor.readOnly,
                }));
            };
            editor.addEventListener("input", () => {
                options.onChange(editor.value);
                emitState();
            });
            container.replaceChildren(editor);
            emitState();
            return {
                getValue() {
                    return editor.value;
                },
                setValue(value) {
                    editor.value = value;
                    emitState();
                },
                getState() {
                    return createPublishingEditorState({
                        value: editor.value,
                        commands: [],
                        readOnly: editor.readOnly,
                    });
                },
                executeCommand() {
                    // Intentionally a no-op for the plain fallback adapter.
                },
                focus() {
                    editor.focus();
                },
                dispose() {
                    editor.remove();
                },
            };
        },
    };
}
function isModifierShortcut(event) {
    return event.metaKey || event.ctrlKey;
}
function commandIdForShortcut(event) {
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
            case "b":
                return "bold";
            case "i":
                return "italic";
            case "k":
                return "link";
            default:
                break;
        }
    }
    if ((event.metaKey || event.ctrlKey) && event.altKey && !event.shiftKey) {
        switch (event.key) {
            case "1":
                return "heading-1";
            case "2":
                return "heading-2";
            case "3":
                return "heading-3";
            case "c":
            case "C":
                return "code-block";
            default:
                break;
        }
    }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        switch (event.key) {
            case "7":
                return "bulleted-list";
            case "8":
                return "numbered-list";
            case ".":
                return "quote";
            default:
                break;
        }
    }
    return null;
}
function executeMarkdownCommand(editor, commandId) {
    switch (commandId) {
        case "heading-1":
            prefixSelectionLines(editor, "# ");
            break;
        case "heading-2":
            prefixSelectionLines(editor, "## ");
            break;
        case "heading-3":
            prefixSelectionLines(editor, "### ");
            break;
        case "bold":
            wrapSelection(editor, "**", "**", "strong text");
            break;
        case "italic":
            wrapSelection(editor, "_", "_", "emphasis");
            break;
        case "quote":
            prefixSelectionLines(editor, "> ");
            break;
        case "bulleted-list":
            prefixSelectionLines(editor, "- ");
            break;
        case "numbered-list":
            prefixSelectionLines(editor, "1. ", { numbered: true });
            break;
        case "code-block":
            wrapBlockSelection(editor, "```md", "```", "Add code or example content");
            break;
        case "link":
            wrapSelection(editor, "[", "](https://example.com)", "link label");
            break;
        case "divider":
            insertBlock(editor, "\n\n---\n\n");
            break;
        case "undo":
        case "redo":
            break;
    }
}
function wrapSelection(editor, before, after, placeholder) {
    const { selectionStart, selectionEnd, value } = editor;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const replacement = `${before}${selected}${after}`;
    editor.setRangeText(replacement, selectionStart, selectionEnd, "end");
    const selectionAnchor = selectionStart + before.length;
    editor.setSelectionRange(selectionAnchor, selectionAnchor + selected.length);
    editor.focus();
}
function wrapBlockSelection(editor, prefix, suffix, placeholder) {
    const { selectionStart, selectionEnd, value } = editor;
    const selected = value.slice(selectionStart, selectionEnd).trim() || placeholder;
    const replacement = `\n${prefix}\n${selected}\n${suffix}\n`;
    editor.setRangeText(replacement, selectionStart, selectionEnd, "end");
    const blockStart = selectionStart + prefix.length + 2;
    editor.setSelectionRange(blockStart, blockStart + selected.length);
    editor.focus();
}
function prefixSelectionLines(editor, prefix, options = {}) {
    const { selectionStart, selectionEnd, value } = editor;
    const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
    const nextBreak = value.indexOf("\n", selectionEnd);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const selectedBlock = value.slice(lineStart, lineEnd);
    const lines = selectedBlock.split("\n");
    const updatedLines = lines.map((line, index) => {
        if (options.numbered) {
            const bare = line.replace(/^\d+\.\s+/, "").trimStart();
            return `${index + 1}. ${bare}`;
        }
        if (line.startsWith(prefix)) {
            return line.slice(prefix.length);
        }
        return `${prefix}${line}`;
    });
    const replacement = updatedLines.join("\n");
    editor.setRangeText(replacement, lineStart, lineEnd, "end");
    editor.setSelectionRange(lineStart, lineStart + replacement.length);
    editor.focus();
}
function insertBlock(editor, block) {
    const { selectionStart, selectionEnd } = editor;
    editor.setRangeText(block, selectionStart, selectionEnd, "end");
    const caret = selectionStart + block.length;
    editor.setSelectionRange(caret, caret);
    editor.focus();
}
