/**
 * Frontmatter parsing and lightweight preview rendering helpers.
 *
 * @module @citadelfoundation/kit-publishing/content/frontmatter
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import MarkdownIt from "markdown-it";
const previewMarkdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
});
/**
 * Parse optional YAML frontmatter from an MDX or Markdown document.
 */
export function parseFrontmatterDocument(source) {
    if (!source.startsWith("---\n")) {
        return { frontmatter: {}, body: source };
    }
    const closingIndex = source.indexOf("\n---\n", 4);
    if (closingIndex === -1) {
        return { frontmatter: {}, body: source };
    }
    const rawFrontmatter = source.slice(4, closingIndex);
    const body = source.slice(closingIndex + 5);
    const parsed = parseYaml(rawFrontmatter);
    return {
        frontmatter: typeof parsed === "object" && parsed !== null
            ? parsed
            : {},
        body,
    };
}
/**
 * Serialize a markdown-backed document back to frontmatter form.
 */
export function serializeFrontmatterDocument(frontmatter, body) {
    const trimmedBody = body.trim();
    return `---\n${stringifyYaml(frontmatter).trim()}\n---\n\n${trimmedBody}\n`;
}
/**
 * Escape raw HTML so local preview markup can be rendered safely.
 */
export function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
/**
 * Render lightweight HTML preview output from markdown-style body text.
 */
export function renderPlaintextPreview(body) {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
        return "<p>Nothing to preview yet.</p>";
    }
    return previewMarkdown.render(trimmed);
}
