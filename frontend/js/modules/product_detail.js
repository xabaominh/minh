// =====================================================
// PRODUCT DETAIL.JS — Full-screen product detail + reviews
// =====================================================

import { API_BASE, state } from '../state.js';
import { formatPrice, showNotification } from './cart.js';
import { openAuthModal } from './auth.js';
import { switchView } from '../router.js';
import { optimizeProductImage } from '../imageUtils.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function renderStars(rating) {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    let html = '';
    for (let i = 1; i <= 5; i += 1) {
        html += `<i class="fas fa-star ${i <= value ? 'filled' : ''}"></i>`;
    }
    return html;
}

function renderReviewCard(review) {
    const reviewer = review.full_name || review.username || 'Khách hàng';
    return `
        <article class="review-card">
            <div class="review-card-head">
                <div>
                    <h4>${escapeHtml(reviewer)}</h4>
                    <p>${formatDate(review.created_at)}</p>
                </div>
                <div class="review-card-stars">${renderStars(review.rating)}</div>
            </div>
            ${review.comment ? `<p class="review-card-comment">${escapeHtml(review.comment)}</p>` : '<p class="review-card-comment empty">Không có bình luận.</p>'}
        </article>
    `;
}

function renderReviewForm(product) {
    const existing = product.user_review;
    const canReview = product.can_review || !!existing;

    if (!state.currentUser) {
        return `
            <div class="review-locked-box">
                <h3>Đăng nhập để đánh giá</h3>
                <p>Bạn cần đăng nhập và hoàn tất đơn hàng trước khi gửi đánh giá.</p>
                <button type="button" class="auth-submit-btn" id="loginToReviewBtn">
                    <i class="fas fa-sign-in-alt"></i> Đăng nhập ngay
                </button>
            </div>
        `;
    }

    if (!canReview) {
        return `
            <div class="review-locked-box">
                <h3>Chỉ khách hàng đã nhận hàng mới được đánh giá</h3>
                <p>Hệ thống sẽ mở phần đánh giá sau khi đơn hàng của bạn có trạng thái <strong>Hoàn thành</strong>.</p>
                <button type="button" class="mini-btn" id="goToOrdersBtn">
                    <i class="fas fa-receipt"></i> Xem đơn hàng của tôi
                </button>
            </div>
        `;
    }

    const ratingValue = existing?.rating || 5;
    const commentValue = existing?.comment || '';
    const submitLabel = existing ? 'Cập nhật đánh giá' : 'Gửi đánh giá';

    return `
        <form class="review-form" id="reviewForm">
            <div class="form-group">
                <label for="reviewRating">Số sao</label>
                <select id="reviewRating" name="rating">
                    <option value="5" ${ratingValue === 5 ? 'selected' : ''}>5 sao - Rất hài lòng</option>
                    <option value="4" ${ratingValue === 4 ? 'selected' : ''}>4 sao - Hài lòng</option>
                    <option value="3" ${ratingValue === 3 ? 'selected' : ''}>3 sao - Bình thường</option>
                    <option value="2" ${ratingValue === 2 ? 'selected' : ''}>2 sao - Chưa tốt</option>
                    <option value="1" ${ratingValue === 1 ? 'selected' : ''}>1 sao - Không hài lòng</option>
                </select>
            </div>
            <div class="form-group">
                <label for="reviewComment">Bình luận</label>
                <textarea id="reviewComment" name="comment" rows="5" placeholder="Chia sẻ cảm nhận của bạn về sản phẩm...">${escapeHtml(commentValue)}</textarea>
            </div>
            <div class="review-form-actions">
                <button type="submit" class="auth-submit-btn" id="submitReviewBtn">
                    <i class="fas fa-star"></i> ${submitLabel}
                </button>
            </div>
        </form>
    `;
}

