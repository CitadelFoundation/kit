/**
 * CLI entrypoint for the local publishing studio host.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/cli
 */
import type { PublicationWorkspaceConfig } from "../../workspace.js";
export interface PublishingStudioCliOptions {
    readonly root: string;
    readonly host?: string;
    readonly port?: number;
    readonly workspace?: PublicationWorkspaceConfig;
}
export declare function runPublishingStudioHostCli(options: PublishingStudioCliOptions): Promise<void>;
