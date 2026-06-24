// =====================================================
// CHAT.JS — Customer Support Chat Module
// =====================================================

import { API_BASE, state } from '../state.js';
import { openAuthModal } from './auth.js';
import { showNotification } from './cart.js';

let chatOpen = false;
let pollTimer = null;
let lastMessageId = 0;
let unreadPollTimer = null;

export function setupChat() {
    const fab = document.getElementById('chatFab');
    const closeBtn = document.getElementById('chatCloseBtn');
    const form = document.getElementById('chatForm');
    const headerBtn = document.getElementById('chatHeaderBtn');
    const panel = document.getElementById('chatPanel');

    fab?.addEventListener('click', () => toggleChat());
    closeBtn?.addEventListener('click', () => closeChat());
    headerBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleChat();
    });
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatOpen) {
            closeChat();
        }
    });
    document.addEventListener('click', (e) => {
        if (!chatOpen || !panel) return;
        if (panel.contains(e.target) || fab?.contains(e.target) || headerBtn?.contains(e.target)) return;
        closeChat();
    });

    updateChatVisibility();
    startUnreadPolling();
}

export function updateChatVisibility() {
    const widget = document.getElementById('chatWidget');
    const fab = document.getElementById('chatFab');
    const headerBtn = document.getElementById('chatHeaderBtn');
    const show = !!state.currentUser && state.currentView !== 'admin';

    if (widget) widget.style.display = show ? 'block' : 'none';
    if (fab && !show) fab.classList.remove('hidden');
    if (headerBtn) headerBtn.style.display = show ? 'flex' : 'none';

    if (!show) closeChat();
}

export async function toggleChat() {
    if (!state.currentUser) {
        openAuthModal('login');
        showNotification('Vui lòng đăng nhập để chat với hỗ trợ', 'info');
        return;
    }
    if (chatOpen) closeChat();
    else await openChat();
}

export async function openChat() {
    chatOpen = true;
    document.getElementById('chatPanel')?.classList.add('active');
    await loadChat();
    startPolling();
    document.getElementById('chatInput')?.focus();
}

export function closeChat() {
    chatOpen = false;
    document.getElementById('chatPanel')?.classList.remove('active');
    stopPolling();
}

async function loadChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/chat`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể tải chat');

        renderMessages(data.messages || []);
        updateBadge(0);
    } catch (e) {
        container.innerHTML = '';
    }
}

function renderMessages(messages, append = false) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    if (!messages.length && !append) {
        container.innerHTML = '';
        lastMessageId = 0;
        return;
    }

    if (!append) {
        container.innerHTML = '';
        lastMessageId = 0;
    }

    messages.forEach(msg => {
        if (msg.id <= lastMessageId) return;
        lastMessageId = Math.max(lastMessageId, msg.id);
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${msg.is_mine ? 'mine' : 'theirs'}`;
        bubble.dataset.id = msg.id;
        const sender = msg.is_mine ? 'Bạn' : (msg.full_name || msg.username || 'Hỗ trợ');
        bubble.innerHTML = `<span class="chat-text">${escapeHtml(msg.body)}</span><span class="chat-meta">${escapeHtml(sender)} · ${formatTime(msg.created_at)}</span>`;
        container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const btn = document.getElementById('chatSendBtn');
    const body = input?.value.trim();
    if (!body) return;

    btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/chat/messages`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gửi thất bại');

        input.value = '';
        renderMessages([data.data], true);
    } catch (e) {
        showNotification(e.message, 'error');
    } finally {
        btn.disabled = false;
        input?.focus();
    }
}

function startPolling() {
    stopPolling();
    pollTimer = setInterval(pollMessages, 3000);
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

async function pollMessages() {
    if (!chatOpen || !state.currentUser) return;
    try {
        const url = lastMessageId
            ? `${API_BASE}/chat/messages?since_id=${lastMessageId}`
            : `${API_BASE}/chat/messages`;
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) return;

        if (data.messages?.length) {
            renderMessages(data.messages, true);
        }
    } catch (_) { /* silent poll */ }
}

function startUnreadPolling() {
    if (unreadPollTimer) clearInterval(unreadPollTimer);
    unreadPollTimer = setInterval(fetchUnreadCount, 10000);
    fetchUnreadCount();
}

async function fetchUnreadCount() {
    if (!state.currentUser || chatOpen || state.currentView === 'admin') {
        updateBadge(0);
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/chat/unread`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) updateBadge(data.unread_count || 0);
    } catch (_) { /* silent */ }
}

function updateBadge(count) {
    const badge = document.getElementById('chatBadge');
    const headerBadge = document.getElementById('chatHeaderBadge');
    [badge, headerBadge].forEach(el => {
        if (!el) return;
        if (count > 0) {
            el.textContent = count > 99 ? '99+' : count;
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    });
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { updateBadge as updateChatBadge };
