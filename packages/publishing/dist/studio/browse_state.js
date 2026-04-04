export const DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET = "published";
export function isPublishingStudioPostsBucket(value) {
    return value === "draft" || value === "published" || value === "scheduled";
}
export function publishingStudioPostsBucketForEntry(entry, now = Date.now()) {
    if (entry.status === "draft") {
        return "draft";
    }
    if (typeof entry.publishedAt === "string" && entry.publishedAt.length > 0) {
        const publishedAt = new Date(entry.publishedAt).getTime();
        if (Number.isFinite(publishedAt) && publishedAt > now) {
            return "scheduled";
        }
    }
    return DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET;
}
