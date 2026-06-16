// =====================================================
// WEB1.JS — Trang Bộ Sưu Tập (Collection Page)
// Kết nối API Flask + Giỏ hàng dùng chung localStorage
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api';

// =====================================================
// STATE
// =====================================================
let cart = JSON.parse(localStorage.getItem('luxdecor_cart') || '[]');
let allProducts = [];         // Cache toàn bộ sản phẩm sau khi fetch
let currentCategory = '';     // Danh mục đang lọc
let currentSearch = '';       // Từ khóa tìm kiếm

// =====================================================
// KHỞI CHẠY
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadAllProducts();
    setupCart();
    setupSearch();
    setupSorting();
    setupPriceFilter();
    setupScrollEffects();
    setupMobileMenu();
    setupSidebarToggle();
    updateCartBadge();

    // Kiểm tra URL param (nếu chuyển từ web.html với category)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if (catParam) {
        currentCategory = catParam;
    }
});

// =====================================================
// 1. GỌI API LẤY DANH MỤC — GET /api/categories
// =====================================================
async function loadCategories() {
    const menuTrai = document.getElementById('menu-trai');

    try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) throw new Error('API Error');

        const categories = await response.json();

        // Xoá dòng "Đang tải danh mục..."
        const loadingCat = menuTrai.querySelector('.loading-cat');
        if (loadingCat) loadingCat.remove();

        // Thêm từng danh mục từ API
        categories.forEach(catName => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.dataset.category = catName;
            a.textContent = catName;

            // Nếu URL có category param, active danh mục đó
            if (catName === currentCategory) {
                a.classList.add('active');
                // Bỏ active của "Tất Cả"
                const allBtn = menuTrai.querySelector('a[data-category=""]');
                if (allBtn) allBtn.classList.remove('active');
            }

            a.addEventListener('click', handleCategoryClick);
            li.appendChild(a);
            menuTrai.appendChild(li);
        });

    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        const loadingCat = menuTrai.querySelector('.loading-cat');
        if (loadingCat) {
            loadingCat.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Không tải được danh mục';
        }
    }

    // Gắn event cho nút "Tất Cả Sản Phẩm"
    const allBtn = menuTrai.querySelector('a[data-category=""]');
    if (allBtn) {
        allBtn.addEventListener('click', handleCategoryClick);
    }
}

// Xử lý click danh mục
function handleCategoryClick(e) {
    e.preventDefault();
    const clicked = e.currentTarget;
    const category = clicked.dataset.category;

    // Toggle active
    document.querySelectorAll('#menu-trai a').forEach(a => a.classList.remove('active'));
    clicked.classList.add('active');

    currentCategory = category;
    applyFilters();
}

// =====================================================
// 2. GỌI API LẤY TẤT CẢ SẢN PHẨM — GET /api/products
// =====================================================
async function loadAllProducts() {
    const grid = document.getElementById('collectionGrid');
    grid.innerHTML = `
        <div class="loading-products">
            <div class="spinner-small"></div>
            <p>Đang tải bộ sưu tập từ server...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/products`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        allProducts = await response.json();

        // Nếu có category param từ URL, lọc ngay
        applyFilters();

    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        grid.innerHTML = `
            <div class="loading-products error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không thể tải sản phẩm. Hãy chắc chắn server Flask đang chạy.</p>
                <button class="retry-btn" onclick="loadAllProducts()">
                    <i class="fas fa-redo"></i> Thử Lại
                </button>
            </div>
        `;
    }
}

