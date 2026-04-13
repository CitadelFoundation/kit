/**
 * Frontmatter parsing and lightweight preview rendering helpers.
 *
 * @module @citadelfoundation/kit-publishing/content/frontmatter
 */
/**
 * Parsed frontmatter result for markdown-backed documents.
 */
export interface ParsedFrontmatterDocument {
    readonly frontmatter: Record<string, unknown>;
    readonly body: string;
}
/**
 * Parse optional YAML frontmatter from an MDX or Markdown document.
 */
export declare function parseFrontmatterDocument(source: string): ParsedFrontmatterDocument;
/**
 * Serialize a markdown-backed document back to frontmatter form.
 */
export declare function serializeFrontmatterDocument(frontmatter: Record<string, unknown>, body: string): string;
/**
 * Escape raw HTML so local preview markup can be rendered safely.
 */
export declare function escapeHtml(value: string): string;
/**
 * Render lightweight HTML preview output from markdown-style body text.
 */
export declare function renderPlaintextPreview(body: string): string;
