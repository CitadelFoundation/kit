import { type EditorConfig, type LexicalEditor, type NodeKey } from "lexical";
import { PublishingCardNode, type SerializedPublishingCardNode } from "./card-node.js";
import type { PublishingCardPayload } from "./card-wrapper.js";
export interface ImageCardData extends PublishingCardPayload {
    readonly src: string;
    readonly alt: string;
    readonly title?: string;
    readonly caption?: string;
    readonly assetId?: string;
    readonly label?: string;
    readonly source?: "url" | "upload";
    readonly fileName?: string;
}
export interface ImageCardViewConfig {
    readonly data: ImageCardData;
    readonly selected?: boolean;
}
export declare function createImageCardViewElement(config: ImageCardViewConfig): HTMLElement;
export declare class ImageCardNode extends PublishingCardNode<"image-card", ImageCardData> {
    static readonly cardType = "image-card";
    static getType(): string;
    static clone(node: ImageCardNode): ImageCardNode;
    constructor(data: ImageCardData, key?: NodeKey);
    createDOM(): HTMLElement;
    decorate(_editor: LexicalEditor, _config: EditorConfig): HTMLElement;
    exportJSON(): SerializedPublishingCardNode<"image-card", ImageCardData>;
    static importJSON(serializedNode: SerializedPublishingCardNode<"image-card", ImageCardData>): ImageCardNode;
}
export declare function createImageCard(data: ImageCardData): ImageCardNode;
export declare function readFileAsDataUrl(file: File): Promise<string>;
