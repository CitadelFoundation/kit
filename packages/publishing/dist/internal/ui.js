/**
 * Publishing-owned UI primitives for the standalone studio shell.
 */
import { LitElement, css, html, nothing } from "lit";
export class PublishingElement extends LitElement {
    static { this.baseSystemStyles = css `
    :host {
      display: block;
      box-sizing: border-box;
      position: relative;
      color: var(--kit-text-primary);
      font-family: var(--kit-font-family-sans, system-ui, sans-serif);
    }

    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }
  `; }
    render() {
        return html `
      <div class="kit-component-root" part="root">
        ${this.renderContent()}
      </div>
    `;
    }
    renderContent() {
        return nothing;
    }
    emitEvent(eventName, detail, options) {
        return this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true,
            ...options,
        }));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.cleanup();
    }
    cleanup() { }
}
export const publishingTheme = css `
  :host {
    --kit-surface-primary: #fcfcfd;
    --kit-surface-secondary: #f3f4f6;
    --kit-text-primary: #111827;
    --kit-text-secondary: #4b5563;
    --kit-border-primary: #d1d5db;
    --kit-color-primary: #111827;
    --kit-brand-primary: #111827;

    --kit-font-family-sans:
      system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --kit-font-family-mono:
      "SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", monospace;
    --kit-font-size-xs: 0.75rem;
    --kit-font-size-sm: 0.875rem;

    --kit-radius-md: 0.75rem;
    --kit-radius-lg: 1rem;
    --kit-radius-full: 999px;

    --kit-space-xs: 0.375rem;
    --kit-space-sm: 0.75rem;
    --kit-space-md: 1rem;
    --kit-space-lg: 1.5rem;

    --kit-shadow-sm: 0 12px 24px rgba(15, 23, 42, 0.08);
  }
`;
