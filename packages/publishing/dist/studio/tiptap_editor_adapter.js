/**
 * Tiptap-backed markdown editor adapter used as the production writing surface.
 *
 * @module @citadelfoundation/kit-publishing/studio/tiptap_editor_adapter
 */
import { Editor } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { createPublishingCommandStateMap, createPublishingEditorState, } from "./editor_contract.js";
const tiptapEditorCommands = [
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
const tiptapEditorDescriptor = {
    id: "tiptap-markdown",
    label: "Tiptap Markdown Editor",
    family: "tiptap",
    canonicalMarkdown: "native",
    verdict: "winner",
    summary: "Bidirectional markdown support with richer selection, block behavior, insert actions, and command state behind the same shell.",
    notes: [
        "Production writing engine for Ghost-style authoring while keeping markdown canonical.",
        "Tiptap's markdown extension remains beta, so the supported block set stays intentionally narrow in this slice.",
    ],
};
/**
 * Create the production Tiptap markdown adapter.
 */
export function createPublishingTiptapEditorAdapter() {
    return {
        name: tiptapEditorDescriptor.id,
        descriptor: tiptapEditorDescriptor,
        commands: tiptapEditorCommands,
        mount(container, options) {
            let syncingValue = false;
            const host = document.createElement("div");
            host.className = "publishing-rich-editor publishing-tiptap-editor";
            host.setAttribute("data-publishing-role", "editor");
            host.setAttribute("data-editor-style", "tiptap-markdown");
            if (options.testId) {
                host.setAttribute("data-testid", options.testId);
            }
            container.replaceChildren(host);
            const editor = new Editor({
                element: host,
                editable: !(options.readOnly ?? false),
                extensions: [
                    StarterKit.configure({
                        heading: {
                            levels: [1, 2, 3],
                        },
                    }),
                    Markdown,
                ],
                content: options.value,
                contentType: "markdown",
                autofocus: false,
                editorProps: {
                    attributes: {
                        class: "publishing-rich-editor__content",
                        "data-placeholder": options.placeholder ?? "",
                        role: "textbox",
                        "aria-multiline": "true",
                        "aria-label": options.ariaLabel ?? "Publishing document editor",
                    },
                },
                onCreate: ({ editor: createdEditor }) => {
                    emitState(createdEditor, options);
                },
                onSelectionUpdate: ({ editor: updatedEditor }) => {
                    emitState(updatedEditor, options);
                },
                onUpdate: ({ editor: updatedEditor }) => {
                    if (!syncingValue) {
                        options.onChange(getMarkdownFromEditor(updatedEditor));
                    }
                    emitState(updatedEditor, options);
                },
                onFocus: ({ editor: focusedEditor }) => {
                    emitState(focusedEditor, options);
                },
                onBlur: ({ editor: blurredEditor }) => {
                    emitState(blurredEditor, options);
                },
            });
            host.addEventListener("keydown", (event) => {
                if (shouldOpenInsertPalette(event, editor, options.readOnly ?? false)) {
                    queueMicrotask(() => {
                        const query = consumeSlashInsertQuery(editor);
                        if (query === null) {
                            return;
                        }
                        options.onInsertRequest?.({
                            source: "slash",
                            query,
                        });
                    });
                }
            });
            emitState(editor, options);
            return {
                getValue() {
                    return getMarkdownFromEditor(editor);
                },
                setValue(value) {
                    syncingValue = true;
                    editor.commands.setContent(value);
                    syncingValue = false;
                    emitState(editor, options);
                },
                getState() {
                    return createTiptapEditorState(editor, options.readOnly ?? false);
                },
                executeCommand(commandId) {
                    void executeTiptapCommand(editor, commandId, options).then(() => {
                        emitState(editor, options);
                        options.onChange(getMarkdownFromEditor(editor));
                    });
                },
                focus(target = "preserve") {
                    focusEditor(editor, target);
                },
                dispose() {
                    editor.destroy();
                    host.remove();
                },
            };
        },
    };
}
/**
 * Backwards-compatible export kept while downstream callers migrate.
 */
export const createTiptapMarkdownEditorAdapter = createPublishingTiptapEditorAdapter;
function emitState(editor, options) {
    options.onStateChange?.(createTiptapEditorState(editor, options.readOnly ?? false));
}
function createTiptapEditorState(editor, readOnly) {
    const canUndo = !readOnly && editor.can().chain().focus().undo().run();
    const canRedo = !readOnly && editor.can().chain().focus().redo().run();
    const commandStates = createPublishingCommandStateMap(tiptapEditorCommands, readOnly);
    setCommandState(commandStates, "undo", { active: false, disabled: !canUndo });
    setCommandState(commandStates, "redo", { active: false, disabled: !canRedo });
    setCommandState(commandStates, "heading-1", {
        active: editor.isActive("heading", { level: 1 }),
        disabled: readOnly,
    });
    setCommandState(commandStates, "heading-2", {
        active: editor.isActive("heading", { level: 2 }),
        disabled: readOnly,
    });
    setCommandState(commandStates, "heading-3", {
        active: editor.isActive("heading", { level: 3 }),
        disabled: readOnly,
    });
    setCommandState(commandStates, "bold", {
        active: editor.isActive("bold"),
        disabled: readOnly,
    });
    setCommandState(commandStates, "italic", {
        active: editor.isActive("italic"),
        disabled: readOnly,
    });
    setCommandState(commandStates, "quote", {
        active: editor.isActive("blockquote"),
        disabled: readOnly,
    });
    setCommandState(commandStates, "bulleted-list", {
        active: editor.isActive("bulletList"),
        disabled: readOnly,
    });
    setCommandState(commandStates, "numbered-list", {
        active: editor.isActive("orderedList"),
        disabled: readOnly,
    });
    setCommandState(commandStates, "code-block", {
        active: editor.isActive("codeBlock"),
        disabled: readOnly,
    });
    setCommandState(commandStates, "link", {
        active: editor.isActive("link"),
        disabled: readOnly,
    });
    setCommandState(commandStates, "divider", {
        active: false,
        disabled: readOnly,
    });
    return createPublishingEditorState({
        value: getMarkdownFromEditor(editor),
        commands: tiptapEditorCommands,
        commandStates,
        canUndo,
        canRedo,
        readOnly,
    });
}
async function executeTiptapCommand(editor, commandId, options) {
    switch (commandId) {
        case "undo":
            editor.chain().focus().undo().run();
            return;
        case "redo":
            editor.chain().focus().redo().run();
            return;
        case "heading-1":
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            return;
        case "heading-2":
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            return;
        case "heading-3":
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            return;
        case "bold":
            editor.chain().focus().toggleBold().run();
            return;
        case "italic":
            editor.chain().focus().toggleItalic().run();
            return;
        case "quote":
            editor.chain().focus().toggleBlockquote().run();
            return;
        case "bulleted-list":
            editor.chain().focus().toggleBulletList().run();
            return;
        case "numbered-list":
            editor.chain().focus().toggleOrderedList().run();
            return;
        case "code-block":
            editor.chain().focus().toggleCodeBlock().run();
            return;
        case "link":
            await insertLink(editor, options);
            return;
        case "divider":
            editor.chain().focus().setHorizontalRule().run();
            return;
    }
}
function shouldOpenInsertPalette(event, editor, readOnly) {
    if (readOnly ||
        event.defaultPrevented ||
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey) {
        return false;
    }
    const selection = editor.state.selection;
    if (!selection.empty) {
        return false;
    }
    const { $from } = selection;
    const parentText = $from.parent.textContent;
    return parentText.trim().length === 0;
}
async function insertLink(editor, options) {
    const selectedText = getSelectedText(editor).trim();
    const initialHref = createInitialLinkHref(selectedText);
    const href = await resolveLinkHref(options, {
        initialHref,
        selectedText,
    });
    if (!href) {
        return;
    }
    if (!editor.state.selection.empty) {
        editor.chain().focus().setLink({ href }).run();
        return;
    }
    const label = createLinkLabel(href);
    editor.chain().focus().insertContent(`[${label}](${href})`).run();
}
function getMarkdownFromEditor(editor) {
    const candidate = editor;
    return candidate.getMarkdown ? candidate.getMarkdown() : editor.getHTML();
}
function setCommandState(states, commandId, state) {
    states[commandId] = state;
}
function focusEditor(editor, target) {
    switch (target) {
        case "start":
            editor.commands.focus("start");
            return;
        case "end":
            editor.commands.focus("end");
            return;
        case "preserve":
        default:
            editor.commands.focus();
    }
}
function consumeSlashInsertQuery(editor) {
    const selection = editor.state.selection;
    if (!selection.empty) {
        return null;
    }
    const { $from } = selection;
    const line = $from.parent.textContent;
    if (line.length === 0) {
        return "";
    }
    const match = /^\/([\p{L}\p{N}\s-]*)$/u.exec(line);
    if (!match) {
        return null;
    }
    editor.chain().focus().deleteRange({ from: $from.start(), to: $from.end() }).run();
    return match[1]?.trim() ?? "";
}
function getSelectedText(editor) {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ").trim();
}
function createInitialLinkHref(selectedText) {
    if (/^https?:\/\//iu.test(selectedText)) {
        return selectedText;
    }
    if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/iu.test(selectedText)) {
        return `https://${selectedText}`;
    }
    return "https://";
}
async function resolveLinkHref(options, request) {
    if (typeof options.resolveLinkHref === "function") {
        const resolved = await options.resolveLinkHref(request);
        return normalizeLinkHref(resolved?.trim() ?? "");
    }
    if (typeof window !== "undefined" && typeof window.prompt === "function") {
        const prompted = window.prompt("Enter link URL", request.initialHref)?.trim() ?? "";
        return normalizeLinkHref(prompted);
    }
    return normalizeLinkHref(request.initialHref === "https://"
        ? "https://example.org"
        : request.initialHref);
}
function normalizeLinkHref(value) {
    if (value.length === 0) {
        return null;
    }
    if (/^https?:\/\//iu.test(value)) {
        return value;
    }
    if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/iu.test(value)) {
        return `https://${value}`;
    }
    return null;
}
function createLinkLabel(href) {
    try {
        const url = new URL(href);
        const path = url.pathname.replace(/\/+$/u, "");
        if (path.length > 1) {
            const segment = path.split("/").at(-1) ?? url.hostname;
            return segment.replace(/[-_]+/gu, " ");
        }
        return url.hostname.replace(/^www\./u, "");
    }
    catch {
        return "reference";
    }
}
