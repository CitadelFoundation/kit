/**
 * Minimal publishing-owned result and lifecycle primitives.
 */
export type Result<TValue, TError> = {
    readonly success: true;
    readonly value: TValue;
} | {
    readonly success: false;
    readonly error: TError;
};
export interface Disposable {
    dispose(): void | Promise<void>;
}
