import { type TemplateResult } from "lit";
import { PublishingElement } from "../../internal/ui.js";
export type DistractionFreeWorkflowState = "draft" | "dirty" | "ready" | "review" | "published";
export interface DistractionFreeModeActionHandlers {
    readonly onPreview?: () => void;
    readonly onReview?: () => void;
    readonly onConfirmPublish?: () => void;
    readonly onToggleWorkspace?: () => void;
    readonly onToggleSettings?: () => void;
}
export declare class KitPublishingDistractionFreeMode extends PublishingElement {
    active: boolean;
    routeLabel: string;
    statusLabel: string;
    surfaceLabel: string;
    workflowState: DistractionFreeWorkflowState;
    showWorkspace: boolean;
    showSettings: boolean;
    canPreview: boolean;
    canReview: boolean;
    canConfirmPublish: boolean;
    canPublish: boolean;
    actions: DistractionFreeModeActionHandlers;
    description: string;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private renderMinimalChrome;
    private renderHeroChrome;
}
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-distraction-free-mode": KitPublishingDistractionFreeMode;
    }
}
