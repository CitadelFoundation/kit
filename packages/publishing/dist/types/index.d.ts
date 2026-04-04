/**
 * Shared types for `@citadelfoundation/kit-publishing`.
 *
 * @module @citadelfoundation/kit-publishing/types
 */
import type { PublishingLicenseAccessMatchMode, PublishingLicenseAccessRequirement, PublishingLicenseResolver, PublishingLicenseScope, PublishingLicenseSessionEvidence, PublishingLicenseSessionState } from "../internal/license.js";
/**
 * Supported canonical publishing document kinds.
 */
export type ContentKind = "site_settings" | "navigation" | "homepage" | "tag" | "post" | "page" | "doc_section" | "doc_page" | "asset";
/**
 * Validation issue emitted during content loading or publish attempts.
 */
export interface PublishingValidationIssue {
    readonly path: string;
    readonly message: string;
}
/**
 * Structured error shape used by publishing services.
 */
export interface PublishingError {
    readonly tag: "io-failed" | "not-found" | "unauthorized" | "validation-failed" | "duplicate-route" | "unsupported";
    readonly reason: string;
    readonly path?: string;
    readonly issues?: readonly PublishingValidationIssue[];
}
/**
 * Resolved filesystem layout for a publishing workspace.
 */
export interface PublishingPaths {
    readonly root: string;
    readonly contentDir: string;
    readonly siteDir: string;
    readonly tagsDir: string;
    readonly postsDir: string;
    readonly pagesDir: string;
    readonly docsDir: string;
    readonly docsPagesDir: string;
    readonly docsSectionsDir: string;
    readonly mediaDir: string;
    readonly studioDir: string;
    readonly draftsDir: string;
    readonly indexDatabasePath: string;
}
/**
 * Capability boundaries planned for publication-aware auth and permissions.
 */
export type PublicationCapability = "content:read" | "content:draft:write" | "content:preview:read" | "content:review:read" | "content:publish:write" | "content:config:write" | "publication:deploy:read" | "publication:deploy:write";
/**
 * Publishing-owned license enforcement mode.
 */
export type PublicationLicenseMode = "disabled" | "optional" | "required";
/**
 * Capability mapping from generic license access rules into publishing capabilities.
 */
export interface PublicationLicenseCapabilityRule {
    readonly capability: PublicationCapability;
    readonly match?: PublishingLicenseAccessMatchMode;
    readonly requirements: readonly [
        PublishingLicenseAccessRequirement,
        ...PublishingLicenseAccessRequirement[]
    ];
}
/**
 * Optional publishing-side license policy layered on top of publication grants.
 */
export interface PublicationLicensePolicy {
    readonly mode: PublicationLicenseMode;
    readonly scope?: PublishingLicenseScope;
    readonly providerIds?: readonly string[];
    readonly capabilityRules?: readonly PublicationLicenseCapabilityRule[];
}
/**
 * Serializable license metadata exposed on resolved publishing sessions.
 */
export interface PublicationLicenseSession {
    readonly enabled: boolean;
    readonly mode: PublicationLicenseMode;
    readonly evaluation: "disabled" | "fallback" | "blocked" | "authenticated";
    readonly sessionState: "disabled" | "provider-denied" | "unavailable" | PublishingLicenseSessionState;
    readonly scope?: PublishingLicenseScope;
    readonly account?: string;
    readonly grantedBundleIds: readonly string[];
    readonly grantedCapabilityIds: readonly string[];
    readonly mappedCapabilities: readonly PublicationCapability[];
    readonly matchedTierIds: readonly string[];
    readonly matchedPartnerIds: readonly string[];
    readonly sources: readonly string[];
    readonly reason?: string;
}
/**
 * Supported auth methods for publication-aware sessions.
 */
export type PublicationAuthMethod = "local" | "wallet" | "token" | "unknown";
/**
 * Identity provider descriptor for future wallet- and token-backed access.
 */
export interface IdentityProvider {
    readonly id: string;
    readonly label: string;
    readonly kind: "local" | "wallet" | "oidc" | "custom";
    readonly authMethod?: PublicationAuthMethod;
    readonly defaultCapabilities?: readonly PublicationCapability[];
    readonly walletNamespace?: "eip155" | "sonic" | "unknown";
}
/**
 * Active principal for the current publication session.
 */
