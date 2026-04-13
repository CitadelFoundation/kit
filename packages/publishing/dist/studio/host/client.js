/**
 * Browser client for the local publishing studio host.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/client
 */
import "../components/publishing_studio.js";
import "../components/content/content-list.js";
import { createMarkdownEditorAdapter } from "../editor_adapter.js";
import { DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET, } from "../browse_state.js";
import { slugifyPublishingValue } from "../../content/routes.js";
import { hasPublicationCapability } from "../../workspace.js";
import { PUBLISHING_STUDIO_SIGNIN_PATH, documentFromEditorValue, documentWithMetadata, editorValueForDocument, messageForPublishingStudioEntryGateReason, metadataForDocument, publishingStudioPathForBrowseSurface, publishingStudioProvidersForSignIn, publishingStudioPathForEditorRoute, resolvePublishingStudioEntryGate, resolvePublishingStudioPathTarget, resolvePublishingStudioSiteDestination, routeForDocument, routeToDraftId, sourcePathForDocument, validationIssuesForError, } from "./model.js";
const studio = getStudioElement();
const authShell = getAuthShellElement();
const STUDIO_ROUTE_HOMEPAGE = "/";
const STUDIO_ROUTE_SITE_SETTINGS = "/__studio/site/settings";
const STUDIO_ROUTE_NAVIGATION = "/__studio/site/navigation";
const PUBLISHING_SESSION_HINT_STORAGE_KEY = "__kit_publishing_session_hint__";
const DEFAULT_STUDIO_SURFACE = "dashboard";
let pendingAuthError = "";
const state = {
    entries: [],
    media: [],
    docSections: [],
    tags: [],
    workspace: null,
    session: null,
    selectedRoute: "/",
    document: null,
    editorValue: "",
    metadata: emptyMetadata(),
    reviewDiffs: [],
    routeLoadRevision: 0,
};
async function boot() {
    try {
        const locationAuthReason = consumeLocationAuthReason();
        if (locationAuthReason) {
            pendingAuthError = locationAuthReason;
        }
        const locationAuthRequest = consumeLocationAuthRequest();
        if (locationAuthRequest) {
            const saved = saveSessionHint(locationAuthRequest.hint);
            if (!saved) {
                pendingAuthError =
                    "This browser blocked local session storage. Sign-in cannot continue until local storage is available.";
            }
            else if (locationAuthRequest.auto) {
                const targetPath = resolveRouteKind() === "studio"
                    ? locationAuthRequest.redirectPath
                    : publishingStudioPathForBrowseSurface(DEFAULT_STUDIO_SURFACE);
                window.location.assign(targetPath);
                return;
            }
        }
        const workspace = await loadWorkspace();
        state.workspace = workspace;
        studio.workspace = workspace;
        studio.title = `${workspace.profile.title} Studio`;
        if (resolveRouteKind() === "signin") {
            renderSignIn(workspace);
            return;
        }
        if (!getStoredSessionHint()) {
            navigateToSignin();
            return;
        }
        showStudioShell();
        await bootStudio(workspace);
    }
    catch (error) {
        showStudioShell();
        studio.ready = false;
        studio.busy = false;
        studio.workflowState = "error";
        studio.statusMessage = "Studio failed to load.";
        studio.validationIssues = validationIssuesForUnknownError(error);
    }
}
async function bootStudio(workspace) {
    installEventListeners();
    studio.editorAdapter = resolveEditorAdapterFromLocation();
    studio.ready = false;
    studio.busy = true;
    studio.workspaceMode = "browse";
    studio.workflowState = "idle";
    studio.statusMessage = "Loading workspace…";
    document.title = `${workspace.profile.title} Studio`;
    try {
        const session = await loadSession();
        state.session = session;
        studio.session = session;
        const entryGate = resolvePublishingStudioEntryGate(workspace, session);
        if (!entryGate.allowed) {
            if (entryGate.redirectToSignin) {
                pendingAuthError = entryGate.message ?? "";
                navigateToSignin(entryGate.reason);
                return;
            }
            presentBlockedStudioEntry(workspace, session, entryGate.message);
            return;
        }
        await refreshIndex();
        const target = resolvePublishingStudioPathTarget(new URL(window.location.href), state.entries);
        try {
            await applyPathTarget(target, { persistFallbackLocation: true });
        }
        catch (error) {
            if (!isRecoverableBootTargetError(error)) {
                throw error;
            }
            await loadDashboardFallback(undefined, {
                persistLocation: true,
            });
        }
        studio.ready = true;
        studio.dispatchEvent(new CustomEvent("publishing-ready", {
            bubbles: true,
            composed: true,
            detail: { route: state.selectedRoute },
        }));
    }
    finally {
        studio.busy = false;
    }
}
function installEventListeners() {
    window.addEventListener("popstate", () => {
        void syncStudioLocationFromWindow();
    });
    studio.addEventListener("publishing-sign-out", () => {
        clearSessionHint();
        navigateToSignin();
    });
    studio.addEventListener("publishing-select-route", async (event) => {
        const detail = event.detail;
        await loadRoute(detail.route);
    });
    studio.addEventListener("publishing-select-browse-surface", async (event) => {
        const detail = event.detail;
        await handleBrowseSurfaceSelection(detail);
    });
    studio.addEventListener("publishing-open-site", (event) => {
        const detail = event
            .detail;
        handleOpenSiteRequest(detail);
    });
    studio.addEventListener("publishing-create-draft", (event) => {
        const detail = event.detail;
        loadNewDraft(detail.kind);
    });
    studio.addEventListener("publishing-save-tag", async (event) => {
        const detail = event.detail;
        studio.busy = true;
        studio.statusMessage = `Saving ${detail.document.label}…`;
        try {
            const draftId = tagDraftIdForDocument(detail.document, "save");
            await postApi("/api/drafts/save", {
                draftId,
                operation: "upsert",
                sourcePath: detail.sourcePath,
                document: detail.document,
            });
            await postApi("/api/publish/apply", {
                draftId,
            });
            await refreshIndex();
            const savedTag = state.tags.find((tag) => tag.slug === detail.document.slug) ??
                detail.document;
            studio.dispatchEvent(new CustomEvent("publishing-tag-saved", {
                bubbles: true,
                composed: true,
                detail: {
                    tag: savedTag,
                },
            }));
        }
        catch (error) {
            handlePublishingError(error, "Saving tag failed.");
        }
        finally {
            studio.busy = false;
        }
    });
    studio.addEventListener("publishing-delete-tag", async (event) => {
        const detail = event.detail;
        studio.busy = true;
        studio.statusMessage = `Removing ${detail.document.label}…`;
        try {
            const draftId = tagDraftIdForDocument(detail.document, "delete");
            await postApi("/api/drafts/save", {
                draftId,
                operation: "delete",
                sourcePath: detail.sourcePath,
                document: detail.document,
            });
            await postApi("/api/publish/apply", {
                draftId,
            });
            await refreshIndex();
            studio.dispatchEvent(new CustomEvent("publishing-tag-deleted", {
                bubbles: true,
                composed: true,
                detail: {
                    slug: detail.document.slug,
                    label: detail.document.label,
                    visibility: detail.document.visibility ?? "public",
                },
            }));
        }
        catch (error) {
            handlePublishingError(error, "Removing tag failed.");
        }
        finally {
            studio.busy = false;
        }
    });
    studio.addEventListener("publishing-draft-change", (event) => {
        const detail = event.detail;
        state.editorValue = detail.value;
        state.reviewDiffs = [];
        studio.reviewDiffs = [];
        studio.validationIssues = [];
        studio.workspaceMode = "write";
        studio.workflowState = "dirty";
        studio.statusMessage = "Draft updated. Preview or review the publish diff.";
    });
    studio.addEventListener("publishing-metadata-change", (event) => {
        const detail = event.detail;
        state.metadata = {
            ...state.metadata,
            [detail.field]: detail.value,
        };
        state.reviewDiffs = [];
        studio.reviewDiffs = [];
        studio.validationIssues = [];
        studio.workspaceMode = "write";
        studio.workflowState = "dirty";
        studio.statusMessage =
            "Metadata updated. Review the publish diff before writing files.";
    });
    studio.addEventListener("publishing-request-preview", async () => {
        studio.busy = true;
        try {
            await performPreviewRequest(state.selectedRoute, "Rendering preview from the current draft…");
        }
        catch (error) {
            handlePublishingError(error, "Preview failed.");
        }
        finally {
            studio.busy = false;
        }
    });
    studio.addEventListener("publishing-browse-row-preview", async (event) => {
        const detail = event.detail;
        studio.busy = true;
        try {
            await loadRoute(detail.route, {
                statusMessage: "Loading selected route for preview…",
            });
            await performPreviewRequest(detail.route, "Rendering preview from the selected route…");
        }
        catch (error) {
            handlePublishingError(error, "Preview failed.");
        }
        finally {
            studio.busy = false;
        }
    });
    studio.addEventListener("publishing-duplicate-row", async (event) => {
        const detail = event.detail;
        studio.busy = true;
        studio.statusMessage = "Creating duplicate draft…";
        try {
            const document = await fetchDocumentForRoute(detail.route);
            if (!isDuplicateRouteDocument(document)) {
                throw new Error("Only posts and docs pages can be duplicated.");
            }
            const duplicateDocument = createDuplicateDocument(document);
            const draftId = routeToDraftId(routeForDocument(duplicateDocument));
            await postApi("/api/drafts/create", {
                draftId,
                document: duplicateDocument,
            });
            applyRouteDocument(duplicateDocument, {
                route: routeForDocument(duplicateDocument),
                statusMessage: "Duplicate draft ready. Preview or review the diff before publish.",
                persistLocation: false,
            });
        }
        catch (error) {
            handlePublishingError(error, "Duplicate failed.");
        }
        finally {
            studio.busy = false;
        }
    });
    studio.addEventListener("publishing-request-validate", async () => {
        studio.busy = true;
        studio.workflowState = "validating";
        studio.statusMessage = "Validating draft and canonical routing…";
        try {
            const draftId = await saveDraft();
            const diffs = await postApi("/api/publish/validate", {
                draftId,
            });
            state.reviewDiffs = diffs;
            studio.reviewDiffs = diffs;
            studio.validationIssues = [];
            studio.workspaceMode = diffs.length > 0 ? "review" : "write";
            studio.workflowState = "dirty";
            studio.statusMessage =
                diffs.length > 0
                    ? "Validation passed. Review the publish diff."
                    : "Validation passed. No canonical file changes detected.";
        }
        catch (error) {
            handlePublishingError(error, "Validation failed.");
        }
        finally {
            studio.busy = false;
        }
    });
    studio.addEventListener("publishing-request-review-publish", async () => {
        studio.busy = true;
        studio.workflowState = "validating";
        studio.statusMessage = "Preparing the canonical diff for review…";
        try {
            const draftId = await saveDraft();
            const diffs = await postApi("/api/publish/diff", {
                draftId,
            });
            state.reviewDiffs = diffs;
            studio.reviewDiffs = diffs;
            studio.validationIssues = [];
            studio.workspaceMode = "review";
            studio.workflowState = "publish-confirmation";
            studio.statusMessage =
                diffs.length > 0
                    ? "Review the diff, then confirm publish."
                    : "No file changes detected. Confirm publish only if this is intentional.";
        }
        catch (error) {
            handlePublishingError(error, "Publish review failed.");
        }
        finally {
            studio.busy = false;
        }
    });
    studio.addEventListener("publishing-request-confirm-publish", async () => {
        studio.busy = true;
        studio.statusMessage = "Applying canonical file changes…";
        try {
            const draftId = await saveDraft();
            const diffs = await postApi("/api/publish/apply", {
                draftId,
            });
            state.reviewDiffs = diffs;
            studio.reviewDiffs = diffs;
            await refreshIndex();
            await loadRoute(state.selectedRoute);
            studio.reviewDiffs = diffs;
            studio.workspaceMode = "publish";
            studio.workflowState = "publish-succeeded";
            studio.statusMessage = `Published ${diffs.length} canonical file change${diffs.length === 1 ? "" : "s"}.`;
            studio.showTransientFeedback({
                type: "success",
                message: "Published successfully.",
            });
        }
        catch (error) {
            handlePublishingError(error, "Publish failed.");
        }
        finally {
            studio.busy = false;
        }
    });
}
function resolveEditorAdapterFromLocation() {
    return createMarkdownEditorAdapter();
}
async function refreshIndex() {
    const [entries, media, docSections, tags, siteSettings, navigation] = await Promise.all([
        getApi("/api/content/index"),
        getApi("/api/content/media"),
        getApi("/api/content/docs/sections"),
        getApi("/api/content/tags"),
        getApi("/api/content/site/site_settings"),
        getApi("/api/content/site/navigation"),
    ]);
    state.entries = createStudioBrowseEntries(entries, siteSettings, navigation);
    state.media = media;
    state.docSections = docSections;
    state.tags = tags;
    studio.entries = state.entries;
    studio.media = media;
    studio.docSections = docSections;
    studio.tags = tags;
}
async function loadRoute(route, options) {
    state.routeLoadRevision += 1;
    const revision = state.routeLoadRevision;
    const document = await fetchDocumentForRoute(route);
    if (revision !== state.routeLoadRevision) {
        return;
    }
    applyRouteDocument(document, {
        route,
        statusMessage: options?.statusMessage ??
            "Draft loaded. Preview or review the diff before publish.",
        preserveBrowseState: options?.preserveBrowseState,
        persistLocation: options?.persistLocation,
    });
}
function loadNewDraft(kind) {
    const document = createDraftDocument(kind);
    applyRouteDocument(document, {
        route: routeForDocument(document),
        statusMessage: kind === "post"
            ? "New post draft ready. Preview or review the diff before publish."
            : "New page draft ready. Preview or review the diff before publish.",
        persistLocation: false,
    });
}
function createDuplicateDocument(document) {
    const source = document;
    const title = `${source.title} (Copy)`;
    const slug = createUniqueDraftSlug(title, source.kind);
    if (source.kind === "post") {
        const postDocument = document;
        return {
            ...postDocument,
            title,
            slug,
            status: "draft",
            publishedAt: undefined,
        };
    }
    const docPageDocument = document;
    return {
        ...docPageDocument,
        title,
        slug,
        status: "draft",
        publishedAt: undefined,
        order: getNextDocPageOrder(docPageDocument.sectionId),
    };
}
function isDuplicateRouteDocument(document) {
    return document.kind === "post" || document.kind === "doc_page";
}
function applyRouteDocument(document, options) {
    const preserveBrowseState = options.preserveBrowseState === true && studio.workspaceMode === "browse";
    state.selectedRoute = options.route;
    state.document = document;
    state.editorValue = editorValueForDocument(document);
    state.metadata = metadataForDocument(document);
    state.reviewDiffs = [];
    applyMetadataToStudio(state.metadata);
    studio.selectedRoute = options.route;
    studio.contentValue = state.editorValue;
    studio.previewHtml = "";
    studio.previewExcerpt = "";
    studio.reviewDiffs = [];
    studio.validationIssues = [];
    studio.workspaceMode = preserveBrowseState ? "browse" : "write";
    studio.workflowState = preserveBrowseState ? studio.workflowState : "draft";
    studio.statusMessage = options.statusMessage;
    studio.browsePanelOpen = preserveBrowseState ? studio.browsePanelOpen : false;
    studio.metadataPanelOpen = false;
    if (options.persistLocation !== false) {
        window.history.replaceState({}, "", publishingStudioPathForEditorRoute(options.route));
    }
}
function createDraftDocument(kind) {
    const author = state.session?.principal.displayName.trim().length
        ? { name: state.session.principal.displayName.trim() }
        : undefined;
    if (kind === "post") {
        return {
            kind: "post",
            title: "",
            slug: createUniqueDraftSlug("new-post", "post"),
            excerpt: "",
            body: "",
            status: "draft",
            tags: [],
            author,
        };
    }
    const section = getDefaultDocSection();
    const sectionId = section?.id === "__unsectioned__" ? undefined : section?.id;
    return {
        kind: "doc_page",
        title: "",
        slug: createUniqueDraftSlug("new-page", "doc_page"),
        summary: "",
        body: "",
        status: "draft",
        tags: [],
        author,
        sectionId,
        order: getNextDocPageOrder(sectionId),
        version: section?.pages[0]?.version,
    };
}
function getDefaultDocSection() {
    return (state.docSections.find((section) => section.id !== "__unsectioned__") ??
        state.docSections[0]);
}
function getNextDocPageOrder(sectionId) {
    const pages = state.docSections.flatMap((section) => section.pages);
    const relevantPages = pages.filter((page) => sectionId ? page.sectionId === sectionId : !page.sectionId);
    return (relevantPages.reduce((highest, page) => Math.max(highest, page.order), -1) +
        1);
}
function createUniqueDraftSlug(baseLabel, kind) {
    const baseSlug = slugifyPublishingValue(baseLabel) ||
        (kind === "post" ? "new-post" : "new-page");
    let slug = baseSlug;
    let suffix = 2;
    while (state.entries.some((entry) => entry.route === routeForDraft(kind, slug))) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
    return slug;
}
function routeForDraft(kind, slug) {
    return kind === "post" ? `/blog/${slug}` : `/docs/${slug}`;
}
async function fetchDocumentForRoute(route) {
    if (route === STUDIO_ROUTE_HOMEPAGE) {
        return getApi("/api/content/site/homepage");
    }
    if (route === STUDIO_ROUTE_SITE_SETTINGS) {
        return getApi("/api/content/site/site_settings");
    }
    if (route === STUDIO_ROUTE_NAVIGATION) {
        return getApi("/api/content/site/navigation");
    }
    if (route.startsWith("/blog/")) {
        const posts = await getApi("/api/content/posts");
        return (posts.find((post) => routeForDocument(post) === route) ??
            raiseNotFound(route));
    }
    if (route.startsWith("/docs/")) {
        const pages = await getApi("/api/content/docs/pages");
        return (pages.find((page) => routeForDocument(page) === route) ??
            raiseNotFound(route));
    }
    throw {
        tag: "unsupported",
        reason: `Unsupported studio route '${route}'.`,
        path: route,
    };
}
async function saveDraft() {
    const document = getCurrentDocumentFromEditor();
    const draftId = routeToDraftId(state.selectedRoute);
    const sourcePath = state.document
        ? sourcePathForDocument(state.document)
        : undefined;
    const requiredCapability = document.kind === "homepage" ||
        document.kind === "navigation" ||
        document.kind === "site_settings"
        ? "content:config:write"
        : "content:draft:write";
    if (!state.session ||
        !hasPublicationCapability(state.session, requiredCapability)) {
        throw createUnauthorizedCapabilityError(requiredCapability, state.session);
    }
    await postApi("/api/drafts/save", {
        draftId,
        document,
        sourcePath,
    });
    return draftId;
}
function getCurrentDocumentFromEditor() {
    if (!state.document) {
        throw new Error("No active publishing document is loaded.");
    }
    return documentFromEditorValue(documentWithMetadata(state.document, state.metadata), state.editorValue);
}
async function performPreviewRequest(expectedRoute, validatingMessage) {
    studio.workflowState = "validating";
    studio.statusMessage = validatingMessage;
    const document = getCurrentDocumentFromEditor();
    const preview = await postApi("/api/preview/render", { document });
    if (state.selectedRoute !== expectedRoute) {
        return;
    }
    studio.previewHtml = preview.html;
    studio.previewExcerpt = preview.excerpt;
    studio.validationIssues = [];
    studio.workspaceMode = "preview";
    studio.workflowState = "preview-ready";
    studio.statusMessage = "Preview is ready. Review the diff before publish.";
    studio.showTransientFeedback({
        type: "info",
        message: "Preview ready.",
    });
}
function handleOpenSiteRequest(detail) {
    if (!state.workspace) {
        return;
    }
    const destination = resolvePublishingStudioSiteDestination(state.workspace, new URL(window.location.href));
    if (destination.kind === "available") {
        const opened = typeof window.open === "function"
            ? window.open(destination.href, "_blank", "noopener,noreferrer")
            : null;
        if (opened === null) {
            studio.showTransientFeedback({
                type: "error",
                message: "The browser blocked opening the configured site.",
            });
        }
        return;
    }
    studio.presentSiteFallback({
        source: detail.source,
        message: destination.message,
    });
}
async function loadWorkspace() {
    const globalWorkspace = window.__PUBLISHING_WORKSPACE__;
    if (globalWorkspace) {
        return globalWorkspace;
    }
    return getApi("/api/workspace");
}
async function loadSession() {
    const globalSession = window.__PUBLISHING_SESSION__;
    if (globalSession) {
        return globalSession;
    }
    return getApi("/api/session");
}
function applyMetadataToStudio(metadata) {
    studio.documentTitle = metadata.title;
    studio.documentSlug = metadata.slug;
    studio.documentSummary = metadata.summary;
    studio.documentFeatureImage = metadata.featureImage;
    studio.documentStatus = metadata.status;
    studio.documentPublishedAt = metadata.publishedAt;
    studio.documentTags = metadata.tags;
    studio.documentAuthorName = metadata.authorName;
    studio.documentAuthorRole = metadata.authorRole;
    studio.documentSeoTitle = metadata.seoTitle;
    studio.documentSeoDescription = metadata.seoDescription;
    studio.documentSectionId = metadata.sectionId;
}
function handlePublishingError(error, fallbackMessage) {
    const issues = validationIssuesForUnknownError(error);
    const validationError = isPublishingValidationError(error);
    studio.validationIssues = issues;
    studio.workspaceMode = validationError ? "review" : "write";
    studio.workflowState = validationError ? "publish-blocked" : "error";
    studio.statusMessage = issues[0]?.message ?? fallbackMessage;
    if (!validationError) {
        studio.showTransientFeedback({
            type: "error",
            message: issues[0]?.message ?? fallbackMessage,
        });
    }
}
async function getApi(path) {
    const response = await fetch(path, {
        headers: buildSessionHeaders({ accept: "application/json" }),
    });
    const payload = (await response.json());
    return unwrapApiResult(payload);
}
async function postApi(path, body) {
    const response = await fetch(path, {
        method: "POST",
        headers: buildSessionHeaders({
            accept: "application/json",
            "content-type": "application/json",
        }),
        body: JSON.stringify(body),
    });
    const payload = (await response.json());
    return unwrapApiResult(payload);
}
function unwrapApiResult(payload) {
    if (payload.success) {
        return payload.data;
    }
    throw payload.error;
}
function validationIssuesForUnknownError(error) {
    if (isPublishingError(error)) {
        return validationIssuesForError(error);
    }
    return [
        {
            path: "publishing",
            message: String(error),
        },
    ];
}
function isPublishingError(value) {
    return (typeof value === "object" &&
        value !== null &&
        "tag" in value &&
        "reason" in value);
}
function isPublishingValidationError(error) {
    return (isPublishingError(error) &&
        (error.tag === "validation-failed" || error.tag === "duplicate-route"));
}
function isRecoverableBootTargetError(error) {
    return (isPublishingError(error) &&
        (error.tag === "not-found" ||
            error.tag === "unauthorized" ||
            error.tag === "unsupported"));
}
async function applyPathTarget(target, options) {
    switch (target.kind) {
        case "editor":
            await loadRoute(target.route, {
                persistLocation: false,
            });
            studio.workspaceMode = "write";
            studio.browsePanelOpen = false;
            return;
        case "browse":
            await loadRoute(target.anchorRoute, {
                persistLocation: false,
                preserveBrowseState: true,
            });
            openBrowseSurface(target.surface, {
                persistLocation: false,
                postsBucket: target.postsBucket,
                statusMessage: statusMessageForBrowseSurface(target.surface),
            });
            replaceBrowseLocationIfNeeded(target);
            return;
        case "dashboard-fallback":
            await loadDashboardFallback(target.anchorRoute, {
                persistLocation: options.persistFallbackLocation,
            });
            return;
    }
}
function openBrowseSurface(surface, options) {
    studio.workspaceMode = "browse";
    studio.browsePanelOpen = true;
    studio.browseSurface = surface;
    studio.postsFilter =
        surface === "posts"
            ? postsBucketForBrowseSelection(options.postsBucket)
            : "all";
    studio.statusMessage = options.statusMessage;
    if (options.persistLocation) {
        replaceStudioLocationIfNeeded(publishingStudioPathForBrowseSurface(surface, {
            postsBucket: options.postsBucket,
        }));
    }
}
async function loadDashboardFallback(anchorRoute, options = { persistLocation: true }) {
    const fallbackRoute = anchorRoute ??
        state.entries.find((entry) => entry.kind === "homepage")?.route ??
        state.entries[0]?.route ??
        "/";
    await loadRoute(fallbackRoute, {
        persistLocation: false,
        preserveBrowseState: true,
    });
    openBrowseSurface("dashboard", {
        persistLocation: options.persistLocation,
        statusMessage: "Ghost-style dashboard ready.",
    });
}
function statusMessageForBrowseSurface(surface) {
    switch (surface) {
        case "dashboard":
            return "Ghost-style dashboard ready.";
        case "posts":
            return "Ghost-style posts collection ready.";
        case "pages":
            return "Ghost-style pages collection ready.";
        case "tags":
            return "Ghost-style tags collection ready.";
        case "settings":
            return "Ghost-style settings hub ready.";
    }
}
function tagDraftIdForDocument(document, operation) {
    const slug = slugifyPublishingValue(document.slug) || "tag";
    return `${operation}-tag-${slug}`;
}
function presentBlockedStudioEntry(workspace, _session, message = "The selected account is not entitled to this workspace.") {
    state.entries = [];
    state.media = [];
    state.docSections = [];
    state.tags = [];
    state.document = null;
    state.editorValue = "";
    state.reviewDiffs = [];
    state.selectedRoute = "/";
    studio.entries = [];
    studio.media = [];
    studio.docSections = [];
    studio.tags = [];
    studio.selectedRoute = "/";
    studio.contentValue = "";
    studio.reviewDiffs = [];
    studio.previewHtml = "";
    studio.previewExcerpt = "";
    studio.placeholderTitle = "Access blocked";
    studio.workspaceMode = "browse";
    studio.browsePanelOpen = true;
    studio.browseSurface = "placeholder";
    studio.workflowState = "publish-blocked";
    studio.statusMessage = message;
    studio.validationIssues = [
        {
            path: "license",
            message,
        },
    ];
    document.title = `${workspace.profile.title} Studio`;
    studio.ready = true;
}
function resolveRouteKind() {
    const value = window.__PUBLISHING_ROUTE_KIND__;
    return value === "signin" ? "signin" : "studio";
}
function consumeLocationAuthReason() {
    const url = new URL(window.location.href);
    const reason = url.searchParams.get("reason");
    if (!reason) {
        return null;
    }
    url.searchParams.delete("reason");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    return isPublishingStudioEntryGateReason(reason)
        ? messageForPublishingStudioEntryGateReason(reason)
        : null;
}
function consumeLocationAuthRequest() {
    const url = new URL(window.location.href);
    const providerId = url.searchParams.get("provider");
    if (!providerId) {
        return null;
    }
    const hint = {
        providerId,
        walletAddress: url.searchParams.get("wallet")?.trim() || undefined,
    };
    const auto = url.searchParams.get("auto") === "1";
    url.searchParams.delete("provider");
    url.searchParams.delete("wallet");
    url.searchParams.delete("auto");
    const redirectPath = `${url.pathname}${url.search}`;
    window.history.replaceState({}, "", redirectPath);
    return { hint, auto, redirectPath };
}
function buildSessionHeaders(headers) {
    const hint = getStoredSessionHint();
    if (!hint) {
        return headers;
    }
    return {
        ...headers,
        "x-publishing-provider": hint.providerId,
        ...(hint.walletAddress
            ? { "x-publishing-wallet-address": hint.walletAddress }
            : {}),
    };
}
function getStoredSessionHint() {
    try {
        const source = window.localStorage.getItem(PUBLISHING_SESSION_HINT_STORAGE_KEY);
        if (!source) {
            return null;
        }
        const value = JSON.parse(source);
        if (typeof value.providerId !== "string" || value.providerId.length === 0) {
            return null;
        }
        return {
            providerId: value.providerId,
            walletAddress: typeof value.walletAddress === "string" &&
                value.walletAddress.trim().length > 0
                ? value.walletAddress.trim()
                : undefined,
        };
    }
    catch {
        return null;
    }
}
function saveSessionHint(hint) {
    try {
        window.localStorage.setItem(PUBLISHING_SESSION_HINT_STORAGE_KEY, JSON.stringify(hint));
        return true;
    }
    catch {
        return false;
    }
}
function clearSessionHint() {
    try {
        window.localStorage.removeItem(PUBLISHING_SESSION_HINT_STORAGE_KEY);
    }
    catch {
        // Ignore localStorage failures so sign-out still redirects.
    }
}
function navigateToStudio(surface) {
    window.location.assign(publishingStudioPathForBrowseSurface(surface));
}
function postsBucketForBrowseSelection(filter) {
    switch (filter) {
        case "draft":
            return "draft";
        case "scheduled":
            return "scheduled";
        case "published":
            return "published";
        default:
            return DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET;
    }
}
function replaceStudioLocationIfNeeded(path) {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath !== path) {
        window.history.replaceState({}, "", path);
    }
}
function replaceBrowseLocationIfNeeded(target) {
    if (target.surface !== "posts") {
        return;
    }
    replaceStudioLocationIfNeeded(publishingStudioPathForBrowseSurface(target.surface, {
        postsBucket: target.postsBucket,
    }));
}
function navigateToSignin(reason) {
    if (!reason) {
        window.location.assign(PUBLISHING_STUDIO_SIGNIN_PATH);
        return;
    }
    const url = new URL(PUBLISHING_STUDIO_SIGNIN_PATH, window.location.origin);
    url.searchParams.set("reason", reason);
    window.location.assign(`${url.pathname}${url.search}`);
}
function showStudioShell() {
    authShell.hidden = true;
    authShell.replaceChildren();
    studio.hidden = false;
}
function showSignInShell() {
    authShell.hidden = false;
    studio.hidden = true;
    studio.ready = false;
}
function renderSignIn(workspace) {
    showSignInShell();
    document.title = `Sign in — ${workspace.profile.title} Studio`;
    const providers = publishingStudioProvidersForSignIn(workspace);
    const storedHint = getStoredSessionHint();
    const hint = storedHint &&
        providers.some((provider) => provider.id === storedHint.providerId)
        ? storedHint
        : null;
    if (storedHint && !hint) {
        clearSessionHint();
        if (pendingAuthError.length === 0) {
            pendingAuthError =
                "Select one of the configured licensed identity providers to continue.";
        }
    }
    const hasWalletProvider = providers.some((provider) => provider.kind === "wallet");
    const hintIdentity = hint
        ? formatPublishingSessionHintIdentity(hint, providers)
        : "";
    const hintProviderLabel = hint
        ? (providers.find((provider) => provider.id === hint.providerId)?.label ??
            hint.providerId)
        : "";
    const providerMarkup = providers
        .map((provider) => {
        const requiresWallet = provider.kind === "wallet";
        return `
        <button
          class="publishing-auth-provider"
          data-provider-id="${provider.id}"
          type="button"
        >
          <span class="publishing-auth-provider-title">Continue with ${provider.label}</span>
          <span class="publishing-auth-provider-copy">
            ${requiresWallet
            ? "Requires a wallet address for the signed-in session."
            : "Opens a local editor session on this device."}
          </span>
        </button>
      `;
    })
        .join("");
    authShell.innerHTML = `
    <div class="publishing-auth-shell">
      <div class="publishing-auth-container">
        <header class="publishing-auth-header">
          <div class="publishing-auth-mark" aria-hidden="true"></div>
          <p class="publishing-auth-eyebrow">Publishing admin</p>
          <h1 class="publishing-auth-title">${workspace.profile.title}</h1>
        </header>

        <div class="publishing-auth-panel">
          ${hint
        ? `
                <div class="publishing-auth-resume">
                  <div class="publishing-auth-resume-avatar" aria-hidden="true">
                    ${hintIdentity.slice(0, 1).toUpperCase()}
                  </div>
                  <div class="publishing-auth-resume-copy">
                    <p class="publishing-auth-panel-eyebrow">Resume session</p>
                    <h2 class="publishing-auth-panel-title">Welcome back</h2>
                    <p class="publishing-auth-panel-copy">
                      Continue with ${hintIdentity} through ${hintProviderLabel}.
                    </p>
                    <p class="publishing-auth-note">
                      This session hint stays in this browser only until you choose a different sign-in path.
                    </p>
                  </div>
                </div>
                <p
                  class="publishing-auth-error"
                  data-publishing-auth-error
                  aria-live="polite"
                  hidden
                ></p>
                <div class="publishing-auth-actions publishing-auth-actions--stacked">
                  <button
                    class="publishing-auth-action"
                    data-variant="primary"
                    data-publishing-continue
                    type="button"
                  >
                    Continue to studio
                  </button>
                  <button
                    class="publishing-auth-action"
                    data-variant="secondary"
                    data-publishing-clear-session
                    type="button"
                  >
                    Sign in with a different session
                  </button>
                </div>
              `
        : `
                <div class="publishing-auth-panel-header">
                  <p class="publishing-auth-panel-eyebrow">Sign in</p>
                  <h2 class="publishing-auth-panel-title">Enter your publication</h2>
                  <p class="publishing-auth-panel-copy">
                    Choose how to continue into the publishing studio.
                  </p>
                </div>
                ${providers.length === 0
            ? `
                      <p class="publishing-auth-note">
                        No publication identity providers are configured for this workspace yet.
                      </p>
                    `
            : hasWalletProvider
                ? `
                          <label class="publishing-auth-field">
                            <span class="publishing-auth-field-label">Wallet address</span>
                            <input
                              class="publishing-auth-field-input"
                              data-publishing-wallet-address
                              placeholder="0xabc123..."
                              type="text"
                              value=""
                            />
                            <span class="publishing-auth-field-hint">
                              Required only when you continue with the wallet session.
                            </span>
                          </label>
                        `
                : ""}
                ${providers.length > 0
            ? `
                        <div class="publishing-auth-provider-list">
                          ${providerMarkup}
                        </div>
                      `
            : ""}
                <p
                  class="publishing-auth-error"
                  data-publishing-auth-error
                  aria-live="polite"
                  hidden
                ></p>
                <p class="publishing-auth-note">
                  ${providers.length === 0
            ? "Add a local or wallet-backed provider to the publication policy, then reload this page."
            : hasWalletProvider
                ? "Local sessions stay device-only. Wallet sessions require a valid address."
                : "A session hint is stored locally in this browser only."}
                </p>
              `}
        </div>
      </div>
    </div>
  `;
    const walletField = authShell.querySelector("[data-publishing-wallet-address]");
    const errorField = authShell.querySelector("[data-publishing-auth-error]");
    const setError = (message, options = {}) => {
        if (errorField) {
            errorField.textContent = message;
            errorField.hidden = message.length === 0;
        }
        if (walletField) {
            if (options.invalidWallet) {
                walletField.setAttribute("aria-invalid", "true");
            }
            else {
                walletField.removeAttribute("aria-invalid");
            }
        }
    };
    setError(pendingAuthError);
    pendingAuthError = "";
    walletField?.addEventListener("input", () => {
        setError("");
    });
    for (const button of authShell.querySelectorAll("[data-provider-id]")) {
        button.addEventListener("click", () => {
            const providerId = button.dataset.providerId;
            const provider = providers.find((candidate) => candidate.id === providerId);
            if (!providerId || !provider) {
                setError("Unknown publication provider.");
                return;
            }
            const walletAddress = walletField?.value.trim() ?? "";
            if (provider.kind === "wallet" && walletAddress.length === 0) {
                setError("Enter a wallet address before continuing with the wallet session.", {
                    invalidWallet: true,
                });
                walletField?.focus();
                return;
            }
            if (!saveSessionHint({
                providerId,
                walletAddress: walletAddress || undefined,
            })) {
                setError("This browser blocked local session storage. Sign-in cannot continue until local storage is available.");
                return;
            }
            setError("");
            navigateToStudio(DEFAULT_STUDIO_SURFACE);
        });
    }
    authShell
        .querySelector("[data-publishing-continue]")
        ?.addEventListener("click", () => {
        navigateToStudio(DEFAULT_STUDIO_SURFACE);
    });
    authShell
        .querySelector("[data-publishing-clear-session]")
        ?.addEventListener("click", () => {
        clearSessionHint();
        renderSignIn(workspace);
    });
}
function formatPublishingSessionHintIdentity(hint, providers) {
    const walletAddress = hint.walletAddress?.trim() ?? "";
    if (walletAddress.length > 0) {
        return walletAddress.length > 14
            ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
            : walletAddress;
    }
    return (providers.find((provider) => provider.id === hint.providerId)?.label ??
        hint.providerId);
}
function createUnauthorizedCapabilityError(capability, session) {
    const blockedByLicense = session?.license.evaluation === "blocked" &&
        typeof session.license.reason === "string" &&
        session.license.reason.length > 0;
    const reason = blockedByLicense
        ? session.license.reason
        : `The active publication session cannot perform '${capability}'.`;
    return {
        tag: "unauthorized",
        reason,
        path: capability,
        issues: [
            {
                path: blockedByLicense ? "license" : "session",
                message: blockedByLicense
                    ? reason
                    : `Missing capability '${capability}' for ${session?.principal.displayName ?? "the active session"}.`,
            },
        ],
    };
}
function isPublishingStudioEntryGateReason(value) {
    return (value === "license-required" ||
        value === "license-invalid" ||
        value === "license-unavailable" ||
        value === "license-provider" ||
        value === "access-denied");
}
function getAuthShellElement() {
    const existing = document.querySelector("#publishing-auth-shell");
    if (existing) {
        return existing;
    }
    const created = document.createElement("div");
    created.id = "publishing-auth-shell";
    const studioElement = document.querySelector("kit-publishing-studio");
    if (studioElement?.parentNode) {
        studioElement.parentNode.insertBefore(created, studioElement);
    }
    else {
        document.body.prepend(created);
    }
    return created;
}
function getStudioElement() {
    const value = document.querySelector("kit-publishing-studio");
    if (!value) {
        throw new Error("Missing <kit-publishing-studio> host element.");
    }
    return value;
}
function emptyMetadata() {
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
async function handleBrowseSurfaceSelection(detail) {
    const postsBucket = detail.surface === "posts"
        ? postsBucketForBrowseSelection(detail.postsFilter ?? studio.postsFilter)
        : undefined;
    const target = resolvePublishingStudioPathTarget(new URL(publishingStudioPathForBrowseSurface(detail.surface, { postsBucket }), window.location.origin), state.entries);
    if (target.kind === "dashboard-fallback") {
        await loadDashboardFallback(target.anchorRoute, {
            persistLocation: true,
        });
        return;
    }
    if (target.kind !== "browse") {
        await loadDashboardFallback(undefined, {
            persistLocation: true,
        });
        return;
    }
    const anchorRoute = target.surface === "tags" && state.document
        ? state.selectedRoute
        : target.anchorRoute;
    await loadRoute(anchorRoute, {
        persistLocation: false,
        preserveBrowseState: true,
    });
    openBrowseSurface(target.surface, {
        persistLocation: true,
        postsBucket: target.postsBucket,
        statusMessage: statusMessageForBrowseSurface(target.surface),
    });
}
async function syncStudioLocationFromWindow() {
    const target = resolvePublishingStudioPathTarget(new URL(window.location.href), state.entries);
    switch (target.kind) {
        case "editor":
            if (!state.document || state.selectedRoute !== target.route) {
                await loadRoute(target.route, {
                    persistLocation: false,
                });
            }
            studio.workspaceMode = "write";
            studio.browsePanelOpen = false;
            return;
        case "browse":
            const anchorRoute = target.surface === "tags" && state.document
                ? state.selectedRoute
                : target.anchorRoute;
            if (!state.document || state.selectedRoute !== anchorRoute) {
                await loadRoute(anchorRoute, {
                    persistLocation: false,
                    preserveBrowseState: true,
                });
            }
            openBrowseSurface(target.surface, {
                persistLocation: false,
                postsBucket: target.postsBucket,
                statusMessage: statusMessageForBrowseSurface(target.surface),
            });
            replaceBrowseLocationIfNeeded(target);
            return;
        case "dashboard-fallback":
            await loadDashboardFallback(target.anchorRoute, {
                persistLocation: true,
            });
            return;
    }
}
function createStudioBrowseEntries(entries, siteSettings, navigation) {
    const siteEntries = [
        {
            kind: "homepage",
            title: siteSettings.title,
            slug: "",
            route: STUDIO_ROUTE_HOMEPAGE,
            description: "Primary landing page and homepage hero content.",
            access: "public",
            status: "published",
        },
        {
            kind: "site_settings",
            title: "Site settings",
            slug: "site-settings",
            route: STUDIO_ROUTE_SITE_SETTINGS,
            description: `${siteSettings.language.toUpperCase()} publication profile, footer, contact, and SEO defaults.`,
            access: "public",
            status: "published",
        },
        {
            kind: "navigation",
            title: "Navigation",
            slug: "navigation",
            route: STUDIO_ROUTE_NAVIGATION,
            description: `${navigation.mainLinks.length} primary link${navigation.mainLinks.length === 1 ? "" : "s"} and ${navigation.footerLinks.length} footer link${navigation.footerLinks.length === 1 ? "" : "s"}.`,
            access: "public",
            status: "published",
        },
    ];
    const routedEntries = entries.map((entry) => entry.kind === "homepage"
        ? {
            ...entry,
            route: STUDIO_ROUTE_HOMEPAGE,
            title: siteSettings.title,
        }
        : entry);
    return [
        ...siteEntries,
        ...routedEntries.filter((entry) => entry.kind !== "homepage" &&
            entry.route !== STUDIO_ROUTE_SITE_SETTINGS &&
            entry.route !== STUDIO_ROUTE_NAVIGATION),
    ];
}
function raiseNotFound(route) {
    throw {
        tag: "not-found",
        reason: `No publishing document found for route '${route}'.`,
        path: route,
    };
}
void boot();
