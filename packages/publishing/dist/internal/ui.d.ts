/**
 * Publishing-owned UI primitives for the standalone studio shell.
 */
import { LitElement, nothing, type CSSResult, type TemplateResult } from "lit";
export declare class PublishingElement extends LitElement {
    static baseSystemStyles: CSSResult;
    protected render(): TemplateResult;
    protected renderContent(): TemplateResult | typeof nothing;
    protected emitEvent<T = unknown>(eventName: string, detail?: T, options?: EventInit): boolean;
    disconnectedCallback(): void;
    protected cleanup(): void;
}
export declare const publishingTheme: CSSResult;
