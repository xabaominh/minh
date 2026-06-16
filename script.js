// =====================================================
// SCRIPT.JS — LuxDecor SPA v2
// Kết nối Flask API v2 (8 bảng)
// Auth + Cart server-side + Orders
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api';

// =====================================================
// STATE
// =====================================================
let cart = JSON.parse(localStorage.getItem('luxdecor_cart') || '[]');
let allProducts = [];
let allCategories = [];
let currentCategoryId = '';
let currentSearch = '';
let currentView = 'home';
let currentUser = null; // null = chưa login

// =====================================================
// KHỞI CHẠY
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    hideLoadingSpinner();

    // Kiểm tra trạng thái đăng nhập
    await checkAuth();

    // Load data
    await loadCategoriesData();
    renderCategoryButtons();
    loadProducts();
    loadAllProducts();

    // Setup events
    setupNavigation();
    setupCart();
    setupSearch();
    setupSorting();
    setupPriceFilter();
    setupScrollEffects();
    setupMobileMenu();
    setupSidebarToggle();
    setupScrollReveal();
    setupAuth();
    setupCheckout();
    setupProductModal();
    updateCartUI();
});

// =====================================================
// AUTH — Kiểm tra đăng nhập
// =====================================================
async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/profile`, { credentials: 'include' });
        const data = await res.json();
        if (data.logged_in) {
            currentUser = data.user;
            updateAuthUI();
        }
    } catch (e) {
        console.log('Auth check failed:', e);
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const loggedIn = document.getElementById('userLoggedIn');
    const dropdownName = document.getElementById('dropdownUsername');

    if (currentUser) {
        loginBtn.style.display = 'none';
        loggedIn.style.display = 'block';
        dropdownName.textContent = currentUser.full_name || currentUser.username;
    } else {
        loginBtn.style.display = 'block';
        loggedIn.style.display = 'none';
    }
}

function setupAuth() {
    // Mở modal login
    document.getElementById('loginBtn').addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal('login');
    });

    // Đóng modal
    document.getElementById('closeAuthBtn').addEventListener('click', closeAuthModal);

    // Tab login/register
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById('loginForm').style.display = target === 'login' ? 'block' : 'none';
            document.getElementById('registerForm').style.display = target === 'register' ? 'block' : 'none';
        });
    });

    // Submit login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: document.getElementById('loginUsername').value,
                    password: document.getElementById('loginPassword').value
                })
            });
            const data = await res.json();
            if (res.ok) {
                currentUser = data.user;
                updateAuthUI();
                closeAuthModal();
                showNotification(`Xin chào, ${currentUser.full_name || currentUser.username}!`, 'success');
                // Merge localStorage cart vào server
                await mergeLocalCart();
                await syncCartFromServer();
            } else {
                showNotification(data.error, 'error');
            }
        } catch (err) {
            showNotification('Không thể kết nối server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng Nhập';
        }
    });

    // Submit register
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('registerSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: document.getElementById('regUsername').value,
                    email: document.getElementById('regEmail').value,
                    password: document.getElementById('regPassword').value,
                    full_name: document.getElementById('regFullname').value,
                    phone: document.getElementById('regPhone').value,
                    address: document.getElementById('regAddress').value
                })
            });
            const data = await res.json();
            if (res.ok) {
                currentUser = data.user;
                updateAuthUI();
                closeAuthModal();
                showNotification('🎉 Đăng ký thành công!', 'success');
                await mergeLocalCart();
                await syncCartFromServer();
            } else {
                showNotification(data.error, 'error');
            }
        } catch (err) {
            showNotification('Không thể kết nối server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Đăng Ký';
        }
    });

    // User dropdown toggle
    document.getElementById('userDropdownBtn').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('userDropdown').classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-logged-in')) {
            document.getElementById('userDropdown').classList.remove('show');
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {}
        currentUser = null;
        updateAuthUI();
        document.getElementById('userDropdown').classList.remove('show');
        showNotification('Đã đăng xuất', 'info');
        // Nếu đang ở trang orders, quay về home
        if (currentView === 'orders') switchView('home');
    });

    // Xem đơn hàng
    document.getElementById('viewOrdersBtn').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('userDropdown').classList.remove('show');
        switchView('orders');
    });
}

function openAuthModal(tab = 'login') {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    // Switch to correct tab
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.body.style.overflow = '';
}

// =====================================================
// CART — Hybrid: localStorage (guest) + server (logged in)
// =====================================================
async function mergeLocalCart() {
    if (!currentUser || cart.length === 0) return;
    try {
        const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
        await fetch(`${API_BASE}/cart/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items })
        });
        // Clear localStorage after merge
        cart = [];
        localStorage.removeItem('luxdecor_cart');
    } catch (e) {
        console.error('Merge cart error:', e);
    }
}

