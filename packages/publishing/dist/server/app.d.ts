/**
 * Local-only Elysia app factory for the publishing workflow.
 *
 * @module @citadelfoundation/kit-publishing/server/app
 */
import { Elysia } from "elysia";
import type { Result } from "../internal/result.js";
import type { PublicationPolicy, PublicationSession, PublicationWorkspace, PublishingLicenseResolver, PublishingLicenseSessionEvidence, PublishingError, PublishingPaths } from "../types/index.js";
import { type PublishingRuntime } from "./runtime.js";
import { type PublicationWorkspaceOptions } from "../workspace.js";
/**
 * Created publishing server bundle.
 */
export interface PublishingServer {
    readonly app: Elysia<string>;
    readonly runtime: PublishingRuntime;
    readonly paths: PublishingPaths;
    readonly workspace: PublicationWorkspace;
    dispose(): Promise<void>;
}
/**
 * Context passed into request-scoped publication session resolution.
 */
export interface PublishingServerSessionResolverContext {
    readonly request: Request;
    readonly workspace: PublicationWorkspace;
    readonly policy: PublicationPolicy;
}
/**
 * Resolve the active publication session for a request.
 */
export type PublishingServerSessionResolver = (context: PublishingServerSessionResolverContext) => Promise<PublicationSession> | PublicationSession;
/**
 * Optional publication-aware license bridge for publishing servers.
 */
export interface PublishingServerLicenseOptions {
    readonly resolver: PublishingLicenseResolver;
    readonly evidenceResolver?: (request: Request) => Promise<readonly PublishingLicenseSessionEvidence[]> | readonly PublishingLicenseSessionEvidence[];
}
/**
 * Create the local publishing server for a workspace root.
 */
export declare function createPublishingServer(options: {
    readonly root: string;
    readonly paths?: Partial<PublishingPaths>;
    readonly prefix?: string;
    readonly workspace?: Omit<PublicationWorkspaceOptions, "root">;
    readonly sessionResolver?: PublishingServerSessionResolver;
    readonly license?: PublishingServerLicenseOptions;
}): Promise<Result<PublishingServer, PublishingError>>;
