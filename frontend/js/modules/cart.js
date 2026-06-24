// =====================================================
// CART.JS — Cart Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { openAuthModal } from './auth.js';
import { phoneValidationMessage } from '../validators.js';
import { optimizeProductImage } from '../imageUtils.js';

// ===== NOTIFICATION =====
export function showNotification(message, type = 'success') {
    const area = document.getElementById('notificationArea');
    if (!area) return;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `notification ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> <span>${message}</span>`;
    area.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

export function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// ===== VIETQR CONFIG (Demo) =====
const VIETQR_CONFIG = {
    bankId: 'MB',           // Mã ngân hàng (MB Bank)
    accountNo: '0123456789', // Số tài khoản demo
    accountName: 'LUXDECOR FURNITURE', // Tên chủ TK
    template: 'compact2'    // Template QR: compact, compact2, qr_only, print
};

function generateVietQRUrl(amount, orderInfo) {
    const { bankId, accountNo, template } = VIETQR_CONFIG;
    const params = new URLSearchParams({
        amount: Math.round(amount),
        addInfo: orderInfo,
        accountName: VIETQR_CONFIG.accountName
    });
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?${params.toString()}`;
}

function showVietQRResult(orderId, totalAmount) {
    const form = document.getElementById('checkoutForm');
    const result = document.getElementById('vietqrResult');
    if (!form || !result) return;

    const orderInfo = `DH${orderId} LuxDecor`;
    const qrUrl = generateVietQRUrl(totalAmount, orderInfo);

    // Ẩn form, hiện QR
    form.style.display = 'none';
    result.style.display = 'block';

    // Thông tin đơn hàng
    const infoEl = document.getElementById('vietqrOrderInfo');
    if (infoEl) {
        infoEl.innerHTML = `
            <div class="info-item"><strong>Mã đơn:</strong> #${orderId}</div>
            <div class="info-item"><strong>Số tiền:</strong> <span class="amount">${formatPrice(totalAmount)}</span></div>
        `;
    }

    // Ảnh QR
    const qrImg = document.getElementById('vietqrImage');
    if (qrImg) qrImg.src = qrUrl;

    // Chi tiết ngân hàng
    const bankEl = document.getElementById('vietqrBankDetails');
    if (bankEl) {
        bankEl.innerHTML = `
            <div class="detail-row">
                <span class="label">Ngân hàng</span>
                <span class="value">${VIETQR_CONFIG.bankId} Bank</span>
            </div>
            <div class="detail-row">
                <span class="label">Số tài khoản</span>
                <span class="value copyable" onclick="window._cart.copyText('${VIETQR_CONFIG.accountNo}')">
                    ${VIETQR_CONFIG.accountNo} <i class="fas fa-copy"></i>
                </span>
            </div>
            <div class="detail-row">
                <span class="label">Chủ tài khoản</span>
                <span class="value">${VIETQR_CONFIG.accountName}</span>
            </div>
            <div class="detail-row">
                <span class="label">Nội dung CK</span>
                <span class="value copyable" onclick="window._cart.copyText('${orderInfo}')">
                    ${orderInfo} <i class="fas fa-copy"></i>
                </span>
            </div>
        `;
    }

    // Nút đóng
    document.getElementById('vietqrCloseBtn')?.addEventListener('click', () => {
        closeCheckoutModal();
        resetVietQRModal();
    });
}

function resetVietQRModal() {
    const form = document.getElementById('checkoutForm');
    const result = document.getElementById('vietqrResult');
    if (form) form.style.display = 'block';
    if (result) result.style.display = 'none';
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Đã sao chép: ' + text, 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Đã sao chép: ' + text, 'success');
    });
}

// ===== CART SYNC =====
export async function mergeLocalCart() {
    if (!state.currentUser || state.cart.length === 0) return;
    try {
        const items = state.cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
        await fetch(`${API_BASE}/cart/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items })
        });
        state.cart = [];
        localStorage.removeItem('luxdecor_cart');
    } catch (e) {
        console.error('Merge cart error:', e);
    }
}

