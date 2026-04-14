/**
 * Shared model helpers for the local publishing studio host.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/model
 */
import { normalizePublishingSlug, slugifyPublishingValue, } from "../../content/routes.js";
import { DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET, isPublishingStudioPostsBucket, publishingStudioPostsBucketForEntry, } from "../browse_state.js";
import { hasPublicationCapability } from "../../workspace.js";
const STUDIO_ROUTE_HOMEPAGE = "/";
const STUDIO_ROUTE_SITE_SETTINGS = "/__studio/site/settings";
const STUDIO_ROUTE_NAVIGATION = "/__studio/site/navigation";
const STUDIO_BROWSE_SURFACES = [
    "dashboard",
    "posts",
    "pages",
    "tags",
    "settings",
];
/**
 * Base pathname for the standalone publishing host.
 */
export const PUBLISHING_STUDIO_BASE_PATH = "/studio";
/**
 * Public browser path prefix for locally staged content/media assets.
 */
export const PUBLISHING_STUDIO_MEDIA_PATH_PREFIX = "/content/media/";
/**
 * Sign-in pathname for the standalone publishing host.
 */
export const PUBLISHING_STUDIO_SIGNIN_PATH = "/studio/signin";
/**
 * Convert a content route into a stable draft identifier.
 */
export function routeToDraftId(route) {
    if (route === "/") {
        return "homepage";
    }
    return slugifyPublishingValue(route.replace(/^\/+/, "").replaceAll("/", "-"));
}
/**
 * Build a stable standalone browse URL for the requested surface.
 */
export function publishingStudioPathForBrowseSurface(surface, options = {}) {
    if (surface === "posts") {
        if (!options.postsBucket ||
            options.postsBucket === DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET) {
            return `${PUBLISHING_STUDIO_BASE_PATH}/posts`;
        }
        return `${PUBLISHING_STUDIO_BASE_PATH}/posts/${options.postsBucket}`;
    }
    return `${PUBLISHING_STUDIO_BASE_PATH}/${surface}`;
}
/**
 * Build a stable standalone editor URL for a document route.
 */
export function publishingStudioPathForEditorRoute(route) {
    const url = new URL(`${PUBLISHING_STUDIO_BASE_PATH}/editor`, "http://127.0.0.1");
    url.searchParams.set("route", route);
    return `${url.pathname}${url.search}`;
}
/**
 * Resolve a browser-safe preview path for a local publishing asset.
 */
export function resolvePublishingStudioAssetPreviewPath(value) {
    const normalized = value.trim();
    if (normalized.length === 0) {
        return undefined;
    }
    if (/^(?:https?:|data:|blob:|\/\/)/iu.test(normalized)) {
        return normalized;
    }
    return `/${normalized.replace(/^\/+/u, "")}`;
}
/**
 * Resolve the publishing studio startup target from a standalone host URL.
 */
export function resolvePublishingStudioPathTarget(url, entries) {
    const fallbackAnchorRoute = selectDashboardAnchorRoute(entries);
    const studioPath = normalizeStudioSubpath(url.pathname);
    if (!studioPath) {
        return {
            kind: "dashboard-fallback",
            anchorRoute: fallbackAnchorRoute,
        };
    }
    if (studioPath === "/editor") {
        const route = url.searchParams.get("route")?.trim() ?? "";
        return route.startsWith("/") &&
            entries.some((entry) => entry.route === route)
            ? {
                kind: "editor",
                route,
            }
            : {
                kind: "dashboard-fallback",
                anchorRoute: fallbackAnchorRoute,
            };
    }
    const browseTarget = parseBrowseSurfaceFromPath(studioPath);
    if (!browseTarget) {
        return {
            kind: "dashboard-fallback",
            anchorRoute: fallbackAnchorRoute,
        };
    }
    const anchorRoute = selectBrowseSurfaceAnchorRoute(browseTarget.surface, entries, browseTarget.postsBucket);
    if (!anchorRoute) {
        return {
            kind: "dashboard-fallback",
            anchorRoute: fallbackAnchorRoute,
        };
    }
    return {
        kind: "browse",
        surface: browseTarget.surface,
        anchorRoute,
        ...(browseTarget.postsBucket
            ? { postsBucket: browseTarget.postsBucket }
            : {}),
    };
}
/**
 * Resolve the best available consumer-site destination for the studio shell.
 */
