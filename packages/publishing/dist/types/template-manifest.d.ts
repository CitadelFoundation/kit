/**
 * Template manifest contract for publishing workspaces.
 *
 * @module @citadelfoundation/kit-publishing/types/template-manifest
 */
/**
 * Minimal link shape used by template scaffolding.
 *
 * Mirrors the canonical {@link NavigationItem} from `types/index.ts`
 * without creating a circular type dependency.
 */
export interface PublishingTemplateLinkItem {
    readonly label: string;
    readonly href: string;
    readonly external?: boolean;
    readonly description?: string;
}
/**
 * Approved template page kinds.
 *
 * This type is intentionally separate from {@link ContentKind}.
 * Template page kinds describe the structural role of a page within a template,
 * not the content document type stored in the repository.
 */
export type PublishingTemplatePageKind = "home" | "docs-index" | "docs-page" | "blog-index" | "blog-post";
/**
 * Template section kind registered by a manifest.
 *
 * Section kinds are open strings defined by each template.
 * The manifest declares which section kinds it supports.
 */
export type PublishingTemplateSectionKind = string;
/**
 * Template block kind registered by a manifest.
 *
 * Block kinds are open strings defined by each template.
 * The manifest declares which block kinds it supports.
 */
export type PublishingTemplateBlockKind = string;
/**
 * Default site metadata scaffolding declared by a template manifest.
 *
 * When a workspace is created from a template, these values serve as
 * the initial {@link PublicationProfile} defaults.
 */
export interface PublishingTemplateDefaultSiteMetadata {
    readonly title: string;
    readonly description?: string;
    readonly language?: string;
    readonly navigationLabel?: string;
    readonly docsLabel?: string;
}
/**
 * Default navigation scaffolding declared by a template manifest.
 */
export interface PublishingTemplateDefaultNavigation {
    readonly mainLinks?: readonly PublishingTemplateLinkItem[];
    readonly footerLinks?: readonly PublishingTemplateLinkItem[];
}
/**
 * Default homepage section scaffolding declared by a template manifest.
 */
export interface PublishingTemplateDefaultHomepageSections {
    readonly heroEyebrow?: string;
    readonly heroTitle?: string;
    readonly heroBody?: string;
    readonly primaryCta?: PublishingTemplateLinkItem;
}
/**
 * Default content scaffolding declared by a template manifest.
 *
 * Provides initial nav, footer, and homepage sections for new workspaces.
 */
export interface PublishingTemplateDefaultContent {
    readonly navigation?: PublishingTemplateDefaultNavigation;
    readonly homepageSections?: PublishingTemplateDefaultHomepageSections;
}
/**
 * Template manifest declaring page kinds, section/block kinds, and default scaffolding.
 *
 * The manifest is optional on generic publication workspaces but required
 * for template fixtures and proof flows.
 *
 * @example
 * ```ts
 * const starter = definePublishingTemplate({
 *   id: "starter",
 *   label: "Starter Template",
 *   version: "1.0.0",
 *   pageKinds: ["home", "docs-index", "docs-page", "blog-index", "blog-post"],
 *   sectionKinds: ["hero", "features", "cta"],
 *   blockKinds: ["button", "card"],
 *   defaultSiteMetadata: { title: "My Site" },
 *   defaultContent: {
 *     navigation: { mainLinks: [{ label: "Home", href: "/" }] },
 *     homepageSections: { heroTitle: "Welcome" },
 *   },
 * });
 * ```
 */
export interface PublishingTemplateManifest {
    readonly id: string;
    readonly label: string;
    readonly version: string;
    readonly pageKinds: readonly PublishingTemplatePageKind[];
    readonly sectionKinds: readonly string[];
    readonly blockKinds: readonly string[];
    readonly defaultSiteMetadata?: PublishingTemplateDefaultSiteMetadata;
    readonly defaultContent?: PublishingTemplateDefaultContent;
}
/**
 * Define and validate a template manifest.
 *
 * Validates that `pageKinds` only contains approved values, deduplicates
 * all kind arrays, and returns a deeply frozen manifest object.
 *
 * @throws When `id` or `version` is empty, `pageKinds` is empty,
 *   or `pageKinds` contains unapproved values.
 */
export declare function definePublishingTemplate(manifest: PublishingTemplateManifest): Readonly<PublishingTemplateManifest>;