export async function syncCartFromServer() {
    if (!state.currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/cart`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            state.cart = (data.items || []).map(item => ({
                id: item.product_id,
                item_id: item.item_id,
                name: item.product_name,
                price: item.unit_price ?? item.price,
                image: item.thumbnail_url,
                quantity: item.quantity
            }));
            updateCartUI();
        } else if (res.status === 401) {
            state.currentUser = null;
            const { updateAuthUI } = await import('./auth.js');
            updateAuthUI();
        }
    } catch (e) {
        console.error('Sync cart error:', e);
    }
}

// ===== CART CRUD =====
export async function addToCart(productId, name, price, imageUrl) {
    if (state.currentUser) {
        try {
            const res = await fetch(`${API_BASE}/cart/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ product_id: productId, quantity: 1 })
            });
            if (res.ok) {
                showNotification(`Đã thêm "${name}" vào giỏ hàng!`, 'success');
                await syncCartFromServer();
            } else {
                const data = await res.json();
                showNotification(data.error || 'Lỗi', 'error');
            }
        } catch (e) {
            showNotification('Không thể kết nối server', 'error');
        }
    } else {
        const existing = state.cart.find(item => item.id === productId);
        if (existing) {
            existing.quantity++;
        } else {
            state.cart.push({ id: productId, name, price, image: imageUrl, quantity: 1 });
        }
        localStorage.setItem('luxdecor_cart', JSON.stringify(state.cart));
        updateCartUI();
        showNotification(`Đã thêm "${name}" vào giỏ hàng!`, 'success');
    }
}

export async function removeFromCart(idOrItemId) {
    if (state.currentUser) {
        try {
            await fetch(`${API_BASE}/cart/remove/${idOrItemId}`, { method: 'DELETE', credentials: 'include' });
            await syncCartFromServer();
        } catch (e) {}
    } else {
        state.cart = state.cart.filter(item => item.id !== idOrItemId);
        localStorage.setItem('luxdecor_cart', JSON.stringify(state.cart));
        updateCartUI();
    }
    renderCartItems();
}

