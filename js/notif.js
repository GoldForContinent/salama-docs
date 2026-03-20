/**
 * Salama Docs — Notification Core
 * Reliable, minimal notification system.
 *
 * EXPORTS
 *   sendNotif(userId, message, type?, relatedReportId?, action?)
 *     → Inserts one notification row into Supabase for any user.
 *
 *   initNotifBell(anchorEl, opts?)
 *     → Injects a bell icon next to anchorEl.
 *       Fetches unread count, subscribes to real-time changes,
 *       and renders a dropdown panel on click.
 *
 * NOTIFICATION EVENTS (who gets what)
 * ─────────────────────────────────────────────────────────────
 *  Event                         │ Recipient(s)
 * ───────────────────────────────┼───────────────────────────
 *  Finder submits found report   │ Finder (confirmation)
 *                                │ Police admin of station (new document inbound)
 *  Match detected                │ Owner (potential match found)
 *                                │ Finder (match found, wait for owner)
 *  Station marks Received        │ Finder (thank you, await reward)
 *                                │ Owner (document at station, come collect)
 *  Station marks Claimed         │ Finder (reward processing)
 *                                │ Owner (document collected, complete)
 * ─────────────────────────────────────────────────────────────
 */

import { supabase } from './supabase.js';

// ─── Send a notification to any user ────────────────────────────────────────

/**
 * @param {string} userId         – auth.users.id of the recipient
 * @param {string} message        – notification text
 * @param {'info'|'success'|'warning'|'error'} type
 * @param {string|null} relatedReportId
 * @param {string|null} action    – notification_action value
 */
export async function sendNotif(userId, message, type = 'info', relatedReportId = null, action = null) {
    if (!userId || !message) return;
    const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        message,
        type,
        status: 'unread',
        related_report_id: relatedReportId || null,
        notification_action: action || null
    });
    if (error) console.error('[notif] insert failed:', error.message);
}

// ─── Notification Bell ───────────────────────────────────────────────────────

let _bellState = null;

/**
 * Injects a notification bell adjacent to anchorEl.
 * Safe to call multiple times — only runs once per page.
 *
 * @param {HTMLElement} anchorEl  – element to insert bell before
 * @param {{ userId?: string }} opts
 */
export async function initNotifBell(anchorEl, opts = {}) {
    if (_bellState) return;
    if (!anchorEl) return;

    let userId = opts.userId;
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
    }

    const bell = _buildBell();
    anchorEl.parentNode.insertBefore(bell, anchorEl);
    _bellState = { userId, bell, panel: bell.querySelector('.nd-panel') };

    await _refreshCount();
    _subscribeRealtime();
    _startPolling();

    bell.querySelector('.nd-bell-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        _togglePanel();
    });

    document.addEventListener('click', (e) => {
        if (_bellState && !_bellState.bell.contains(e.target)) {
            _closePanel();
        }
    });
}

function _buildBell() {
    const wrap = document.createElement('div');
    wrap.className = 'nd-wrap';
    wrap.innerHTML = `
        <button class="nd-bell-btn" title="Notifications" aria-label="Notifications">
            <i class="fas fa-bell"></i>
            <span class="nd-badge" style="display:none;">0</span>
        </button>
        <div class="nd-panel" style="display:none;">
            <div class="nd-panel-header">
                <span class="nd-panel-title">Notifications</span>
                <div style="display:flex;gap:0.5rem;align-items:center;">
                    <button class="nd-markall-btn" title="Mark all as read">
                        <i class="fas fa-envelope-open-text"></i> Mark all read
                    </button>
                    <a class="nd-viewall-btn" href="notifications.html">View all</a>
                </div>
            </div>
            <div class="nd-list"></div>
            <div class="nd-empty" style="display:none;">
                <i class="fas fa-bell-slash"></i>
                <p>All caught up!</p>
            </div>
        </div>
    `;

    wrap.querySelector('.nd-markall-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await _markAllRead();
    });

    _injectBellStyles();
    return wrap;
}

