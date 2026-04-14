/**
 * Local host server for the publishing studio web app.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/server
 */
import { existsSync, lstatSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { Elysia } from "elysia";
import { createLogger } from "../../internal/logger.js";
import { createPublishingPaths } from "../../content/file_content_repository.js";
import { createPublishingServer, } from "../../server/app.js";
import { PUBLISHING_STUDIO_BASE_PATH, PUBLISHING_STUDIO_MEDIA_PATH_PREFIX, PUBLISHING_STUDIO_SIGNIN_PATH, } from "./model.js";
import { buildStudioHostClient, createStudioHostClientFreshnessController, } from "./client_bundle_freshness.js";
import { createPublishingStudioMiddlewareRuntime } from "./middleware_runtime.js";
const logger = createLogger("kit-publishing-studio-host");
function isAlreadyStoppedError(error) {
    return (error instanceof Error &&
        /isn't running|already stopped|not listening/i.test(error.message));
}
/**
 * Create an Astro middleware for the publishing studio.
 * This allows the studio to run on the same port as the Astro dev server.
 *
 * @example
 * ```ts
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config';
 * import { createPublishingStudioMiddleware } from '@citadelfoundation/kit-publishing/studio';
 *
 * export default defineConfig({
 *   middleware: createPublishingStudioMiddleware({
 *     root: process.cwd(),
 *   }),
 * });
 * ```
 */
export async function createPublishingStudioMiddleware(options) {
    const mediaDir = createPublishingPaths(options.root).mediaDir;
    const studioMiddleware = await createPublishingStudioMiddlewareRuntime({
        createHostApp: () => createPublishingStudioHostApp(options),
        createFreshnessController: (outputPath) => createStudioHostClientFreshnessController({
            outputPath,
        }),
    });
    return async (context, next) => {
        if ((context.request.method === "GET" || context.request.method === "HEAD") &&
            context.url.pathname.startsWith(PUBLISHING_STUDIO_MEDIA_PATH_PREFIX)) {
            return createPublishingStudioMediaResponse(options.root, mediaDir, context.url.pathname);
        }
        return studioMiddleware(context, next);
    };
}
/**
 * Start the local publishing studio host for a content workspace.
 */
export async function createPublishingStudioHostApp(options) {
    const api = await createPublishingServer({
        root: options.root,
        prefix: "/api",
        workspace: options.workspace,
        sessionResolver: options.sessionResolver,
        license: options.license,
    });
    if (!api.success) {
        return { success: false, error: api.error };
    }
    const clientBundlePath = join(api.value.paths.studioDir, "host", "studio.js");
    const bundled = await buildStudioHostClient(clientBundlePath);
    if (!bundled.success) {
        await api.value.dispose();
        return { success: false, error: bundled.error };
    }
    const app = new Elysia()
        .all("/api", ({ request }) => api.value.app.handle(request))
        .all("/api/*", ({ request }) => api.value.app.handle(request))
        .get("/", ({ request }) => redirectToSignin(request.url))
        .get(PUBLISHING_STUDIO_BASE_PATH, ({ request }) => redirectToSignin(request.url))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/`, ({ request }) => redirectToSignin(request.url))
        .get(PUBLISHING_STUDIO_SIGNIN_PATH, () => new Response(renderPublishingStudioHtml(api.value.paths.root, api.value.workspace, "signin"), {
        headers: {
            "content-type": "text/html; charset=utf-8",
        },
    }))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/dashboard`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/posts`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/posts/*`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/pages`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/tags`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/tags/*`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/editor`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/settings`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/settings/*`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_MEDIA_PATH_PREFIX}*`, ({ path }) => createPublishingStudioMediaResponse(api.value.paths.root, api.value.paths.mediaDir, path))
        .get("/studio.js", () => new Response(Bun.file(clientBundlePath), {
        headers: {
            "content-type": "application/javascript; charset=utf-8",
        },
    }))
        .get("/healthz", () => new Response("ok", {
        headers: {
            "content-type": "text/plain; charset=utf-8",
        },
    }));
    return {
        success: true,
        value: {
            app,
            clientBundlePath,
            root: api.value.paths.root,
            workspace: api.value.workspace,
            async dispose() {
                await api.value.dispose();
            },
        },
    };
}
/**
 * Start the local publishing studio host for a content workspace.
 */
export async function startPublishingStudioHost(options) {
    const hostApp = await createPublishingStudioHostApp(options);
    if (!hostApp.success) {
        return hostApp;
    }
    const hostname = options.host ?? "127.0.0.1";
    const port = options.port ?? 4711;
    const server = hostApp.value.app.listen({
        hostname,
        port,
    });
    const actualPort = Number(server.server?.port ?? port);
    const url = typeof server.server?.url === "string" && server.server.url.length > 0
        ? server.server.url
        : `http://${hostname}:${actualPort}`;
    logger.info("Publishing studio host started", {
        root: options.root,
        url,
    });
    let stopPromise = null;
    return {
        success: true,
        value: {
            root: options.root,
            url,
            stop() {
                if (stopPromise) {
                    return stopPromise;
                }
                stopPromise = (async () => {
                    let stopError = null;
                    try {
                        server.stop(true);
                    }
                    catch (error) {
                        if (!isAlreadyStoppedError(error)) {
                            stopError = error;
                        }
                    }
                    try {
                        await hostApp.value.dispose();
                    }
                    finally {
                        if (stopError) {
                            throw stopError;
                        }
                    }
                })();
                return stopPromise;
            },
        },
    };
}
function renderStudioShell(root, workspace) {
    return new Response(renderPublishingStudioHtml(root, workspace, "studio"), {
        headers: {
            "content-type": "text/html; charset=utf-8",
        },
    });
}
function signinRedirectTarget(requestUrl) {
    const url = new URL(requestUrl);
    return `${PUBLISHING_STUDIO_SIGNIN_PATH}${url.search}`;
}
function redirectToSignin(requestUrl) {
    return new Response(null, {
        status: 302,
        headers: {
            location: signinRedirectTarget(requestUrl),
        },
    });
}
function createPublishingStudioMediaResponse(workspaceRoot, mediaRoot, requestPath) {
    if (isPublishingStudioMediaRootSymlink(workspaceRoot, mediaRoot)) {
        return new Response("Not found", {
            status: 404,
            headers: {
                "content-type": "text/plain; charset=utf-8",
            },
        });
    }
    const resolvedPath = resolvePublishingStudioMediaFilePath(mediaRoot, requestPath);
    if (resolvedPath === null || !existsSync(resolvedPath)) {
        return new Response("Not found", {
            status: 404,
            headers: {
                "content-type": "text/plain; charset=utf-8",
            },
        });
    }
    try {
        const canonicalMediaRoot = realpathSync(mediaRoot);
        const canonicalResolvedPath = realpathSync(resolvedPath);
        const relativeResolvedPath = relative(canonicalMediaRoot, canonicalResolvedPath);
        if (relativeResolvedPath.length === 0 ||
            relativeResolvedPath === ".." ||
            relativeResolvedPath.startsWith("..") ||
            isAbsolute(relativeResolvedPath) ||
            relativeResolvedPath.split(/[/\\]+/u).includes("..")) {
            return new Response("Not found", {
                status: 404,
                headers: {
                    "content-type": "text/plain; charset=utf-8",
                },
            });
        }
        if (!statSync(resolvedPath).isFile()) {
            return new Response("Not found", {
                status: 404,
                headers: {
                    "content-type": "text/plain; charset=utf-8",
                },
            });
        }
        return new Response(Bun.file(resolvedPath));
    }
    catch (error) {
        logger.error("Failed to serve publishing studio media asset", {
            mediaRoot,
            requestPath,
            error,
        });
        return new Response("Failed to read media asset", {
            status: 500,
            headers: {
                "content-type": "text/plain; charset=utf-8",
            },
        });
    }
}
function isPublishingStudioMediaRootSymlink(workspaceRoot, mediaRoot) {
    try {
        if (lstatSync(resolve(workspaceRoot)).isSymbolicLink()) {
            return true;
        }
        const relativeMediaRoot = relative(resolve(workspaceRoot), resolve(mediaRoot));
        if (relativeMediaRoot.length === 0 ||
            relativeMediaRoot === ".." ||
            relativeMediaRoot.startsWith("..") ||
            isAbsolute(relativeMediaRoot)) {
            return true;
        }
        let currentPath = resolve(workspaceRoot);
        for (const segment of relativeMediaRoot.split(/[/\\]+/u)) {
            currentPath = join(currentPath, segment);
            if (lstatSync(currentPath).isSymbolicLink()) {
                return true;
            }
        }
        return false;
    }
    catch {
        return true;
    }
}
function resolvePublishingStudioMediaFilePath(mediaRoot, requestPath) {
    const suffix = requestPath.startsWith(PUBLISHING_STUDIO_MEDIA_PATH_PREFIX)
        ? requestPath.slice(PUBLISHING_STUDIO_MEDIA_PATH_PREFIX.length)
        : requestPath;
    let decodedSuffix = suffix;
    try {
        decodedSuffix = decodeURIComponent(suffix);
    }
    catch {
        return null;
    }
    if (decodedSuffix.length === 0 ||
        decodedSuffix.startsWith("/") ||
        decodedSuffix.includes("\\")) {
        return null;
    }
    const candidate = resolve(mediaRoot, decodedSuffix);
    const relativeCandidate = relative(mediaRoot, candidate);
    if (relativeCandidate.length === 0 ||
        relativeCandidate === ".." ||
        relativeCandidate.startsWith("..") ||
        isAbsolute(relativeCandidate) ||
        relativeCandidate.split(/[/\\]+/u).includes("..")) {
        return null;
    }
    return candidate;
}
function renderPublishingStudioHtml(root, workspace, routeKind) {
    const authHidden = routeKind === "studio" ? " hidden" : "";
    const studioHidden = routeKind === "signin" ? " hidden" : "";
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${workspace.profile.title} Studio</title>
    <style>
      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #f4f7fb;
        color: #0f172a;
        font-family:
          "IBM Plex Sans",
          "Inter",
          system-ui,
          sans-serif;
      }

      body {
        display: block;
      }

      #publishing-auth-shell[hidden],
      kit-publishing-studio[hidden] {
        display: none !important;
      }

      #publishing-auth-shell {
        min-height: 100vh;
      }

      .publishing-auth-shell {
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.4rem;
        background:
          radial-gradient(circle at top, rgba(15, 118, 110, 0.1), transparent 28%),
          linear-gradient(180deg, #fbfcfe 0%, #f1f5f9 100%);
      }

      .publishing-auth-container {
        width: min(28rem, 100%);
        display: grid;
        gap: 1.25rem;
      }

      .publishing-auth-header,
      .publishing-auth-resume {
        justify-items: center;
        text-align: center;
      }

      .publishing-auth-mark {
        width: 3.25rem;
        height: 3.25rem;
        border-radius: 999px;
        background:
          radial-gradient(circle at 30% 30%, #ffffff 0 14%, transparent 16%),
          linear-gradient(135deg, #0f766e 0%, #14b8a6 58%, #99f6e4 100%);
        box-shadow: 0 18px 40px rgba(15, 118, 110, 0.18);
      }

      .publishing-auth-header {
        gap: 0.75rem;
      }

      .publishing-auth-eyebrow,
      .publishing-auth-panel-eyebrow {
        margin: 0;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #0f766e;
      }

      .publishing-auth-title,
      .publishing-auth-panel-title,
      .publishing-auth-panel-copy,
      .publishing-auth-field-label,
      .publishing-auth-field-hint,
      .publishing-auth-provider-copy,
      .publishing-auth-note {
        margin: 0;
      }

      .publishing-auth-title {
        font-size: clamp(2.1rem, 4vw, 2.7rem);
        line-height: 0.98;
        letter-spacing: -0.04em;
      }

      .publishing-auth-panel {
        display: grid;
        gap: 1rem;
        padding: 1.55rem;
        border-radius: 1rem;
        border: 1px solid rgba(15, 23, 42, 0.09);
        background: rgba(255, 255, 255, 0.97);
        box-shadow: 0 18px 44px rgba(15, 23, 42, 0.1);
      }

      .publishing-auth-panel-header,
      .publishing-auth-resume-copy {
        display: grid;
        gap: 0.35rem;
      }

      .publishing-auth-resume {
        gap: 0.9rem;
      }

      .publishing-auth-resume-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.9rem;
        height: 2.9rem;
        border-radius: 999px;
        background: #e2e8f0;
        color: #0f172a;
        font-size: 1rem;
        font-weight: 700;
      }

      .publishing-auth-panel-title {
        font-size: clamp(1.8rem, 3vw, 2.15rem);
        line-height: 1.02;
        letter-spacing: -0.04em;
      }

      .publishing-auth-panel-copy {
        color: #475569;
        line-height: 1.5;
      }

      .publishing-auth-provider-list {
        display: grid;
        gap: 0.7rem;
      }

      .publishing-auth-provider {
        display: grid;
        gap: 0.3rem;
        width: 100%;
        padding: 0.95rem 1rem;
        border-radius: 0.9rem;
        border: 1px solid rgba(15, 23, 42, 0.1);
        background: #ffffff;
        cursor: pointer;
        text-align: left;
        font: inherit;
        color: inherit;
      }

      .publishing-auth-provider:hover,
      .publishing-auth-provider:focus-visible,
      .publishing-auth-action:hover,
      .publishing-auth-action:focus-visible {
        outline: none;
        border-color: rgba(15, 23, 42, 0.22);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
      }

      .publishing-auth-provider-title {
        font-weight: 600;
      }

      .publishing-auth-provider-copy {
        color: #64748b;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .publishing-auth-field {
        display: grid;
        gap: 0.35rem;
      }

      .publishing-auth-field-label {
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #0f172a;
      }

      .publishing-auth-field-input {
        width: 100%;
        box-sizing: border-box;
        min-height: 3.05rem;
        padding: 0 0.95rem;
        border-radius: 0.85rem;
        border: 1px solid rgba(15, 23, 42, 0.12);
        background: #ffffff;
        color: #0f172a;
        font: inherit;
      }

      .publishing-auth-field-input:focus-visible {
        outline: 2px solid rgba(15, 118, 110, 0.18);
        outline-offset: 1px;
        border-color: rgba(15, 118, 110, 0.55);
      }

      .publishing-auth-field-input[aria-invalid="true"] {
        border-color: rgba(190, 24, 93, 0.55);
      }

      .publishing-auth-field-hint,
      .publishing-auth-note {
        color: #64748b;
        font-size: 0.88rem;
        line-height: 1.45;
      }

      .publishing-auth-error {
        min-height: 1.4rem;
        color: #be123c;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .publishing-auth-actions {
        display: flex;
        gap: 0.7rem;
      }

      .publishing-auth-actions--stacked {
        flex-direction: column;
      }

      .publishing-auth-action {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 2.9rem;
        padding: 0 1rem;
        border-radius: 0.85rem;
        border: 1px solid rgba(15, 23, 42, 0.12);
        background: #ffffff;
        color: #0f172a;
        font: inherit;
        cursor: pointer;
      }

      .publishing-auth-action[data-variant="primary"] {
        border-color: rgba(15, 118, 110, 0.18);
        background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
        color: #ffffff;
      }
    </style>
  </head>
  <body>
    <div id="publishing-auth-shell"${authHidden}></div>
    <kit-publishing-studio${studioHidden}></kit-publishing-studio>
    <script>
      window.__PUBLISHING_ROOT__ = ${JSON.stringify(root)};
      window.__PUBLISHING_WORKSPACE__ = ${JSON.stringify(workspace)};
      window.__PUBLISHING_ROUTE_KIND__ = ${JSON.stringify(routeKind)};
    </script>
    <script type="module" src="/studio.js"></script>
  </body>
</html>`;
}