export async function changeQuantity(idOrItemId, delta) {
    if (state.currentUser) {
        const item = state.cart.find(i => i.item_id === idOrItemId);
        if (!item) return;
        const newQty = item.quantity + delta;
        if (newQty <= 0) { removeFromCart(idOrItemId); return; }
        try {
            await fetch(`${API_BASE}/cart/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ item_id: idOrItemId, quantity: newQty })
            });
            await syncCartFromServer();
            renderCartItems();
        } catch (e) {}
    } else {
        const item = state.cart.find(i => i.id === idOrItemId);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) { removeFromCart(idOrItemId); return; }
        localStorage.setItem('luxdecor_cart', JSON.stringify(state.cart));
        updateCartUI();
        renderCartItems();
    }
}

// ===== CART UI =====
export function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

export function openCart() {
    renderCartItems();
    document.getElementById('cartModal')?.classList.add('active');
    document.getElementById('overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeCart() {
    document.getElementById('cartModal')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

export function renderCartItems() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!container || !totalEl) return;

    if (state.cart.length === 0) {
        container.innerHTML = '<p class="empty-cart"><i class="fas fa-shopping-basket"></i><br>Giỏ hàng trống</p>';
        totalEl.textContent = '0 ₫';
        return;
    }

    const isLoggedIn = !!state.currentUser;

    container.innerHTML = state.cart.map(item => {
        const removeId = isLoggedIn ? item.item_id : item.id;
        const changeId = isLoggedIn ? item.item_id : item.id;
        return `
        <div class="cart-item">
            <img src="${optimizeProductImage(item.image)}" alt="${item.name}" loading="lazy" decoding="async"
                 onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&q=60'">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
                <div class="cart-item-qty">
                    <button onclick="window._cart.changeQuantity(${changeId}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="window._cart.changeQuantity(${changeId}, +1)">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="window._cart.removeFromCart(${removeId})" title="Xoá">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `}).join('');

    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalEl.textContent = formatPrice(total);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getCartSubtotal() {
    return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function updateCheckoutSummary() {
    const subtotal = getCartSubtotal();
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const totalEl = document.getElementById('checkoutTotal');
    const discountLine = document.getElementById('checkoutDiscountLine');
    const discountAmountEl = document.getElementById('checkoutDiscountAmount');
    const couponCodeEl = document.getElementById('checkoutCouponCode');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);

    const discount = state.appliedCoupon?.discount_amount || 0;
    const finalTotal = Math.max(subtotal - discount, 0);

    if (discountLine && discountAmountEl && couponCodeEl) {
        if (discount > 0) {
            discountLine.style.display = 'flex';
            couponCodeEl.textContent = state.appliedCoupon.code;
            discountAmountEl.textContent = `-${formatPrice(discount)}`;
        } else {
            discountLine.style.display = 'none';
        }
    }
    if (totalEl) totalEl.textContent = formatPrice(finalTotal);
}

async function applyCheckoutCoupon() {
    const input = document.getElementById('checkoutCouponInput');
    const code = input?.value.trim();
    if (!code) {
        showNotification('Vui lòng nhập mã giảm giá', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/coupons/validate`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                order_total: getCartSubtotal()
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            if (res.status === 401) throw new Error('Vui lòng đăng nhập để dùng mã giảm giá');
            throw new Error(data.error || 'Mã không hợp lệ');
        }
        state.appliedCoupon = data;
        updateCheckoutSummary();
        showNotification(`Đã áp dụng mã ${data.code}`, 'success');
    } catch (err) {
        state.appliedCoupon = null;
        updateCheckoutSummary();
        showNotification(err.message, 'error');
    }
}

async function loadUserAddresses() {
    if (!state.currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/addresses`, { credentials: 'include' });
        if (res.ok) {
            state.userAddresses = await res.json();
        }
    } catch (e) {
        console.error('Load addresses error:', e);
    }
}

function updateCheckoutAddressMode() {
    const select = document.getElementById('checkoutAddressSelect');
    const newBox = document.getElementById('checkoutNewAddress');
    const list = document.getElementById('checkoutAddressList');
    if (!select || !newBox || !list) return;

    if (select.value === 'new') {
        newBox.classList.add('active');
        list.innerHTML = '';
        document.getElementById('checkoutReceiverName').value =
            state.currentUser?.full_name || state.currentUser?.username || '';
        document.getElementById('checkoutReceiverPhone').value = state.currentUser?.phone || '';
        return;
    }

    newBox.classList.remove('active');
    const selected = state.userAddresses.find(address => String(address.id) === select.value);
    if (!selected) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = `
        <div class="checkout-address-card">
            <strong>${escapeHtml(selected.receiver_name || 'Người nhận')}</strong>
            <p>${escapeHtml(selected.phone || '')}</p>
            <p>${escapeHtml(selected.address_line)}</p>
            ${selected.is_default ? '<span>Địa chỉ mặc định</span>' : ''}
        </div>
    `;
}

function renderCheckoutAddresses() {
    const select = document.getElementById('checkoutAddressSelect');
    if (!select) return;

    const defaultAddress = state.userAddresses.find(address => address.is_default);
    const selectedId = defaultAddress?.id || state.userAddresses[0]?.id || 'new';
    const options = state.userAddresses.map(address => {
        const suffix = address.is_default ? ' (Mặc định)' : '';
        return `<option value="${address.id}">${escapeHtml(address.address_line)}${suffix}</option>`;
    });

    select.innerHTML = [
        ...options,
        '<option value="new">Thêm địa chỉ mới</option>'
    ].join('');
    select.value = String(selectedId);
    updateCheckoutAddressMode();
}

async function getCheckoutShippingInfo() {
    const select = document.getElementById('checkoutAddressSelect');
    if (select && select.value !== 'new') {
        const selected = state.userAddresses.find(address => String(address.id) === select.value);
        if (!selected?.address_line) return null;
        const phoneError = phoneValidationMessage(selected.phone || state.currentUser?.phone || '');
        if (phoneError) {
            showNotification(phoneError, 'warning');
            return null;
        }
        return {
            receiver_name: selected.receiver_name || state.currentUser?.full_name || state.currentUser?.username || '',
            receiver_phone: selected.phone || state.currentUser?.phone || '',
            shipping_address: selected.address_line
        };
    }

    const addressInput = document.getElementById('checkoutAddress');
    const addressLine = addressInput?.value.trim() || '';
    if (!addressLine) {
        showNotification('Vui lòng nhập địa chỉ giao hàng', 'warning');
        addressInput?.focus();
        return null;
    }

    const payload = {
        receiver_name: document.getElementById('checkoutReceiverName')?.value.trim() || '',
        phone: document.getElementById('checkoutReceiverPhone')?.value.trim() || '',
        address_line: addressLine,
        is_default: document.getElementById('saveNewAddressAsDefault')?.checked ?? true
    };

    const phoneError = phoneValidationMessage(payload.phone);
    if (phoneError) {
        showNotification(phoneError, 'warning');
        document.getElementById('checkoutReceiverPhone')?.focus();
        return null;
    }

    try {
        const res = await fetch(`${API_BASE}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.error || 'Không thể lưu địa chỉ', 'error');
            return '';
        }

        state.userAddresses = [
            data.address,
            ...state.userAddresses.map(address => ({
                ...address,
                is_default: data.address.is_default ? false : address.is_default
            }))
        ];
        if (data.address.is_default && state.currentUser) {
            state.currentUser.address = data.address.address_line;
        }
        renderCheckoutAddresses();
        return {
            receiver_name: data.address.receiver_name || payload.receiver_name,
            receiver_phone: data.address.phone || payload.phone,
            shipping_address: data.address.address_line
        };
    } catch (err) {
        showNotification('Không thể kết nối server để lưu địa chỉ', 'error');
        return null;
    }
}

// ===== CHECKOUT =====
export async function handleCheckout() {
    if (state.cart.length === 0) {
        showNotification('Giỏ hàng đang trống!', 'warning');
        return;
    }
    if (!state.currentUser) {
        closeCart();
        showNotification('Vui lòng đăng nhập để thanh toán', 'info');
        openAuthModal('login');
        return;
    }
    closeCart();
    await openCheckoutModal();
}

export async function openCheckoutModal() {
    state.appliedCoupon = null;
    const couponInput = document.getElementById('checkoutCouponInput');
    if (couponInput) couponInput.value = '';
    const total = getCartSubtotal();
    const totalEl = document.getElementById('checkoutTotal');
    if (totalEl) totalEl.textContent = formatPrice(total);
    updateCheckoutSummary();
    await loadUserAddresses();
    renderCheckoutAddresses();
    document.getElementById('checkoutModal')?.classList.add('active');
    document.getElementById('overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeCheckoutModal() {
    document.getElementById('checkoutModal')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

export function setupCheckout() {
    document.getElementById('closeCheckoutBtn')?.addEventListener('click', () => {
        closeCheckoutModal();
        resetVietQRModal();
    });
    document.getElementById('checkoutAddressSelect')?.addEventListener('change', updateCheckoutAddressMode);
    document.getElementById('applyCouponBtn')?.addEventListener('click', applyCheckoutCoupon);

    // Toggle VietQR preview khi đổi phương thức thanh toán
    document.getElementById('checkoutPayment')?.addEventListener('change', (e) => {
        const preview = document.getElementById('vietqrPreview');
        if (preview) {
            preview.style.display = e.target.value === 'BANK_TRANSFER' ? 'block' : 'none';
        }
    });

    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('confirmOrderBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        const paymentMethod = document.getElementById('checkoutPayment').value;

        try {
            const shippingInfo = await getCheckoutShippingInfo();
            if (!shippingInfo) return;

            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    shipping_address: shippingInfo.shipping_address,
                    receiver_name: shippingInfo.receiver_name,
                    receiver_phone: shippingInfo.receiver_phone,
                    payment_method: paymentMethod,
                    coupon_code: state.appliedCoupon?.code || ''
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                state.cart = [];
                state.appliedCoupon = null;
                updateCartUI();
                syncCartFromServer().catch(() => {});

                if (paymentMethod === 'BANK_TRANSFER') {
                    showVietQRResult(data.order_id, data.total);
                    showNotification(`🎉 Đặt hàng thành công! Vui lòng quét mã QR để thanh toán.`, 'success');
                } else {
                    closeCheckoutModal();
                    showNotification(`🎉 Đặt hàng thành công! Mã đơn: #${data.order_id}`, 'success');
                }
            } else {
                showNotification(data.error || 'Lỗi đặt hàng', 'error');
            }
        } catch (err) {
            showNotification('Không thể kết nối server', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Xác Nhận Đặt Hàng';
            }
        }
    });
}

export function setupCart() {
    document.getElementById('cartBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });
    document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
    document.getElementById('overlay')?.addEventListener('click', () => {
        closeCart();
        const { closeAuthModal } = import('./auth.js').then(m => { m.closeAuthModal(); });
        closeCheckoutModal();
        resetVietQRModal();
        closeProductModal();
    });
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            import('./auth.js').then(m => m.closeAuthModal());
            closeCheckoutModal();
            resetVietQRModal();
            closeProductModal();
        }
    });
}

function closeProductModal() {
    document.getElementById('productModal')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

// Expose cart functions globally cho onclick trong rendered HTML
window._cart = {
    addToCart,
    removeFromCart,
    changeQuantity,
    copyText
};
