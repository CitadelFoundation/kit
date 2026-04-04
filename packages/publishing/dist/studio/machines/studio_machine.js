/**
 * Workflow state machine for the publishing studio shell.
 *
 * @module @citadelfoundation/kit-publishing/studio/machines/studio_machine
 */
import { createSignal, } from "../../internal/signal.js";
/**
 * Create the publishing studio workflow machine.
 */
export async function createPublishingStudioMachine() {
    const transitions = {
        idle: {
            LOAD: "draft",
            DIRTY: "dirty",
            VALIDATE: "validating",
            PREVIEW_READY: "preview-ready",
            BLOCK: "publish-blocked",
            REVIEW_READY: "publish-confirmation",
            PUBLISH_SUCCESS: "publish-succeeded",
            FAIL: "error",
        },
        draft: {
            DIRTY: "dirty",
            VALIDATE: "validating",
            PREVIEW_READY: "preview-ready",
            BLOCK: "publish-blocked",
            REVIEW_READY: "publish-confirmation",
            PUBLISH_SUCCESS: "publish-succeeded",
            FAIL: "error",
            RESET: "idle",
        },
        dirty: {
            DIRTY: "dirty",
            VALIDATE: "validating",
            PREVIEW_READY: "preview-ready",
            BLOCK: "publish-blocked",
            REVIEW_READY: "publish-confirmation",
            PUBLISH_SUCCESS: "publish-succeeded",
            FAIL: "error",
            RESET: "idle",
        },
        validating: {
            DIRTY: "dirty",
            PREVIEW_READY: "preview-ready",
            BLOCK: "publish-blocked",
            REVIEW_READY: "publish-confirmation",
            PUBLISH_SUCCESS: "publish-succeeded",
            FAIL: "error",
            RESET: "idle",
        },
        "preview-ready": {
            DIRTY: "dirty",
            VALIDATE: "validating",
            BLOCK: "publish-blocked",
            REVIEW_READY: "publish-confirmation",
            PUBLISH_SUCCESS: "publish-succeeded",
            FAIL: "error",
            RESET: "idle",
        },
        "publish-blocked": {
            DIRTY: "dirty",
            VALIDATE: "validating",
            PREVIEW_READY: "preview-ready",
            REVIEW_READY: "publish-confirmation",
            FAIL: "error",
            RESET: "idle",
        },
        "publish-confirmation": {
            DIRTY: "dirty",
            FAIL: "error",
            PUBLISH_SUCCESS: "publish-succeeded",
            RESET: "idle",
        },
        "publish-succeeded": {
            DIRTY: "dirty",
            VALIDATE: "validating",
            PREVIEW_READY: "preview-ready",
            REVIEW_READY: "publish-confirmation",
            RESET: "idle",
        },
        error: {
            DIRTY: "dirty",
            VALIDATE: "validating",
            PREVIEW_READY: "preview-ready",
            REVIEW_READY: "publish-confirmation",
            RESET: "idle",
        },
    };
    const state = createSignal("idle");
    return {
        state,
        send(event) {
            const nextState = transitions[state.value][event.type];
            if (nextState) {
                state.value = nextState;
            }
        },
        dispose() { },
    };
}
/**
 * Map a target workflow state to its driving event.
 */
export function eventForWorkflowState(state) {
    switch (state) {
        case "idle":
            return { type: "RESET" };
        case "draft":
            return { type: "LOAD" };
        case "dirty":
            return { type: "DIRTY" };
        case "validating":
            return { type: "VALIDATE" };
        case "preview-ready":
            return { type: "PREVIEW_READY" };
        case "publish-blocked":
            return { type: "BLOCK" };
        case "publish-confirmation":
            return { type: "REVIEW_READY" };
        case "publish-succeeded":
            return { type: "PUBLISH_SUCCESS" };
        case "error":
            return { type: "FAIL" };
    }
}