export function resolvePublishingStudioSiteDestination(workspace, currentUrl) {
    const candidates = [];
    const canonicalSiteUrl = workspace.profile.canonicalSiteUrl?.trim() ?? "";
    if (canonicalSiteUrl.length > 0) {
        candidates.push({
            value: canonicalSiteUrl,
            source: "canonical-site-url",
        });
    }
    for (const target of workspace.deployTargets) {
        const targetUrl = target.url?.trim() ?? "";
        if (targetUrl.length === 0) {
            continue;
        }
        candidates.push({
            value: targetUrl,
            source: "deploy-target-url",
        });
    }
    for (const candidate of candidates) {
        const resolved = resolveSiteDestinationCandidate(candidate.value, currentUrl);
        if (!resolved) {
            continue;
        }
        return {
            kind: "available",
            href: resolved.toString(),
            source: candidate.source,
        };
    }
    if (candidates.length === 0) {
        return {
            kind: "unavailable",
            reason: "missing",
            message: "No site URL is configured yet. Add a canonical site URL or deploy target URL before opening the consumer site.",
        };
    }
    return {
        kind: "unavailable",
        reason: "invalid",
        message: "Configured site URLs must use http or https and cannot point back to the studio shell.",
    };
}
/**
 * Filter the visible sign-in providers for a workspace.
 */
export function publishingStudioProvidersForSignIn(workspace) {
    const licensePolicy = workspace.policy.license;
    if (licensePolicy?.mode === "required" &&
        licensePolicy.providerIds &&
        licensePolicy.providerIds.length > 0) {
        return workspace.policy.identityProviders.filter((provider) => licensePolicy.providerIds?.includes(provider.id));
    }
    return workspace.policy.identityProviders;
}
/**
 * Decide whether the current session may continue into the interactive studio shell.
 */
export function resolvePublishingStudioEntryGate(workspace, session) {
    if (hasPublicationCapability(session, "content:read")) {
        return { allowed: true, redirectToSignin: false };
    }
    const reason = resolvePublishingStudioEntryGateReason(workspace, session);
    return {
        allowed: false,
        redirectToSignin: reason === "license-required" ||
            reason === "license-invalid" ||
            reason === "license-provider",
        reason,
        message: messageForPublishingStudioEntryGateReason(reason),
    };
}
/**
 * Human-facing copy for entry-gate reasons.
 */
export function messageForPublishingStudioEntryGateReason(reason) {
    switch (reason) {
        case "license-required":
            return "A licensed sign-in is required before this workspace can load.";
        case "license-invalid":
            return "The active licensed session is invalid. Sign in again.";
        case "license-unavailable":
            return "This workspace requires licensing, but the current host is not configured to resolve licensed sessions.";
        case "license-provider":
            return "Select one of the configured licensed identity providers to continue.";
        case "access-denied":
            return "The selected account is not entitled to this workspace.";
    }
}
/**
 * Derive the editable text value for a document.
 */
export function editorValueForDocument(document) {
    switch (document.kind) {
        case "post":
        case "page":
        case "doc_page":
            return document.body;
        case "asset":
            return document.path;
        default:
            return `${JSON.stringify(document, null, 2)}\n`;
    }
}
/**
 * Apply the edited text back to the current document shape.
 */
export function documentFromEditorValue(document, value) {
    switch (document.kind) {
        case "post":
        case "page":
        case "doc_page":
            return { ...document, body: value };
        case "asset":
            return { ...document, path: value.trim() };
        default: {
            const parsed = JSON.parse(value);
            return {
                ...parsed,
                kind: document.kind,
            };
        }
    }
}
/**
 * Derive editable metadata fields for the active studio document.
 */
