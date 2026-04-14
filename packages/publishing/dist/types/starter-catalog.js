/**
 * Portable template metadata for built-in and imported publishing templates.
 *
 * These types are separate from the runtime publishing contracts
 * (PublicationWorkspace, DeployTarget, PublishingTemplateManifest)
 * so the runtime surface can stay stable while the create/import flow evolves.
 *
 * @module @citadelfoundation/kit-publishing/types/starter-catalog
 */
export const SUPPORTED_PUBLISHING_DEPLOY_PRESETS = [
    "none",
    "cloudflare-pages",
];
