// =====================================================
// ORDERS.JS — Orders Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { formatPrice } from './cart.js';

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

        container.innerHTML = orders.map(order => `
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
                <div class="order-card-body">
                    <p><i class="fas fa-map-marker-alt"></i> ${order.shipping_address}</p>
                    <p><i class="fas fa-credit-card"></i> ${order.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</p>
                </div>
                <div class="order-card-footer">
                    <strong>${formatPrice(order.total_amount)}</strong>
                </div>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải đơn hàng.</p></div>';
    }
}
