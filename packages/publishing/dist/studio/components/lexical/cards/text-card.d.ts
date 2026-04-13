import type { EditorConfig, LexicalEditor, NodeKey } from "lexical";
import { PublishingCardNode, type SerializedPublishingCardNode } from "./card-node.js";
import { type PublishingCardPayload } from "./card-wrapper.js";
export interface TextCardData extends PublishingCardPayload {
    readonly text: string;
}
export declare class TextCardNode extends PublishingCardNode<"text-card", TextCardData> {
    static readonly cardType = "text-card";
    static getType(): string;
    static clone(node: TextCardNode): TextCardNode;
    constructor(data: TextCardData, key?: NodeKey);
    createDOM(): HTMLElement;
    decorate(_editor: LexicalEditor, _config: EditorConfig): HTMLElement;
    exportJSON(): SerializedPublishingCardNode<"text-card", TextCardData>;
    static importJSON(serializedNode: SerializedPublishingCardNode<"text-card", TextCardData>): TextCardNode;
}
export declare function createTextCard(text: string): TextCardNode;
