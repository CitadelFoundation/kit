/**
 * Public production editor exports for the publishing writing surface.
 *
 * @module @citadelfoundation/kit-publishing/studio/editor_adapter
 */
export type { PublishingEditorChangeDetail } from "./components/publishing_editor_surface.js";
export { createPublishingCommandStateMap, createPublishingEditorMetrics, createPublishingEditorState, markdownEditorCommands, type PublishingEditorAdapter, type PublishingEditorCommand, type PublishingEditorCommandId, type PublishingEditorCommandState, type PublishingEditorDescriptor, type PublishingEditorFocusTarget, type PublishingEditorHandle, type PublishingEditorInsertRequest, type PublishingEditorLinkRequest, type PublishingEditorMetrics, type PublishingEditorMountOptions, type PublishingEditorState, } from "./editor_contract.js";
export { createPublishingTiptapEditorAdapter, createTiptapMarkdownEditorAdapter, } from "./tiptap_editor_adapter.js";
