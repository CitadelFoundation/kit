/**
 * Runtime validation for canonical publishing documents.
 *
 * @module @citadelfoundation/kit-publishing/content/schema
 */
import { z } from "zod";
import type { ContentKind, PublishingDocument, PublishingValidationIssue } from "../types/index.js";
/**
 * Zod schema for the site settings singleton.
 */
export declare const siteSettingsDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"site_settings">;
    title: z.ZodString;
    description: z.ZodString;
    language: z.ZodString;
    footerNotice: z.ZodString;
    contactEmail: z.ZodString;
    socialLinks: z.ZodArray<z.ZodType<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown, z.core.$ZodTypeInternals<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown>>>;
    themeColor: z.ZodOptional<z.ZodString>;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Zod schema for the navigation singleton.
 */
export declare const navigationDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"navigation">;
    mainLinks: z.ZodArray<z.ZodType<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown, z.core.$ZodTypeInternals<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown>>>;
    footerLinks: z.ZodArray<z.ZodType<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown, z.core.$ZodTypeInternals<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown>>>;
}, z.core.$strip>;
/**
 * Zod schema for the homepage singleton.
 */
export declare const homepageDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"homepage">;
    heroEyebrow: z.ZodString;
    heroTitle: z.ZodString;
    heroBody: z.ZodString;
    heroMetrics: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>;
    primaryCta: z.ZodType<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown, z.core.$ZodTypeInternals<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown>>;
    secondaryCta: z.ZodOptional<z.ZodType<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown, z.core.$ZodTypeInternals<{
        label: string;
        href: string;
        external?: boolean;
        description?: string;
        children?: Array<unknown>;
    }, unknown>>>;
    featureBlocks: z.ZodArray<z.ZodObject<{
        eyebrow: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        body: z.ZodString;
        bullets: z.ZodArray<z.ZodString>;
        link: z.ZodOptional<z.ZodType<{
            label: string;
            href: string;
            external?: boolean;
            description?: string;
            children?: Array<unknown>;
        }, unknown, z.core.$ZodTypeInternals<{
            label: string;
            href: string;
            external?: boolean;
            description?: string;
            children?: Array<unknown>;
        }, unknown>>>;
    }, z.core.$strip>>;
    ctaBlocks: z.ZodArray<z.ZodObject<{
        tone: z.ZodOptional<z.ZodEnum<{
            default: "default";
            accent: "accent";
            subtle: "subtle";
        }>>;
        title: z.ZodString;
        body: z.ZodString;
        link: z.ZodType<{
            label: string;
            href: string;
            external?: boolean;
            description?: string;
            children?: Array<unknown>;
        }, unknown, z.core.$ZodTypeInternals<{
            label: string;
            href: string;
            external?: boolean;
            description?: string;
            children?: Array<unknown>;
        }, unknown>>;
    }, z.core.$strip>>;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Zod schema for persisted tag documents.
 */
export declare const tagDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"tag">;
    label: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<{
        public: "public";
        internal: "internal";
    }>>;
    color: z.ZodOptional<z.ZodString>;
    featureImage: z.ZodOptional<z.ZodString>;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    ogImage: z.ZodOptional<z.ZodString>;
    codeInjectionHead: z.ZodOptional<z.ZodString>;
    codeInjectionFoot: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Zod schema for blog/news posts.
 */
export declare const postDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"post">;
    title: z.ZodString;
    slug: z.ZodString;
    excerpt: z.ZodString;
    body: z.ZodString;
    featureImage: z.ZodOptional<z.ZodString>;
    access: z.ZodDefault<z.ZodEnum<{
        public: "public";
        members: "members";
        paid_members: "paid_members";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
    }>>;
    publishedAt: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString>;
    author: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        role: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Zod schema for standalone pages.
 */
export declare const pageDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"page">;
    title: z.ZodString;
    slug: z.ZodString;
    excerpt: z.ZodString;
    body: z.ZodString;
    featureImage: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
    }>>;
    publishedAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<{
        public: "public";
        members: "members";
        paid_members: "paid_members";
    }>>;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Zod schema for docs sections.
 */
export declare const docSectionDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"doc_section">;
    id: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    order: z.ZodDefault<z.ZodNumber>;
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Zod schema for docs pages.
 */
export declare const docPageDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"doc_page">;
    title: z.ZodString;
    slug: z.ZodString;
    summary: z.ZodString;
    body: z.ZodString;
    featureImage: z.ZodOptional<z.ZodString>;
    access: z.ZodDefault<z.ZodEnum<{
        public: "public";
        members: "members";
        paid_members: "paid_members";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
    }>>;
    publishedAt: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    author: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        role: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    sectionId: z.ZodOptional<z.ZodString>;
    order: z.ZodDefault<z.ZodNumber>;
    version: z.ZodOptional<z.ZodString>;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Zod schema for managed asset metadata.
 */
export declare const assetDocumentSchema: z.ZodObject<{
    kind: z.ZodLiteral<"asset">;
    id: z.ZodString;
    path: z.ZodString;
    label: z.ZodString;
    mimeType: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Convert a Zod error into stable publishing validation issues.
 */
export declare function toValidationIssues(error: z.ZodError, path: string): readonly PublishingValidationIssue[];
/**
 * Validate an arbitrary document payload for a specific canonical kind.
 */
export declare function validatePublishingDocument(kind: ContentKind, value: unknown, path: string): {
    success: true;
    value: PublishingDocument;
} | {
    success: false;
    error: readonly PublishingValidationIssue[];
};
