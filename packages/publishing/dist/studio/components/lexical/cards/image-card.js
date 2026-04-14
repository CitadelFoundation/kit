import { PublishingCardNode, restorePublishingCardNode, } from "./card-node.js";
import { registerPublishingCardDefinition } from "./card-registry.js";
import { resolvePublishingStudioAssetPreviewPath } from "../../../host/model.js";
export function createImageCardViewElement(config) {
    const view = document.createElement("figure");
    view.className = "publishing-image-card-view";
    view.dataset.selected = config.selected ? "true" : "false";
    const normalizedSource = typeof config.data.src === "string" ? config.data.src.trim() : "";
    const resolvedSource = resolveImageCardPreviewSource(normalizedSource);
    if (resolvedSource.length > 0) {
        const image = document.createElement("img");
        image.className = "publishing-image-card-view__image";
        image.alt = config.data.alt ?? "";
        image.src = resolvedSource;
        view.append(image);
    }
    else {
        const placeholder = document.createElement("div");
        placeholder.className = "publishing-image-card-view__placeholder";
        placeholder.textContent = "Image source unavailable";
        view.append(placeholder);
    }
    const captionText = firstNonEmptyString(config.data.caption, config.data.title, config.data.label, config.data.fileName);
    if (captionText.length > 0) {
        const caption = document.createElement("figcaption");
        caption.className = "publishing-image-card-view__caption";
        caption.textContent = captionText;
        view.append(caption);
    }
    return view;
}
export class ImageCardNode extends PublishingCardNode {
    static { this.cardType = "image-card"; }
    static getType() {
        return ImageCardNode.cardType;
    }
    static clone(node) {
        return new ImageCardNode(node.getCardData(), node.getKey());
    }
    constructor(data, key) {
        super(data, key);
    }
    createDOM() {
        const element = document.createElement("div");
        element.dataset.cardType = this.getCardType();
        element.className = "publishing-image-card-node";
        return element;
    }
    decorate(_editor, _config) {
        return createImageCardViewElement({
            data: this.getCardData(),
            selected: false,
        });
    }
    exportJSON() {
        return {
            ...super.exportJSON(),
            type: this.getCardType(),
            version: 1,
            data: this.getCardData(),
        };
    }
    static importJSON(serializedNode) {
        return restorePublishingCardNode(ImageCardNode, serializedNode);
    }
}
export function createImageCard(data) {
    return new ImageCardNode(data);
}
export async function readFileAsDataUrl(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type.length > 0 ? file.type : "application/octet-stream";
    return `data:${mimeType};base64,${base64}`;
}
function resolveImageCardPreviewSource(value) {
    if (value.length === 0) {
        return "";
    }
    return isPublishingStudioMediaPath(value)
        ? (resolvePublishingStudioAssetPreviewPath(value) ?? value)
        : value;
}
function isPublishingStudioMediaPath(value) {
    return (value.startsWith("content/media/") || value.startsWith("/content/media/"));
}
function firstNonEmptyString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }
    return "";
}
registerPublishingCardDefinition({
    type: ImageCardNode.cardType,
    label: "Image",
    description: "Insert a staged content/media image block.",
    create: (data) => createImageCard(data),
    importJSON: (serializedNode) => restorePublishingCardNode(ImageCardNode, serializedNode),
});
