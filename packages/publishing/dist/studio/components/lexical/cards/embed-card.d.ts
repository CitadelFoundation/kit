import { type EditorConfig, type LexicalEditor, type NodeKey } from "lexical";
import { type TemplateResult } from "lit";
import { PublishingElement } from "../../../../internal/ui.js";
import { PublishingCardNode, type SerializedPublishingCardNode } from "./card-node.js";
import type { PublishingCardPayload } from "./card-wrapper.js";
export interface EmbedCardData extends PublishingCardPayload {
    readonly url: string;
    readonly caption: string;
    readonly title: string;
}
export interface EmbedCardViewConfig {
    readonly data: EmbedCardData;
    readonly selected?: boolean;
    readonly editable?: boolean;
    readonly onChange?: (data: EmbedCardData) => void;
}
export interface EmbedPreviewModel {
    readonly kind: "iframe" | "link";
    readonly provider: "youtube" | "twitter" | "generic";
    readonly embedUrl?: string;
    readonly href: string;
    readonly label: string;
    readonly thumbnail?: string;
}
export declare function createEmbedCardViewElement(config: EmbedCardViewConfig): KitPublishingEmbedCardView;
export declare class KitPublishingEmbedCardView extends PublishingElement {
    data: EmbedCardData;
    selected: boolean;
    editable: boolean;
    onChange: ((data: EmbedCardData) => void) | null;
    private embedError;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private handleUrlChange;
    private handleTitleChange;
    private handleCaptionChange;
    private setData;
}
export declare class EmbedCardNode extends PublishingCardNode<"embed-card", EmbedCardData> {
    static readonly cardType = "embed-card";
    static getType(): string;
    static clone(node: EmbedCardNode): EmbedCardNode;
    constructor(data: EmbedCardData, key?: NodeKey);
    createDOM(): HTMLElement;
    decorate(editor: LexicalEditor, _config: EditorConfig): HTMLElement;
    exportJSON(): SerializedPublishingCardNode<"embed-card", EmbedCardData>;
    static importJSON(serializedNode: SerializedPublishingCardNode<"embed-card", EmbedCardData>): EmbedCardNode;
}
export declare function createEmbedCard(data: EmbedCardData): EmbedCardNode;
export declare function resolveEmbedPreview(url: string, title: string): EmbedPreviewModel;
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-embed-card-view": KitPublishingEmbedCardView;
    }
}
