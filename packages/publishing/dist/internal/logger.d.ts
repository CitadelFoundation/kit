/**
 * Lightweight logger facade owned by the publishing package.
 */
export interface PublishingLogger {
    info(message: string, metadata?: unknown): void;
    warn(message: string, metadata?: unknown): void;
    error(message: string, metadata?: unknown): void;
    perf(message: string, metadata?: unknown): void;
}
export declare function createLogger(scope: string): PublishingLogger;
