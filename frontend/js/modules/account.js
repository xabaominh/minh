// =====================================================
// ACCOUNT.JS — Customer Account Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { openAuthModal } from './auth.js';
import { showNotification } from './cart.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatAddress(address) {
    const receiver = address?.receiver_name || 'Người nhận';
    const phone = address?.phone || 'Chưa cập nhật';
    const line = address?.address_line || 'Chưa có địa chỉ';
    return { receiver, phone, line };
}

function getDefaultAddress(addresses) {
    return addresses.find(address => address.is_default) || addresses[0] || null;
}

function renderAddressCards(addresses) {
    if (!addresses.length) {
        return '<div class="address-item"><p>Bạn chưa lưu địa chỉ nào. Hãy thêm địa chỉ đầu tiên bên dưới.</p></div>';
    }

    return addresses.map(address => {
        const formatted = formatAddress(address);
        return `
            <div class="address-item ${address.is_default ? 'active' : ''}">
                <div class="address-item-top">
                    <div>
                        <h4>${escapeHtml(formatted.receiver)}</h4>
                        <p><i class="fas fa-phone"></i> ${escapeHtml(formatted.phone)}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(formatted.line)}</p>
                    </div>
                    ${address.is_default ? '<span class="account-badge"><i class="fas fa-star"></i> Mặc định</span>' : ''}
                </div>
                <div class="address-actions">
                    <button type="button" class="mini-btn-outline" data-action="edit-address" data-address-id="${address.id}">Sửa</button>
                    ${address.is_default ? '' : `<button type="button" class="mini-btn" data-action="default-address" data-address-id="${address.id}">Đặt mặc định</button>`}
                </div>
            </div>
        `;
    }).join('');
}

