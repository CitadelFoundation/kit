/**
 * Workflow state machine for the publishing studio shell.
 *
 * @module @citadelfoundation/kit-publishing/studio/machines/studio_machine
 */
import { type ReadableSignal } from "../../internal/signal.js";
/**
 * Supported workflow states for the local publishing studio.
 */
export type PublishingWorkflowState = "idle" | "draft" | "dirty" | "validating" | "preview-ready" | "publish-blocked" | "publish-confirmation" | "publish-succeeded" | "error";
/**
 * Workflow events for the local publishing studio.
 */
export type PublishingWorkflowEvent = {
    readonly type: "LOAD";
} | {
    readonly type: "DIRTY";
} | {
    readonly type: "VALIDATE";
} | {
    readonly type: "PREVIEW_READY";
} | {
    readonly type: "BLOCK";
} | {
    readonly type: "REVIEW_READY";
} | {
    readonly type: "PUBLISH_SUCCESS";
} | {
    readonly type: "FAIL";
} | {
    readonly type: "RESET";
};
export interface PublishingWorkflowMachine {
    readonly state: ReadableSignal<PublishingWorkflowState>;
    send(event: PublishingWorkflowEvent): void;
    dispose(): void;
}
/**
 * Create the publishing studio workflow machine.
 */
export declare function createPublishingStudioMachine(): Promise<PublishingWorkflowMachine>;
/**
 * Map a target workflow state to its driving event.
 */
export declare function eventForWorkflowState(state: PublishingWorkflowState): PublishingWorkflowEvent;
