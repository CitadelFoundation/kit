/**
 * Publishing-native studio shell.
 *
 * @module @citadelfoundation/kit-publishing/studio/components/publishing_studio
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { customElement, property, query, state } from "lit/decorators.js";
import "@citadelfoundation/kit-ui/components/tabs";
import { DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET, publishingStudioPostsBucketForEntry, } from "../browse_state.js";
import { createSignal } from "../../internal/signal.js";
import { PublishingElement, publishingTheme } from "../../internal/ui.js";
import { KitPublishingEditorSurface } from "./publishing_editor_surface.js";
import { KitPublishingContentList, } from "./content/content-list.js";
import { createMarkdownEditorAdapter, } from "../editor_adapter.js";
import { resolvePublishingStudioAssetPreviewPath } from "../host/model.js";
import { createPublishingStudioMachine, eventForWorkflowState, } from "../machines/studio_machine.js";
import { createPublicationSession, createPublicationWorkspace, hasPublicationCapability, } from "../../workspace.js";
void KitPublishingEditorSurface;
void KitPublishingContentList;
const DEFAULT_PUBLICATION_LICENSE_SESSION = {
    enabled: false,
    mode: "disabled",
    evaluation: "disabled",
    sessionState: "disabled",
    grantedBundleIds: [],
    grantedCapabilityIds: [],
    mappedCapabilities: [],
    matchedTierIds: [],
    matchedPartnerIds: [],
    sources: [],
};
const DEFAULT_TRANSIENT_FEEDBACK_DURATION_MS = {
    success: 2200,
    info: 2200,
    warning: 2500,
    error: 3200,
};
const PUBLISHING_STUDIO_POST_BUCKETS = [
    "draft",
    "published",
    "scheduled",
];
let KitPublishingStudio = class KitPublishingStudio extends PublishingElement {
    constructor() {
        super(...arguments);
        this.title = "Publishing Studio";
        this.workspace = createPublicationWorkspace({
            root: "/workspace",
            title: "Local Publication",
        });
        this.workspaceMode = "browse";
        this.browseSurface = "posts";
        this.postsFilter = "all";
        this.entries = [];
        this.media = [];
        this.docSections = [];
        this.tags = [];
        this.documentTitle = "";
        this.documentSlug = "";
        this.documentSummary = "";
        this.documentFeatureImage = "";
        this.documentStatus = "published";
        this.documentPublishedAt = "";
        this.documentTags = "";
        this.documentAuthorName = "";
        this.documentAuthorRole = "";
        this.documentSeoTitle = "";
        this.documentSeoDescription = "";
        this.documentSectionId = "";
        this.selectedRoute = "/";
        this.editorAdapter = createMarkdownEditorAdapter();
        this.editorKind = "lexical";
        this.editorInsertPaletteOpen = false;
        this.contentValue = "";
        this.previewHtml = "";
        this.previewExcerpt = "";
        this.reviewDiffs = [];
        this.validationIssues = [];
        this.workflowState = "draft";
        this.statusMessage = "";
        this.busy = false;
        this.ready = false;
        this.metadataPanelOpen = false;
        this.workspacePanelOpen = false;
        this.browsePanelOpen = false;
        this.accountPopoverOpen = false;
        this.searchOverlayOpen = false;
        this.darkTheme = false;
        this.session = null;
        this.editorContent = createSignal("");
        this.draftDirty = createSignal(false);
        this.editorExternalSyncGeneration = 1;
        this.machineState = createSignal("idle");
        this.entryFilter = createSignal("");
        this.searchOverlayQuery = "";
        this.featureMediaPickerOpen = false;
        this.postsAccessFilter = "all";
        this.pagesAccessFilter = "all";
        this.postsAuthorFilter = "__all_authors__";
        this.pagesAuthorFilter = "__all_authors__";
        this.postsTagFilter = "__all_tags__";
        this.pagesTagFilter = "__all_tags__";
        this.postsSort = "newest";
        this.pagesSort = "newest";
        this.tagEditorDraft = null;
        this.tagDeleteConfirmOpen = false;
        this.activeTagVisibility = "public";
        this.placeholderTitle = "";
        this.siteFallbackState = null;
        this.transientFeedback = null;
        this.transientFeedbackTimer = null;
        this.transientFeedbackRevision = 0;
        this.browseControlSyncFrame = null;
        this.machine = null;
        this.suppressReactiveRequest = false;
        this.handleGlobalPointerDown = (event) => {
            const path = event.composedPath();
            if (this.accountPopoverOpen && !path.includes(this)) {
                this.accountPopoverOpen = false;
            }
            if (this.featureMediaPickerOpen &&
                !path.includes(this.featureMediaEntry ?? this)) {
                this.featureMediaPickerOpen = false;
            }
        };
        this.handleGlobalKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) &&
                !event.shiftKey &&
                !event.altKey &&
                event.key.toLowerCase() === "k" &&
                this.workspaceMode === "browse") {
                event.preventDefault();
                this.openSearchOverlay();
                return;
            }
            if (event.key === "Escape" && this.searchOverlayOpen) {
                event.preventDefault();
                this.closeSearchOverlay();
                return;
            }
            if (event.key === "Escape" && this.featureMediaPickerOpen) {
                event.preventDefault();
                this.featureMediaPickerOpen = false;
                return;
            }
            if (event.key === "Escape" &&
                (this.workspacePanelOpen || this.metadataPanelOpen)) {
                event.preventDefault();
                this.closeInspectorPanels();
                return;
            }
            if (event.key === "Escape" && this.transientFeedback) {
                event.preventDefault();
                this.clearTransientFeedback();
            }
        };
        this.toggleWorkspacePanel = () => {
            const next = !this.workspacePanelOpen;
            this.workspacePanelOpen = next;
            if (next) {
                this.metadataPanelOpen = false;
            }
        };
        this.toggleMetadataPanel = () => {
            const next = !this.metadataPanelOpen;
            this.metadataPanelOpen = next;
            if (next) {
                this.workspacePanelOpen = false;
            }
        };
        this.closeInspectorPanels = () => {
            this.workspacePanelOpen = false;
            this.metadataPanelOpen = false;
        };
        this.toggleFeatureMediaPicker = () => {
            this.featureMediaPickerOpen = !this.featureMediaPickerOpen;
        };
        this.handlePublishingTagSaved = (event) => {
            const detail = event.detail;
            const summary = findPublishingTagSummary(this.entries, detail.tag);
            const nextRecord = createPublishingTagRecord(summary, detail.tag);
            this.tagEditorDraft = { ...nextRecord };
            this.tagDeleteConfirmOpen = false;
            this.activeTagVisibility = nextRecord.visibility;
            this.statusMessage = `Saved ${nextRecord.visibility} tag ${nextRecord.label}.`;
            this.showTransientFeedback({
                type: "success",
                message: `Saved ${nextRecord.visibility} tag ${nextRecord.label}.`,
            });
        };
        this.handlePublishingTagDeleted = (event) => {
            const detail = event.detail;
            this.tagEditorDraft = null;
            this.tagDeleteConfirmOpen = false;
            this.activeTagVisibility = detail.visibility;
            this.statusMessage = `Removed tag ${detail.label || detail.slug}.`;
            this.showTransientFeedback({
                type: "success",
                message: `Removed tag ${detail.label || detail.slug}.`,
            });
        };
        this.unsubscribers = [];
        this.handleEditorChange = (event) => {
            if (event.detail.origin === "external-sync") {
                if (event.detail.editorKind !== "lexical" ||
                    event.detail.syncGeneration !== this.editorExternalSyncGeneration) {
                    return;
                }
                this.editorContent.value = event.detail.value;
                this.draftDirty.value = false;
                return;
            }
            if (!this.canWriteCurrentRoute()) {
                this.reportCapabilityBlock(this.currentWriteBlockMessage());
                return;
            }
            this.applyDraftValue(event.detail.value, {
                emitDraftEvent: true,
                statusMessage: "Draft changed. Preview or review the diff before publish.",
            });
        };
        this.handleEntryFilter = (event) => {
            const target = event.currentTarget;
            this.entryFilter.value = target.value;
        };
        this.handleMetadataInput = (event) => {
            const target = event.currentTarget;
            const field = target.dataset.field;
            if (!field) {
                return;
            }
            if (!this.canWriteCurrentRoute()) {
                this.reportCapabilityBlock(this.currentWriteBlockMessage());
                return;
            }
            this.updateMetadataField(field, target.value);
        };
        this.handleCanvasTitleKeydown = (event) => {
            if (!this.canWriteCurrentRoute()) {
                return;
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
                event.preventDefault();
                const target = event.currentTarget;
                target?.select();
                return;
            }
            if (event.key !== "Enter" && event.key !== "ArrowDown") {
                return;
            }
            event.preventDefault();
            this.editorSurface?.focusEditor();
        };
        this.requestValidation = () => {
            if (!this.hasCapability("content:review:read")) {
                this.reportCapabilityBlock(this.capabilityBlockMessage("content:review:read", "Publish review requires reviewer access."));
                return;
            }
            this.browsePanelOpen = false;
            this.machine?.send({ type: "VALIDATE" });
            this.emitEvent("publishing-request-validate", {
                route: this.selectedRoute,
                value: this.editorContent.value,
            });
        };
        this.requestPreview = () => {
            if (!this.hasCapability("content:preview:read")) {
                this.reportCapabilityBlock(this.capabilityBlockMessage("content:preview:read", "Preview is unavailable in this session."));
                return;
            }
            this.browsePanelOpen = false;
            this.emitEvent("publishing-request-preview", {
                route: this.selectedRoute,
                value: this.editorContent.value,
            });
        };
        this.requestPublishReview = () => {
            if (!this.hasCapability("content:review:read")) {
                this.reportCapabilityBlock(this.capabilityBlockMessage("content:review:read", "Publish review requires reviewer access."));
                return;
            }
            this.browsePanelOpen = false;
            this.emitEvent("publishing-request-review-publish", {
                route: this.selectedRoute,
                value: this.editorContent.value,
            });
        };
        this.requestPublishConfirm = () => {
            if (!this.hasCapability("content:publish:write")) {
                this.reportCapabilityBlock(this.capabilityBlockMessage("content:publish:write", "Publishing requires publisher access."));
                return;
            }
            this.browsePanelOpen = false;
            this.emitEvent("publishing-request-confirm-publish", {
                route: this.selectedRoute,
                value: this.editorContent.value,
            });
        };
        this.handleSearchOverlayInput = (event) => {
            this.searchOverlayQuery = event.currentTarget.value;
        };
        this.handleSearchTrigger = () => {
            this.openSearchOverlay();
        };
        this.restoreFromSiteFallback = () => {
            const fallbackState = this.siteFallbackState;
            if (!fallbackState) {
                this.openBrowseSurface("dashboard");
                return;
            }
            if (fallbackState.returnMode === "browse") {
                this.openBrowseSurface(fallbackState.returnSurface, fallbackState.returnPostsFilter);
                return;
            }
            this.clearSiteFallbackState();
            this.workspaceMode = fallbackState.returnMode;
            this.browsePanelOpen = false;
            this.accountPopoverOpen = false;
            this.closeSearchOverlay();
            this.browseSurface = fallbackState.returnSurface;
        };
        this.handleViewSiteTrigger = () => {
            this.requestOpenSite("rail");
        };
        this.handleWhatsNewTrigger = () => {
            this.openPlaceholderSurface("What's new?", "Release notes and changelog surfaces are not part of first-release publishing parity.");
        };
        this.handleProfileTrigger = () => {
            this.openPlaceholderSurface("Your profile", "Profile management stays consumer-owned until wallet and role flows are finalized.");
        };
        this.handleHelpTrigger = () => {
            this.openPlaceholderSurface("Help center", "Contextual help remains available through docs and the surrounding consumer shell.");
        };
        this.handleResourcesTrigger = () => {
            this.openPlaceholderSurface("Resources & guides", "Resources and guides will land as linked consumer docs, not embedded shell chrome.");
        };
        this.handleTagsTrigger = () => {
            this.openBrowseSurface("tags");
        };
        this.handleMembersTrigger = () => {
            this.openPlaceholderSurface("Members", "Members and role flows remain planned under the wallet and policy track.");
        };
        this.handleStaffTrigger = () => {
            this.openPlaceholderSurface("Staff", "Staff management will map onto publication policy and role surfaces.");
        };
        this.handleNewsletterTrigger = () => {
            this.openPlaceholderSurface("Email newsletter", "Newsletter-specific product surfaces are outside first-release publishing parity.");
        };
        this.handleIntegrationsTrigger = () => {
            this.openPlaceholderSurface("Integrations", "Integrations are part of the consumer and deployment productization track.");
        };
        this.handleCodeInjectionTrigger = () => {
            this.openPlaceholderSurface("Code injection", "Code injection remains consumer-owned and outside canonical authoring scope.");
        };
        this.handleLabsTrigger = () => {
            this.openPlaceholderSurface("Labs", "Experimental surfaces stay behind the productization and verification backlog.");
        };
        this.handleSignOutTrigger = () => {
            this.accountPopoverOpen = false;
            this.closeSearchOverlay();
            this.emitEvent("publishing-sign-out", {
                providerId: this.getActiveSession().providerId,
                principalId: this.getActiveSession().principal.id,
            });
        };
        this.handleCreateTagTrigger = () => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            this.tagEditorDraft = createEmptyPublishingTagRecord(this.activeTagVisibility);
            this.tagDeleteConfirmOpen = false;
            this.statusMessage = `Create a new ${this.activeTagVisibility} tag.`;
        };
        this.closeTagEditor = () => {
            this.tagEditorDraft = null;
            this.tagDeleteConfirmOpen = false;
            this.statusMessage = "Tags collection ready.";
        };
        this.handleTagDraftLabelInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const target = event.currentTarget;
            const nextLabel = target.value;
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            this.updateTagEditorDraft({
                label: nextLabel,
                slug: current.slugEdited ? current.slug : slugForTagLabel(nextLabel),
            });
        };
        this.handleTagDraftSlugInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const target = event.currentTarget;
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            this.updateTagEditorDraft({
                slug: slugForTagLabel(target.value),
                slugEdited: true,
            });
        };
        this.handleTagDraftDescriptionInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const target = event.currentTarget;
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            this.updateTagEditorDraft({
                description: target.value,
            });
        };
        this.handleTagDraftVisibilityChange = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const target = event.currentTarget;
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            const visibility = target.value === "internal" ? "internal" : "public";
            this.updateTagEditorDraft({
                visibility,
            });
            this.activeTagVisibility = visibility;
        };
        this.handleTagDraftColorInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const target = event.currentTarget;
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            this.updateTagEditorDraft({
                color: normalizeTagColor(target.value),
            });
        };
        this.handleTagDraftColorTextInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const target = event.currentTarget;
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            this.updateTagEditorDraft({
                color: normalizeTagColor(target.value),
            });
        };
        this.saveTagEditorDraft = () => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            const normalizedLabel = normalizePublishingTagLabel(current.label) ?? "untitled";
            const existingSlugs = new Set(mergePublishingTagRecords(summarizePublishingTags(this.entries), this.tags)
                .filter((record) => record.id !== current.id)
                .map((record) => record.slug));
            const nextSlug = ensureUniqueTagSlug(current.slug.trim().length > 0
                ? current.slug
                : slugForTagLabel(normalizedLabel), existingSlugs);
            const sourceSlug = (current.sourceSlug ?? current.slug) || nextSlug;
            const nextRecord = {
                ...current,
                label: normalizedLabel,
                slug: nextSlug,
                visibility: current.visibility,
                description: current.description.trim(),
                color: normalizeTagColor(current.color),
                featureImage: current.featureImage.trim(),
                seoTitle: current.seoTitle.trim(),
                seoDescription: current.seoDescription.trim(),
                ogImage: current.ogImage.trim(),
                codeInjectionHead: current.codeInjectionHead,
                codeInjectionFoot: current.codeInjectionFoot,
                sourceSlug,
                slugEdited: current.slugEdited || nextSlug !== slugForTagLabel(normalizedLabel),
            };
            this.activeTagVisibility = nextRecord.visibility;
            this.tagEditorDraft = { ...nextRecord };
            this.tagDeleteConfirmOpen = false;
            this.statusMessage = `Saving ${nextRecord.visibility} tag ${nextRecord.label}…`;
            this.emitEvent("publishing-save-tag", {
                document: documentForPublishingTagRecord(nextRecord),
                sourcePath: sourcePathForTagSlug(nextRecord.sourceSlug ?? nextRecord.slug),
            });
        };
        this.deleteTagEditorDraft = () => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            const current = this.tagEditorDraft;
            if (!current) {
                return;
            }
            if (!this.tagDeleteConfirmOpen) {
                this.tagDeleteConfirmOpen = true;
                this.statusMessage =
                    "Confirm tag deletion to remove the canonical tag document.";
                return;
            }
            const sourceSlug = current.sourceSlug ?? current.slug;
            this.tagDeleteConfirmOpen = false;
            this.statusMessage = `Removing tag ${current.label || sourceSlug}…`;
            this.emitEvent("publishing-delete-tag", {
                document: documentForPublishingTagRecord(current),
                sourcePath: sourcePathForTagSlug(sourceSlug),
            });
        };
        this.cancelTagDelete = () => {
            this.tagDeleteConfirmOpen = false;
            this.statusMessage = "Tag deletion cancelled.";
        };
        this.handleTagDraftFeatureImageChange = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            this.updateTagEditorDraft({
                featureImage: event.currentTarget.value,
            });
        };
        this.handleTagDraftOgImageChange = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            this.updateTagEditorDraft({
                ogImage: event.currentTarget.value,
            });
        };
        this.handleTagDraftSeoTitleInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            this.updateTagEditorDraft({
                seoTitle: event.currentTarget.value,
            });
        };
        this.handleTagDraftSeoDescriptionInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            this.updateTagEditorDraft({
                seoDescription: event.currentTarget.value,
            });
        };
        this.handleTagDraftCodeInjectionHeadInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            this.updateTagEditorDraft({
                codeInjectionHead: event.currentTarget.value,
            });
        };
        this.handleTagDraftCodeInjectionFootInput = (event) => {
            if (!this.ensureTagWriteAccess()) {
                return;
            }
            this.updateTagEditorDraft({
                codeInjectionFoot: event.currentTarget.value,
            });
        };
        this.handleCreateDraftTrigger = (kind) => {
            if (!this.hasCapability("content:draft:write")) {
                this.reportCapabilityBlock(this.capabilityBlockMessage("content:draft:write", "Creating new drafts requires editor access."));
                return;
            }
            this.accountPopoverOpen = false;
            this.closeSearchOverlay();
            this.emitEvent("publishing-create-draft", { kind });
            this.statusMessage =
                kind === "post"
                    ? "Create new post requested."
                    : "Create new page requested.";
        };
        this.handlePostBucketTabChange = (event) => {
            const bucket = PUBLISHING_STUDIO_POST_BUCKETS[event.detail.currentIndex];
            if (!bucket) {
                return;
            }
            this.openBrowseSurface("posts", bucket);
        };
    }
    async getUpdateComplete() {
        const result = await super.getUpdateComplete();
        await Promise.resolve();
        const contentList = this.shadowRoot?.querySelector("kit-publishing-content-list");
        if (contentList?.updateComplete) {
            await contentList.updateComplete;
        }
        const contentTable = contentList?.shadowRoot?.querySelector("kit-table");
        if (contentTable?.updateComplete) {
            await contentTable.updateComplete;
        }
        const bucketTabs = this.shadowRoot?.querySelector("kit-tabs");
        if (bucketTabs?.updateComplete) {
            await bucketTabs.updateComplete;
        }
        return result;
    }
    static { this.styles = [
        PublishingElement.baseSystemStyles,
        publishingTheme,
        css `
      :host {
        display: block;
        min-height: 100vh;
        color: var(--kit-text-primary);
        background: var(--kit-surface-primary);
      }

      :host([dark-theme]) {
        color-scheme: dark;
        --kit-surface-primary: #15171a;
        --kit-surface-secondary: #1f2229;
        --kit-text-primary: #f4f7fb;
        --kit-text-secondary: #a4afc1;
        --kit-border-primary: #303641;
        --kit-color-primary: #e5e7eb;
        --kit-editorial-chrome-surface: rgba(21, 23, 26, 0.92);
        --kit-editorial-chrome-border: rgba(255, 255, 255, 0.08);
        --kit-editorial-muted-text: rgba(164, 175, 193, 0.92);
        --kit-editorial-hover-surface: rgba(255, 255, 255, 0.05);
        background: #15171a;
      }

      .studio-shell {
        display: grid;
        min-height: 100vh;
        box-sizing: border-box;
      }

      .studio-shell[data-rail-visible="true"] {
        grid-template-columns: 20rem minmax(0, 1fr);
        gap: 0;
        padding: 0;
      }

      .studio-shell[data-rail-visible="false"] {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--kit-space-lg);
        padding: var(--kit-space-lg);
      }

      .sidebar-panel,
      .main-panel,
      .inspector-stack {
        display: grid;
        gap: var(--kit-space-md);
        align-content: start;
      }

      .main-panel {
        min-width: 0;
      }

      .transient-feedback-row {
        display: flex;
        justify-content: flex-end;
      }

      .transient-feedback {
        display: inline-flex;
        align-items: center;
        max-width: min(30rem, 100%);
        padding: 0.55rem 0.8rem;
        border-radius: 999px;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 96%,
          transparent
        );
        box-shadow: var(--kit-shadow-sm);
        font-size: var(--kit-font-size-sm);
        line-height: 1.35;
        animation: transient-feedback-enter 140ms ease;
      }

      .transient-feedback[data-tone="success"] {
        border-color: color-mix(in srgb, #16a34a 28%, transparent);
        background: color-mix(
          in srgb,
          #16a34a 12%,
          var(--kit-surface-secondary)
        );
      }

      .transient-feedback[data-tone="info"] {
        border-color: color-mix(in srgb, #0f766e 26%, transparent);
        background: color-mix(
          in srgb,
          #0f766e 10%,
          var(--kit-surface-secondary)
        );
      }

      .transient-feedback[data-tone="warning"] {
        border-color: color-mix(in srgb, #d97706 26%, transparent);
        background: color-mix(
          in srgb,
          #d97706 10%,
          var(--kit-surface-secondary)
        );
      }

      .transient-feedback[data-tone="error"] {
        border-color: color-mix(in srgb, #dc2626 28%, transparent);
        background: color-mix(
          in srgb,
          #dc2626 12%,
          var(--kit-surface-secondary)
        );
      }

      .transient-feedback-message {
        margin: 0;
      }

      .inspector-stack {
        width: min(21rem, 100%);
        max-width: 100%;
        align-self: stretch;
      }

      .main-panel[data-browse-mode="true"] {
        padding: 4.75rem 2.25rem 2.5rem;
      }

      .main-panel[data-write-mode="true"] .inspector-stack {
        position: sticky;
        top: 1.5rem;
        margin-top: 0;
        padding-top: 1.1rem;
      }

      .sidebar-panel {
        position: sticky;
        top: var(--kit-space-lg);
        max-height: calc(100vh - (var(--kit-space-lg) * 2));
        overflow: auto;
        transition:
          opacity 180ms ease,
          transform 180ms ease;
      }

      .sidebar-panel[data-collapsed="true"] {
        max-width: 12.75rem;
        opacity: 0.94;
      }

      .ghost-rail {
        position: sticky;
        top: 0;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        height: 100vh;
        padding: 1.1rem 0.95rem 0.95rem;
        border-right: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 80%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 97%,
          #ffffff 3%
        );
        overflow: hidden;
      }

      .rail-brand {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 0.9rem;
        align-items: center;
      }

      .rail-brand-mark,
      .settings-card-icon,
      .rail-nav-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        flex: 0 0 auto;
      }

      .rail-brand-mark {
        width: 2.6rem;
        height: 2.6rem;
        border: 1px solid #111827;
        background: #111827;
        color: #fff;
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: 0.01em;
      }

      .rail-brand-copy {
        min-width: 0;
      }

      .rail-brand-title {
        display: block;
        overflow: hidden;
        font-size: 1.02rem;
        font-weight: 700;
        line-height: 1.35;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .icon-svg {
        display: block;
        width: 1rem;
        height: 1rem;
        stroke: currentColor;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.8;
      }

      .rail-search-button,
      .rail-nav-button,
      .rail-subnav-button,
      .dock-icon-button,
      .dock-avatar-button,
      .account-popover-button,
      .theme-toggle {
        appearance: none;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
      }

      .rail-search-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 999px;
        color: #3f3f46;
        cursor: pointer;
        transition:
          background 140ms ease,
          color 140ms ease;
      }

      .rail-search-button:hover,
      .dock-icon-button:hover,
      .dock-avatar-button:hover,
      .theme-toggle:hover,
      .account-popover-button:hover {
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 88%,
          transparent
        );
        color: var(--kit-text-primary);
      }

      .rail-body {
        display: grid;
        gap: 1.5rem;
        align-content: start;
      }

      .rail-nav-group {
        display: grid;
        gap: 0.15rem;
      }

      .rail-nav-button,
      .rail-subnav-button {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 0.72rem;
        align-items: center;
        width: 100%;
        min-height: 2.65rem;
        padding: 0.28rem 0.5rem;
        border-radius: 0.8rem;
        cursor: pointer;
        text-align: left;
        color: var(--kit-text-secondary);
        transition:
          background 140ms ease,
          color 140ms ease;
      }

      .rail-nav-button[data-selected="true"],
      .rail-subnav-button[data-selected="true"] {
        background: #f4f5f7;
        color: var(--kit-text-primary);
      }

      .rail-nav-button:hover,
      .rail-subnav-button:hover {
        color: var(--kit-text-primary);
      }

      .rail-nav-icon {
        width: 1.2rem;
        height: 1.2rem;
        color: currentColor;
      }

      .rail-nav-label,
      .rail-subnav-label {
        font-size: 0.96rem;
        font-weight: 500;
        line-height: 1.3;
      }

      .rail-nav-plus {
        font-size: 1.7rem;
        font-weight: 200;
        line-height: 1;
        color: var(--kit-text-secondary);
      }

      .rail-subnav {
        display: grid;
        gap: 0.1rem;
        padding-left: 1.92rem;
      }

      .rail-subnav-button {
        min-height: 2.18rem;
        padding-inline: 0.55rem;
        padding-block: 0.1rem;
        color: var(--kit-text-secondary);
      }

      .rail-subnav-button[data-selected="true"] {
        color: var(--kit-text-primary);
      }

      .rail-spacer {
        flex: 1;
      }

      .session-auth-summary {
        display: grid;
        gap: 0.35rem;
        min-width: 0;
      }

      .session-auth-summary[data-layout="rail"] {
        padding: 0 0.1rem 0.1rem;
      }

      .session-auth-summary[data-layout="status"],
      .session-auth-summary[data-layout="hero"] {
        margin-top: 0.1rem;
      }

      .session-auth-name,
      .session-auth-note {
        margin: 0;
      }

      .session-auth-name {
        font-size: var(--kit-font-size-sm);
        font-weight: 600;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .session-auth-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
      }

      .session-auth-badges[data-layout="popover"] {
        grid-column: 2;
      }

      .session-auth-note {
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
        line-height: 1.4;
        overflow-wrap: anywhere;
      }

      .rail-dock {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 0.55rem;
        align-items: center;
        margin-top: auto;
      }

      .dock-avatar-wrap {
        position: relative;
      }

      .dock-avatar-button,
      .dock-icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 2.55rem;
        border-radius: 999px;
        border: 1px solid #e3e8ef;
        cursor: pointer;
      }

      .dock-avatar-button {
        justify-content: flex-start;
        gap: 0.35rem;
        min-width: 3.3rem;
        padding: 0 0.35rem;
        background: #eef2f7;
      }

      .dock-avatar-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.55rem;
        height: 1.55rem;
        border-radius: 999px;
        background: #1f2937;
        color: #fff;
        font-size: 0.72rem;
        font-weight: 700;
      }

      .dock-avatar-chevron {
        color: #475569;
      }

      .dock-icon-button {
        width: 2.55rem;
        background: #eef2f7;
        color: #475569;
      }

      .theme-toggle {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        width: 3.52rem;
        height: 2rem;
        padding: 0 0.28rem;
        border-radius: 999px;
        border: 1px solid #e3e8ef;
        cursor: pointer;
        background: #eef2f7;
        color: #475569;
      }

      .theme-toggle-thumb {
        position: absolute;
        left: 0.18rem;
        width: 1.62rem;
        height: 1.62rem;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.18);
        transform: translateX(0);
        transition: transform 160ms ease;
      }

      .theme-toggle[data-dark="true"] .theme-toggle-thumb {
        transform: translateX(1.18rem);
      }

      .theme-toggle-icon {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.2rem;
        height: 1.2rem;
        color: inherit;
      }

      .theme-toggle[data-dark="false"] .theme-toggle-icon[data-tone="light"] {
        color: #111827;
      }

      .theme-toggle[data-dark="false"] .theme-toggle-icon[data-tone="dark"] {
        color: #64748b;
      }

      .theme-toggle[data-dark="true"] .theme-toggle-icon[data-tone="light"] {
        color: #64748b;
      }

      .theme-toggle[data-dark="true"] .theme-toggle-icon[data-tone="dark"] {
        color: #111827;
      }

      .account-popover {
        position: absolute;
        left: 0;
        bottom: calc(100% + 0.82rem);
        z-index: 5;
        display: grid;
        min-width: 15.25rem;
        padding: 0;
        border: 1px solid #e6e8eb;
        border-radius: 0.85rem;
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 99%,
          #ffffff 1%
        );
        box-shadow: 0 16px 34px rgb(15 23 42 / 0.14);
        overflow: hidden;
      }

      .account-popover-header,
      .account-popover-section {
        display: grid;
      }

      .account-popover-header {
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.2rem 0.75rem;
        align-items: center;
        padding: 0.9rem 1rem;
        border-bottom: 1px solid #edf0f2;
      }

      .account-popover-title,
      .account-popover-copy,
      .settings-card-copy {
        margin: 0;
      }

      .account-popover-avatar {
        grid-row: 1 / span 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.35rem;
        height: 2.35rem;
        border-radius: 999px;
        background: linear-gradient(145deg, #171717, #4b5563);
        color: #fff;
        font-size: 0.76rem;
        font-weight: 700;
      }

      .account-popover-title {
        font-size: 0.98rem;
        line-height: 1.2;
      }

      .account-popover-copy {
        color: var(--kit-text-secondary);
        font-size: 0.86rem;
      }

      .account-popover-section {
        padding: 0.25rem 0;
        border-top: 1px solid #edf0f2;
      }

      .account-popover-button {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        width: 100%;
        min-height: 2.7rem;
        padding: 0 1rem;
        cursor: pointer;
      }

      .account-popover-button[data-accent="true"]::after {
        content: "";
        margin-left: auto;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: #22c55e;
      }

      .search-overlay-backdrop {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 7rem 1.5rem 2rem;
        background: rgb(15 23 42 / 0.24);
        backdrop-filter: blur(4px);
      }

      .search-overlay-dialog {
        width: min(34.5rem, calc(100vw - 3rem));
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        border-radius: 1rem;
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 99%,
          #ffffff 1%
        );
        box-shadow: 0 22px 60px rgb(15 23 42 / 0.24);
        overflow: hidden;
      }

      .search-overlay-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 3.85rem;
        padding: 0 0.8rem;
        border-bottom: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 76%, transparent);
      }

      .search-overlay-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        color: var(--kit-text-secondary);
      }

      .search-overlay-input {
        flex: 1;
        border: 0;
        outline: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 1rem;
      }

      .search-overlay-hint {
        padding: 0.15rem 1.1rem 0.8rem;
        color: var(--kit-text-secondary);
        font-size: 0.8rem;
        text-align: right;
      }

      .search-overlay-results {
        display: grid;
        gap: 0;
        max-height: min(24rem, 55vh);
        margin: 0;
        padding: 0.35rem 0;
        overflow: auto;
        list-style: none;
      }

      .search-overlay-empty {
        padding: 0.25rem 1.1rem 1.2rem;
        color: var(--kit-text-secondary);
        font-size: 0.9rem;
      }

      .search-overlay-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.85rem;
        align-items: center;
        width: 100%;
        min-height: 3.35rem;
        padding: 0.6rem 1.1rem;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .search-overlay-item:hover,
      .search-overlay-item:focus-visible {
        outline: 0;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
      }

      .search-overlay-copy {
        display: grid;
        gap: 0.18rem;
      }

      .search-overlay-title {
        font-size: 0.97rem;
        font-weight: 600;
        line-height: 1.3;
      }

      .search-overlay-detail {
        color: var(--kit-text-secondary);
        font-size: 0.82rem;
        line-height: 1.35;
      }

      .search-overlay-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 3.25rem;
        min-height: 1.65rem;
        padding: 0 0.55rem;
        border-radius: 999px;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        color: var(--kit-text-secondary);
        font-size: 0.74rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      .browse-surface {
        display: grid;
        gap: 1.6rem;
        align-content: start;
      }

      .dashboard-surface {
        gap: 1.2rem;
      }

      .placeholder-surface {
        display: grid;
        gap: 1rem;
        align-content: start;
      }

      .site-fallback-surface {
        display: grid;
        gap: 1rem;
        align-content: start;
      }

      .placeholder-copy {
        margin: 0;
        max-width: 58ch;
        color: var(--kit-text-secondary);
      }

      .site-target-list {
        display: grid;
        gap: 0.75rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .site-target-list li {
        display: grid;
        gap: 0.2rem;
      }

      .browse-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .browse-heading {
        margin: 0;
        font-size: 1.95rem;
        line-height: 2.5rem;
        font-weight: 700;
      }

      .browse-kicker {
        margin: 0 0 0.4rem;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .collection-create-button,
      .filter-chip,
      .settings-card {
        appearance: none;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 95%,
          transparent
        );
        color: inherit;
        font: inherit;
      }

      .collection-create-button {
        min-height: 2rem;
        padding: 0 0.95rem;
        border-radius: 0.4rem;
        cursor: pointer;
        font-size: var(--kit-font-size-sm);
        font-weight: 600;
        border-color: #111827;
        background: #111827;
        color: white;
      }

      .collection-create-button:disabled {
        cursor: not-allowed;
        opacity: 0.48;
      }

      .collection-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .collection-bucket-tabs-control {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
      }

      .filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-height: 1.5rem;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: var(--kit-text-secondary);
      }

      .filter-chip[data-active="true"] {
        color: var(--kit-text-primary);
      }

      .filter-chip-select {
        appearance: none;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        padding: 0;
        padding-right: 0.2rem;
      }

      .filter-chip-prefix {
        white-space: nowrap;
      }

      .filter-chip-caret {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 0.9rem;
        height: 0.9rem;
        color: var(--kit-text-secondary);
      }

      .collection-table {
        display: grid;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 72%, transparent);
      }

      .collection-table-head,
      .collection-row {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr) minmax(6rem, 0.22fr) minmax(6rem, 0.22fr)
          auto;
        gap: 0.75rem;
        align-items: center;
      }

      .collection-table[data-surface="pages"] .collection-table-head,
      .collection-table[data-surface="pages"] .collection-row {
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .collection-table-head {
        min-height: 1.9rem;
        color: var(--kit-text-secondary);
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .collection-rows {
        display: grid;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .collection-row-shell {
        display: grid;
        width: 100%;
        box-sizing: border-box;
        min-height: auto;
        padding: 0.75rem 0;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 70%, transparent);
        cursor: pointer;
        outline: none;
      }

      .collection-empty-row {
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 70%, transparent);
      }

      .collection-empty-state {
        display: grid;
        gap: 0.45rem;
        max-width: 26rem;
        padding: 1rem 0;
      }

      .collection-empty-title {
        margin: 0;
        color: var(--kit-text-primary);
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.25;
      }

      .collection-empty-copy {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: 0.86rem;
        line-height: 1.45;
      }

      .collection-empty-action {
        justify-self: start;
        margin-top: 0.1rem;
      }

      .collection-row-shell:hover,
      .collection-row-shell:focus-within {
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 28%,
          transparent
        );
      }

      .collection-row-shell:focus-visible {
        outline: 2px solid
          color-mix(in srgb, var(--kit-brand-primary) 45%, transparent);
        outline-offset: -2px;
      }

      .collection-row-primary,
      .settings-card-body {
        display: grid;
        gap: 0.12rem;
      }

      .collection-row-title {
        margin: 0;
        font-size: 1rem;
        line-height: 1.28;
        font-weight: 700;
        color: var(--kit-text-primary);
      }

      .collection-row-meta,
      .collection-row-secondary,
      .collection-row-age,
      .collection-row-copy {
        color: var(--kit-text-secondary);
        font-size: 0.8rem;
        line-height: 1.2;
      }

      .collection-row-meta {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
      }

      .collection-row-meta-copy {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .collection-row-primary-tag {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 8rem;
        padding: 0.15rem 0.45rem;
        border-radius: 999px;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 80%,
          transparent
        );
        color: var(--kit-text-primary);
        font-size: 0.68rem;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .collection-row-author-avatar-fallback,
      .collection-row-author-avatar-image {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        flex: 0 0 auto;
      }

      .collection-row-author-avatar-fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: color-mix(
          in srgb,
          var(--kit-border-primary) 72%,
          transparent
        );
        color: var(--kit-text-primary);
        font-size: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .collection-row-author-avatar-image {
        display: block;
        object-fit: cover;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 72%,
          transparent
        );
      }

      .collection-row-secondary,
      .collection-row-age,
      .collection-row-copy {
        text-align: left;
        display: flex;
        align-items: center;
        min-height: 1.5rem;
      }

      .collection-row-trailing,
      .collection-row-trailing-actions {
        display: inline-flex;
        align-items: center;
        min-width: 0;
      }

      .collection-row-trailing {
        justify-self: end;
        gap: 0.65rem;
      }

      .collection-row-trailing-actions {
        gap: 0.45rem;
      }

      .collection-row-action {
        all: unset;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 1.5rem;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
        color: var(--kit-text-secondary);
        font-size: 0.76rem;
        font-weight: 600;
        line-height: 1.1;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transform: translateY(2px);
        transition:
          opacity 160ms ease,
          transform 160ms ease,
          color 160ms ease,
          background 160ms ease;
      }

      .collection-row-shell:is(:hover, :focus-within) .collection-row-action,
      .collection-row-action:focus-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      .collection-row-action:hover,
      .collection-row-action:focus-visible {
        color: var(--kit-text-primary);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 76%,
          transparent
        );
      }

      .collection-row-action:focus-visible {
        outline: 2px solid
          color-mix(in srgb, var(--kit-brand-primary) 40%, transparent);
        outline-offset: 2px;
      }

      .collection-table[data-surface="pages"] .collection-table-head-extra,
      .collection-table[data-surface="pages"] .collection-row-secondary,
      .collection-table[data-surface="pages"] .collection-row-age {
        display: none;
      }

      .collection-status {
        justify-self: end;
      }

      .tag-surface-toolbar,
      .tag-surface-tabs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.55rem;
      }

      .tag-surface-toolbar {
        justify-content: space-between;
      }

      .tag-surface-tab {
        appearance: none;
        min-height: 2rem;
        padding: 0 0.9rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        border-radius: 0.35rem;
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 96%,
          transparent
        );
        color: var(--kit-text-secondary);
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
      }

      .tag-surface-tab[data-active="true"] {
        color: var(--kit-text-primary);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 72%,
          #ffffff 28%
        );
      }

      .tag-management-table {
        display: grid;
        margin-top: 0.9rem;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 72%, transparent);
      }

      .tag-management-head,
      .tag-management-row {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr) minmax(10rem, 0.42fr) minmax(8rem, 0.3fr)
          auto;
        gap: 1rem;
        align-items: center;
      }

      .tag-management-head {
        min-height: 2.15rem;
        color: var(--kit-text-secondary);
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .tag-management-rows {
        display: grid;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .tag-management-button {
        all: unset;
        display: grid;
        width: 100%;
        box-sizing: border-box;
        min-height: auto;
        padding: 1rem 0;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 70%, transparent);
        cursor: pointer;
      }

      .tag-management-button:hover .tag-management-title,
      .tag-management-button:focus-visible .tag-management-title {
        color: color-mix(in srgb, var(--kit-color-primary) 60%, #111827 40%);
      }

      .tag-management-button:focus-visible {
        outline: 2px solid
          color-mix(in srgb, var(--kit-brand-primary) 40%, transparent);
        outline-offset: 3px;
      }

      .tag-management-primary {
        display: grid;
        gap: 0.08rem;
        min-width: 0;
      }

      .tag-management-title {
        margin: 0;
        font-size: 1rem;
        line-height: 1.28;
        font-weight: 700;
        color: var(--kit-text-primary);
      }

      .tag-management-meta,
      .tag-management-slug,
      .tag-management-count {
        color: var(--kit-text-secondary);
        font-size: 0.8rem;
        line-height: 1.2;
      }

      .tag-management-meta,
      .tag-management-slug {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tag-management-count {
        text-align: left;
      }

      .tag-management-chevron {
        justify-self: end;
        color: var(--kit-text-secondary);
      }

      .tag-editor-layout {
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(0, 1fr) minmax(15rem, 17rem);
        align-items: start;
      }

      .tag-editor-stack,
      .tag-editor-form,
      .tag-editor-sidebar,
      .tag-editor-field-list,
      .tag-editor-sidebar-copy,
      .tag-editor-usage-grid {
        display: grid;
        gap: 0.85rem;
        align-content: start;
      }

      .tag-editor-field {
        display: grid;
        gap: 0.35rem;
      }

      .tag-editor-label {
        color: var(--kit-text-secondary);
        font-size: 0.72rem;
        line-height: 1.2;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .tag-editor-input,
      .tag-editor-textarea,
      .tag-editor-select {
        width: 100%;
        box-sizing: border-box;
        min-height: 2.35rem;
        padding: 0.62rem 0.72rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: 0.3rem;
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 98%,
          transparent
        );
        color: var(--kit-text-primary);
        font: inherit;
      }

      .tag-editor-textarea {
        min-height: 6.2rem;
        resize: vertical;
      }

      .tag-editor-meta,
      .tag-editor-counter {
        color: var(--kit-text-secondary);
        font-size: 0.74rem;
        line-height: 1.35;
      }

      .tag-editor-counter {
        font-weight: 600;
      }

      .tag-editor-color-row {
        display: grid;
        gap: 0.65rem;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
      }

      .tag-editor-color-input {
        appearance: none;
        width: 2.5rem;
        height: 2.35rem;
        padding: 0;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: 0.3rem;
        background: transparent;
        cursor: pointer;
      }

      .tag-editor-preview {
        display: grid;
        gap: 0.75rem;
        padding: 0.9rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 74%, transparent);
        border-radius: 0.45rem;
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 98%,
          transparent
        );
      }

      .tag-editor-preview-title {
        margin: 0;
        font-size: 1rem;
        line-height: 1.2;
        font-weight: 700;
        color: var(--kit-text-primary);
      }

      .tag-editor-preview-slug,
      .tag-editor-sidebar-copy p {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: 0.8rem;
        line-height: 1.35;
      }

      .tag-editor-image-preview {
        display: grid;
        gap: 0.55rem;
        align-items: center;
        grid-template-columns: auto minmax(0, 1fr);
        color: var(--kit-text-secondary);
        font-size: 0.8rem;
      }

      .tag-editor-image-thumb,
      .tag-editor-preview-image {
        width: 100%;
        max-width: 9rem;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        border-radius: 0.45rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 72%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 92%,
          transparent
        );
      }

      .tag-editor-image-thumb {
        width: 4.5rem;
      }

      .settings-group {
        display: grid;
        gap: 1rem;
        padding-top: 0.55rem;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 72%, transparent);
      }

      .dashboard-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(0, 1.7fr) minmax(17rem, 0.75fr);
        align-items: start;
      }

      .dashboard-main-column,
      .dashboard-side-column {
        display: grid;
        gap: 1rem;
        align-content: start;
      }

      .dashboard-panel {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 80%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 96%,
          transparent
        );
        border-radius: 0.45rem;
      }

      .dashboard-panel-header,
      .dashboard-metric-meta {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 1rem;
      }

      .dashboard-panel-title,
      .dashboard-action-title,
      .dashboard-activity-title,
      .dashboard-mini-card-title {
        margin: 0;
        font-weight: 700;
        color: var(--kit-text-primary);
      }

      .dashboard-panel-title {
        font-size: 1.35rem;
        line-height: 1.75rem;
      }

      .dashboard-panel-support,
      .dashboard-action-copy,
      .dashboard-metric-note,
      .dashboard-mini-card-copy,
      .dashboard-activity-detail,
      .dashboard-panel-context {
        margin: 0;
        color: var(--kit-text-secondary);
      }

      .dashboard-panel-support,
      .dashboard-action-copy,
      .dashboard-mini-card-copy,
      .dashboard-activity-detail {
        font-size: 0.84rem;
        line-height: 1.4;
      }

      .dashboard-panel-context,
      .dashboard-metric-label,
      .dashboard-activity-meta {
        font-size: 0.74rem;
        line-height: 1.35;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .dashboard-summary-layout {
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(0, 1fr) minmax(12.5rem, 14rem);
        align-items: stretch;
      }

      .dashboard-chart {
        position: relative;
        min-height: 11rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 74%, transparent);
        border-radius: 0.95rem;
        background:
          linear-gradient(
            to top,
            color-mix(in srgb, var(--kit-border-primary) 26%, transparent) 0,
            color-mix(in srgb, var(--kit-border-primary) 26%, transparent) 1px,
            transparent 1px,
            transparent 100%
          ),
          repeating-linear-gradient(
            to right,
            transparent 0,
            transparent 19%,
            color-mix(in srgb, var(--kit-border-primary) 20%, transparent) 19%,
            color-mix(in srgb, var(--kit-border-primary) 20%, transparent)
              calc(19% + 1px)
          );
        overflow: hidden;
      }

      .dashboard-chart::before {
        content: "";
        position: absolute;
        inset: auto 12% 14% 12%;
        height: 2px;
        border-radius: 999px;
        background: #38bdf8;
        box-shadow: 6.5rem -3rem 0 0 #38bdf8;
      }

      .dashboard-chart::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          color-mix(in srgb, #38bdf8 14%, transparent) 0%,
          transparent 42%
        );
        pointer-events: none;
      }

      .dashboard-summary-metrics {
        display: grid;
        gap: 0.9rem;
        align-content: start;
      }

      .dashboard-metric {
        display: grid;
        gap: 0.25rem;
      }

      .dashboard-metric-value {
        font-size: 2rem;
        line-height: 2.3rem;
        font-weight: 700;
        color: var(--kit-text-primary);
      }

      .dashboard-metric-note {
        font-size: 0.78rem;
        line-height: 1.3;
      }

      .dashboard-action-grid {
        display: grid;
        gap: 0;
      }

      .dashboard-lower-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .dashboard-action-card {
        appearance: none;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.9rem;
        align-items: start;
        padding: 0.85rem 0;
        border: 0;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 70%, transparent);
        background: transparent;
        text-align: left;
        cursor: pointer;
      }

      .dashboard-action-card:disabled {
        cursor: not-allowed;
        opacity: 0.52;
      }

      .dashboard-action-card:first-child {
        border-top: 0;
        padding-top: 0;
      }

      .dashboard-action-card:last-child {
        padding-bottom: 0;
      }

      .dashboard-action-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.85rem;
        height: 1.85rem;
        border-radius: 0.45rem;
        color: white;
      }

      .dashboard-action-icon[data-tone="pink"] {
        background: #ec4899;
      }

      .dashboard-action-icon[data-tone="green"] {
        background: #22c55e;
      }

      .dashboard-action-title,
      .dashboard-mini-card-title,
      .dashboard-activity-title {
        font-size: 1rem;
        line-height: 1.35;
      }

      .dashboard-action-button,
      .dashboard-mini-action,
      .dashboard-activity-button {
        appearance: none;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
      }

      .dashboard-action-button,
      .dashboard-mini-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.2rem;
        padding: 0 0.9rem;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        border-radius: 0.4rem;
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 96%,
          transparent
        );
        cursor: pointer;
        font-size: var(--kit-font-size-sm);
        font-weight: 600;
      }

      .dashboard-inline-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      .dashboard-activity-list {
        display: grid;
        gap: 0;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .dashboard-activity-item {
        display: grid;
        gap: 0;
        padding: 0.8rem 0;
        border-bottom: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 70%, transparent);
      }

      .dashboard-activity-item:last-child {
        padding-bottom: 0.1rem;
        border-bottom: 0;
      }

      .dashboard-activity-button {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.2rem 0.85rem;
        cursor: pointer;
        padding: 0;
      }

      .dashboard-activity-copy {
        display: grid;
        gap: 0.18rem;
        min-width: 0;
      }

      .dashboard-activity-date {
        color: var(--kit-text-secondary);
        font-size: 0.78rem;
        line-height: 1.35;
        white-space: nowrap;
      }

      .dashboard-activity-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        grid-column: 1;
        justify-content: flex-start;
      }

      .settings-grid {
        display: grid;
        gap: 1.1rem 2rem;
        grid-template-columns: repeat(3, minmax(19rem, 20rem));
        justify-content: start;
      }

      .settings-card {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 1rem;
        align-items: center;
        min-height: 4.5rem;
        padding: 0.15rem 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        cursor: pointer;
        text-align: left;
      }

      .settings-card-icon {
        width: 3rem;
        height: 3rem;
        color: white;
      }

      .settings-card-icon[data-tone="amber"] {
        background: #f59e0b;
      }

      .settings-card-icon[data-tone="blue"] {
        background: #0ea5e9;
      }

      .settings-card-icon[data-tone="pink"] {
        background: #ec4899;
      }

      .settings-card-icon[data-tone="green"] {
        background: #22c55e;
      }

      .settings-card-title {
        margin: 0;
        font-size: 1rem;
        line-height: 1.35;
        font-weight: 600;
      }

      .settings-card-copy {
        color: var(--kit-text-secondary);
        font-size: 0.82rem;
        line-height: 1.45;
      }

      .card {
        display: grid;
        gap: var(--kit-space-md);
        padding: var(--kit-space-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 92%,
          #94a3b8 8%
        );
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        border-radius: var(--kit-radius-lg);
        box-shadow: var(--kit-shadow-sm);
      }

      .hero-card {
        grid-template-columns: minmax(0, 1fr);
        align-items: start;
      }

      .collapsed-rail {
        gap: var(--kit-space-sm);
      }

      .collapsed-rail-title {
        margin: 0;
        font-weight: 600;
      }

      .eyebrow {
        margin: 0 0 var(--kit-space-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-xs);
      }

      .hero-card h1,
      .section-title {
        margin: 0;
      }

      .hero-copy p,
      .section-copy,
      .entry-route,
      .entry-description,
      .meta-hint {
        margin: 0;
        color: var(--kit-text-secondary);
      }

      .hero-actions,
      .status-row,
      .entry-meta,
      .summary-grid,
      .diff-header,
      .write-status-meta,
      .write-status-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--kit-space-sm);
        align-items: center;
      }

      .summary-grid {
        gap: var(--kit-space-xs);
      }

      .hero-actions {
        justify-content: flex-start;
      }

      .status-chip,
      .entry-badge,
      .summary-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 90%,
          transparent
        );
        font-size: var(--kit-font-size-xs);
      }

      .status-chip[data-tone="ready"],
      .entry-badge[data-tone="published"] {
        border-color: color-mix(in srgb, #16a34a 26%, transparent);
        background: color-mix(
          in srgb,
          #16a34a 14%,
          var(--kit-surface-secondary)
        );
      }

      .status-chip[data-tone="blocked"],
      .entry-badge[data-tone="draft"] {
        border-color: rgba(226, 17, 95, 0.1);
        color: #e2115f;
        background: #fcebf1;
      }

      .status-chip[data-tone="error"] {
        border-color: color-mix(in srgb, #dc2626 28%, transparent);
        background: color-mix(
          in srgb,
          #dc2626 12%,
          var(--kit-surface-secondary)
        );
      }

      .action-button,
      .entry-button {
        font: inherit;
        color: inherit;
      }

      .action-button {
        appearance: none;
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 82%, transparent);
        border-radius: var(--kit-radius-md);
        padding: 0.75rem 0.95rem;
        cursor: pointer;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 94%,
          transparent
        );
        transition:
          transform 120ms ease,
          border-color 120ms ease,
          background 120ms ease;
      }

      .action-button:hover:enabled,
      .entry-button:hover {
        transform: translateY(-1px);
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 35%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 10%,
          var(--kit-surface-secondary)
        );
      }

      .action-button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .action-button[data-variant="primary"] {
        color: #ffffff;
        background: #15171a;
        border-color: #15171a;
      }

      .action-button[data-variant="primary"]:hover:enabled {
        color: #ffffff;
        background: #2a2c30;
        border-color: #2a2c30;
      }

      .action-button[data-variant="success"] {
        border-color: color-mix(in srgb, #16a34a 34%, transparent);
        background: color-mix(
          in srgb,
          #16a34a 14%,
          var(--kit-surface-secondary)
        );
      }

      .action-button[data-variant="quiet"] {
        padding-inline: 0.8rem;
        background: transparent;
      }

      @keyframes transient-feedback-enter {
        from {
          opacity: 0;
          transform: translateY(-0.2rem);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .field-grid {
        display: grid;
        gap: var(--kit-space-sm);
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .editor-canvas {
        display: grid;
        gap: calc(var(--kit-space-lg) + 0.25rem);
        width: min(calc(var(--kit-editorial-measure) + 3rem), 100%);
        margin-inline: auto;
      }

      .canvas-header {
        display: grid;
        gap: calc(var(--kit-space-md) + 0.25rem);
        padding: 0;
      }

      .feature-media-entry {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.85rem;
        justify-content: space-between;
      }

      .feature-media-button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.48rem 0.78rem;
        border: 1px solid var(--kit-editorial-muted-border);
        border-radius: var(--kit-radius-full);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 92%,
          transparent
        );
        color: color-mix(in srgb, var(--kit-text-secondary) 88%, transparent);
        font: inherit;
        font-size: var(--kit-font-size-sm);
        font-weight: 600;
        cursor: pointer;
        transition:
          color 140ms ease,
          border-color 140ms ease,
          background 140ms ease;
      }

      .feature-media-button:hover:enabled {
        color: var(--kit-text-primary);
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 16%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 5%,
          var(--kit-surface-primary)
        );
      }

      .feature-media-button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .feature-media-plus {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.1rem;
        height: 1.1rem;
        border-radius: 999px;
        border: 1px solid var(--kit-editorial-muted-border);
        font-size: 0.9rem;
        line-height: 1;
      }

      .feature-media-current {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
        padding: 0.34rem 0.62rem 0.34rem 0.34rem;
        border-radius: calc(var(--kit-radius-md) + 0.18rem);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 90%,
          transparent
        );
        border: 1px solid var(--kit-editorial-muted-border);
      }

      .feature-media-thumb {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: var(--kit-radius-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 80%, transparent);
        object-fit: cover;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 90%,
          transparent
        );
      }

      .feature-media-picker {
        position: absolute;
        top: calc(100% + 0.85rem);
        left: 0;
        z-index: 16;
        display: grid;
        gap: 0.85rem;
        width: min(22rem, 100%);
        padding: 0.9rem 1rem;
        border: 1px solid var(--kit-editorial-muted-border);
        border-radius: var(--kit-radius-lg);
        background: var(--kit-editorial-overlay-surface);
        box-shadow: var(--kit-editorial-overlay-shadow);
        backdrop-filter: blur(14px);
      }

      .feature-media-picker-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }

      .feature-media-empty {
        margin: 0;
        color: var(--kit-text-secondary);
        font-size: var(--kit-font-size-sm);
      }

      .canvas-title-input {
        width: 100%;
        padding: 0;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--kit-text-primary);
        font: 600 clamp(3rem, 6vw, 4.45rem) / 1.03
          var(--kit-font-family-editor, Georgia, serif);
        letter-spacing: -0.03em;
        max-width: min(18ch, 100%);
      }

      .canvas-title-input::placeholder {
        color: color-mix(in srgb, var(--kit-text-secondary) 68%, transparent);
      }

      .canvas-copy {
        margin: 0;
        max-width: 60ch;
        color: var(--kit-text-secondary);
      }

      .metadata-form {
        display: grid;
        gap: var(--kit-space-sm);
      }

      .metadata-panel {
        display: grid;
        gap: 0;
        min-height: 100%;
        padding: 1.15rem 1.2rem 1.35rem;
        box-sizing: border-box;
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 88%,
          transparent
        );
        border: 1px solid var(--kit-editorial-muted-border);
        border-radius: calc(var(--kit-radius-lg) + 0.15rem);
        box-shadow: 0 18px 40px
          color-mix(in srgb, var(--kit-text-primary) 8%, transparent);
      }

      .metadata-panel-header {
        display: grid;
        padding-bottom: 0.95rem;
      }

      .metadata-panel-title {
        margin: 0;
        font-size: 1.15rem;
        line-height: 1.25;
      }

      .metadata-panel-section {
        display: grid;
        gap: 0.75rem;
        padding: 0.95rem 0;
        border-top: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 74%, transparent);
      }

      .metadata-panel-section:first-of-type {
        border-top: 0;
        padding-top: 0;
      }

      .metadata-panel-kicker {
        margin: 0;
        color: var(--kit-text-primary);
        font-size: 0.95rem;
        line-height: 1.35;
        font-weight: 600;
      }

      .metadata-panel-link {
        display: grid;
        gap: 0.45rem;
      }

      .metadata-panel-link-prefix {
        color: var(--kit-text-secondary);
        font-size: 0.82rem;
        line-height: 1.4;
      }

      .metadata-field {
        display: grid;
        gap: 0.4rem;
      }

      .metadata-field[data-span="full"] {
        grid-column: 1 / -1;
      }

      .metadata-label {
        font-size: var(--kit-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kit-text-secondary);
      }

      .metadata-input,
      .metadata-textarea,
      .metadata-select {
        width: 100%;
        box-sizing: border-box;
        padding: 0.7rem 0.8rem;
        color: var(--kit-text-primary);
        background: var(--kit-surface-primary);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        font: inherit;
      }

      .metadata-textarea {
        min-height: 5.75rem;
        resize: vertical;
      }

      .metadata-input[type="checkbox"] {
        width: auto;
        justify-self: start;
        min-height: 1.1rem;
        padding: 0;
        border: 0;
        background: transparent;
        accent-color: color-mix(
          in srgb,
          var(--kit-color-primary) 72%,
          #0f172a 28%
        );
      }

      .workspace {
        display: grid;
        gap: var(--kit-space-lg);
        grid-template-columns: minmax(0, 1fr);
      }

      .write-status-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.95rem 1.25rem;
        padding: 0.55rem 0 1rem;
        border-bottom: 1px solid var(--kit-editorial-chrome-border);
      }

      .write-status-bar[data-has-inspector="true"] {
        padding-right: calc(22.75rem + 1rem);
      }

      .write-status-info {
        display: grid;
        gap: 0.32rem;
        min-width: 0;
      }

      .write-status-kicker {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.55rem;
        min-width: 0;
      }

      .write-breadcrumb {
        appearance: none;
        padding: 0;
        border: 0;
        background: transparent;
        color: color-mix(in srgb, var(--kit-text-secondary) 82%, transparent);
        font: inherit;
        font-size: var(--kit-font-size-sm);
        font-weight: 600;
        cursor: pointer;
      }

      .write-breadcrumb:hover {
        color: var(--kit-text-primary);
      }

      .write-breadcrumb[data-static="true"] {
        cursor: default;
      }

      .write-breadcrumb[data-static="true"]:hover {
        color: color-mix(in srgb, var(--kit-text-secondary) 82%, transparent);
      }

      .write-status-separator {
        color: color-mix(in srgb, var(--kit-text-secondary) 50%, transparent);
      }

      .write-status-route {
        min-width: 0;
        color: var(--kit-text-primary);
        font-size: 0.96rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .write-status-message {
        margin: 0;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-xs);
        overflow-wrap: anywhere;
      }

      .write-status-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 0.55rem;
      }

      .write-status-actions .action-button {
        padding: 0.55rem 0.78rem;
      }

      .write-status-bar[data-ghost-editor="true"] {
        min-height: 2.8rem;
        padding-bottom: 0.35rem;
        border-bottom: 0;
      }

      .write-status-bar[data-ghost-editor="true"][data-has-inspector="true"] {
        padding-right: 22.75rem;
      }

      .ghost-editor-empty-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
      }

      .ghost-editor-crumbs {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        min-width: 0;
      }

      .ghost-editor-actions {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
      }

      .ghost-editor-link,
      .ghost-editor-workspace,
      .ghost-editor-settings {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }

      .ghost-editor-link {
        font-size: 0.98rem;
        font-weight: 600;
      }

      .ghost-editor-label {
        color: var(--kit-text-secondary);
        font-size: 0.92rem;
        font-weight: 600;
      }

      .ghost-editor-settings {
        justify-content: center;
        color: var(--kit-text-secondary);
      }

      .ghost-editor-workspace,
      .ghost-editor-settings {
        padding: 0.28rem 0.56rem;
        border-radius: var(--kit-radius-full);
        color: var(--kit-editorial-muted-text);
      }

      .ghost-editor-workspace:hover,
      .ghost-editor-settings:hover {
        color: var(--kit-text-primary);
        background: var(--kit-editorial-hover-surface);
      }

      .workspace-panel {
        gap: 0;
      }

      .workspace-panel-copy {
        margin: 0;
        color: var(--kit-editorial-muted-text);
        font-size: var(--kit-font-size-sm);
        line-height: 1.5;
      }

      .workspace-target-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }

      .workspace-target-item {
        display: grid;
        gap: 0.2rem;
        padding: 0.72rem 0.78rem;
        border: 1px solid var(--kit-editorial-chrome-border);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-editorial-chrome-surface) 100%,
          transparent
        );
      }

      .workspace[data-has-inspector="true"] {
        grid-template-columns: minmax(0, 1fr) minmax(18rem, 21rem);
        gap: 1.75rem;
      }

      .editor-canvas[data-structured="false"] {
        gap: var(--kit-space-lg);
        padding-top: 1.5rem;
        padding-bottom: 2rem;
      }

      .editor-canvas[data-structured="false"] .canvas-header {
        gap: 1rem;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
      }

      .preview-frame,
      .diff-frame {
        display: grid;
        gap: var(--kit-space-sm);
        min-height: 10rem;
        padding: var(--kit-space-md);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-lg);
        background: color-mix(
          in srgb,
          var(--kit-surface-primary) 95%,
          transparent
        );
        overflow: auto;
      }

      .preview-frame :is(h1, h2, h3) {
        margin: 0 0 var(--kit-space-sm);
      }

      .editor-column {
        min-width: 0;
      }

      .preview-frame p,
      .preview-frame ul,
      .preview-frame ol,
      .preview-frame pre {
        margin: 0 0 var(--kit-space-sm);
      }

      .diff-list,
      .entry-list,
      .media-list,
      .issue-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: var(--kit-space-sm);
      }

      .entry-button {
        all: unset;
        display: grid;
        gap: 0.35rem;
        padding: var(--kit-space-sm);
        border-radius: var(--kit-radius-md);
        border: 1px solid transparent;
        cursor: pointer;
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 88%,
          transparent
        );
      }

      .entry-button[data-selected="true"] {
        border-color: color-mix(
          in srgb,
          var(--kit-color-primary) 35%,
          transparent
        );
        background: color-mix(
          in srgb,
          var(--kit-color-primary) 10%,
          var(--kit-surface-secondary)
        );
      }

      .entry-route {
        font-size: var(--kit-font-size-sm);
      }

      .search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.75rem 0.8rem;
        color: var(--kit-text-primary);
        background: var(--kit-surface-primary);
        border: 1px solid
          color-mix(in srgb, var(--kit-border-primary) 84%, transparent);
        border-radius: var(--kit-radius-md);
        font: inherit;
      }

      .diff-grid {
        display: grid;
        gap: var(--kit-space-md);
      }

      .diff-columns {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--kit-space-sm);
      }

      .diff-code {
        margin: 0;
        padding: var(--kit-space-sm);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 88%,
          transparent
        );
        color: var(--kit-text-primary);
        font: 0.88rem/1.55
          var(--kit-font-family-mono, "JetBrains Mono", monospace);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .empty-state {
        color: var(--kit-text-secondary);
        font-style: italic;
      }

      .media-list li,
      .issue-list li {
        padding: var(--kit-space-sm);
        border-radius: var(--kit-radius-md);
        background: color-mix(
          in srgb,
          var(--kit-surface-secondary) 86%,
          transparent
        );
      }

      .issue-list li {
        border: 1px solid color-mix(in srgb, #f59e0b 28%, transparent);
      }

      @media (max-width: 1180px) {
        .workspace,
        .hero-card,
        .settings-grid,
        .dashboard-grid,
        .dashboard-summary-layout,
        .dashboard-action-grid,
        .dashboard-lower-grid,
        .tag-editor-layout {
          grid-template-columns: 1fr;
        }

        .tag-management-head,
        .tag-management-row {
          grid-template-columns:
            minmax(0, 1fr) minmax(8rem, 0.5fr) minmax(7rem, 0.34fr)
            auto;
        }

        .studio-shell[data-rail-visible="true"] {
          grid-template-columns: 1fr;
        }

        .ghost-rail {
          position: relative;
          height: auto;
          border-right: 0;
          border-bottom: 1px solid
            color-mix(in srgb, var(--kit-border-primary) 80%, transparent);
        }

        .main-panel[data-browse-mode="true"] {
          padding: 2rem var(--kit-space-lg);
        }

        .field-grid,
        .diff-columns,
        .collection-table-head,
        .collection-row {
          grid-template-columns: 1fr;
        }

        .write-status-bar[data-has-inspector="true"],
        .write-status-bar[data-ghost-editor="true"][data-has-inspector="true"] {
          padding-right: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .action-button,
        .sidebar-panel,
        .transient-feedback {
          transition: none;
          animation: none;
        }
      }
    `,
    ]; }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("pointerdown", this.handleGlobalPointerDown);
        window.addEventListener("keydown", this.handleGlobalKeyDown);
        this.addEventListener("publishing-tag-saved", this.handlePublishingTagSaved);
        this.addEventListener("publishing-tag-deleted", this.handlePublishingTagDeleted);
        this.editorContent.value = this.contentValue;
        this.unsubscribers.push(this.editorContent.subscribe(() => this.requestReactiveUpdate()), this.draftDirty.subscribe(() => this.requestReactiveUpdate()), this.machineState.subscribe(() => this.requestReactiveUpdate()), this.entryFilter.subscribe(() => this.requestReactiveUpdate()), () => this.removeEventListener("publishing-tag-saved", this.handlePublishingTagSaved), () => this.removeEventListener("publishing-tag-deleted", this.handlePublishingTagDeleted));
        void this.initializeMachine();
    }
    disconnectedCallback() {
        window.removeEventListener("pointerdown", this.handleGlobalPointerDown);
        window.removeEventListener("keydown", this.handleGlobalKeyDown);
        this.clearTransientFeedback();
        if (this.browseControlSyncFrame !== null) {
            cancelAnimationFrame(this.browseControlSyncFrame);
            this.browseControlSyncFrame = null;
        }
        for (const unsubscribe of this.unsubscribers.splice(0)) {
            unsubscribe();
        }
        this.machine?.dispose();
        this.machine = null;
        super.disconnectedCallback();
    }
    willUpdate(changedProperties) {
        const selectedRouteChanged = changedProperties.has("selectedRoute");
        const selectedRoutePreviousValue = changedProperties.get("selectedRoute");
        const selectedRouteTransitioned = selectedRouteChanged &&
            selectedRoutePreviousValue !== undefined &&
            selectedRoutePreviousValue !== this.selectedRoute;
        const contentValueChanged = changedProperties.has("contentValue");
        const contentValueDiffers = this.contentValue !== this.editorContent.value;
        if (selectedRouteChanged || (contentValueChanged && contentValueDiffers)) {
            this.syncReactiveState(() => {
                this.editorContent.value = this.contentValue;
                this.draftDirty.value = false;
            });
        }
        if (selectedRouteTransitioned) {
            this.resetRouteScopedState("draft");
        }
        if (selectedRouteChanged || (contentValueChanged && contentValueDiffers)) {
            this.editorExternalSyncGeneration += 1;
        }
        if (changedProperties.has("workflowState")) {
            this.syncReactiveState(() => {
                this.synchronizeWorkflowState(this.workflowState);
            });
        }
        if (selectedRouteTransitioned) {
            this.featureMediaPickerOpen = false;
        }
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        this.synchronizeBrowseCollectionControls();
        this.scheduleBrowseCollectionControlSync();
    }
    renderContent() {
        const currentState = this.machineState.value;
        const selectedEntry = this.getSelectedEntry();
        const filteredEntries = this.filterEntries(this.entries, this.entryFilter.value);
        const siteEntries = filteredEntries.filter((entry) => ["homepage", "site_settings", "navigation"].includes(entry.kind));
        const postEntries = filteredEntries.filter((entry) => entry.kind === "post");
        const docEntries = filteredEntries.filter((entry) => entry.kind === "doc_page");
        const showMetadataEditor = selectedEntry?.kind === "post" || selectedEntry?.kind === "doc_page";
        const showStructuredEditor = selectedEntry?.kind === "homepage" ||
            selectedEntry?.kind === "site_settings" ||
            selectedEntry?.kind === "navigation";
        const canConfirmPublish = this.reviewDiffs.length > 0 &&
            currentState === "publish-confirmation" &&
            !this.busy;
        const mode = this.workspaceMode;
        const browseVisible = mode === "browse" || this.browsePanelOpen;
        const canWriteCurrentRoute = this.canWriteCurrentRoute();
        const canPreview = this.hasCapability("content:preview:read");
        const canReview = this.hasCapability("content:review:read");
        const canPublish = this.hasCapability("content:publish:write");
        const previewTitle = selectedEntry?.title ||
            this.documentTitle ||
            this.workspace.profile.title;
        const showHeroCopy = mode !== "write";
        const inspectorVisible = mode === "write" &&
            (this.workspacePanelOpen ||
                (showMetadataEditor && this.metadataPanelOpen));
        const railVisible = mode === "browse";
        return html `
      <section
        class="studio-shell"
        data-rail-visible=${railVisible ? "true" : "false"}
      >
        ${railVisible
            ? html `
              ${this.renderGhostRail(siteEntries, postEntries, docEntries)}
            `
            : null}

        <div
          class="main-panel"
          data-browse-mode=${railVisible ? "true" : "false"}
          data-write-mode=${mode === "write" ? "true" : "false"}
        >
          ${this.renderTransientFeedback()}
          ${railVisible
            ? this.renderBrowseSurface(siteEntries, postEntries, docEntries)
            : mode === "write"
                ? this.renderWriteStatusBar(currentState, selectedEntry, showMetadataEditor, inspectorVisible, canWriteCurrentRoute, browseVisible, canPreview, canReview, canConfirmPublish, canPublish)
                : html `
                  <section class="card hero-card">
                    ${showHeroCopy
                    ? html `
                          <div class="hero-copy">
                            <p class="eyebrow">
                              ${this.workspace.profile.brand}
                            </p>
                            <h1>${selectedEntry?.title ?? this.title}</h1>
                            <p>
                              ${this.statusMessage.length > 0
                        ? this.statusMessage
                        : "Editor-first drafting with staged preview, review, and publish for Git-tracked content."}
                            </p>
                            <div class="status-row">
                              <span class="status-chip" data-tone="ready"
                                >${labelForWorkspaceMode(mode)}</span
                              >
                              <span class="summary-pill"
                                >${labelForWorkflowState(currentState)}</span
                              >
                            </div>
                            ${this.renderSessionAuthSummary("hero")}
                          </div>
                        `
                    : null}
                    <div class="hero-actions">
                      ${!browseVisible
                    ? html `
                            <button
                              class="action-button"
                              aria-label="Browse content"
                              data-variant="quiet"
                              @click=${() => {
                        this.openBrowseSurfaceForCurrentRoute();
                    }}
                              type="button"
                            >
                              Browse content
                            </button>
                          `
                    : null}
                      <button
                        class="action-button"
                        aria-label="Show write mode"
                        @click=${() => {
                    this.workspaceMode = "write";
                    this.browsePanelOpen = false;
                }}
                        type="button"
                      >
                        Write
                      </button>
                      <button
                        class="action-button"
                        aria-label="Preview current draft"
                        data-action="preview"
                        data-variant="default"
                        ?disabled=${this.busy || !canPreview}
                        @click=${this.requestPreview}
                        type="button"
                      >
                        Preview
                      </button>
                      <button
                        class="action-button"
                        aria-label="Review publish diff"
                        data-action="review-publish"
                        data-variant=${mode === "preview"
                    ? "primary"
                    : "default"}
                        ?disabled=${this.busy || !canReview}
                        @click=${this.requestPublishReview}
                        type="button"
                      >
                        Review Publish
                      </button>
                      ${canConfirmPublish
                    ? html `
                            <button
                              class="action-button"
                              aria-label="Confirm publish current draft"
                              data-action="confirm-publish"
                              data-variant="success"
                              ?disabled=${!canPublish}
                              @click=${this.requestPublishConfirm}
                              type="button"
                            >
                              Confirm Publish
                            </button>
                          `
                    : null}
                    </div>
                  </section>
                `}
          ${railVisible
            ? null
            : html `
                <section
                  class="workspace"
                  data-has-inspector=${inspectorVisible ? "true" : "false"}
                >
                  <div class="editor-column">
                    ${mode === "preview"
                ? this.renderPreviewSurface(previewTitle)
                : mode === "review"
                    ? this.renderReviewSurface()
                    : mode === "publish"
                        ? this.renderPublishSurface()
                        : this.renderWriteSurface(selectedEntry, showMetadataEditor, showStructuredEditor, canWriteCurrentRoute)}
                  </div>

                  ${inspectorVisible
                ? html `
                        <div class="inspector-stack">
                          ${this.workspacePanelOpen
                    ? this.renderWorkspacePanel()
                    : null}
                          ${showMetadataEditor && this.metadataPanelOpen
                    ? this.renderMetadataPanel(selectedEntry)
                    : null}
                        </div>
                      `
                : null}
                </section>
              `}
        </div>

        ${railVisible && this.searchOverlayOpen
            ? this.renderSearchOverlay()
            : null}
      </section>
    `;
    }
    renderGhostRail(_siteEntries, _postEntries, _docEntries) {
        const session = this.getActiveSession();
        const principal = session.principal;
        return html `
      <aside
        class="sidebar-panel ghost-rail"
        aria-label="Ghost publishing navigation"
        data-parity-region="rail"
      >
        <div class="rail-brand">
          <span class="rail-brand-mark" aria-hidden="true"
            >${publicationBrandInitial(this.workspace.profile.title)}</span
          >
          <div class="rail-brand-copy">
            <span class="rail-brand-title"
              >${this.workspace.profile.title}</span
            >
          </div>
          <button
            class="rail-search-button"
            aria-label="Search site"
            type="button"
            @click=${this.handleSearchTrigger}
          >
            ${renderGhostShellIcon("search")}
          </button>
        </div>

        <div class="rail-body">
          <div class="rail-nav-group">
            <button
              class="rail-nav-button"
              data-selected=${this.browseSurface === "dashboard"
            ? "true"
            : "false"}
              type="button"
              @click=${() => this.openBrowseSurface("dashboard")}
            >
              <span class="rail-nav-icon" aria-hidden="true"
                >${renderGhostShellIcon("dashboard")}</span
              >
              <span class="rail-nav-label">Dashboard</span>
              <span></span>
            </button>
            <button
              class="rail-nav-button"
              data-selected=${this.browseSurface === "site" ? "true" : "false"}
              type="button"
              @click=${this.handleViewSiteTrigger}
            >
              <span class="rail-nav-icon" aria-hidden="true"
                >${renderGhostShellIcon("external")}</span
              >
              <span class="rail-nav-label">View site</span>
              <span></span>
            </button>
          </div>

          <div class="rail-nav-group">
            <button
              class="rail-nav-button"
              data-selected=${this.browseSurface === "posts" ? "true" : "false"}
              type="button"
              @click=${() => this.openBrowseSurface("posts")}
            >
              <span class="rail-nav-icon" aria-hidden="true"
                >${renderGhostShellIcon("posts")}</span
              >
              <span class="rail-nav-label">Posts</span>
              <span class="rail-nav-plus">+</span>
            </button>
            <div class="rail-subnav">
              ${this.renderRailSubnavButton("Drafts", "draft")}
              ${this.renderRailSubnavButton("Scheduled", "scheduled")}
              ${this.renderRailSubnavButton("Published", "published")}
            </div>
          </div>

          <div class="rail-nav-group">
            <button
              class="rail-nav-button"
              data-selected=${this.browseSurface === "pages" ? "true" : "false"}
              type="button"
              @click=${() => this.openBrowseSurface("pages")}
            >
              <span class="rail-nav-icon" aria-hidden="true"
                >${renderGhostShellIcon("pages")}</span
              >
              <span class="rail-nav-label">Pages</span>
              <span></span>
            </button>
            <button
              class="rail-nav-button"
              data-selected=${this.browseSurface === "tags" ? "true" : "false"}
              type="button"
              @click=${this.handleTagsTrigger}
            >
              <span class="rail-nav-icon" aria-hidden="true"
                >${renderGhostShellIcon("tags")}</span
              >
              <span class="rail-nav-label">Tags</span>
              <span></span>
            </button>
            <button
              class="rail-nav-button"
              data-selected=${this.browseSurface === "placeholder" &&
            this.placeholderTitle === "Members"
            ? "true"
            : "false"}
              type="button"
              @click=${this.handleMembersTrigger}
            >
              <span class="rail-nav-icon" aria-hidden="true"
                >${renderGhostShellIcon("members")}</span
              >
              <span class="rail-nav-label">Members</span>
              <span class="summary-pill"
                >${Math.max(this.workspace.policy.identityProviders.length, 3)}</span
              >
            </button>
          </div>
        </div>

        <div class="rail-spacer"></div>

        ${this.renderSessionAuthSummary("rail")}

        <div class="rail-dock">
          <div class="dock-avatar-wrap">
            <button
              class="dock-avatar-button"
              aria-label=${this.accountPopoverOpen
            ? "Hide account menu"
            : "Show account menu"}
              type="button"
              @click=${() => {
            this.accountPopoverOpen = !this.accountPopoverOpen;
        }}
            >
              <span class="dock-avatar-chip"
                >${initialsForLabel(principal.displayName)}</span
              >
              <span class="dock-avatar-chevron" aria-hidden="true">
                ${renderGhostShellIcon("chevron-down")}
              </span>
            </button>
            ${this.accountPopoverOpen ? this.renderAccountPopover() : null}
          </div>

          <button
            class="dock-icon-button"
            aria-label="Open settings hub"
            type="button"
            @click=${() => this.openBrowseSurface("settings")}
          >
            ${renderGhostShellIcon("settings")}
          </button>

          <button
            class="theme-toggle"
            aria-label="Toggle dark theme"
            aria-pressed=${this.darkTheme ? "true" : "false"}
            data-dark=${this.darkTheme ? "true" : "false"}
            type="button"
            @click=${() => {
            this.darkTheme = !this.darkTheme;
            this.accountPopoverOpen = false;
        }}
          >
            <span
              class="theme-toggle-icon"
              data-tone="light"
              aria-hidden="true"
            >
              ${renderGhostShellIcon("theme-sun")}
            </span>
            <span class="theme-toggle-thumb"></span>
            <span class="theme-toggle-icon" data-tone="dark" aria-hidden="true">
              ${renderGhostShellIcon("theme-moon")}
            </span>
          </button>
        </div>
      </aside>
    `;
    }
    renderRailSubnavButton(label, filter) {
        return html `
      <button
        class="rail-subnav-button"
        data-selected=${this.browseSurface === "posts" &&
            this.postsFilter === filter
            ? "true"
            : "false"}
        type="button"
        @click=${() => this.openBrowseSurface("posts", filter)}
      >
        <span class="rail-subnav-label">${label}</span>
      </button>
    `;
    }
    renderAccountPopover() {
        const session = this.getActiveSession();
        const principal = session.principal;
        return html `
      <section class="account-popover" aria-label="Account menu">
        <div class="account-popover-header">
          <span class="account-popover-avatar"
            >${initialsForLabel(principal.displayName)}</span
          >
          <h3 class="account-popover-title">${principal.displayName}</h3>
          <p class="account-popover-copy">${principal.id}</p>
          ${this.renderSessionAccessBadges("popover")}
        </div>
        <div class="account-popover-section">
          <button
            class="account-popover-button"
            data-accent="true"
            type="button"
            @click=${this.handleWhatsNewTrigger}
          >
            What's new?
          </button>
          <button
            class="account-popover-button"
            type="button"
            @click=${this.handleProfileTrigger}
          >
            Your profile
          </button>
        </div>
        <div class="account-popover-section">
          <button
            class="account-popover-button"
            type="button"
            @click=${this.handleHelpTrigger}
          >
            Help center
          </button>
          <button
            class="account-popover-button"
            type="button"
            @click=${this.handleResourcesTrigger}
          >
            Resources & guides
          </button>
        </div>
        <div class="account-popover-section">
          <button
            class="account-popover-button"
            type="button"
            @click=${this.handleSignOutTrigger}
          >
            Sign out
          </button>
        </div>
      </section>
    `;
    }
    renderSearchOverlay() {
        const options = this.getQuickOpenOptions();
        const hasQuery = this.searchOverlayQuery.trim().length > 0;
        return html `
      <div
        class="search-overlay-backdrop"
        @click=${() => {
            this.closeSearchOverlay();
        }}
      >
        <section
          class="search-overlay-dialog"
          aria-label="Quick-open"
          data-parity-region="quick-open-dialog"
          role="dialog"
          aria-modal="true"
          @click=${(event) => {
            event.stopPropagation();
        }}
        >
          <div class="search-overlay-header">
            <span class="search-overlay-icon" aria-hidden="true">
              ${renderGhostShellIcon("search")}
            </span>
            <input
              name="quick-search"
              aria-label="Quick-open search"
              class="search-overlay-input"
              .value=${this.searchOverlayQuery}
              @input=${this.handleSearchOverlayInput}
              placeholder="Search site"
              type="text"
            />
          </div>

          ${hasQuery
            ? html `
                ${options.length > 0
                ? html `
                      <ul class="search-overlay-results">
                        ${options.map((option) => html `
                            <li>
                              <button
                                class="search-overlay-item"
                                aria-label=${`${option.title} ${option.detail}`}
                                type="button"
                                @click=${() => {
                    option.onSelect();
                    this.closeSearchOverlay();
                }}
                              >
                                <span class="search-overlay-copy">
                                  <span class="search-overlay-title"
                                    >${option.title}</span
                                  >
                                  <span class="search-overlay-detail"
                                    >${option.detail}</span
                                  >
                                </span>
                                <span class="search-overlay-badge"
                                  >${option.badge}</span
                                >
                              </button>
                            </li>
                          `)}
                      </ul>
                    `
                : html `
                      <p class="search-overlay-empty">
                        No matching pages, posts, or studio actions.
                      </p>
                    `}
              `
            : html ` <p class="search-overlay-hint">Open with Ctrl/⌘ + K</p> `}
        </section>
      </div>
    `;
    }
    renderBrowseSurface(siteEntries, postEntries, docEntries) {
        if (this.browseSurface === "placeholder") {
            return this.renderPlaceholderSurface();
        }
        if (this.browseSurface === "site") {
            return this.renderSiteFallbackSurface();
        }
        if (this.browseSurface === "dashboard") {
            return this.renderDashboardSurface(siteEntries, postEntries, docEntries);
        }
        if (this.browseSurface === "settings") {
            return this.renderSettingsHub(siteEntries);
        }
        if (this.browseSurface === "tags") {
            return this.renderTagsSurface([...postEntries, ...docEntries]);
        }
        if (this.browseSurface === "pages") {
            const filteredDocEntries = this.filterEntriesByTag(this.filterEntriesByAuthor(this.filterEntriesByAccess(docEntries, this.pagesAccessFilter), this.pagesAuthorFilter), this.pagesTagFilter);
            const visibleDocEntries = this.sortCollectionEntries(filteredDocEntries, this.pagesSort);
            return this.renderCollectionSurface({
                surface: "pages",
                title: "Pages",
                entries: visibleDocEntries,
                createLabel: "New page",
                emptyState: this.buildCollectionEmptyState({
                    surface: "pages",
                    scopedEntries: docEntries,
                    visibleEntries: visibleDocEntries,
                }),
                primaryFilter: {
                    activeValue: "all",
                    options: [{ value: "all", label: "All pages" }],
                },
                accessFilter: {
                    activeValue: this.pagesAccessFilter,
                    options: collectionAccessFilterOptions,
                    onChange: (value) => {
                        if (isGhostAccessFilter(value)) {
                            this.pagesAccessFilter = value;
                        }
                    },
                },
                authorFilter: {
                    activeValue: this.pagesAuthorFilter,
                    options: this.buildAuthorFilterOptions(docEntries),
                    onChange: (value) => {
                        this.pagesAuthorFilter = value;
                    },
                },
                tagFilter: {
                    activeValue: this.pagesTagFilter,
                    options: this.buildTagFilterOptions(docEntries),
                    onChange: (value) => {
                        this.pagesTagFilter = value;
                    },
                },
                sortFilter: {
                    activeValue: this.pagesSort,
                    options: collectionSortOptions,
                    onChange: (value) => {
                        if (isGhostCollectionSort(value)) {
                            this.pagesSort = value;
                        }
                    },
                },
            });
        }
        const scopedPostEntries = this.filterPostEntries(postEntries);
        const allPostEntriesAfterSecondaryFilters = this.filterEntriesByTag(this.filterEntriesByAuthor(this.filterEntriesByAccess(postEntries, this.postsAccessFilter), this.postsAuthorFilter), this.postsTagFilter);
        const visiblePostEntries = this.sortCollectionEntries(this.filterEntriesByTag(this.filterEntriesByAuthor(this.filterEntriesByAccess(scopedPostEntries, this.postsAccessFilter), this.postsAuthorFilter), this.postsTagFilter), this.postsSort);
        const bucketTabs = this.buildPostBucketTabs(allPostEntriesAfterSecondaryFilters);
        return this.renderCollectionSurface({
            surface: "posts",
            title: "Posts",
            entries: visiblePostEntries,
            createLabel: "New post",
            emptyState: this.buildCollectionEmptyState({
                surface: "posts",
                scopedEntries: scopedPostEntries,
                visibleEntries: visiblePostEntries,
            }),
            bucketTabs: bucketTabs,
            primaryFilter: {
                activeValue: this.postsFilter,
                options: PUBLISHING_STUDIO_POST_BUCKETS.map((bucket) => ({
                    value: bucket,
                    label: this.labelForPostBucket(bucket),
                })),
                onChange: (value) => {
                    if (isGhostPostFilter(value) && value !== "all") {
                        this.openBrowseSurface("posts", value);
                    }
                },
            },
            accessFilter: {
                activeValue: this.postsAccessFilter,
                options: collectionAccessFilterOptions,
                onChange: (value) => {
                    if (isGhostAccessFilter(value)) {
                        this.postsAccessFilter = value;
                    }
                },
            },
            authorFilter: {
                activeValue: this.postsAuthorFilter,
                options: this.buildAuthorFilterOptions(postEntries),
                onChange: (value) => {
                    this.postsAuthorFilter = value;
                },
            },
            tagFilter: {
                activeValue: this.postsTagFilter,
                options: this.buildTagFilterOptions(postEntries),
                onChange: (value) => {
                    this.postsTagFilter = value;
                },
            },
            sortFilter: {
                activeValue: this.postsSort,
                options: collectionSortOptions,
                onChange: (value) => {
                    if (isGhostCollectionSort(value)) {
                        this.postsSort = value;
                    }
                },
            },
        });
    }
    renderPlaceholderSurface() {
        return html `
      <section
        class="browse-surface placeholder-surface"
        aria-label=${`${this.placeholderTitle} placeholder`}
      >
        <header class="browse-header">
          <div>
            <p class="browse-kicker">Unavailable Surface</p>
            <h1 class="browse-heading">${this.placeholderTitle}</h1>
          </div>
        </header>

        <section class="card">
          <p class="section-title">This surface is not shipped yet.</p>
          <p class="placeholder-copy">
            ${this.statusMessage.length > 0
            ? this.statusMessage
            : "The requested shell action does not have a first-class local surface yet."}
          </p>
          <div class="hero-actions">
            <button
              class="action-button"
              type="button"
              @click=${() => {
            this.openBrowseSurface("posts");
        }}
            >
              Back to posts
            </button>
            <button
              class="action-button"
              data-variant="quiet"
              type="button"
              @click=${() => {
            this.openBrowseSurface("settings");
        }}
            >
              Open settings hub
            </button>
          </div>
        </section>
      </section>
    `;
    }
    renderSiteFallbackSurface() {
        const canonicalSiteUrl = this.workspace.profile.canonicalSiteUrl?.trim() ?? "";
        const returnLabel = this.siteFallbackState?.returnMode === "write"
            ? "Return to editor"
            : "Return to previous context";
        return html `
      <section
        class="browse-surface site-fallback-surface"
        aria-label="View site fallback"
      >
        <header class="browse-header">
          <div>
            <p class="browse-kicker">Site Access</p>
            <h1 class="browse-heading">View site</h1>
          </div>
        </header>

        <section class="card">
          <p class="section-title">Site destination unavailable</p>
          <p class="section-copy">
            ${this.statusMessage.length > 0
            ? this.statusMessage
            : "Configure a canonical site URL or deploy target URL before opening the consumer site."}
          </p>
          <div class="summary-grid">
            <span class="summary-pill">
              Canonical URL:
              ${canonicalSiteUrl.length > 0
            ? canonicalSiteUrl
            : "Not configured"}
            </span>
            <span class="summary-pill">
              Deploy targets: ${String(this.workspace.deployTargets.length)}
            </span>
          </div>
          ${this.workspace.deployTargets.length > 0
            ? html `
                <ul class="site-target-list">
                  ${this.workspace.deployTargets.map((target) => html `
                      <li>
                        <strong>${target.label}</strong>
                        <span class="entry-route">
                          ${target.url?.trim().length
                ? target.url.trim()
                : "URL not configured"}
                        </span>
                        <span class="entry-description">
                          ${target.provider}${target.projectName
                ? ` · ${target.projectName}`
                : ""}
                        </span>
                      </li>
                    `)}
                </ul>
              `
            : null}
          <div class="hero-actions">
            <button
              class="action-button"
              type="button"
              @click=${this.restoreFromSiteFallback}
            >
              ${returnLabel}
            </button>
            <button
              class="action-button"
              data-variant="quiet"
              type="button"
              @click=${() => {
            this.openBrowseSurface("settings");
        }}
            >
              Open settings hub
            </button>
          </div>
        </section>
      </section>
    `;
    }
    renderTransientFeedback() {
        if (!this.transientFeedback) {
            return null;
        }
        return html `
      <div class="transient-feedback-row">
        <div
          class="transient-feedback"
          data-tone=${this.transientFeedback.type}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p class="transient-feedback-message">
            ${this.transientFeedback.message}
          </p>
        </div>
      </div>
    `;
    }
    renderTagsSurface(entries) {
        const tagRecords = mergePublishingTagRecords(summarizePublishingTags(entries), this.tags);
        const publicTags = tagRecords.filter((tag) => tag.visibility === "public");
        const internalTags = tagRecords.filter((tag) => tag.visibility === "internal");
        const visibleTags = this.activeTagVisibility === "internal" ? internalTags : publicTags;
        const canManageTags = this.hasCapability("content:draft:write");
        if (this.tagEditorDraft) {
            return this.renderTagEditorSurface(tagRecords);
        }
        return html `
      <section
        class="browse-surface"
        aria-label="Tags collection"
        data-parity-surface="tags"
      >
        <header class="browse-header">
          <div>
            <h1 class="browse-heading">Tags</h1>
          </div>
          <div class="tag-surface-toolbar">
            <div
              class="tag-surface-tabs"
              role="tablist"
              aria-label="Tag visibility"
            >
              <button
                class="tag-surface-tab"
                type="button"
                @click=${() => {
            this.activeTagVisibility = "public";
        }}
              >
                Public tags
              </button>
              <button
                class="tag-surface-tab"
                type="button"
                @click=${() => {
            this.activeTagVisibility = "internal";
        }}
              >
                Internal tags
              </button>
            </div>
            <button
              class="collection-create-button"
              ?disabled=${!canManageTags}
              type="button"
              @click=${this.handleCreateTagTrigger}
            >
              New tag
            </button>
          </div>
        </header>

        <section class="tag-management-table" aria-label="Tags table">
          <div class="tag-management-head" aria-hidden="true">
            <span>Tag</span>
            <span>Slug</span>
            <span>Assignments</span>
            <span></span>
          </div>

          <ul class="tag-management-rows">
            ${visibleTags.length > 0
            ? visibleTags.map((tag) => this.renderTagManagementRow(tag))
            : html `
                  <li class="empty-state">
                    ${this.activeTagVisibility === "internal"
                ? "Internal tags use a leading # prefix and are currently unassigned."
                : "No public tags are assigned yet. Add tags from post or page settings to populate this surface."}
                  </li>
                `}
          </ul>
        </section>
      </section>
    `;
    }
    renderTagManagementRow(tag) {
        const tagLabel = tag.visibility === "internal" ? `#${tag.label}` : tag.label;
        const assignmentCount = tag.uses;
        const countLabel = `${assignmentCount} item${assignmentCount === 1 ? "" : "s"}`;
        const scopeLabel = [
            tag.postCount > 0 ? `Posts ${tag.postCount}` : null,
            tag.pageCount > 0 ? `Pages ${tag.pageCount}` : null,
        ]
            .filter((value) => value !== null)
            .join(" • ");
        return html `
      <li>
        <button
          class="tag-management-button"
          aria-label=${`Open ${tagLabel} tag`}
          type="button"
          @click=${() => {
            this.openTagEditor(tag);
        }}
        >
          <div class="tag-management-row">
            <div class="tag-management-primary">
              <p class="tag-management-title">${tagLabel}</p>
              <span class="tag-management-meta">
                ${scopeLabel.length > 0
            ? `${scopeLabel} • `
            : ""}${assignmentCount}
                assignment${assignmentCount === 1
            ? ""
            : "s"}${tag.lastPublishedAt
            ? ` • Last used ${formatDateLabel(tag.lastPublishedAt)}`
            : ""}
              </span>
            </div>
            <span class="tag-management-slug">${tag.slug}</span>
            <span class="tag-management-count">${countLabel}</span>
            <span class="tag-management-chevron" aria-hidden="true">
              ${renderGhostShellIcon("chevron-right")}
            </span>
          </div>
        </button>
      </li>
    `;
    }
    renderTagEditorSurface(tagRecords) {
        const draft = this.tagEditorDraft;
        if (!draft) {
            return html ``;
        }
        const canManageTags = this.hasCapability("content:draft:write");
        const isExisting = typeof draft.sourceSlug === "string";
        const displayLabel = draft.label.trim().length > 0
            ? draft.visibility === "internal"
                ? `#${draft.label.trim()}`
                : draft.label.trim()
            : isExisting
                ? "Untitled tag"
                : "New tag";
        const otherSlugs = new Set(tagRecords
            .filter((record) => record.id !== draft.id)
            .map((record) => record.slug));
        const normalizedDraftSlug = ensureUniqueTagSlug(draft.slug.trim().length > 0 ? draft.slug : slugForTagLabel(draft.label), otherSlugs);
        const mediaOptions = this.getFeatureMediaOptions();
        const featureImageAsset = mediaOptions.find((asset) => asset.path === draft.featureImage);
        const ogImageAsset = mediaOptions.find((asset) => asset.path === draft.ogImage);
        const featureImagePreview = resolvePublishingStudioAssetPreviewPath(draft.featureImage);
        const ogImagePreview = resolvePublishingStudioAssetPreviewPath(draft.ogImage);
        const seoTitleCount = draft.seoTitle.trim().length;
        const seoDescriptionCount = draft.seoDescription.trim().length;
        const headInjectionCount = draft.codeInjectionHead.trim().length;
        const footInjectionCount = draft.codeInjectionFoot.trim().length;
        return html `
      <section
        class="browse-surface"
        aria-label="Tag editor"
        data-parity-surface="tag-editor"
      >
        <header class="browse-header">
          <div>
            <p class="browse-kicker">Relationships</p>
            <h1 class="browse-heading">${displayLabel}</h1>
          </div>
          <div class="hero-actions">
            <button
              class="action-button"
              data-variant="quiet"
              type="button"
              @click=${this.closeTagEditor}
            >
              Back to tags
            </button>
            ${isExisting
            ? html `
                  <button
                    class="action-button"
                    data-variant="quiet"
                    ?disabled=${!canManageTags}
                    type="button"
                    @click=${this.deleteTagEditorDraft}
                  >
                    ${this.tagDeleteConfirmOpen
                ? "Confirm delete"
                : "Delete tag"}
                  </button>
                  ${this.tagDeleteConfirmOpen
                ? html `
                        <button
                          class="action-button"
                          data-variant="quiet"
                          type="button"
                          @click=${this.cancelTagDelete}
                        >
                          Cancel
                        </button>
                      `
                : null}
                `
            : null}
            <button
              class="action-button"
              ?disabled=${!canManageTags}
              type="button"
              @click=${this.saveTagEditorDraft}
            >
              Save tag
            </button>
          </div>
        </header>

        <div class="tag-editor-layout">
          <div class="tag-editor-stack">
            <section class="dashboard-panel tag-editor-form">
              <div class="settings-card-body">
                <p class="browse-kicker">Basic info</p>
                <h2 class="dashboard-panel-title">
                  ${isExisting ? "Edit tag" : "Create a tag"}
                </h2>
                <p class="dashboard-panel-support">
                  Canonical tag details live in Showa first: name, slug,
                  description, visibility, and publication imagery.
                </p>
              </div>

              <div class="tag-editor-field-list">
                <label class="tag-editor-field">
                  <span class="tag-editor-label">Name</span>
                  <input
                    aria-label="Tag name"
                    class="tag-editor-input"
                    ?disabled=${!canManageTags}
                    .value=${draft.label}
                    @input=${this.handleTagDraftLabelInput}
                    type="text"
                  />
                </label>

                <label class="tag-editor-field">
                  <span class="tag-editor-label">Slug</span>
                  <input
                    aria-label="Tag slug"
                    class="tag-editor-input"
                    ?disabled=${!canManageTags}
                    .value=${draft.slug}
                    @input=${this.handleTagDraftSlugInput}
                    type="text"
                  />
                  <span class="tag-editor-meta">
                    ${normalizedDraftSlug ===
            (draft.slug.trim() || normalizedDraftSlug)
            ? `Canonical slug: ${normalizedDraftSlug}`
            : `Slug already claimed. Saving will use ${normalizedDraftSlug}.`}
                  </span>
                </label>

                <label class="tag-editor-field">
                  <span class="tag-editor-label">Description</span>
                  <textarea
                    aria-label="Tag description"
                    class="tag-editor-textarea"
                    ?disabled=${!canManageTags}
                    .value=${draft.description}
                    @input=${this.handleTagDraftDescriptionInput}
                  ></textarea>
                </label>

                <label class="tag-editor-field">
                  <span class="tag-editor-label">Visibility</span>
                  <select
                    aria-label="Tag visibility"
                    class="tag-editor-select"
                    ?disabled=${!canManageTags}
                    .value=${draft.visibility}
                    @change=${this.handleTagDraftVisibilityChange}
                  >
                    <option value="public">Public tag</option>
                    <option value="internal">Internal tag</option>
                  </select>
                </label>

                <label class="tag-editor-field">
                  <span class="tag-editor-label">Accent color</span>
                  <div class="tag-editor-color-row">
                    <input
                      aria-label="Tag color picker"
                      class="tag-editor-color-input"
                      ?disabled=${!canManageTags}
                      .value=${normalizeTagColor(draft.color)}
                      @input=${this.handleTagDraftColorInput}
                      type="color"
                    />
                    <input
                      aria-label="Tag color value"
                      class="tag-editor-input"
                      ?disabled=${!canManageTags}
                      .value=${normalizeTagColor(draft.color)}
                      @input=${this.handleTagDraftColorTextInput}
                      type="text"
                    />
                  </div>
                </label>

                ${this.renderTagMediaField({
            label: "Feature image",
            ariaLabel: "Tag feature image",
            value: draft.featureImage,
            emptyOptionLabel: "No image selected",
            mediaOptions,
            disabled: !canManageTags,
            onChange: this.handleTagDraftFeatureImageChange,
            previewPath: featureImagePreview,
            previewAlt: "Tag feature image preview",
            previewLabel: featureImageAsset?.label ?? draft.featureImage,
            fallback: html `<span class="tag-editor-meta"
                    >Uses the shared media library.</span
                  >`,
        })}
              </div>
            </section>

            <section class="dashboard-panel tag-editor-form">
              <div class="settings-card-body">
                <p class="browse-kicker">SEO</p>
                <h2 class="dashboard-panel-title">
                  Search and social metadata
                </h2>
                <p class="dashboard-panel-support">
                  Store SEO metadata canonically now. Public tag archive
                  rendering can consume it later without re-authoring.
                </p>
              </div>

              <div class="tag-editor-field-list">
                <label class="tag-editor-field">
                  <span class="tag-editor-label">SEO title</span>
                  <input
                    aria-label="Tag SEO title"
                    class="tag-editor-input"
                    ?disabled=${!canManageTags}
                    .value=${draft.seoTitle}
                    @input=${this.handleTagDraftSeoTitleInput}
                    type="text"
                  />
                  <span class="tag-editor-meta"
                    >Recommended up to 60 characters.</span
                  >
                  <span class="tag-editor-counter">${seoTitleCount}/60</span>
                </label>

                <label class="tag-editor-field">
                  <span class="tag-editor-label">SEO description</span>
                  <textarea
                    aria-label="Tag SEO description"
                    class="tag-editor-textarea"
                    ?disabled=${!canManageTags}
                    .value=${draft.seoDescription}
                    @input=${this.handleTagDraftSeoDescriptionInput}
                  ></textarea>
                  <span class="tag-editor-meta"
                    >Recommended up to 160 characters.</span
                  >
                  <span class="tag-editor-counter"
                    >${seoDescriptionCount}/160</span
                  >
                </label>

                ${this.renderTagMediaField({
            label: "Open Graph image",
            ariaLabel: "Tag Open Graph image",
            value: draft.ogImage,
            emptyOptionLabel: "Fallback to feature image",
            mediaOptions,
            disabled: !canManageTags,
            onChange: this.handleTagDraftOgImageChange,
            previewPath: ogImagePreview,
            previewAlt: "Tag Open Graph image preview",
            previewLabel: ogImageAsset?.label ?? draft.ogImage,
            fallback: html `
                    <span class="tag-editor-meta">
                      ${draft.featureImage.trim().length > 0
                ? "Falls back to the selected feature image."
                : "Select an image or let future consumers use their default social card."}
                    </span>
                  `,
        })}
              </div>
            </section>

            <section class="dashboard-panel tag-editor-form">
              <div class="settings-card-body">
                <p class="browse-kicker">Code injection</p>
                <h2 class="dashboard-panel-title">Stored, not executed</h2>
                <p class="dashboard-panel-support">
                  This studio stores tag-level head and footer code for
                  downstream consumers. It never executes the code inside the
                  editor shell.
                </p>
              </div>

              <div class="tag-editor-field-list">
                <label class="tag-editor-field">
                  <span class="tag-editor-label">Head code</span>
                  <textarea
                    aria-label="Tag head code injection"
                    class="tag-editor-textarea"
                    ?disabled=${!canManageTags}
                    .value=${draft.codeInjectionHead}
                    @input=${this.handleTagDraftCodeInjectionHeadInput}
                  ></textarea>
                  <span class="tag-editor-counter"
                    >${headInjectionCount} chars</span
                  >
                </label>

                <label class="tag-editor-field">
                  <span class="tag-editor-label">Footer code</span>
                  <textarea
                    aria-label="Tag footer code injection"
                    class="tag-editor-textarea"
                    ?disabled=${!canManageTags}
                    .value=${draft.codeInjectionFoot}
                    @input=${this.handleTagDraftCodeInjectionFootInput}
                  ></textarea>
                  <span class="tag-editor-counter"
                    >${footInjectionCount} chars</span
                  >
                </label>
              </div>
            </section>
          </div>

          <aside class="dashboard-panel tag-editor-sidebar">
            <div class="settings-card-body">
              <p class="browse-kicker">Preview</p>
              <h2 class="dashboard-mini-card-title">
                How this tag will appear
              </h2>
            </div>

            <div class="tag-editor-preview">
              <div class="dashboard-panel-header">
                <h3 class="tag-editor-preview-title">${displayLabel}</h3>
                <span class="summary-pill">${draft.visibility}</span>
              </div>
              <p class="tag-editor-preview-slug">${normalizedDraftSlug}</p>
              <p class="tag-editor-preview-slug">
                ${draft.description.trim().length > 0
            ? draft.description
            : "Description will appear here when added."}
              </p>
              ${featureImagePreview
            ? html `
                    <img
                      alt="Selected tag feature image"
                      class="tag-editor-preview-image"
                      src=${featureImagePreview}
                    />
                  `
            : null}
              <div class="summary-grid">
                <span class="summary-pill"
                  >Accent: ${normalizeTagColor(draft.color)}</span
                >
                <span class="summary-pill">
                  SEO:
                  ${draft.seoTitle.trim().length > 0 ? "custom" : "default"}
                </span>
                <span class="summary-pill">
                  OG image:
                  ${draft.ogImage.trim().length > 0 ? "custom" : "fallback"}
                </span>
              </div>
            </div>

            <div class="tag-editor-sidebar-copy">
              <p>
                ${draft.uses} assignment${draft.uses === 1 ? "" : "s"} across
                ${draft.postCount} post${draft.postCount === 1 ? "" : "s"} and
                ${draft.pageCount} page${draft.pageCount === 1 ? "" : "s"}.
              </p>
              <div class="tag-editor-usage-grid">
                <span class="summary-pill">Posts: ${draft.postCount}</span>
                <span class="summary-pill">Pages: ${draft.pageCount}</span>
                ${draft.lastPublishedAt
            ? html `
                      <span class="summary-pill">
                        Last used: ${formatDateLabel(draft.lastPublishedAt)}
                      </span>
                    `
            : html `<span class="summary-pill">New tag</span>`}
              </div>
            </div>
          </aside>
        </div>
      </section>
    `;
    }
    renderCollectionSurface(model) {
        const canCreateDrafts = this.hasCapability("content:draft:write");
        const selectedPostsBucket = this.getCurrentPostsBucket();
        const selectedPostsBucketIndex = this.getPostsBucketIndex(selectedPostsBucket);
        return html `
      <section
        class="browse-surface"
        aria-label="${`${model.title} collection`}"
        data-parity-surface=${model.surface}
      >
        <header class="browse-header" data-parity-region="collection-header">
          <h1 class="browse-heading">${model.title}</h1>
          <button
            class="collection-create-button"
            aria-label="${model.createLabel}"
            ?disabled=${!canCreateDrafts}
            type="button"
            @click=${() => this.handleCreateDraftTrigger(model.surface === "posts" ? "post" : "doc_page")}
          >
            ${model.createLabel}
          </button>
        </header>

        ${keyed(model.surface, html `
            <div
              class="collection-filters"
              data-parity-filter-count=${model.surface === "posts" ? "4" : "5"}
              data-parity-region="five-filter-row"
            >
              ${model.surface === "posts"
            ? null
            : this.renderCollectionFilterChip({
                label: `${model.title} status filter`,
                value: model.primaryFilter.activeValue,
                options: model.primaryFilter.options,
                disabled: model.primaryFilter.options.length <= 1,
                onChange: (value) => {
                    model.primaryFilter.onChange?.(value);
                },
            })}
              ${this.renderCollectionFilterChip({
            label: `${model.title} access filter`,
            value: model.accessFilter.activeValue,
            options: model.accessFilter.options,
            onChange: (value) => {
                model.accessFilter.onChange?.(value);
            },
        })}
              ${this.renderCollectionFilterChip({
            label: `${model.title} author filter`,
            value: model.authorFilter.activeValue,
            options: model.authorFilter.options,
            disabled: model.authorFilter.options.length <= 1,
            onChange: (value) => {
                model.authorFilter.onChange?.(value);
            },
        })}
              ${this.renderCollectionFilterChip({
            label: `${model.title} tag filter`,
            value: model.tagFilter.activeValue,
            options: model.tagFilter.options,
            disabled: model.tagFilter.options.length <= 1,
            onChange: (value) => {
                model.tagFilter.onChange?.(value);
            },
        })}
              ${this.renderCollectionFilterChip({
            label: `${model.title} sort order`,
            value: model.sortFilter.activeValue,
            options: model.sortFilter.options,
            onChange: (value) => {
                model.sortFilter.onChange?.(value);
            },
        })}
            </div>
          `)}
        ${model.surface === "posts" && model.bucketTabs
            ? html `
              <kit-tabs
                aria-label="Post buckets"
                class="collection-bucket-tabs-control"
                style="--kit-space-lg: 0;"
                .selected=${selectedPostsBucketIndex}
                @tab-change=${this.handlePostBucketTabChange}
              >
                ${model.bucketTabs.map((tab) => html `
                    <kit-tab slot="tab"
                      >${this.labelForPostBucket(tab.bucket, tab.count)}</kit-tab
                    >
                  `)}
              </kit-tabs>
              ${this.renderCollectionTable(model.surface, model.entries, model.emptyState)}
            `
            : this.renderCollectionTable(model.surface, model.entries, model.emptyState)}
      </section>
    `;
    }
    renderCollectionTable(surface, entries, emptyState) {
        return html `
      <kit-publishing-content-list
        class="collection-table"
        data-surface=${surface}
        .caption=${`${surface === "posts" ? "Posts" : "Pages"} collection`}
        .entries=${entries}
        .selectedRoute=${this.selectedRoute}
        .emptyState=${emptyState}
        .busy=${this.busy}
        .onEditEntry=${(entry) => this.selectRoute(entry.route)}
        .canEditEntry=${(entry) => this.canWriteEntry(entry)}
        .onPreviewEntry=${(entry) => this.requestBrowseRowPreview(entry.route)}
        .canPreviewEntry=${(entry) => this.canPreviewEntry(entry)}
        .onDuplicateEntry=${(entry) => this.emitEvent("publishing-duplicate-row", { route: entry.route })}
        .canDuplicateEntry=${(entry) => this.canWriteEntry(entry)}
      ></kit-publishing-content-list>

      <div
        hidden
        aria-hidden="true"
        data-parity-region="collection-title-mirror"
      >
        ${entries.map((entry) => html `<span class="collection-row-title">${entry.title}</span>`)}
      </div>
    `;
    }
    renderCollectionEmptyState(emptyState) {
        return html `
      <li class="collection-empty-row">
        <section
          class="collection-empty-state"
          data-empty-kind=${emptyState.kind}
          data-parity-region="collection-empty-state"
        >
          <h2 class="collection-empty-title">${emptyState.title}</h2>
          <p class="collection-empty-copy">${emptyState.message}</p>
          ${emptyState.actionLabel && emptyState.onAction
            ? html `
                <button
                  class="action-button collection-empty-action"
                  data-empty-action="clear-filters"
                  data-variant="quiet"
                  type="button"
                  @click=${emptyState.onAction}
                >
                  ${emptyState.actionLabel}
                </button>
              `
            : null}
        </section>
      </li>
    `;
    }
    renderCollectionFilterChip(config) {
        return html `
      <label class="filter-chip">
        ${config.prefix
            ? html `<span class="filter-chip-prefix">${config.prefix}</span>`
            : null}
        <select
          aria-label=${config.label}
          class="filter-chip-select"
          ?disabled=${config.disabled ?? false}
          .value=${config.value}
          @change=${(event) => {
            config.onChange(event.target.value);
        }}
        >
          ${config.options.map((option) => html `<option value=${option.value}>${option.label}</option>`)}
        </select>
        <span class="filter-chip-caret" aria-hidden="true">
          ${renderGhostShellIcon("chevron-down")}
        </span>
      </label>
    `;
    }
    renderTagMediaField(config) {
        return html `
      <label class="tag-editor-field">
        <span class="tag-editor-label">${config.label}</span>
        <select
          aria-label=${config.ariaLabel}
          class="tag-editor-select"
          ?disabled=${config.disabled}
          .value=${config.value}
          @change=${config.onChange}
        >
          <option value="">${config.emptyOptionLabel}</option>
          ${config.mediaOptions.map((asset) => html `<option value=${asset.path}>${asset.label}</option>`)}
        </select>
        ${config.previewPath
            ? html `
              <div class="tag-editor-image-preview">
                <img
                  alt=${config.previewAlt}
                  class="tag-editor-image-thumb"
                  src=${config.previewPath}
                />
                <span>${config.previewLabel}</span>
              </div>
            `
            : config.fallback}
      </label>
    `;
    }
    renderCollectionRow(entry) {
        return html `
      <li>
        <div
          class="collection-row collection-row-shell"
          aria-label=${`Open ${entry.title} at ${entry.route}`}
          data-kind=${entry.kind}
          data-route=${entry.route}
          role="button"
          tabindex="0"
          @click=${() => this.selectRoute(entry.route)}
          @keydown=${(event) => {
            if (event.target !== event.currentTarget) {
                return;
            }
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }
            event.preventDefault();
            this.selectRoute(entry.route);
        }}
        >
          <div class="collection-row-primary">
            <p class="collection-row-title">${entry.title}</p>
            <span class="collection-row-meta"
              >${this.renderCollectionEntryMeta(entry)}</span
            >
          </div>
          ${entry.kind === "post"
            ? html `
                <span class="collection-row-secondary">
                  ${this.renderCollectionRowAction("preview", entry)}
                </span>
                <span class="collection-row-age">
                  ${this.renderCollectionRowAction("edit", entry)}
                </span>
                <span class="collection-row-copy">
                  ${this.renderCollectionRowAction("duplicate", entry)}
                </span>
                <span
                  class="entry-badge collection-status"
                  data-tone=${entry.status}
                >
                  ${entry.status.toUpperCase()}
                </span>
              `
            : html `
                <span class="collection-row-trailing">
                  ${this.renderCollectionRowActionCluster(entry)}
                  <span
                    class="entry-badge collection-status"
                    data-tone=${entry.status}
                  >
                    ${entry.status.toUpperCase()}
                  </span>
                </span>
              `}
        </div>
      </li>
    `;
    }
    renderCollectionRowAction(action, entry) {
        if (action === "preview") {
            if (!this.canPreviewEntry(entry)) {
                return null;
            }
            return html `
        <button
          class="collection-row-action"
          aria-label=${`Preview ${entry.title}`}
          data-row-action="preview"
          ?disabled=${this.busy}
          type="button"
          @click=${(event) => {
                event.stopPropagation();
                this.requestBrowseRowPreview(entry.route);
            }}
          @keydown=${(event) => {
                event.stopPropagation();
            }}
        >
          Preview
        </button>
      `;
        }
        if (!this.canWriteEntry(entry)) {
            return null;
        }
        if (action === "duplicate") {
            return html `
        <button
          class="collection-row-action"
          aria-label=${`Duplicate ${entry.title}`}
          data-row-action="duplicate"
          ?disabled=${this.busy}
          type="button"
          @click=${(event) => {
                event.stopPropagation();
                this.emitEvent("publishing-duplicate-row", { route: entry.route });
            }}
          @keydown=${(event) => {
                event.stopPropagation();
            }}
        >
          Duplicate
        </button>
      `;
        }
        return html `
      <button
        class="collection-row-action"
        aria-label=${`Edit ${entry.title}`}
        data-row-action="edit"
        ?disabled=${this.busy}
        type="button"
        @click=${(event) => {
            event.stopPropagation();
            this.selectRoute(entry.route);
        }}
        @keydown=${(event) => {
            event.stopPropagation();
        }}
      >
        Edit
      </button>
    `;
    }
    renderCollectionRowActionCluster(entry) {
        const previewAction = this.renderCollectionRowAction("preview", entry);
        const editAction = this.renderCollectionRowAction("edit", entry);
        const duplicateAction = this.renderCollectionRowAction("duplicate", entry);
        if (!previewAction && !editAction && !duplicateAction) {
            return null;
        }
        return html `
      <span class="collection-row-trailing-actions">
        ${previewAction} ${editAction} ${duplicateAction}
      </span>
    `;
    }
    renderCollectionEntryMeta(entry) {
        const authorName = normalizeAuthorValue(entry.authorName);
        const primaryTag = normalizeTagValue(entry.tags?.[0]);
        return html `
      ${authorName
            ? entry.authorAvatarUrl
                ? html `
              <img
                alt=""
                class="collection-row-author-avatar-image"
                src=${entry.authorAvatarUrl}
              />
            `
                : html `
              <span
                class="collection-row-author-avatar-fallback"
                aria-hidden="true"
              >
                ${initialsForLabel(authorName)}
              </span>
            `
            : null}
      <span class="collection-row-meta-copy"
        >${this.formatCollectionEntryByline(entry)}</span
      >
      ${primaryTag
            ? html `<span class="collection-row-primary-tag">${primaryTag}</span>`
            : null}
    `;
    }
    formatCollectionEntryByline(entry) {
        const metadata = [labelForPublishingAccess(entry.access)];
        const authorName = normalizeAuthorValue(entry.authorName);
        if (authorName) {
            metadata.push(`By ${authorName}`);
        }
        if (entry.kind === "doc_page" && entry.sectionTitle) {
            metadata.push(entry.sectionTitle);
        }
        metadata.push(entry.publishedAt
            ? formatDateLabel(entry.publishedAt)
            : entry.status === "published"
                ? "Published"
                : "Draft");
        return metadata.join(" • ");
    }
    renderSettingsHub(siteEntries) {
        const general = siteEntries.find((entry) => entry.kind === "site_settings");
        const design = siteEntries.find((entry) => entry.kind === "homepage");
        const navigation = siteEntries.find((entry) => entry.kind === "navigation");
        return html `
      <section
        class="browse-surface"
        aria-label="Settings hub"
        data-parity-surface="settings"
      >
        <header class="browse-header">
          <h1 class="browse-heading">Settings</h1>
          <div class="hero-actions">
            <button
              class="action-button"
              data-action="view-site"
              data-variant="quiet"
              type="button"
              @click=${() => {
            this.requestOpenSite("settings");
        }}
            >
              View site
            </button>
          </div>
        </header>

        <section class="settings-group">
          <p class="browse-kicker">Website</p>
          <div class="settings-grid" data-parity-region="settings-grid">
            ${this.renderSettingsCard("settings", "amber", "General", "Basic publication details and site metadata", () => general && this.selectRoute(general.route))}
            ${this.renderSettingsCard("design", "blue", "Design", "Customize your site and manage themes", () => design && this.selectRoute(design.route))}
            ${this.renderSettingsCard("navigation", "pink", "Navigation", "Set up primary and secondary menus", () => navigation && this.selectRoute(navigation.route))}
            ${this.renderSettingsCard("staff", "green", "Staff", "Manage authors, editor and collaborators", this.handleStaffTrigger)}
          </div>
        </section>

        <section class="settings-group">
          <p class="browse-kicker">Members</p>
          <div class="settings-grid" data-parity-region="settings-grid">
            ${this.renderSettingsCard("membership", "blue", "Membership", "Access, subscription, and pricing options", this.handleMembersTrigger)}
            ${this.renderSettingsCard("newsletter", "amber", "Email newsletter", "Customize emails and set email addresses", this.handleNewsletterTrigger)}
          </div>
        </section>

        <section class="settings-group">
          <p class="browse-kicker">Advanced</p>
          <div class="settings-grid" data-parity-region="settings-grid">
            ${this.renderSettingsCard("integrations", "amber", "Integrations", "Make Ghost work with apps and tools", this.handleIntegrationsTrigger)}
            ${this.renderSettingsCard("code", "green", "Code injection", "Add code to your publication", this.handleCodeInjectionTrigger)}
            ${this.renderSettingsCard("labs", "pink", "Labs", "Testing ground for new features", this.handleLabsTrigger)}
          </div>
        </section>
      </section>
    `;
    }
    renderDashboardSurface(siteEntries, postEntries, docEntries) {
        const general = siteEntries.find((entry) => entry.kind === "site_settings");
        const design = siteEntries.find((entry) => entry.kind === "homepage");
        const navigation = siteEntries.find((entry) => entry.kind === "navigation");
        const contentEntries = [...postEntries, ...docEntries];
        const recentEntries = this.sortEntries(contentEntries).slice(0, 5);
        const publishedCount = contentEntries.filter((entry) => entry.status === "published").length;
        const draftCount = contentEntries.filter((entry) => entry.status === "draft").length;
        const canCreateDrafts = this.hasCapability("content:draft:write");
        return html `
      <section
        class="browse-surface dashboard-surface"
        aria-label="Dashboard landing"
        data-parity-surface="dashboard"
      >
        <header class="browse-header">
          <h1 class="browse-heading">Dashboard</h1>
        </header>

        <div class="dashboard-grid" data-parity-region="dashboard-grid">
          <div class="dashboard-main-column">
            <section
              class="dashboard-panel dashboard-summary-panel"
              data-parity-region="dashboard-summary-panel"
            >
              <div class="dashboard-panel-header">
                <div class="settings-card-body">
                  <h2 class="dashboard-panel-title">Content overview</h2>
                </div>
                <p class="dashboard-panel-context">30 days</p>
              </div>

              <div class="dashboard-summary-layout">
                <div class="dashboard-chart" aria-hidden="true"></div>
                <div class="dashboard-summary-metrics">
                  ${this.renderDashboardMetric("Published content", String(publishedCount), `${postEntries.length} posts / ${docEntries.length} pages`)}
                  ${this.renderDashboardMetric("Draft content", String(draftCount), "Ready for review")}
                  ${this.renderDashboardMetric("Pages", String(docEntries.length), "Docs live under Pages")}
                  ${this.renderDashboardMetric("Media assets", String(this.media.length), "Shared assets")}
                </div>
              </div>
            </section>

            <section class="dashboard-panel">
              <div class="dashboard-panel-header">
                <div class="settings-card-body">
                  <h2 class="dashboard-panel-title">Start creating content</h2>
                </div>
              </div>

              <div class="dashboard-action-grid">
                ${this.renderDashboardActionCard("posts", "pink", "Create a post", "Open a blank post draft in the production editor path.", "New post", () => this.requestNewDraft("post"), !canCreateDrafts)}
                ${this.renderDashboardActionCard("pages", "green", "Create a page", "Open a blank page draft under the Pages collection.", "New page", () => this.requestNewDraft("doc_page"), !canCreateDrafts)}
              </div>
            </section>

            <div class="dashboard-lower-grid">
              <section class="dashboard-panel">
                <div class="settings-card-body">
                  <h2 class="dashboard-mini-card-title">Customize your site</h2>
                  <p class="dashboard-mini-card-copy">
                    Homepage, navigation, and publication settings stay behind
                    the Settings hub.
                  </p>
                </div>
                <div class="dashboard-inline-actions">
                  <button
                    class="dashboard-mini-action"
                    type="button"
                    @click=${() => general && this.selectRoute(general.route)}
                  >
                    General
                  </button>
                  <button
                    class="dashboard-mini-action"
                    type="button"
                    @click=${() => design && this.selectRoute(design.route)}
                  >
                    Design
                  </button>
                  <button
                    class="dashboard-mini-action"
                    type="button"
                    @click=${() => navigation && this.selectRoute(navigation.route)}
                  >
                    Navigation
                  </button>
                </div>
              </section>

              <section class="dashboard-panel">
                <div class="settings-card-body">
                  <h2 class="dashboard-mini-card-title">
                    Looking for help with the studio?
                  </h2>
                  <p class="dashboard-mini-card-copy">
                    Start in the guides surface if you want the canonical docs
                    workflow in one place.
                  </p>
                </div>
                <div class="dashboard-inline-actions">
                  <button
                    class="dashboard-mini-action"
                    type="button"
                    @click=${() => this.selectRoute("/docs/guides/getting-started")}
                  >
                    Open guides
                  </button>
                  <button
                    class="dashboard-mini-action"
                    type="button"
                    @click=${() => this.openBrowseSurface("posts")}
                  >
                    Open posts
                  </button>
                </div>
              </section>
            </div>
          </div>

          <aside class="dashboard-side-column">
            <section
              class="dashboard-panel"
              data-parity-region="dashboard-activity-panel"
            >
              <div class="settings-card-body">
                <p class="browse-kicker">Activity</p>
                <h2 class="dashboard-panel-title">Recent changes</h2>
              </div>

              ${recentEntries.length > 0
            ? html `
                    <ul class="dashboard-activity-list">
                      ${recentEntries.map((entry) => {
                const detail = entry.route.startsWith("/docs/")
                    ? "Page updated"
                    : entry.route.startsWith("/blog/")
                        ? "Post updated"
                        : entry.kind;
                const timestamp = entry.publishedAt
                    ? formatDateLabel(entry.publishedAt)
                    : entry.status;
                return html `
                          <li class="dashboard-activity-item">
                            <button
                              class="dashboard-activity-button"
                              type="button"
                              @click=${() => this.selectRoute(entry.route)}
                            >
                              <span class="dashboard-activity-copy">
                                <span class="dashboard-activity-title"
                                  >${entry.title}</span
                                >
                                <span class="dashboard-activity-detail">
                                  ${entry.description ?? detail}
                                </span>
                              </span>
                              <span class="dashboard-activity-date"
                                >${timestamp}</span
                              >
                              <span class="dashboard-activity-meta">
                                <span>${detail}</span>
                              </span>
                            </button>
                          </li>
                        `;
            })}
                    </ul>
                  `
            : html `<p class="dashboard-panel-support">
                    No recent content entries are available yet.
                  </p>`}
            </section>
          </aside>
        </div>
      </section>
    `;
    }
    renderDashboardMetric(label, value, note) {
        return html `
      <div class="dashboard-metric">
        <div class="dashboard-metric-meta">
          <span class="dashboard-metric-label">${label}</span>
        </div>
        <span class="dashboard-metric-value">${value}</span>
        <span class="dashboard-metric-note">${note}</span>
      </div>
    `;
    }
    renderDashboardActionCard(icon, tone, title, copy, actionLabel, onClick, disabled = false) {
        return html `
      <button
        class="dashboard-action-card"
        ?disabled=${disabled}
        type="button"
        @click=${onClick}
      >
        <span class="dashboard-action-icon" data-tone=${tone}>
          ${renderGhostShellIcon(icon)}
        </span>
        <span class="settings-card-body">
          <h3 class="dashboard-action-title">${title}</h3>
          <p class="dashboard-action-copy">${copy}</p>
        </span>
      </button>
    `;
    }
    renderSettingsCard(icon, tone, title, copy, onClick) {
        return html `
      <button class="settings-card" type="button" @click=${onClick}>
        <span class="settings-card-icon" data-tone=${tone}
          >${renderGhostShellIcon(icon)}</span
        >
        <span class="settings-card-body">
          <span class="settings-card-title">${title}</span>
          <span class="settings-card-copy">${copy}</span>
        </span>
      </button>
    `;
    }
    renderBrowseSection(title, entries) {
        return html `
      <section>
        <div class="diff-header">
          <h3 class="section-title">${title}</h3>
          <span class="summary-pill">${entries.length}</span>
        </div>
        <ul class="entry-list">
          ${entries.length > 0
            ? entries.map((entry) => this.renderBrowseEntry(entry))
            : html `<li class="empty-state">
                No ${title.toLowerCase()} items match this filter.
              </li>`}
        </ul>
      </section>
    `;
    }
    renderDocsBrowseSection(entries) {
        if (this.entryFilter.value.trim().length > 0) {
            return this.renderBrowseSection("Docs", entries);
        }
        const sectionEntries = this.docSections.filter((section) => section.pages.some((page) => entries.some((entry) => entry.kind === "doc_page" && entry.slug === page.slug)));
        return html `
      <section>
        <div class="diff-header">
          <h3 class="section-title">
            ${this.workspace.profile.docsLabel ?? "Docs"}
          </h3>
          <span class="summary-pill">${entries.length}</span>
        </div>
        <div class="diff-grid">
          ${sectionEntries.length > 0
            ? sectionEntries.map((section) => html `
                  <section class="card">
                    <div>
                      <h4 class="section-title">${section.title}</h4>
                      ${section.description
                ? html `<p class="section-copy">
                            ${section.description}
                          </p>`
                : null}
                    </div>
                    <ul class="entry-list">
                      ${section.pages.map((page) => {
                const entry = entries.find((candidate) => candidate.slug === page.slug);
                return entry ? this.renderBrowseEntry(entry) : null;
            })}
                    </ul>
                  </section>
                `)
            : html `<p class="empty-state">No docs pages match this filter.</p>`}
        </div>
      </section>
    `;
    }
    renderBrowseEntry(entry) {
        return html `
      <li>
        <button
          class="entry-button"
          aria-current=${entry.route === this.selectedRoute ? "page" : "false"}
          aria-label=${`Open ${entry.title} at ${entry.route}`}
          data-entry-kind=${entry.kind}
          data-route=${entry.route}
          data-selected=${String(entry.route === this.selectedRoute)}
          @click=${() => this.selectRoute(entry.route)}
        >
          <strong>${entry.title}</strong>
          <div class="entry-meta">
            <span class="entry-badge">${entry.kind}</span>
            <span class="entry-badge" data-tone=${entry.status}
              >${entry.status}</span
            >
            ${entry.publishedAt
            ? html `<span class="entry-badge"
                  >${formatDateLabel(entry.publishedAt)}</span
                >`
            : null}
            ${entry.sectionTitle
            ? html `<span class="entry-badge">${entry.sectionTitle}</span>`
            : null}
          </div>
          <p class="entry-route">${entry.route}</p>
          <p class="entry-description">${entry.description}</p>
        </button>
      </li>
    `;
    }
    renderWorkspacePanel() {
        const session = this.getActiveSession();
        const principal = session.principal;
        const identityLabel = this.getSessionIdentityLabel();
        const roleLabel = this.getSessionRoleLabel();
        const accessCue = this.getSessionAccessCue();
        return html `
      <section
        class="metadata-panel workspace-panel"
        aria-label="Publication workspace"
        data-parity-region="workspace-drawer"
      >
        <header class="metadata-panel-header">
          <p class="metadata-panel-link-prefix">Workspace context</p>
          <h2 class="metadata-panel-title">${this.workspace.profile.title}</h2>
          <p class="workspace-panel-copy">
            ${this.workspace.profile.description ??
            "Domain-agnostic local studio for Git-native static publishing."}
          </p>
        </header>
        <section class="metadata-panel-section">
          <p class="metadata-panel-kicker">Session</p>
          <div class="summary-grid">
            <span class="summary-pill">Principal: ${identityLabel}</span>
            <span class="summary-pill">Role: ${roleLabel}</span>
            <span class="summary-pill">Access: ${accessCue}</span>
            <span class="summary-pill">Auth: ${principal.authMethod}</span>
            ${session.providerId.length > 0
            ? html `<span class="summary-pill"
                  >Provider: ${session.providerId}</span
                >`
            : null}
          </div>
        </section>
        ${this.workspace.deployTargets.length > 0
            ? html `
              <section class="metadata-panel-section">
                <p class="metadata-panel-kicker">Deploy targets</p>
                <ul class="workspace-target-list">
                  ${this.workspace.deployTargets.map((target) => html `
                      <li class="workspace-target-item">
                        <strong>${target.label}</strong>
                        <div class="entry-route">${target.outputDir}</div>
                        <div class="entry-description">
                          ${target.provider}${target.projectName
                ? ` · ${target.projectName}`
                : ""}
                        </div>
                      </li>
                    `)}
                </ul>
              </section>
            `
            : null}
      </section>
    `;
    }
    renderWriteStatusBar(currentState, selectedEntry, showMetadataEditor, inspectorVisible, canWriteCurrentRoute, browseVisible, canPreview, canReview, canConfirmPublish, canPublish) {
        const routeLabel = selectedEntry?.route ?? this.selectedRoute;
        const browseLabel = selectedEntry?.kind === "doc_page"
            ? "Pages"
            : selectedEntry?.kind === "post"
                ? "Posts"
                : "Content";
        const routeDisplayLabel = this.documentTitle.trim() ||
            selectedEntry?.title?.trim() ||
            routeLabel ||
            "Untitled draft";
        const statusCopy = this.statusMessage.length > 0
            ? this.statusMessage
            : selectedEntry?.kind === "doc_page"
                ? "Page draft ready for editorial work."
                : selectedEntry?.kind === "post"
                    ? "Post draft ready for editorial work."
                    : "Draft ready for editorial work.";
        const showSiteOpenAction = selectedEntry?.kind === "homepage" ||
            selectedEntry?.kind === "site_settings" ||
            selectedEntry?.kind === "navigation";
        const showGhostEditorChrome = showMetadataEditor &&
            currentState === "draft" &&
            this.documentTitle.trim().length === 0 &&
            this.editorContent.value.trim().length === 0;
        if (showGhostEditorChrome) {
            return html `
        <section
          class="write-status-bar"
          data-ghost-editor="true"
          data-has-inspector=${inspectorVisible ? "true" : "false"}
          aria-label="Write mode status bar"
        >
          <div class="ghost-editor-empty-bar">
            <div class="ghost-editor-crumbs">
              <button
                class="ghost-editor-link"
                aria-label=${`Browse ${browseLabel.toLowerCase()}`}
                @click=${() => {
                this.openBrowseSurfaceForCurrentRoute();
            }}
                type="button"
              >
                ${browseLabel}
              </button>
              <span class="ghost-editor-label">Draft</span>
            </div>

            <div class="ghost-editor-actions">
              <button
                class="ghost-editor-workspace"
                aria-label=${this.workspacePanelOpen
                ? "Hide workspace context"
                : "Show workspace context"}
                @click=${this.toggleWorkspacePanel}
                type="button"
              >
                Workspace
              </button>
              <button
                class="ghost-editor-settings"
                aria-label=${this.metadataPanelOpen
                ? "Hide page settings"
                : "Show page settings"}
                ?disabled=${!canWriteCurrentRoute}
                @click=${this.toggleMetadataPanel}
                type="button"
              >
                ${renderGhostShellIcon("settings")}
              </button>
            </div>
          </div>
        </section>
      `;
        }
        return html `
      <section
        class="write-status-bar"
        data-has-inspector=${inspectorVisible ? "true" : "false"}
        aria-label="Write mode status bar"
      >
        <div class="write-status-info">
          <div class="write-status-kicker">
            ${!browseVisible
            ? html `
                  <button
                    class="write-breadcrumb"
                    aria-label=${`Browse ${browseLabel.toLowerCase()}`}
                    @click=${() => {
                this.openBrowseSurfaceForCurrentRoute();
            }}
                    type="button"
                  >
                    ${browseLabel}
                  </button>
                `
            : html `<span class="write-breadcrumb" data-static="true"
                  >${browseLabel}</span
                >`}
            <span class="write-status-separator" aria-hidden="true">/</span>
            <span class="write-status-route">${routeDisplayLabel}</span>
            <span class="summary-pill"
              >${labelForWorkflowState(currentState)}</span
            >
          </div>
          <p class="write-status-message">${statusCopy}</p>
        </div>

        <div class="write-status-actions">
          ${showSiteOpenAction
            ? html `
                <button
                  class="action-button"
                  aria-label="Open consumer site"
                  data-action="view-site"
                  data-variant="quiet"
                  @click=${() => {
                this.requestOpenSite("editor");
            }}
                  type="button"
                >
                  View site
                </button>
              `
            : null}
          <button
            class="action-button"
            aria-label=${this.workspacePanelOpen
            ? "Hide workspace context"
            : "Show workspace context"}
            data-variant="quiet"
            @click=${this.toggleWorkspacePanel}
            type="button"
          >
            ${this.workspacePanelOpen ? "Hide context" : "Context"}
          </button>
          ${showMetadataEditor
            ? html `
                <button
                  class="action-button"
                  aria-label=${this.metadataPanelOpen
                ? "Hide page settings"
                : "Show page settings"}
                  data-variant="quiet"
                  ?disabled=${!canWriteCurrentRoute}
                  @click=${this.toggleMetadataPanel}
                  type="button"
                >
                  ${this.metadataPanelOpen ? "Hide settings" : "Settings"}
                </button>
              `
            : null}
          <button
            class="action-button"
            aria-label="Preview current draft"
            data-action="preview"
            data-variant="primary"
            ?disabled=${this.busy || !canPreview}
            @click=${this.requestPreview}
            type="button"
          >
            Preview
          </button>
          <button
            class="action-button"
            aria-label="Review publish diff"
            data-action="review-publish"
            data-variant="default"
            ?disabled=${this.busy || !canReview}
            @click=${this.requestPublishReview}
            type="button"
          >
            Review Publish
          </button>
          ${canConfirmPublish
            ? html `
                <button
                  class="action-button"
                  aria-label="Confirm publish current draft"
                  data-action="confirm-publish"
                  data-variant="success"
                  ?disabled=${!canPublish}
                  @click=${this.requestPublishConfirm}
                  type="button"
                >
                  Confirm Publish
                </button>
              `
            : null}
        </div>
      </section>
    `;
    }
    renderWriteSurface(selectedEntry, showMetadataEditor, showStructuredEditor, canWriteCurrentRoute) {
        return html `
      <div
        class="editor-canvas"
        data-parity-region="writing-column"
        data-structured=${showStructuredEditor ? "true" : "false"}
      >
        <section class="canvas-header" aria-label="Publishing writing canvas">
          ${showMetadataEditor
            ? html `
                ${this.renderFeatureMediaEntry(selectedEntry, canWriteCurrentRoute)}
                <input
                  class="canvas-title-input"
                  aria-label="Canvas document title"
                  autocomplete="off"
                  data-field="title"
                  ?disabled=${!canWriteCurrentRoute}
                  placeholder=${selectedEntry?.kind === "doc_page"
                ? "Page title"
                : "Post title"}
                  .value=${this.documentTitle}
                  @input=${this.handleMetadataInput}
                  @keydown=${this.handleCanvasTitleKeydown}
                />
              `
            : html `
                <h2 class="section-title">
                  ${selectedEntry?.title ?? this.workspace.profile.title}
                </h2>
                <p class="canvas-copy">
                  Structured content stays canonical in JSON, but the editing
                  experience remains editorial instead of raw-model-first.
                </p>
              `}
        </section>

        ${showStructuredEditor
            ? this.renderStructuredEditor()
            : html `
              <kit-publishing-editor-surface
                editor-label="Publishing document editor"
                editor-testid="publishing-document-editor"
                .adapter=${this.editorAdapter}
                .editorKind=${this.editorKind}
                .documentIdentity=${this.selectedRoute ?? ""}
                .dirty=${this.draftDirty.value}
                .insertPaletteOpen=${this.editorInsertPaletteOpen}
                .mediaAssets=${this.getFeatureMediaOptions()}
                .readOnly=${!canWriteCurrentRoute}
                .externalSyncGeneration=${this.editorExternalSyncGeneration}
                .value=${this.editorContent.value}
                .placeholder=${selectedEntry?.kind === "doc_page"
                ? "Begin writing your page..."
                : "Begin writing your post..."}
                @publishing-change=${this.handleEditorChange}
              ></kit-publishing-editor-surface>
            `}
      </div>
    `;
    }
    resetRouteScopedState(nextState = "draft") {
        this.previewHtml = "";
        this.previewExcerpt = "";
        this.reviewDiffs = [];
        this.validationIssues = [];
        this.statusMessage = "";
        this.syncReactiveState(() => {
            this.synchronizeWorkflowState(nextState);
        });
    }
    renderFeatureMediaEntry(selectedEntry, canEdit) {
        if (!selectedEntry ||
            (selectedEntry.kind !== "post" && selectedEntry.kind !== "doc_page")) {
            return html ``;
        }
        const label = selectedEntry.kind === "post" ? "Feature image" : "Cover image";
        const mediaOptions = this.getFeatureMediaOptions();
        const currentAsset = mediaOptions.find((asset) => asset.path === this.documentFeatureImage);
        const currentPreviewPath = resolvePublishingStudioAssetPreviewPath(currentAsset?.path ??
            (this.documentFeatureImage.trim().length > 0
                ? this.documentFeatureImage
                : ""));
        return html `
      <div class="feature-media-entry" aria-label=${label}>
        <button
          class="feature-media-button"
          aria-label=${this.documentFeatureImage.length > 0
            ? `Change ${label.toLowerCase()}`
            : `Add ${label.toLowerCase()}`}
          ?disabled=${!canEdit}
          @click=${this.toggleFeatureMediaPicker}
          type="button"
        >
          <span class="feature-media-plus" aria-hidden="true">+</span>
          ${this.documentFeatureImage.length > 0
            ? `Change ${label.toLowerCase()}`
            : `Add ${label.toLowerCase()}`}
        </button>

        ${currentPreviewPath
            ? html `
              <div class="feature-media-current">
                <img
                  alt=${`${label} preview`}
                  class="feature-media-thumb"
                  src=${currentPreviewPath}
                />
                <span>${currentAsset?.label ?? this.documentFeatureImage}</span>
              </div>
            `
            : null}
        ${this.featureMediaPickerOpen
            ? html `
              <div class="feature-media-picker">
                ${mediaOptions.length > 0
                ? this.renderSelectField(label, "featureImage", this.documentFeatureImage, [
                    { value: "", label: "No image selected" },
                    ...mediaOptions.map((asset) => ({
                        value: asset.path,
                        label: asset.label,
                    })),
                ], !canEdit)
                : html `
                      <p class="feature-media-empty">
                        Add an image file to <code>content/media/</code> to use
                        it here.
                      </p>
                    `}
                <div class="feature-media-picker-actions">
                  ${this.documentFeatureImage.length > 0
                ? html `
                        <button
                          class="action-button"
                          data-variant="quiet"
                          ?disabled=${!canEdit}
                          @click=${() => {
                    this.updateMetadataField("featureImage", "");
                }}
                          type="button"
                        >
                          Remove ${label.toLowerCase()}
                        </button>
                      `
                : null}
                  <button
                    class="action-button"
                    data-variant="quiet"
                    @click=${() => {
                this.featureMediaPickerOpen = false;
            }}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            `
            : null}
      </div>
    `;
    }
    renderStructuredEditor() {
        const document = this.getStructuredDocument();
        if (!document) {
            return html `
        <section class="card">
          <p class="empty-state">
            Structured content could not be loaded for this workspace item.
          </p>
        </section>
      `;
        }
        switch (document.kind) {
            case "site_settings":
                return this.renderSiteSettingsEditor(document);
            case "navigation":
                return this.renderNavigationEditor(document);
            case "homepage":
                return this.renderHomepageEditor(document);
        }
    }
    renderSiteSettingsEditor(document) {
        return html `
      <section class="card" aria-label="Site settings editor">
        <div class="field-grid">
          ${this.renderStructuredTextField("Publication title", document.title, (value) => {
            this.updateStructuredDocument({ ...document, title: value });
        })}
          ${this.renderStructuredTextField("Language", document.language, (value) => {
            this.updateStructuredDocument({ ...document, language: value });
        })}
          ${this.renderStructuredTextField("Contact email", document.contactEmail, (value) => {
            this.updateStructuredDocument({
                ...document,
                contactEmail: value,
            });
        }, "email")}
          ${this.renderStructuredTextField("Theme color", document.themeColor ?? "", (value) => {
            this.updateStructuredDocument({
                ...document,
                themeColor: value.trim() || undefined,
            });
        })}
          ${this.renderStructuredTextarea("Description", document.description, (value) => {
            this.updateStructuredDocument({
                ...document,
                description: value,
            });
        })}
          ${this.renderStructuredTextarea("Footer notice", document.footerNotice, (value) => {
            this.updateStructuredDocument({
                ...document,
                footerNotice: value,
            });
        })}
          ${this.renderStructuredTextField("SEO title", document.seo?.title ?? "", (value) => {
            this.updateStructuredDocument({
                ...document,
                seo: {
                    ...document.seo,
                    title: value.trim() || undefined,
                    description: document.seo?.description,
                },
            });
        })}
          ${this.renderStructuredTextarea("SEO description", document.seo?.description ?? "", (value) => {
            this.updateStructuredDocument({
                ...document,
                seo: {
                    ...document.seo,
                    title: document.seo?.title,
                    description: value.trim() || undefined,
                },
            });
        })}
        </div>
      </section>
      ${this.renderNavigationItemListEditor("Social links", document.socialLinks, (links) => {
            this.updateStructuredDocument({ ...document, socialLinks: links });
        })}
    `;
    }
    renderNavigationEditor(document) {
        return html `
      ${this.renderNavigationItemListEditor("Main navigation", document.mainLinks, (links) => {
            this.updateStructuredDocument({ ...document, mainLinks: links });
        })}
      ${this.renderNavigationItemListEditor("Footer navigation", document.footerLinks, (links) => {
            this.updateStructuredDocument({ ...document, footerLinks: links });
        })}
    `;
    }
    renderHomepageEditor(document) {
        return html `
      <section class="card" aria-label="Homepage editor">
        <div class="field-grid">
          ${this.renderStructuredTextField("Eyebrow", document.heroEyebrow, (value) => {
            this.updateStructuredDocument({
                ...document,
                heroEyebrow: value,
            });
        })}
          ${this.renderStructuredTextField("Hero title", document.heroTitle, (value) => {
            this.updateStructuredDocument({ ...document, heroTitle: value });
        })}
          ${this.renderStructuredTextarea("Hero body", document.heroBody, (value) => {
            this.updateStructuredDocument({ ...document, heroBody: value });
        })}
          ${this.renderStructuredTextField("SEO title", document.seo?.title ?? "", (value) => {
            this.updateStructuredDocument({
                ...document,
                seo: {
                    ...document.seo,
                    title: value.trim() || undefined,
                    description: document.seo?.description,
                },
            });
        })}
          ${this.renderStructuredTextarea("SEO description", document.seo?.description ?? "", (value) => {
            this.updateStructuredDocument({
                ...document,
                seo: {
                    ...document.seo,
                    title: document.seo?.title,
                    description: value.trim() || undefined,
                },
            });
        })}
        </div>
      </section>
      ${this.renderHeroMetricsEditor(document)}
      ${this.renderHomepageLinkEditor("Primary call to action", document.primaryCta, (link) => {
            this.updateStructuredDocument({ ...document, primaryCta: link });
        })}
      ${this.renderHomepageLinkEditor("Secondary call to action", document.secondaryCta ?? {
            label: "",
            href: "",
            external: false,
        }, (link) => {
            const hasValue = link.label.trim().length > 0 && link.href.trim().length > 0;
            this.updateStructuredDocument({
                ...document,
                secondaryCta: hasValue ? link : undefined,
            });
        })}
      ${this.renderHomepageFeatureBlocksEditor(document)}
      ${this.renderHomepageCtaBlocksEditor(document)}
    `;
    }
    renderHeroMetricsEditor(document) {
        const canEdit = this.canWriteCurrentRoute();
        return html `
      <section class="card" aria-label="Homepage hero metrics">
        <div class="diff-header">
          <div>
            <h2 class="section-title">Hero metrics</h2>
            <p class="section-copy">
              Short proof points for the landing page aside.
            </p>
          </div>
          <button
            class="action-button"
            ?disabled=${!canEdit}
            type="button"
            @click=${() => {
            this.updateStructuredDocument({
                ...document,
                heroMetrics: [
                    ...document.heroMetrics,
                    { label: "Metric label", value: "Metric value" },
                ],
            });
        }}
          >
            Add metric
          </button>
        </div>
        <ul class="diff-list">
          ${document.heroMetrics.map((metric, index) => html `
              <li class="card">
                <div class="field-grid">
                  ${this.renderStructuredTextField("Label", metric.label, (value) => {
            const nextMetrics = document.heroMetrics.map((entry, entryIndex) => entryIndex === index
                ? { ...entry, label: value }
                : entry);
            this.updateStructuredDocument({
                ...document,
                heroMetrics: nextMetrics,
            });
        })}
                  ${this.renderStructuredTextField("Value", metric.value, (value) => {
            const nextMetrics = document.heroMetrics.map((entry, entryIndex) => entryIndex === index ? { ...entry, value } : entry);
            this.updateStructuredDocument({
                ...document,
                heroMetrics: nextMetrics,
            });
        })}
                </div>
                <button
                  class="action-button"
                  ?disabled=${!canEdit}
                  type="button"
                  @click=${() => {
            this.updateStructuredDocument({
                ...document,
                heroMetrics: document.heroMetrics.filter((_entry, entryIndex) => entryIndex !== index),
            });
        }}
                >
                  Remove metric
                </button>
              </li>
            `)}
          ${document.heroMetrics.length === 0
            ? html `<li class="empty-state">No hero metrics yet.</li>`
            : null}
        </ul>
      </section>
    `;
    }
    renderHomepageLinkEditor(title, link, onChange) {
        return html `
      <section class="card" aria-label=${title}>
        <div>
          <h2 class="section-title">${title}</h2>
          <p class="section-copy">
            These links drive the homepage call-to-action area.
          </p>
        </div>
        <div class="field-grid">
          ${this.renderStructuredTextField("Label", link.label, (value) => {
            onChange({ ...link, label: value });
        })}
          ${this.renderStructuredTextField("Href", link.href, (value) => {
            onChange({ ...link, href: value });
        })}
          ${this.renderStructuredTextField("Description", link.description ?? "", (value) => {
            onChange({
                ...link,
                description: value.trim() || undefined,
            });
        })}
          ${this.renderStructuredToggle("External link", link.external ?? false, (value) => {
            onChange({ ...link, external: value || undefined });
        })}
        </div>
      </section>
    `;
    }
    renderHomepageFeatureBlocksEditor(document) {
        const canEdit = this.canWriteCurrentRoute();
        return html `
      <section class="card" aria-label="Homepage feature blocks">
        <div class="diff-header">
          <div>
            <h2 class="section-title">Feature blocks</h2>
            <p class="section-copy">
              Editorial cards for the main platform story.
            </p>
          </div>
          <button
            class="action-button"
            ?disabled=${!canEdit}
            type="button"
            @click=${() => {
            this.updateStructuredDocument({
                ...document,
                featureBlocks: [
                    ...document.featureBlocks,
                    {
                        eyebrow: "",
                        title: "Feature title",
                        body: "Feature body",
                        bullets: [],
                    },
                ],
            });
        }}
          >
            Add block
          </button>
        </div>
        <ul class="diff-list">
          ${document.featureBlocks.map((feature, index) => html `
              <li class="card">
                <div class="field-grid">
                  ${this.renderStructuredTextField("Eyebrow", feature.eyebrow ?? "", (value) => {
            this.updateStructuredDocument({
                ...document,
                featureBlocks: document.featureBlocks.map((entry, entryIndex) => entryIndex === index
                    ? { ...entry, eyebrow: value.trim() || undefined }
                    : entry),
            });
        })}
                  ${this.renderStructuredTextField("Title", feature.title, (value) => {
            this.updateStructuredDocument({
                ...document,
                featureBlocks: document.featureBlocks.map((entry, entryIndex) => entryIndex === index
                    ? { ...entry, title: value }
                    : entry),
            });
        })}
                  ${this.renderStructuredTextarea("Body", feature.body, (value) => {
            this.updateStructuredDocument({
                ...document,
                featureBlocks: document.featureBlocks.map((entry, entryIndex) => entryIndex === index
                    ? { ...entry, body: value }
                    : entry),
            });
        })}
                  ${this.renderStructuredTextarea("Bullets (one per line)", feature.bullets.join("\n"), (value) => {
            this.updateStructuredDocument({
                ...document,
                featureBlocks: document.featureBlocks.map((entry, entryIndex) => entryIndex === index
                    ? {
                        ...entry,
                        bullets: value
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean),
                    }
                    : entry),
            });
        })}
                </div>
                <button
                  class="action-button"
                  ?disabled=${!canEdit}
                  type="button"
                  @click=${() => {
            this.updateStructuredDocument({
                ...document,
                featureBlocks: document.featureBlocks.filter((_entry, entryIndex) => entryIndex !== index),
            });
        }}
                >
                  Remove block
                </button>
              </li>
            `)}
          ${document.featureBlocks.length === 0
            ? html `<li class="empty-state">No feature blocks yet.</li>`
            : null}
        </ul>
      </section>
    `;
    }
    renderHomepageCtaBlocksEditor(document) {
        const canEdit = this.canWriteCurrentRoute();
        return html `
      <section class="card" aria-label="Homepage call to action blocks">
        <div class="diff-header">
          <div>
            <h2 class="section-title">Call to action blocks</h2>
            <p class="section-copy">
              Secondary conversion blocks for the lower homepage.
            </p>
          </div>
          <button
            class="action-button"
            ?disabled=${!canEdit}
            type="button"
            @click=${() => {
            this.updateStructuredDocument({
                ...document,
                ctaBlocks: [
                    ...document.ctaBlocks,
                    {
                        tone: "default",
                        title: "CTA title",
                        body: "CTA body",
                        link: {
                            label: "Learn more",
                            href: "/docs",
                        },
                    },
                ],
            });
        }}
          >
            Add CTA
          </button>
        </div>
        <ul class="diff-list">
          ${document.ctaBlocks.map((cta, index) => html `
              <li class="card">
                <div class="field-grid">
                  ${this.renderStructuredSelectField("Tone", cta.tone ?? "default", [
            { value: "default", label: "Default" },
            { value: "accent", label: "Accent" },
            { value: "subtle", label: "Subtle" },
        ], (value) => {
            this.updateStructuredDocument({
                ...document,
                ctaBlocks: document.ctaBlocks.map((entry, entryIndex) => entryIndex === index
                    ? {
                        ...entry,
                        tone: value,
                    }
                    : entry),
            });
        })}
                  ${this.renderStructuredTextField("Title", cta.title, (value) => {
            this.updateStructuredDocument({
                ...document,
                ctaBlocks: document.ctaBlocks.map((entry, entryIndex) => entryIndex === index
                    ? { ...entry, title: value }
                    : entry),
            });
        })}
                  ${this.renderStructuredTextarea("Body", cta.body, (value) => {
            this.updateStructuredDocument({
                ...document,
                ctaBlocks: document.ctaBlocks.map((entry, entryIndex) => entryIndex === index
                    ? { ...entry, body: value }
                    : entry),
            });
        })}
                  ${this.renderStructuredTextField("Link label", cta.link.label, (value) => {
            this.updateStructuredDocument({
                ...document,
                ctaBlocks: document.ctaBlocks.map((entry, entryIndex) => entryIndex === index
                    ? {
                        ...entry,
                        link: { ...entry.link, label: value },
                    }
                    : entry),
            });
        })}
                  ${this.renderStructuredTextField("Link href", cta.link.href, (value) => {
            this.updateStructuredDocument({
                ...document,
                ctaBlocks: document.ctaBlocks.map((entry, entryIndex) => entryIndex === index
                    ? {
                        ...entry,
                        link: { ...entry.link, href: value },
                    }
                    : entry),
            });
        })}
                </div>
                <button
                  class="action-button"
                  ?disabled=${!canEdit}
                  type="button"
                  @click=${() => {
            this.updateStructuredDocument({
                ...document,
                ctaBlocks: document.ctaBlocks.filter((_entry, entryIndex) => entryIndex !== index),
            });
        }}
                >
                  Remove CTA
                </button>
              </li>
            `)}
          ${document.ctaBlocks.length === 0
            ? html `<li class="empty-state">No CTA blocks yet.</li>`
            : null}
        </ul>
      </section>
    `;
    }
    renderNavigationItemListEditor(title, links, onChange) {
        const canEdit = this.canWriteCurrentRoute();
        return html `
      <section class="card" aria-label=${title}>
        <div class="diff-header">
          <div>
            <h2 class="section-title">${title}</h2>
            <p class="section-copy">
              Ordered publication links surfaced in the static shell.
            </p>
          </div>
          <button
            class="action-button"
            ?disabled=${!canEdit}
            type="button"
            @click=${() => {
            onChange([
                ...links,
                {
                    label: "New link",
                    href: "/",
                },
            ]);
        }}
          >
            Add link
          </button>
        </div>
        <ul class="diff-list">
          ${links.map((link, index) => html `
              <li class="card">
                <div class="field-grid">
                  ${this.renderStructuredTextField("Label", link.label, (value) => {
            onChange(links.map((entry, entryIndex) => entryIndex === index
                ? { ...entry, label: value }
                : entry));
        })}
                  ${this.renderStructuredTextField("Href", link.href, (value) => {
            onChange(links.map((entry, entryIndex) => entryIndex === index
                ? { ...entry, href: value }
                : entry));
        })}
                  ${this.renderStructuredTextField("Description", link.description ?? "", (value) => {
            onChange(links.map((entry, entryIndex) => entryIndex === index
                ? {
                    ...entry,
                    description: value.trim() || undefined,
                }
                : entry));
        })}
                  ${this.renderStructuredToggle("External", link.external ?? false, (value) => {
            onChange(links.map((entry, entryIndex) => entryIndex === index
                ? { ...entry, external: value || undefined }
                : entry));
        })}
                </div>
                <button
                  class="action-button"
                  ?disabled=${!canEdit}
                  type="button"
                  @click=${() => {
            onChange(links.filter((_entry, entryIndex) => entryIndex !== index));
        }}
                >
                  Remove link
                </button>
              </li>
            `)}
          ${links.length === 0
            ? html `<li class="empty-state">No links configured yet.</li>`
            : null}
        </ul>
      </section>
    `;
    }
    renderMetadataPanel(selectedEntry) {
        const canEdit = this.canWriteCurrentRoute();
        const isPost = selectedEntry?.kind === "post";
        const isDocPage = selectedEntry?.kind === "doc_page";
        const settingsTitle = isPost ? "Post settings" : "Page settings";
        const routeLabel = isPost ? "Post URL" : "Page URL";
        const imageLabel = isPost ? "Feature image" : "Cover image";
        const summaryLabel = isPost ? "Excerpt" : "Summary";
        return html `
      <section
        class="metadata-panel"
        aria-label="Publishing metadata"
        data-parity-region="metadata-drawer"
      >
        <header class="metadata-panel-header">
          <h2 class="metadata-panel-title">${settingsTitle}</h2>
        </header>

        <section class="metadata-panel-section">
          <p class="metadata-panel-kicker">${routeLabel}</p>
          <div class="metadata-panel-link">
            ${this.renderTextField(routeLabel, "slug", this.documentSlug, "text", !canEdit)}
            <p class="metadata-panel-link-prefix">${this.selectedRoute}</p>
          </div>
        </section>

        <section class="metadata-panel-section">
          <div class="field-grid">
            ${this.renderTextField("Publish date", "publishedAt", this.documentPublishedAt, "text", !canEdit)}
            ${this.renderSelectField(isPost ? "Post status" : "Page status", "status", this.documentStatus, [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
        ], !canEdit)}
            ${this.renderTextField("Tags", "tags", this.documentTags, "text", !canEdit)}
            ${isDocPage
            ? this.renderSelectField("Docs section", "sectionId", this.documentSectionId, [
                { value: "", label: "Unsectioned" },
                ...this.docSections
                    .filter((section) => section.id !== "__unsectioned__")
                    .map((section) => ({
                    value: section.id,
                    label: section.title,
                })),
            ], !canEdit)
            : this.renderTextField("Workflow state", "title", labelForWorkflowState(this.machineState.value), "text", true)}
          </div>
        </section>

        <section class="metadata-panel-section">
          <p class="metadata-panel-kicker">${summaryLabel}</p>
          <div class="metadata-form">
            ${this.renderTextareaField(summaryLabel, "summary", this.documentSummary, !canEdit)}
          </div>
        </section>

        <section class="metadata-panel-section">
          <p class="metadata-panel-kicker">Authors</p>
          <div class="field-grid">
            ${this.renderTextField("Author name", "authorName", this.documentAuthorName, "text", !canEdit)}
            ${this.renderTextField("Author role", "authorRole", this.documentAuthorRole, "text", !canEdit)}
          </div>
        </section>

        <section class="metadata-panel-section">
          <p class="metadata-panel-kicker">Advanced</p>
          <div class="field-grid">
            ${isPost || isDocPage
            ? this.renderSelectField(imageLabel, "featureImage", this.documentFeatureImage, [
                { value: "", label: "No image selected" },
                ...this.getFeatureMediaOptions().map((asset) => ({
                    value: asset.path,
                    label: asset.label,
                })),
            ], !canEdit)
            : null}
            ${this.renderTextField("SEO title", "seoTitle", this.documentSeoTitle, "text", !canEdit)}
            ${this.renderTextareaField("SEO description", "seoDescription", this.documentSeoDescription, !canEdit)}
          </div>
        </section>
      </section>
    `;
    }
    renderPreviewSurface(title) {
        return html `
      <section class="card" aria-label="Publishing preview">
        <div class="diff-header">
          <div>
            <p class="eyebrow">Preview</p>
            <h2 class="section-title">${title}</h2>
            <p class="section-copy">
              Rendered through the same local publishing model the static build
              will consume.
            </p>
          </div>
          <button
            class="action-button"
            type="button"
            @click=${() => {
            this.workspaceMode = "write";
        }}
          >
            Back to draft
          </button>
        </div>
        ${this.previewExcerpt.length > 0
            ? html `<div class="summary-pill">
              Excerpt: ${this.previewExcerpt}
            </div>`
            : null}
        <div class="preview-frame">
          ${this.previewHtml.length > 0
            ? unsafeHTML(this.previewHtml)
            : html `<p class="empty-state">
                Generate a preview to inspect the current draft.
              </p>`}
        </div>
      </section>
    `;
    }
    renderReviewSurface() {
        return html `
      <section class="card" aria-label="Publishing review diff">
        <div class="diff-header">
          <div>
            <p class="eyebrow">Review</p>
            <h2 class="section-title">Canonical diff</h2>
            <p class="section-copy">
              Validation, route impact, and file changes are staged here before
              a write.
            </p>
          </div>
          <div class="summary-grid">
            <span class="summary-pill">Diffs: ${this.reviewDiffs.length}</span>
            <span class="summary-pill"
              >Issues: ${this.validationIssues.length}</span
            >
          </div>
        </div>
        ${this.validationIssues.length > 0
            ? html `
              <section class="card" aria-label="Publishing validation issues">
                <div class="diff-header">
                  <div>
                    <p class="eyebrow">Validation</p>
                    <h3 class="section-title">
                      Resolve blocking issues before publish
                    </h3>
                  </div>
                </div>
                <ul class="issue-list" aria-live="polite">
                  ${this.validationIssues.map((issue) => html `
                      <li>
                        <strong>${issue.path}</strong>
                        <div>${issue.message}</div>
                      </li>
                    `)}
                </ul>
              </section>
            `
            : null}
        ${this.reviewDiffs.length > 0
            ? html `
              <ul class="diff-list">
                ${this.reviewDiffs.map((diff) => html `
                    <li class="diff-grid">
                      <strong>${diff.relativePath}</strong>
                      <div class="diff-columns">
                        <div class="diff-frame">
                          <span class="metadata-label">Before</span>
                          <pre class="diff-code">
${diff.before || "New file"}</pre
                          >
                        </div>
                        <div class="diff-frame">
                          <span class="metadata-label">After</span>
                          <pre class="diff-code">${diff.after}</pre>
                        </div>
                      </div>
                    </li>
                  `)}
              </ul>
            `
            : html `<p class="empty-state">
              Run “Review Publish” to inspect the canonical diff.
            </p>`}
      </section>
    `;
    }
    renderPublishSurface() {
        return html `
      <section class="card" aria-label="Publishing publish result">
        <div>
          <p class="eyebrow">Publish</p>
          <h2 class="section-title">Canonical files updated</h2>
          <p class="section-copy">
            ${this.statusMessage.length > 0
            ? this.statusMessage
            : "The publication workspace has written the reviewed canonical files."}
          </p>
        </div>
        <div class="summary-grid">
          <span class="summary-pill">Changes: ${this.reviewDiffs.length}</span>
          <span class="summary-pill"
            >Mode: ${labelForWorkspaceMode(this.workspaceMode)}</span
          >
        </div>
        ${this.reviewDiffs.length > 0
            ? html `
              <ul class="diff-list">
                ${this.reviewDiffs.map((diff) => html `
                    <li>
                      <strong>${diff.relativePath}</strong>
                    </li>
                  `)}
              </ul>
            `
            : null}
      </section>
    `;
    }
    renderStructuredTextField(label, value, onChange, type = "text") {
        const disabled = !this.canWriteCurrentRoute();
        return html `
      <label class="metadata-field">
        <span class="metadata-label">${label}</span>
        <input
          aria-label=${label}
          class="metadata-input"
          ?disabled=${disabled}
          .value=${value}
          @input=${(event) => {
            onChange(event.currentTarget.value);
        }}
          type=${type}
        />
      </label>
    `;
    }
    renderStructuredTextarea(label, value, onChange) {
        const disabled = !this.canWriteCurrentRoute();
        return html `
      <label class="metadata-field" data-span="full">
        <span class="metadata-label">${label}</span>
        <textarea
          aria-label=${label}
          class="metadata-textarea"
          ?disabled=${disabled}
          .value=${value}
          @input=${(event) => {
            onChange(event.currentTarget.value);
        }}
        ></textarea>
      </label>
    `;
    }
    renderStructuredSelectField(label, value, options, onChange) {
        const disabled = !this.canWriteCurrentRoute();
        return html `
      <label class="metadata-field">
        <span class="metadata-label">${label}</span>
        <select
          aria-label=${label}
          class="metadata-select"
          ?disabled=${disabled}
          .value=${value}
          @change=${(event) => {
            onChange(event.currentTarget.value);
        }}
        >
          ${options.map((option) => html `
              <option value=${option.value}>${option.label}</option>
            `)}
        </select>
      </label>
    `;
    }
    renderStructuredToggle(label, checked, onChange) {
        const disabled = !this.canWriteCurrentRoute();
        return html `
      <label class="metadata-field">
        <span class="metadata-label">${label}</span>
        <input
          aria-label=${label}
          class="metadata-input"
          ?disabled=${disabled}
          ?checked=${checked}
          @change=${(event) => {
            onChange(event.currentTarget.checked);
        }}
          type="checkbox"
        />
      </label>
    `;
    }
    getStructuredDocument() {
        const kind = this.entries.find((entry) => entry.route === this.selectedRoute)?.kind;
        if (!kind ||
            (kind !== "site_settings" && kind !== "navigation" && kind !== "homepage")) {
            return null;
        }
        try {
            const parsed = JSON.parse(this.editorContent.value);
            if (parsed.kind !== kind) {
                return null;
            }
            return parsed;
        }
        catch {
            return null;
        }
    }
    getActiveSession() {
        const session = this.session ?? createPublicationSession(this.workspace);
        return {
            ...session,
            license: resolvePublicationLicenseSession(session.license),
        };
    }
    getSessionIdentityLabel() {
        const principal = this.getActiveSession().principal;
        const displayName = principal.displayName.trim();
        return displayName.length > 0 ? displayName : principal.id;
    }
    getSessionRoleLabel() {
        const session = this.getActiveSession();
        const principal = session.principal;
        const walletAddress = principal.walletAddress?.trim().toLowerCase() ?? "";
        const adminPrincipalIds = this.workspace.policy.adminPrincipalIds ?? [];
        const adminWalletAddresses = this.workspace.policy.adminWalletAddresses ?? [];
        const isAdmin = adminPrincipalIds.includes(principal.id) ||
            (walletAddress.length > 0 &&
                adminWalletAddresses.some((candidate) => candidate.trim().toLowerCase() === walletAddress));
        if (isAdmin) {
            return "Admin";
        }
        if (this.hasCapability("content:publish:write")) {
            return "Publisher";
        }
        if (this.hasCapability("content:draft:write") ||
            this.hasCapability("content:config:write")) {
            return "Editor";
        }
        return "Viewer";
    }
    getSessionAccessCue() {
        const session = this.getActiveSession();
        const canDraftWrite = this.hasCapability("content:draft:write");
        const canConfigWrite = this.hasCapability("content:config:write");
        const canPreview = this.hasCapability("content:preview:read");
        const canReview = this.hasCapability("content:review:read");
        const canPublish = this.hasCapability("content:publish:write");
        if (session.license.evaluation === "blocked") {
            return session.license.sessionState === "anonymous"
                ? "License required"
                : "Access blocked";
        }
        if (session.license.evaluation === "authenticated" &&
            !this.hasCapability("content:read")) {
            return "No licensed access";
        }
        if (this.getSessionRoleLabel() === "Admin" &&
            canDraftWrite &&
            canConfigWrite &&
            canPublish) {
            return "Full access";
        }
        if (canPublish) {
            return "Can publish";
        }
        if (canDraftWrite && canConfigWrite) {
            return "Drafts + settings";
        }
        if (canDraftWrite) {
            return "Drafts";
        }
        if (canConfigWrite) {
            return "Settings";
        }
        if (canReview) {
            return "Review only";
        }
        if (canPreview) {
            return "Preview only";
        }
        return "Read only";
    }
    getSessionAccessNote() {
        const session = this.getActiveSession();
        if (session.license.evaluation === "blocked" &&
            typeof session.license.reason === "string" &&
            session.license.reason.length > 0) {
            return session.license.reason;
        }
        if (session.license.evaluation === "authenticated" &&
            !this.hasCapability("content:read") &&
            typeof session.license.reason === "string" &&
            session.license.reason.length > 0) {
            return session.license.reason;
        }
        const selectedKind = this.getSelectedEntryKind() ?? this.inferSelectedEntryKindFromRoute();
        if (this.workspaceMode === "browse") {
            if ((this.browseSurface === "dashboard" ||
                this.browseSurface === "posts" ||
                this.browseSurface === "pages") &&
                !this.hasCapability("content:draft:write")) {
                return "Creating new drafts requires editor access.";
            }
            if (this.browseSurface === "settings" &&
                !this.hasCapability("content:config:write")) {
                return "Settings are view-only in this session.";
            }
            return null;
        }
        if (!this.canWriteCurrentRoute()) {
            if (selectedKind === "homepage" ||
                selectedKind === "site_settings" ||
                selectedKind === "navigation") {
                return "Settings are view-only in this session.";
            }
            return "This draft is read-only in this session.";
        }
        if (this.workflowState === "publish-confirmation" &&
            !this.hasCapability("content:publish:write")) {
            return "Publishing requires publisher access.";
        }
        if (!this.hasCapability("content:review:read") &&
            this.hasCapability("content:preview:read")) {
            return "Publish review requires reviewer access.";
        }
        if (!this.hasCapability("content:preview:read") &&
            !this.hasCapability("content:review:read")) {
            return "Preview and review are unavailable in this session.";
        }
        if (!this.hasCapability("content:publish:write") &&
            this.hasCapability("content:review:read")) {
            return "Publishing requires publisher access.";
        }
        return null;
    }
    renderSessionAccessBadges(layout) {
        return html `
      <div class="session-auth-badges" data-layout=${layout}>
        <span class="summary-pill" data-session-pill="role"
          >${this.getSessionRoleLabel()}</span
        >
        <span class="summary-pill" data-session-pill="access"
          >${this.getSessionAccessCue()}</span
        >
      </div>
    `;
    }
    renderSessionAuthSummary(layout) {
        const note = this.getSessionAccessNote();
        const visibleNote = note === this.statusMessage ? null : note;
        return html `
      <div
        class="session-auth-summary"
        data-layout=${layout}
        data-parity-region="session-auth-summary"
      >
        <p class="session-auth-name">${this.getSessionIdentityLabel()}</p>
        <div class="session-auth-badges">
          <span class="summary-pill" data-session-pill="role"
            >${this.getSessionRoleLabel()}</span
          >
          <span class="summary-pill" data-session-pill="access"
            >${this.getSessionAccessCue()}</span
          >
        </div>
        ${visibleNote
            ? html `<p class="session-auth-note">${visibleNote}</p>`
            : null}
      </div>
    `;
    }
    hasCapability(capability) {
        return hasPublicationCapability(this.getActiveSession(), capability);
    }
    getSelectedEntry() {
        const existingEntry = this.entries.find((entry) => entry.route === this.selectedRoute);
        if (existingEntry) {
            return existingEntry;
        }
        const kind = this.inferSelectedEntryKindFromRoute();
        if (kind !== "post" && kind !== "doc_page") {
            return undefined;
        }
        return {
            kind,
            title: this.documentTitle.trim() ||
                (kind === "doc_page" ? "Untitled page" : "Untitled post"),
            slug: this.documentSlug.trim(),
            route: this.selectedRoute,
            description: this.documentSummary.trim(),
            access: "public",
            status: this.documentStatus,
            publishedAt: this.documentPublishedAt.trim() || undefined,
        };
    }
    getSelectedEntryKind() {
        return (this.getSelectedEntry()?.kind ?? this.inferSelectedEntryKindFromRoute());
    }
    inferSelectedEntryKindFromRoute() {
        if (this.selectedRoute === "/") {
            return "homepage";
        }
        if (this.selectedRoute === "/__studio/site/settings") {
            return "site_settings";
        }
        if (this.selectedRoute === "/__studio/site/navigation") {
            return "navigation";
        }
        if (this.selectedRoute.startsWith("/blog/")) {
            return "post";
        }
        if (this.selectedRoute.startsWith("/docs/")) {
            return "doc_page";
        }
        return null;
    }
    canWriteCurrentRoute() {
        return this.canWriteEntryKind(this.getSelectedEntryKind());
    }
    canWriteEntryKind(kind) {
        if (!kind) {
            return false;
        }
        if (kind === "homepage" ||
            kind === "site_settings" ||
            kind === "navigation") {
            return this.hasCapability("content:config:write");
        }
        if (kind === "post" || kind === "doc_page") {
            return this.hasCapability("content:draft:write");
        }
        return false;
    }
    canWriteEntry(entry) {
        return this.canWriteEntryKind(entry.kind);
    }
    canPreviewEntry(entry) {
        return ((entry.kind === "post" || entry.kind === "doc_page") &&
            this.hasCapability("content:preview:read"));
    }
    getFeatureMediaOptions() {
        return this.media.filter((asset) => asset.mimeType?.startsWith("image/") ??
            /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(asset.path));
    }
    reportCapabilityBlock(message) {
        this.statusMessage = message;
        this.validationIssues = [
            {
                path: this.getActiveSession().license.evaluation === "blocked"
                    ? "license"
                    : "session",
                message,
            },
        ];
    }
    capabilityBlockMessage(capability, fallback) {
        const session = this.getActiveSession();
        if (session.license.evaluation === "blocked" &&
            typeof session.license.reason === "string" &&
            session.license.reason.length > 0) {
            return session.license.reason;
        }
        if (session.license.evaluation === "authenticated") {
            switch (capability) {
                case "content:read":
                    return "Your licensed account does not grant read access.";
                case "content:draft:write":
                    return "Your licensed account does not grant draft access.";
                case "content:preview:read":
                    return "Your licensed account does not grant preview access.";
                case "content:review:read":
                    return "Your licensed account does not grant review access.";
                case "content:publish:write":
                    return "Your licensed account does not grant publish access.";
                case "content:config:write":
                    return "Your licensed account does not grant settings access.";
                default:
                    return fallback;
            }
        }
        return fallback;
    }
    currentWriteBlockMessage() {
        const selectedKind = this.getSelectedEntryKind() ?? this.inferSelectedEntryKindFromRoute();
        if (selectedKind === "homepage" ||
            selectedKind === "site_settings" ||
            selectedKind === "navigation") {
            return this.capabilityBlockMessage("content:config:write", "Settings are view-only in this session.");
        }
        return this.capabilityBlockMessage("content:draft:write", "This draft is read-only in this session.");
    }
    updateStructuredDocument(document) {
        if (!this.canWriteCurrentRoute()) {
            this.reportCapabilityBlock(this.currentWriteBlockMessage());
            return;
        }
        this.applyDraftValue(`${JSON.stringify(document, null, 2)}\n`, {
            emitDraftEvent: true,
            statusMessage: "Structured content updated. Preview or review the diff before publish.",
        });
    }
    applyDraftValue(value, options) {
        this.editorContent.value = value;
        this.draftDirty.value = true;
        this.workspaceMode = "write";
        this.statusMessage = options.statusMessage;
        this.reviewDiffs = [];
        this.previewHtml = "";
        this.previewExcerpt = "";
        this.validationIssues = [];
        this.machine?.send({ type: "DIRTY" });
        if (options.emitDraftEvent) {
            this.emitEvent("publishing-draft-change", {
                value,
                dirty: true,
            });
        }
    }
    updateMetadataField(field, value) {
        switch (field) {
            case "title":
                this.documentTitle = value;
                break;
            case "slug":
                this.documentSlug = value;
                break;
            case "summary":
                this.documentSummary = value;
                break;
            case "featureImage":
                this.documentFeatureImage = value;
                this.featureMediaPickerOpen = false;
                break;
            case "status":
                this.documentStatus = value === "draft" ? "draft" : "published";
                break;
            case "publishedAt":
                this.documentPublishedAt = value;
                break;
            case "tags":
                this.documentTags = value;
                break;
            case "authorName":
                this.documentAuthorName = value;
                break;
            case "authorRole":
                this.documentAuthorRole = value;
                break;
            case "seoTitle":
                this.documentSeoTitle = value;
                break;
            case "seoDescription":
                this.documentSeoDescription = value;
                break;
            case "sectionId":
                this.documentSectionId = value;
                break;
        }
        this.draftDirty.value = true;
        this.workspaceMode = "write";
        this.reviewDiffs = [];
        this.previewHtml = "";
        this.previewExcerpt = "";
        this.validationIssues = [];
        this.statusMessage = "Metadata updated. Review the diff before publish.";
        this.machine?.send({ type: "DIRTY" });
        this.emitEvent("publishing-metadata-change", {
            field,
            value,
        });
    }
    requestBrowseRowPreview(route) {
        if (this.busy) {
            return;
        }
        const entry = this.entries.find((candidate) => candidate.route === route);
        if (!entry || !this.canPreviewEntry(entry)) {
            this.reportCapabilityBlock(this.capabilityBlockMessage("content:preview:read", "Preview is unavailable in this session."));
            return;
        }
        this.emitEvent("publishing-browse-row-preview", { route });
    }
    showTransientFeedback(input) {
        const message = input.message.trim();
        if (message.length === 0) {
            return;
        }
        const revision = ++this.transientFeedbackRevision;
        this.clearTransientFeedbackTimer();
        this.transientFeedback = {
            revision,
            type: input.type,
            message,
        };
        const durationMs = typeof input.durationMs === "number" && input.durationMs > 0
            ? input.durationMs
            : DEFAULT_TRANSIENT_FEEDBACK_DURATION_MS[input.type];
        this.transientFeedbackTimer = globalThis.setTimeout(() => {
            if (this.transientFeedback?.revision !== revision) {
                return;
            }
            this.transientFeedback = null;
            this.transientFeedbackTimer = null;
        }, durationMs);
    }
    presentSiteFallback(input) {
        this.siteFallbackState = this.captureSiteFallbackState(input.source);
        this.accountPopoverOpen = false;
        this.closeSearchOverlay();
        this.tagEditorDraft = null;
        this.workspaceMode = "browse";
        this.browsePanelOpen = true;
        this.browseSurface = "site";
        this.placeholderTitle = "";
        this.statusMessage = input.message;
    }
    openSearchOverlay() {
        this.accountPopoverOpen = false;
        this.searchOverlayOpen = true;
        this.searchOverlayQuery = "";
        this.statusMessage =
            "Quick-open is ready. Search routes or start a new draft.";
        void this.updateComplete.then(() => {
            this.searchOverlayInput?.focus();
            this.searchOverlayInput?.select();
        });
    }
    closeSearchOverlay() {
        this.searchOverlayOpen = false;
        this.searchOverlayQuery = "";
    }
    getQuickOpenOptions() {
        const routeOptions = this.entries.map((entry) => ({
            id: `route:${entry.route}`,
            title: entry.title,
            detail: entry.route,
            badge: entry.kind === "doc_page" ? "page" : entry.kind.replaceAll("_", " "),
            onSelect: () => {
                this.selectRoute(entry.route);
            },
        }));
        const canCreateDrafts = this.hasCapability("content:draft:write");
        const commandOptions = [
            ...(canCreateDrafts
                ? [
                    {
                        id: "create:post",
                        title: "Create new post",
                        detail: "Start a new post draft from the browse shell.",
                        badge: "create",
                        onSelect: () => {
                            this.handleCreateDraftTrigger("post");
                        },
                    },
                    {
                        id: "create:page",
                        title: "Create new page",
                        detail: "Start a new docs-backed page draft.",
                        badge: "create",
                        onSelect: () => {
                            this.handleCreateDraftTrigger("doc_page");
                        },
                    },
                ]
                : []),
            {
                id: "surface:posts",
                title: "Open Posts",
                detail: "Return to the posts collection view.",
                badge: "browse",
                onSelect: () => {
                    this.openBrowseSurface("posts");
                },
            },
            {
                id: "surface:pages",
                title: "Open Pages",
                detail: "Jump to the pages collection view.",
                badge: "browse",
                onSelect: () => {
                    this.openBrowseSurface("pages");
                },
            },
            {
                id: "surface:tags",
                title: "Open Tags",
                detail: "Jump to the tags management view.",
                badge: "browse",
                onSelect: () => {
                    this.openBrowseSurface("tags");
                },
            },
            {
                id: "surface:settings",
                title: "Open Settings",
                detail: "Jump to the publication settings hub.",
                badge: "browse",
                onSelect: () => {
                    this.openBrowseSurface("settings");
                },
            },
        ];
        const query = this.searchOverlayQuery.trim().toLowerCase();
        const combined = [...commandOptions, ...routeOptions];
        if (query.length === 0) {
            return combined.slice(0, 8);
        }
        return combined.filter((option) => `${option.title} ${option.detail} ${option.badge}`
            .toLowerCase()
            .includes(query));
    }
    requestOpenSite(source) {
        this.accountPopoverOpen = false;
        this.closeSearchOverlay();
        this.tagEditorDraft = null;
        this.emitEvent("publishing-open-site", { source });
    }
    captureSiteFallbackState(source) {
        const returnSurface = this.workspaceMode === "browse" && this.browseSurface !== "site"
            ? this.browseSurface
            : this.browseStateForRoute(this.selectedRoute).surface;
        return {
            source,
            returnMode: this.workspaceMode,
            returnSurface,
            returnPostsFilter: this.postsFilter,
        };
    }
    clearSiteFallbackState() {
        this.siteFallbackState = null;
    }
    clearTransientFeedbackTimer() {
        if (this.transientFeedbackTimer === null) {
            return;
        }
        clearTimeout(this.transientFeedbackTimer);
        this.transientFeedbackTimer = null;
    }
    clearTransientFeedback() {
        this.clearTransientFeedbackTimer();
        this.transientFeedback = null;
    }
    openPlaceholderSurface(title, message) {
        this.clearSiteFallbackState();
        this.accountPopoverOpen = false;
        this.closeSearchOverlay();
        this.tagEditorDraft = null;
        this.workspaceMode = "browse";
        this.browsePanelOpen = true;
        this.browseSurface = "placeholder";
        this.placeholderTitle = title;
        this.statusMessage = message;
    }
    ensureTagWriteAccess() {
        if (this.hasCapability("content:draft:write")) {
            return true;
        }
        this.reportCapabilityBlock(this.capabilityBlockMessage("content:draft:write", "Managing tags requires editor access."));
        return false;
    }
    openTagEditor(tag) {
        this.tagEditorDraft = { ...tag };
        this.tagDeleteConfirmOpen = false;
        this.statusMessage = `Editing ${tag.visibility} tag ${tag.label}.`;
    }
    updateTagEditorDraft(updates) {
        const current = this.tagEditorDraft;
        if (!current) {
            return;
        }
        this.tagEditorDraft = {
            ...current,
            ...updates,
        };
    }
    requestNewDraft(kind) {
        this.handleCreateDraftTrigger(kind);
    }
    selectRoute(route) {
        const nextBrowseState = this.browseStateForRoute(route);
        this.clearSiteFallbackState();
        this.selectedRoute = route;
        this.metadataPanelOpen = false;
        this.workspacePanelOpen = false;
        this.browsePanelOpen = false;
        this.accountPopoverOpen = false;
        this.closeSearchOverlay();
        this.tagEditorDraft = null;
        this.browseSurface = nextBrowseState.surface;
        this.postsFilter = nextBrowseState.postsFilter ?? "all";
        this.postsAccessFilter = "all";
        this.pagesAccessFilter = "all";
        this.postsAuthorFilter = ALL_AUTHORS_FILTER_VALUE;
        this.pagesAuthorFilter = ALL_AUTHORS_FILTER_VALUE;
        this.postsTagFilter = ALL_TAGS_FILTER_VALUE;
        this.pagesTagFilter = ALL_TAGS_FILTER_VALUE;
        this.workspaceMode = "write";
        this.emitEvent("publishing-select-route", { route });
    }
    openBrowseSurface(surface, filter = "all") {
        if (surface !== "site") {
            this.clearSiteFallbackState();
        }
        const nextPostsFilter = surface === "posts"
            ? this.normalizeRouteBackedPostsFilter(filter)
            : "all";
        this.workspaceMode = "browse";
        this.browsePanelOpen = true;
        this.accountPopoverOpen = false;
        this.closeSearchOverlay();
        this.tagEditorDraft = null;
        this.browseSurface = surface;
        this.placeholderTitle = "";
        this.postsFilter = nextPostsFilter;
        this.postsAccessFilter =
            surface === "posts" ? this.postsAccessFilter : "all";
        this.pagesAccessFilter =
            surface === "pages" ? this.pagesAccessFilter : "all";
        this.postsAuthorFilter =
            surface === "posts" ? this.postsAuthorFilter : ALL_AUTHORS_FILTER_VALUE;
        this.pagesAuthorFilter =
            surface === "pages" ? this.pagesAuthorFilter : ALL_AUTHORS_FILTER_VALUE;
        this.postsTagFilter =
            surface === "posts" ? this.postsTagFilter : ALL_TAGS_FILTER_VALUE;
        this.pagesTagFilter =
            surface === "pages" ? this.pagesTagFilter : ALL_TAGS_FILTER_VALUE;
        if (surface === "dashboard" ||
            surface === "posts" ||
            surface === "pages" ||
            surface === "tags" ||
            surface === "settings") {
            this.emitEvent("publishing-select-browse-surface", {
                surface,
                ...(surface === "posts" ? { postsFilter: nextPostsFilter } : {}),
            });
        }
    }
    openBrowseSurfaceForCurrentRoute() {
        const nextBrowseState = this.browseStateForRoute(this.selectedRoute);
        this.openBrowseSurface(nextBrowseState.surface, nextBrowseState.postsFilter ?? "all");
    }
    surfaceForRoute(route) {
        return this.browseStateForRoute(route).surface;
    }
    browseStateForRoute(route) {
        const entry = this.entries.find((candidate) => candidate.route === route);
        const kind = entry?.kind ?? this.getSelectedEntryKind();
        if (kind === "post") {
            return {
                surface: "posts",
                postsFilter: publishingStudioPostsBucketForEntry(entry ?? {
                    status: this.documentStatus,
                    publishedAt: this.documentPublishedAt || undefined,
                }),
            };
        }
        if (kind === "doc_page") {
            return { surface: "pages" };
        }
        return { surface: "settings" };
    }
    normalizeRouteBackedPostsFilter(filter) {
        return filter === "all" ? DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET : filter;
    }
    getCurrentPostsBucket() {
        return this.postsFilter === "all"
            ? DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET
            : this.postsFilter;
    }
    getPostsBucketIndex(bucket = this.getCurrentPostsBucket()) {
        return PUBLISHING_STUDIO_POST_BUCKETS.indexOf(bucket);
    }
    labelForPostBucket(bucket, count) {
        const label = bucket === "draft"
            ? "Draft"
            : bucket === "scheduled"
                ? "Scheduled"
                : "Published";
        return typeof count === "number" ? `${label} (${count})` : label;
    }
    buildPostBucketTabs(entries) {
        const now = Date.now();
        return PUBLISHING_STUDIO_POST_BUCKETS.map((bucket) => ({
            bucket,
            count: entries.filter((entry) => publishingStudioPostsBucketForEntry(entry, now) === bucket).length,
        }));
    }
    hasActiveSecondaryFilters(surface) {
        if (surface === "posts") {
            return (this.postsAccessFilter !== "all" ||
                this.postsAuthorFilter !== ALL_AUTHORS_FILTER_VALUE ||
                this.postsTagFilter !== ALL_TAGS_FILTER_VALUE ||
                this.postsSort !== DEFAULT_COLLECTION_SORT);
        }
        return (this.pagesAccessFilter !== "all" ||
            this.pagesAuthorFilter !== ALL_AUTHORS_FILTER_VALUE ||
            this.pagesTagFilter !== ALL_TAGS_FILTER_VALUE ||
            this.pagesSort !== DEFAULT_COLLECTION_SORT);
    }
    clearSecondaryFilters(surface) {
        if (surface === "posts") {
            this.postsAccessFilter = "all";
            this.postsAuthorFilter = ALL_AUTHORS_FILTER_VALUE;
            this.postsTagFilter = ALL_TAGS_FILTER_VALUE;
            this.postsSort = DEFAULT_COLLECTION_SORT;
            return;
        }
        this.pagesAccessFilter = "all";
        this.pagesAuthorFilter = ALL_AUTHORS_FILTER_VALUE;
        this.pagesTagFilter = ALL_TAGS_FILTER_VALUE;
        this.pagesSort = DEFAULT_COLLECTION_SORT;
    }
    buildCollectionEmptyState(options) {
        if (options.visibleEntries.length > 0) {
            return null;
        }
        if (options.scopedEntries.length > 0 &&
            this.hasActiveSecondaryFilters(options.surface)) {
            return {
                kind: "filtered",
                title: options.surface === "posts"
                    ? "No posts match the current filters"
                    : "No pages match the current filters",
                message: options.surface === "posts"
                    ? "Clear filters to show all posts in this view."
                    : "Clear filters to show all pages in this view.",
                actionLabel: "Clear filters",
                onAction: () => {
                    this.clearSecondaryFilters(options.surface);
                },
            };
        }
        if (options.surface === "posts") {
            switch (this.postsFilter) {
                case "draft":
                    return {
                        kind: "unfiltered",
                        title: "No drafts yet",
                        message: "Draft posts will appear here after you start a new post.",
                    };
                case "scheduled":
                    return {
                        kind: "unfiltered",
                        title: "No scheduled posts yet",
                        message: "Scheduled posts appear here when their publish date is in the future.",
                    };
                case "published":
                    return {
                        kind: "unfiltered",
                        title: "No published posts yet",
                        message: "Published posts will appear here after you publish one.",
                    };
                default:
                    return {
                        kind: "unfiltered",
                        title: "No posts yet",
                        message: "Posts will appear here once the collection has content.",
                    };
            }
        }
        return {
            kind: "unfiltered",
            title: "No pages yet",
            message: "Pages will appear here once the collection has content.",
        };
    }
    requestReactiveUpdate() {
        if (!this.suppressReactiveRequest) {
            this.requestUpdate();
        }
    }
    scheduleBrowseCollectionControlSync() {
        if (this.browseControlSyncFrame !== null) {
            cancelAnimationFrame(this.browseControlSyncFrame);
        }
        this.browseControlSyncFrame = requestAnimationFrame(() => {
            this.browseControlSyncFrame = null;
            this.synchronizeBrowseCollectionControls();
        });
    }
    synchronizeBrowseCollectionControls() {
        if (this.workspaceMode !== "browse") {
            return;
        }
        if (this.browseSurface === "posts") {
            this.synchronizeCollectionControlValue("Posts access filter", this.postsAccessFilter);
            this.synchronizeCollectionControlValue("Posts author filter", this.postsAuthorFilter);
            this.synchronizeCollectionControlValue("Posts tag filter", this.postsTagFilter);
            this.synchronizeCollectionControlValue("Posts sort order", this.postsSort);
            return;
        }
        if (this.browseSurface === "pages") {
            this.synchronizeCollectionControlValue("Pages status filter", "all");
            this.synchronizeCollectionControlValue("Pages access filter", this.pagesAccessFilter);
            this.synchronizeCollectionControlValue("Pages author filter", this.pagesAuthorFilter);
            this.synchronizeCollectionControlValue("Pages tag filter", this.pagesTagFilter);
            this.synchronizeCollectionControlValue("Pages sort order", this.pagesSort);
        }
    }
    synchronizeCollectionControlValue(label, value) {
        const control = this.renderRoot.querySelector(`[aria-label=\"${label}\"]`);
        if (!control || control.value === value) {
            return;
        }
        control.value = value;
    }
    syncReactiveState(callback) {
        this.suppressReactiveRequest = true;
        try {
            callback();
        }
        finally {
            this.suppressReactiveRequest = false;
        }
    }
    synchronizeWorkflowState(state) {
        this.machineState.value = state;
        this.machine?.send(eventForWorkflowState(state));
    }
    async initializeMachine() {
        const machine = await createPublishingStudioMachine();
        if (!this.isConnected) {
            machine.dispose();
            return;
        }
        this.machine = machine;
        this.machineState.value = machine.state.value;
        this.unsubscribers.push(machine.state.subscribe((state) => {
            this.machineState.value = state;
        }));
        this.synchronizeWorkflowState(this.workflowState);
    }
    filterEntries(entries, query) {
        const normalized = query.trim().toLowerCase();
        if (normalized.length === 0) {
            return entries;
        }
        return entries.filter((entry) => {
            return (entry.title.toLowerCase().includes(normalized) ||
                entry.route.toLowerCase().includes(normalized) ||
                entry.description.toLowerCase().includes(normalized) ||
                entry.kind.toLowerCase().includes(normalized) ||
                entry.status.toLowerCase().includes(normalized) ||
                entry.sectionTitle?.toLowerCase().includes(normalized));
        });
    }
    filterPostEntries(entries, filter = this.postsFilter) {
        const now = Date.now();
        switch (filter) {
            case "draft":
                return entries.filter((entry) => publishingStudioPostsBucketForEntry(entry, now) === "draft");
            case "scheduled":
                return entries.filter((entry) => publishingStudioPostsBucketForEntry(entry, now) === "scheduled");
            case "published":
                return entries.filter((entry) => publishingStudioPostsBucketForEntry(entry, now) === "published");
            default:
                return entries;
        }
    }
    filterEntriesByAccess(entries, filter) {
        if (filter === "all") {
            return entries;
        }
        return entries.filter((entry) => entry.access === filter);
    }
    filterEntriesByAuthor(entries, filter) {
        if (filter === ALL_AUTHORS_FILTER_VALUE) {
            return entries;
        }
        const normalizedFilter = normalizeAuthorValue(filter);
        if (!normalizedFilter) {
            return entries;
        }
        return entries.filter((entry) => normalizeAuthorValue(entry.authorName)?.toLowerCase() ===
            normalizedFilter.toLowerCase());
    }
    filterEntriesByTag(entries, filter) {
        if (filter === ALL_TAGS_FILTER_VALUE) {
            return entries;
        }
        const normalizedFilter = normalizeTagValue(filter);
        if (!normalizedFilter) {
            return entries;
        }
        const normalizedKey = normalizedFilter.toLowerCase();
        return entries.filter((entry) => entry.tags?.some((tag) => normalizeTagValue(tag)?.toLowerCase() === normalizedKey) ?? false);
    }
    buildAuthorFilterOptions(entries) {
        const options = new Map();
        for (const entry of entries) {
            const authorName = normalizeAuthorValue(entry.authorName);
            if (!authorName) {
                continue;
            }
            const key = authorName.toLowerCase();
            if (!options.has(key)) {
                options.set(key, authorName);
            }
        }
        return [
            { value: ALL_AUTHORS_FILTER_VALUE, label: "All authors" },
            ...[...options.entries()]
                .sort((left, right) => left[1].localeCompare(right[1]))
                .map(([, label]) => ({ value: label, label })),
        ];
    }
    buildTagFilterOptions(entries) {
        const options = new Map();
        for (const entry of entries) {
            for (const tag of entry.tags ?? []) {
                const normalizedTag = normalizeTagValue(tag);
                if (!normalizedTag) {
                    continue;
                }
                const key = normalizedTag.toLowerCase();
                if (!options.has(key)) {
                    options.set(key, normalizedTag);
                }
            }
        }
        return [
            { value: ALL_TAGS_FILTER_VALUE, label: "All tags" },
            ...[...options.entries()]
                .sort((left, right) => left[1].localeCompare(right[1]))
                .map(([, label]) => ({ value: label, label })),
        ];
    }
    sortEntries(entries) {
        return [...entries].sort((left, right) => {
            const leftTime = left.publishedAt
                ? new Date(left.publishedAt).getTime()
                : 0;
            const rightTime = right.publishedAt
                ? new Date(right.publishedAt).getTime()
                : 0;
            return rightTime - leftTime;
        });
    }
    sortCollectionEntries(entries, sort) {
        return entries
            .map((entry, index) => ({ entry, index }))
            .sort((left, right) => {
            switch (sort) {
                case "oldest":
                    return (comparePublishingEntryTimestamp(left.entry) -
                        comparePublishingEntryTimestamp(right.entry) ||
                        left.index - right.index);
                case "title-asc":
                    return (left.entry.title.localeCompare(right.entry.title, undefined, {
                        sensitivity: "base",
                    }) || left.index - right.index);
                case "title-desc":
                    return (right.entry.title.localeCompare(left.entry.title, undefined, {
                        sensitivity: "base",
                    }) || left.index - right.index);
                case "newest":
                default:
                    return (comparePublishingEntryTimestamp(right.entry) -
                        comparePublishingEntryTimestamp(left.entry) ||
                        left.index - right.index);
            }
        })
            .map(({ entry }) => entry);
    }
    renderTextField(label, field, value, type = "text", disabled = false) {
        return html `
      <label class="metadata-field">
        <span class="metadata-label">${label}</span>
        <input
          aria-label=${label}
          class="metadata-input"
          data-field=${field}
          ?disabled=${disabled}
          .value=${value}
          @input=${this.handleMetadataInput}
          type=${type}
        />
      </label>
    `;
    }
    renderTextareaField(label, field, value, disabled = false) {
        return html `
      <label class="metadata-field" data-span="full">
        <span class="metadata-label">${label}</span>
        <textarea
          aria-label=${label}
          class="metadata-textarea"
          data-field=${field}
          ?disabled=${disabled}
          .value=${value}
          @input=${this.handleMetadataInput}
        ></textarea>
      </label>
    `;
    }
    renderSelectField(label, field, value, options, disabled = false) {
        return html `
      <label class="metadata-field">
        <span class="metadata-label">${label}</span>
        <select
          aria-label=${label}
          class="metadata-select"
          data-field=${field}
          ?disabled=${disabled}
          .value=${value}
          @change=${this.handleMetadataInput}
        >
          ${options.map((option) => html `
              <option value=${option.value}>${option.label}</option>
            `)}
        </select>
      </label>
    `;
    }
};
__decorate([
    property()
], KitPublishingStudio.prototype, "title", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "workspace", void 0);
__decorate([
    property({ attribute: "workspace-mode", reflect: true })
], KitPublishingStudio.prototype, "workspaceMode", void 0);
__decorate([
    property({ attribute: "browse-surface", reflect: true })
], KitPublishingStudio.prototype, "browseSurface", void 0);
__decorate([
    property({ attribute: "posts-filter", reflect: true })
], KitPublishingStudio.prototype, "postsFilter", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "entries", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "media", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "docSections", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "tags", void 0);
__decorate([
    property({ attribute: "document-title" })
], KitPublishingStudio.prototype, "documentTitle", void 0);
__decorate([
    property({ attribute: "document-slug" })
], KitPublishingStudio.prototype, "documentSlug", void 0);
__decorate([
    property({ attribute: "document-summary" })
], KitPublishingStudio.prototype, "documentSummary", void 0);
__decorate([
    property({ attribute: "document-feature-image" })
], KitPublishingStudio.prototype, "documentFeatureImage", void 0);
__decorate([
    property({ attribute: "document-status" })
], KitPublishingStudio.prototype, "documentStatus", void 0);
__decorate([
    property({ attribute: "document-published-at" })
], KitPublishingStudio.prototype, "documentPublishedAt", void 0);
__decorate([
    property({ attribute: "document-tags" })
], KitPublishingStudio.prototype, "documentTags", void 0);
__decorate([
    property({ attribute: "document-author-name" })
], KitPublishingStudio.prototype, "documentAuthorName", void 0);
__decorate([
    property({ attribute: "document-author-role" })
], KitPublishingStudio.prototype, "documentAuthorRole", void 0);
__decorate([
    property({ attribute: "document-seo-title" })
], KitPublishingStudio.prototype, "documentSeoTitle", void 0);
__decorate([
    property({ attribute: "document-seo-description" })
], KitPublishingStudio.prototype, "documentSeoDescription", void 0);
__decorate([
    property({ attribute: "document-section-id" })
], KitPublishingStudio.prototype, "documentSectionId", void 0);
__decorate([
    property({ attribute: "selected-route", reflect: true })
], KitPublishingStudio.prototype, "selectedRoute", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "editorAdapter", void 0);
__decorate([
    property({ attribute: "editor-kind" })
], KitPublishingStudio.prototype, "editorKind", void 0);
__decorate([
    property({ type: Boolean, attribute: "editor-insert-palette-open" })
], KitPublishingStudio.prototype, "editorInsertPaletteOpen", void 0);
__decorate([
    property()
], KitPublishingStudio.prototype, "contentValue", void 0);
__decorate([
    property()
], KitPublishingStudio.prototype, "previewHtml", void 0);
__decorate([
    property({ attribute: "preview-excerpt" })
], KitPublishingStudio.prototype, "previewExcerpt", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "reviewDiffs", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "validationIssues", void 0);
__decorate([
    property({ attribute: "workflow-state", reflect: true })
], KitPublishingStudio.prototype, "workflowState", void 0);
__decorate([
    property({ attribute: "status-message" })
], KitPublishingStudio.prototype, "statusMessage", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingStudio.prototype, "busy", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], KitPublishingStudio.prototype, "ready", void 0);
__decorate([
    property({ type: Boolean, attribute: "metadata-panel-open", reflect: true })
], KitPublishingStudio.prototype, "metadataPanelOpen", void 0);
__decorate([
    property({ type: Boolean, attribute: "workspace-panel-open", reflect: true })
], KitPublishingStudio.prototype, "workspacePanelOpen", void 0);
__decorate([
    property({ type: Boolean, attribute: "browse-panel-open", reflect: true })
], KitPublishingStudio.prototype, "browsePanelOpen", void 0);
__decorate([
    property({ type: Boolean, attribute: "account-popover-open", reflect: true })
], KitPublishingStudio.prototype, "accountPopoverOpen", void 0);
__decorate([
    property({ type: Boolean, attribute: "search-overlay-open", reflect: true })
], KitPublishingStudio.prototype, "searchOverlayOpen", void 0);
__decorate([
    property({ type: Boolean, attribute: "dark-theme", reflect: true })
], KitPublishingStudio.prototype, "darkTheme", void 0);
__decorate([
    property({ attribute: false })
], KitPublishingStudio.prototype, "session", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "editorExternalSyncGeneration", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "searchOverlayQuery", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "featureMediaPickerOpen", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "postsAccessFilter", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "pagesAccessFilter", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "postsAuthorFilter", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "pagesAuthorFilter", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "postsTagFilter", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "pagesTagFilter", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "postsSort", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "pagesSort", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "tagEditorDraft", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "tagDeleteConfirmOpen", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "activeTagVisibility", void 0);
__decorate([
    property({ attribute: "placeholder-title" })
], KitPublishingStudio.prototype, "placeholderTitle", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "siteFallbackState", void 0);
__decorate([
    state()
], KitPublishingStudio.prototype, "transientFeedback", void 0);
__decorate([
    query("kit-publishing-editor-surface")
], KitPublishingStudio.prototype, "editorSurface", void 0);
__decorate([
    query(".feature-media-entry")
], KitPublishingStudio.prototype, "featureMediaEntry", void 0);
__decorate([
    query(".search-overlay-input")
], KitPublishingStudio.prototype, "searchOverlayInput", void 0);
KitPublishingStudio = __decorate([
    customElement("kit-publishing-studio")
], KitPublishingStudio);
export { KitPublishingStudio };
function labelForWorkflowState(state) {
    switch (state) {
        case "idle":
            return "Idle";
        case "draft":
            return "Draft";
        case "dirty":
            return "Dirty";
        case "validating":
            return "Validating";
        case "preview-ready":
            return "Preview ready";
        case "publish-blocked":
            return "Publish blocked";
        case "publish-confirmation":
            return "Ready to publish";
        case "publish-succeeded":
            return "Publish succeeded";
        case "error":
            return "Error";
    }
}
function labelForWorkspaceMode(state) {
    switch (state) {
        case "browse":
            return "Browse";
        case "write":
            return "Write";
        case "preview":
            return "Preview";
        case "review":
            return "Review";
        case "publish":
            return "Publish";
    }
}
function formatDateLabel(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}
const ALL_AUTHORS_FILTER_VALUE = "__all_authors__";
const ALL_TAGS_FILTER_VALUE = "__all_tags__";
const DEFAULT_COLLECTION_SORT = "newest";
const collectionAccessFilterOptions = [
    { value: "all", label: "All access" },
    { value: "public", label: "Public access" },
    { value: "members", label: "Members only" },
    { value: "paid_members", label: "Paid members only" },
];
const collectionSortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "title-asc", label: "Title A-Z" },
    { value: "title-desc", label: "Title Z-A" },
];
function isGhostPostFilter(value) {
    return (value === "all" ||
        value === "draft" ||
        value === "scheduled" ||
        value === "published");
}
function isGhostAccessFilter(value) {
    return (value === "all" ||
        value === "public" ||
        value === "members" ||
        value === "paid_members");
}
function isGhostCollectionSort(value) {
    return (value === "newest" ||
        value === "oldest" ||
        value === "title-asc" ||
        value === "title-desc");
}
function labelForPublishingAccess(value) {
    switch (value) {
        case "public":
            return "Public access";
        case "members":
            return "Members only";
        case "paid_members":
            return "Paid members only";
    }
}
function normalizeAuthorValue(value) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
}
function normalizeTagValue(value) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
}
function normalizePublishingTagLabel(value) {
    const normalized = value.trim().replace(/^#+/, "").trim();
    return normalized.length > 0 ? normalized : undefined;
}
function summarizePublishingTags(entries) {
    const summaries = new Map();
    for (const entry of entries) {
        if (entry.kind !== "post" && entry.kind !== "doc_page") {
            continue;
        }
        for (const rawTag of entry.tags ?? []) {
            const label = normalizePublishingTagLabel(rawTag);
            if (!label) {
                continue;
            }
            const visibility = rawTag
                .trim()
                .startsWith("#")
                ? "internal"
                : "public";
            const key = `${visibility}:${slugForTagLabel(label)}`;
            const current = summaries.get(key);
            const publishedAtTimestamp = entry.publishedAt
                ? new Date(entry.publishedAt).getTime()
                : undefined;
            const currentLastPublishedAtTimestamp = current?.lastPublishedAtTimestamp;
            const useEntryPublishedAt = publishedAtTimestamp !== undefined &&
                Number.isFinite(publishedAtTimestamp) &&
                (currentLastPublishedAtTimestamp === undefined ||
                    publishedAtTimestamp > currentLastPublishedAtTimestamp);
            const nextLastPublishedAt = useEntryPublishedAt
                ? entry.publishedAt
                : current?.lastPublishedAt;
            const nextLastPublishedAtTimestamp = useEntryPublishedAt
                ? publishedAtTimestamp
                : currentLastPublishedAtTimestamp;
            summaries.set(key, {
                label,
                visibility,
                uses: (current?.uses ?? 0) + 1,
                postCount: (current?.postCount ?? 0) + (entry.kind === "post" ? 1 : 0),
                pageCount: (current?.pageCount ?? 0) + (entry.kind === "doc_page" ? 1 : 0),
                ...(nextLastPublishedAt
                    ? { lastPublishedAt: nextLastPublishedAt }
                    : {}),
                ...(nextLastPublishedAtTimestamp
                    ? { lastPublishedAtTimestamp: nextLastPublishedAtTimestamp }
                    : {}),
            });
        }
    }
    return [...summaries.values()]
        .map(({ lastPublishedAtTimestamp: _lastPublishedAtTimestamp, ...summary }) => summary)
        .sort(comparePublishingTagSummaries);
}
function comparePublishingTagSummaries(left, right) {
    if (left.visibility !== right.visibility) {
        return left.visibility === "public" ? -1 : 1;
    }
    return left.label.localeCompare(right.label, undefined, {
        sensitivity: "base",
    });
}
function createPublishingTagRecord(summary, document) {
    const label = document?.label ?? summary?.label ?? "Untitled tag";
    const visibility = document?.visibility ?? summary?.visibility ?? "public";
    const slug = slugForTagLabel(document?.slug ?? summary?.label ?? label) || "tag";
    return {
        id: `tag:${visibility}:${slug}`,
        label,
        slug,
        visibility,
        description: document?.description ?? "",
        color: normalizeTagColor(document?.color ?? "#111827"),
        featureImage: document?.featureImage ?? "",
        seoTitle: document?.seo?.title ?? "",
        seoDescription: document?.seo?.description ?? "",
        ogImage: document?.ogImage ?? "",
        codeInjectionHead: document?.codeInjectionHead ?? "",
        codeInjectionFoot: document?.codeInjectionFoot ?? "",
        uses: summary?.uses ?? 0,
        postCount: summary?.postCount ?? 0,
        pageCount: summary?.pageCount ?? 0,
        ...(summary?.lastPublishedAt
            ? { lastPublishedAt: summary.lastPublishedAt }
            : {}),
        sourceSlug: slug,
        slugEdited: slug !== slugForTagLabel(label),
    };
}
function mergePublishingTagRecords(summaries, documents) {
    const records = new Map();
    const summariesByKey = new Map();
    for (const summary of summaries) {
        summariesByKey.set(tagKey(summary.visibility, slugForTagLabel(summary.label) || "tag"), summary);
    }
    for (const document of documents) {
        const visibility = document.visibility ?? "public";
        const slug = slugForTagLabel(document.slug) || "tag";
        const key = tagKey(visibility, slug);
        records.set(key, createPublishingTagRecord(summariesByKey.get(key), document));
    }
    for (const [key, summary] of summariesByKey) {
        if (!records.has(key)) {
            records.set(key, createPublishingTagRecord(summary));
        }
    }
    return [...records.values()].sort(comparePublishingTagRecords);
}
function comparePublishingTagRecords(left, right) {
    if (left.visibility !== right.visibility) {
        return left.visibility === "public" ? -1 : 1;
    }
    return (left.label.localeCompare(right.label, undefined, {
        sensitivity: "base",
    }) ||
        left.slug.localeCompare(right.slug, undefined, {
            sensitivity: "base",
        }));
}
function slugForTagLabel(value) {
    return (normalizePublishingTagLabel(value)
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ?? "");
}
function normalizeTagColor(value) {
    const trimmed = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    return "#111827";
}
function ensureUniqueTagSlug(value, taken) {
    const base = slugForTagLabel(value) || "tag";
    if (!taken.has(base)) {
        return base;
    }
    let index = 2;
    let candidate = `${base}-${index}`;
    while (taken.has(candidate)) {
        index += 1;
        candidate = `${base}-${index}`;
    }
    return candidate;
}
function createEmptyPublishingTagRecord(visibility) {
    const draftId = globalThis.crypto?.randomUUID?.() ??
        `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return {
        id: `tag:${visibility}:${draftId}`,
        label: "",
        slug: "",
        visibility,
        description: "",
        color: "#111827",
        featureImage: "",
        seoTitle: "",
        seoDescription: "",
        ogImage: "",
        codeInjectionHead: "",
        codeInjectionFoot: "",
        uses: 0,
        postCount: 0,
        pageCount: 0,
        slugEdited: false,
    };
}
function documentForPublishingTagRecord(record) {
    return {
        kind: "tag",
        label: record.label,
        slug: record.slug,
        description: record.description.trim() || undefined,
        visibility: record.visibility,
        color: normalizeTagColor(record.color),
        featureImage: record.featureImage.trim() || undefined,
        seo: record.seoTitle.trim().length > 0 ||
            record.seoDescription.trim().length > 0
            ? {
                title: record.seoTitle.trim() || undefined,
                description: record.seoDescription.trim() || undefined,
            }
            : undefined,
        ogImage: record.ogImage.trim() || undefined,
        codeInjectionHead: record.codeInjectionHead.trim() || undefined,
        codeInjectionFoot: record.codeInjectionFoot.trim() || undefined,
    };
}
function sourcePathForTagSlug(slug) {
    return `content/tags/${slugForTagLabel(slug) || "tag"}.json`;
}
function tagKey(visibility, slug) {
    return `${visibility}:${slug}`;
}
function findPublishingTagSummary(entries, document) {
    const visibility = document.visibility ?? "public";
    const slug = slugForTagLabel(document.slug) || "tag";
    return summarizePublishingTags(entries).find((summary) => tagKey(summary.visibility, slugForTagLabel(summary.label) || "tag") ===
        tagKey(visibility, slug));
}
function comparePublishingEntryTimestamp(entry) {
    const timestamp = entry.publishedAt
        ? new Date(entry.publishedAt).getTime()
        : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
}
function resolvePublicationLicenseSession(license) {
    return {
        ...DEFAULT_PUBLICATION_LICENSE_SESSION,
        ...license,
        mode: license?.mode ?? DEFAULT_PUBLICATION_LICENSE_SESSION.mode,
        evaluation: license?.evaluation ?? DEFAULT_PUBLICATION_LICENSE_SESSION.evaluation,
        sessionState: license?.sessionState ?? DEFAULT_PUBLICATION_LICENSE_SESSION.sessionState,
        grantedBundleIds: license?.grantedBundleIds ??
            DEFAULT_PUBLICATION_LICENSE_SESSION.grantedBundleIds,
        grantedCapabilityIds: license?.grantedCapabilityIds ??
            DEFAULT_PUBLICATION_LICENSE_SESSION.grantedCapabilityIds,
        mappedCapabilities: license?.mappedCapabilities ??
            DEFAULT_PUBLICATION_LICENSE_SESSION.mappedCapabilities,
        matchedTierIds: license?.matchedTierIds ??
            DEFAULT_PUBLICATION_LICENSE_SESSION.matchedTierIds,
        matchedPartnerIds: license?.matchedPartnerIds ??
            DEFAULT_PUBLICATION_LICENSE_SESSION.matchedPartnerIds,
        sources: license?.sources ?? DEFAULT_PUBLICATION_LICENSE_SESSION.sources,
    };
}
function initialsForLabel(value) {
    const parts = value
        .trim()
        .split(/\s+/)
        .filter((part) => part.length > 0)
        .slice(0, 2);
    if (parts.length === 0) {
        return "PU";
    }
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}
function publicationBrandInitial(value) {
    const candidate = initialsForLabel(value).match(/[A-Z0-9]/)?.[0];
    return candidate ?? "P";
}
function renderGhostShellIcon(icon) {
    switch (icon) {
        case "search":
            return svgIcon(html `<circle cx="7.25" cy="7.25" r="4.5"></circle
          ><path d="M10.8 10.8 14 14"></path>`);
        case "dashboard":
            return svgIcon(html `<path d="M3 6.2 8 2l5 4.2"></path
          ><path d="M4.5 5.7v7h7v-7"></path>`);
        case "external":
            return svgIcon(html `<path d="M2.5 3.5h11v9h-11z"></path><path d="M2.5 7.9h11"></path
          ><path d="M6.4 3.5v9"></path>`);
        case "posts":
            return svgIcon(html `<path d="M3.3 11.8h6.9"></path><path d="M4.5 11.8V5.2"></path
          ><path d="M10.5 3.5h2v8.3h-8"></path
          ><path d="M9 3.5H4.5v8.3"></path>`);
        case "pages":
            return svgIcon(html `<path d="M4 2.8h6.3L13 5.5v7.7H6.7L4 10.5z"></path
          ><path d="M10.3 2.8v2.7H13"></path>`);
        case "tags":
            return svgIcon(html `<path d="M3 7.2V3.5h3.7l5.8 5.8-3.7 3.7z"></path
          ><circle
            cx="5.4"
            cy="5.5"
            r="0.8"
            fill="currentColor"
            stroke="none"
          ></circle>`);
        case "members":
            return svgIcon(html `<circle cx="5.5" cy="6" r="2.2"></circle
          ><circle cx="10.7" cy="6.8" r="1.8"></circle
          ><path d="M2.8 12.7c.5-1.8 1.9-3 4-3 2.2 0 3.7 1.2 4.2 3"></path>`);
        case "settings":
            return svgIcon(html `<circle cx="8" cy="8" r="2.3"></circle><path d="M8 2.6v1.6"></path
          ><path d="M8 11.8v1.6"></path><path d="m4.2 4.2 1.1 1.1"></path
          ><path d="m10.7 10.7 1.1 1.1"></path><path d="M2.6 8h1.6"></path
          ><path d="M11.8 8h1.6"></path><path d="m4.2 11.8 1.1-1.1"></path
          ><path d="m10.7 5.3 1.1-1.1"></path>`);
        case "chevron-down":
            return svgIcon(html `<path d="m4.1 6.2 3.9 3.9 3.9-3.9"></path>`);
        case "chevron-right":
            return svgIcon(html `<path d="m6.1 4.1 3.9 3.9-3.9 3.9"></path>`);
        case "design":
            return svgIcon(html `<path d="M4.2 11.8 11.8 4.2"></path
          ><path d="m7.1 3.4 5.5 5.5"></path
          ><path d="m4.2 11.8-.8 2.3 2.3-.8"></path>`);
        case "navigation":
            return svgIcon(html `<circle cx="8" cy="8" r="5.6"></circle
          ><path d="m6.1 7.1 4.3-1.8-1.8 4.3-1.1-1.1z"></path>`);
        case "staff":
            return svgIcon(html `<circle cx="6.1" cy="5.3" r="2"></circle
          ><path d="M2.9 12.6c.4-1.7 1.8-2.8 3.7-2.8"></path
          ><path d="M10.2 4.3c1.3.2 2.3 1.2 2.5 2.5"></path
          ><path d="M9.6 10.1c1.4.3 2.5 1.2 3 2.5"></path>`);
        case "membership":
            return svgIcon(html `<circle cx="5.2" cy="6.1" r="2.1"></circle
          ><circle cx="10.6" cy="6.1" r="2.1"></circle
          ><path d="M2.7 12.4c.4-1.7 1.8-2.8 3.9-2.8"></path
          ><path d="M9.5 9.6c2.1 0 3.5 1.1 3.9 2.8"></path>`);
        case "newsletter":
            return svgIcon(html `<path d="M2.8 4.2h10.4v7.6H2.8z"></path
          ><path d="m3.3 4.8 4.7 3.7 4.7-3.7"></path>`);
        case "integrations":
            return svgIcon(html `<path d="M8 2.8 12.5 5.3v5L8 12.8l-4.5-2.5v-5z"></path
          ><path d="M3.5 5.3 8 7.8l4.5-2.5"></path>`);
        case "code":
            return svgIcon(html `<path d="m5.8 4.1-3.2 3.8 3.2 3.8"></path
          ><path d="m10.2 4.1 3.2 3.8-3.2 3.8"></path>`);
        case "labs":
            return svgIcon(html `<path d="M6 2.8h4"></path
          ><path
            d="M7 2.8v3.1l-3.2 5.5a1.6 1.6 0 0 0 1.4 2.4h5.6a1.6 1.6 0 0 0 1.4-2.4L9 5.9V2.8"
          ></path
          ><path d="M5.8 10.1h4.4"></path>`);
        case "theme-sun":
            return svgIcon(html `<circle cx="8" cy="8" r="2.5"></circle><path d="M8 1.8v1.7"></path
          ><path d="M8 12.5v1.7"></path><path d="m3.6 3.6 1.2 1.2"></path
          ><path d="m11.2 11.2 1.2 1.2"></path><path d="M1.8 8h1.7"></path
          ><path d="M12.5 8h1.7"></path><path d="m3.6 12.4 1.2-1.2"></path
          ><path d="m11.2 4.8 1.2-1.2"></path>`);
        case "theme-moon":
            return svgIcon(html `<path
          d="M10.9 2.8a5.3 5.3 0 1 0 2.3 9.9A5.9 5.9 0 0 1 10.9 2.8Z"
        ></path>`);
    }
}
function svgIcon(content) {
    return html `<svg class="icon-svg" viewBox="0 0 16 16" aria-hidden="true">
    ${content}
  </svg>`;
}
