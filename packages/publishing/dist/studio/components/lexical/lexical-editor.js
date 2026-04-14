var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { $createParagraphNode, $createTextNode, $getNearestNodeFromDOMNode, $getNodeByKey, $getRoot, $getSelection, $isRangeSelection, $setSelection, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_EDITOR, createEditor, FORMAT_TEXT_COMMAND, KEY_DOWN_COMMAND, REDO_COMMAND, SELECT_ALL_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, } from "lexical";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND, } from "@lexical/link";
import { $createListItemNode, $createListNode, $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, registerList, } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, registerRichText, } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { registerMarkdownShortcuts } from "@lexical/markdown";
import { $createCodeNode, $isCodeNode, } from "@lexical/code";
import { html, css, nothing, } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../internal/ui.js";
import { importPublishingMarkdown, publishingLexicalNodes, publishingMarkdownTransformers, serializePublishingMarkdown, } from "../../../content/lexical_markdown_bridge.js";
import { resolvePublishingStudioAssetPreviewPath } from "../../host/model.js";
import { createPublishingCommandStateMap, createPublishingEditorState, } from "../../editor_adapter.js";
import { createDividerCard, DividerCardNode } from "./cards/divider-card.js";
import { createImageCard, ImageCardNode, } from "./cards/image-card.js";
import { lexicalEditorToolbarCommands } from "./editor-toolbar.js";
import { lexicalFloatingToolbarCommands, } from "./floating-toolbar.js";
let blockMenuInstanceCounter = 0;
const GUTTER_HOVER_EXIT_GRACE_MS = 120;
const BLOCK_MENU_ITEMS = [
    {
        id: "paragraph",
        group: "Text",
        label: "Paragraph",
        description: "Start a clean body paragraph.",
    },
    {
        id: "heading-2",
        group: "Text",
        label: "Heading 2",
        description: "Add a section heading.",
    },
    {
        id: "heading-3",
        group: "Text",
        label: "Heading 3",
        description: "Add a smaller heading.",
    },
    {
        id: "bulleted-list",
        group: "Lists",
        label: "Bulleted list",
        description: "Start a bullet list.",
    },
    {
        id: "numbered-list",
        group: "Lists",
        label: "Numbered list",
        description: "Start a numbered list.",
    },
    {
        id: "quote",
        group: "Structure",
        label: "Quote",
        description: "Pull out a supporting quote.",
    },
    {
        id: "code-block",
        group: "Structure",
        label: "Code block",
        description: "Show formatted code or commands.",
    },
    {
        id: "divider",
        group: "Structure",
        label: "Divider",
        description: "Create a visual section break.",
    },
    {
        id: "image",
        group: "Media",
        label: "Image",
        description: "Place an image from content/media.",
    },
    {
        id: "heading-1",
        group: "Title",
        label: "Heading 1",
        description: "Use sparingly above a major section.",
    },
];
let LitLexicalEditor = class LitLexicalEditor extends PublishingElement {
    constructor() {
        super(...arguments);
        this.value = "";
        this.placeholder = "Start drafting...";
        this.editorLabel = "Publishing document editor";
        this.editorTestId = "publishing-document-editor";
        this.readOnly = false;
        this.editorState = createPublishingEditorState({
            value: "",
            commands: lexicalEditorToolbarCommands,
        });
        this.mediaAssets = [];
        this.externalSyncGeneration = 0;
        this.editor = null;
        this.editorRootElement = null;
        this.historyState = createEmptyHistoryState();
        this.markdownValue = "";
        this.canUndo = false;
        this.canRedo = false;
        this.unregisterCallbacks = [];
        this.pendingExternalSyncGeneration = null;
        this.savedSelection = null;
        this.rootKeydownListener = null;
        this.hoveredBlockElement = null;
        this.pendingGutterHoverClearTimer = null;
        this.mountedDecoratorKeys = new Set();
        this.blockMenuListId = `publishing-block-menu-${blockMenuInstanceCounter++}`;
        this.blockMenuTargetKey = null;
        this.gutterTargetKey = null;
        this.pendingImageInsertionContext = null;
        this.floatingToolbarVisible = false;
        this.floatingToolbarPlacement = null;
        this.floatingToolbarFormats = {
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            code: false,
            link: false,
        };
        this.blockMenuOpen = false;
        this.blockMenuQuery = "";
        this.blockMenuActiveIndex = 0;
        this.blockMenuPlacement = null;
        this.gutterPlacement = null;
        this.linkComposerOpen = false;
        this.linkComposerHref = "";
        this.linkComposerSelection = "";
        this.linkComposerPlacement = null;
        this.imagePickerOpen = false;
        this.imagePickerSelection = "";
        this.imagePickerAlt = "";
        this.imagePickerPlacement = null;
        this.blockMenuSource = "slash";
        this.confirmLinkComposer = () => {
            const href = this.linkComposerHref.trim();
            if (href.length === 0 || this.editor === null) {
                this.cancelLinkComposer();
                return;
            }
            const normalizedHref = normalizeLinkHref(href);
            const savedSelection = this.savedSelection?.clone() ?? null;
            const selectionText = this.linkComposerSelection.trim();
            this.editor.update(() => {
                if (savedSelection !== null) {
                    $setSelection(savedSelection);
                }
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }
                if (!selection.isCollapsed()) {
                    this.editor?.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedHref);
                    return;
                }
                const label = selectionText.length > 0
                    ? selectionText
                    : normalizedHref.replace(/^https?:\/\//iu, "");
                const linkNode = new LinkNode(normalizedHref);
                linkNode.append(documentTextNode(label));
                selection.insertNodes([linkNode]);
                selection.insertText(" ");
            });
            this.linkComposerOpen = false;
            this.linkComposerPlacement = null;
            this.clearSavedSelection();
            this.focus("preserve");
        };
        this.cancelLinkComposer = () => {
            this.linkComposerOpen = false;
            this.linkComposerPlacement = null;
            this.linkComposerHref = "";
            this.linkComposerSelection = "";
            this.clearSavedSelection();
            this.focus("preserve");
        };
        this.confirmImagePicker = () => {
            const asset = this.mediaAssets.find((candidate) => candidate.path === this.imagePickerSelection);
            if (!asset) {
                this.cancelImagePicker();
                return;
            }
            const data = {
                src: resolvePublishingStudioAssetPreviewPath(asset.path) ?? asset.path,
                alt: this.imagePickerAlt.trim().length > 0
                    ? this.imagePickerAlt.trim()
                    : asset.label,
                title: asset.label,
                assetId: asset.id,
                label: asset.label,
                source: "url",
                fileName: asset.label,
            };
            const inserted = this.insertBlockNode(() => createImageCard(data), {
                trailingParagraph: true,
                insertionMode: (this.pendingImageInsertionContext?.source ?? this.blockMenuSource) ===
                    "gutter"
                    ? "insert-after"
                    : (this.pendingImageInsertionContext?.targetKey ??
                        this.blockMenuTargetKey) !== null
                        ? "replace-target"
                        : "replace-empty",
                targetKey: this.pendingImageInsertionContext?.targetKey ?? this.blockMenuTargetKey,
            });
            if (!inserted) {
                return;
            }
            this.imagePickerOpen = false;
            this.imagePickerPlacement = null;
            this.pendingImageInsertionContext = null;
            this.clearSavedSelection();
        };
        this.cancelImagePicker = () => {
            this.imagePickerOpen = false;
            this.imagePickerPlacement = null;
            this.imagePickerSelection = "";
            this.imagePickerAlt = "";
            this.pendingImageInsertionContext = null;
            this.clearSavedSelection();
            this.focus("preserve");
        };
        this.handleFloatingToolbarCommand = (commandId) => {
            if (this.editor === null || this.readOnly) {
                return;
            }
            switch (commandId) {
                case "bold":
                    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                    break;
                case "italic":
                    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                    break;
                case "underline":
                    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                    break;
                case "strikethrough":
                    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
                    break;
                case "code":
                    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
                    break;
                case "link":
                    this.openLinkComposer();
                    break;
            }
        };
        this.handleSelectionChange = () => {
            this.syncFloatingToolbarState();
            this.syncGutterPlacement();
        };
        this.handleViewportChange = () => {
            if (this.blockMenuOpen || this.linkComposerOpen || this.imagePickerOpen) {
                this.dismissTransientUi({ restoreFocus: false });
            }
        };
        this.handleEditorCommandKeydown = (event) => {
            if (this.readOnly) {
                return false;
            }
            if (event.key === "Escape") {
                if (this.linkComposerOpen) {
                    event.preventDefault();
                    this.cancelLinkComposer();
                    return true;
                }
                if (this.imagePickerOpen) {
                    event.preventDefault();
                    this.cancelImagePicker();
                    return true;
                }
                if (this.blockMenuOpen) {
                    event.preventDefault();
                    this.closeBlockMenu();
                    return true;
                }
            }
            if (this.blockMenuOpen) {
                return false;
            }
            if (event.key === "/" &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey) {
                const slashTarget = this.resolvePreferredSlashTarget();
                if (slashTarget === null) {
                    return false;
                }
                event.preventDefault();
                this.openBlockMenu(this.resolveSlashMenuPlacement(slashTarget), "slash", slashTarget.targetKey);
                return true;
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                this.openLinkComposer();
                return true;
            }
            return false;
        };
        this.handleEditorKeydown = (event) => {
            if (event.defaultPrevented || this.readOnly) {
                return;
            }
            if (this.blockMenuOpen) {
                this.handleBlockMenuKeydown(event);
                return;
            }
        };
        this.handleImagePickerKeydown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                this.cancelImagePicker();
                return;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                this.confirmImagePicker();
            }
        };
        this.handleGutterInsert = () => {
            const targetKey = this.gutterTargetKey ??
                this.editor?.getEditorState().read(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                        return null;
                    }
                    return getSelectedTopLevelNode(selection)?.getKey() ?? null;
                }) ??
                null;
            const placement = this.gutterPlacement ??
                this.resolvePlacementForTargetKey(targetKey, "gutter") ??
                this.resolveSelectionPlacement();
            this.openBlockMenu(placement, "gutter", targetKey);
        };
        this.handleEditorPointerMove = (event) => {
            this.cancelPendingGutterHoverClear();
            const block = this.resolveHoveredBlock(event.target);
            if (block !== null) {
                this.hoveredBlockElement = block;
            }
            else if (this.hoveredBlockElement === null) {
                this.hoveredBlockElement = null;
            }
            this.syncGutterPlacement();
        };
        this.handleEditorPointerLeave = (event) => {
            if (this.isWithinGutterHoverCorridor(event.relatedTarget)) {
                this.cancelPendingGutterHoverClear();
                return;
            }
            this.schedulePendingGutterHoverClear();
        };
        this.handleGutterButtonPointerEnter = () => {
            this.cancelPendingGutterHoverClear();
        };
        this.handleGutterButtonPointerLeave = (event) => {
            if (this.isWithinGutterHoverCorridor(event.relatedTarget)) {
                this.cancelPendingGutterHoverClear();
                return;
            }
            this.schedulePendingGutterHoverClear();
        };
        this.handleDocumentPointerDown = (event) => {
            const path = event.composedPath();
            if (this.blockMenuOpen &&
                !path.includes(this.blockMenuElement ?? this) &&
                !path.includes(this.gutterButton ?? this)) {
                this.closeBlockMenu();
            }
            if (this.linkComposerOpen &&
                !path.includes(this.linkComposerPanel ?? this)) {
                this.cancelLinkComposer();
            }
            if (this.imagePickerOpen && !path.includes(this.imagePickerPanel ?? this)) {
                this.cancelImagePicker();
            }
        };
        this.handleBlockMenuInput = (event) => {
            this.blockMenuQuery = event.target.value.toLowerCase();
            this.blockMenuActiveIndex = 0;
        };
        this.handleBlockMenuSearchKeydown = (event) => {
            this.handleBlockMenuKeydown(event);
        };
        this.handleLinkComposerInput = (event) => {
            this.linkComposerHref = event.target.value;
        };
        this.handleLinkComposerKeydown = (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.confirmLinkComposer();
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                this.cancelLinkComposer();
            }
        };
        this.handleImagePickerSelection = (event) => {
            const value = event.target.value;
            this.imagePickerSelection = value;
            const asset = this.mediaAssets.find((candidate) => candidate.path === value);
            this.imagePickerAlt = asset?.label ?? "";
        };
        this.handleImageAltInput = (event) => {
            this.imagePickerAlt = event.target.value;
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
        position: relative;
        display: grid;
        gap: 0.7rem;
      }

      .editor-host {
        min-height: 30rem;
      }

      .lexical-contenteditable {
        min-height: 24rem;
        width: min(100%, var(--kit-editorial-measure));
        margin: 0 auto;
        padding: 0.6rem 0 8rem;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: var(--kit-text-primary, #111827);
        font-family: var(--kit-font-family-editor, Georgia, serif);
        font-size: clamp(1.08rem, 1rem + 0.2vw, 1.18rem);
        line-height: 1.9;
        outline: none;
        white-space: pre-wrap;
      }

      .lexical-contenteditable:focus {
        box-shadow: none;
      }

      .lexical-contenteditable p,
      .lexical-contenteditable blockquote,
      .lexical-contenteditable pre,
      .lexical-contenteditable ul,
      .lexical-contenteditable ol,
      .lexical-contenteditable figure {
        margin: 0 0 1rem;
      }

      .lexical-contenteditable > :first-child {
        margin-top: 0;
      }

      .lexical-contenteditable h1,
      .lexical-contenteditable h2,
      .lexical-contenteditable h3 {
        letter-spacing: -0.03em;
        line-height: 1.08;
        margin: 1.95rem 0 0.9rem;
        font-family: var(--kit-font-family-sans, system-ui, sans-serif);
      }

      .lexical-contenteditable h1 {
        font-size: clamp(2.3rem, 2rem + 1vw, 3.25rem);
      }

      .lexical-contenteditable h2 {
        font-size: clamp(1.75rem, 1.55rem + 0.5vw, 2.3rem);
      }

      .lexical-contenteditable h3 {
        font-size: clamp(1.35rem, 1.24rem + 0.3vw, 1.7rem);
      }

      .lexical-contenteditable blockquote {
        margin-left: 0;
        padding-left: 1.15rem;
        border-left: 2px solid
          color-mix(in srgb, var(--kit-color-primary) 22%, transparent);
        color: color-mix(in srgb, var(--kit-text-secondary) 92%, transparent);
      }

      .lexical-contenteditable pre {
        padding: 1rem 1.1rem;
        border-radius: calc(var(--kit-radius-md) + 0.1rem);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 95%,
          transparent
        );
        overflow-x: auto;
        font-family: var(--kit-font-family-mono);
      }

      .lexical-contenteditable hr {
        border: 0;
        border-top: 1px solid var(--kit-editorial-muted-border);
        margin: 1.6rem 0;
      }

      .lexical-contenteditable img {
        display: block;
        width: min(100%, 52rem);
        border-radius: calc(var(--kit-radius-lg) + 0.1rem);
        box-shadow: 0 20px 40px
          color-mix(in srgb, var(--kit-text-primary) 10%, transparent);
      }

      .gutter-button,
      .block-menu-button,
      .composer-button {
        appearance: none;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 96%,
          transparent
        );
        color: var(--kit-text-primary);
        font: inherit;
        cursor: pointer;
      }

      .gutter-button {
        position: fixed;
        z-index: 25;
        width: 2rem;
        height: 2rem;
        padding: 0;
        font-size: 0.98rem;
        font-weight: 700;
        line-height: 1;
        color: var(--kit-editorial-muted-text);
        background: var(--kit-editorial-overlay-surface);
        border-color: var(--kit-editorial-chrome-border);
        box-shadow: var(--kit-editorial-overlay-shadow);
        backdrop-filter: blur(12px);
      }

      .gutter-button:hover {
        color: var(--kit-text-primary);
        background: color-mix(
          in srgb,
          var(--kit-editorial-chrome-surface) 100%,
          transparent
        );
      }

      .block-menu {
        position: fixed;
        z-index: 30;
        display: grid;
        gap: 0.9rem;
        min-width: 22rem;
        max-width: 26rem;
        padding: 1rem;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: calc(var(--kit-radius-lg) + 0.2rem);
        background: var(--kit-editorial-overlay-surface);
        box-shadow: var(--kit-editorial-overlay-shadow);
        backdrop-filter: blur(16px);
      }

      .block-menu[hidden] {
        display: none;
      }

      .block-menu-header {
        display: grid;
        gap: 0.3rem;
      }

      .block-menu-kicker,
      .composer-kicker {
        margin: 0;
        color: var(--kit-editorial-muted-text);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .block-menu-title,
      .composer-title {
        margin: 0;
        color: var(--kit-text-primary);
        font-size: 1rem;
        font-weight: 650;
        letter-spacing: -0.01em;
        line-height: 1.3;
      }

      .block-menu-copy {
        margin: 0;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-sm);
        line-height: 1.5;
      }

      .block-menu-search {
        width: 100%;
        padding: 0.72rem 0.82rem;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
        color: var(--kit-text-primary);
        font: inherit;
      }

      .block-menu-list {
        display: grid;
        gap: 0.6rem;
      }

      .block-menu-group {
        margin: 0 0 0.28rem;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-xs);
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .block-menu-group-items {
        display: grid;
        gap: 0.25rem;
      }

      .block-menu-button {
        display: grid;
        gap: 0.3rem;
        padding: 0.82rem 0.9rem;
        text-align: left;
        border-color: var(--kit-editorial-chrome-border);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 88%,
          transparent
        );
        transition:
          border-color 120ms ease,
          background 120ms ease,
          transform 120ms ease;
      }

      .block-menu-button strong {
        font-size: 0.96rem;
      }

      .block-menu-button span {
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-xs);
        line-height: 1.45;
      }

      .block-menu-button:hover {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 18%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 5%,
          var(--kit-surface-primary)
        );
      }

      .block-menu-button[data-active="true"] {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 34%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 7%,
          var(--kit-surface-primary)
        );
        box-shadow: var(--kit-editorial-focus-ring);
        transform: translateY(-1px);
      }

      .block-menu-empty {
        margin: 0;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-sm);
      }

      .composer-panel {
        position: fixed;
        z-index: 32;
        display: grid;
        gap: 0.85rem;
        width: min(24rem, calc(100vw - 2.8rem));
        padding: 1rem 1rem 1.05rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid var(--kit-editorial-chrome-border);
        background: var(--kit-editorial-overlay-surface);
        box-shadow: var(--kit-editorial-overlay-shadow);
        backdrop-filter: blur(16px);
      }

      .composer-header {
        display: grid;
        gap: 0.3rem;
      }

      .composer-copy {
        margin: 0;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-sm);
        line-height: 1.5;
      }

      .composer-input,
      .composer-select {
        width: 100%;
        padding: 0.72rem 0.8rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid var(--kit-editorial-chrome-border);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
      }

      .image-picker-preview {
        display: grid;
        gap: 0.6rem;
        padding: 0.72rem;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: calc(var(--kit-radius-md) + 0.12rem);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 94%,
          transparent
        );
      }

      .image-picker-preview-frame {
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: calc(var(--kit-radius-md) + 0.08rem);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
      }

      .image-picker-preview-frame img {
        display: block;
        max-width: 100%;
        max-height: 12rem;
        object-fit: contain;
      }

      .image-picker-preview-meta {
        display: grid;
        gap: 0.16rem;
      }

      .image-picker-preview-label,
      .image-picker-preview-path {
        margin: 0;
      }

      .image-picker-preview-label {
        color: var(--kit-text-primary);
        font-size: 0.92rem;
        font-weight: 600;
      }

      .image-picker-preview-path {
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-xs);
        overflow-wrap: anywhere;
      }

      .composer-actions {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.55rem;
      }
    `,
    ]; }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("resize", this.handleViewportChange);
        window.addEventListener("scroll", this.handleViewportChange, true);
        queueMicrotask(() => {
            if (this.isConnected && this.hasUpdated) {
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
        if (changedProperties.has("value") &&
            this.editor !== null &&
            this.value !== this.markdownValue) {
            this.applyValue(this.value);
        }
        if (changedProperties.has("externalSyncGeneration") &&
            this.externalSyncGeneration > 0) {
            this.dismissTransientUi({ restoreFocus: false });
        }
        if (changedProperties.has("linkComposerOpen") &&
            this.linkComposerOpen) {
            queueMicrotask(() => {
                this.linkComposerInput?.focus();
                this.linkComposerInput?.select();
            });
        }
        if (changedProperties.has("imagePickerOpen") &&
            this.imagePickerOpen) {
            queueMicrotask(() => {
                this.imagePickerSelect?.focus();
            });
        }
        if (changedProperties.has("blockMenuOpen") &&
            this.blockMenuOpen) {
            queueMicrotask(() => {
                this.blockMenuSearchInput?.focus();
                this.blockMenuSearchInput?.select();
            });
        }
    }
    getValue() {
        return this.markdownValue;
    }
    setValue(value) {
        this.value = value;
        this.applyValue(value);
    }
    focus(targetOrOptions = "preserve") {
        if (this.editor === null) {
            return;
        }
        const target = typeof targetOrOptions === "string" ? targetOrOptions : "preserve";
        this.editor.update(() => {
            const root = $getRoot();
            if (root.getChildrenSize() === 0) {
                importPublishingMarkdown("");
            }
            switch (target) {
                case "start":
                    root.selectStart();
                    break;
                case "end":
                    root.selectEnd();
                    break;
                default:
                    if ($getSelection() === null) {
                        root.selectEnd();
                    }
            }
        });
        this.editorRootElement?.focus(typeof targetOrOptions === "string" ? undefined : targetOrOptions);
    }
    selectAllText() {
        if (this.editor === null) {
            return false;
        }
        this.editorRootElement?.focus();
        return this.editor.dispatchCommand(SELECT_ALL_COMMAND, new KeyboardEvent("keydown"));
    }
    executeCommand(commandId) {
        if (this.editor === null || this.readOnly) {
            return false;
        }
        switch (commandId) {
            case "undo":
                return this.editor.dispatchCommand(UNDO_COMMAND, undefined);
            case "redo":
                return this.editor.dispatchCommand(REDO_COMMAND, undefined);
            case "bold":
                return this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            case "italic":
                return this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            case "bulleted-list":
                return this.toggleList("bullet");
            case "numbered-list":
                return this.toggleList("number");
            case "heading-1":
                this.toggleHeading("h1");
                return true;
            case "heading-2":
                this.toggleHeading("h2");
                return true;
            case "heading-3":
                this.toggleHeading("h3");
                return true;
            case "quote":
                this.toggleQuote();
                return true;
            case "code-block":
                this.toggleCodeBlock();
                return true;
            case "link":
                this.openLinkComposer();
                return true;
            case "divider":
                this.insertDivider();
                return true;
            case "image":
                this.openImagePicker();
                return true;
        }
    }
    getEditorHtml() {
        return this.editorRootElement?.innerHTML ?? "";
    }
    cleanup() {
        window.removeEventListener("resize", this.handleViewportChange);
        window.removeEventListener("scroll", this.handleViewportChange, true);
        this.cancelPendingGutterHoverClear();
        this.unbindEditor();
    }
    renderContent() {
        const blockMenuItems = this.getFilteredBlockMenuItems();
        const blockMenuSections = groupBlockMenuItems(blockMenuItems);
        const blockMenuPlacement = this.blockMenuPlacement ?? { left: 0, top: 0 };
        const gutterPlacement = this.gutterPlacement;
        const linkComposerStyle = styleForPlacement(this.linkComposerPlacement);
        const imagePickerStyle = styleForPlacement(this.imagePickerPlacement);
        const activeBlockMenuItem = blockMenuItems[this.blockMenuActiveIndex] ?? null;
        const blockMenuTitle = this.blockMenuSource === "gutter"
            ? "Insert after this block"
            : "Turn this block into";
        const blockMenuCopy = this.blockMenuSource === "gutter"
            ? "Choose the next block in the page flow."
            : "Choose the block that should replace this empty paragraph.";
        const selectedImageAsset = this.resolveSelectedImageAsset();
        const selectedImagePreviewPath = selectedImageAsset
            ? resolvePublishingStudioAssetPreviewPath(selectedImageAsset.path)
            : null;
        let optionIndex = 0;
        return html `
      <div class="editor-shell">
        <kit-lexical-floating-toolbar
          .commands=${lexicalFloatingToolbarCommands}
          .activeFormats=${this.floatingToolbarFormats}
          .disabled=${this.readOnly}
          .placement=${this.floatingToolbarPlacement}
          .visible=${this.floatingToolbarVisible}
          .onCommand=${this.handleFloatingToolbarCommand}
        ></kit-lexical-floating-toolbar>

        ${gutterPlacement && !this.readOnly
            ? html `
              <button
                class="gutter-button"
                aria-label="Insert block"
                style=${`left:${gutterPlacement.left}px; top:${gutterPlacement.top}px;`}
                type="button"
                @click=${this.handleGutterInsert}
                @pointerenter=${this.handleGutterButtonPointerEnter}
                @pointerleave=${this.handleGutterButtonPointerLeave}
              >
                +
              </button>
            `
            : nothing}

        <div class="editor-host" part="editor-host"></div>

        <div
          class="block-menu"
          ?hidden=${!this.blockMenuOpen}
          aria-label="Block insert menu"
          role="dialog"
          style=${`left:${blockMenuPlacement.left}px; top:${blockMenuPlacement.top}px;`}
        >
          <header class="block-menu-header">
            <p class="block-menu-kicker">
              ${this.blockMenuSource === "gutter"
            ? "Block insert"
            : "Slash menu"}
            </p>
            <p class="block-menu-title">${blockMenuTitle}</p>
            <p class="block-menu-copy">${blockMenuCopy}</p>
          </header>
          <input
            class="block-menu-search"
            aria-label="Block menu search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls=${this.blockMenuListId}
            aria-expanded=${this.blockMenuOpen ? "true" : "false"}
            aria-activedescendant=${activeBlockMenuItem
            ? this.getBlockMenuOptionId(activeBlockMenuItem)
            : nothing}
            placeholder=${this.blockMenuSource === "gutter"
            ? "Insert after this block"
            : "Search blocks"}
            .value=${this.blockMenuQuery}
            @input=${this.handleBlockMenuInput}
            @keydown=${this.handleBlockMenuSearchKeydown}
          />
          <div
            class="block-menu-list"
            id=${this.blockMenuListId}
            role="listbox"
          >
            ${blockMenuItems.length > 0
            ? blockMenuSections.map(([group, items]) => html `
                    <section>
                      <p class="block-menu-group">${group}</p>
                      <div class="block-menu-group-items">
                        ${items.map((item) => {
                const currentIndex = optionIndex++;
                return html `
                            <div
                              id=${this.getBlockMenuOptionId(item)}
                              class="block-menu-button"
                              aria-selected=${currentIndex ===
                    this.blockMenuActiveIndex
                    ? "true"
                    : "false"}
                              data-active=${currentIndex ===
                    this.blockMenuActiveIndex
                    ? "true"
                    : "false"}
                              role="option"
                              tabindex="-1"
                              @click=${() => this.executeBlockMenuItem(item)}
                            >
                              <strong>${item.label}</strong>
                              <span>${item.description}</span>
                            </div>
                          `;
            })}
                      </div>
                    </section>
                  `)
            : html `<p class="block-menu-empty">
                  No blocks match this search.
                </p>`}
          </div>
        </div>

        ${this.linkComposerOpen
            ? html `
              <section
                class="composer-panel link-composer-panel"
                aria-label="Publishing link composer"
                style=${linkComposerStyle}
              >
                <header class="composer-header">
                  <p class="composer-kicker">Link</p>
                  <p class="composer-title">Insert a canonical link</p>
                  <p class="composer-copy">
                    ${this.linkComposerSelection.length > 0
                ? `Selected text: “${this.linkComposerSelection}”`
                : "Add a markdown link without leaving the page canvas."}
                  </p>
                </header>
                <input
                  class="composer-input link-composer-input"
                  aria-label="Link URL"
                  placeholder="https://example.org"
                  .value=${this.linkComposerHref}
                  @input=${this.handleLinkComposerInput}
                  @keydown=${this.handleLinkComposerKeydown}
                />
                <div class="composer-actions">
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
              </section>
            `
            : nothing}
        ${this.imagePickerOpen
            ? html `
              <section
                class="composer-panel image-picker-panel"
                aria-label="Publishing image picker"
                style=${imagePickerStyle}
              >
                <header class="composer-header">
                  <p class="composer-kicker">Image</p>
                  <p class="composer-title">Insert an image block</p>
                  <p class="composer-copy">
                    Insert an existing asset from <code>content/media/</code> as
                    a visual page block.
                  </p>
                </header>
                <select
                  class="composer-select image-picker-select"
                  aria-label="Image asset"
                  .value=${this.imagePickerSelection}
                  @change=${this.handleImagePickerSelection}
                  @keydown=${this.handleImagePickerKeydown}
                >
                  ${this.mediaAssets.length > 0
                ? this.mediaAssets.map((asset) => html `
                          <option value=${asset.path}>${asset.label}</option>
                        `)
                : html `<option value="">No image assets available</option>`}
                </select>
                ${selectedImagePreviewPath
                ? html `
                      <div class="image-picker-preview">
                        <div class="image-picker-preview-frame">
                          <img
                            alt=${selectedImageAsset?.label ??
                    "Selected media preview"}
                            src=${selectedImagePreviewPath}
                          />
                        </div>
                        <div class="image-picker-preview-meta">
                          <p class="image-picker-preview-label">
                            ${selectedImageAsset?.label ??
                    this.imagePickerSelection}
                          </p>
                          <p class="image-picker-preview-path">
                            ${selectedImageAsset?.path ??
                    this.imagePickerSelection}
                          </p>
                        </div>
                      </div>
                    `
                : nothing}
                <input
                  class="composer-input"
                  aria-label="Image alt text"
                  placeholder="Describe the image"
                  .value=${this.imagePickerAlt}
                  @input=${this.handleImageAltInput}
                  @keydown=${this.handleImagePickerKeydown}
                />
                <div class="composer-actions">
                  <button
                    class="composer-button"
                    type="button"
                    ?disabled=${this.mediaAssets.length === 0}
                    @click=${this.confirmImagePicker}
                  >
                    Insert image
                  </button>
                  <button
                    class="composer-button"
                    type="button"
                    @click=${this.cancelImagePicker}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            `
            : nothing}
      </div>
    `;
    }
    mountEditor() {
        if (!this.editorHost) {
            return;
        }
        this.ensureEditor();
        this.unbindEditor();
        const rootElement = document.createElement("div");
        rootElement.className = "lexical-contenteditable";
        rootElement.contentEditable = this.readOnly ? "false" : "true";
        rootElement.setAttribute("role", "textbox");
        rootElement.setAttribute("aria-multiline", "true");
        rootElement.setAttribute("aria-label", this.editorLabel);
        rootElement.setAttribute("data-testid", this.editorTestId);
        rootElement.dataset.placeholder = this.placeholder;
        this.editorHost.replaceChildren(rootElement);
        this.editorRootElement = rootElement;
        this.editor?.setRootElement(rootElement);
        this.editor?.setEditable(!this.readOnly);
        this.registerEditorLifecycle();
        this.applyValue(this.value);
        this.syncSnapshot();
    }
    ensureEditor() {
        if (this.editor !== null) {
            return;
        }
        this.editor = createEditor({
            editable: !this.readOnly,
            namespace: "citadel-publishing-lexical-editor",
            nodes: [...publishingLexicalNodes],
            onError(error) {
                throw error;
            },
        });
    }
    registerEditorLifecycle() {
        if (this.editor === null) {
            return;
        }
        this.unregisterCallbacks.push(registerRichText(this.editor));
        this.unregisterCallbacks.push(registerHistory(this.editor, this.historyState, 300));
        this.unregisterCallbacks.push(registerList(this.editor));
        this.unregisterCallbacks.push(registerMarkdownShortcuts(this.editor, [
            ...publishingMarkdownTransformers,
        ]));
        this.unregisterCallbacks.push(this.editor.registerCommand(KEY_DOWN_COMMAND, (event) => this.handleEditorCommandKeydown(event), COMMAND_PRIORITY_EDITOR));
        this.unregisterCallbacks.push(this.editor.registerCommand(CAN_UNDO_COMMAND, (payload) => {
            this.canUndo = payload;
            this.syncCommandState();
            return false;
        }, COMMAND_PRIORITY_EDITOR));
        this.unregisterCallbacks.push(this.editor.registerCommand(CAN_REDO_COMMAND, (payload) => {
            this.canRedo = payload;
            this.syncCommandState();
            return false;
        }, COMMAND_PRIORITY_EDITOR));
        this.unregisterCallbacks.push(this.editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
            this.syncCommandState();
            this.syncFloatingToolbarState();
            this.syncGutterPlacement();
            return false;
        }, COMMAND_PRIORITY_EDITOR));
        document.addEventListener("selectionchange", this.handleSelectionChange);
        this.unregisterCallbacks.push(() => {
            document.removeEventListener("selectionchange", this.handleSelectionChange);
        });
        this.unregisterCallbacks.push(this.editor.registerUpdateListener(() => {
            this.syncSnapshot(true);
            this.syncFloatingToolbarState();
            this.syncGutterPlacement();
        }));
        this.unregisterCallbacks.push(this.editor.registerDecoratorListener((decorators) => {
            this.syncMountedDecorators(decorators);
        }));
        if (this.editorRootElement !== null) {
            this.rootKeydownListener = this.handleEditorKeydown;
            this.editorRootElement.addEventListener("keydown", this.rootKeydownListener);
            this.editorHost?.addEventListener("pointermove", this.handleEditorPointerMove);
            this.editorHost?.addEventListener("pointerleave", this.handleEditorPointerLeave);
            this.unregisterCallbacks.push(() => {
                if (this.editorRootElement && this.rootKeydownListener) {
                    this.editorRootElement.removeEventListener("keydown", this.rootKeydownListener);
                }
                this.editorHost?.removeEventListener("pointermove", this.handleEditorPointerMove);
                this.editorHost?.removeEventListener("pointerleave", this.handleEditorPointerLeave);
                this.rootKeydownListener = null;
            });
        }
        document.addEventListener("pointerdown", this.handleDocumentPointerDown);
        this.unregisterCallbacks.push(() => {
            document.removeEventListener("pointerdown", this.handleDocumentPointerDown);
        });
    }
    unbindEditor() {
        this.cancelPendingGutterHoverClear();
        while (this.unregisterCallbacks.length > 0) {
            this.unregisterCallbacks.pop()?.();
        }
        this.editor?.setRootElement(null);
        this.hoveredBlockElement = null;
        this.clearMountedDecorators();
        this.editorRootElement = null;
        this.editorHost?.replaceChildren();
    }
    syncMountedDecorators(decorators) {
        if (this.editor === null) {
            return;
        }
        const nextKeys = new Set(Object.keys(decorators));
        for (const key of this.mountedDecoratorKeys) {
            if (nextKeys.has(key)) {
                continue;
            }
            this.editor.getElementByKey(key)?.replaceChildren();
            this.mountedDecoratorKeys.delete(key);
        }
        for (const [key, decorator] of Object.entries(decorators)) {
            if (!(decorator instanceof HTMLElement)) {
                continue;
            }
            const host = this.editor.getElementByKey(key);
            if (!host) {
                continue;
            }
            if (host.firstElementChild === decorator &&
                host.childElementCount === 1) {
                this.mountedDecoratorKeys.add(key);
                continue;
            }
            host.replaceChildren(decorator);
            this.mountedDecoratorKeys.add(key);
        }
    }
    clearMountedDecorators() {
        if (this.editor !== null) {
            for (const key of this.mountedDecoratorKeys) {
                this.editor.getElementByKey(key)?.replaceChildren();
            }
        }
        this.mountedDecoratorKeys.clear();
    }
    applyValue(value) {
        if (this.editor === null) {
            this.markdownValue = value;
            this.setEditorState(createPublishingEditorState({
                value,
                commands: lexicalEditorToolbarCommands,
                canUndo: this.canUndo,
                canRedo: this.canRedo,
                commandStates: createPublishingCommandStateMap(lexicalEditorToolbarCommands, this.readOnly),
            }));
            return;
        }
        this.pendingExternalSyncGeneration =
            this.externalSyncGeneration > 0 ? this.externalSyncGeneration : null;
        this.editor.update(() => {
            importPublishingMarkdown(value);
        }, { discrete: true });
        this.markdownValue = value;
    }
    toggleHeading(tag) {
        this.editor?.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }
            const topLevelNode = getSelectedTopLevelNode(selection);
            const shouldReset = $isHeadingNode(topLevelNode) && topLevelNode.getTag() === tag;
            $setBlocksType(selection, () => {
                return shouldReset ? createEmptyParagraph() : $createHeadingNode(tag);
            });
        });
    }
    toggleQuote() {
        this.editor?.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }
            const topLevelNode = getSelectedTopLevelNode(selection);
            $setBlocksType(selection, () => {
                return $isQuoteNode(topLevelNode)
                    ? createEmptyParagraph()
                    : $createQuoteNode();
            });
        });
    }
    toggleCodeBlock() {
        this.editor?.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }
            const topLevelNode = getSelectedTopLevelNode(selection);
            $setBlocksType(selection, () => {
                return $isCodeNode(topLevelNode)
                    ? createEmptyParagraph()
                    : $createCodeNode();
            });
        });
    }
    toggleList(listType) {
        if (this.editor === null) {
            return false;
        }
        const isActive = this.editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return false;
            }
            return hasParentNode(selection.anchor.getNode(), (node) => {
                return $isListNode(node) && node.getListType() === listType;
            });
        });
        if (isActive) {
            return this.editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        return this.editor.dispatchCommand(listType === "bullet"
            ? INSERT_UNORDERED_LIST_COMMAND
            : INSERT_ORDERED_LIST_COMMAND, undefined);
    }
    insertDivider() {
        this.insertBlockNode(() => createDividerCard(), {
            trailingParagraph: true,
        });
    }
    openLinkComposer() {
        if (this.editor === null || this.readOnly) {
            return;
        }
        const detail = this.editor.getEditorState().read(() => {
            const selection = this.savedSelection ?? $getSelection();
            if (!$isRangeSelection(selection)) {
                return null;
            }
            const selectionClone = selection.clone();
            const selectedText = selection.getTextContent().trim();
            const linkNode = findMatchingParent(selection.anchor.getNode(), (node) => $isLinkNode(node));
            return {
                selection: selectionClone,
                selectedText,
                href: linkNode instanceof LinkNode
                    ? linkNode.getURL()
                    : normalizeLinkHref(selectedText),
            };
        });
        if (detail === null) {
            return;
        }
        this.savedSelection = detail.selection;
        this.linkComposerSelection = detail.selectedText;
        this.linkComposerHref = detail.href;
        this.linkComposerPlacement = this.resolveSelectionOverlayPlacement();
        this.closeBlockMenu({ preserveSelection: true });
        this.imagePickerOpen = false;
        this.imagePickerPlacement = null;
        this.linkComposerOpen = true;
    }
    openImagePicker() {
        if (this.readOnly) {
            return;
        }
        this.savedSelection =
            this.savedSelection ??
                this.editor?.getEditorState().read(() => {
                    const selection = $getSelection();
                    return $isRangeSelection(selection) ? selection.clone() : null;
                }) ??
                null;
        const selectedAsset = this.resolveSelectedImageAsset() ?? this.mediaAssets[0] ?? null;
        this.imagePickerSelection = selectedAsset?.path ?? "";
        this.imagePickerAlt = selectedAsset?.label ?? "";
        this.imagePickerPlacement = this.resolveContextualOverlayPlacement();
        this.closeBlockMenu({ preserveSelection: true });
        this.linkComposerOpen = false;
        this.linkComposerPlacement = null;
        this.imagePickerOpen = true;
    }
    insertBlockNode(input, options = {}) {
        if (this.editor === null) {
            return false;
        }
        const savedSelection = this.savedSelection?.clone() ?? null;
        let inserted = false;
        this.editor.update(() => {
            const node = typeof input === "function" ? input() : input;
            const insertionMode = options.insertionMode ?? "replace-empty";
            if (options.targetKey !== undefined && options.targetKey !== null) {
                const explicitTarget = $getNodeByKey(options.targetKey);
                if (explicitTarget === null || !explicitTarget.isAttached()) {
                    return;
                }
                if (insertionMode === "replace-target") {
                    explicitTarget.replace(node);
                    focusInsertedNode(node, options.trailingParagraph ?? false);
                    inserted = true;
                    return;
                }
                if (insertionMode === "replace-empty" &&
                    isEmptyParagraph(explicitTarget)) {
                    explicitTarget.replace(node);
                    focusInsertedNode(node, options.trailingParagraph ?? false);
                    inserted = true;
                    return;
                }
                explicitTarget.insertAfter(node);
                focusInsertedNode(node, options.trailingParagraph ?? false);
                inserted = true;
                return;
            }
            if (savedSelection !== null) {
                $setSelection(savedSelection);
            }
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                const root = $getRoot();
                root.append(node);
                focusInsertedNode(node, options.trailingParagraph ?? false);
                inserted = true;
                return;
            }
            const topLevelNode = getSelectedTopLevelNode(selection);
            if (insertionMode === "replace-empty" &&
                topLevelNode &&
                isEmptyParagraph(topLevelNode)) {
                topLevelNode.replace(node);
                focusInsertedNode(node, options.trailingParagraph ?? false);
                inserted = true;
                return;
            }
            if (topLevelNode) {
                topLevelNode.insertAfter(node);
                focusInsertedNode(node, options.trailingParagraph ?? false);
                inserted = true;
                return;
            }
            const root = $getRoot();
            root.append(node);
            focusInsertedNode(node, options.trailingParagraph ?? false);
            inserted = true;
        });
        if (!inserted) {
            return false;
        }
        this.clearSavedSelection();
        this.focus("preserve");
        return true;
    }
    clearSavedSelection() {
        this.savedSelection = null;
    }
    dismissTransientUi(options = {}) {
        if (!options.preserveBlockMenu) {
            this.closeBlockMenu({ preserveSelection: options.preserveSelection });
        }
        this.linkComposerOpen = false;
        this.linkComposerPlacement = null;
        this.linkComposerHref = "";
        this.linkComposerSelection = "";
        this.imagePickerOpen = false;
        this.imagePickerPlacement = null;
        this.imagePickerSelection = "";
        this.imagePickerAlt = "";
        this.pendingImageInsertionContext = null;
        if (!options.preserveSelection) {
            this.clearSavedSelection();
        }
        if (options.restoreFocus) {
            this.focus("preserve");
        }
    }
    resolveSelectionOverlayPlacement() {
        const rect = this.resolveSelectionClientRect();
        if (rect) {
            return clampPopoverPlacement(rect.left + rect.width / 2 - 176, rect.bottom + 12);
        }
        return this.resolveContextualOverlayPlacement();
    }
    resolveContextualOverlayPlacement() {
        if (this.blockMenuPlacement) {
            return clampPopoverPlacement(this.blockMenuPlacement.left + 12, this.blockMenuPlacement.top + 12);
        }
        if (this.gutterPlacement) {
            return clampPopoverPlacement(this.gutterPlacement.left + 44, this.gutterPlacement.top + 16);
        }
        return this.resolveSelectionPlacement();
    }
    resolvePreferredSlashTarget() {
        if (this.editor === null) {
            return null;
        }
        const domParagraph = this.resolveDomSelectedEmptyParagraphElement();
        if (domParagraph !== null) {
            const domTargetKey = this.editor.read(() => {
                const lexicalNode = $getNearestNodeFromDOMNode(domParagraph);
                const topLevelNode = lexicalNode?.getTopLevelElementOrThrow() ?? null;
                if (topLevelNode === null ||
                    !topLevelNode.isAttached() ||
                    !isEmptyPlainParagraphNode(topLevelNode)) {
                    return null;
                }
                return topLevelNode.getKey();
            });
            if (domTargetKey !== null) {
                return {
                    targetKey: domTargetKey,
                    targetElement: domParagraph,
                };
            }
        }
        const selectionTargetKey = this.editor.read(() => getCollapsedEmptyPlainParagraphSelectionTargetKey($getSelection()));
        if (selectionTargetKey === null) {
            return null;
        }
        const selectionTargetElement = this.editor.getElementByKey(selectionTargetKey);
        return {
            targetKey: selectionTargetKey,
            targetElement: selectionTargetElement instanceof HTMLElement
                ? selectionTargetElement
                : null,
        };
    }
    resolveSelectionClientRect() {
        const selection = window.getSelection();
        if (selection === null || selection.rangeCount === 0) {
            return null;
        }
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        return rect.width === 0 && rect.height === 0 ? null : rect;
    }
    handleBlockMenuKeydown(event) {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                this.moveBlockMenu(1);
                return;
            case "ArrowUp":
                event.preventDefault();
                this.moveBlockMenu(-1);
                return;
            case "Enter":
                event.preventDefault();
                this.confirmBlockMenu();
                return;
            case "Escape":
                event.preventDefault();
                this.closeBlockMenu();
                return;
            case "Backspace":
                event.preventDefault();
                this.blockMenuQuery = this.blockMenuQuery.slice(0, -1);
                this.blockMenuActiveIndex = 0;
                return;
            default:
                break;
        }
        if (event.key.length === 1 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey) {
            event.preventDefault();
            if (event.key === " ") {
                this.closeBlockMenu();
                return;
            }
            this.blockMenuQuery = `${this.blockMenuQuery}${event.key.toLowerCase()}`;
            this.blockMenuActiveIndex = 0;
        }
    }
    syncSnapshot(emitChange = false) {
        if (this.editor === null) {
            this.syncCommandState();
            this.syncFloatingToolbarState();
            this.syncGutterPlacement();
            return;
        }
        const nextSnapshot = this.editor.getEditorState().read(() => {
            return {
                markdown: serializePublishingMarkdown(),
                commandStates: this.createCommandStates($getSelection()),
            };
        });
        const changed = nextSnapshot.markdown !== this.markdownValue;
        const origin = this.pendingExternalSyncGeneration !== null ? "external-sync" : "user";
        const syncGeneration = this.pendingExternalSyncGeneration ?? undefined;
        this.markdownValue = nextSnapshot.markdown;
        this.value = nextSnapshot.markdown;
        this.setEditorState(createPublishingEditorState({
            value: nextSnapshot.markdown,
            commands: lexicalEditorToolbarCommands,
            commandStates: nextSnapshot.commandStates,
            canUndo: this.canUndo,
            canRedo: this.canRedo,
            readOnly: this.readOnly,
        }));
        if (emitChange && changed) {
            this.emitEvent("publishing-change", {
                value: nextSnapshot.markdown,
                origin,
                editorKind: "lexical",
                syncGeneration,
            });
        }
        if (this.pendingExternalSyncGeneration !== null) {
            this.pendingExternalSyncGeneration = null;
        }
    }
    syncCommandState() {
        this.setEditorState(createPublishingEditorState({
            value: this.markdownValue,
            commands: lexicalEditorToolbarCommands,
            commandStates: this.editor === null
                ? createPublishingCommandStateMap(lexicalEditorToolbarCommands, this.readOnly)
                : this.editor
                    .getEditorState()
                    .read(() => this.createCommandStates($getSelection())),
            canUndo: this.canUndo,
            canRedo: this.canRedo,
            readOnly: this.readOnly,
        }));
    }
    setEditorState(nextState) {
        this.editorState = nextState;
        this.emitEvent("publishing-editor-state-change", {
            state: nextState,
        });
    }
    syncFloatingToolbarState() {
        if (this.editor === null ||
            this.readOnly ||
            this.blockMenuOpen ||
            this.linkComposerOpen ||
            this.imagePickerOpen) {
            this.floatingToolbarVisible = false;
            this.floatingToolbarPlacement = null;
            this.floatingToolbarFormats = {
                bold: false,
                italic: false,
                underline: false,
                strikethrough: false,
                code: false,
                link: false,
            };
            return;
        }
        const domSelection = window.getSelection();
        if (domSelection === null ||
            domSelection.rangeCount === 0 ||
            domSelection.isCollapsed ||
            this.editorRootElement === null) {
            this.floatingToolbarVisible = false;
            this.floatingToolbarPlacement = null;
            return;
        }
        const range = domSelection.getRangeAt(0);
        if (!this.editorRootElement.contains(range.commonAncestorContainer)) {
            this.floatingToolbarVisible = false;
            this.floatingToolbarPlacement = null;
            return;
        }
        const selectionState = this.editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return null;
            }
            return {
                bold: selection.hasFormat("bold"),
                italic: selection.hasFormat("italic"),
                underline: selection.hasFormat("underline"),
                strikethrough: selection.hasFormat("strikethrough"),
                code: selection.hasFormat("code"),
                link: hasParentNode(selection.anchor.getNode(), (node) => {
                    return $isLinkNode(node);
                }),
            };
        });
        if (selectionState === null) {
            this.floatingToolbarVisible = false;
            this.floatingToolbarPlacement = null;
            return;
        }
        const rect = range.getBoundingClientRect();
        const left = Math.max(rect.left + rect.width / 2, 12);
        const top = Math.max(rect.top, 12);
        this.floatingToolbarVisible = true;
        this.floatingToolbarPlacement = { left, top };
        this.floatingToolbarFormats = selectionState;
    }
    syncGutterPlacement() {
        if (this.editor === null ||
            !supportsFinePointer() ||
            this.readOnly ||
            this.blockMenuOpen ||
            this.linkComposerOpen ||
            this.imagePickerOpen) {
            this.gutterPlacement = null;
            return;
        }
        if (this.hoveredBlockElement !== null) {
            const hoveredPlacement = this.resolvePlacementForBlock(this.hoveredBlockElement);
            const hoveredTargetKey = this.resolveTopLevelKeyForBlock(this.hoveredBlockElement);
            if (hoveredPlacement !== null && hoveredTargetKey !== null) {
                this.gutterPlacement = hoveredPlacement;
                this.gutterTargetKey = hoveredTargetKey;
                return;
            }
        }
        const placement = this.editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                return null;
            }
            const topLevelNode = getSelectedTopLevelNode(selection);
            if (topLevelNode === null) {
                return null;
            }
            return topLevelNode.getKey();
        });
        if (placement === null) {
            this.gutterPlacement = null;
            this.gutterTargetKey = null;
            return;
        }
        const blockElement = this.editor.getElementByKey(placement);
        if (!blockElement) {
            this.gutterPlacement = null;
            this.gutterTargetKey = null;
            return;
        }
        const resolvedPlacement = this.resolvePlacementForBlock(blockElement);
        this.gutterPlacement = resolvedPlacement;
        this.gutterTargetKey = resolvedPlacement === null ? null : placement;
    }
    createCommandStates(selection) {
        const commandStates = {
            ...createPublishingCommandStateMap(lexicalEditorToolbarCommands, this.readOnly),
        };
        const hasRangeSelection = $isRangeSelection(selection);
        const topLevelNode = hasRangeSelection
            ? getSelectedTopLevelNode(selection)
            : null;
        const anchorNode = hasRangeSelection ? selection.anchor.getNode() : null;
        commandStates.undo = {
            active: false,
            disabled: this.readOnly || !this.canUndo,
        };
        commandStates.redo = {
            active: false,
            disabled: this.readOnly || !this.canRedo,
        };
        commandStates.bold = {
            active: hasRangeSelection ? selection.hasFormat("bold") : false,
            disabled: this.readOnly,
        };
        commandStates.italic = {
            active: hasRangeSelection ? selection.hasFormat("italic") : false,
            disabled: this.readOnly,
        };
        commandStates["heading-1"] = {
            active: $isHeadingNode(topLevelNode) && topLevelNode.getTag() === "h1",
            disabled: this.readOnly,
        };
        commandStates["heading-2"] = {
            active: $isHeadingNode(topLevelNode) && topLevelNode.getTag() === "h2",
            disabled: this.readOnly,
        };
        commandStates["heading-3"] = {
            active: $isHeadingNode(topLevelNode) && topLevelNode.getTag() === "h3",
            disabled: this.readOnly,
        };
        commandStates.quote = {
            active: $isQuoteNode(topLevelNode),
            disabled: this.readOnly,
        };
        commandStates["bulleted-list"] = {
            active: hasParentNode(anchorNode, (node) => $isListNode(node) && node.getListType() === "bullet"),
            disabled: this.readOnly,
        };
        commandStates["numbered-list"] = {
            active: hasParentNode(anchorNode, (node) => $isListNode(node) && node.getListType() === "number"),
            disabled: this.readOnly,
        };
        commandStates["code-block"] = {
            active: $isCodeNode(topLevelNode),
            disabled: this.readOnly,
        };
        commandStates.link = {
            active: hasParentNode(anchorNode, (node) => $isLinkNode(node)),
            disabled: this.readOnly,
        };
        commandStates.divider = {
            active: topLevelNode instanceof DividerCardNode,
            disabled: this.readOnly,
        };
        commandStates.image = {
            active: topLevelNode instanceof ImageCardNode,
            disabled: this.readOnly || this.mediaAssets.length === 0,
        };
        return commandStates;
    }
    resolveSelectionPlacement() {
        const selection = window.getSelection();
        if (selection !== null && selection.rangeCount > 0) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                return clampPopoverPlacement(rect.left, rect.bottom + 8);
            }
        }
        const hostRect = this.editorRootElement?.getBoundingClientRect();
        if (hostRect) {
            return clampPopoverPlacement(hostRect.left + 24, hostRect.top + 24);
        }
        return clampPopoverPlacement(24, 24);
    }
    resolveSlashMenuPlacement(target) {
        if (target?.targetElement !== null && target?.targetElement !== undefined) {
            return this.resolveMenuPlacementForBlock(target.targetElement);
        }
        const targetPlacement = this.resolvePlacementForTargetKey(target?.targetKey ?? null, "menu");
        if (targetPlacement !== null) {
            return targetPlacement;
        }
        const paragraph = this.resolveDomSelectedEmptyParagraphElement();
        if (paragraph !== null) {
            return this.resolveMenuPlacementForBlock(paragraph);
        }
        return this.resolveSelectionPlacement();
    }
    openBlockMenu(placement, source = "slash", targetKey = null) {
        this.cancelPendingGutterHoverClear();
        this.savedSelection =
            this.editor?.getEditorState().read(() => {
                const selection = $getSelection();
                return $isRangeSelection(selection) ? selection.clone() : null;
            }) ?? null;
        this.blockMenuOpen = true;
        this.blockMenuSource = source;
        this.blockMenuTargetKey = targetKey;
        this.blockMenuQuery = "";
        this.blockMenuActiveIndex = 0;
        this.blockMenuPlacement = placement;
        this.dismissTransientUi({
            preserveBlockMenu: true,
            preserveSelection: true,
            restoreFocus: false,
        });
        this.syncFloatingToolbarState();
    }
    closeBlockMenu(options = {}) {
        this.blockMenuOpen = false;
        this.blockMenuSource = "slash";
        this.blockMenuTargetKey = null;
        this.blockMenuQuery = "";
        this.blockMenuActiveIndex = 0;
        this.blockMenuPlacement = null;
        if (!options.preserveSelection) {
            this.clearSavedSelection();
        }
    }
    moveBlockMenu(delta) {
        const items = this.getFilteredBlockMenuItems();
        if (items.length === 0) {
            return;
        }
        this.blockMenuActiveIndex =
            (this.blockMenuActiveIndex + delta + items.length) % items.length;
    }
    confirmBlockMenu() {
        const item = this.getFilteredBlockMenuItems()[this.blockMenuActiveIndex];
        if (item) {
            this.executeBlockMenuItem(item);
        }
    }
    executeBlockMenuItem(item) {
        const insertionMode = this.blockMenuSource === "gutter"
            ? "insert-after"
            : this.blockMenuTargetKey !== null
                ? "replace-target"
                : "replace-empty";
        const targetKey = this.blockMenuTargetKey;
        let inserted = false;
        switch (item.id) {
            case "paragraph":
                inserted = this.insertBlockNode(() => createEmptyParagraph(), {
                    insertionMode,
                    targetKey,
                });
                break;
            case "heading-1":
                inserted = this.insertBlockNode(() => $createHeadingNode("h1"), {
                    insertionMode,
                    targetKey,
                });
                break;
            case "heading-2":
                inserted = this.insertBlockNode(() => $createHeadingNode("h2"), {
                    insertionMode,
                    targetKey,
                });
                break;
            case "heading-3":
                inserted = this.insertBlockNode(() => $createHeadingNode("h3"), {
                    insertionMode,
                    targetKey,
                });
                break;
            case "bulleted-list": {
                inserted = this.insertBlockNode(() => {
                    const list = $createListNode("bullet");
                    list.append($createListItemNode());
                    return list;
                }, { insertionMode, targetKey });
                break;
            }
            case "numbered-list": {
                inserted = this.insertBlockNode(() => {
                    const list = $createListNode("number");
                    list.append($createListItemNode());
                    return list;
                }, { insertionMode, targetKey });
                break;
            }
            case "quote":
                inserted = this.insertBlockNode(() => $createQuoteNode(), {
                    insertionMode,
                    targetKey,
                });
                break;
            case "code-block":
                inserted = this.insertBlockNode(() => $createCodeNode(), {
                    insertionMode,
                    targetKey,
                });
                break;
            case "divider":
                inserted = this.insertBlockNode(() => createDividerCard(), {
                    trailingParagraph: true,
                    insertionMode,
                    targetKey,
                });
                break;
            case "image":
                this.pendingImageInsertionContext = {
                    source: this.blockMenuSource,
                    targetKey,
                };
                this.openImagePicker();
                return;
        }
        if (inserted) {
            this.closeBlockMenu();
        }
    }
    resolveHoveredBlock(target) {
        if (!(target instanceof Node) || this.editorRootElement === null) {
            return null;
        }
        let candidate = target instanceof HTMLElement ? target : target.parentElement;
        while (candidate && candidate !== this.editorRootElement) {
            if (candidate.parentElement === this.editorRootElement) {
                return isEligibleInsertionBlockElement(candidate) ? candidate : null;
            }
            candidate = candidate.parentElement;
        }
        return null;
    }
    resolvePlacementForBlock(block) {
        if (!isEligibleInsertionBlockElement(block)) {
            return null;
        }
        const rect = block.getBoundingClientRect();
        return clampPopoverPlacement(rect.left - 46, rect.top + Math.min(rect.height * 0.2, 10));
    }
    resolveMenuPlacementForBlock(block) {
        const rect = block.getBoundingClientRect();
        return clampPopoverPlacement(rect.left + Math.min(Math.max(rect.width * 0.15, 16), 28), rect.bottom + 10);
    }
    resolvePlacementForTargetKey(targetKey, mode) {
        if (this.editor === null || targetKey === null) {
            return null;
        }
        const block = this.editor.getElementByKey(targetKey);
        if (!(block instanceof HTMLElement)) {
            return null;
        }
        return mode === "gutter"
            ? this.resolvePlacementForBlock(block)
            : this.resolveMenuPlacementForBlock(block);
    }
    resolveDomSelectedEmptyParagraphElement() {
        if (this.editorRootElement === null) {
            return null;
        }
        return getDomSelectedEmptyPlainParagraph(this.editorRootElement);
    }
    isWithinGutterHoverCorridor(target) {
        if (!(target instanceof Node)) {
            return false;
        }
        return ((this.editorHost?.contains(target) ?? false) ||
            (this.editorRootElement?.contains(target) ?? false) ||
            (this.gutterButton?.contains(target) ?? false));
    }
    schedulePendingGutterHoverClear() {
        if (this.hoveredBlockElement === null) {
            return;
        }
        this.cancelPendingGutterHoverClear();
        this.pendingGutterHoverClearTimer = window.setTimeout(() => {
            this.pendingGutterHoverClearTimer = null;
            this.hoveredBlockElement = null;
            this.syncGutterPlacement();
        }, GUTTER_HOVER_EXIT_GRACE_MS);
    }
    cancelPendingGutterHoverClear() {
        if (this.pendingGutterHoverClearTimer === null) {
            return;
        }
        window.clearTimeout(this.pendingGutterHoverClearTimer);
        this.pendingGutterHoverClearTimer = null;
    }
    getFilteredBlockMenuItems() {
        const query = this.blockMenuQuery.trim().toLowerCase();
        const items = this.mediaAssets.length === 0
            ? BLOCK_MENU_ITEMS.filter((item) => item.id !== "image")
            : BLOCK_MENU_ITEMS;
        if (query.length === 0) {
            return items;
        }
        return items.filter((item) => {
            const haystack = `${item.label} ${item.description}`.toLowerCase();
            return haystack.includes(query);
        });
    }
    getBlockMenuOptionId(item) {
        return `${this.blockMenuListId}-${item.id}`;
    }
    resolveTopLevelKeyForBlock(block) {
        if (block === null || this.editor === null) {
            return null;
        }
        return this.editor.read(() => {
            const lexicalNode = $getNearestNodeFromDOMNode(block);
            return lexicalNode?.getTopLevelElementOrThrow().getKey() ?? null;
        });
    }
    resolveSelectedImageAsset() {
        if (this.imagePickerSelection.length > 0) {
            return (this.mediaAssets.find((candidate) => candidate.path === this.imagePickerSelection) ?? null);
        }
        return this.mediaAssets[0] ?? null;
    }
};
__decorate([
    property()
], LitLexicalEditor.prototype, "value", void 0);
__decorate([
    property()
], LitLexicalEditor.prototype, "placeholder", void 0);
__decorate([
    property({ attribute: "editor-label" })
], LitLexicalEditor.prototype, "editorLabel", void 0);
__decorate([
    property({ attribute: "editor-testid" })
], LitLexicalEditor.prototype, "editorTestId", void 0);
__decorate([
    property({ type: Boolean, attribute: "read-only", reflect: true })
], LitLexicalEditor.prototype, "readOnly", void 0);
__decorate([
    property({ attribute: false })
], LitLexicalEditor.prototype, "editorState", void 0);
__decorate([
    property({ attribute: false })
], LitLexicalEditor.prototype, "mediaAssets", void 0);
__decorate([
    property({ attribute: false })
], LitLexicalEditor.prototype, "externalSyncGeneration", void 0);
__decorate([
    query(".editor-shell")
], LitLexicalEditor.prototype, "editorShell", void 0);
__decorate([
    query(".editor-host")
], LitLexicalEditor.prototype, "editorHost", void 0);
__decorate([
    query(".block-menu")
], LitLexicalEditor.prototype, "blockMenuElement", void 0);
__decorate([
    query(".block-menu-search")
], LitLexicalEditor.prototype, "blockMenuSearchInput", void 0);
__decorate([
    query(".gutter-button")
], LitLexicalEditor.prototype, "gutterButton", void 0);
__decorate([
    query(".link-composer-input")
], LitLexicalEditor.prototype, "linkComposerInput", void 0);
__decorate([
    query(".image-picker-select")
], LitLexicalEditor.prototype, "imagePickerSelect", void 0);
__decorate([
    query(".image-picker-panel")
], LitLexicalEditor.prototype, "imagePickerPanel", void 0);
__decorate([
    query(".link-composer-panel")
], LitLexicalEditor.prototype, "linkComposerPanel", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "floatingToolbarVisible", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "floatingToolbarPlacement", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "floatingToolbarFormats", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "blockMenuOpen", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "blockMenuQuery", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "blockMenuActiveIndex", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "blockMenuPlacement", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "gutterPlacement", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "linkComposerOpen", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "linkComposerHref", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "linkComposerSelection", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "linkComposerPlacement", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "imagePickerOpen", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "imagePickerSelection", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "imagePickerAlt", void 0);
__decorate([
    state()
], LitLexicalEditor.prototype, "imagePickerPlacement", void 0);
LitLexicalEditor = __decorate([
    customElement("kit-lexical-editor")
], LitLexicalEditor);
export { LitLexicalEditor };
function createEmptyParagraph() {
    return $createParagraphNode();
}
function createParagraph() {
    return $createParagraphNode();
}
function documentTextNode(text) {
    return $createTextNode(text);
}
function getSelectedTopLevelNode(selection) {
    if (!$isRangeSelection(selection)) {
        return null;
    }
    return selection.anchor.getNode().getTopLevelElementOrThrow();
}
function hasParentNode(node, predicate) {
    return findMatchingParent(node, predicate) !== null;
}
function findMatchingParent(node, predicate) {
    let current = node;
    while (current !== null) {
        if (predicate(current)) {
            return current;
        }
        current = current.getParent();
    }
    return null;
}
function isEmptyParagraph(node) {
    return (node !== null &&
        node.getType() === "paragraph" &&
        node.getTextContent().trim().length === 0 &&
        "getChildrenSize" in node &&
        typeof node.getChildrenSize === "function" &&
        node.getChildrenSize() <= 1);
}
function focusInsertedNode(node, trailingParagraph) {
    if (trailingParagraph) {
        const paragraph = createParagraph();
        node.insertAfter(paragraph);
        paragraph.select();
        return;
    }
    if ($isListNode(node)) {
        const firstItem = node.getFirstChild();
        firstItem?.selectStart();
        return;
    }
    if (node instanceof DividerCardNode || node instanceof ImageCardNode) {
        const paragraph = createParagraph();
        node.insertAfter(paragraph);
        paragraph.select();
        return;
    }
    if ("selectStart" in node && typeof node.selectStart === "function") {
        node.selectStart();
    }
}
function normalizeLinkHref(selectedText) {
    if (/^https?:\/\//iu.test(selectedText)) {
        return selectedText;
    }
    if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/iu.test(selectedText)) {
        return `https://${selectedText}`;
    }
    return "https://citadel.foundation";
}
function isCollapsedEmptyPlainParagraphSelection(selection) {
    return getCollapsedEmptyPlainParagraphSelectionTargetKey(selection) !== null;
}
function getCollapsedEmptyPlainParagraphSelectionTargetKey(selection) {
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null;
    }
    const topLevelNode = getSelectedTopLevelNode(selection);
    return isEmptyPlainParagraphNode(topLevelNode) ? topLevelNode.getKey() : null;
}
function isEmptyPlainParagraphNode(node) {
    return (node?.getType() === "paragraph" && node.getTextContent().trim().length === 0);
}
function getDomSelectedEmptyPlainParagraph(rootElement) {
    const selection = window.getSelection();
    if (selection === null ||
        selection.rangeCount === 0 ||
        !selection.isCollapsed) {
        return null;
    }
    const range = selection.getRangeAt(0);
    const anchorNode = range.startContainer;
    if (!rootElement.contains(anchorNode)) {
        return null;
    }
    const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
    const paragraph = anchorElement?.closest("p");
    if (!(paragraph instanceof HTMLElement) ||
        paragraph.tagName !== "P" ||
        paragraph.parentElement !== rootElement) {
        return null;
    }
    return paragraph.textContent?.trim().length === 0
        ? paragraph
        : null;
}
function isEligibleInsertionBlockElement(element) {
    if (element.dataset.cardType) {
        return true;
    }
    return ["P", "H1", "H2", "H3", "BLOCKQUOTE", "PRE", "UL", "OL"].includes(element.tagName);
}
function groupBlockMenuItems(items) {
    const groups = new Map();
    for (const item of items) {
        const bucket = groups.get(item.group) ?? [];
        groups.set(item.group, [...bucket, item]);
    }
    return ["Text", "Lists", "Structure", "Media", "Title"]
        .map((group) => {
        const groupItems = groups.get(group);
        return groupItems && groupItems.length > 0
            ? [group, groupItems]
            : null;
    })
        .filter((value) => value !== null);
}
function styleForPlacement(placement) {
    if (!placement) {
        return "left: 0; top: 0;";
    }
    return `left:${placement.left}px; top:${placement.top}px;`;
}
function clampPopoverPlacement(left, top) {
    const maxLeft = Math.max(window.innerWidth - 420, 16);
    const maxTop = Math.max(window.innerHeight - 420, 16);
    return {
        left: Math.min(Math.max(left, 16), maxLeft),
        top: Math.min(Math.max(top, 16), maxTop),
    };
}
function supportsFinePointer() {
    return (typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: fine)").matches);
}
