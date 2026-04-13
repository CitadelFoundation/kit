/**
 * Local host server for the publishing studio web app.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/server
 */
import type { Result } from "../../internal/result.js";
import type { PublicationWorkspace, PublishingError } from "../../types/index.js";
import { type PublishingServerLicenseOptions, type PublishingServerSessionResolver } from "../../server/app.js";
import type { PublicationWorkspaceOptions } from "../../workspace.js";
/**
 * Running local publishing studio host.
 */
export interface PublishingStudioHost {
    readonly root: string;
    readonly url: string;
    stop(): Promise<void>;
}
/**
 * Unbound standalone publishing host app, used for route tests and CLI boot.
 */
export interface PublishingStudioHostApp {
    readonly app: any;
    readonly clientBundlePath: string;
    readonly root: string;
    readonly workspace: PublicationWorkspace;
    dispose(): Promise<void>;
}
/**
 * Astro middleware options for the publishing studio.
 */
export interface PublishingStudioMiddlewareOptions {
    readonly root: string;
    readonly workspace?: Omit<PublicationWorkspaceOptions, "root">;
    readonly sessionResolver?: PublishingServerSessionResolver;
    readonly license?: PublishingServerLicenseOptions;
}
/**
 * Astro-compatible middleware function for integrating publishing studio into Astro dev server.
 */
export type PublishingStudioMiddleware = (context: {
    request: Request;
    url: URL;
}, next: () => Promise<Response>) => Promise<Response>;
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
export declare function createPublishingStudioMiddleware(options: PublishingStudioMiddlewareOptions): Promise<PublishingStudioMiddleware>;
/**
 * Start the local publishing studio host for a content workspace.
 */
export declare function createPublishingStudioHostApp(options: {
    readonly root: string;
    readonly workspace?: Omit<PublicationWorkspaceOptions, "root">;
    readonly sessionResolver?: PublishingServerSessionResolver;
    readonly license?: PublishingServerLicenseOptions;
}): Promise<Result<PublishingStudioHostApp, PublishingError>>;
/**
 * Start the local publishing studio host for a content workspace.
 */
export declare function startPublishingStudioHost(options: {
    readonly root: string;
    readonly host?: string;
    readonly port?: number;
    readonly workspace?: Omit<PublicationWorkspaceOptions, "root">;
    readonly sessionResolver?: PublishingServerSessionResolver;
    readonly license?: PublishingServerLicenseOptions;
}): Promise<Result<PublishingStudioHost, PublishingError>>;
