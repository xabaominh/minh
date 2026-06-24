// =====================================================
// IMAGE UTILS — Thumbnail URL optimization
// =====================================================

const PEXELS_PARAMS = 'auto=compress&cs=tinysrgb&w=600&h=600&fit=crop';
const UNSPLASH_PARAMS = 'w=600&q=80';

export function optimizeProductImage(url, width = 600) {
    if (!url || typeof url !== 'string') return url;

    if (url.includes('images.pexels.com')) {
        if (/[?&]w=\d+/.test(url)) return url;
        const sep = url.includes('?') ? '&' : '?';
        const params = width === 600 ? PEXELS_PARAMS : `auto=compress&cs=tinysrgb&w=${width}&fit=crop`;
        return `${url}${sep}${params}`;
    }

    if (url.includes('images.unsplash.com')) {
        if (/[?&]w=\d+/.test(url)) return url;
        const sep = url.includes('?') ? '&' : '?';
        const params = width === 600 ? UNSPLASH_PARAMS : `w=${width}&q=80`;
        return `${url}${sep}${params}`;
    }

    return url;
}
