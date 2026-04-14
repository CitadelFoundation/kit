import { type TemplateResult } from "lit";
import { PublishingElement } from "../../../internal/ui.js";
import { type PublishingEditorCommand } from "../../editor_contract.js";
/**
 * Formatting command IDs supported by the floating selection toolbar.
 *
 * bold, italic, link are shared with PublishingEditorCommandId.
 * underline, strikethrough, code are Lexical-specific inline formatting
 * that intentionally falls outside the shared markdown-first command set.
 */
export type LexicalFloatingToolbarCommandId = "bold" | "italic" | "underline" | "strikethrough" | "code" | "link";
type FloatingToolbarCommand = Omit<PublishingEditorCommand, "id"> & {
    id: LexicalFloatingToolbarCommandId;
};
export declare const lexicalFloatingToolbarCommands: readonly FloatingToolbarCommand[];
export declare class KitLexicalFloatingToolbar extends PublishingElement {
    commands: readonly FloatingToolbarCommand[];
    activeFormats: Readonly<Record<LexicalFloatingToolbarCommandId, boolean>>;
    visible: boolean;
    disabled: boolean;
    placement: {
        readonly top: number;
        readonly left: number;
    } | null;
    toolbarLabel: string;
    onCommand: ((commandId: LexicalFloatingToolbarCommandId) => void) | null;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private renderCommandButton;
    private handleCommand;
}
declare global {
    interface HTMLElementTagNameMap {
        "kit-lexical-floating-toolbar": KitLexicalFloatingToolbar;
    }
}
export {};
