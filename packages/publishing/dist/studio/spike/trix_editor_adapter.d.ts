/**
 * Trix-backed comparison adapter used to evaluate Ghost-adjacent UI ergonomics.
 *
 * @module @citadelfoundation/kit-publishing/studio/spike/trix_editor_adapter
 */
import type { PublishingEditorAdapter } from "../editor_contract.js";
/**
 * Create the Trix comparison adapter.
 */
export declare function createTrixEditorAdapter(): PublishingEditorAdapter;
/**
 * Render canonical markdown into HTML for Trix's HTML-first document model.
 */
export declare function renderMarkdownForTrix(markdown: string): string;
/**
 * Serialize HTML emitted by Trix back into markdown for comparison.
 */
export declare function serializeTrixHtmlToMarkdown(html: string): string;