function renderAccountShell(user, addresses) {
    const defaultAddress = getDefaultAddress(addresses);
    const addressFormTitle = defaultAddress ? 'Sửa địa chỉ mặc định' : 'Thêm địa chỉ mặc định';
    const accountInitials = (user.full_name || user.username || 'KH').trim().slice(0, 2).toUpperCase();

    return `
        <div class="account-panel">
            <div class="account-panel-header">
                <div class="account-panel-title">
                    <i class="fas fa-user-shield"></i>
                    <h2>Hồ sơ cá nhân</h2>
                </div>
                <div class="account-grid">
                    <div class="account-card soft">
                        <div class="account-stat-label">Tài khoản</div>
                        <div class="account-stat-value">${escapeHtml(user.username || 'guest')}</div>
                    </div>
                    <div class="account-card">
                        <div class="account-stat-label">Email</div>
                        <div class="account-stat-value">${escapeHtml(user.email || 'Chưa cập nhật')}</div>
                    </div>
                    <div class="account-card">
                        <div class="account-stat-label">Số điện thoại</div>
                        <div class="account-stat-value">${escapeHtml(user.phone || 'Chưa cập nhật')}</div>
                    </div>
                    <div class="account-card">
                        <div class="account-stat-label">Mã hiển thị</div>
                        <div class="account-stat-value">${escapeHtml(accountInitials)}</div>
                    </div>
                </div>
            </div>

            <div class="account-panel-body">
                <form class="account-form" id="profileForm">
                    <div class="account-section">
                        <div class="account-section-head">
                            <h3>Thông tin cơ bản</h3>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Họ và tên</label>
                                <input type="text" name="full_name" value="${escapeHtml(user.full_name || '')}" placeholder="Nguyễn Văn A">
                            </div>
                            <div class="form-group">
                                <label>Số điện thoại</label>
                                <input type="tel" name="phone" value="${escapeHtml(user.phone || '')}" placeholder="0901234567" maxlength="10" inputmode="numeric">
                            </div>
                        </div>
                        
                        <div>
                            <button type="submit" class="auth-submit-btn" id="saveProfileBtn"><i class="fas fa-save"></i> Lưu thông tin</button>
                        </div>
                    </div>
                </form>

                <details class="account-details">
                    <summary>
                        <span><i class="fas fa-location-dot"></i> Cập nhật địa chỉ</span>
                        <span class="account-badge"><i class="fas fa-chevron-down"></i> Bấm để mở/đóng</span>
                    </summary>
                    <div class="account-details-body">
                        <div class="account-section-head">
                            <h3>${addressFormTitle}</h3>
                            <span class="account-badge"><i class="fas fa-location-dot"></i> Địa chỉ nhận hàng</span>
                        </div>
                        <form class="account-form" id="addressForm">
                            <input type="hidden" id="addressId" value="${defaultAddress ? defaultAddress.id : ''}">
                            <input type="hidden" id="addressIsDefault" value="${defaultAddress ? String(!!defaultAddress.is_default) : 'true'}">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Tên người nhận</label>
                                    <input type="text" id="addressReceiver" value="${escapeHtml(defaultAddress?.receiver_name || user.full_name || '')}" placeholder="Nguyễn Văn A">
                                </div>
                                <div class="form-group">
                                    <label>Số điện thoại</label>
                                    <input type="tel" id="addressPhone" value="${escapeHtml(defaultAddress?.phone || user.phone || '')}" placeholder="0901234567" maxlength="10" inputmode="numeric">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Địa chỉ chi tiết</label>
                                <textarea id="addressLine" rows="3" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố">${escapeHtml(defaultAddress?.address_line || '')}</textarea>
                            </div>
                            <div class="address-actions">
                                <button type="submit" class="auth-submit-btn" id="saveAddressBtn"><i class="fas fa-map-marker-check"></i> ${defaultAddress ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}</button>
                                <button type="button" class="mini-btn-outline" id="resetAddressFormBtn">Thêm địa chỉ mới</button>
                            </div>
                            <p class="account-footer-note">Form này đang ưu tiên địa chỉ mặc định. Bạn vẫn có thể thêm nhiều địa chỉ khác ở khung bên dưới.</p>
                        </form>
                    </div>
                </details>

                <details class="account-details">
                    <summary>
                        <span><i class="fas fa-plus"></i> Thêm địa chỉ mới</span>
                        <span class="account-badge"><i class="fas fa-chevron-down"></i> Bấm để mở/đóng</span>
                    </summary>
                    <div class="account-details-body">
                        <div class="account-section-head">
                            <h3>Lưu địa chỉ mới</h3>
                            <span class="account-badge"><i class="fas fa-plus"></i> Lưu thêm địa chỉ</span>
                        </div>
                        <form class="account-form" id="newAddressForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Tên người nhận</label>
                                    <input type="text" id="newAddressReceiver" placeholder="Nguyễn Văn A">
                                </div>
                                <div class="form-group">
                                    <label>Số điện thoại</label>
                                    <input type="tel" id="newAddressPhone" placeholder="0901234567" maxlength="10" inputmode="numeric">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Địa chỉ chi tiết</label>
                                <textarea id="newAddressLine" rows="3" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"></textarea>
                            </div>
                            <div class="address-actions">
                                <button type="submit" class="auth-submit-btn" id="addAddressBtn"><i class="fas fa-plus-circle"></i> Thêm địa chỉ</button>
                            </div>
                        </form>
                    </div>
                </details>
            </div>
        </div>

        <div class="account-panel">
            <div class="account-panel-header">
                <div class="account-panel-title">
                    <i class="fas fa-location-crosshairs"></i>
                    <h2>Danh sách địa chỉ</h2>
                </div>
            </div>
            <div class="account-panel-body">
                <div class="address-list" id="addressList">
                    ${renderAddressCards(addresses)}
                </div>

                <details class="account-details">
                    <summary>
                        <span><i class="fas fa-lock"></i> Đổi mật khẩu</span>
                        <span class="account-badge"><i class="fas fa-chevron-down"></i> Bấm để mở/đóng</span>
                    </summary>
                    <div class="account-details-body">
                        <div class="account-panel-title">
                            <i class="fas fa-lock"></i>
                            <h2>Đổi mật khẩu</h2>
                        </div>
                        <form class="account-form" id="passwordForm">
                            <div class="form-group">
                                <label>Mật khẩu hiện tại</label>
                                <input type="password" id="currentPassword" placeholder="Nhập mật khẩu hiện tại">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Mật khẩu mới</label>
                                    <input type="password" id="newPassword" placeholder="Ít nhất 4 ký tự">
                                </div>
                                <div class="form-group">
                                    <label>Xác nhận mật khẩu mới</label>
                                    <input type="password" id="confirmPassword" placeholder="Nhập lại mật khẩu mới">
                                </div>
                            </div>
                            <div>
                                <button type="submit" class="auth-submit-btn" id="savePasswordBtn"><i class="fas fa-key"></i> Cập nhật mật khẩu</button>
                            </div>
                        </form>
                    </div>
                </details>
            </div>
        </div>
    `;
}