async function _refreshCount() {
    if (!_bellState) return;
    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', _bellState.userId)
        .eq('status', 'unread');

    const badge = _bellState.bell.querySelector('.nd-badge');
    if (count && count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function _loadPanel() {
    if (!_bellState) return;
    const { data } = await supabase
        .from('notifications')
        .select('id, message, type, status, created_at, related_report_id, notification_action')
        .eq('user_id', _bellState.userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(10);

    const list = _bellState.panel.querySelector('.nd-list');
    const empty = _bellState.panel.querySelector('.nd-empty');
    list.innerHTML = '';

    if (!data || data.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    list.style.display = 'block';
    empty.style.display = 'none';

    list.innerHTML = data.map(n => `
        <div class="nd-item ${n.status === 'unread' ? 'nd-unread' : ''}" data-id="${n.id}" data-action="${n.notification_action || ''}" data-report="${n.related_report_id || ''}">
            <span class="nd-dot nd-dot-${n.type || 'info'}"></span>
            <div class="nd-item-body">
                <p class="nd-item-msg">${n.message}</p>
                <small class="nd-item-time">${_timeAgo(n.created_at)}</small>
            </div>
            <button class="nd-dismiss" data-id="${n.id}" title="Dismiss"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    list.querySelectorAll('.nd-item').forEach(el => {
        el.addEventListener('click', async (e) => {
            if (e.target.closest('.nd-dismiss')) return;
            const id = el.dataset.id;
            const action = el.dataset.action;
            const report = el.dataset.report;
            await _markRead(id);
            el.classList.remove('nd-unread');
            if (action === 'view_reports') window.location.href = 'dashboard.html#my-reports';
        });
    });

    list.querySelectorAll('.nd-dismiss').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            await supabase.from('notifications').update({ status: 'deleted' }).eq('id', id);
            btn.closest('.nd-item').remove();
            await _refreshCount();
        });
    });
}

async function _togglePanel() {
    if (!_bellState) return;
    const panel = _bellState.panel;
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        await _loadPanel();
    } else {
        _closePanel();
    }
}

function _closePanel() {
    if (_bellState) _bellState.panel.style.display = 'none';
}

async function _markRead(id) {
    await supabase.from('notifications').update({ status: 'read', read_at: new Date().toISOString() }).eq('id', id);
    await _refreshCount();
}

async function _markAllRead() {
    if (!_bellState) return;
    await supabase.from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('user_id', _bellState.userId)
        .eq('status', 'unread');
    await _refreshCount();
    await _loadPanel();
}

function _subscribeRealtime() {
    if (!_bellState) return;
    try {
        supabase
            .channel('notif-bell-' + _bellState.userId)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${_bellState.userId}`
            }, () => {
                _refreshCount();
                if (_bellState.panel.style.display !== 'none') _loadPanel();
            })
            .subscribe();
    } catch (e) {
        // Real-time not available — polling fallback handles it
    }
}

function _startPolling() {
    setInterval(() => {
        _refreshCount();
        if (_bellState?.panel?.style.display !== 'none') _loadPanel();
    }, 30000);
}

function _timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ─── Styles injected once ────────────────────────────────────────────────────

let _stylesInjected = false;
function _injectBellStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
.nd-wrap { position:relative; display:inline-block; }

.nd-bell-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    color: rgba(255,255,255,0.85);
    padding: 0.45rem 0.55rem;
    border-radius: 0.5rem;
    position: relative;
    display: flex;
    align-items: center;
    transition: color 0.2s, background 0.2s;
}
.nd-bell-btn:hover { color:#fff; background:rgba(255,255,255,0.12); }

.nd-badge {
    position: absolute;
    top: 2px; right: 2px;
    min-width: 18px; height: 18px;
    background: #ef4444;
    color: #fff;
    border-radius: 999px;
    font-size: 0.65rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    font-family: 'Poppins', sans-serif;
    pointer-events: none;
}

.nd-panel {
    position: absolute;
    right: 0; top: calc(100% + 8px);
    width: 340px;
    background: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    z-index: 9999;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}
body.dark-mode .nd-panel { background:#1e293b; border-color:#334155; }

.nd-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #e2e8f0;
}
body.dark-mode .nd-panel-header { border-color:#334155; }

.nd-panel-title { font-weight:700; font-size:0.9rem; color:#1e293b; }
body.dark-mode .nd-panel-title { color:#f1f5f9; }

.nd-markall-btn {
    background:none; border:none; cursor:pointer;
    font-size:0.75rem; color:#64748b; font-family:'Poppins',sans-serif;
    padding:0.3rem 0.5rem; border-radius:0.35rem;
    display:flex; align-items:center; gap:0.3rem; white-space:nowrap;
}
.nd-markall-btn:hover { background:#f1f5f9; color:#10b981; }
body.dark-mode .nd-markall-btn:hover { background:#334155; }

.nd-viewall-btn {
    font-size:0.75rem; color:#10b981; text-decoration:none; font-weight:600;
    padding:0.3rem 0.5rem; border-radius:0.35rem; white-space:nowrap;
}
.nd-viewall-btn:hover { background:rgba(16,185,129,0.1); }

.nd-list { max-height: 320px; overflow-y: auto; }

.nd-item {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s;
    position: relative;
}
.nd-item:last-child { border-bottom:none; }
.nd-item:hover { background: #f8fafc; }
body.dark-mode .nd-item { border-color:#1e293b; }
body.dark-mode .nd-item:hover { background:#273044; }
.nd-item.nd-unread { background: rgba(16,185,129,0.05); }
body.dark-mode .nd-item.nd-unread { background: rgba(16,185,129,0.08); }

.nd-dot {
    width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px;
}
.nd-dot-info    { background:#3b82f6; }
.nd-dot-success { background:#10b981; }
.nd-dot-warning { background:#f59e0b; }
.nd-dot-error   { background:#ef4444; }

.nd-item-body { flex:1; min-width:0; }
.nd-item-msg {
    font-size:0.82rem; color:#1e293b; line-height:1.4;
    white-space:normal; word-break:break-word;
    margin:0;
}
body.dark-mode .nd-item-msg { color:#e2e8f0; }
.nd-item-time { font-size:0.72rem; color:#94a3b8; }

.nd-dismiss {
    background:none; border:none; cursor:pointer; color:#94a3b8;
    padding:0.15rem 0.35rem; border-radius:0.25rem; flex-shrink:0;
    font-size:0.72rem; opacity:0; transition:opacity 0.15s;
}
.nd-item:hover .nd-dismiss { opacity:1; }
.nd-dismiss:hover { color:#ef4444; background:#fee2e2; }

.nd-empty {
    flex-direction:column; align-items:center; justify-content:center;
    padding:2rem; gap:0.5rem; color:#94a3b8; font-size:0.85rem; text-align:center;
}
.nd-empty i { font-size:1.5rem; }

@media (max-width:380px) {
    .nd-panel { width: 290px; right:-20px; }
}
    `;
    document.head.appendChild(style);
}
