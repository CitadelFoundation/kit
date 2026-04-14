import type { Result } from "../../internal/result.js";
import type { PublishingError } from "../../types/index.js";
export interface StudioHostMiddlewareApp {
    readonly app: {
        handle(request: Request): Response | Promise<Response>;
    };
    readonly clientBundlePath: string;
    dispose?(): void | Promise<void>;
}
export interface StudioHostMiddlewareFreshnessController {
    ensureFresh(): Promise<Result<void, PublishingError>>;
}
export type PublishingStudioMiddlewareHandler = (context: {
    request: Request;
    url: URL;
}, next: () => Promise<Response>) => Promise<Response>;
export declare function createPublishingStudioMiddlewareRuntime(options: {
    readonly createHostApp: () => Promise<Result<StudioHostMiddlewareApp, PublishingError>>;
    readonly createFreshnessController: (outputPath: string) => Promise<Result<StudioHostMiddlewareFreshnessController, PublishingError>>;
}): Promise<PublishingStudioMiddlewareHandler>;
