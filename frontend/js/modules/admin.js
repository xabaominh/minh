import { API_BASE, state } from '../state.js';
import { isManagementUser } from '../roles.js';
import { formatVariantLabel } from '../variantUtils.js';

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
let activeChatConvId = null;
let adminChatLastMsgId = 0;
let adminChatPollTimer = null;
let adminChatConversations = [];

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
    setupAdminChatForm();
    fetchAdminChatUnread();

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
            btn.style.color = 'var(--primary)';

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
            } else if (tabId === 'chat') {
                loadAdminChat();
            } else {
                stopAdminChatPolling();
            }
        };
    });
}

async function loadAdminProducts() {
    const list = document.getElementById('adminProductsList');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="8" class="admin-empty">Đang tải danh sách sản phẩm...</td></tr>';
    
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
        list.innerHTML = `<tr><td colspan="8" class="admin-empty error">${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderAdminProducts(products) {
    const list = document.getElementById('adminProductsList');
    if (!list) return;

    if (products.length === 0) {
        const searchInput = document.getElementById('adminProductSearchInput');
        const hasQuery = searchInput && searchInput.value.trim().length > 0;
        list.innerHTML = `<tr><td colspan="8" class="admin-empty">${hasQuery ? 'Không tìm thấy sản phẩm nào phù hợp.' : 'Không có sản phẩm nào.'}</td></tr>`;
        return;
    }

    list.innerHTML = products.map(p => {
        const variants = p.variants || [];
        const variantsHtml = variants.length
            ? `<div class="admin-variant-list">
                ${variants.map(v => `
                    <span class="admin-variant-chip ${v.is_active ? '' : 'inactive'}" title="SKU: ${escapeHtml(v.sku || '')}">
                        ${escapeHtml(formatVariantLabel(v))}
                        <em>· ${formatNumber(v.stock_quantity || 0)} sp</em>
                    </span>
                `).join('')}
               </div>`
            : '<span class="admin-variant-empty">Chưa có biến thể</span>';

        return `
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
            <td class="admin-product-variants-cell">
                ${variants.length ? `<div class="admin-variant-count">${variants.length} biến thể</div>` : ''}
                ${variantsHtml}
            </td>
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
    `;
    }).join('');

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
    updateOrderStatus,
    refreshAdminChat,
    selectAdminConversation,
    closeAdminConversation
};

function setupAdminChatForm() {
    document.getElementById('adminChatForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendAdminChatMessage();
    });
}

async function loadAdminChat() {
    const list = document.getElementById('adminChatList');
    if (!list) return;

    list.innerHTML = '<div class="admin-empty" style="padding:20px;">Đang tải...</div>';

    try {
        const res = await fetch(`${API_BASE}/admin/chat/conversations?status=OPEN`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể tải hội thoại');

        adminChatConversations = data;
        renderAdminChatList(data);
        fetchAdminChatUnread();

        if (activeChatConvId) {
            const stillExists = data.some(c => c.id === activeChatConvId);
            if (stillExists) selectAdminConversation(activeChatConvId, false);
            else resetAdminChatThread();
        }
    } catch (err) {
        list.innerHTML = `<div class="admin-empty error" style="padding:20px;">${escapeHtml(err.message)}</div>`;
    }
}

function renderAdminChatList(conversations) {
    const list = document.getElementById('adminChatList');
    if (!list) return;

    if (!conversations.length) {
        list.innerHTML = '<div class="admin-empty" style="padding:20px;">Chưa có hội thoại nào.</div>';
        return;
    }

    list.innerHTML = conversations.map(conv => {
        const name = conv.full_name || conv.username || 'Khách hàng';
        const preview = conv.last_message || 'Chưa có tin nhắn';
        const unread = conv.unread_count || 0;
        return `
            <div class="admin-chat-conv-item ${conv.id === activeChatConvId ? 'active' : ''}"
                 onclick="if(window._adminUtils) window._adminUtils.selectAdminConversation(${conv.id})">
                <div class="conv-name">
                    <span>${escapeHtml(name)}</span>
                    ${unread > 0 ? `<span class="conv-unread">${unread}</span>` : ''}
                </div>
                <div class="conv-preview">${escapeHtml(preview)}</div>
            </div>
        `;
    }).join('');
}

async function selectAdminConversation(convId, reloadList = true) {
    activeChatConvId = convId;
    adminChatLastMsgId = 0;

    if (reloadList) {
        document.querySelectorAll('.admin-chat-conv-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.admin-chat-conv-item[onclick*="${convId}"]`)?.classList.add('active');
    }

    const container = document.getElementById('adminChatMessages');
    if (container) container.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/admin/chat/conversations/${convId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể tải tin nhắn');

        const conv = data.conversation;
        const nameEl = document.getElementById('adminChatThreadName');
        const statusEl = document.getElementById('adminChatThreadStatus');
        const closeBtn = document.getElementById('adminChatCloseBtn');
        const form = document.getElementById('adminChatForm');

        if (nameEl) nameEl.textContent = conv.full_name || conv.username || 'Khách hàng';
        if (statusEl) {
            statusEl.textContent = conv.status === 'OPEN' ? 'Đang mở' : 'Đã đóng';
            statusEl.className = `admin-chat-status-badge ${conv.status === 'OPEN' ? 'open' : 'closed'}`;
            statusEl.style.display = 'inline-block';
        }
        if (closeBtn) closeBtn.style.display = conv.status === 'OPEN' ? 'inline-block' : 'none';
        if (form) form.style.display = conv.status === 'OPEN' ? 'flex' : 'none';

        renderAdminChatMessages(data.messages || []);
        startAdminChatPolling();
        fetchAdminChatUnread();
    } catch (err) {
        if (container) container.innerHTML = '';
        alert(err.message);
    }
}