async function syncCartFromServer() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/cart`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            // Update local cart representation for badge
            cart = (data.items || []).map(item => ({
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

function setupCart() {
    document.getElementById('cartBtn').addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('overlay').addEventListener('click', () => {
        closeCart();
        closeAuthModal();
        closeCheckoutModal();
        closeProductModal();
    });
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeCart(); closeAuthModal(); closeCheckoutModal(); closeProductModal(); }
    });
}

async function addToCart(productId, name, price, imageUrl) {
    if (currentUser) {
        // Server-side
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
        // localStorage
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ id: productId, name, price, image: imageUrl, quantity: 1 });
        }
        localStorage.setItem('luxdecor_cart', JSON.stringify(cart));
        updateCartUI();
        showNotification(`Đã thêm "${name}" vào giỏ hàng!`, 'success');
    }
}

async function removeFromCart(idOrItemId) {
    if (currentUser) {
        try {
            await fetch(`${API_BASE}/cart/remove/${idOrItemId}`, { method: 'DELETE', credentials: 'include' });
            await syncCartFromServer();
        } catch (e) {}
    } else {
        cart = cart.filter(item => item.id !== idOrItemId);
        localStorage.setItem('luxdecor_cart', JSON.stringify(cart));
        updateCartUI();
    }
    renderCartItems();
}

async function changeQuantity(idOrItemId, delta) {
    if (currentUser) {
        const item = cart.find(i => i.item_id === idOrItemId);
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
        const item = cart.find(i => i.id === idOrItemId);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) { removeFromCart(idOrItemId); return; }
        localStorage.setItem('luxdecor_cart', JSON.stringify(cart));
        updateCartUI();
        renderCartItems();
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

function openCart() {
    renderCartItems();
    document.getElementById('cartModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.body.style.overflow = '';
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart"><i class="fas fa-shopping-basket"></i><br>Giỏ hàng trống</p>';
        totalEl.textContent = '0 ₫';
        return;
    }

    const isLoggedIn = !!currentUser;

    container.innerHTML = cart.map(item => {
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
                    <button onclick="changeQuantity(${changeId}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${changeId}, +1)">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart(${removeId})" title="Xoá">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `}).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalEl.textContent = formatPrice(total);
}

// =====================================================
// CHECKOUT
// =====================================================
function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Giỏ hàng đang trống!', 'warning');
        return;
    }
    if (!currentUser) {
        // Chưa login → hiện modal đăng nhập
        closeCart();
        showNotification('Vui lòng đăng nhập để thanh toán', 'info');
        openAuthModal('login');
        return;
    }
    // Đã login → hiện checkout modal
    closeCart();
    openCheckoutModal();
}

function setupCheckout() {
    document.getElementById('closeCheckoutBtn').addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
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
                cart = [];
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

function openCheckoutModal() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('checkoutTotal').textContent = formatPrice(total);
    // Pre-fill address if user has one
    if (currentUser && currentUser.address) {
        document.getElementById('checkoutAddress').value = currentUser.address;
    }
    document.getElementById('checkoutModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.body.style.overflow = '';
}

// =====================================================
// ORDERS — Lịch sử đơn hàng
// =====================================================
async function loadOrders() {
    const container = document.getElementById('ordersContainer');
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

// =====================================================
// ROUTING — Chuyển View SPA
// =====================================================
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetView = link.dataset.view;
            if (targetView) {
                e.preventDefault();
                switchView(targetView);
            }
        });
    });
}

function switchView(viewName, filterCategoryId = null) {
    currentView = viewName;
    const views = { home: 'home-view', collection: 'collection-view', orders: 'orders-view' };

    // Ẩn tất cả views
    Object.values(views).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Hiện view đích
    const targetEl = document.getElementById(views[viewName]);
    if (targetEl) targetEl.style.display = 'block';

    // Cập nhật nav active
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewName) link.classList.add('active');
    });

    if (viewName === 'collection' && filterCategoryId !== null) {
        currentCategoryId = filterCategoryId;
        document.querySelectorAll('#menu-trai a').forEach(a => a.classList.remove('active'));
        const activeBtn = document.querySelector(`#menu-trai a[data-category-id="${filterCategoryId}"]`)
            || document.querySelector('#menu-trai a[data-category-id=""]');
        if (activeBtn) activeBtn.classList.add('active');
        applyFilters();
    }

    if (viewName === 'orders') {
        loadOrders();
    }

    window.scrollTo(0, 0);
    // Cập nhật lại màu header
    window.dispatchEvent(new Event('scroll'));
}

