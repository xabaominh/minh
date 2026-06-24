// =====================================================
// AUTH.JS — Authentication Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { showNotification } from './cart.js';
import { switchView } from '../router.js';
import { isManagementUser } from '../roles.js';
import { phoneValidationMessage } from '../validators.js';

export async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/profile`, { credentials: 'include' });
        const data = await res.json();
        if (data.logged_in) {
            state.currentUser = data.user;
        } else {
            state.currentUser = null;
        }
        updateAuthUI();
    } catch (e) {
        console.log('Auth check failed:', e);
    }
}

export function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const loggedIn = document.getElementById('userLoggedIn');
    const dropdownName = document.getElementById('dropdownUsername');
    const adminDashboardBtn = document.getElementById('adminDashboardBtn');

    if (!loginBtn || !loggedIn) return;

    if (state.currentUser) {
        loginBtn.style.display = 'none';
        loggedIn.style.display = 'block';
        if (dropdownName) dropdownName.textContent = state.currentUser.full_name || state.currentUser.username;
        if (adminDashboardBtn) {
            adminDashboardBtn.style.display = isManagementUser(state.currentUser) ? 'block' : 'none';
        }
    } else {
        loginBtn.style.display = 'block';
        loggedIn.style.display = 'none';
        if (adminDashboardBtn) adminDashboardBtn.style.display = 'none';
    }
    window.dispatchEvent(new Event('authChanged'));
}

export function setupAuth() {
    // Mở modal login
    document.getElementById('loginBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal('login');
    });

    // Đóng modal
    document.getElementById('closeAuthBtn')?.addEventListener('click', closeAuthModal);

    // Tab login/register
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            if (loginForm) loginForm.style.display = target === 'login' ? 'block' : 'none';
            if (registerForm) registerForm.style.display = target === 'register' ? 'block' : 'none';
        });
    });

    // Submit login
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
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
                state.currentUser = data.user;
                updateAuthUI();
                closeAuthModal();
                showNotification(`Xin chào, ${state.currentUser.full_name || state.currentUser.username}!`, 'success');
                // Import cart functions dynamically to avoid circular deps
                const { mergeLocalCart, syncCartFromServer } = await import('./cart.js');
                await mergeLocalCart();
                await syncCartFromServer();
                if (isManagementUser(state.currentUser)) {
                    await switchView('admin');
                }
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
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('registerSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            const phone = document.getElementById('regPhone').value.trim();
            const phoneError = phoneValidationMessage(phone);
            if (phoneError) {
                showNotification(phoneError, 'warning');
                return;
            }

            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: document.getElementById('regUsername').value,
                    email: document.getElementById('regEmail').value,
                    password: document.getElementById('regPassword').value,
                    full_name: document.getElementById('regFullname').value,
                    phone,
                    address: document.getElementById('regAddress').value
                })
            });
            const data = await res.json();
            if (res.ok) {
                state.currentUser = data.user;
                updateAuthUI();
                closeAuthModal();
                showNotification('🎉 Đăng ký thành công!', 'success');
                const { mergeLocalCart, syncCartFromServer } = await import('./cart.js');
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
    document.getElementById('userDropdownBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('userDropdown')?.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-logged-in')) {
            document.getElementById('userDropdown')?.classList.remove('show');
        }
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {}
        state.currentUser = null;
        updateAuthUI();
        document.getElementById('userDropdown')?.classList.remove('show');
        showNotification('Đã đăng xuất', 'info');
        if (state.currentView === 'orders' || state.currentView === 'admin') switchView('home');
    });

    // Trang quản lý
    document.getElementById('adminDashboardBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('userDropdown')?.classList.remove('show');
        switchView('admin');
    });

    // Xem đơn hàng
    document.getElementById('viewOrdersBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('userDropdown')?.classList.remove('show');
        switchView('orders');
    });
}

export function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    const overlay = document.getElementById('overlay');
    if (!modal) return;
    modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
    if (registerForm) registerForm.style.display = tab === 'register' ? 'block' : 'none';
}

export function closeAuthModal() {
    document.getElementById('authModal')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
    document.body.style.overflow = '';
}
