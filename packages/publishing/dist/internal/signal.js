/**
 * Tiny publishing-owned writable signal primitive.
 */
class SignalImpl {
    constructor(initialValue) {
        this.listeners = new Set();
        this.currentValue = initialValue;
    }
    get value() {
        return this.currentValue;
    }
    set value(value) {
        this.set(value);
    }
    set(value) {
        if (Object.is(this.currentValue, value)) {
            return;
        }
        this.currentValue = value;
        for (const listener of this.listeners) {
            listener(this.currentValue);
        }
    }
    update(updater) {
        this.set(updater(this.currentValue));
    }
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.currentValue);
        return () => {
            this.listeners.delete(listener);
        };
    }
}
export function createSignal(initialValue) {
    return new SignalImpl(initialValue);
}
