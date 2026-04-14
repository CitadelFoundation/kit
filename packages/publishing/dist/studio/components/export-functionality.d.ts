import { type TemplateResult } from "lit";
import { PublishingElement } from "../../internal/ui.js";
import type { PublishingDocument, PostDocument, PageDocument, DocPageDocument } from "../../types/index.js";
export type PublishingExportFormat = "json" | "markdown";
export interface PublishingExportTarget {
    readonly format: PublishingExportFormat;
    readonly filename: string;
    readonly mimeType: string;
    readonly contents: string;
}
export interface PublishingExportRequestDetail {
    readonly target: PublishingExportTarget;
}
type MarkdownExportableDocument = PostDocument | PageDocument | DocPageDocument;
export declare class KitPublishingExportFunctionality extends PublishingElement {
    document: PublishingDocument | null;
    baseName: string;
    title: string;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    exportJson(): PublishingExportTarget | null;
    exportMarkdown(): PublishingExportTarget | null;
    private handleExportJson;
    private handleExportMarkdown;
    private dispatchExport;
}
export declare function buildPublishingExportTarget(document: PublishingDocument, format: PublishingExportFormat, baseName?: string): PublishingExportTarget;
export declare function isMarkdownExportableDocument(document: PublishingDocument): document is MarkdownExportableDocument;
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-export-functionality": KitPublishingExportFunctionality;
    }
}
export {};