function renderProductDetail(product) {
    const thumb = optimizeProductImage(product.thumbnail_url);
    const images = [{ url: thumb, active: true }].concat((product.images || []).map(img => ({
        url: optimizeProductImage(img.url),
        active: false
    })));

    const summary = product.review_summary || {};
    const reviewCount = Number(summary.review_count || 0);
    const averageRating = Number(summary.average_rating || 0);

    const imagesHtml = images.map(img => `
        <img src="${img.url}" class="gallery-thumb ${img.active ? 'active' : ''}" data-thumb-url="${img.url}" alt="${escapeHtml(product.product_name)}">
    `).join('');

    const specs = [];
    specs.push(`<p><strong>Tình trạng:</strong> ${product.stock_quantity > 0 ? `<span class="in-stock">Còn hàng (${product.stock_quantity})</span>` : '<span class="out-stock">Hết hàng</span>'}</p>`);
    if (product.dimensions) specs.push(`<p><strong>Kích thước:</strong> ${escapeHtml(product.dimensions)}</p>`);
    if (product.wood_material) specs.push(`<p><strong>Chất liệu:</strong> ${escapeHtml(product.wood_material)}</p>`);

    const reviewList = (product.reviews || []).length > 0
        ? product.reviews.map(renderReviewCard).join('')
        : '<div class="review-empty">Chưa có đánh giá nào cho sản phẩm này.</div>';

    return `
        <div class="product-detail-layout-full">
            <div class="product-detail-media">
                <div class="product-detail-main-image">
                    <img src="${thumb}" id="mainProductDetailImage" alt="${escapeHtml(product.product_name)}">
                </div>
                <div class="gallery-images product-detail-gallery">
                    ${imagesHtml}
                </div>
            </div>

            <div class="product-detail-info-panel">
                <div class="product-detail-category">${escapeHtml(product.category_name)}</div>
                <h2>${escapeHtml(product.product_name)}</h2>
                <div class="product-detail-price">${formatPrice(product.price)}</div>
                <p class="product-detail-desc">${escapeHtml(product.description || 'Không có mô tả cho sản phẩm này.')}</p>

                <div class="product-review-summary">
                    <div class="review-score">${averageRating.toFixed(1)}</div>
                    <div>
                        <div class="review-stars">${renderStars(Math.round(averageRating))}</div>
                        <div class="review-count">${reviewCount} đánh giá</div>
                    </div>
                </div>

                <div class="product-specs">
                    ${specs.join('')}
                </div>

                <div class="product-detail-actions">
                    <div class="product-qty-selector">
                        <button class="product-qty-btn" type="button" id="qtyMinusBtn">-</button>
                        <input type="number" class="product-qty-input" id="detailQtyInput" value="1" min="1" max="${product.stock_quantity > 0 ? product.stock_quantity : 1}">
                        <button class="product-qty-btn" type="button" id="qtyPlusBtn">+</button>
                    </div>
                    <button class="product-add-btn" type="button" id="addToCartDetailBtn" ${product.stock_quantity <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>

        <div class="product-review-section">
            <div class="product-review-column">
                <div class="section-head">
                    <h3>Viết đánh giá</h3>
                    <span>Bạn chỉ có thể đánh giá khi đơn hàng đã hoàn thành</span>
                </div>
                ${renderReviewForm(product)}
            </div>

            <div class="product-review-column">
                <div class="section-head">
                    <h3>Đánh giá từ khách hàng</h3>
                    <span>${reviewCount} nhận xét</span>
                </div>
                <div class="review-list">
                    ${reviewList}
                </div>
            </div>
        </div>
    `;
}

