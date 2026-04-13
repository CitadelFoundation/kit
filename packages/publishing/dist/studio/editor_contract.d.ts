/**
 * Shared adapter contract and baseline markdown-first adapters.
 *
 * @module @citadelfoundation/kit-publishing/studio/editor_contract
 */
import type { Disposable } from "../internal/result.js";
/**
 * Stable command identifiers supported by publishing editor engines.
 */
export type PublishingEditorCommandId = "undo" | "redo" | "heading-1" | "heading-2" | "heading-3" | "bold" | "italic" | "quote" | "bulleted-list" | "numbered-list" | "code-block" | "link" | "divider" | "image";
export type PublishingEditorKind = "adapter" | "lexical";
export type PublishingEditorChangeOrigin = "user" | "external-sync";
export interface PublishingEditorChangeDetail {
    readonly value: string;
    readonly origin?: PublishingEditorChangeOrigin;
    readonly editorKind?: PublishingEditorKind;
    readonly syncGeneration?: number;
}
/**
 * Toolbar command surfaced by an editor adapter.
 */
export interface PublishingEditorCommand {
    readonly id: PublishingEditorCommandId;
    readonly label: string;
    readonly shortLabel: string;
    readonly kind: "history" | "format" | "insert";
    readonly shortcut?: string;
}
/**
 * Lightweight metrics shown by the editor shell.
 */
export interface PublishingEditorMetrics {
    readonly characters: number;
    readonly lines: number;
    readonly words: number;
}
/**
 * State of an individual command in the active editor.
 */
export interface PublishingEditorCommandState {
    readonly active: boolean;
    readonly disabled: boolean;
}
/**
 * Rich editor state surfaced to the shell.
 */
export interface PublishingEditorState {
    readonly metrics: PublishingEditorMetrics;
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly commandStates: Readonly<Partial<Record<PublishingEditorCommandId, PublishingEditorCommandState>>>;
}
/**
 * Human-facing descriptor used in stories and comparison harnesses.
 */
export interface PublishingEditorDescriptor {
    readonly id: string;
    readonly label: string;
    readonly family: "baseline" | "trix";
    readonly canonicalMarkdown: "native" | "bridge";
    readonly verdict: "baseline" | "candidate" | "reference-only" | "winner";
    readonly summary: string;
    readonly notes: readonly string[];
}
/**
 * Mount options passed into a publishing editor adapter.
 */
export interface PublishingEditorMountOptions {
    readonly value: string;
    readonly placeholder?: string;
    readonly readOnly?: boolean;
    readonly ariaLabel?: string;
    readonly testId?: string;
    readonly onChange: (value: string) => void;
    readonly onStateChange?: (state: PublishingEditorState) => void;
    readonly onInsertRequest?: (request: PublishingEditorInsertRequest) => void;
    readonly resolveLinkHref?: (request: PublishingEditorLinkRequest) => Promise<string | null> | string | null;
}
/**
 * Request emitted by an editor when the shared insert palette should open.
 */
export interface PublishingEditorInsertRequest {
    readonly source: "toolbar" | "slash";
    readonly query: string;
}
/**
 * Link insertion request surfaced to the shell.
 */
export interface PublishingEditorLinkRequest {
    readonly initialHref: string;
    readonly selectedText: string;
}
/**
 * Optional focus targets used to coordinate canvas title/body transitions.
 */
export type PublishingEditorFocusTarget = "start" | "end" | "preserve";
/**
 * Mounted editor instance returned by an adapter.
 */
export interface PublishingEditorHandle extends Disposable {
    /**
     * Read the current canonical editor value.
     */
    getValue(): string;
    /**
     * Replace the current canonical editor value.
     */
    setValue(value: string): void;
    /**
     * Return the current editor state.
     */
    getState(): PublishingEditorState;
    /**
     * Execute a supported editor command.
     */
    executeCommand(commandId: PublishingEditorCommandId): void;
    /**
     * Move focus into the editor.
     */
    focus(target?: PublishingEditorFocusTarget): void;
}
/**
 * Adapter contract for any publishing editor engine.
 */
export interface PublishingEditorAdapter {
    /**
     * Stable adapter name used for diagnostics.
     */
    readonly name: string;
    /**
     * Human-facing descriptor for stories and comparison notes.
     */
    readonly descriptor: PublishingEditorDescriptor;
    /**
     * Stable list of supported commands.
     */
    readonly commands: readonly PublishingEditorCommand[];
    /**
     * Mount the editor into a host element.
     */
    mount(container: HTMLElement, options: PublishingEditorMountOptions): PublishingEditorHandle;
}
/**
 * Shared baseline command list for the markdown-first textarea adapter.
 */
export declare const markdownEditorCommands: readonly PublishingEditorCommand[];
/**
 * Create an empty command state map for an adapter command list.
 */
export declare function createPublishingCommandStateMap(commands: readonly PublishingEditorCommand[], readOnly?: boolean): Readonly<Partial<Record<PublishingEditorCommandId, PublishingEditorCommandState>>>;
/**
 * Compute editor metrics for markdown or plain-text values.
 */
export declare function createPublishingEditorMetrics(value: string): PublishingEditorMetrics;
/**
 * Build a minimal editor state object from the current value.
 */
export declare function createPublishingEditorState(options: {
    readonly value: string;
    readonly commands: readonly PublishingEditorCommand[];
    readonly commandStates?: Readonly<Partial<Record<PublishingEditorCommandId, PublishingEditorCommandState>>>;
    readonly canUndo?: boolean;
    readonly canRedo?: boolean;
    readonly readOnly?: boolean;
}): PublishingEditorState;
/**
 * Create the fallback markdown-first editor adapter.
 */
export declare function createMarkdownEditorAdapter(): PublishingEditorAdapter;
/**
 * Legacy plain textarea adapter retained for tests or fallback mounts.
 */
export declare function createTextareaEditorAdapter(): PublishingEditorAdapter;
