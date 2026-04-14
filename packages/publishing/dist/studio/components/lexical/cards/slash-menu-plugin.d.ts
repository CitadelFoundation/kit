import { type TemplateResult } from "lit";
import type { LexicalEditor } from "lexical";
import { PublishingElement } from "../../../../internal/ui.js";
import { type PublishingCardMenuItem } from "./card-registry.js";
export interface SlashMenuPlacement {
    readonly top: number;
    readonly left: number;
}
export interface SlashMenuState {
    readonly open: boolean;
    readonly query: string;
    readonly activeIndex: number;
    readonly placement: SlashMenuPlacement | null;
}
export declare class KitPublishingSlashMenuPlugin extends PublishingElement {
    editor: LexicalEditor | null;
    private menuState;
    private menuItems;
    private rootElement;
    private rootDisposer;
    private rootKeyDownListener;
    static styles: import("lit").CSSResult[];
    protected updated(changedProperties: Map<PropertyKey, unknown>): void;
    disconnectedCallback(): void;
    protected renderContent(): TemplateResult;
    private renderMenuItem;
    private bindEditor;
    private unbindEditor;
    private handleRootKeyDown;
    private openMenu;
    private closeMenu;
    private resetMenu;
    private updateQuery;
    private moveActive;
    private confirmActiveItem;
    private selectMenuItem;
    private getActiveItem;
    private resolvePlacement;
    private optionIdFor;
}
export declare function normalizeSlashMenuQuery(query: string): string;
export declare function filterSlashMenuItems(items: readonly PublishingCardMenuItem[], query: string): readonly PublishingCardMenuItem[];
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-slash-menu-plugin": KitPublishingSlashMenuPlugin;
    }
}
