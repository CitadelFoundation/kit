import { $getNodeByKey, } from "lexical";
import { PublishingCardNode, restorePublishingCardNode, } from "./card-node.js";
import { registerPublishingCardDefinition } from "./card-registry.js";
export function createDividerCardViewElement(config) {
    const view = document.createElement("section");
    view.className = "publishing-divider-card-view";
    view.dataset.selected = config.selected ? "true" : "false";
    view.dataset.editable = config.editable ? "true" : "false";
    const hr = document.createElement("hr");
    hr.className = "publishing-divider-card-view__line";
    hr.setAttribute("role", "separator");
    hr.setAttribute("aria-orientation", "horizontal");
    view.append(hr);
    if (config.data.label) {
        const label = document.createElement("p");
        label.className = "publishing-divider-card-view__label";
        label.textContent = config.data.label;
        view.append(label);
    }
    return view;
}
export class DividerCardNode extends PublishingCardNode {
    static { this.cardType = "divider-card"; }
    static getType() {
        return DividerCardNode.cardType;
    }
    static clone(node) {
        return new DividerCardNode(node.getCardData(), node.getKey());
    }
    constructor(data = {}, key) {
        super(data, key);
    }
    createDOM() {
        const element = document.createElement("div");
        element.dataset.cardType = this.getCardType();
        element.className = "publishing-divider-card-node";
        return element;
    }
    decorate(editor, _config) {
        const view = createDividerCardViewElement({
            data: this.getCardData(),
            selected: false,
            editable: false,
            onChange: (data) => {
                editor.update(() => {
                    const node = $getNodeByKey(this.getKey());
                    if (node instanceof DividerCardNode) {
                        node.setCardData(data);
                    }
                });
            },
        });
        return view;
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
        return restorePublishingCardNode(DividerCardNode, serializedNode);
    }
}
export function createDividerCard(data = {}) {
    return new DividerCardNode(data);
}
registerPublishingCardDefinition({
    type: DividerCardNode.cardType,
    label: "Divider",
    description: "Insert a visual section break.",
    create: (data) => createDividerCard(data),
    importJSON: (serializedNode) => restorePublishingCardNode(DividerCardNode, serializedNode),
});
