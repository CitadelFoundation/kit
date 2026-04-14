/**
 * Runtime validation for canonical publishing documents.
 *
 * @module @citadelfoundation/kit-publishing/content/schema
 */
import { z } from "zod";
const publishingSeoSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
});
const publishingStatusSchema = z
    .enum(["draft", "published"])
    .default("published");
const publishingAccessSchema = z
    .enum(["public", "members", "paid_members"])
    .default("public");
const publishingPageVisibilitySchema = publishingAccessSchema;
const publishingTagVisibilitySchema = z
    .enum(["public", "internal"])
    .default("public");
const navigationItemSchema = z.lazy(() => z.object({
    label: z.string().min(1),
    href: z.string().min(1),
    external: z.boolean().optional(),
    description: z.string().optional(),
    children: z.array(navigationItemSchema).optional(),
}));
const homepageHeroMetricSchema = z.object({
    label: z.string().min(1),
    value: z.string().min(1),
});
const homepageFeatureBlockSchema = z.object({
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    body: z.string().min(1),
    bullets: z.array(z.string().min(1)),
    link: navigationItemSchema.optional(),
});
const homepageCtaBlockSchema = z.object({
    tone: z.enum(["default", "accent", "subtle"]).optional(),
    title: z.string().min(1),
    body: z.string().min(1),
    link: navigationItemSchema,
});
const publishingAuthorSchema = z.object({
    name: z.string().min(1),
    role: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
});
/**
 * Zod schema for the site settings singleton.
 */
export const siteSettingsDocumentSchema = z.object({
    kind: z.literal("site_settings"),
    title: z.string().min(1),
    description: z.string().min(1),
    language: z.string().min(2),
    footerNotice: z.string().min(1),
    contactEmail: z.string().min(3),
    socialLinks: z.array(navigationItemSchema),
    themeColor: z.string().optional(),
    seo: publishingSeoSchema.optional(),
});
/**
 * Zod schema for the navigation singleton.
 */
export const navigationDocumentSchema = z.object({
    kind: z.literal("navigation"),
    mainLinks: z.array(navigationItemSchema),
    footerLinks: z.array(navigationItemSchema),
});
/**
 * Zod schema for the homepage singleton.
 */
export const homepageDocumentSchema = z.object({
    kind: z.literal("homepage"),
    heroEyebrow: z.string().min(1),
    heroTitle: z.string().min(1),
    heroBody: z.string().min(1),
    heroMetrics: z.array(homepageHeroMetricSchema),
    primaryCta: navigationItemSchema,
    secondaryCta: navigationItemSchema.optional(),
    featureBlocks: z.array(homepageFeatureBlockSchema),
    ctaBlocks: z.array(homepageCtaBlockSchema),
    seo: publishingSeoSchema.optional(),
});
/**
 * Zod schema for persisted tag documents.
 */
export const tagDocumentSchema = z.object({
    kind: z.literal("tag"),
    label: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    visibility: publishingTagVisibilitySchema,
    color: z.string().optional(),
    featureImage: z.string().optional(),
    seo: publishingSeoSchema.optional(),
    ogImage: z.string().optional(),
    codeInjectionHead: z.string().optional(),
    codeInjectionFoot: z.string().optional(),
});
/**
 * Zod schema for blog/news posts.
 */
export const postDocumentSchema = z.object({
    kind: z.literal("post"),
    title: z.string().min(1),
    slug: z.string().min(1),
    excerpt: z.string().min(1),
    body: z.string(),
    featureImage: z.string().optional(),
    access: publishingAccessSchema,
    status: publishingStatusSchema,
    publishedAt: z.string().optional(),
    tags: z.array(z.string()),
    author: publishingAuthorSchema.optional(),
    seo: publishingSeoSchema.optional(),
});
/**
 * Zod schema for standalone pages.
 */
export const pageDocumentSchema = z.object({
    kind: z.literal("page"),
    title: z.string().min(1),
    slug: z.string().min(1),
    excerpt: z.string().min(1),
    body: z.string(),
    featureImage: z.string().optional(),
    status: publishingStatusSchema,
    publishedAt: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    visibility: publishingPageVisibilitySchema,
    seo: publishingSeoSchema.optional(),
});
/**
 * Zod schema for docs sections.
 */
export const docSectionDocumentSchema = z.object({
    kind: z.literal("doc_section"),
    id: z.string().min(1),
    title: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().default(0),
    version: z.string().optional(),
});
/**
 * Zod schema for docs pages.
 */
export const docPageDocumentSchema = z.object({
    kind: z.literal("doc_page"),
    title: z.string().min(1),
    slug: z.string().min(1),
    summary: z.string().min(1),
    body: z.string(),
    featureImage: z.string().optional(),
    access: publishingAccessSchema,
    status: publishingStatusSchema,
    publishedAt: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: publishingAuthorSchema.optional(),
    sectionId: z.string().optional(),
    order: z.number().int().default(0),
    version: z.string().optional(),
    seo: publishingSeoSchema.optional(),
});
/**
 * Zod schema for managed asset metadata.
 */
export const assetDocumentSchema = z.object({
    kind: z.literal("asset"),
    id: z.string().min(1),
    path: z.string().min(1),
    label: z.string().min(1),
    mimeType: z.string().optional(),
});
/**
 * Convert a Zod error into stable publishing validation issues.
 */
export function toValidationIssues(error, path) {
    return error.issues.map((issue) => ({
        path,
        message: issue.path.length > 0
            ? `${issue.path.join(".")}: ${issue.message}`
            : issue.message,
    }));
}
/**
 * Validate an arbitrary document payload for a specific canonical kind.
 */
export function validatePublishingDocument(kind, value, path) {
    const schema = documentSchemaByKind[kind];
    const result = schema.safeParse(value);
    if (!result.success) {
        return { success: false, error: toValidationIssues(result.error, path) };
    }
    return { success: true, value: result.data };
}
const documentSchemaByKind = {
    site_settings: siteSettingsDocumentSchema,
    navigation: navigationDocumentSchema,
    homepage: homepageDocumentSchema,
    tag: tagDocumentSchema,
    post: postDocumentSchema,
    page: pageDocumentSchema,
    doc_section: docSectionDocumentSchema,
    doc_page: docPageDocumentSchema,
    asset: assetDocumentSchema,
};
