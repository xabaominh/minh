import { API_BASE, state } from '../state.js';
import { isManagementUser } from '../roles.js';

const statusText = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy'
};

const paymentText = {
    COD: 'COD',
    BANK_TRANSFER: 'Chuyển khoản',
    VNPAY: 'VNPAY',
    MOMO: 'MOMO'
};

let adminProducts = [];
let isEditingProduct = false;

export async function loadAdminDashboard() {
    const root = document.getElementById('adminDashboard');
    if (!root) return;

    if (!isManagementUser(state.currentUser)) {
        root.innerHTML = `
            <div class="admin-access-denied">
                <i class="fas fa-lock"></i>
                <h1>Không có quyền truy cập</h1>
                <p>Tài khoản hiện tại không thuộc nhóm quản trị.</p>
            </div>
        `;
        return;
    }

    const welcome = document.getElementById('adminWelcome');
    if (welcome) {
        welcome.textContent = `Xin chào, ${state.currentUser.full_name || state.currentUser.username}`;
    }

    const refreshBtn = document.getElementById('adminRefreshBtn');
    if (refreshBtn) {
        refreshBtn.onclick = () => loadAdminDashboard();
        refreshBtn.disabled = true;
        refreshBtn.querySelector('i')?.classList.add('fa-spin');
    }

    setupTabs();
    setupProductModal();

    try {
        const res = await fetch(`${API_BASE}/admin/dashboard`, { credentials: 'include' });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Không thể tải dữ liệu quản trị');
        }

        renderSummary(data.summary || {});
        renderRecentOrders(data.recent_orders || []);
        renderLowStockProducts(data.low_stock_products || []);
    } catch (err) {
        renderLoadError(err.message);
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.querySelector('i')?.classList.remove('fa-spin');
        }
    }
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            // Update active btn
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.fontWeight = '500';
                b.style.color = 'var(--text-muted)';
            });
            btn.classList.add('active');
            btn.style.fontWeight = '600';
            btn.style.color = 'var(--primary-color)';

            // Update active content
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab-content').forEach(c => {
                c.style.display = 'none';
            });
            document.getElementById(`tab-${tabId}`).style.display = 'block';

            if (tabId === 'products') {
                loadAdminProducts();
            } else if (tabId === 'orders') {
                loadAdminOrders();
            }
        };
    });
}

async function loadAdminProducts() {
    const list = document.getElementById('adminProductsList');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="7" class="admin-empty">Đang tải danh sách sản phẩm...</td></tr>';
    
    // Clear search input on fresh load
    const searchInput = document.getElementById('adminProductSearchInput');
    if (searchInput) searchInput.value = '';

    try {
        const res = await fetch(`${API_BASE}/admin/products`, { credentials: 'include' });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Lỗi tải sản phẩm');
        
        adminProducts = data;
        renderAdminProducts(adminProducts);
    } catch (err) {
        list.innerHTML = `<tr><td colspan="7" class="admin-empty error">${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderAdminProducts(products) {
    const list = document.getElementById('adminProductsList');
    if (!list) return;

    if (products.length === 0) {
        const searchInput = document.getElementById('adminProductSearchInput');
        const hasQuery = searchInput && searchInput.value.trim().length > 0;
        list.innerHTML = `<tr><td colspan="7" class="admin-empty">${hasQuery ? 'Không tìm thấy sản phẩm nào phù hợp.' : 'Không có sản phẩm nào.'}</td></tr>`;
        return;
    }

    list.innerHTML = products.map(p => `
        <tr>
            <td>
                <img src="${escapeHtml(p.thumbnail_url || 'img/placeholder.jpg')}" alt="${escapeHtml(p.product_name)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>
                <div style="font-weight: 500;">${escapeHtml(p.product_name)}</div>
                <div style="font-size: 0.85em; color: var(--text-muted);">${escapeHtml(p.sku)}</div>
            </td>
            <td>${escapeHtml(p.category_name || 'N/A')}</td>
            <td>
                <div>${formatCurrency(p.price)}</div>
                ${p.discount_price ? `<div style="font-size: 0.85em; color: #e74c3c;">KM: ${formatCurrency(p.discount_price)}</div>` : ''}
            </td>
            <td>${formatNumber(p.stock_quantity)}</td>
            <td>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85em; ${p.is_active ? 'background: #e8f5e9; color: #2e7d32;' : 'background: #ffebee; color: #c62828;'}">
                    ${p.is_active ? 'Đang bán' : 'Ngừng bán'}
                </span>
            </td>
            <td>
                <button class="edit-product-btn" data-id="${p.id}" style="background: none; border: none; color: #3498db; cursor: pointer; margin-right: 10px;" title="Sửa" onclick="if(window._adminUtils) window._adminUtils.openProductModal(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="delete-product-btn" data-id="${p.id}" style="background: none; border: none; color: #e74c3c; cursor: pointer;" title="Xóa" onclick="if(window._adminUtils) window._adminUtils.deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Attach events (still kept as backup but inline handles it directly)
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.onclick = () => openProductModal(parseInt(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.onclick = () => deleteProduct(parseInt(btn.getAttribute('data-id')));
    });
}

function setupProductModal() {
    const addBtn = document.getElementById('adminAddProductBtn');
    const closeBtn = document.getElementById('closeProductModalBtn');
    const cancelBtn = document.getElementById('cancelProductBtn');
    const form = document.getElementById('adminProductForm');

    if (addBtn) addBtn.onclick = () => openProductModal();
    if (closeBtn) closeBtn.onclick = closeProductModal;
    if (cancelBtn) cancelBtn.onclick = closeProductModal;
    if (form) form.onsubmit = saveProduct;
    
    // Load categories for select
    loadCategoriesForSelect();
}

window._adminUtils = {
    openProductModal,
    deleteProduct,
    logoutAdmin,
    searchAdminProducts,
    filterOrders,
    updateOrderStatus
};

export function searchAdminProducts(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        renderAdminProducts(adminProducts);
        return;
    }
    const filtered = adminProducts.filter(p => 
        (p.product_name || '').toLowerCase().includes(q) || 
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q)
    );
    renderAdminProducts(filtered);
}