function bindProductDetailEvents(product) {
    const mainImage = document.getElementById('mainProductDetailImage');
    const thumbs = document.querySelectorAll('.product-detail-gallery .gallery-thumb');
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            if (mainImage) mainImage.src = thumb.dataset.thumbUrl || thumb.src;
            thumbs.forEach(item => item.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    document.getElementById('backToCollectionBtn')?.addEventListener('click', () => {
        switchView('collection');
    });

    document.getElementById('goToOrdersBtn')?.addEventListener('click', () => {
        switchView('orders');
    });

    document.getElementById('loginToReviewBtn')?.addEventListener('click', () => {
        openAuthModal('login');
    });

    const qtyInput = document.getElementById('detailQtyInput');
    const qtyMinusBtn = document.getElementById('qtyMinusBtn');
    const qtyPlusBtn = document.getElementById('qtyPlusBtn');
    const addToCartBtn = document.getElementById('addToCartDetailBtn');

    const clampQty = () => {
        if (!qtyInput) return 1;
        let value = parseInt(qtyInput.value, 10) || 1;
        const maxValue = parseInt(qtyInput.getAttribute('max'), 10) || 1;
        if (value < 1) value = 1;
        if (value > maxValue) value = maxValue;
        qtyInput.value = value;
        return value;
    };

    qtyMinusBtn?.addEventListener('click', () => {
        if (!qtyInput) return;
        qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
    });
    qtyPlusBtn?.addEventListener('click', () => {
        if (!qtyInput) return;
        const maxValue = parseInt(qtyInput.getAttribute('max'), 10) || 1;
        qtyInput.value = Math.min(maxValue, (parseInt(qtyInput.value, 10) || 1) + 1);
    });
    qtyInput?.addEventListener('input', clampQty);

    addToCartBtn?.addEventListener('click', async () => {
        const qty = clampQty();
        if (state.currentUser) {
            try {
                const res = await fetch(`${API_BASE}/cart/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ product_id: product.id, quantity: qty })
                });
                if (res.ok) {
                    showNotification(`Đã thêm ${qty} sản phẩm vào giỏ hàng`, 'success');
                } else {
                    const data = await res.json();
                    showNotification(data.error || 'Lỗi thêm vào giỏ hàng', 'error');
                }
            } catch (error) {
                showNotification('Không thể kết nối server', 'error');
            }
        } else {
            const existing = state.cart.find(item => item.id === product.id);
            if (existing) existing.quantity += qty;
            else state.cart.push({ id: product.id, name: product.product_name, price: product.price, image: optimizeProductImage(product.thumbnail_url), quantity: qty });
            localStorage.setItem('luxdecor_cart', JSON.stringify(state.cart));
            const { updateCartUI } = await import('./cart.js');
            updateCartUI();
            showNotification(`Đã thêm ${qty} sản phẩm vào giỏ hàng`, 'success');
        }
    });

    const reviewForm = document.getElementById('reviewForm');
    reviewForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitReviewBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch(`${API_BASE}/products/${product.id}/reviews`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: document.getElementById('reviewRating').value,
                    comment: document.getElementById('reviewComment').value.trim()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Không thể lưu đánh giá');
            showNotification(data.message || 'Đã lưu đánh giá', 'success');
            await loadProductDetail();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-star"></i> Gửi đánh giá';
            }
        }
    });
}

export async function loadProductDetail() {
    const container = document.getElementById('productDetailContainer');
    const page = document.getElementById('productDetailPage');
    if (!container) return;

    if (!state.currentProductId) {
        const storedProductId = sessionStorage.getItem('luxdecor_current_product_id');
        if (storedProductId) {
            state.currentProductId = Number(storedProductId);
        }
    }

    if (!state.currentProductId) {
        container.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không tìm thấy sản phẩm cần hiển thị.</p><button class="retry-btn" id="backFromMissingProduct"><i class="fas fa-arrow-left"></i> Quay lại bộ sưu tập</button></div>';
        document.getElementById('backFromMissingProduct')?.addEventListener('click', () => switchView('collection'));
        return;
    }

    container.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải thông tin sản phẩm...</p></div>';
    if (page) page.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const res = await fetch(`${API_BASE}/products/${state.currentProductId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Không thể tải sản phẩm');
        const product = await res.json();
        state.currentProduct = product;
        container.innerHTML = renderProductDetail(product);
        bindProductDetailEvents(product);
    } catch (error) {
        container.innerHTML = `<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>${escapeHtml(error.message || 'Không thể tải thông tin sản phẩm.')}</p><button class="retry-btn" id="retryProductDetailBtn"><i class="fas fa-redo"></i> Thử lại</button></div>`;
        document.getElementById('retryProductDetailBtn')?.addEventListener('click', loadProductDetail);
    }
}
