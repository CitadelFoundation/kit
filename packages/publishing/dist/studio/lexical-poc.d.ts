import type { PropertyValues, TemplateResult } from "lit";
import { PublishingElement } from "../internal/ui.js";
import { type PublishingEditorCommandId, type PublishingEditorState } from "./editor_contract.js";
export type LexicalPocCommandId = Extract<PublishingEditorCommandId, "bold" | "italic" | "undo" | "redo">;
export interface LexicalPocChangeDetail {
    readonly text: string;
    readonly html: string;
}
export declare class KitLexicalPoc extends PublishingElement {
    initialValue: string;
    editorLabel: string;
    readOnly: boolean;
    editorState: PublishingEditorState;
    private readonly editorHost?;
    private editor;
    private editorRootElement;
    private unregisterCallbacks;
    private textSnapshot;
    private htmlSnapshot;
    private canUndo;
    private canRedo;
    static styles: import("lit").CSSResult[];
    connectedCallback(): void;
    firstUpdated(): void;
    protected updated(changedProperties: PropertyValues<this>): void;
    typeText(text: string): boolean;
    selectAllText(): boolean;
    executeCommand(commandId: LexicalPocCommandId): boolean;
    getEditorText(): string;
    getEditorHtml(): string;
    remountEditor(): void;
    disposeEditor(): void;
    protected cleanup(): void;
    protected renderContent(): TemplateResult;
    private mountEditor;
    private syncSnapshot;
    private syncCommandState;
    private createCommandStates;
}
declare global {
    interface HTMLElementTagNameMap {
        "kit-lexical-poc": KitLexicalPoc;
    }
}
