/**
 * Simple offline utility to handle image caching via the Cache API.
 */

const CACHE_NAME = 'updock-images-v1';

export async function cacheSpotImages(imageUrls: string[] | null | undefined) {
    if (!imageUrls || imageUrls.length === 0) return;

    try {
        const cache = await caches.open(CACHE_NAME);
        // Only cache if not already in cache to save bandwidth/storage
        for (const url of imageUrls) {
            const response = await cache.match(url);
            if (!response) {
                // Use fetch to get the image and then put it in cache
                // This is better than cache.add for error handling
                try {
                    const fetchResponse = await fetch(url, { mode: 'cors' });
                    if (fetchResponse.ok) {
                        await cache.put(url, fetchResponse);
                    }
                } catch (e) {
                    console.error(`[Offline] Failed to fetch image for cache: ${url}`, e);
                }
            }
        }
    } catch (error) {
        console.error('[Offline] Cache API error:', error);
    }
}

/**
 * Cleanup old caches (standard maintenance)
 */
export async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
        if (name !== CACHE_NAME) {
            await caches.delete(name);
        }
    }
}
