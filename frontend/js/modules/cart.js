// =====================================================
// CART.JS — Cart Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { openAuthModal } from './auth.js';

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
                price: item.price,
                image: item.thumbnail_url,
                quantity: item.quantity
            }));
            updateCartUI();
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
            <img src="${item.image}" alt="${item.name}"
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

// ===== CHECKOUT =====
export function handleCheckout() {
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
    openCheckoutModal();
}

export function openCheckoutModal() {
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalEl = document.getElementById('checkoutTotal');
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (state.currentUser && state.currentUser.address) {
        const addrEl = document.getElementById('checkoutAddress');
        if (addrEl) addrEl.value = state.currentUser.address;
    }
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
    document.getElementById('closeCheckoutBtn')?.addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('confirmOrderBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    shipping_address: document.getElementById('checkoutAddress').value,
                    payment_method: document.getElementById('checkoutPayment').value
                })
            });
            const data = await res.json();
            if (res.ok) {
                closeCheckoutModal();
                showNotification(`🎉 Đặt hàng thành công! Mã đơn: #${data.order_id}`, 'success');
                state.cart = [];
                updateCartUI();
                await syncCartFromServer();
            } else {
                showNotification(data.error || 'Lỗi đặt hàng', 'error');
            }
        } catch (err) {
            showNotification('Không thể kết nối server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Xác Nhận Đặt Hàng';
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
        closeProductModal();
    });
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            import('./auth.js').then(m => m.closeAuthModal());
            closeCheckoutModal();
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
    changeQuantity
};
