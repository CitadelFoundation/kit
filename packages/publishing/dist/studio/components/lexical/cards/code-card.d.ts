import { type EditorConfig, type LexicalEditor, type NodeKey } from "lexical";
import { type TemplateResult } from "lit";
import { PublishingElement } from "../../../../internal/ui.js";
import { PublishingCardNode, type SerializedPublishingCardNode } from "./card-node.js";
import type { PublishingCardPayload } from "./card-wrapper.js";
export interface CodeCardData extends PublishingCardPayload {
    readonly code: string;
    readonly language: string;
}
export interface CodeCardViewConfig {
    readonly data: CodeCardData;
    readonly selected?: boolean;
    readonly editable?: boolean;
    readonly onChange?: (data: CodeCardData) => void;
}
export declare function createCodeCardViewElement(config: CodeCardViewConfig): KitPublishingCodeCardView;
export declare class KitPublishingCodeCardView extends PublishingElement {
    data: CodeCardData;
    selected: boolean;
    editable: boolean;
    onChange: ((data: CodeCardData) => void) | null;
    private copyState;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private handleLanguageChange;
    private handleCodeChange;
    private handleCopy;
    private setData;
}
export declare class CodeCardNode extends PublishingCardNode<"code-card", CodeCardData> {
    static readonly cardType = "code-card";
    static getType(): string;
    static clone(node: CodeCardNode): CodeCardNode;
    constructor(data: CodeCardData, key?: NodeKey);
    createDOM(): HTMLElement;
    decorate(editor: LexicalEditor, _config: EditorConfig): HTMLElement;
    exportJSON(): SerializedPublishingCardNode<"code-card", CodeCardData>;
    static importJSON(serializedNode: SerializedPublishingCardNode<"code-card", CodeCardData>): CodeCardNode;
}
export declare function createCodeCard(data: CodeCardData): CodeCardNode;
export declare function renderHighlightedCode(code: string, language: string): TemplateResult;
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-code-card-view": KitPublishingCodeCardView;
    }
}
