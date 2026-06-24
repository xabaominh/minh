// =====================================================
// PRODUCTS.JS — Products & Categories Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { formatPrice, showNotification, addToCart, syncCartFromServer, closeCheckoutModal } from './cart.js';
import { optimizeProductImage } from '../imageUtils.js';
import { getEffectivePrice, formatPriceHtml, renderStars, hasDiscount, discountPercent } from '../priceUtils.js';

// ===== CATEGORIES =====
export async function loadCategoriesData() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) state.allCategories = await res.json();
    } catch (e) {
        console.error('Load categories error:', e);
    }
}

export function renderCategoryButtons() {
    // Render trên trang chủ
    const catList = document.getElementById('categoryList');
    if (catList) {
        const icons = {
            'Phòng Khách': 'fa-couch', 'Phòng Ngủ': 'fa-bed',
            'Phòng Ăn': 'fa-utensils', 'Văn Phòng': 'fa-laptop-house', 'Kho Đồ': 'fa-box-open'
        };
        catList.innerHTML = state.allCategories.map(cat => `
            <a href="#" class="category-item" data-category-id="${cat.id}">
                <div class="category-icon"><i class="fas ${icons[cat.category_name] || 'fa-folder'}"></i></div>
                <span>${cat.category_name}</span>
            </a>
        `).join('');

        catList.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const catId = parseInt(item.dataset.categoryId);
                const isActive = item.classList.contains('active');
                catList.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
                if (isActive) {
                    loadProducts();
                } else {
                    item.classList.add('active');
                    loadProducts(catId);
                }
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // Render sidebar collection
    const menuTrai = document.getElementById('menu-trai');
    if (menuTrai) {
        const loadingCat = menuTrai.querySelector('.loading-cat');
        if (loadingCat) loadingCat.remove();

        state.allCategories.forEach(cat => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.dataset.categoryId = cat.id;
            a.textContent = cat.category_name;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                menuTrai.querySelectorAll('a').forEach(btn => btn.classList.remove('active'));
                a.classList.add('active');
                state.currentCategoryId = cat.id;
                applyFilters();
            });
            li.appendChild(a);
            menuTrai.appendChild(li);
        });

        const allBtn = menuTrai.querySelector('a[data-category-id=""]');
        if (allBtn) {
            allBtn.addEventListener('click', (e) => {
                e.preventDefault();
                menuTrai.querySelectorAll('a').forEach(btn => btn.classList.remove('active'));
                allBtn.classList.add('active');
                state.currentCategoryId = '';
                applyFilters();
            });
        }
    }
}

// ===== PRODUCTS — HOME PAGE =====
export async function loadProducts(categoryId = null, search = null) {
    const container = document.getElementById('productList');
    if (!container) return;
    container.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải sản phẩm...</p></div>';

    try {
        let url = `${API_BASE}/products`;
        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
        if (search) params.append('search', search);
        params.append('limit', '8');
        url += '?' + params.toString();

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const products = await res.json();

        if (products.length === 0) {
            container.innerHTML = '<div class="loading-products"><i class="fas fa-box-open" style="font-size:2rem;margin-bottom:10px;opacity:0.4;"></i><p>Không tìm thấy sản phẩm nào.</p></div>';
            return;
        }

        container.innerHTML = products.map(p => {
            const safeName = p.product_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const thumb = optimizeProductImage(p.thumbnail_url);
            const unitPrice = getEffectivePrice(p);
            const saleBadge = hasDiscount(p.price, p.discount_price)
                ? `<div class="discount-badge">-${discountPercent(p.price, p.discount_price)}%</div>` : '';
            return `
            <div class="the-san-pham reveal-on-scroll" data-id="${p.id}">
                <div class="product-img-wrapper" onclick="window._products.openProductModal(${p.id})" style="cursor:pointer;">
                    <img src="${thumb}" alt="${p.product_name}" loading="lazy" decoding="async"
                         width="600" height="600"
                         onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60'">
                    <div class="product-badge">${p.category_name}</div>
                    ${saleBadge}
                </div>
                <div class="thong-tin">
                    <h3 onclick="window._products.openProductModal(${p.id})" style="cursor:pointer;">${p.product_name}</h3>
                    ${formatPriceHtml(p.price, p.discount_price)}
                    <button class="add-to-cart-btn"
                            onclick="window._cart.addToCart(${p.id}, '${safeName}', ${unitPrice}, '${thumb}')">
                        <i class="fas fa-cart-plus"></i> Thêm Vào Giỏ
                    </button>
                </div>
            </div>`;
        }).join('');

        setupScrollReveal();
    } catch (err) {
        console.error('Load products error:', err);
        container.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải sản phẩm. Hãy chắc chắn server Flask đang chạy.</p><button class="retry-btn" onclick="window._products.loadProducts()"><i class="fas fa-redo"></i> Thử Lại</button></div>';
    }
}