function renderAdminChatMessages(messages, append = false) {
    const container = document.getElementById('adminChatMessages');
    if (!container) return;

    if (!messages.length && !append) {
        container.innerHTML = '';
        adminChatLastMsgId = 0;
        return;
    }

    if (!append) {
        container.innerHTML = '';
        adminChatLastMsgId = 0;
    }

    messages.forEach(msg => {
        if (msg.id <= adminChatLastMsgId) return;
        adminChatLastMsgId = Math.max(adminChatLastMsgId, msg.id);
        const bubble = document.createElement('div');
        const isStaff = msg.sender_role === 'ADMIN';
        bubble.className = `chat-bubble ${isStaff ? 'mine' : 'theirs'}`;
        const sender = isStaff ? 'Bạn' : (msg.full_name || msg.username || 'Khách');
        bubble.innerHTML = `<span class="chat-text">${linkifyAdminOrderRefs(escapeHtml(msg.body))}</span><span class="chat-meta">${escapeHtml(sender)} · ${formatChatTime(msg.created_at)}</span>`;
        container.appendChild(bubble);
    });

    // Gắn click handler cho các link đơn hàng
    container.querySelectorAll('.chat-order-link:not([data-bound])').forEach(link => {
        link.setAttribute('data-bound', '1');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const orderId = link.dataset.orderId;
            navigateToAdminOrder(orderId);
        });
    });

    container.scrollTop = container.scrollHeight;
}

function linkifyAdminOrderRefs(html) {
    return html.replace(/(đơn\s*hàng\s*)?#(\d+)/gi, (match, prefix, id) => {
        return `<a href="javascript:void(0)" class="chat-order-link" data-order-id="${id}" title="Xem đơn hàng #${id}">${match}</a>`;
    });
}

async function navigateToAdminOrder(orderId) {
    // Chuyển sang tab orders
    const ordersTabBtn = document.querySelector('.admin-tab-btn[data-tab="orders"]');
    if (ordersTabBtn) ordersTabBtn.click();

    // Đợi tab load xong rồi highlight đơn hàng
    setTimeout(() => {
        const rows = document.querySelectorAll('.admin-order-row');
        for (const row of rows) {
            const idCell = row.querySelector('td:first-child strong');
            if (idCell && idCell.textContent.trim() === `#${orderId}`) {
                // Mở detail row
                const detailRow = row.nextElementSibling;
                if (detailRow && detailRow.classList.contains('admin-order-detail-row')) {
                    detailRow.classList.add('show');
                }
                // Highlight và scroll
                row.style.background = 'rgba(37, 99, 235, 0.12)';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => { row.style.background = ''; }, 3000);
                return;
            }
        }
        // Nếu không tìm thấy (có thể đang filter), load lại tất cả rồi thử lại
        loadAdminOrders('');
        setTimeout(() => {
            const retryRows = document.querySelectorAll('.admin-order-row');
            for (const row of retryRows) {
                const idCell = row.querySelector('td:first-child strong');
                if (idCell && idCell.textContent.trim() === `#${orderId}`) {
                    const detailRow = row.nextElementSibling;
                    if (detailRow && detailRow.classList.contains('admin-order-detail-row')) {
                        detailRow.classList.add('show');
                    }
                    row.style.background = 'rgba(37, 99, 235, 0.12)';
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { row.style.background = ''; }, 3000);
                    return;
                }
            }
        }, 800);
    }, 500);
}