window.switchView = switchView;

// =====================================================
// CATEGORIES — Load từ API
// =====================================================
async function loadCategoriesData() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) allCategories = await res.json();
    } catch (e) {
        console.error('Load categories error:', e);
    }
}

function renderCategoryButtons() {
    // Render trên trang chủ
    const catList = document.getElementById('categoryList');
    const icons = {
        'Phòng Khách': 'fa-couch', 'Phòng Ngủ': 'fa-bed',
        'Phòng Ăn': 'fa-utensils', 'Văn Phòng': 'fa-laptop-house', 'Kho Đồ': 'fa-box-open'
    };
    catList.innerHTML = allCategories.map(cat => `
        <a href="#" class="category-item" data-category-id="${cat.id}">
            <div class="category-icon"><i class="fas ${icons[cat.category_name] || 'fa-folder'}"></i></div>
            <span>${cat.category_name}</span>
        </a>
    `).join('');

    // Gắn event cho trang chủ
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
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Render trên sidebar collection
    const menuTrai = document.getElementById('menu-trai');
    const loadingCat = menuTrai.querySelector('.loading-cat');
    if (loadingCat) loadingCat.remove();

    allCategories.forEach(cat => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.categoryId = cat.id;
        a.textContent = cat.category_name;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            menuTrai.querySelectorAll('a').forEach(btn => btn.classList.remove('active'));
            a.classList.add('active');
            currentCategoryId = cat.id;
            applyFilters();
        });
        li.appendChild(a);
        menuTrai.appendChild(li);
    });

    // "Tất Cả" button
    const allBtn = menuTrai.querySelector('a[data-category-id=""]');
    if (allBtn) {
        allBtn.addEventListener('click', (e) => {
            e.preventDefault();
            menuTrai.querySelectorAll('a').forEach(btn => btn.classList.remove('active'));
            allBtn.classList.add('active');
            currentCategoryId = '';
            applyFilters();
        });
    }
}

// =====================================================
// PRODUCTS — Trang chủ (GET /api/products)
// =====================================================
async function loadProducts(categoryId = null, search = null) {
    const container = document.getElementById('productList');
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
            return `
            <div class="the-san-pham reveal-on-scroll" data-id="${p.id}">
                <div class="product-img-wrapper" onclick="openProductModal(${p.id})" style="cursor:pointer;">
                    <img src="${p.thumbnail_url}" alt="${p.product_name}" loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60'">
                    <div class="product-badge">${p.category_name}</div>
                </div>
                <div class="thong-tin">
                    <h3 onclick="openProductModal(${p.id})" style="cursor:pointer;">${p.product_name}</h3>
                    <p class="gia-tien">${formatPrice(p.price)}</p>
                    <button class="add-to-cart-btn"
                            onclick="addToCart(${p.id}, '${safeName}', ${p.price}, '${p.thumbnail_url}')">
                        <i class="fas fa-cart-plus"></i> Thêm Vào Giỏ
                    </button>
                </div>
            </div>`;
        }).join('');

        setupScrollReveal();
    } catch (err) {
        console.error('Load products error:', err);
        container.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải sản phẩm. Hãy chắc chắn server Flask đang chạy.</p><button class="retry-btn" onclick="loadProducts()"><i class="fas fa-redo"></i> Thử Lại</button></div>';
    }
}

// =====================================================
// PRODUCTS — Bộ sưu tập (cache + filter client-side)
// =====================================================
async function loadAllProducts() {
    const grid = document.getElementById('collectionGrid');
    grid.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải bộ sưu tập...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allProducts = await res.json();
        applyFilters();
    } catch (err) {
        grid.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải sản phẩm.</p><button class="retry-btn" onclick="loadAllProducts()"><i class="fas fa-redo"></i> Thử Lại</button></div>';
    }
}

