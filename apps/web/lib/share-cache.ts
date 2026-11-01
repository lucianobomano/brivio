import { revalidateTag, updateTag } from "next/cache"

/** Cache tag for the public roadmap share pages (/share/[assetId]/roadmap) */
export const SHARE_ROADMAP_TAG = "share-roadmap"

/**
 * Expire the cached public roadmap data after a mutation to projects, stages, tasks,
 * notes, meetings or brands. updateTag gives read-your-own-writes inside server actions;
 * outside them (route handlers) it throws, so fall back to revalidateTag.
 */
export function invalidateShareRoadmap() {
    try {
        updateTag(SHARE_ROADMAP_TAG)
    } catch {
        revalidateTag(SHARE_ROADMAP_TAG, "max")
    }
}
