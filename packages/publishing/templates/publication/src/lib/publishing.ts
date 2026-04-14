import { loadAstroPublishingSnapshot } from "@citadelfoundation/kit-publishing/astro";
import type {
  DocPageDocument,
  DocSectionDocument,
  HomepageDocument,
  NavigationDocument,
  PostDocument,
  SiteSettingsDocument,
} from "@citadelfoundation/kit-publishing/types";

export interface DocsPageWithSection extends DocPageDocument {
  readonly section: DocSectionDocument;
}

export interface DocsTreeSection extends DocSectionDocument {
  readonly pages: readonly DocsPageWithSection[];
}

export interface SiteContent {
  readonly siteSettings: SiteSettingsDocument;
  readonly navigation: NavigationDocument;
  readonly homepage: HomepageDocument;
  readonly posts: readonly PostDocument[];
  readonly docsSections: readonly DocSectionDocument[];
  readonly docsPages: readonly DocsPageWithSection[];
}

const projectRoot = process.cwd();
let siteContentPromise: Promise<SiteContent> | null = null;

function sortPosts(posts: readonly PostDocument[]): readonly PostDocument[] {
  return [...posts].sort((left, right) => {
    const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
    const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
    return rightTime - leftTime || left.title.localeCompare(right.title);
  });
}

function sortSections(
  sections: readonly DocSectionDocument[],
): readonly DocSectionDocument[] {
  return [...sections].sort(
    (left, right) =>
      left.order - right.order || left.title.localeCompare(right.title),
  );
}

function fallbackSectionForPage(page: DocPageDocument): DocSectionDocument {
  const sectionId = page.sectionId ?? "docs";

  return {
    kind: "doc_section",
    id: sectionId,
    title: "Documentation",
    slug: sectionId,
    description: "Project documentation",
    order: Number.MAX_SAFE_INTEGER,
    version: page.version,
  };
}

function sortDocsPages(
  pages: readonly DocsPageWithSection[],
): readonly DocsPageWithSection[] {
  return [...pages].sort((left, right) => {
    if (left.section.order !== right.section.order) {
      return left.section.order - right.section.order;
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.title.localeCompare(right.title);
  });
}

async function loadSiteContent(): Promise<SiteContent> {
  const snapshot = await loadAstroPublishingSnapshot(projectRoot);
  if (!snapshot.success) {
    throw new Error(snapshot.error.reason);
  }

  const sectionById = new Map(
    snapshot.value.docSections.map((section) => [section.id, section] as const),
  );

  const docsPages = sortDocsPages(
    snapshot.value.docPages.map((page) => ({
      ...page,
      section: page.sectionId
        ? (sectionById.get(page.sectionId) ?? fallbackSectionForPage(page))
        : fallbackSectionForPage(page),
    })),
  );

  return {
    siteSettings: snapshot.value.siteSettings,
    navigation: snapshot.value.navigation,
    homepage: snapshot.value.homepage,
    posts: sortPosts(snapshot.value.posts),
    docsSections: sortSections(snapshot.value.docSections),
    docsPages,
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!siteContentPromise) {
    siteContentPromise = loadSiteContent();
  }

  return siteContentPromise;
}

export async function getSiteSettings(): Promise<SiteSettingsDocument> {
  return (await getSiteContent()).siteSettings;
}

export async function getNavigation(): Promise<NavigationDocument> {
  return (await getSiteContent()).navigation;
}

export async function getHomepage(): Promise<HomepageDocument> {
  return (await getSiteContent()).homepage;
}

export async function getPosts(): Promise<readonly PostDocument[]> {
  return (await getSiteContent()).posts;
}

export async function getLatestPosts(
  limit = 3,
): Promise<readonly PostDocument[]> {
  return (await getPosts()).slice(0, limit);
}

export async function getPostBySlug(
  slug: string,
): Promise<PostDocument | null> {
  return (await getPosts()).find((post) => post.slug === slug) ?? null;
}

export async function getDocsSections(): Promise<readonly DocsTreeSection[]> {
  const { docsSections, docsPages } = await getSiteContent();

  return docsSections
    .map((section) => ({
      ...section,
      pages: docsPages.filter((page) => page.section.id === section.id),
    }))
    .filter((section) => section.pages.length > 0);
}

export async function getDocsPageBySlug(
  slug: string,
): Promise<DocsPageWithSection | null> {
  return (
    (await getSiteContent()).docsPages.find((page) => page.slug === slug) ??
    null
  );
}