export function metadataForDocument(document) {
    switch (document.kind) {
        case "post":
            return {
                title: document.title,
                slug: document.slug,
                summary: document.excerpt,
                featureImage: document.featureImage ?? "",
                status: document.status ?? "published",
                publishedAt: document.publishedAt ?? "",
                tags: document.tags.join(", "),
                authorName: document.author?.name ?? "",
                authorRole: document.author?.role ?? "",
                seoTitle: document.seo?.title ?? "",
                seoDescription: document.seo?.description ?? "",
                sectionId: "",
            };
        case "page":
            return {
                title: document.title,
                slug: document.slug,
                summary: document.excerpt,
                featureImage: document.featureImage ?? "",
                status: document.status ?? "published",
                publishedAt: document.publishedAt ?? "",
                tags: "",
                authorName: "",
                authorRole: "",
                seoTitle: document.seo?.title ?? "",
                seoDescription: document.seo?.description ?? "",
                sectionId: "",
            };
        case "doc_page":
            return {
                title: document.title,
                slug: document.slug,
                summary: document.summary,
                featureImage: document.featureImage ?? "",
                status: document.status ?? "published",
                publishedAt: document.publishedAt ?? "",
                tags: (document.tags ?? []).join(", "),
                authorName: document.author?.name ?? "",
                authorRole: document.author?.role ?? "",
                seoTitle: document.seo?.title ?? "",
                seoDescription: document.seo?.description ?? "",
                sectionId: document.sectionId ?? "",
            };
        default:
            return {
                title: "",
                slug: "",
                summary: "",
                featureImage: "",
                status: "published",
                publishedAt: "",
                tags: "",
                authorName: "",
                authorRole: "",
                seoTitle: "",
                seoDescription: "",
                sectionId: "",
            };
    }
}
/**
 * Apply edited metadata values back to the active document.
 */
export function documentWithMetadata(document, metadata) {
    const author = metadata.authorName.trim().length > 0
        ? {
            name: metadata.authorName.trim(),
            role: metadata.authorRole.trim() || undefined,
        }
        : undefined;
    const seo = metadata.seoTitle.trim().length > 0 ||
        metadata.seoDescription.trim().length > 0
        ? {
            title: metadata.seoTitle.trim() || undefined,
            description: metadata.seoDescription.trim() || undefined,
        }
        : undefined;
    const tags = splitTagList(metadata.tags);
    switch (document.kind) {
        case "post":
            return {
                ...document,
                author,
                excerpt: metadata.summary.trim(),
                featureImage: metadata.featureImage.trim() || undefined,
                publishedAt: metadata.publishedAt.trim() || undefined,
                seo,
                slug: metadata.slug.trim(),
                status: metadata.status,
                tags,
                title: metadata.title.trim(),
            };
        case "page":
            return {
                ...document,
                excerpt: metadata.summary.trim(),
                featureImage: metadata.featureImage.trim() || undefined,
                publishedAt: metadata.publishedAt.trim() || undefined,
                seo,
                slug: metadata.slug.trim(),
                status: metadata.status,
                title: metadata.title.trim(),
            };
        case "doc_page":
            return {
                ...document,
                author,
                featureImage: metadata.featureImage.trim() || undefined,
                publishedAt: metadata.publishedAt.trim() || undefined,
                seo,
                sectionId: metadata.sectionId.trim() || undefined,
                slug: metadata.slug.trim(),
                status: metadata.status,
                summary: metadata.summary.trim(),
                tags,
                title: metadata.title.trim(),
            };
        default:
            return document;
    }
}
/**
 * Derive the public route for a loaded document.
 */
export function routeForDocument(document) {
    switch (document.kind) {
        case "homepage":
            return STUDIO_ROUTE_HOMEPAGE;
        case "site_settings":
            return STUDIO_ROUTE_SITE_SETTINGS;
        case "navigation":
            return STUDIO_ROUTE_NAVIGATION;
        case "tag":
            return `${PUBLISHING_STUDIO_BASE_PATH}/tags/${normalizePublishingSlug(document.slug)}`;
        case "post":
            return routeForPost(document);
        case "page":
            return routeForPage(document);
        case "doc_page":
            return routeForDocPage(document);
        case "doc_section":
            return `/docs#${normalizePublishingSlug(document.slug)}`;
        case "asset":
            return `/${document.path.replace(/^\/+/, "")}`;
    }
}
/**
 * Derive the canonical source path for a loaded document.
 */
export function sourcePathForDocument(document) {
    switch (document.kind) {
        case "homepage":
            return "content/site/homepage.json";
        case "site_settings":
            return "content/site/site_settings.json";
        case "navigation":
            return "content/site/navigation.json";
        case "tag":
            return `content/tags/${normalizePublishingSlug(document.slug)}.json`;
        case "post":
            return `content/posts/${normalizePublishingSlug(document.slug)}.mdx`;
        case "page":
            return `content/pages/${normalizePublishingSlug(document.slug)}.mdx`;
        case "doc_section":
            return `content/docs/sections/${slugifyPublishingValue(document.id)}.json`;
        case "doc_page":
            return `content/docs/pages/${normalizePublishingSlug(document.slug)}.mdx`;
        case "asset":
            return document.path.replace(/^\/+/, "");
    }
}
/**
 * Normalize a publishing error into validation issues for the studio shell.
 */
