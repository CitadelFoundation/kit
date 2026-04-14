/**
 * Domain-agnostic publication workspace helpers.
 *
 * @module @citadelfoundation/kit-publishing/workspace
 */
import type { DeployTarget, IdentityProvider, PublicationCapability, PublicationCapabilitySet, PublicationPolicy, PublicationProfile, PublicationSession, PublicationSessionLicenseOptions, PublicationWorkspace, PublishingTemplateManifest, SessionPrincipal } from "./types/index.js";
/**
 * Options used to create a resolved publication workspace for the local studio.
 */
export interface PublicationWorkspaceOptions {
    readonly root: string;
    readonly id?: string;
    readonly title?: string;
    readonly contentRoot?: string;
    readonly profile?: Partial<PublicationProfile>;
    readonly deployTargets?: readonly DeployTarget[];
    readonly principal?: Partial<SessionPrincipal>;
    readonly identityProviders?: readonly IdentityProvider[];
    readonly policy?: Partial<PublicationPolicy>;
    readonly capabilities?: Partial<PublicationCapabilitySet>;
    readonly template?: PublishingTemplateManifest;
}
/**
 * Public workspace config shape used by generated publication.config.ts files.
 *
 * The CLI infers `root` at runtime, so portable templates only need to export
 * the remaining workspace options.
 */
export type PublicationWorkspaceConfig = Omit<PublicationWorkspaceOptions, "root">;
/**
 * Options used to resolve a request-scoped publication session.
 */
export interface PublicationSessionOptions {
    readonly providerId?: string;
    readonly walletAddress?: string;
    readonly principal?: Partial<SessionPrincipal>;
}
export interface ResolvePublicationSessionOptions extends PublicationSessionOptions {
    readonly license?: PublicationSessionLicenseOptions;
}
/**
 * Create a resolved publication workspace with safe local-first defaults.
 */
export declare function createPublicationWorkspace(options: PublicationWorkspaceOptions): PublicationWorkspace;
/**
 * Resolve a request-scoped publication session from a workspace and provider hint.
 */
export declare function createPublicationSession(workspace: PublicationWorkspace, options?: PublicationSessionOptions): PublicationSession;
export declare function resolvePublicationSession(workspace: PublicationWorkspace, options?: ResolvePublicationSessionOptions): Promise<PublicationSession>;
/**
 * Check whether a session can perform a capability-bound action.
 */
export declare function hasPublicationCapability(session: PublicationSession, capability: PublicationCapability): boolean;