async function logoutAdmin() {
    try {
        await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
        console.error("Lỗi đăng xuất:", e);
    }
    state.currentUser = null;
    const auth = await import('./auth.js');
    auth.updateAuthUI();
    
    // Dispatch scroll event if needed, but a full reload is safer to clear any admin state
    window.location.reload();
}

async function loadCategoriesForSelect() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) {
            const categories = await res.json();
            const select = document.getElementById('ap_category');
            if (select) {
                select.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.category_name)}</option>`).join('');
            }
        }
    } catch (err) {
        console.error("Lỗi tải danh mục:", err);
    }
}

function openProductModal(productId = null) {
    try {
        console.log("Mở modal cho sản phẩm:", productId);
        const modal = document.getElementById('adminProductModalOverlay');
        const title = document.getElementById('productModalTitle');
        const form = document.getElementById('adminProductForm');
        
        if (!modal) {
            alert('Lỗi: Không tìm thấy adminProductModalOverlay');
            return;
        }
        if (!form) {
            alert('Lỗi: Không tìm thấy adminProductForm');
            return;
        }
        
        form.reset();
        isEditingProduct = !!productId;
        
        if (isEditingProduct) {
            title.textContent = 'Sửa Sản phẩm';
            const p = adminProducts.find(x => x.id === productId);
            if (p) {
                document.getElementById('ap_id').value = p.id;
                document.getElementById('ap_name').value = p.product_name || '';
                document.getElementById('ap_sku').value = p.sku || '';
                document.getElementById('ap_category').value = p.category_id || '';
                document.getElementById('ap_price').value = p.price || '';
                document.getElementById('ap_discount').value = p.discount_price || '';
                document.getElementById('ap_stock').value = p.stock_quantity || 0;
                document.getElementById('ap_thumbnail').value = p.thumbnail_url || '';
                document.getElementById('ap_active').value = p.is_active ? 'true' : 'false';
                document.getElementById('ap_description').value = p.description || '';
            } else {
                console.warn("Không tìm thấy dữ liệu cho ID:", productId);
            }
        } else {
            title.textContent = 'Thêm Sản phẩm';
            document.getElementById('ap_id').value = '';
        }
        
        modal.style.setProperty('display', 'block', 'important');
    } catch (err) {
        console.error("Lỗi khi mở modal:", err);
        alert("Lỗi khi mở modal: " + err.message);
    }
}

function closeProductModal() {
    const modal = document.getElementById('adminProductModalOverlay');
    if (modal) modal.style.display = 'none';
}

async function saveProduct(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    const productId = document.getElementById('ap_id').value;
    const data = {
        product_name: document.getElementById('ap_name').value.trim(),
        sku: document.getElementById('ap_sku').value.trim(),
        category_id: parseInt(document.getElementById('ap_category').value) || null,
        price: parseFloat(document.getElementById('ap_price').value),
        discount_price: document.getElementById('ap_discount').value ? parseFloat(document.getElementById('ap_discount').value) : null,
        stock_quantity: parseInt(document.getElementById('ap_stock').value) || 0,
        thumbnail_url: document.getElementById('ap_thumbnail').value.trim() || null,
        is_active: document.getElementById('ap_active').value === 'true',
        description: document.getElementById('ap_description').value.trim() || null
    };

    try {
        const url = isEditingProduct ? `${API_BASE}/admin/products/${productId}` : `${API_BASE}/admin/products`;
        const method = isEditingProduct ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Lỗi khi lưu sản phẩm');
        
        alert('Lưu sản phẩm thành công!');
        closeProductModal();
        loadAdminProducts(); // Reload table
        // Also update dashboard counts
        loadAdminDashboard();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu';
    }
}

async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa sản phẩm');
        
        loadAdminProducts(); // Reload table
        loadAdminDashboard(); // Reload stats
    } catch (err) {
        alert(err.message);
    }
}

// ===== ADMIN ORDERS MANAGEMENT =====
let adminOrders = [];
let currentOrderFilter = '';

async function loadAdminOrders(statusFilter = '') {
    const list = document.getElementById('adminOrdersList');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="8" class="admin-empty">Đang tải danh sách đơn hàng...</td></tr>';
    currentOrderFilter = statusFilter;

    try {
        let url = `${API_BASE}/admin/orders`;
        if (statusFilter) url += `?status=${statusFilter}`;

        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Lỗi tải đơn hàng');

        adminOrders = data;
        renderAdminOrders(adminOrders);
    } catch (err) {
        list.innerHTML = `<tr><td colspan="8" class="admin-empty error">${escapeHtml(err.message)}</td></tr>`;
    }
}

function filterOrders(status) {
    // Update active filter button
    document.querySelectorAll('.admin-order-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-status') === status);
    });
    loadAdminOrders(status);
}

function renderAdminOrders(orders) {
    const list = document.getElementById('adminOrdersList');
    if (!list) return;

    if (orders.length === 0) {
        list.innerHTML = '<tr><td colspan="8" class="admin-empty">Không có đơn hàng nào.</td></tr>';
        return;
    }

    list.innerHTML = orders.map(order => {
        const customerName = order.full_name || order.username || 'Khách hàng';
        const receiverInfo = order.receiver_name
            ? `${escapeHtml(order.receiver_name)}${order.receiver_phone ? ' - ' + escapeHtml(order.receiver_phone) : ''}`
            : escapeHtml(customerName);
        const address = order.shipping_address
            ? (order.shipping_address.length > 40
                ? escapeHtml(order.shipping_address.substring(0, 40)) + '...'
                : escapeHtml(order.shipping_address))
            : 'N/A';

        const statusOptions = buildStatusDropdown(order.id, order.order_status);

        return `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>
                    <div style="font-weight: 500;">${receiverInfo}</div>
                    <div style="font-size: 0.8em; color: var(--text-muted);">${escapeHtml(order.email || '')}</div>
                </td>
                <td title="${escapeHtml(order.shipping_address || '')}">${address}</td>
                <td>
                    <div>${paymentText[order.payment_method] || escapeHtml(order.payment_method || 'N/A')}</div>
                    <div style="font-size: 0.78em; color: ${getPaymentStatusColor(order.payment_status)};">
                        ${getPaymentStatusText(order.payment_status)}
                    </div>
                </td>
                <td><strong>${formatCurrency(order.final_amount || order.total_amount || 0)}</strong></td>
                <td>
                    <span class="admin-status ${getStatusClass(order.order_status)}">
                        ${statusText[order.order_status] || escapeHtml(order.order_status || 'Khác')}
                    </span>
                </td>
                <td style="font-size: 0.85em;">${escapeHtml(order.created_at || '')}</td>
                <td>${statusOptions}</td>
            </tr>
        `;
    }).join('');
}

function buildStatusDropdown(orderId, currentStatus) {
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
        return `<span style="font-size: 0.82em; color: var(--text-muted); font-style: italic;">Đã kết thúc</span>`;
    }

    const transitions = {
        'PENDING': [{ value: 'CONFIRMED', label: 'Xác nhận', icon: 'fa-check', color: '#3498db' }, { value: 'CANCELLED', label: 'Hủy', icon: 'fa-times', color: '#e74c3c' }],
        'CONFIRMED': [{ value: 'SHIPPING', label: 'Giao hàng', icon: 'fa-truck', color: '#9b59b6' }, { value: 'CANCELLED', label: 'Hủy', icon: 'fa-times', color: '#e74c3c' }],
        'SHIPPING': [{ value: 'COMPLETED', label: 'Hoàn tất', icon: 'fa-check-double', color: '#27ae60' }]
    };

    const available = transitions[currentStatus] || [];
    if (available.length === 0) return '';

    return available.map(t => `
        <button class="admin-order-action-btn"
                style="color: ${t.color}; border-color: ${t.color};"
                onclick="if(window._adminUtils) window._adminUtils.updateOrderStatus(${orderId}, '${t.value}')"
                title="${t.label}">
            <i class="fas ${t.icon}"></i> ${t.label}
        </button>
    `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    const statusLabels = { CONFIRMED: 'xác nhận', SHIPPING: 'giao hàng', COMPLETED: 'hoàn tất', CANCELLED: 'hủy' };
    const label = statusLabels[newStatus] || newStatus;

    if (!confirm(`Bạn có chắc muốn ${label} đơn hàng #${orderId}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');

        // Reload orders + dashboard
        loadAdminOrders(currentOrderFilter);
        loadAdminDashboard();
    } catch (err) {
        alert(err.message);
    }
}

