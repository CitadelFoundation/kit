var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { $getNodeByKey, } from "lexical";
import { css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PublishingElement, publishingTheme } from "../../../../internal/ui.js";
import { PublishingCardNode, restorePublishingCardNode, } from "./card-node.js";
export function createCodeCardViewElement(config) {
    const view = document.createElement("kit-publishing-code-card-view");
    view.data = config.data;
    view.selected = config.selected ?? false;
    view.editable = config.editable ?? true;
    view.onChange = config.onChange ?? null;
    return view;
}
const supportedLanguages = [
    "plaintext",
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "css",
    "html",
    "md",
];
let KitPublishingCodeCardView = class KitPublishingCodeCardView extends PublishingElement {
    constructor() {
        super(...arguments);
        this.data = { code: "", language: "plaintext" };
        this.selected = false;
        this.editable = true;
        this.onChange = null;
        this.copyState = "idle";
        this.handleLanguageChange = (event) => {
            this.setData({
                ...this.data,
                language: event.target.value,
            });
        };
        this.handleCodeChange = (event) => {
            this.setData({
                ...this.data,
                code: event.target.value,
            });
        };
        this.handleCopy = async () => {
            await navigator.clipboard?.writeText(this.data.code);
            this.copyState = "copied";
            setTimeout(() => {
                this.copyState = "idle";
            }, 750);
        };
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
      }

      .code-card {
        display: grid;
        gap: var(--kit-space-sm);
        padding: var(--kit-space-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 88%, transparent);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-surface-primary);
      }

      :host([selected]) .code-card {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 44%,
          transparent
        );
        box-shadow: 0 0 0 1px
          color-mix(in srgb, var(--kit-color-primary) 18%, transparent);
      }

      .code-card-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-sm);
        align-items: center;
        justify-content: space-between;
      }

      .code-card-language {
        min-width: 11rem;
        padding: 0.5rem 0.7rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
      }

      .code-card-copy {
        appearance: none;
        padding: 0.52rem 0.8rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        background: var(--kit-surface-secondary);
        color: var(--kit-text-primary);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .code-card-copy[data-state="copied"] {
        border-color: color-mix(in srgb, #10b981 30%, transparent);
        background: color-mix(in srgb, #10b981 12%, var(--kit-surface-primary));
      }

      pre {
        margin: 0;
        padding: var(--kit-space-md);
        overflow: auto;
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 90%,
          transparent
        );
      }

      code {
        font-family: var(--kit-font-family-mono);
        font-size: var(--kit-font-size-sm);
        white-space: pre-wrap;
      }

      .code-card-editor {
        min-height: 8rem;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        background: var(--kit-surface-primary);
        color: var(--kit-text-primary);
        font: inherit;
        font-family: var(--kit-font-family-mono);
      }

      .code-card-highlight .token-keyword {
        color: #7c3aed;
        font-weight: 600;
      }

      .code-card-highlight .token-string {
        color: #0f766e;
      }

      .code-card-highlight .token-number {
        color: #b45309;
      }
    `,
    ]; }
    renderContent() {
        return html `
      <section class="code-card">
        ${this.editable
            ? html `
              <div class="code-card-toolbar">
                <label>
                  <span class="sr-only">Language</span>
                  <select
                    class="code-card-language"
                    .value=${this.data.language}
                    @change=${this.handleLanguageChange}
                  >
                    ${supportedLanguages.map((language) => html `<option value=${language}>${language}</option>`)}
                  </select>
                </label>

                <button
                  class="code-card-copy"
                  type="button"
                  data-state=${this.copyState}
                  @click=${this.handleCopy}
                >
                  ${this.copyState === "copied" ? "Copied" : "Copy"}
                </button>
              </div>
            `
            : nothing}

        <pre class="code-card-highlight"><code>${renderHighlightedCode(this.data.code, this.data.language)}</code></pre>

        ${this.editable
            ? html `
              <textarea
                class="code-card-editor"
                .value=${this.data.code}
                @change=${this.handleCodeChange}
              ></textarea>
            `
            : nothing}
      </section>
    `;
    }
    setData(data) {
        this.data = data;
        this.onChange?.(data);
    }
};
__decorate([
    property({ attribute: false })
], KitPublishingCodeCardView.prototype, "data", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingCodeCardView.prototype, "selected", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingCodeCardView.prototype, "editable", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingCodeCardView.prototype, "onChange", void 0);
__decorate([
    state()
], KitPublishingCodeCardView.prototype, "copyState", void 0);
KitPublishingCodeCardView = __decorate([
    customElement("kit-publishing-code-card-view")
], KitPublishingCodeCardView);
export { KitPublishingCodeCardView };
export class CodeCardNode extends PublishingCardNode {
    static { this.cardType = "code-card"; }
    static getType() {
        return CodeCardNode.cardType;
    }
    static clone(node) {
        return new CodeCardNode(node.getCardData(), node.getKey());
    }
    constructor(data, key) {
        super(data, key);
    }
    createDOM() {
        const element = document.createElement("div");
        element.dataset.cardType = this.getCardType();
        element.className = "publishing-code-card-node";
        return element;
    }
    decorate(editor, _config) {
        const view = createCodeCardViewElement({
            data: this.getCardData(),
            selected: false,
            editable: true,
            onChange: (data) => {
                editor.update(() => {
                    const node = $getNodeByKey(this.getKey());
                    if (node instanceof CodeCardNode) {
                        node.setCardData(data);
                    }
                });
            },
        });
        return view;
    }
    exportJSON() {
        return {
            ...super.exportJSON(),
            type: this.getCardType(),
            version: 1,
            data: this.getCardData(),
        };
    }
    static importJSON(serializedNode) {
        return restorePublishingCardNode(CodeCardNode, serializedNode);
    }
}
export function createCodeCard(data) {
    return new CodeCardNode(data);
}
export function renderHighlightedCode(code, language) {
    const segments = highlightCodeSegments(code, language);
    return html `${segments.map((segment) => segment.kind === "plain"
        ? segment.value
        : html `<span class=${`token-${segment.kind}`}>${segment.value}</span>`)}`;
}
function highlightCodeSegments(code, language) {
    if (!["ts", "tsx", "js", "jsx", "json"].includes(language)) {
        return [{ kind: "plain", value: code }];
    }
    const tokens = code.split(/(\b(?:const|let|var|function|return|class|import|export|from|new|if|else|for|while|true|false|null|undefined)\b|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b)/g);
    return tokens
        .filter((token) => token.length > 0)
        .map((token) => {
        if (/^\b(?:const|let|var|function|return|class|import|export|from|new|if|else|for|while|true|false|null|undefined)\b$/u.test(token)) {
            return { kind: "keyword", value: token };
        }
        if (/^"(?:[^"\\]|\\.)*"$|^'(?:[^'\\]|\\.)*'$/u.test(token)) {
            return { kind: "string", value: token };
        }
        if (/^\b\d+(?:\.\d+)?\b$/u.test(token)) {
            return { kind: "number", value: token };
        }
        return { kind: "plain", value: token };
    });
}
