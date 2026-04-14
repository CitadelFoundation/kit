import { type EditorConfig, type LexicalEditor, type NodeKey } from "lexical";
import { PublishingCardNode, type SerializedPublishingCardNode } from "./card-node.js";
import type { PublishingCardPayload } from "./card-wrapper.js";
export interface DividerCardData extends PublishingCardPayload {
    readonly label?: string;
}
export interface DividerCardViewConfig {
    readonly data: DividerCardData;
    readonly selected?: boolean;
    readonly editable?: boolean;
    readonly onChange?: (data: DividerCardData) => void;
}
export declare function createDividerCardViewElement(config: DividerCardViewConfig): HTMLElement;
export declare class DividerCardNode extends PublishingCardNode<"divider-card", DividerCardData> {
    static readonly cardType = "divider-card";
    static getType(): string;
    static clone(node: DividerCardNode): DividerCardNode;
    constructor(data?: DividerCardData, key?: NodeKey);
    createDOM(): HTMLElement;
    decorate(editor: LexicalEditor, _config: EditorConfig): HTMLElement;
    exportJSON(): SerializedPublishingCardNode<"divider-card", DividerCardData>;
    static importJSON(serializedNode: SerializedPublishingCardNode<"divider-card", DividerCardData>): DividerCardNode;
}
export declare function createDividerCard(data?: DividerCardData): DividerCardNode;
