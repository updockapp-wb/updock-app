/**
 * Simple offline utility to handle image caching via the Cache API.
 */

const CACHE_NAME = 'updock-images-v1';

export async function cacheSpotImages(imageUrls: string[] | null | undefined) {
    if (!imageUrls || imageUrls.length === 0) return;

    try {
        const cache = await caches.open(CACHE_NAME);
        // Cache toutes les URLs en parallèle (D-02) : le for-await série bloquait chaque
        // image derrière la précédente. Le try/catch par URL est conservé pour qu'un échec
        // n'interrompe pas le lot ; la clé de cache et la forme de stockage sont inchangées.
        await Promise.all(imageUrls.map(async (url) => {
            // Only cache if not already in cache to save bandwidth/storage
            const response = await cache.match(url);
            if (response) return;
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
        }));
    } catch (error) {
        console.error('[Offline] Cache API error:', error);
    }
}