export function validationIssuesForError(error) {
    if (error.issues && error.issues.length > 0) {
        return error.issues;
    }
    return [
        {
            path: error.path ?? "publishing",
            message: error.reason,
        },
    ];
}
function resolvePublishingStudioEntryGateReason(workspace, session) {
    const licensePolicy = workspace.policy.license;
    if (licensePolicy?.mode === "required") {
        switch (session.license.sessionState) {
            case "anonymous":
                return "license-required";
            case "invalid":
                return "license-invalid";
            case "provider-denied":
                return "license-provider";
            case "unavailable":
                return "license-unavailable";
            default:
                return "access-denied";
        }
    }
    return "access-denied";
}
function routeForPost(document) {
    return `/blog/${normalizePublishingSlug(document.slug)}`;
}
function routeForPage(document) {
    return `/__studio/pages/${normalizePublishingSlug(document.slug)}`;
}
function routeForDocPage(document) {
    return `/docs/${normalizePublishingSlug(document.slug)}`;
}
function splitTagList(value) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
function resolveSiteDestinationCandidate(value, currentUrl) {
    try {
        const resolved = new URL(value, currentUrl.origin);
        if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
            return null;
        }
        if (resolved.origin === currentUrl.origin &&
            isStudioShellPathname(resolved.pathname)) {
            return null;
        }
        return resolved;
    }
    catch {
        return null;
    }
}
function isStudioShellPathname(pathname) {
    return (pathname === PUBLISHING_STUDIO_BASE_PATH ||
        pathname.startsWith(`${PUBLISHING_STUDIO_BASE_PATH}/`));
}
function normalizeStudioSubpath(pathname) {
    if (pathname === PUBLISHING_STUDIO_BASE_PATH) {
        return "/";
    }
    if (!pathname.startsWith(`${PUBLISHING_STUDIO_BASE_PATH}/`)) {
        return null;
    }
    return pathname.slice(PUBLISHING_STUDIO_BASE_PATH.length);
}
function parseBrowseSurfaceFromPath(path) {
    if (path === "/dashboard") {
        return { surface: "dashboard" };
    }
    if (path === "/posts" || path === "/posts/") {
        return {
            surface: "posts",
            postsBucket: DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET,
        };
    }
    if (path.startsWith("/posts/")) {
        const segments = path.slice("/posts/".length).split("/").filter(Boolean);
        const postsBucket = segments.length === 1 && isPublishingStudioPostsBucket(segments[0])
            ? segments[0]
            : DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET;
        return {
            surface: "posts",
            postsBucket,
        };
    }
    if (path === "/pages") {
        return { surface: "pages" };
    }
    if (path === "/tags" || path.startsWith("/tags/")) {
        return { surface: "tags" };
    }
    if (path === "/settings" || path.startsWith("/settings/")) {
        return { surface: "settings" };
    }
    return null;
}
function selectDashboardAnchorRoute(entries) {
    return (entries.find((entry) => entry.kind === "homepage")?.route ??
        entries[0]?.route ??
        STUDIO_ROUTE_HOMEPAGE);
}
function selectBrowseSurfaceAnchorRoute(surface, entries, postsBucket) {
    switch (surface) {
        case "dashboard":
            return selectDashboardAnchorRoute(entries);
        case "posts": {
            const bucketRoute = postsBucket
                ? entries.find((entry) => entry.kind === "post" &&
                    publishingStudioPostsBucketForEntry(entry) === postsBucket)?.route
                : undefined;
            return (bucketRoute ??
                entries.find((entry) => entry.kind === "post")?.route ??
                null);
        }
        case "pages":
            return entries.find((entry) => entry.kind === "doc_page")?.route ?? null;
        case "tags":
            return selectDashboardAnchorRoute(entries);
        case "settings":
            return (entries.find((entry) => entry.kind === "site_settings")?.route ??
                entries.find((entry) => entry.kind === "navigation")?.route ??
                entries.find((entry) => entry.kind === "homepage")?.route ??
                null);
    }
}
