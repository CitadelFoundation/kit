/**
 * Portable template metadata for built-in and imported publishing templates.
 *
 * These types are separate from the runtime publishing contracts
 * (PublicationWorkspace, DeployTarget, PublishingTemplateManifest)
 * so the runtime surface can stay stable while the create/import flow evolves.
 *
 * @module @citadelfoundation/kit-publishing/types/starter-catalog
 */
import type { PublicationWorkspaceConfig } from "../workspace.js";
export type { PublicationWorkspaceConfig };
export declare const SUPPORTED_PUBLISHING_DEPLOY_PRESETS: readonly ["none", "cloudflare-pages"];
export type PublishingBuiltInTemplateId = "blank" | "starter" | "publication";
export type PublishingDeployPreset = (typeof SUPPORTED_PUBLISHING_DEPLOY_PRESETS)[number];
export interface PublishingBuiltInTemplateDeployCta {
    readonly preset: Exclude<PublishingDeployPreset, "none">;
    readonly label: string;
    readonly createCommand: string;
}
/** Manifest metadata for a portable kit-publishing template. */
export interface PublishingBuiltInTemplateManifest {
    readonly id: PublishingBuiltInTemplateId;
    readonly label: string;
    readonly summary: string;
    readonly audience: string;
    readonly screenshot: string;
    readonly supportedDeployPresets: readonly PublishingDeployPreset[];
    readonly kitPublishingVersion: string;
}
/** Full catalog entry combining manifest data with gallery-ready fields. */
export interface PublishingBuiltInTemplateCatalogEntry {
    readonly manifest: PublishingBuiltInTemplateManifest;
    readonly createCommand: string;
    readonly runCommand: string;
    readonly deployCtas?: readonly PublishingBuiltInTemplateDeployCta[];
    readonly screenshotDataUrl: string;
}
export type PublishingStarterManifest = PublishingBuiltInTemplateManifest;
export type PublishingStarterCatalogEntry = PublishingBuiltInTemplateCatalogEntry;
