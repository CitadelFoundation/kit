/**
 * File-backed repository for canonical publishing content and local drafts.
 *
 * @module @citadelfoundation/kit-publishing/content/file_content_repository
 */
import type { Result } from "../internal/result.js";
import type { AssetDocument, DocPageDocument, DocSectionDocument, HomepageDocument, NavigationDocument, PageDocument, PostDocument, PublishingDiff, PublishingDraftRecord, PublishingError, PublishingPaths, PublishingRepositorySnapshot, SiteSettingsDocument, TagDocument } from "../types/index.js";
/**
 * Create a resolved publishing workspace layout rooted at `root`.
 */
export declare function createPublishingPaths(root: string, overrides?: Partial<PublishingPaths>): PublishingPaths;
/**
 * Create a file-backed publishing repository.
 */
export declare function createFileContentRepository(paths: PublishingPaths): FileContentRepository;
/**
 * File-backed publishing repository implementation.
 */
export declare class FileContentRepository {
    readonly paths: PublishingPaths;
    /**
     * Create a repository bound to a publishing workspace.
     */
    constructor(paths: PublishingPaths);
    /**
     * Ensure canonical directories and local draft directories exist.
     */
    ensureWorkspace(): Promise<void>;
    /**
     * Load the complete repository snapshot from disk.
     */
    readSnapshot(): Promise<Result<PublishingRepositorySnapshot, PublishingError>>;
    /**
     * Persist a draft record in `.studio/drafts`.
     */
    saveDraft(draftId: string, draft: Omit<PublishingDraftRecord, "draftId" | "savedAt">): Promise<Result<PublishingDraftRecord, PublishingError>>;
    /**
     * Load a draft record from `.studio/drafts`.
     */
    readDraft(draftId: string): Promise<Result<PublishingDraftRecord, PublishingError>>;
    /**
     * Compute the file diff that would be written for a draft.
     */
    renderDraftDiff(draftId: string): Promise<Result<readonly PublishingDiff[], PublishingError>>;
    /**
     * Apply a validated draft to canonical content.
     */
    applyDraft(draftId: string): Promise<Result<readonly PublishingDiff[], PublishingError>>;
    /**
     * Load the site settings singleton with defaults when missing.
     */
    readSiteSettings(): Promise<Result<SiteSettingsDocument, PublishingError>>;
    /**
     * Load the navigation singleton with defaults when missing.
     */
    readNavigation(): Promise<Result<NavigationDocument, PublishingError>>;
    /**
     * Load the homepage singleton with defaults when missing.
     */
    readHomepage(): Promise<Result<HomepageDocument, PublishingError>>;
    /**
     * Load all blog/news posts.
     */
    readPosts(): Promise<Result<readonly PostDocument[], PublishingError>>;
    /**
     * Load all standalone pages.
     */
    readPages(): Promise<Result<readonly PageDocument[], PublishingError>>;
    /**
     * Load all canonical tags.
     */
    readTags(): Promise<Result<readonly TagDocument[], PublishingError>>;
    /**
     * Load all docs sections.
     */
    readDocSections(): Promise<Result<readonly DocSectionDocument[], PublishingError>>;
    /**
     * Load all docs pages.
     */
    readDocPages(): Promise<Result<readonly DocPageDocument[], PublishingError>>;
    /**
     * Load the Git-managed media manifest directly from the media directory.
     */
    readAssets(): Promise<Result<readonly AssetDocument[], PublishingError>>;
    private applyDraftToSnapshot;
    private validateDraftTarget;
    private validateCollectionTarget;
    private prepareDraftDiffs;
    private resolveCanonicalPath;
    private serializeCanonicalDocument;
    private resolveDraftPath;
    private readSingletonDocument;
    private readStructuredCollection;
    private readMarkdownCollection;
    private listFiles;
}