function bindAccountEvents() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const addressForm = document.getElementById('addressForm');
    const newAddressForm = document.getElementById('newAddressForm');
    const addressList = document.getElementById('addressList');
    const resetAddressFormBtn = document.getElementById('resetAddressFormBtn');

    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveProfileBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

        try {
            const res = await fetch(`${API_BASE}/profile`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: profileForm.querySelector('[name="full_name"]').value.trim(),
                    phone: profileForm.querySelector('[name="phone"]').value.trim()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Không thể cập nhật thông tin');

            state.currentUser = data.user;
            state.userAddresses = state.userAddresses.length ? state.userAddresses : [];
            showNotification('Đã cập nhật thông tin tài khoản', 'success');
            await loadAccount();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu thông tin';
        }
    });

    passwordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('savePasswordBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đổi...';

        try {
            const res = await fetch(`${API_BASE}/password`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: document.getElementById('currentPassword').value,
                    new_password: document.getElementById('newPassword').value,
                    confirm_password: document.getElementById('confirmPassword').value
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Không thể đổi mật khẩu');

            passwordForm.reset();
            showNotification(data.message || 'Đã đổi mật khẩu thành công', 'success');
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-key"></i> Cập nhật mật khẩu';
        }
    });

    addressForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveAddressBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

        const addressId = document.getElementById('addressId').value;
        const payload = {
            receiver_name: document.getElementById('addressReceiver').value.trim(),
            phone: document.getElementById('addressPhone').value.trim(),
            address_line: document.getElementById('addressLine').value.trim(),
            is_default: document.getElementById('addressIsDefault').value === 'true'
        };

        try {
            const res = await fetch(addressId ? `${API_BASE}/addresses/${addressId}` : `${API_BASE}/addresses`, {
                method: addressId ? 'PUT' : 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Không thể lưu địa chỉ');

            showNotification(addressId ? 'Đã cập nhật địa chỉ mặc định' : 'Đã lưu địa chỉ mới', 'success');
            await loadAccount();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-map-marker-check"></i> ' + (addressId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ');
        }
    });

    newAddressForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = newAddressForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang thêm...';

        try {
            const res = await fetch(`${API_BASE}/addresses`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_name: document.getElementById('newAddressReceiver').value.trim(),
                    phone: document.getElementById('newAddressPhone').value.trim(),
                    address_line: document.getElementById('newAddressLine').value.trim(),
                    is_default: false
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Không thể thêm địa chỉ');

            newAddressForm.reset();
            showNotification('Đã thêm địa chỉ mới', 'success');
            await loadAccount();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus-circle"></i> Thêm địa chỉ';
        }
    });

    addressList?.addEventListener('click', async (e) => {
        const editButton = e.target.closest('[data-action="edit-address"]');
        const defaultButton = e.target.closest('[data-action="default-address"]');

        if (editButton) {
            const addressId = Number(editButton.dataset.addressId);
            const address = state.userAddresses.find(item => Number(item.id) === addressId);
            if (!address) return;

            document.getElementById('addressId').value = address.id;
            document.getElementById('addressIsDefault').value = String(!!address.is_default);
            document.getElementById('addressReceiver').value = address.receiver_name || '';
            document.getElementById('addressPhone').value = address.phone || '';
            document.getElementById('addressLine').value = address.address_line || '';
            document.getElementById('saveAddressBtn').innerHTML = '<i class="fas fa-map-marker-check"></i> Cập nhật địa chỉ';
            document.getElementById('addressForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (defaultButton) {
            const addressId = defaultButton.dataset.addressId;
            try {
                const res = await fetch(`${API_BASE}/addresses/${addressId}/default`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Không thể đặt địa chỉ mặc định');
                showNotification('Đã đặt địa chỉ mặc định', 'success');
                await loadAccount();
            } catch (err) {
                showNotification(err.message, 'error');
            }
        }
    });

    resetAddressFormBtn?.addEventListener('click', () => {
        const defaultAddress = getDefaultAddress(state.userAddresses);
        document.getElementById('addressId').value = defaultAddress ? defaultAddress.id : '';
        document.getElementById('addressIsDefault').value = defaultAddress ? String(!!defaultAddress.is_default) : 'true';
        document.getElementById('addressReceiver').value = defaultAddress?.receiver_name || state.currentUser?.full_name || '';
        document.getElementById('addressPhone').value = defaultAddress?.phone || state.currentUser?.phone || '';
        document.getElementById('addressLine').value = defaultAddress?.address_line || '';
        document.getElementById('saveAddressBtn').innerHTML = '<i class="fas fa-map-marker-check"></i> ' + (defaultAddress ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ');
    });
}

export async function loadAccount() {
    const container = document.getElementById('accountContainer');
    const statusBadge = document.getElementById('accountStatusBadge');
    if (!container) return;

    if (!state.currentUser) {
        if (statusBadge) statusBadge.textContent = 'Chưa đăng nhập';
        container.innerHTML = `
            <div class="account-panel">
                <div class="account-lock">
                    <h2>Bạn cần đăng nhập để xem thông tin tài khoản</h2>
                    <p>Trang này dùng để cập nhật hồ sơ, đổi mật khẩu và quản lý địa chỉ giao hàng.</p>
                    <button class="auth-submit-btn" type="button" id="openLoginFromAccount"><i class="fas fa-sign-in-alt"></i> Đăng nhập ngay</button>
                </div>
            </div>
        `;
        document.getElementById('openLoginFromAccount')?.addEventListener('click', () => openAuthModal('login'));
        return;
    }

    if (statusBadge) statusBadge.textContent = 'Đang tải dữ liệu...';
    container.innerHTML = '<div class="loading-products"><div class="spinner-small"></div><p>Đang tải thông tin tài khoản...</p></div>';

    try {
        const [profileRes, addressesRes] = await Promise.all([
            fetch(`${API_BASE}/profile`, { credentials: 'include' }),
            fetch(`${API_BASE}/addresses`, { credentials: 'include' })
        ]);

        const profileData = await profileRes.json();
        const addressesData = addressesRes.ok ? await addressesRes.json() : [];

        if (!profileData.logged_in) {
            state.currentUser = null;
            state.userAddresses = [];
            if (statusBadge) statusBadge.textContent = 'Chưa đăng nhập';
            await loadAccount();
            return;
        }

        const user = profileData.user || state.currentUser;
        const addresses = Array.isArray(addressesData) ? addressesData : [];

        state.currentUser = user;
        state.userAddresses = addresses;

        if (statusBadge) {
            statusBadge.textContent = `${addresses.length} địa chỉ đã lưu`;
        }

        container.innerHTML = renderAccountShell(user, addresses);
        bindAccountEvents();
    } catch (err) {
        container.innerHTML = `
            <div class="account-panel">
                <div class="account-lock">
                    <h2>Không thể tải thông tin tài khoản</h2>
                    <p>${escapeHtml(err.message || 'Đã xảy ra lỗi khi tải dữ liệu.')}</p>
                </div>
            </div>
        `;
        if (statusBadge) statusBadge.textContent = 'Lỗi tải dữ liệu';
    }
}