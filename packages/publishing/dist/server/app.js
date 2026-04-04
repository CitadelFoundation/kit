/**
 * Local-only Elysia app factory for the publishing workflow.
 *
 * @module @citadelfoundation/kit-publishing/server/app
 */
import { Elysia } from "elysia";
import { z } from "zod";
import { validatePublishingDocument } from "../content/schema.js";
import { createPublishingRuntime, } from "./runtime.js";
import { createPublicationWorkspace, hasPublicationCapability, resolvePublicationSession, } from "../workspace.js";
const draftSaveSchema = z.object({
    draftId: z.string().min(1),
    operation: z.enum(["upsert", "delete"]).optional(),
    sourcePath: z.string().optional(),
    document: z.record(z.string(), z.unknown()),
});
const previewSchema = z.object({
    document: z.record(z.string(), z.unknown()),
});
const draftReferenceSchema = z.object({
    draftId: z.string().min(1),
});
const aiRequestSchema = z.object({
    action: z.enum(["suggest_excerpt", "suggest_slug", "suggest_links"]),
    title: z.string().optional(),
    text: z.string().optional(),
    currentRoute: z.string().optional(),
    limit: z.number().int().positive().optional(),
});
/**
 * Create the local publishing server for a workspace root.
 */
export async function createPublishingServer(options) {
    const runtime = await createPublishingRuntime({
        root: options.root,
        paths: options.paths,
    });
    if (!runtime.success) {
        return { success: false, error: runtime.error };
    }
    const prefix = options.prefix ?? "/api";
    const workspace = createPublicationWorkspace({
        root: options.root,
        ...options.workspace,
    });
    const resolveSession = async (request) => {
        if (options.sessionResolver) {
            return options.sessionResolver({ request, workspace, policy: workspace.policy });
        }
        const providerId = request.headers.get("x-publishing-provider") ?? undefined;
        const walletAddress = request.headers.get("x-publishing-wallet-address") ?? undefined;
        return resolvePublicationSession(workspace, {
            providerId,
            walletAddress,
            license: options.license
                ? {
                    resolver: options.license.resolver,
                    evidence: await resolveLicenseEvidence(request, options.license.evidenceResolver),
                }
                : undefined,
        });
    };
    const app = new Elysia({ prefix })
        .get("/session", async ({ request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession);
        if ("success" in session && session.success === false) {
            return session;
        }
        return {
            success: true,
            data: session.data,
        };
    })
        .get("/workspace", async ({ request, set }) => {
        return {
            success: true,
            data: workspace,
        };
    })
        .get("/content/index", async ({ request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        return respond(set, await runtime.value.refreshIndex());
    })
        .get("/content/site/:document", async ({ params, request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const snapshot = await runtime.value.content().getSnapshot();
        if (!snapshot.success) {
            return respond(set, snapshot);
        }
        switch (params.document) {
            case "site_settings":
                return { success: true, data: snapshot.value.siteSettings };
            case "navigation":
                return { success: true, data: snapshot.value.navigation };
            case "homepage":
                return { success: true, data: snapshot.value.homepage };
            default:
                set.status = 404;
                return {
                    success: false,
                    error: {
                        tag: "not-found",
                        reason: `Unknown site document '${params.document}'.`,
                    },
                };
        }
    })
        .get("/content/posts", async ({ request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const snapshot = await runtime.value.content().getSnapshot();
        return respond(set, snapshot.success
            ? { success: true, value: snapshot.value.posts }
            : snapshot);
    })
        .get("/content/tags", async ({ request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const snapshot = await runtime.value.content().getSnapshot();
        return respond(set, snapshot.success
            ? { success: true, value: snapshot.value.tags }
            : snapshot);
    })
        .get("/content/docs/pages", async ({ request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const snapshot = await runtime.value.content().getSnapshot();
        return respond(set, snapshot.success
            ? { success: true, value: snapshot.value.docPages }
            : snapshot);
    })
        .get("/content/docs/sections", async ({ request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const snapshot = await runtime.value.content().getSnapshot();
        return respond(set, snapshot.success
            ? { success: true, value: snapshot.value.routes.docsTree }
            : snapshot);
    })
        .get("/content/media", async ({ request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const snapshot = await runtime.value.content().getSnapshot();
        return respond(set, snapshot.success
            ? { success: true, value: snapshot.value.assets }
            : snapshot);
    })
        .get("/drafts/:draftId", async ({ params, request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        return respond(set, await runtime.value.content().getDraft(params.draftId));
    })
        .post("/drafts/save", async ({ body, request, set }) => {
        const parsed = draftSaveSchema.safeParse(body);
        if (!parsed.success) {
            return respondValidationError(set, parsed.error.issues);
        }
        const document = validateBodyDocument(parsed.data.document);
        if (!document.success) {
            return respond(set, document);
        }
        const requiredCapability = document.value.kind === "homepage" ||
            document.value.kind === "navigation" ||
            document.value.kind === "site_settings"
            ? "content:config:write"
            : "content:draft:write";
        const session = await resolveAuthorizedSession(set, request, resolveSession, requiredCapability);
        if ("success" in session && session.success === false) {
            return session;
        }
        return respond(set, await runtime.value.content().saveDraft(parsed.data.draftId, document.value, parsed.data.sourcePath, parsed.data.operation));
    })
        .post("/preview/render", async ({ body, request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:preview:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const parsed = previewSchema.safeParse(body);
        if (!parsed.success) {
            return respondValidationError(set, parsed.error.issues);
        }
        const document = validateBodyDocument(parsed.data.document);
        if (!document.success) {
            return respond(set, document);
        }
        return {
            success: true,
            data: runtime.value.preview().render(document.value),
        };
    })
        .post("/publish/validate", async ({ body, request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:review:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const parsed = draftReferenceSchema.safeParse(body);
        if (!parsed.success) {
            return respondValidationError(set, parsed.error.issues);
        }
        return respond(set, await runtime.value.publish().validateDraft(parsed.data.draftId));
    })
        .post("/publish/diff", async ({ body, request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:review:read");
        if ("success" in session && session.success === false) {
            return session;
        }
        const parsed = draftReferenceSchema.safeParse(body);
        if (!parsed.success) {
            return respondValidationError(set, parsed.error.issues);
        }
        return respond(set, await runtime.value.publish().validateDraft(parsed.data.draftId));
    })
        .post("/publish/apply", async ({ body, request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:publish:write");
        if ("success" in session && session.success === false) {
            return session;
        }
        const parsed = draftReferenceSchema.safeParse(body);
        if (!parsed.success) {
            return respondValidationError(set, parsed.error.issues);
        }
        return respond(set, await runtime.value.publish().applyDraft(parsed.data.draftId));
    })
        .post("/ai/suggest", async ({ body, request, set }) => {
        const session = await resolveAuthorizedSession(set, request, resolveSession, "content:draft:write");
        if ("success" in session && session.success === false) {
            return session;
        }
        const parsed = aiRequestSchema.safeParse(body);
        if (!parsed.success) {
            return respondValidationError(set, parsed.error.issues);
        }
        return {
            success: true,
            data: runtime.value.ai().suggest(parsed.data),
        };
    });
    return {
        success: true,
        value: {
            app,
            runtime: runtime.value,
            paths: runtime.value.paths,
            workspace,
            async dispose() {
                await runtime.value.dispose();
            },
        },
    };
}
function respond(set, result) {
    if (result.success) {
        return { success: true, data: result.value };
    }
    set.status = result.error.tag === "not-found" ? 404 : 400;
    return { success: false, error: result.error };
}
function respondValidationError(set, issues) {
    set.status = 400;
    return {
        success: false,
        error: {
            tag: "validation-failed",
            reason: "Request payload validation failed.",
            issues: issues.map((issue) => ({
                path: issue.path.map((segment) => String(segment)).join("."),
                message: issue.message,
            })),
        },
    };
}
async function resolveAuthorizedSession(set, request, resolveSession, capability) {
    const session = await resolveSession(request);
    if (!capability || hasPublicationCapability(session, capability)) {
        return { success: true, data: session };
    }
    set.status = 403;
    const blockedByLicense = session.license.evaluation === "blocked" &&
        typeof session.license.reason === "string" &&
        session.license.reason.length > 0;
    const reason = blockedByLicense
        ? session.license.reason
        : `The active publication session cannot perform '${capability}'.`;
    return {
        success: false,
        error: {
            tag: "unauthorized",
            reason,
            path: capability,
            issues: [
                {
                    path: blockedByLicense ? "license" : "session",
                    message: blockedByLicense
                        ? reason
                        : `Missing capability '${capability}' for ${session.principal.displayName}.`,
                },
            ],
        },
    };
}
async function resolveLicenseEvidence(request, evidenceResolver) {
    const providedEvidence = evidenceResolver
        ? await evidenceResolver(request)
        : defaultLicenseEvidence(request);
    const dedupedEvidence = new Map();
    for (const evidence of providedEvidence) {
        const value = evidence.value.trim();
        if (value.length === 0) {
            continue;
        }
        dedupedEvidence.set(`${evidence.kind}:${value}`, {
            kind: evidence.kind,
            value,
        });
    }
    return [...dedupedEvidence.values()];
}
function defaultLicenseEvidence(request) {
    const evidence = [];
    const authorization = request.headers.get("authorization");
    if (authorization) {
        evidence.push({ kind: "authorization", value: authorization });
    }
    const cookie = request.headers.get("cookie");
    if (cookie) {
        evidence.push({ kind: "cookie", value: cookie });
    }
    const walletAddress = request.headers.get("x-publishing-wallet-address");
    if (walletAddress) {
        evidence.push({ kind: "wallet-address", value: walletAddress });
    }
    return evidence;
}
function validateBodyDocument(value) {
    const kind = value.kind;
    if (typeof kind !== "string") {
        return {
            success: false,
            error: {
                tag: "validation-failed",
                reason: "Draft payload must include a document kind.",
            },
        };
    }
    const validation = validatePublishingDocument(kind, value, "request.body.document");
    if (!validation.success) {
        return {
            success: false,
            error: {
                tag: "validation-failed",
                reason: "Document payload validation failed.",
                issues: validation.error,
            },
        };
    }
    return {
        success: true,
        value: validation.value,
    };
}
