// =====================================================
// STATE.JS — Global State & Constants
// =====================================================

function getApiBase() {
    const { protocol, hostname, port } = window.location;
    // Cùng origin khi chạy qua Flask (khuyến nghị)
    if (port === '5000' || port === '') {
        return '/api';
    }
    // Live Server / http.server: gọi API cùng hostname
    const apiHost = hostname || '127.0.0.1';
    return `${protocol}//${apiHost}:5000/api`;
}

export const API_BASE = getApiBase();

export const state = {
    cart: JSON.parse(localStorage.getItem('luxdecor_cart') || '[]'),
    allProducts: [],
    allCategories: [],
    currentCategoryId: '',
    currentSearch: '',
    currentView: 'home',
    currentUser: null,
    userAddresses: [],
    appliedCoupon: null
};
