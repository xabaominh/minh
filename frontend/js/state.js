// =====================================================
// STATE.JS — Global State & Constants
// =====================================================

export const API_BASE = 'http://127.0.0.1:5000/api';

export const state = {
    cart: JSON.parse(localStorage.getItem('luxdecor_cart') || '[]'),
    allProducts: [],
    allCategories: [],
    currentCategoryId: '',
    currentSearch: '',
    currentView: 'home',
    currentUser: null,
    userAddresses: []
};
