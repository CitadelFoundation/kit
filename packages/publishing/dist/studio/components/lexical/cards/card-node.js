import { $getSelection, $isNodeSelection, $isRangeSelection, DecoratorNode, } from "lexical";
import { createCardWrapperElement, } from "./card-wrapper.js";
export class PublishingCardNode extends DecoratorNode {
    static getType() {
        return this.cardType;
    }
    constructor(data, key) {
        super(key);
        this.__data = data;
    }
    getCardType() {
        return super.getType();
    }
    getCardData() {
        return this.__data;
    }
    setCardData(data) {
        const writable = this.getWritable();
        writable.__data = data;
        return writable;
    }
    createDOM() {
        const element = document.createElement("div");
        element.dataset.cardType = this.getCardType();
        element.className = "publishing-card-node";
        return element;
    }
    updateDOM() {
        return false;
    }
    decorate(editor, _config) {
        return createCardWrapperElement({
            cardType: this.getCardType(),
            data: this.__data,
            selected: isPublishingCardSelected(editor, this.getKey()),
            title: this.getCardType(),
        });
    }
    exportJSON() {
        return {
            ...super.exportJSON(),
            type: this.getCardType(),
            version: 1,
            data: this.__data,
        };
    }
    isInline() {
        return false;
    }
}
export function clonePublishingCardNode(node, NodeClass) {
    return new NodeClass(node.getCardData(), node.getKey());
}
export function restorePublishingCardNode(NodeClass, serializedNode) {
    return new NodeClass(serializedNode.data);
}
export function isPublishingCardSelected(editor, key) {
    return editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
            return selection.has(key);
        }
        if (!$isRangeSelection(selection)) {
            return false;
        }
        return selection
            .getNodes()
            .some((node) => node.getKey() === key || node.getParentKeys().includes(key));
    });
}
