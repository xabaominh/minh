// =====================================================
// ORDERS.JS — Orders Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { formatPrice } from './cart.js';
import { sendOrderContact } from './chat.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải đơn hàng...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/orders`, { credentials: 'include' });
        if (!res.ok) throw new Error('Not logged in');
        const orders = await res.json();

        if (orders.length === 0) {
            container.innerHTML = '<div class="loading-products"><i class="fas fa-receipt" style="font-size:2.5rem;margin-bottom:12px;opacity:0.3;"></i><p>Bạn chưa có đơn hàng nào.</p></div>';
            return;
        }

        const statusColors = {
            'PENDING': '#f39c12', 'CONFIRMED': '#3498db',
            'SHIPPING': '#9b59b6', 'COMPLETED': '#27ae60', 'CANCELLED': '#e74c3c'
        };
        const statusText = {
            'PENDING': 'Chờ xác nhận', 'CONFIRMED': 'Đã xác nhận',
            'SHIPPING': 'Đang giao', 'COMPLETED': 'Hoàn thành', 'CANCELLED': 'Đã hủy'
        };

        container.innerHTML = orders.map(order => {
            const itemsHtml = (order.items || []).map(item => `
                <div class="order-item-row">
                    <img class="order-item-thumb" src="${escapeHtml(item.thumbnail_url || 'img/placeholder.jpg')}" alt="${escapeHtml(item.product_name)}">
                    <div class="order-item-info">
                        <span class="order-item-name">${escapeHtml(item.product_name)}</span>
                        <span class="order-item-qty">x${item.quantity}</span>
                    </div>
                    <div class="order-item-price">
                        <span>${formatPrice(item.price)}</span>
                    </div>
                </div>
            `).join('');

            return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <strong>Đơn hàng #${order.id}</strong>
                        <span class="order-date">${order.created_at}</span>
                    </div>
                    <span class="order-status-badge" style="background:${statusColors[order.order_status] || '#888'}">
                        ${statusText[order.order_status] || order.order_status}
                    </span>
                </div>
                <div class="order-card-items">
                    ${itemsHtml || '<p style="color:var(--text-muted);font-size:0.85rem;">Không có thông tin sản phẩm</p>'}
                </div>
                <div class="order-card-body">
                    <p><i class="fas fa-user"></i> ${escapeHtml(order.receiver_name || 'Người nhận')}</p>
                    ${order.receiver_phone ? `<p><i class="fas fa-phone"></i> ${escapeHtml(order.receiver_phone)}</p>` : ''}
                    <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.shipping_address)}</p>
                    <p><i class="fas fa-credit-card"></i> ${order.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</p>
                </div>
                <div class="order-card-footer">
                    <button class="order-contact-btn" onclick="window._orderContact(event, ${order.id}, '${order.order_status}')" title="Liên hệ hỗ trợ về đơn hàng này">
                        <i class="fas fa-headset"></i> Liên hệ
                    </button>
                    <div>
                        <span class="order-footer-label">Tổng cộng:</span>
                        <strong>${formatPrice(order.total_amount)}</strong>
                    </div>
                </div>
            </div>
        `}).join('');

    } catch (err) {
        container.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải đơn hàng.</p></div>';
    }
}

window._orderContact = (event, orderId, orderStatus) => {
    if (event) {
        event.stopPropagation();
    }
    sendOrderContact(orderId, orderStatus);
};