// ===== PRODUCTS — COLLECTION PAGE =====
export async function loadAllProducts() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải bộ sưu tập...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        state.allProducts = await res.json();
        applyFilters();
    } catch (err) {
        grid.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải sản phẩm.</p><button class="retry-btn" onclick="window._products.loadAllProducts()"><i class="fas fa-redo"></i> Thử Lại</button></div>';
    }
}

export function applyFilters() {
    let filtered = [...state.allProducts];

    if (state.currentCategoryId) {
        filtered = filtered.filter(p => p.category_id === state.currentCategoryId);
    }
    if (state.currentSearch) {
        const kw = state.currentSearch.toLowerCase();
        filtered = filtered.filter(p =>
            p.product_name.toLowerCase().includes(kw) ||
            (p.category_name && p.category_name.toLowerCase().includes(kw))
        );
    }

    const minEl = document.getElementById('priceMin');
    const maxEl = document.getElementById('priceMax');
    if (minEl) {
        const minP = parseFloat(minEl.value);
        if (!isNaN(minP)) filtered = filtered.filter(p => getEffectivePrice(p) >= minP);
    }
    if (maxEl) {
        const maxP = parseFloat(maxEl.value);
        if (!isNaN(maxP)) filtered = filtered.filter(p => getEffectivePrice(p) <= maxP);
    }

    const sortEl = document.getElementById('sortSelect');
    if (sortEl) {
        const sortVal = sortEl.value;
        if (sortVal === 'price_asc') filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        else if (sortVal === 'price_desc') filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        else if (sortVal === 'name_asc') filtered.sort((a, b) => a.product_name.localeCompare(b.product_name));
        else if (sortVal === 'name_desc') filtered.sort((a, b) => b.product_name.localeCompare(a.product_name));
    }

    renderCollectionProducts(filtered);
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = filtered.length;
    updateFilterInfo();
}

