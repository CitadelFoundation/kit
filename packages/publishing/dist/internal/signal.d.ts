/**
 * Tiny publishing-owned writable signal primitive.
 */
export interface ReadableSignal<TValue> {
    readonly value: TValue;
    subscribe(listener: (value: TValue) => void): () => void;
}
export interface WritableSignal<TValue> extends ReadableSignal<TValue> {
    value: TValue;
    set(value: TValue): void;
    update(updater: (value: TValue) => TValue): void;
}
export declare function createSignal<TValue>(initialValue: TValue): WritableSignal<TValue>;
