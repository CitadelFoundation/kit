import type { SerializedEditorState } from "lexical";
export interface LexicalContentMigrationResult {
    readonly frontmatter: Record<string, unknown>;
    readonly body: string;
    readonly editorState: SerializedEditorState;
    readonly lexicalJson: string;
}
export interface LexicalContentMigrationOptions {
    readonly pretty?: boolean;
}
export declare function migrateMdxSourceToLexicalJson(source: string, options?: LexicalContentMigrationOptions): LexicalContentMigrationResult;
export declare function convertMarkdownBodyToLexicalState(body: string): SerializedEditorState;
export declare function serializeLexicalJson(editorState: SerializedEditorState, pretty?: boolean): string;
