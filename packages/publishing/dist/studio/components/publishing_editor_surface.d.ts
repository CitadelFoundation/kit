/**
 * Native editor boundary for publishing drafts.
 *
 * @module @citadelfoundation/kit-publishing/studio/components/publishing_editor_surface
 */
import type { TemplateResult, PropertyValues } from "lit";
import type { AssetDocument } from "../../types/index.js";
import { PublishingElement } from "../../internal/ui.js";
import "./lexical/editor-toolbar.js";
import { type PublishingEditorAdapter, type PublishingEditorCommandId, type PublishingEditorKind, type PublishingEditorFocusTarget, type PublishingEditorState } from "../editor_adapter.js";
import "./lexical/lexical-editor.js";
export declare class KitPublishingEditorSurface extends PublishingElement {
    adapter: PublishingEditorAdapter;
    editorKind: PublishingEditorKind;
    value: string;
    placeholder: string;
    editorLabel: string;
    editorTestId: string;
    readOnly: boolean;
    dirty: boolean;
    editorState: PublishingEditorState;
    showAdapterAnalysis: boolean;
    mediaAssets: readonly AssetDocument[];
    externalSyncGeneration: number;
    documentIdentity: string;
    insertPaletteOpen: boolean;
    insertQuery: string;
    private readonly editorHost?;
    private readonly lexicalEditor?;
    private readonly insertPaletteSearch?;
    private readonly linkComposerInput?;
    private editorHandle;
    private pendingLinkResolver;
    linkComposerOpen: boolean;
    linkComposerHref: string;
    linkComposerSelection: string;
    static styles: import("lit").CSSResult[];
    protected firstUpdated(): void;
    protected updated(changedProperties: PropertyValues<this>): void;
    protected renderContent(): TemplateResult;
    protected cleanup(): void;
    private handleCommand;
    executeCommand(commandId: PublishingEditorCommandId): void;
    focusEditor(target?: PublishingEditorFocusTarget): void;
    private mountEditor;
    private getFilteredInsertCommands;
    private getPrimaryToolbarCommands;
    private handleInsertQuery;
    private handleInsertPaletteCommand;
    private handleInsertRequest;
    private readonly handleLexicalChange;
    private readonly handleLexicalStateChange;
    private handleLinkComposerInput;
    private handleLinkComposerKeydown;
    private confirmLinkComposer;
    private cancelLinkComposer;
    private openLinkComposer;
    private finishLinkComposer;
    private focusInsertPaletteSearch;
}