function renderCollectionProducts(products) {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<div class="loading-products"><i class="fas fa-box-open" style="font-size:2.5rem;margin-bottom:12px;opacity:0.3;"></i><p>Không tìm thấy sản phẩm nào.</p><button class="retry-btn" onclick="window._products.resetFilters()"><i class="fas fa-undo"></i> Xoá bộ lọc</button></div>';
        return;
    }

    grid.innerHTML = products.map(p => {
        const safeName = p.product_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const thumb = optimizeProductImage(p.thumbnail_url);
        const unitPrice = getEffectivePrice(p);
        const saleBadge = hasDiscount(p.price, p.discount_price)
            ? `<div class="discount-badge">-${discountPercent(p.price, p.discount_price)}%</div>` : '';
        const stockHTML = `<p class="ton-kho ${p.stock_quantity > 0 ? '' : 'het-hang'}">
            <i class="fas fa-${p.stock_quantity > 0 ? 'check-circle' : 'times-circle'}"></i>
            ${p.stock_quantity > 0 ? p.stock_quantity + ' sản phẩm có sẵn' : 'Hết hàng'}
        </p>`;

        return `
        <div class="the-san-pham-doc" data-id="${p.id}">
            <div class="hinh-anh-sp-doc" onclick="window._products.openProductModal(${p.id})" style="cursor:pointer;">
                <img src="${thumb}" alt="${p.product_name}" loading="lazy" decoding="async"
                     width="600" height="600"
                     onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60'">
                <div class="product-badge">${p.category_name}</div>
                ${saleBadge}
            </div>
            <div class="thong-tin-sp">
                <h3 onclick="window._products.openProductModal(${p.id})" style="cursor:pointer;">${p.product_name}</h3>
                <p class="mo-ta-ngan">${p.description || 'Sản phẩm nội thất cao cấp'}</p>
                ${formatPriceHtml(p.price, p.discount_price, 'gia-sp')}
                ${stockHTML}
                <button class="add-to-cart-btn"
                        onclick="window._cart.addToCart(${p.id}, '${safeName}', ${unitPrice}, '${thumb}')"
                        ${p.stock_quantity <= 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-bag"></i> Thêm vào giỏ
                </button>
            </div>
        </div>`;
    }).join('');

    // Card reveal animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('revealed'), idx * 30);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.the-san-pham-doc').forEach(el => observer.observe(el));
}

function updateFilterInfo() {
    const infoEl = document.getElementById('filterInfo');
    if (!infoEl) return;
    const parts = [];
    if (state.currentCategoryId) {
        const cat = state.allCategories.find(c => c.id === state.currentCategoryId);
        if (cat) parts.push(`Danh mục: ${cat.category_name}`);
    }
    if (state.currentSearch) parts.push(`Tìm: "${state.currentSearch}"`);
    const minP = document.getElementById('priceMin')?.value;
    const maxP = document.getElementById('priceMax')?.value;
    if (minP) parts.push(`Từ ${formatPrice(minP)}`);
    if (maxP) parts.push(`Đến ${formatPrice(maxP)}`);
    infoEl.textContent = parts.length > 0 ? `— ${parts.join(' | ')}` : '';
}

export function resetFilters() {
    state.currentCategoryId = '';
    state.currentSearch = '';
    const els = ['priceMin', 'priceMax', 'sortSelect', 'searchInput', 'searchInputCollection'];
    els.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.querySelectorAll('#menu-trai a').forEach(a => a.classList.remove('active'));
    document.querySelector('#menu-trai a[data-category-id=""]')?.classList.add('active');
    applyFilters();
}

// ===== SEARCH =====
let searchSetupDone = false;
export function setupSearch() {
    if (searchSetupDone) return;
    searchSetupDone = true;
    const headerSearch = document.getElementById('searchInput');
    const collectionSearch = document.getElementById('searchInputCollection');
    let debounceTimer;

    const doSearch = (value) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = value.trim();
            if (state.currentView === 'home') {
                document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
                if (query.length >= 2) {
                    loadProducts(null, query);
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                } else if (query.length === 0) {
                    loadProducts();
                }
            } else {
                state.currentSearch = query;
                applyFilters();
            }
        }, 400);
    };

    if (headerSearch) {
        headerSearch.addEventListener('input', (e) => {
            if (collectionSearch) collectionSearch.value = e.target.value;
            doSearch(e.target.value);
        });
    }
    if (collectionSearch) {
        collectionSearch.addEventListener('input', (e) => {
            if (headerSearch) headerSearch.value = e.target.value;
            doSearch(e.target.value);
        });
    }
}

let sortSetupDone = false;
export function setupSorting() {
    if (sortSetupDone) return;
    sortSetupDone = true;
    document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
}

let priceFilterSetupDone = false;
export function setupPriceFilter() {
    if (priceFilterSetupDone) return;
    priceFilterSetupDone = true;
    document.getElementById('filterPriceBtn')?.addEventListener('click', applyFilters);
    ['priceMin', 'priceMax'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
    });
}

