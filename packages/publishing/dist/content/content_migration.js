import { convertMarkdownBodyToPublishingLexicalState, serializePublishingLexicalJson, } from "./lexical_markdown_bridge.js";
import { parseFrontmatterDocument } from "./frontmatter.js";
export function migrateMdxSourceToLexicalJson(source, options = {}) {
    const { frontmatter, body } = parseFrontmatterDocument(source);
    const editorState = convertMarkdownBodyToLexicalState(body);
    const lexicalJson = serializeLexicalJson(editorState, options.pretty ?? true);
    return {
        frontmatter,
        body,
        editorState,
        lexicalJson,
    };
}
export function convertMarkdownBodyToLexicalState(body) {
    return convertMarkdownBodyToPublishingLexicalState(body);
}
export function serializeLexicalJson(editorState, pretty = true) {
    return serializePublishingLexicalJson(editorState, pretty);
}
