/**
 * Tiptap-backed markdown editor adapter used as the production writing surface.
 *
 * @module @citadelfoundation/kit-publishing/studio/tiptap_editor_adapter
 */
import type { PublishingEditorAdapter } from "./editor_contract.js";
/**
 * Create the production Tiptap markdown adapter.
 */
export declare function createPublishingTiptapEditorAdapter(): PublishingEditorAdapter;
/**
 * Backwards-compatible export kept while downstream callers migrate.
 */
export declare const createTiptapMarkdownEditorAdapter: typeof createPublishingTiptapEditorAdapter;
