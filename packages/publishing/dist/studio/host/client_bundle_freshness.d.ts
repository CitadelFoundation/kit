import type { Result } from "../../internal/result.js";
import type { PublishingError } from "../../types/index.js";
export interface StudioHostClientFreshnessController {
    ensureFresh(): Promise<Result<void, PublishingError>>;
}
export interface StudioHostClientFreshnessControllerOptions {
    readonly outputPath: string;
    readonly entrypoint?: string;
    readonly env?: Record<string, string | undefined>;
    readonly build?: StudioHostClientBuilder;
}
export type StudioHostClientBuilder = (outputPath: string) => Promise<Result<string, PublishingError>>;
export declare function createStudioHostClientFreshnessController(options: StudioHostClientFreshnessControllerOptions): Promise<Result<StudioHostClientFreshnessController, PublishingError>>;
export declare function buildStudioHostClient(outputPath: string, entrypoint?: string): Promise<Result<string, PublishingError>>;
export declare function resolveStudioHostClientEntrypoint(): string;
