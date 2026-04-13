import type { PublishingBuiltInTemplateId, PublishingDeployPreset, PublishingStarterManifest } from "../types/starter-catalog.js";
export interface ResolvedPortableTemplate {
    readonly root: string;
    readonly workspaceRoot: string;
    readonly manifest: PublishingStarterManifest;
    readonly cleanup?: () => void;
}
export interface ScaffoldPortableTemplateOptions {
    readonly source: ResolvedPortableTemplate;
    readonly targetDir: string;
    readonly projectName: string;
    readonly siteTitle: string;
    readonly packageVersion: string;
    readonly deployPreset: PublishingDeployPreset;
}
declare function isCompatibleKitPublishingVersion(templateVersion: string, packageVersion: string): boolean;
declare function inferSiteTitle(projectName: string): string;
export { inferSiteTitle, isCompatibleKitPublishingVersion };
export declare function readPublishingPackageVersion(): string;
export declare function resolveBuiltInTemplate(templateId: PublishingBuiltInTemplateId, packageVersion: string): ResolvedPortableTemplate;
export declare function resolveImportedTemplate(source: string, packageVersion: string, subdir?: string): ResolvedPortableTemplate;
export declare function scaffoldPortableTemplate(options: ScaffoldPortableTemplateOptions): {
    copiedFileCount: number;
};
