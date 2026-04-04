/**
 * Local host server for the publishing studio web app.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/server
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Elysia } from "elysia";
import { createLogger } from "../../internal/logger.js";
import { createPublishingServer, } from "../../server/app.js";
import { PUBLISHING_STUDIO_BASE_PATH, PUBLISHING_STUDIO_SIGNIN_PATH, } from "./model.js";
const logger = createLogger("kit-publishing-studio-host");
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
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/editor`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/settings`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
        .get(`${PUBLISHING_STUDIO_BASE_PATH}/settings/*`, () => renderStudioShell(api.value.paths.root, api.value.workspace))
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
    return {
        success: true,
        value: {
            root: options.root,
            url,
            async stop() {
                server.stop(true);
                await hostApp.value.dispose();
            },
        },
    };
}
async function buildStudioHostClient(outputPath) {
    const entrypoint = resolveStudioHostClientEntrypoint();
    await mkdir(dirname(outputPath), { recursive: true });
    const build = await Bun.build({
        entrypoints: [entrypoint],
        outdir: dirname(outputPath),
        naming: {
            entry: "studio.js",
        },
        target: "browser",
        format: "esm",
        sourcemap: "none",
        minify: false,
    });
    if (!build.success) {
        return {
            success: false,
            error: {
                tag: "unsupported",
                reason: build.logs
                    .map((log) => log.message)
                    .join("\n"),
                path: outputPath,
            },
        };
    }
    if (build.outputs.length === 0) {
        return {
            success: false,
            error: {
                tag: "unsupported",
                reason: "Studio host build completed without a browser bundle output.",
                path: outputPath,
            },
        };
    }
    return { success: true, value: outputPath };
}
function resolveStudioHostClientEntrypoint() {
    const jsEntrypoint = fileURLToPath(new URL("./client.js", import.meta.url));
    if (existsSync(jsEntrypoint)) {
        return jsEntrypoint;
    }
    return fileURLToPath(new URL("./client.ts", import.meta.url));
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
