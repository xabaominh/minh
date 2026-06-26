// =====================================================
// IMAGE UTILS — URL optimization theo ngữ cảnh hiển thị
// =====================================================

/** Kích thước theo vùng UI (cân bằng nét vs tốc độ tải) */
const SIZES = {
    mini: { w: 96, h: 96 },
    thumb: { w: 160, h: 160 },
    card: { w: 400, h: 300 },
    modal: { w: 800, h: 600 },
    hero: { w: 1280, h: 720 },
};

const PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="#eceff3"/></svg>'
    );

function stripQuery(url) {
    const idx = url.indexOf('?');
    return idx === -1 ? url : url.slice(0, idx);
}

function resolveSize(size) {
    if (typeof size === 'number') {
        return { w: size, h: Math.round(size * 0.75) };
    }
    return SIZES[size] || SIZES.card;
}

export function optimizeProductImage(url, size = 'card') {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:') || url.startsWith('img/')) return url;

    const { w, h } = resolveSize(size);
    const quality = size === 'modal' || size === 'hero' ? 80 : 70;

    if (url.includes('images.pexels.com')) {
        return `${stripQuery(url)}?auto=compress&cs=srgb&w=${w}&h=${h}&fit=crop&dpr=1`;
    }

    if (url.includes('images.unsplash.com')) {
        return `${stripQuery(url)}?w=${w}&h=${h}&q=${quality}&auto=format&fit=crop`;
    }

    return url;
}

export function productImagePair(url) {
    return {
        thumb: optimizeProductImage(url, 'thumb'),
        full: optimizeProductImage(url, 'modal'),
    };
}

export function imagePlaceholder() {
    return PLACEHOLDER;
}

// Giới hạn số ảnh CDN tải song song để tránh khựng mạng
let activeLoads = 0;
const loadQueue = [];
const MAX_CONCURRENT = 3;

function drainImageQueue() {
    while (activeLoads < MAX_CONCURRENT && loadQueue.length) {
        const job = loadQueue.shift();
        job();
    }
}

function queueImageLoad(img, src) {
    const apply = () => {
        activeLoads++;
        const done = () => {
            activeLoads--;
            drainImageQueue();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        img.src = src;
    };

    if (activeLoads < MAX_CONCURRENT) apply();
    else loadQueue.push(apply);
}

/** Gắn lazy-load có hàng đợi cho img[data-src] */
export function initLazyImages(root = document, { eagerCount = 0 } = {}) {
    const images = [...root.querySelectorAll('img[data-src]')];
    if (!images.length) return;

    const loadOne = (img, urgent = false) => {
        const src = img.getAttribute('data-src');
        if (!src) return;
        img.removeAttribute('data-src');
        if (urgent) {
            img.src = src;
            return;
        }
        queueImageLoad(img, src);
    };

    images.slice(0, eagerCount).forEach((img) => loadOne(img, true));
    const deferred = images.slice(eagerCount);
    if (!deferred.length) return;

    if (!('IntersectionObserver' in window)) {
        deferred.forEach(loadOne);
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                loadOne(entry.target);
                observer.unobserve(entry.target);
            });
        },
        { rootMargin: '120px 0px', threshold: 0.01 }
    );

    deferred.forEach((img) => observer.observe(img));
}
