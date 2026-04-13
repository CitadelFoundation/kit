import { type TemplateResult } from "lit";
import { PublishingElement } from "../../internal/ui.js";
import type { SiteSettingsDocument } from "../../types/index.js";
export interface PublishingSiteSettingsIssue {
    readonly field: "title" | "description" | "language" | "footerNotice" | "contactEmail" | "themeColor" | "seoTitle" | "seoDescription" | "socialLinks";
    readonly message: string;
}
export interface PublishingSiteSettingsChangeDetail {
    readonly settings: SiteSettingsDocument;
    readonly issues: readonly PublishingSiteSettingsIssue[];
    readonly isValid: boolean;
}
export declare class KitPublishingSiteSettings extends PublishingElement {
    settings: SiteSettingsDocument;
    open: boolean;
    private revision;
    static styles: import("lit").CSSResult[];
    protected updated(changedProperties: Map<PropertyKey, unknown>): void;
    getSettings(): SiteSettingsDocument;
    getValidationIssues(): readonly PublishingSiteSettingsIssue[];
    protected renderContent(): TemplateResult;
    private renderField;
    private renderSocialLink;
    private updateSettings;
    private dispatchChange;
    private addSocialLink;
    private removeSocialLink;
    private replaceSocialLink;
    private moveSocialLink;
}
export declare function createDefaultSiteSettings(): SiteSettingsDocument;
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-site-settings": KitPublishingSiteSettings;
    }
}