// =====================================================
// 3. LỌC & HIỂN THỊ SẢN PHẨM
// =====================================================
function applyFilters() {
    let filtered = [...allProducts];

    // Lọc theo danh mục
    if (currentCategory) {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Lọc theo tìm kiếm
    if (currentSearch) {
        const keyword = currentSearch.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            (p.category && p.category.toLowerCase().includes(keyword))
        );
    }

    // Lọc theo khoảng giá
    const minPrice = parseFloat(document.getElementById('priceMin').value);
    const maxPrice = parseFloat(document.getElementById('priceMax').value);
    if (!isNaN(minPrice)) {
        filtered = filtered.filter(p => p.price >= minPrice);
    }
    if (!isNaN(maxPrice)) {
        filtered = filtered.filter(p => p.price <= maxPrice);
    }

    // Sắp xếp
    const sortValue = document.getElementById('sortSelect').value;
    if (sortValue === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortValue === 'name_asc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === 'name_desc') {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    renderCollectionProducts(filtered);
    updateProductCount(filtered.length);
    updateFilterInfo();
}

// Render sản phẩm vào grid
function renderCollectionProducts(products) {
    const grid = document.getElementById('collectionGrid');

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="loading-products">
                <i class="fas fa-box-open" style="font-size:2.5rem; margin-bottom:12px; opacity:0.3;"></i>
                <p>Không tìm thấy sản phẩm nào.</p>
                <button class="retry-btn" onclick="resetFilters()">
                    <i class="fas fa-undo"></i> Xoá bộ lọc
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(product => {
        const formattedPrice = formatPrice(product.price);
        const safeName = product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const description = product.description || 'Sản phẩm nội thất cao cấp';
        const stock = product.stock;
        const stockHTML = stock !== undefined && stock !== null
            ? `<p class="ton-kho ${stock > 0 ? '' : 'het-hang'}">
                   <i class="fas fa-${stock > 0 ? 'check-circle' : 'times-circle'}"></i>
                   ${stock > 0 ? stock + ' sản phẩm có sẵn' : 'Hết hàng'}
               </p>`
            : '';

        return `
            <div class="the-san-pham-doc" data-id="${product.id}">
                <div class="hinh-anh-sp-doc">
                    <img src="${product.image_url}"
                         alt="${product.name}"
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60'">
                    <div class="product-badge">${product.category || ''}</div>
                </div>
                <div class="thong-tin-sp">
                    <h3>${product.name}</h3>
                    <p class="mo-ta-ngan">${description}</p>
                    <p class="gia-sp">${formattedPrice}</p>
                    ${stockHTML}
                    <button class="add-to-cart-btn"
                            onclick="addToCart(${product.id}, '${safeName}', ${product.price}, '${product.image_url}')"
                            ${stock !== undefined && stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-bag"></i> Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Kích hoạt scroll reveal cho cards mới
    setupCardReveal();
}

// Cập nhật số lượng sản phẩm
function updateProductCount(count) {
    document.getElementById('productCount').textContent = count;
}

// Hiển thị thông tin filter đang áp dụng
function updateFilterInfo() {
    const infoEl = document.getElementById('filterInfo');
    const parts = [];

    if (currentCategory) parts.push(`Danh mục: ${currentCategory}`);
    if (currentSearch) parts.push(`Tìm: "${currentSearch}"`);

    const minP = document.getElementById('priceMin').value;
    const maxP = document.getElementById('priceMax').value;
    if (minP) parts.push(`Từ ${formatPrice(minP)}`);
    if (maxP) parts.push(`Đến ${formatPrice(maxP)}`);

    infoEl.textContent = parts.length > 0 ? `— ${parts.join(' | ')}` : '';
}

// Reset tất cả bộ lọc
function resetFilters() {
    currentCategory = '';
    currentSearch = '';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('sortSelect').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchInputCollection').value = '';

    // Reset active sidebar
    document.querySelectorAll('#menu-trai a').forEach(a => a.classList.remove('active'));
    const allBtn = document.querySelector('#menu-trai a[data-category=""]');
    if (allBtn) allBtn.classList.add('active');

    applyFilters();
}

// =====================================================
// 4. TÌM KIẾM
// =====================================================
function setupSearch() {
    // Search box trong header
    const headerSearch = document.getElementById('searchInput');
    // Search box trong trang collection
    const collectionSearch = document.getElementById('searchInputCollection');

    let debounceTimer;

    const doSearch = (value) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = value.trim();
            applyFilters();
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

// =====================================================
// 5. SẮP XẾP
// =====================================================
function setupSorting() {
    document.getElementById('sortSelect').addEventListener('change', () => {
        applyFilters();
    });
}

// =====================================================
// 6. LỌC THEO GIÁ
// =====================================================
function setupPriceFilter() {
    document.getElementById('filterPriceBtn').addEventListener('click', () => {
        applyFilters();
    });

    // Enter trên price inputs
    ['priceMin', 'priceMax'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
    });
}

// =====================================================
// 7. GIỎ HÀNG — Dùng chung localStorage với web.html
// =====================================================
function setupCart() {
    document.getElementById('cartBtn').addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('overlay').addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Giỏ hàng đang trống!', 'warning');
            return;
        }
        showNotification('Chức năng thanh toán sẽ được tích hợp API sau!', 'info');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCart();
    });
}

function addToCart(id, name, price, imageUrl) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name, price, image: imageUrl, quantity: 1 });
    }
    saveCart();
    updateCartBadge();
    showNotification(`Đã thêm "${name}" vào giỏ hàng!`, 'success');
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartBadge();
    renderCartItems();
}

function changeQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) { removeFromCart(id); return; }
    saveCart();
    updateCartBadge();
    renderCartItems();
}

function saveCart() {
    localStorage.setItem('luxdecor_cart', JSON.stringify(cart));
}

function updateCartBadge() {
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

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}"
                 onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&q=60'">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
                <div class="cart-item-qty">
                    <button onclick="changeQuantity(${item.id}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${item.id}, +1)">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})" title="Xoá">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalEl.textContent = formatPrice(total);
}

// =====================================================
// 8. HIỆU ỨNG CUỘN
// =====================================================
function setupScrollEffects() {
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            if (header) header.classList.add('scrolled');
        } else {
            if (header) header.classList.remove('scrolled');
        }

        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Scroll reveal cho product cards
function setupCardReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Delay nhẹ cho hiệu ứng stagger
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, index * 60);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.the-san-pham-doc').forEach(el => {
        observer.observe(el);
    });
}

// =====================================================
// 9. MOBILE MENU
// =====================================================
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

// =====================================================
// 10. SIDEBAR TOGGLE (mobile)
// =====================================================
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

// =====================================================
// UTILITIES
// =====================================================
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function showNotification(message, type = 'success') {
    const area = document.getElementById('notificationArea');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `notification ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    area.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
