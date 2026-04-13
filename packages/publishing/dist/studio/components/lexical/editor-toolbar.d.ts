import { type TemplateResult } from "lit";
import { PublishingElement } from "../../../internal/ui.js";
import { type PublishingEditorCommand, type PublishingEditorCommandId, type PublishingEditorState } from "../../editor_contract.js";
export declare const lexicalEditorToolbarCommands: readonly PublishingEditorCommand[];
export declare const lexicalCompactToolbarCommands: readonly PublishingEditorCommand[];
export declare class KitLexicalEditorToolbar extends PublishingElement {
    commands: readonly PublishingEditorCommand[];
    editorState: PublishingEditorState;
    onCommand: ((commandId: PublishingEditorCommandId) => void) | null;
    appearance: "default" | "compact";
    showLabels: boolean;
    showShortcuts: boolean;
    toolbarLabel: string;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private renderCommandButton;
    private handleCommand;
}
declare global {
    interface HTMLElementTagNameMap {
        "kit-lexical-editor-toolbar": KitLexicalEditorToolbar;
    }
}
