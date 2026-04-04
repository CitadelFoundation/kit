/**
 * Shared model helpers for the local publishing studio host.
 *
 * @module @citadelfoundation/kit-publishing/studio/host/model
 */
import { type PublishingStudioPostsBucket } from "../browse_state.js";
import type { IdentityProvider, PublicationSession, PublicationWorkspace, PublishingDocument, PublishingEditableMetadata, PublishingError, PublishingIndexEntry, PublishingValidationIssue } from "../../types/index.js";
declare const STUDIO_BROWSE_SURFACES: readonly ["dashboard", "posts", "pages", "tags", "settings"];
/**
 * Base pathname for the standalone publishing host.
 */
export declare const PUBLISHING_STUDIO_BASE_PATH = "/studio";
/**
 * Sign-in pathname for the standalone publishing host.
 */
export declare const PUBLISHING_STUDIO_SIGNIN_PATH = "/studio/signin";
/**
 * Distinguish sign-in shell routes from the interactive studio shell.
 */
export type PublishingStudioRouteKind = "signin" | "studio";
/**
 * Restorable browse surfaces supported by the publishing studio host.
 */
export type PublishingStudioBrowseSurface = (typeof STUDIO_BROWSE_SURFACES)[number];
export type { PublishingStudioPostsBucket } from "../browse_state.js";
/**
 * Resolved startup target for the publishing studio host.
 */
export type PublishingStudioPathTarget = {
    readonly kind: "editor";
    readonly route: string;
} | {
    readonly kind: "browse";
    readonly surface: PublishingStudioBrowseSurface;
    readonly anchorRoute: string;
    readonly postsBucket?: PublishingStudioPostsBucket;
} | {
    readonly kind: "dashboard-fallback";
    readonly anchorRoute: string;
};
export type PublishingStudioSiteDestination = {
    readonly kind: "available";
    readonly href: string;
    readonly source: "canonical-site-url" | "deploy-target-url";
} | {
    readonly kind: "unavailable";
    readonly reason: "missing" | "invalid";
    readonly message: string;
};
/**
 * Entry-gate reasons used to route blocked or sign-in states.
 */
export type PublishingStudioEntryGateReason = "license-required" | "license-invalid" | "license-unavailable" | "license-provider" | "access-denied";
/**
 * Resolved startup gate for the standalone publishing host.
 */
export interface PublishingStudioEntryGate {
    readonly allowed: boolean;
    readonly redirectToSignin: boolean;
    readonly reason?: PublishingStudioEntryGateReason;
    readonly message?: string;
}
/**
 * Convert a content route into a stable draft identifier.
 */
export declare function routeToDraftId(route: string): string;
/**
 * Build a stable standalone browse URL for the requested surface.
 */
export declare function publishingStudioPathForBrowseSurface(surface: PublishingStudioBrowseSurface, options?: {
    readonly postsBucket?: PublishingStudioPostsBucket;
}): string;
/**
 * Build a stable standalone editor URL for a document route.
 */
export declare function publishingStudioPathForEditorRoute(route: string): string;
/**
 * Resolve the publishing studio startup target from a standalone host URL.
 */
export declare function resolvePublishingStudioPathTarget(url: URL, entries: readonly PublishingIndexEntry[]): PublishingStudioPathTarget;
/**
 * Resolve the best available consumer-site destination for the studio shell.
 */
export declare function resolvePublishingStudioSiteDestination(workspace: PublicationWorkspace, currentUrl: URL): PublishingStudioSiteDestination;
/**
 * Filter the visible sign-in providers for a workspace.
 */
export declare function publishingStudioProvidersForSignIn(workspace: PublicationWorkspace): readonly IdentityProvider[];
/**
 * Decide whether the current session may continue into the interactive studio shell.
 */
export declare function resolvePublishingStudioEntryGate(workspace: PublicationWorkspace, session: PublicationSession): PublishingStudioEntryGate;
/**
 * Human-facing copy for entry-gate reasons.
 */
export declare function messageForPublishingStudioEntryGateReason(reason: PublishingStudioEntryGateReason): string;
/**
 * Derive the editable text value for a document.
 */
export declare function editorValueForDocument(document: PublishingDocument): string;
/**
 * Apply the edited text back to the current document shape.
 */
export declare function documentFromEditorValue(document: PublishingDocument, value: string): PublishingDocument;
/**
 * Derive editable metadata fields for the active studio document.
 */
export declare function metadataForDocument(document: PublishingDocument): PublishingEditableMetadata;
/**
 * Apply edited metadata values back to the active document.
 */
export declare function documentWithMetadata(document: PublishingDocument, metadata: PublishingEditableMetadata): PublishingDocument;
/**
 * Derive the public route for a loaded document.
 */
export declare function routeForDocument(document: PublishingDocument): string;
/**
 * Derive the canonical source path for a loaded document.
 */
export declare function sourcePathForDocument(document: PublishingDocument): string;
/**
 * Normalize a publishing error into validation issues for the studio shell.
 */
export declare function validationIssuesForError(error: PublishingError): readonly PublishingValidationIssue[];