function getPaymentStatusText(status) {
    const map = { PENDING: 'Chưa thanh toán', SUCCESS: 'Đã thanh toán', FAILED: 'Thất bại', REFUNDED: 'Hoàn tiền' };
    return map[status] || status || '';
}

function getPaymentStatusColor(status) {
    const map = { PENDING: '#f39c12', SUCCESS: '#27ae60', FAILED: '#e74c3c', REFUNDED: '#9b59b6' };
    return map[status] || 'var(--text-muted)';
}

function renderSummary(summary) {
    setText('adminRevenue', formatCurrency(summary.revenue || 0));
    setText('adminOrders', formatNumber(summary.total_orders || 0));
    setText('adminPendingOrders', formatNumber(summary.pending_orders || 0));
    setText('adminProductsCount', formatNumber(summary.total_products || 0));
}

function renderRecentOrders(orders) {
    const body = document.getElementById('adminRecentOrders');
    if (!body) return;

    if (orders.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="admin-empty">Chưa có đơn hàng.</td></tr>';
        return;
    }

    body.innerHTML = orders.map(order => {
        const customerName = order.full_name || order.username || order.receiver_name || 'Khách hàng';
        return `
            <tr>
                <td>#${order.id}</td>
                <td>${escapeHtml(customerName)}</td>
                <td>
                    <span class="admin-status ${getStatusClass(order.order_status)}">
                        ${statusText[order.order_status] || escapeHtml(order.order_status || 'Khác')}
                    </span>
                </td>
                <td>${paymentText[order.payment_method] || escapeHtml(order.payment_method || 'N/A')}</td>
                <td>${formatCurrency(order.final_amount || order.total_amount || 0)}</td>
                <td>${escapeHtml(order.created_at || '')}</td>
            </tr>
        `;
    }).join('');
}

function renderLowStockProducts(products) {
    const list = document.getElementById('adminLowStockProducts');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = '<div class="admin-empty">Không có sản phẩm tồn kho thấp.</div>';
        return;
    }

    list.innerHTML = products.map(product => `
        <div class="admin-stock-item">
            <div>
                <strong>${escapeHtml(product.product_name || 'Sản phẩm')}</strong>
                <span>${escapeHtml(product.sku || 'SKU')} · ${escapeHtml(product.category_name || 'Danh mục')}</span>
            </div>
            <b>${formatNumber(product.stock_quantity || 0)}</b>
        </div>
    `).join('');
}

function renderLoadError(message) {
    const body = document.getElementById('adminRecentOrders');
    const stock = document.getElementById('adminLowStockProducts');

    if (body) {
        body.innerHTML = `<tr><td colspan="6" class="admin-empty error">${escapeHtml(message)}</td></tr>`;
    }
    if (stock) {
        stock.innerHTML = `<div class="admin-empty error">${escapeHtml(message)}</div>`;
    }
}

function getStatusClass(status) {
    return (status || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(value);
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
}