// ===== PRODUCT MODAL =====
export function setupProductModal() {
    document.getElementById('closeProductBtn')?.addEventListener('click', closeProductModal);
}

export function closeProductModal() {
    document.getElementById('productModal')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

export async function openProductModal(productId) {
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('overlay');
    const body = document.getElementById('productModalBody');
    if (!modal || !body) return;

    modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    body.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải thông tin sản phẩm...</p></div>';

    try {
        const [productRes, reviewRes] = await Promise.all([
            fetch(`${API_BASE}/products/${productId}`),
            fetch(`${API_BASE}/products/${productId}/reviews`, { credentials: 'include' })
        ]);
        if (!productRes.ok) throw new Error('API Error');
        const p = await productRes.json();
        const reviewData = reviewRes.ok ? await reviewRes.json() : { reviews: [], summary: { average: 0, count: 0 }, can_review: false };
        const thumb = optimizeProductImage(p.thumbnail_url);
        const unitPrice = getEffectivePrice(p);

        const safeName = p.product_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const priceBlock = formatPriceHtml(p.price, p.discount_price, 'product-detail-price');
        const reviewsHtml = (reviewData.reviews || []).map(r => `
            <div class="review-item">
                <div class="product-rating-summary">${renderStars(r.rating)} <strong>${escapeHtml(r.full_name || r.username)}</strong></div>
                <p>${escapeHtml(r.comment || '')}</p>
                <small style="color:var(--text-muted);">${escapeHtml(r.created_at || '')}</small>
            </div>
        `).join('') || '<p style="color:var(--text-muted);">Chưa có đánh giá.</p>';

        const reviewFormHtml = reviewData.can_review ? `
            <form id="reviewForm" class="review-form">
                <div class="star-picker" id="reviewStarPicker">
                    ${[1,2,3,4,5].map(n => `<i class="fas fa-star" data-star="${n}"></i>`).join('')}
                </div>
                <textarea id="reviewComment" placeholder="Chia sẻ trải nghiệm của bạn..."></textarea>
                <button type="submit" class="auth-submit-btn"><i class="fas fa-paper-plane"></i> Gửi đánh giá</button>
            </form>
        ` : `<p class="review-hint">${escapeHtml(reviewData.review_message || 'Chỉ khách đã mua và nhận hàng mới được đánh giá.')}</p>`;

        let imagesHtml = `<img src="${thumb}" class="gallery-thumb active" onclick="window._products.changeMainImage(this, '${thumb}')">`;
        if (p.images && p.images.length > 0) {
            p.images.forEach(img => {
                const optimized = optimizeProductImage(img.url);
                imagesHtml += `<img src="${optimized}" class="gallery-thumb" onclick="window._products.changeMainImage(this, '${optimized}')">`;
            });
        }

        body.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-images">
                    <div class="main-image-wrapper">
                        <img src="${thumb}" id="mainProductImage" alt="${p.product_name}" decoding="async">
                    </div>
                    <div class="gallery-images">${imagesHtml}</div>
                </div>
                <div class="product-detail-info">
                    <div class="product-detail-category">${p.category_name}</div>
                    <h2>${p.product_name}</h2>
                    ${priceBlock}
                    <div class="product-rating-summary">${renderStars(reviewData.summary?.average || 0)} <span>${reviewData.summary?.count || 0} đánh giá</span></div>
                    <p class="product-detail-desc">${p.description || 'Không có mô tả cho sản phẩm này.'}</p>
                    <div class="product-specs">
                        <p><strong>Tình trạng:</strong> ${p.stock_quantity > 0 ? '<span style="color:#27ae60">Còn hàng (' + p.stock_quantity + ')</span>' : '<span style="color:#e74c3c">Hết hàng</span>'}</p>
                        ${p.attributes?.dimensions ? `<p><strong>Kích thước:</strong> ${p.attributes.dimensions}</p>` : ''}
                        ${p.attributes?.material ? `<p><strong>Chất liệu:</strong> ${p.attributes.material}</p>` : ''}
                    </div>
                    <div class="product-detail-actions">
                        <div class="product-qty-selector">
                            <button class="product-qty-btn" onclick="window._products.changeModalQty(-1)">-</button>
                            <input type="number" class="product-qty-input" id="modalQtyInput" value="1" min="1" max="${p.stock_quantity > 0 ? p.stock_quantity : 1}">
                            <button class="product-qty-btn" onclick="window._products.changeModalQty(1)">+</button>
                        </div>
                        <button class="product-add-btn" 
                                onclick="window._products.addToCartFromModal(${p.id}, '${safeName}', ${unitPrice}, '${thumb}')"
                                ${p.stock_quantity <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Thêm Vào Giỏ
                        </button>
                    </div>
                </div>
            </div>
            <div class="reviews-section reviews-section-full">
                <h3><i class="fas fa-star"></i> Đánh giá sản phẩm</h3>
                ${reviewFormHtml}
                <div id="reviewsList">${reviewsHtml}</div>
            </div>
        `;

        setupReviewForm(productId);
    } catch (err) {
        body.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải thông tin sản phẩm.</p></div>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupReviewForm(productId) {
    const picker = document.getElementById('reviewStarPicker');
    const form = document.getElementById('reviewForm');
    if (!picker || !form) return;

    let selectedRating = 5;
    const stars = picker.querySelectorAll('i');
    const paintStars = (value) => {
        stars.forEach(star => {
            star.classList.toggle('active', Number(star.dataset.star) <= value);
        });
    };
    paintStars(selectedRating);

    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = Number(star.dataset.star);
            paintStars(selectedRating);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: selectedRating,
                    comment: document.getElementById('reviewComment')?.value.trim()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Không thể gửi đánh giá');
            showNotification('Đã gửi đánh giá', 'success');
            openProductModal(productId);
        } catch (err) {
            showNotification(err.message, 'error');
        }
    });
}

function changeMainImage(element, url) {
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) mainImg.src = url;
    document.querySelectorAll('.gallery-thumb').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

function changeModalQty(delta) {
    const input = document.getElementById('modalQtyInput');
    if (!input) return;
    let val = parseInt(input.value) + delta;
    const max = parseInt(input.getAttribute('max'));
    if (val < 1) val = 1;
    if (val > max) val = max;
    input.value = val;
}

async function addToCartFromModal(id, name, price, imageUrl) {
    const qtyInput = document.getElementById('modalQtyInput');
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;

    if (state.currentUser) {
        try {
            const res = await fetch(`${API_BASE}/cart/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ product_id: id, quantity: qty })
            });
            if (res.ok) {
                showNotification(`Đã thêm ${qty} "${name}" vào giỏ hàng!`, 'success');
                await syncCartFromServer();
                closeProductModal();
            } else {
                const data = await res.json();
                showNotification(data.error || 'Lỗi', 'error');
            }
        } catch (e) {
            showNotification('Không thể kết nối server', 'error');
        }
    } else {
        const existing = state.cart.find(item => item.id === id);
        if (existing) {
            existing.quantity += qty;
        } else {
            state.cart.push({ id, name, price, image: imageUrl, quantity: qty });
        }
        localStorage.setItem('luxdecor_cart', JSON.stringify(state.cart));
        const { updateCartUI } = await import('./cart.js');
        updateCartUI();
        showNotification(`Đã thêm ${qty} "${name}" vào giỏ hàng!`, 'success');
        closeProductModal();
    }
}

// ===== SCROLL REVEAL =====
export function setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal-on-scroll, .hop-feature, .the-san-pham').forEach(el => observer.observe(el));
}

// Expose globally
window._products = {
    openProductModal,
    closeProductModal,
    changeMainImage,
    changeModalQty,
    addToCartFromModal,
    loadProducts,
    loadAllProducts,
    resetFilters
};
