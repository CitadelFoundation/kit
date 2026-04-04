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
