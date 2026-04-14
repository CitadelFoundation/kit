import { type EditorConfig, type LexicalEditor, type NodeKey, DecoratorNode, type SerializedLexicalNode, type Spread } from "lexical";
import { type PublishingCardPayload } from "./card-wrapper.js";
export interface SerializedPublishingCardNode<TType extends string = string, TData extends PublishingCardPayload = PublishingCardPayload> extends Spread<{
    readonly type: TType;
    readonly version: 1;
    readonly data: TData;
}, SerializedLexicalNode> {
}
export interface PublishingCardNodeConstructor<TData extends PublishingCardPayload = PublishingCardPayload, TNode extends PublishingCardNode<string, TData> = PublishingCardNode<string, TData>> {
    readonly cardType: string;
    new (data: TData, key?: NodeKey): TNode;
}
export declare abstract class PublishingCardNode<TType extends string, TData extends PublishingCardPayload> extends DecoratorNode<HTMLElement> {
    static getType(): string;
    protected __data: TData;
    protected constructor(data: TData, key?: NodeKey);
    getCardType(): TType;
    getCardData(): TData;
    setCardData(data: TData): this;
    createDOM(): HTMLElement;
    updateDOM(): false;
    decorate(editor: LexicalEditor, _config: EditorConfig): HTMLElement;
    exportJSON(): SerializedPublishingCardNode<TType, TData>;
    isInline(): false;
}
export declare function clonePublishingCardNode<TData extends PublishingCardPayload, TNode extends PublishingCardNode<string, TData>>(node: TNode, NodeClass: PublishingCardNodeConstructor<TData, TNode>): TNode;
export declare function restorePublishingCardNode<TData extends PublishingCardPayload, TNode extends PublishingCardNode<string, TData>>(NodeClass: PublishingCardNodeConstructor<TData, TNode>, serializedNode: SerializedPublishingCardNode<string, TData>): TNode;
export declare function isPublishingCardSelected(editor: LexicalEditor, key: NodeKey): boolean;
