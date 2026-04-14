import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS, } from "@lexical/markdown";
import { ParagraphNode, TextNode, createEditor, } from "lexical";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { DividerCardNode, createDividerCard, } from "../studio/components/lexical/cards/divider-card.js";
import { ImageCardNode, createImageCard, } from "../studio/components/lexical/cards/image-card.js";
const DIVIDER_REGEXP = /^---$/u;
const IMAGE_REGEXP = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/u;
export const publishingLexicalNodes = [
    ParagraphNode,
    TextNode,
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
    CodeNode,
    CodeHighlightNode,
    DividerCardNode,
    ImageCardNode,
];
export const DIVIDER_TRANSFORMER = {
    type: "element",
    dependencies: [DividerCardNode],
    export(node) {
        if (node instanceof DividerCardNode) {
            return "---";
        }
        return null;
    },
    regExp: DIVIDER_REGEXP,
    replace(parentNode) {
        parentNode.replace(createDividerCard());
    },
};
export const IMAGE_TRANSFORMER = {
    type: "element",
    dependencies: [ImageCardNode],
    export(node) {
        if (!(node instanceof ImageCardNode)) {
            return null;
        }
        const data = node.getCardData();
        const src = typeof data.src === "string" ? data.src.trim() : "";
        if (src.length === 0) {
            return null;
        }
        const title = typeof data.title === "string" && data.title.trim().length > 0
            ? ` "${escapeMarkdownTitle(data.title.trim())}"`
            : "";
        return `![${escapeMarkdownText(data.alt ?? "")}](${src}${title})`;
    },
    regExp: IMAGE_REGEXP,
    replace(parentNode, _children, match) {
        const [, alt = "", src = "", title = ""] = match;
        if (src.trim().length === 0) {
            return false;
        }
        parentNode.replace(createImageCard({
            src,
            alt,
            title,
        }));
    },
};
export const publishingMarkdownTransformers = [
    ...TRANSFORMERS,
    DIVIDER_TRANSFORMER,
    IMAGE_TRANSFORMER,
];
export function importPublishingMarkdown(markdown) {
    $convertFromMarkdownString(markdown, [...publishingMarkdownTransformers]);
}
export function serializePublishingMarkdown(node, shouldPreserveNewLines = false) {
    return $convertToMarkdownString([...publishingMarkdownTransformers], node, shouldPreserveNewLines)
        .replace(/\n{3,}/gu, "\n\n")
        .trimEnd();
}
export function createPublishingHeadlessEditor(namespace) {
    return createEditor({
        namespace,
        nodes: [...publishingLexicalNodes],
        onError(error) {
            throw error;
        },
    });
}
export function convertMarkdownBodyToPublishingLexicalState(body, namespace = "citadel-publishing-content-migration") {
    const editor = createPublishingHeadlessEditor(namespace);
    editor.update(() => {
        importPublishingMarkdown(body);
    }, { discrete: true });
    return editor.getEditorState().toJSON();
}
export function serializePublishingLexicalJson(editorState, pretty = true) {
    return JSON.stringify(editorState, null, pretty ? 2 : 0);
}
function escapeMarkdownText(value) {
    return value.replace(/\]/gu, "\\]");
}
function escapeMarkdownTitle(value) {
    return value.replace(/"/gu, '\\"');
}
export function isPublishingBridgeNode(node) {
    return node instanceof DividerCardNode || node instanceof ImageCardNode;
}
