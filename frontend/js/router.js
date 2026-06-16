// =====================================================
// ROUTER.JS — SPA Routing & Component Loading
// =====================================================

import { state } from './state.js';

/**
 * Load một HTML component vào một slot trong DOM.
 * @param {string} slotId - ID của element chứa
 * @param {string} path - Đường dẫn tới file HTML component
 */
export async function loadComponent(slotId, path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        const html = await res.text();
        const slot = document.getElementById(slotId);
        if (slot) slot.innerHTML = html;
    } catch (err) {
        console.error(`Load component error (${path}):`, err);
    }
}

/**
 * Chuyển đổi giữa các view (home, collection, orders).
 * @param {string} viewName - Tên view cần hiển thị
 * @param {number|null} filterCategoryId - ID danh mục để lọc (cho collection)
 */
export async function switchView(viewName, filterCategoryId = null) {
    state.currentView = viewName;

    const viewSlot = document.getElementById('view-slot');
    if (!viewSlot) return;

    // Load view HTML
    try {
        const res = await fetch(`views/${viewName}.html`);
        if (!res.ok) throw new Error(`View not found: ${viewName}`);
        const html = await res.text();
        viewSlot.innerHTML = html;
    } catch (err) {
        console.error(`Switch view error:`, err);
        viewSlot.innerHTML = '<p style="text-align:center;padding:60px;">Không thể tải trang.</p>';
        return;
    }

    // Cập nhật nav active
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewName) link.classList.add('active');
    });

    // Dispatch custom event để các module biết view đã thay đổi
    window.dispatchEvent(new CustomEvent('viewChanged', {
        detail: { viewName, filterCategoryId }
    }));

    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
}

/**
 * Gắn event click cho tất cả nav links.
 */
export function setupNavigation() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link && link.dataset.view) {
            e.preventDefault();
            switchView(link.dataset.view);
        }
    });
}

// Expose switchView globally cho onclick trong HTML
window.switchView = switchView;