export interface SessionPrincipal {
    readonly id: string;
    readonly displayName: string;
    readonly authMethod: PublicationAuthMethod;
    readonly walletAddress?: string;
    readonly capabilities: readonly PublicationCapability[];
}
/**
 * Request-scoped publication session resolved from an identity provider.
 */
export interface PublicationSession {
    readonly providerId: string;
    readonly principal: SessionPrincipal;
    readonly license: PublicationLicenseSession;
}
/**
 * Named publication group used to map principals to reusable capability bundles.
 */
export interface PublicationPolicyGroup {
    readonly id: string;
    readonly label: string;
    readonly capabilities: readonly PublicationCapability[];
    readonly principalIds?: readonly string[];
    readonly walletAddresses?: readonly string[];
}
/**
 * Explicit publication grant for a single local or wallet-backed principal.
 */
export interface PublicationPolicyGrant {
    readonly id: string;
    readonly label: string;
    readonly capabilities: readonly PublicationCapability[];
    readonly principalId?: string;
    readonly walletAddress?: string;
    readonly providerId?: string;
    readonly displayName?: string;
}
/**
 * Publication-owned policy for identity providers and capability grants.
 */
export interface PublicationPolicy {
    readonly identityProviders: readonly IdentityProvider[];
    readonly defaultPrincipal: SessionPrincipal;
    readonly adminPrincipalIds?: readonly string[];
    readonly adminWalletAddresses?: readonly string[];
    readonly groups?: readonly PublicationPolicyGroup[];
    readonly grants?: readonly PublicationPolicyGrant[];
    readonly license?: PublicationLicensePolicy;
}
/**
 * Request-scoped license resolver inputs used by publishing's async session adapter.
 */
export interface PublicationSessionLicenseOptions {
    readonly resolver?: PublishingLicenseResolver;
    readonly evidence?: readonly PublishingLicenseSessionEvidence[];
}
export type { PublishingLicenseAccessMatchMode, PublishingLicenseAccessRequirement, PublishingLicenseEntitlementResult, PublishingLicenseResolver, PublishingLicenseScope, PublishingLicenseSessionResult, PublishingLicenseSessionEvidence, PublishingLicenseSessionState, } from "../internal/license.js";
/**
 * Publication profile used to keep the core package domain agnostic.
 */
export interface PublicationProfile {
    readonly title: string;
    readonly brand: string;
    readonly language: string;
    readonly description?: string;
    readonly canonicalSiteUrl?: string;
    readonly canonicalDocsUrl?: string;
    readonly navigationLabel?: string;
    readonly docsLabel?: string;
}
/**
 * Deploy target metadata for static-first publication workspaces.
 */
export interface DeployTarget {
    readonly id: string;
    readonly label: string;
    readonly provider: "cloudflare-pages" | "filesystem" | "unknown";
    readonly outputDir: string;
    readonly projectName?: string;
    readonly url?: string;
}
/**
 * Declares which content kinds and actions are enabled for a workspace.
 */
export interface PublicationCapabilitySet {
    readonly contentKinds: readonly ContentKind[];
    readonly actions: readonly PublicationCapability[];
}
/**
 * Resolved publication workspace metadata for a single local publishing project.
 */
export interface PublicationWorkspace {
    readonly id: string;
    readonly title: string;
    readonly root: string;
    readonly contentRoot: string;
    readonly profile: PublicationProfile;
    readonly deployTargets: readonly DeployTarget[];
    readonly capabilities: PublicationCapabilitySet;
    readonly policy: PublicationPolicy;
}
/**
 * Studio workspace modes keep editor focus separate from publish workflow state.
 */
export type PublishingWorkspaceMode = "browse" | "write" | "preview" | "review" | "publish";
/**
 * Simple SEO metadata attached to published documents.
 */
export interface PublishingSeo {
    readonly title?: string;
    readonly description?: string;
}
/**
 * Visibility attached to canonical tag documents.
 */
export type PublishingTagVisibility = "public" | "internal";
/**
 * Editorial status surfaced in the local studio.
 */
