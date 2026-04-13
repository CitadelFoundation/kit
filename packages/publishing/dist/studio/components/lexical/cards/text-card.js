import { PublishingCardNode, restorePublishingCardNode, } from "./card-node.js";
import { createCardWrapperElement, } from "./card-wrapper.js";
export class TextCardNode extends PublishingCardNode {
    static { this.cardType = "text-card"; }
    static getType() {
        return TextCardNode.cardType;
    }
    static clone(node) {
        return new TextCardNode(node.getCardData(), node.getKey());
    }
    constructor(data, key) {
        super(data, key);
    }
    createDOM() {
        const element = document.createElement("div");
        element.dataset.cardType = this.getCardType();
        element.className = "publishing-text-card";
        return element;
    }
    decorate(_editor, _config) {
        const wrapper = createCardWrapperElement({
            cardType: this.getCardType(),
            data: this.getCardData(),
            selected: false,
            title: "Text",
        });
        const paragraph = document.createElement("p");
        paragraph.className = "publishing-text-card-paragraph";
        paragraph.textContent = this.getCardData().text;
        wrapper.append(paragraph);
        return wrapper;
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
        return restorePublishingCardNode(TextCardNode, serializedNode);
    }
}
export function createTextCard(text) {
    return new TextCardNode({ text });
}