async function sendAdminChatMessage() {
    if (!activeChatConvId) return;
    const input = document.getElementById('adminChatInput');
    const body = input?.value.trim();
    if (!body) return;

    try {
        const res = await fetch(`${API_BASE}/admin/chat/conversations/${activeChatConvId}/messages`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gửi thất bại');

        input.value = '';
        renderAdminChatMessages([data.data], true);
        loadAdminChat();
    } catch (err) {
        alert(err.message);
    }
}

async function closeAdminConversation() {
    if (!activeChatConvId) return;
    if (!confirm('Đóng hội thoại này?')) return;

    try {
        const res = await fetch(`${API_BASE}/admin/chat/conversations/${activeChatConvId}/status`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CLOSED' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể đóng hội thoại');

        resetAdminChatThread();
        loadAdminChat();
        fetchAdminChatUnread();
    } catch (err) {
        alert(err.message);
    }
}

function resetAdminChatThread() {
    activeChatConvId = null;
    adminChatLastMsgId = 0;
    stopAdminChatPolling();

    const nameEl = document.getElementById('adminChatThreadName');
    const statusEl = document.getElementById('adminChatThreadStatus');
    const closeBtn = document.getElementById('adminChatCloseBtn');
    const form = document.getElementById('adminChatForm');
    const container = document.getElementById('adminChatMessages');

    if (nameEl) nameEl.textContent = 'Chọn hội thoại';
    if (statusEl) statusEl.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';
    if (form) form.style.display = 'none';
    if (container) container.innerHTML = '';
}

function refreshAdminChat() {
    loadAdminChat();
}

function startAdminChatPolling() {
    stopAdminChatPolling();
    adminChatPollTimer = setInterval(pollAdminChatMessages, 3000);
}

function stopAdminChatPolling() {
    if (adminChatPollTimer) {
        clearInterval(adminChatPollTimer);
        adminChatPollTimer = null;
    }
}

async function pollAdminChatMessages() {
    if (!activeChatConvId) return;
    try {
        const url = adminChatLastMsgId
            ? `${API_BASE}/admin/chat/conversations/${activeChatConvId}?since_id=${adminChatLastMsgId}`
            : `${API_BASE}/admin/chat/conversations/${activeChatConvId}`;
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) return;

        if (data.messages?.length) {
            renderAdminChatMessages(data.messages, true);
        }
    } catch (_) { /* silent */ }
}

async function fetchAdminChatUnread() {
    try {
        const res = await fetch(`${API_BASE}/admin/chat/unread`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) return;

        const badge = document.getElementById('adminChatTabBadge');
        if (badge) {
            const count = data.unread_count || 0;
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (_) { /* silent */ }
}

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

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
                renderProductModalVariants(p.variants || []);
            } else {
                console.warn("Không tìm thấy dữ liệu cho ID:", productId);
                renderProductModalVariants([]);
            }
        } else {
            title.textContent = 'Thêm Sản phẩm';
            document.getElementById('ap_id').value = '';
            renderProductModalVariants([]);
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

        const itemsHtml = (order.items || []).map(item => {
            const variantLabel = formatOrderItemVariant(item);
            return `
            <div class="admin-order-item-row">
                <img src="${escapeHtml(item.thumbnail_url || 'img/placeholder.jpg')}" alt="${escapeHtml(item.product_name)}" class="admin-order-item-thumb">
                <div class="admin-order-item-name">
                    <span class="admin-order-item-title">${escapeHtml(item.product_name)}</span>
                    ${variantLabel ? `<span class="admin-order-item-variant"><i class="fas fa-sliders-h"></i> ${escapeHtml(variantLabel)}</span>` : ''}
                </div>
                <span class="admin-order-item-qty">x${item.quantity}</span>
                <span class="admin-order-item-price">${formatCurrency(item.price)}</span>
                <span class="admin-order-item-subtotal">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `;
        }).join('');

        return `
            <tr class="admin-order-row" onclick="this.nextElementSibling.classList.toggle('show')" style="cursor:pointer;" title="Click để xem chi tiết sản phẩm">
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
                <td onclick="event.stopPropagation()">${statusOptions}</td>
            </tr>
            <tr class="admin-order-detail-row">
                <td colspan="8">
                    <div class="admin-order-items-wrap">
                        <div class="admin-order-items-header">
                            <span style="flex:2">Sản phẩm</span>
                            <span style="flex:0 0 60px;text-align:center">SL</span>
                            <span style="flex:0 0 120px;text-align:right">Đơn giá</span>
                            <span style="flex:0 0 120px;text-align:right">Thành tiền</span>
                        </div>
                        ${itemsHtml || '<div style="padding:8px 0;color:var(--text-muted);">Không có thông tin sản phẩm</div>'}
                    </div>
                </td>
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

function formatOrderItemVariant(item) {
    if (item.variant_size || item.variant_color || item.variant_material) {
        return [item.variant_size, item.variant_color, item.variant_material]
            .filter(Boolean)
            .join(' · ');
    }
    if (item.variant_id) {
        return `Biến thể #${item.variant_id}`;
    }
    return '';
}

function renderProductModalVariants(variants) {
    const wrap = document.getElementById('ap_variants_wrap');
    const list = document.getElementById('ap_variants_list');
    if (!wrap || !list) return;

    if (!variants.length) {
        wrap.style.display = 'none';
        list.innerHTML = '';
        return;
    }

    wrap.style.display = 'block';
    list.innerHTML = variants.map(v => `
        <div class="admin-modal-variant-item">
            <span class="admin-variant-chip">${escapeHtml(formatVariantLabel(v))}</span>
            <span class="admin-modal-variant-meta">
                SKU: ${escapeHtml(v.sku || '—')} · Tồn: ${formatNumber(v.stock_quantity || 0)}
                ${!v.is_active ? ' · <em>Ngừng bán</em>' : ''}
            </span>
        </div>
    `).join('');
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
}