export type PublishingDocumentStatus = "draft" | "published";
/**
 * Reader access attached to publishable content entries.
 */
export type PublishingContentAccess = "public" | "members" | "paid_members";
/**
 * Shared link shape for navigation, CTAs, and footer links.
 */
export interface NavigationItem {
    readonly label: string;
    readonly href: string;
    readonly external?: boolean;
    readonly description?: string;
    readonly children?: readonly NavigationItem[];
}
/**
 * Site-wide metadata singleton.
 */
export interface SiteSettingsDocument {
    readonly kind: "site_settings";
    readonly title: string;
    readonly description: string;
    readonly language: string;
    readonly footerNotice: string;
    readonly contactEmail: string;
    readonly socialLinks: readonly NavigationItem[];
    readonly themeColor?: string;
    readonly seo?: PublishingSeo;
}
/**
 * Navigation singleton for site and docs chrome.
 */
export interface NavigationDocument {
    readonly kind: "navigation";
    readonly mainLinks: readonly NavigationItem[];
    readonly footerLinks: readonly NavigationItem[];
}
/**
 * Homepage hero metric row.
 */
export interface HomepageHeroMetric {
    readonly label: string;
    readonly value: string;
}
/**
 * Homepage feature block.
 */
export interface HomepageFeatureBlock {
    readonly eyebrow?: string;
    readonly title: string;
    readonly body: string;
    readonly bullets: readonly string[];
    readonly link?: NavigationItem;
}
/**
 * Homepage CTA block.
 */
export interface HomepageCtaBlock {
    readonly tone?: "default" | "accent" | "subtle";
    readonly title: string;
    readonly body: string;
    readonly link: NavigationItem;
}
/**
 * Homepage singleton document.
 */
export interface HomepageDocument {
    readonly kind: "homepage";
    readonly heroEyebrow: string;
    readonly heroTitle: string;
    readonly heroBody: string;
    readonly heroMetrics: readonly HomepageHeroMetric[];
    readonly primaryCta: NavigationItem;
    readonly secondaryCta?: NavigationItem;
    readonly featureBlocks: readonly HomepageFeatureBlock[];
    readonly ctaBlocks: readonly HomepageCtaBlock[];
    readonly seo?: PublishingSeo;
}
/**
 * Canonical tag document used by posts, pages, and future archive surfaces.
 */
export interface TagDocument {
    readonly kind: "tag";
    readonly label: string;
    readonly slug: string;
    readonly description?: string;
    readonly visibility?: PublishingTagVisibility;
    readonly color?: string;
    readonly featureImage?: string;
    readonly seo?: PublishingSeo;
    readonly ogImage?: string;
    readonly codeInjectionHead?: string;
    readonly codeInjectionFoot?: string;
}
/**
 * Blog/news author metadata.
 */
export interface PublishingAuthor {
    readonly name: string;
    readonly role?: string;
    readonly bio?: string;
    readonly avatarUrl?: string;
}
/**
 * Blog/news post document.
 */
export interface PostDocument {
    readonly kind: "post";
    readonly title: string;
    readonly slug: string;
    readonly excerpt: string;
    readonly body: string;
    readonly featureImage?: string;
    readonly access?: PublishingContentAccess;
    readonly status?: PublishingDocumentStatus;
    readonly publishedAt?: string;
    readonly tags: readonly string[];
    readonly author?: PublishingAuthor;
    readonly seo?: PublishingSeo;
}
/**
 * Standalone page document with Ghost-style page semantics.
 */
export interface PageDocument {
    readonly kind: "page";
    readonly title: string;
    readonly slug: string;
    readonly excerpt: string;
    readonly body: string;
    readonly featureImage?: string;
    readonly status?: PublishingDocumentStatus;
    readonly publishedAt?: string;
    readonly createdAt?: string;
    readonly updatedAt?: string;
    readonly visibility?: PublishingContentAccess;
    readonly seo?: PublishingSeo;
}
/**
 * Docs navigation section document.
 */
export interface DocSectionDocument {
    readonly kind: "doc_section";
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly description?: string;
    readonly order: number;
    readonly version?: string;
}
/**
 * Individual docs page document.
 */