function applyFilters() {
    let filtered = [...allProducts];

    if (currentCategoryId) {
        filtered = filtered.filter(p => p.category_id === currentCategoryId);
    }
    if (currentSearch) {
        const kw = currentSearch.toLowerCase();
        filtered = filtered.filter(p =>
            p.product_name.toLowerCase().includes(kw) ||
            (p.category_name && p.category_name.toLowerCase().includes(kw))
        );
    }

    const minP = parseFloat(document.getElementById('priceMin').value);
    const maxP = parseFloat(document.getElementById('priceMax').value);
    if (!isNaN(minP)) filtered = filtered.filter(p => p.price >= minP);
    if (!isNaN(maxP)) filtered = filtered.filter(p => p.price <= maxP);

    const sortVal = document.getElementById('sortSelect').value;
    if (sortVal === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortVal === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortVal === 'name_asc') filtered.sort((a, b) => a.product_name.localeCompare(b.product_name));
    else if (sortVal === 'name_desc') filtered.sort((a, b) => b.product_name.localeCompare(a.product_name));

    renderCollectionProducts(filtered);
    document.getElementById('productCount').textContent = filtered.length;
    updateFilterInfo();
}

function renderCollectionProducts(products) {
    const grid = document.getElementById('collectionGrid');
    if (products.length === 0) {
        grid.innerHTML = '<div class="loading-products"><i class="fas fa-box-open" style="font-size:2.5rem;margin-bottom:12px;opacity:0.3;"></i><p>Không tìm thấy sản phẩm nào.</p><button class="retry-btn" onclick="resetFilters()"><i class="fas fa-undo"></i> Xoá bộ lọc</button></div>';
        return;
    }

    grid.innerHTML = products.map(p => {
        const safeName = p.product_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const stockHTML = `<p class="ton-kho ${p.stock_quantity > 0 ? '' : 'het-hang'}">
            <i class="fas fa-${p.stock_quantity > 0 ? 'check-circle' : 'times-circle'}"></i>
            ${p.stock_quantity > 0 ? p.stock_quantity + ' sản phẩm có sẵn' : 'Hết hàng'}
        </p>`;

        return `
        <div class="the-san-pham-doc" data-id="${p.id}">
            <div class="hinh-anh-sp-doc" onclick="openProductModal(${p.id})" style="cursor:pointer;">
                <img src="${p.thumbnail_url}" alt="${p.product_name}" loading="lazy"
                     onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60'">
                <div class="product-badge">${p.category_name}</div>
            </div>
            <div class="thong-tin-sp">
                <h3 onclick="openProductModal(${p.id})" style="cursor:pointer;">${p.product_name}</h3>
                <p class="mo-ta-ngan">${p.description || 'Sản phẩm nội thất cao cấp'}</p>
                <p class="gia-sp">${formatPrice(p.price)}</p>
                ${stockHTML}
                <button class="add-to-cart-btn"
                        onclick="addToCart(${p.id}, '${safeName}', ${p.price}, '${p.thumbnail_url}')"
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
                setTimeout(() => entry.target.classList.add('revealed'), idx * 60);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.the-san-pham-doc').forEach(el => observer.observe(el));
}

function updateFilterInfo() {
    const infoEl = document.getElementById('filterInfo');
    const parts = [];
    if (currentCategoryId) {
        const cat = allCategories.find(c => c.id === currentCategoryId);
        if (cat) parts.push(`Danh mục: ${cat.category_name}`);
    }
    if (currentSearch) parts.push(`Tìm: "${currentSearch}"`);
    const minP = document.getElementById('priceMin').value;
    const maxP = document.getElementById('priceMax').value;
    if (minP) parts.push(`Từ ${formatPrice(minP)}`);
    if (maxP) parts.push(`Đến ${formatPrice(maxP)}`);
    infoEl.textContent = parts.length > 0 ? `— ${parts.join(' | ')}` : '';
}

function resetFilters() {
    currentCategoryId = '';
    currentSearch = '';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('sortSelect').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchInputCollection').value = '';
    document.querySelectorAll('#menu-trai a').forEach(a => a.classList.remove('active'));
    document.querySelector('#menu-trai a[data-category-id=""]').classList.add('active');
    applyFilters();
}

// =====================================================
// SEARCH
// =====================================================
function setupSearch() {
    const headerSearch = document.getElementById('searchInput');
    const collectionSearch = document.getElementById('searchInputCollection');
    let debounceTimer;

    const doSearch = (value) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = value.trim();
            if (currentView === 'home') {
                document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
                if (query.length >= 2) {
                    loadProducts(null, query);
                    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
                } else if (query.length === 0) {
                    loadProducts();
                }
            } else {
                currentSearch = query;
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

function setupSorting() {
    document.getElementById('sortSelect').addEventListener('change', applyFilters);
}

function setupPriceFilter() {
    document.getElementById('filterPriceBtn').addEventListener('click', applyFilters);
    ['priceMin', 'priceMax'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
    });
}

// =====================================================
// PRODUCT MODAL
// =====================================================
function setupProductModal() {
    document.getElementById('closeProductBtn').addEventListener('click', closeProductModal);
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.body.style.overflow = '';
}

async function openProductModal(productId) {
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('overlay');
    const body = document.getElementById('productModalBody');

    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    body.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải thông tin sản phẩm...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/products/${productId}`);
        if (!res.ok) throw new Error('API Error');
        const p = await res.json();

        const safeName = p.product_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        let imagesHtml = `<img src="${p.thumbnail_url}" class="gallery-thumb active" onclick="changeMainImage(this, '${p.thumbnail_url}')">`;
        if (p.images && p.images.length > 0) {
            p.images.forEach(img => {
                imagesHtml += `<img src="${img.url}" class="gallery-thumb" onclick="changeMainImage(this, '${img.url}')">`;
            });
        }

        body.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-images">
                    <div class="main-image-wrapper">
                        <img src="${p.thumbnail_url}" id="mainProductImage" alt="${p.product_name}">
                    </div>
                    <div class="gallery-images">
                        ${imagesHtml}
                    </div>
                </div>
                <div class="product-detail-info">
                    <div class="product-detail-category">${p.category_name}</div>
                    <h2>${p.product_name}</h2>
                    <div class="product-detail-price">${formatPrice(p.price)}</div>
                    <p class="product-detail-desc">${p.description || 'Không có mô tả cho sản phẩm này.'}</p>
                    
                    <div class="product-specs">
                        <p><strong>Tình trạng:</strong> ${p.stock_quantity > 0 ? '<span style="color:#27ae60">Còn hàng (' + p.stock_quantity + ')</span>' : '<span style="color:#e74c3c">Hết hàng</span>'}</p>
                        ${p.dimensions ? `<p><strong>Kích thước:</strong> ${p.dimensions}</p>` : ''}
                        ${p.wood_material ? `<p><strong>Chất liệu:</strong> ${p.wood_material}</p>` : ''}
                    </div>

                    <div class="product-detail-actions">
                        <div class="product-qty-selector">
                            <button class="product-qty-btn" onclick="changeModalQty(-1)">-</button>
                            <input type="number" class="product-qty-input" id="modalQtyInput" value="1" min="1" max="${p.stock_quantity > 0 ? p.stock_quantity : 1}">
                            <button class="product-qty-btn" onclick="changeModalQty(1)">+</button>
                        </div>
                        <button class="product-add-btn" 
                                onclick="addToCartFromModal(${p.id}, '${safeName}', ${p.price}, '${p.thumbnail_url}')"
                                ${p.stock_quantity <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Thêm Vào Giỏ
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        body.innerHTML = '<div class="loading-products error"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải thông tin sản phẩm.</p></div>';
    }
}

window.changeMainImage = function(element, url) {
    document.getElementById('mainProductImage').src = url;
    document.querySelectorAll('.gallery-thumb').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
};

window.changeModalQty = function(delta) {
    const input = document.getElementById('modalQtyInput');
    let val = parseInt(input.value) + delta;
    const max = parseInt(input.getAttribute('max'));
    if (val < 1) val = 1;
    if (val > max) val = max;
    input.value = val;
};

window.addToCartFromModal = async function(id, name, price, imageUrl) {
    const qty = parseInt(document.getElementById('modalQtyInput').value);
    
    if (currentUser) {
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
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({ id, name, price, image: imageUrl, quantity: qty });
        }
        localStorage.setItem('luxdecor_cart', JSON.stringify(cart));
        updateCartUI();
        showNotification(`Đã thêm ${qty} "${name}" vào giỏ hàng!`, 'success');
        closeProductModal();
    }
};

// =====================================================
// UI UTILITIES
// =====================================================
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        setTimeout(() => {
            spinner.style.opacity = '0';
            setTimeout(() => { spinner.style.display = 'none'; }, 400);
        }, 50);
    }
}

function setupScrollEffects() {
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');
    
    const updateHeader = () => {
        if (currentView !== 'home' || window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', () => {
        updateHeader();
        if (window.scrollY > 500) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');
    });
    
    updateHeader();
    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function setupScrollReveal() {
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

function setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.querySelector('.cum-giua');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('mobile-open');
            const icon = btn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('mobile-open');
                const icon = btn.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            });
        });
    }
}

function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebarPanel');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('i');
            icon.classList.toggle('fa-chevron-up');
            icon.classList.toggle('fa-chevron-down');
        });
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function showNotification(message, type = 'success') {
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
