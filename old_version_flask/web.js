// =====================================================
// CẤU HÌNH CHUNG
// =====================================================
const API_BASE = 'http://127.0.0.1:5000/api';

// =====================================================
// STATE — Giỏ hàng lưu trong localStorage
// =====================================================
let cart = JSON.parse(localStorage.getItem('luxdecor_cart') || '[]');

// =====================================================
// KHỞI CHẠY KHI TRANG TẢI XONG
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    hideLoadingSpinner();
    loadProducts();
    setupCategoryFilter();
    setupCart();
    setupSearch();
    setupNewsletter();
    setupScrollEffects();
    setupMobileMenu();
    setupScrollReveal();
    updateCartBadge();
});

// =====================================================
// 1. LOADING SPINNER
// =====================================================
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    // Ẩn spinner ngay lập tức để không gây cảm giác lag
    setTimeout(() => {
        spinner.style.opacity = '0';
        setTimeout(() => { spinner.style.display = 'none'; }, 400);
    }, 50);
}

// =====================================================
// 2. GỌI API LẤY SẢN PHẨM — GET /api/products
// =====================================================
async function loadProducts(category = null, search = null) {
    const container = document.getElementById('productList');

    // Hiển thị trạng thái loading
    container.innerHTML = `
        <div class="loading-products">
            <div class="spinner-small"></div>
            <p>Đang tải sản phẩm từ server...</p>
        </div>
    `;

    try {
        // Xây dựng URL với query params
        let url = `${API_BASE}/products`;
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (search)   params.append('search', search);
        const qs = params.toString();
        if (qs) url += '?' + qs;

        // Gọi API
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const products = await response.json();
        renderProducts(products, container);

    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        container.innerHTML = `
            <div class="loading-products error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không thể tải sản phẩm. Hãy chắc chắn server Flask đang chạy.</p>
                <button class="retry-btn" onclick="loadProducts()">
                    <i class="fas fa-redo"></i> Thử Lại
                </button>
            </div>
        `;
    }
}

// Render danh sách sản phẩm từ dữ liệu API
function renderProducts(products, container) {
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="loading-products">
                <i class="fas fa-box-open" style="font-size:2rem; margin-bottom:10px; opacity:0.4;"></i>
                <p>Không tìm thấy sản phẩm nào.</p>
            </div>
        `;
        return;
    }

    // Dựng HTML cho từng sản phẩm từ dữ liệu API
    container.innerHTML = products.map(product => {
        const formattedPrice = formatPrice(product.price);
        // Escape tên sản phẩm để tránh lỗi khi chèn vào onclick
        const safeName = product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return `
            <div class="the-san-pham" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                <div class="product-img-wrapper">
                    <img src="${product.image_url}"
                         alt="${product.name}"
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60'">
                    <div class="product-badge">${product.category || ''}</div>
                </div>
                <div class="thong-tin">
                    <h3>${product.name}</h3>
                    <p class="gia-tien">${formattedPrice}</p>
                    <button class="add-to-cart-btn"
                            onclick="addToCart(${product.id}, '${safeName}', ${product.price}, '${product.image_url}')">
                        <i class="fas fa-cart-plus"></i> Thêm Vào Giỏ
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Re-initialize scroll reveal so the newly loaded products can be animated and become visible
    setupScrollReveal();
}

// Hàm định dạng giá tiền theo locale Việt Nam
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// =====================================================
// 3. GIỎ HÀNG — localStorage
// =====================================================
function setupCart() {
    // Mở giỏ hàng
    document.getElementById('cartBtn').addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });

    // Đóng giỏ hàng
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('overlay').addEventListener('click', closeCart);

    // Nút thanh toán
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Giỏ hàng đang trống!', 'warning');
            return;
        }
        showNotification('Chức năng thanh toán sẽ được tích hợp API sau!', 'info');
    });

    // Đóng bằng phím Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCart();
    });
}

// Thêm sản phẩm vào giỏ
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

// Xoá 1 sản phẩm khỏi giỏ
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartBadge();
    renderCartItems();
}

// Thay đổi số lượng
function changeQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }
    saveCart();
    updateCartBadge();
    renderCartItems();
}

// Lưu giỏ hàng vào localStorage
function saveCart() {
    localStorage.setItem('luxdecor_cart', JSON.stringify(cart));
}

// Cập nhật badge số lượng trên icon giỏ hàng
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

// Mở modal giỏ hàng
function openCart() {
    renderCartItems();
    document.getElementById('cartModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Đóng modal giỏ hàng
function closeCart() {
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Render nội dung giỏ hàng
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

    // Tính tổng tiền
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalEl.textContent = formatPrice(total);
}

// =====================================================
// 4. TÌM KIẾM — GET /api/products?search=xxx
// =====================================================
function setupSearch() {
    const input = document.getElementById('searchInput');
    let debounceTimer;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = input.value.trim();
            // Bỏ active category khi search
            document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));

            if (query.length >= 2) {
                loadProducts(null, query);
                // Cuộn đến section sản phẩm
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            } else if (query.length === 0) {
                loadProducts(); // Reset về tất cả
            }
        }, 400); // Debounce 400ms
    });

    // Enter để tìm kiếm
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer);
            const query = input.value.trim();
            if (query) {
                loadProducts(null, query);
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

// =====================================================
// 5. LỌC THEO DANH MỤC — GET /api/products?category=xxx
// =====================================================
function setupCategoryFilter() {
    const items = document.querySelectorAll('.category-item');

    items.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.dataset.category;

            // Toggle active class
            const isActive = item.classList.contains('active');
            items.forEach(el => el.classList.remove('active'));

            if (isActive) {
                // Nếu đang active → bỏ filter, load tất cả
                loadProducts();
            } else {
                item.classList.add('active');
                loadProducts(category);
            }

            // Cuộn đến section sản phẩm
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// =====================================================
// 6. NEWSLETTER — POST /api/newsletter
// =====================================================
function setupNewsletter() {
    const form = document.getElementById('newsletterForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletterEmail');
        const email = emailInput.value.trim();
        const submitBtn = document.getElementById('newsletterSubmit');

        if (!email) return;

        // Disable nút submit khi đang gửi
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

        try {
            const response = await fetch(`${API_BASE}/newsletter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('🎉 Đăng ký nhận tin thành công!', 'success');
                emailInput.value = '';
            } else {
                showNotification(data.error || 'Đăng ký thất bại!', 'error');
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            showNotification('Không thể kết nối server. Vui lòng thử lại.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Đăng Ký</span> <i class="fas fa-paper-plane"></i>';
        }
    });
}

// =====================================================
// 7. HIỆU ỨNG CUỘN TRANG
// =====================================================
function setupScrollEffects() {
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        // Header thu nhỏ khi cuộn
        if (window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hiện/ẩn nút Back to top
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // Smooth scroll cho back to top
    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// =====================================================
// 8. SCROLL REVEAL — Hiệu ứng xuất hiện khi cuộn
// =====================================================
function setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Chỉ chạy 1 lần
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-on-scroll, .hop-feature, .the-san-pham').forEach(el => {
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

        // Đóng menu khi click vào link
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
// 10. HỆ THỐNG THÔNG BÁO (TOAST)
// =====================================================
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

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