export interface DocPageDocument {
    readonly kind: "doc_page";
    readonly title: string;
    readonly slug: string;
    readonly summary: string;
    readonly body: string;
    readonly featureImage?: string;
    readonly access?: PublishingContentAccess;
    readonly status?: PublishingDocumentStatus;
    readonly publishedAt?: string;
    readonly tags?: readonly string[];
    readonly author?: PublishingAuthor;
    readonly sectionId?: string;
    readonly order: number;
    readonly version?: string;
    readonly seo?: PublishingSeo;
}
/**
 * Git-managed media asset metadata.
 */
export interface AssetDocument {
    readonly kind: "asset";
    readonly id: string;
    readonly path: string;
    readonly label: string;
    readonly mimeType?: string;
}
/**
 * Union of all canonical publishing documents.
 */
export type PublishingDocument = SiteSettingsDocument | NavigationDocument | HomepageDocument | TagDocument | PostDocument | PageDocument | DocSectionDocument | DocPageDocument | AssetDocument;
/**
 * Persisted draft record stored in `.studio/drafts/`.
 */
export type PublishingDraftOperation = "upsert" | "delete";
export interface PublishingDraftRecord {
    readonly draftId: string;
    readonly operation: PublishingDraftOperation;
    readonly document: PublishingDocument;
    readonly savedAt: string;
    readonly sourcePath?: string;
}
/**
 * Route/index entry generated from canonical content.
 */
export interface PublishingIndexEntry {
    readonly kind: "homepage" | "site_settings" | "navigation" | "post" | "doc_page";
    readonly title: string;
    readonly slug: string;
    readonly route: string;
    readonly description: string;
    readonly access: PublishingContentAccess;
    readonly authorName?: string;
    readonly authorAvatarUrl?: string;
    readonly tags?: readonly string[];
    readonly status: PublishingDocumentStatus;
    readonly publishedAt?: string;
    readonly sectionTitle?: string;
}
/**
 * Docs tree node used by Astro loaders and the studio sidebar.
 */
export interface PublishingDocsTreeSection {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly description?: string;
    readonly order: number;
    readonly pages: readonly DocPageDocument[];
}
/**
 * Route and docs-tree manifest derived from canonical content.
 */
export interface PublishingRouteManifest {
    readonly entries: readonly PublishingIndexEntry[];
    readonly docsTree: readonly PublishingDocsTreeSection[];
}
/**
 * Full in-memory snapshot of a publishing workspace.
 */
export interface PublishingRepositorySnapshot {
    readonly siteSettings: SiteSettingsDocument;
    readonly navigation: NavigationDocument;
    readonly homepage: HomepageDocument;
    readonly tags: readonly TagDocument[];
    readonly posts: readonly PostDocument[];
    readonly pages: readonly PageDocument[];
    readonly docSections: readonly DocSectionDocument[];
    readonly docPages: readonly DocPageDocument[];
    readonly assets: readonly AssetDocument[];
    readonly routes: PublishingRouteManifest;
}
/**
 * Diff emitted before a draft is applied to canonical content.
 */
export interface PublishingDiff {
    readonly relativePath: string;
    readonly before: string;
    readonly after: string;
}
/**
 * Preview model returned by preview services.
 */
export interface PublishingPreview {
    readonly title: string;
    readonly route: string;
    readonly excerpt: string;
    readonly html: string;
}
/**
 * Metadata fields editable through the publishing studio shell.
 */
export interface PublishingEditableMetadata {
    readonly title: string;
    readonly slug: string;
    readonly summary: string;
    readonly featureImage: string;
    readonly status: PublishingDocumentStatus;
    readonly publishedAt: string;
    readonly tags: string;
    readonly authorName: string;
    readonly authorRole: string;
    readonly seoTitle: string;
    readonly seoDescription: string;
    readonly sectionId: string;
}
/**
 * Supported AI assist actions in the local publishing workflow.
 */
export type PublishingAiAction = "suggest_excerpt" | "suggest_slug" | "suggest_links";
/**
 * AI suggestion returned to the studio.
 */
export interface PublishingAiSuggestion {
    readonly action: PublishingAiAction;
    readonly content: string | readonly string[];
    readonly rationale: string;
}
