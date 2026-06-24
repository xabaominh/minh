// =====================================================
// MAIN.JS — Entry Point
// LuxDecor SPA v3 — Modular Architecture
// =====================================================

import { state } from './state.js';
import { loadComponent, switchView, setupNavigation } from './router.js';
import { checkAuth, setupAuth, updateAuthUI } from './modules/auth.js';
import { setupCart, updateCartUI, syncCartFromServer, setupCheckout } from './modules/cart.js';
import { loadAdminDashboard } from './modules/admin.js';
import { isManagementUser } from './roles.js';
import {
    loadCategoriesData,
    renderCategoryButtons, loadProducts, loadAllProducts, applyFilters,
    setupSearch, setupSorting, setupPriceFilter, setupProductModal, setupScrollReveal
} from './modules/products.js';
import { loadOrders } from './modules/orders.js';
import { setupAccountNav, loadAccountPage } from './modules/account.js';
import { setupChat, updateChatVisibility } from './modules/chat.js';


document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load tất cả components (header, footer, modals)
    await Promise.all([
        loadComponent('header-slot', 'components/header.html'),
        loadComponent('footer-slot', 'components/footer.html'),
        loadComponent('cart-modal-slot', 'components/cartModal.html'),
        loadComponent('auth-modal-slot', 'components/authModal.html'),
        loadComponent('checkout-modal-slot', 'components/checkoutModal.html'),
        loadComponent('product-modal-slot', 'components/productModal.html'),
        loadComponent('chat-widget-slot', 'components/chatWidget.html'),
    ]);

    // 2. Load default view (home)
    await switchView('home');

    // 3. Kiểm tra đăng nhập
    await checkAuth();
    updateChatVisibility();
    window.addEventListener('authChanged', () => updateChatVisibility());
    if (isManagementUser(state.currentUser)) {
        await switchView('admin');
        await loadAdminDashboard();
    }

    // 4. Load data
    await loadCategoriesData();
    renderCategoryButtons();
    loadProducts();

    // 5. Setup events
    setupNavigation();
    setupAuth();
    setupAccountNav();
    setupCart();
    setupCheckout();
    setupSearch();
    setupSorting();
    setupPriceFilter();
    setupProductModal();
    setupScrollEffects();
    setupMobileMenu();
    setupSidebarToggle();
    setupScrollReveal();
    updateCartUI();
    setupChat();

    // 6. Lắng nghe sự kiện chuyển view
    window.addEventListener('viewChanged', async (e) => {
        const { viewName, filterCategoryId } = e.detail;

        if (viewName === 'home') {
            await loadCategoriesData();
            renderCategoryButtons();
            loadProducts();
            setupScrollReveal();
        }

        if (viewName === 'collection') {
            renderCategoryButtons();
            if (!state.allProducts.length) {
                loadAllProducts();
            } else {
                applyFilters();
            }
            setupSidebarToggle();

            if (filterCategoryId !== null) {
                state.currentCategoryId = filterCategoryId;
                setTimeout(() => {
                    document.querySelectorAll('#menu-trai a').forEach(a => a.classList.remove('active'));
                    const activeBtn = document.querySelector(`#menu-trai a[data-category-id="${filterCategoryId}"]`)
                        || document.querySelector('#menu-trai a[data-category-id=""]');
                    if (activeBtn) activeBtn.classList.add('active');
                }, 100);
            }
        }

        if (viewName === 'orders') {
            loadOrders();
        }

        if (viewName === 'account') {
            loadAccountPage();
        }

        if (viewName === 'admin') {
            loadAdminDashboard();
        }

        updateChatVisibility();
    });

    // Hide loading spinner
    hideLoadingSpinner();
});


// =====================================================
// UI UTILITIES
// =====================================================
let sidebarToggleDone = false;

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
    let ticking = false;

    const updateHeader = () => {
        if (!header) return;
        if (state.currentView !== 'home' || window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateHeader();
            if (backToTop) {
                if (window.scrollY > 500) backToTop.classList.add('visible');
                else backToTop.classList.remove('visible');
            }
            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    updateHeader();
    backToTop?.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
    if (sidebarToggleDone) return;
    sidebarToggleDone = true;
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
