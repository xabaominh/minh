// =====================================================
// PRICE UTILS — Giá bán & khuyến mãi
// =====================================================

export function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export function getEffectivePrice(product) {
    const price = Number(product?.price ?? product ?? 0);
    const discount = product?.discount_price;
    if (discount != null && Number(discount) > 0 && Number(discount) < price) {
        return Number(discount);
    }
    return price;
}

export function formatPriceHtml(price, discountPrice, className = 'gia-tien') {
    const original = Number(price);
    const discount = discountPrice != null ? Number(discountPrice) : null;
    if (discount != null && discount > 0 && discount < original) {
        return `<p class="${className} gia-km"><span class="gia-goc">${formatPrice(original)}</span> <span class="gia-ban">${formatPrice(discount)}</span></p>`;
    }
    return `<p class="${className}">${formatPrice(original)}</p>`;
}

export function hasDiscount(price, discountPrice) {
    const original = Number(price);
    const discount = discountPrice != null ? Number(discountPrice) : null;
    return discount != null && discount > 0 && discount < original;
}

export function discountPercent(price, discountPrice) {
    if (!hasDiscount(price, discountPrice)) return 0;
    return Math.round((1 - Number(discountPrice) / Number(price)) * 100);
}

export function renderStars(rating) {
    const full = Math.round(Number(rating) || 0);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<i class="fas fa-star${i <= full ? '' : ' star-empty'}"></i>`;
    }
    return html;
}
