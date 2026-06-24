// =====================================================
// ACCOUNT.JS — Profile & Addresses
// =====================================================

import { API_BASE, state } from '../state.js';
import { showNotification } from './cart.js';
import { openAuthModal } from './auth.js';
import { phoneValidationMessage } from '../validators.js';
import { switchView } from '../router.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export async function loadAccountPage() {
    const container = document.getElementById('accountContainer');
    if (!container) return;

    if (!state.currentUser) {
        container.innerHTML = '<div class="loading-products"><p>Vui lòng đăng nhập để xem tài khoản.</p></div>';
        openAuthModal('login');
        return;
    }

    container.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải...</p></div>';

    try {
        const [profileRes, addressRes] = await Promise.all([
            fetch(`${API_BASE}/profile`, { credentials: 'include' }),
            fetch(`${API_BASE}/addresses`, { credentials: 'include' })
        ]);
        const profileData = await profileRes.json();
        const addresses = addressRes.ok ? await addressRes.json() : [];
        if (!profileData.logged_in) {
            openAuthModal('login');
            return;
        }

        state.currentUser = profileData.user;
        state.userAddresses = addresses;
        renderAccountPage(profileData.user, addresses);
    } catch (e) {
        container.innerHTML = '<div class="loading-products error"><p>Không thể tải thông tin tài khoản.</p></div>';
    }
}

function renderAccountPage(user, addresses) {
    const container = document.getElementById('accountContainer');
    if (!container) return;

    const addressHtml = addresses.length
        ? addresses.map(addr => `
            <div class="address-item ${addr.is_default ? 'default' : ''}">
                <div>
                    ${addr.is_default ? '<span class="address-badge">Mặc định</span>' : ''}
                    <strong>${escapeHtml(addr.receiver_name || 'Người nhận')}</strong>
                    <p>${escapeHtml(addr.phone || '')}</p>
                    <p>${escapeHtml(addr.address_line)}</p>
                </div>
                <div class="address-actions">
                    ${!addr.is_default ? `<button type="button" data-default="${addr.id}">Đặt mặc định</button>` : ''}
                    <button type="button" class="danger" data-delete="${addr.id}">Xóa</button>
                </div>
            </div>
        `).join('')
        : '<p style="color:var(--text-muted);">Chưa có địa chỉ nào.</p>';

    container.innerHTML = `
        <section class="account-card">
            <h2><i class="fas fa-user"></i> Thông tin cá nhân</h2>
            <form id="profileForm" class="account-form-grid">
                <div class="account-field">
                    <label>Tên đăng nhập</label>
                    <input type="text" value="${escapeHtml(user.username)}" disabled>
                </div>
                <div class="account-field">
                    <label>Email</label>
                    <input type="email" id="accountEmail" value="${escapeHtml(user.email || '')}">
                </div>
                <div class="account-field">
                    <label>Họ và tên</label>
                    <input type="text" id="accountFullname" value="${escapeHtml(user.full_name || '')}">
                </div>
                <div class="account-field">
                    <label>Số điện thoại</label>
                    <input type="tel" id="accountPhone" maxlength="10" value="${escapeHtml(user.phone || '')}" placeholder="0901234567">
                </div>
                <div class="full-width">
                    <button type="submit" class="account-save-btn"><i class="fas fa-save"></i> Lưu thông tin</button>
                </div>
            </form>
        </section>

        <section class="account-card">
            <h2><i class="fas fa-lock"></i> Đổi mật khẩu</h2>
            <form id="passwordForm" class="account-form-grid">
                <div class="account-field">
                    <label>Mật khẩu hiện tại</label>
                    <input type="password" id="currentPassword" required>
                </div>
                <div class="account-field">
                    <label>Mật khẩu mới</label>
                    <input type="password" id="newPassword" required placeholder="Tối thiểu 4 ký tự">
                </div>
                <div class="full-width">
                    <button type="submit" class="account-save-btn"><i class="fas fa-key"></i> Đổi mật khẩu</button>
                </div>
            </form>
        </section>

        <section class="account-card">
            <h2><i class="fas fa-map-marker-alt"></i> Địa chỉ giao hàng</h2>
            <div class="address-list" id="addressList">${addressHtml}</div>
            <form id="addressForm" class="account-form-grid" style="margin-top:20px;">
                <div class="account-field">
                    <label>Người nhận</label>
                    <input type="text" id="addrReceiver" placeholder="Tên người nhận">
                </div>
                <div class="account-field">
                    <label>Số điện thoại</label>
                    <input type="tel" id="addrPhone" maxlength="10" placeholder="0901234567">
                </div>
                <div class="account-field full-width">
                    <label>Địa chỉ</label>
                    <input type="text" id="addrLine" placeholder="Số nhà, đường, quận, thành phố" required>
                </div>
                <div class="full-width">
                    <label><input type="checkbox" id="addrDefault" checked> Đặt làm địa chỉ mặc định</label>
                </div>
                <div class="full-width">
                    <button type="submit" class="account-save-btn"><i class="fas fa-plus"></i> Thêm địa chỉ</button>
                </div>
            </form>
        </section>
    `;

    document.getElementById('profileForm')?.addEventListener('submit', saveProfile);
    document.getElementById('passwordForm')?.addEventListener('submit', savePassword);
    document.getElementById('addressForm')?.addEventListener('submit', addAddress);
    container.querySelectorAll('[data-default]').forEach(btn => {
        btn.addEventListener('click', () => setDefaultAddress(btn.dataset.default));
    });
    container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => deleteAddress(btn.dataset.delete));
    });
}

async function saveProfile(e) {
    e.preventDefault();
    const phone = document.getElementById('accountPhone')?.value.trim() || '';
    const phoneError = phoneValidationMessage(phone);
    if (phoneError) {
        showNotification(phoneError, 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: document.getElementById('accountFullname')?.value.trim(),
                email: document.getElementById('accountEmail')?.value.trim(),
                phone
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi');
        state.currentUser = data.user;
        const { updateAuthUI } = await import('./auth.js');
        updateAuthUI();
        showNotification('Đã cập nhật thông tin', 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

async function savePassword(e) {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE}/profile/password`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: document.getElementById('currentPassword')?.value,
                new_password: document.getElementById('newPassword')?.value
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi');
        document.getElementById('passwordForm')?.reset();
        showNotification('Đã đổi mật khẩu', 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

async function addAddress(e) {
    e.preventDefault();
    const phone = document.getElementById('addrPhone')?.value.trim() || '';
    const phoneError = phoneValidationMessage(phone);
    if (phoneError) {
        showNotification(phoneError, 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/addresses`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receiver_name: document.getElementById('addrReceiver')?.value.trim(),
                phone,
                address_line: document.getElementById('addrLine')?.value.trim(),
                is_default: document.getElementById('addrDefault')?.checked
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi');
        await loadAccountPage();
        showNotification('Đã thêm địa chỉ', 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

async function setDefaultAddress(addressId) {
    try {
        const res = await fetch(`${API_BASE}/addresses/${addressId}/default`, {
            method: 'PUT',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi');
        await loadAccountPage();
        showNotification('Đã đặt địa chỉ mặc định', 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

async function deleteAddress(addressId) {
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
        const res = await fetch(`${API_BASE}/addresses/${addressId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi');
        await loadAccountPage();
        showNotification('Đã xóa địa chỉ', 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

export function setupAccountNav() {
    document.getElementById('viewAccountBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('userDropdown')?.classList.remove('show');
        if (!state.currentUser) {
            openAuthModal('login');
            return;
        }
        switchView('account');
    });
}
