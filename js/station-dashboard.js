import { supabase } from './supabase.js';
import { initNotifBell, sendNotif } from './notif.js';

let currentUser = null;
let currentStation = null;
let pendingActionReportId = null;
let pendingActionType = null;

supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.href = 'admin-login.html';
});

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return goLogin();

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role_id, station_id, status, admin_roles(name)')
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (!profile) return goLogin();

    const roleName = profile.admin_roles?.name;
    if (roleName !== 'police_admin') {
        alert('Access denied. Police Admin privileges required.');
        return goLogin();
    }

    if (!profile.station_id) {
        alert('Your account is not assigned to a station. Contact system admin.');
        return goLogin();
    }

    const { data: station } = await supabase
        .from('stations')
        .select('id, name, county, constituency, address, is_active')
        .eq('id', profile.station_id)
        .single();

    if (!station) {
        alert('Station not found. Contact system admin.');
        return goLogin();
    }

    currentUser = { ...session.user, profile };
    currentStation = station;

    document.getElementById('stationSidebarName').textContent = station.name;
    document.getElementById('stationFullName').textContent = `${station.name} · ${station.constituency}, ${station.county}`;
    document.getElementById('stationWelcome').textContent = `Welcome, ${station.name}`;
    document.getElementById('avatarInitial').textContent = station.name[0].toUpperCase();

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContainer').style.visibility = 'visible';

    const bellAnchor = document.getElementById('notifBellAnchor');
    if (bellAnchor) initNotifBell(bellAnchor, { userId: session.user.id });

    setupTheme();
    setupNavigation();
    setupLogout();
    setupConfirmModal();

    await loadOverview();
    await loadPending();
}

function goLogin() {
    document.getElementById('loadingScreen').style.display = 'none';
    window.location.href = 'admin-login.html';
}

// ===== OVERVIEW =====
async function loadOverview() {
    if (!currentStation) return;

    const [
        { count: pending },
        { count: received },
        { count: claimed },
        { count: claimedVerified },
        { count: total }
    ] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('station_id', currentStation.id).eq('delivery_status', 'unclaimed_unverified').eq('report_type', 'found'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('station_id', currentStation.id).eq('delivery_status', 'unclaimed_verified').eq('report_type', 'found'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('station_id', currentStation.id).eq('delivery_status', 'claimed').eq('report_type', 'found'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('station_id', currentStation.id).eq('delivery_status', 'claimed_verified').eq('report_type', 'found'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('station_id', currentStation.id).eq('report_type', 'found')
    ]);

    document.getElementById('statPending').textContent = pending || 0;
    document.getElementById('statReceived').textContent = received || 0;
    document.getElementById('statClaimed').textContent = (claimed || 0) + (claimedVerified || 0);
    document.getElementById('statTotal').textContent = total || 0;

    const badgeEl = document.getElementById('pendingBadge');
    if (pending > 0) {
        badgeEl.textContent = pending;
        badgeEl.style.display = 'inline';
    } else {
        badgeEl.style.display = 'none';
    }

    await loadRecentActivity();
}

async function loadRecentActivity() {
    const { data: reports } = await supabase
        .from('reports')
        .select('id, full_name, delivery_status, updated_at, report_documents(document_type)')
        .eq('station_id', currentStation.id)
        .eq('report_type', 'found')
        .order('updated_at', { ascending: false })
        .limit(6);

    const container = document.getElementById('recentActivity');
    if (!reports || reports.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:1rem;color:var(--light-text-muted);">No activity yet for this station.</p>';
        return;
    }

    container.innerHTML = reports.map(r => {
        const docName = r.report_documents?.[0]?.document_type?.replace(/_/g, ' ') || 'Document';
        const { icon, color, bg, label } = deliveryMeta(r.delivery_status);
        return `
        <div class="activity-item">
            <div class="activity-icon" style="background:${bg};color:${color};">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="activity-body">
                <p><strong>${r.full_name}</strong> — ${docName}</p>
                <small>${label} · ${new Date(r.updated_at).toLocaleString('en-KE')}</small>
            </div>
        </div>`;
    }).join('');
}

function deliveryMeta(status) {
    if (status === 'unclaimed_unverified') return { icon: 'hourglass-half', color: '#d97706', bg: 'rgba(245,158,11,0.12)', label: 'Awaiting Delivery' };
    if (status === 'unclaimed_verified') return { icon: 'box-open', color: '#2563eb', bg: 'rgba(59,130,246,0.12)', label: 'Received at Station' };
    if (status === 'claimed') return { icon: 'check-double', color: '#059669', bg: 'rgba(16,185,129,0.12)', label: 'Claimed by Owner' };
    if (status === 'claimed_verified') return { icon: 'user-check', color: '#059669', bg: 'rgba(16,185,129,0.12)', label: 'Claimed (Verified)' };
    return { icon: 'file', color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: status || '—' };
}

// ===== PENDING (unclaimed_unverified) =====
async function loadPending() {
    const tbody = document.getElementById('pendingBody');
    tbody.innerHTML = loadingRow(6);

    const { data, error } = await supabase
        .from('reports')
        .select(`
            id, full_name, phone, location_description, created_at,
            report_documents(document_type, document_number),
            finder_info(finder_name, finder_phone, finder_id_number)
        `)
        .eq('station_id', currentStation.id)
        .eq('report_type', 'found')
        .eq('delivery_status', 'unclaimed_unverified')
        .order('created_at', { ascending: false });

    if (error || !data) {
        tbody.innerHTML = errorRow(6, error?.message);
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = emptyRow(6, 'No documents awaiting delivery at this station.');
        return;
    }

    tbody.innerHTML = data.map(r => {
        const finder = r.finder_info;
        const docs = (r.report_documents || []).map(d => d.document_type?.replace(/_/g, ' ')).join(', ') || '—';
        return `
        <tr>
            <td>${new Date(r.created_at).toLocaleDateString('en-KE')}</td>
            <td><strong>${finder?.finder_name || r.full_name}</strong></td>
            <td>${finder?.finder_phone || r.phone}</td>
            <td style="max-width:180px;white-space:normal;">${docs}</td>
            <td>${r.location_description}</td>
            <td>
                <button class="action-btn receive" onclick="triggerAction('${r.id}', 'receive')">
                    <i class="fas fa-box-open"></i> Mark as Received
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ===== RECEIVED (unclaimed_verified) =====
async function loadReceived() {
    const tbody = document.getElementById('receivedBody');
    tbody.innerHTML = loadingRow(6);

    const { data, error } = await supabase
        .from('reports')
        .select(`
            id, full_name, created_at, updated_at, status, matched_report_id,
            report_documents(document_type, document_number),
            finder_info(finder_name),
            report_documents!inner(owner_name)
        `)
        .eq('station_id', currentStation.id)
        .eq('report_type', 'found')
        .eq('delivery_status', 'unclaimed_verified')
        .order('updated_at', { ascending: false });

    if (error || !data) {
        tbody.innerHTML = errorRow(6, error?.message);
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = emptyRow(6, 'No documents currently received and awaiting owner collection.');
        return;
    }

    tbody.innerHTML = data.map(r => {
        const docs = (r.report_documents || []).map(d => d.document_type?.replace(/_/g, ' ')).join(', ') || '—';
        const ownerName = r.report_documents?.[0]?.owner_name || '—';
        const finder = r.finder_info?.finder_name || r.full_name;
        const matched = r.status === 'matched_successfully' || r.status === 'payment_pending' || r.status === 'completed';
        return `
        <tr>
            <td>${new Date(r.updated_at).toLocaleDateString('en-KE')}</td>
            <td>${finder}</td>
            <td style="max-width:180px;white-space:normal;">${docs}</td>
            <td>${ownerName}</td>
            <td>${matched
                ? '<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;background:rgba(16,185,129,0.12);color:#059669;font-weight:600;">Owner Found</span>'
                : '<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;background:rgba(245,158,11,0.12);color:#d97706;font-weight:600;">Searching</span>'
            }</td>
            <td>
                <button class="action-btn claim" onclick="triggerAction('${r.id}', 'claim')">
                    <i class="fas fa-check-double"></i> Mark as Claimed
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ===== CLAIMED =====
async function loadClaimed() {
    const tbody = document.getElementById('claimedBody');
    tbody.innerHTML = loadingRow(6);

    const { data, error } = await supabase
        .from('reports')
        .select(`
            id, full_name, delivery_status, updated_at, recovery_fee,
            report_documents(document_type, owner_name),
            finder_info(finder_name),
            recovered_reports!found_report_id(status, reward_claimed)
        `)
        .eq('station_id', currentStation.id)
        .eq('report_type', 'found')
        .in('delivery_status', ['claimed', 'claimed_verified'])
        .order('updated_at', { ascending: false });

    if (error || !data) {
        tbody.innerHTML = errorRow(6, error?.message);
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = emptyRow(6, 'No claimed documents yet.');
        return;
    }

    tbody.innerHTML = data.map(r => {
        const docs = (r.report_documents || []).map(d => d.document_type?.replace(/_/g, ' ')).join(', ') || '—';
        const ownerName = r.report_documents?.[0]?.owner_name || '—';
        const finder = r.finder_info?.finder_name || r.full_name;
        const recovered = r.recovered_reports?.[0];
        const feePaid = recovered ? `<span style="color:#059669;font-weight:600;">Ksh ${(r.recovery_fee || 0).toLocaleString()}</span>` : '—';
        const dm = deliveryMeta(r.delivery_status);
        return `
        <tr>
            <td>${new Date(r.updated_at).toLocaleDateString('en-KE')}</td>
            <td>${finder}</td>
            <td style="max-width:180px;white-space:normal;">${docs}</td>
            <td>${ownerName}</td>
            <td>${feePaid}</td>
            <td><span class="status-badge status-${r.delivery_status?.replace(/_/g, '-')}">${dm.label}</span></td>
        </tr>`;
    }).join('');
}

// ===== ALL REPORTS =====
async function loadAll(deliveryFilter = '') {
    const tbody = document.getElementById('allBody');
    tbody.innerHTML = loadingRow(6);

    let query = supabase
        .from('reports')
        .select(`
            id, report_type, full_name, status, delivery_status, created_at,
            report_documents(document_type)
        `)
        .eq('station_id', currentStation.id)
        .eq('report_type', 'found')
        .order('created_at', { ascending: false });

    if (deliveryFilter) {
        if (deliveryFilter === 'claimed') {
            query = query.in('delivery_status', ['claimed', 'claimed_verified']);
        } else {
            query = query.eq('delivery_status', deliveryFilter);
        }
    }

    const { data, error } = await query;

    if (error || !data) { tbody.innerHTML = errorRow(6, error?.message); return; }
    if (data.length === 0) { tbody.innerHTML = emptyRow(6, 'No reports found.'); return; }

    tbody.innerHTML = data.map(r => {
        const docs = (r.report_documents || []).map(d => d.document_type?.replace(/_/g, ' ')).join(', ') || '—';
        const dm = deliveryMeta(r.delivery_status);
        return `
        <tr>
            <td>${new Date(r.created_at).toLocaleDateString('en-KE')}</td>
            <td><span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;background:rgba(16,185,129,0.12);color:#059669;font-weight:700;">FOUND</span></td>
            <td>${r.full_name}</td>
            <td style="max-width:180px;white-space:normal;">${docs}</td>
            <td>${formatReportStatus(r.status)}</td>
            <td><span class="status-badge status-${r.delivery_status?.replace(/_/g, '-')}">${dm.label}</span></td>
        </tr>`;
    }).join('');
}

function formatReportStatus(s) {
    const map = {
        active: ['Active', '#2563eb', 'rgba(59,130,246,0.12)'],
        potential_match: ['Potential Match', '#d97706', 'rgba(245,158,11,0.12)'],
        matched_successfully: ['Matched', '#059669', 'rgba(16,185,129,0.12)'],
        payment_pending: ['Payment Pending', '#7c3aed', 'rgba(124,58,237,0.12)'],
        completed: ['Completed', '#059669', 'rgba(16,185,129,0.12)']
    };
    const [label, color, bg] = map[s] || [s || '—', '#64748b', 'rgba(100,116,139,0.12)'];
    return `<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:${bg};color:${color};">${label}</span>`;
}

// ===== STATUS CHANGE ACTIONS =====
window.triggerAction = function (reportId, type) {
    pendingActionReportId = reportId;
    pendingActionType = type;

    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('confirmModalTitle');
    const body = document.getElementById('confirmModalBody');
    const btn = document.getElementById('doConfirmBtn');

    if (type === 'receive') {
        title.textContent = 'Confirm Document Received';
        body.textContent = 'By confirming, you are stating that the finder has physically delivered the document(s) to your station. The system will notify the owner to come collect their document(s). Delivery status will change to "Unclaimed – Verified".';
        btn.textContent = 'Confirm Received';
        btn.style.background = '#2563eb';
    } else {
        title.textContent = 'Confirm Document Claimed';
        body.textContent = 'By confirming, you are verifying that the document owner has collected their document(s) from your station and their identity has been verified. Delivery status will change to "Claimed (Verified)".';
        btn.textContent = 'Confirm Claimed';
        btn.style.background = '#059669';
    }

    modal.style.display = 'flex';
};

async function executeStatusChange() {
    if (!pendingActionReportId || !pendingActionType) return;

    const notes = document.getElementById('confirmNotes').value.trim();
    const newDeliveryStatus = pendingActionType === 'receive' ? 'unclaimed_verified' : 'claimed_verified';

    const { error: reportErr } = await supabase
        .from('reports')
        .update({ delivery_status: newDeliveryStatus, updated_at: new Date().toISOString() })
        .eq('id', pendingActionReportId)
        .eq('station_id', currentStation.id);

    if (reportErr) {
        alert('Error updating status: ' + reportErr.message);
        return;
    }

    const verificationType = pendingActionType === 'receive' ? 'delivery' : 'collection';
    await supabase.from('verifications').insert({
        report_id: pendingActionReportId,
        admin_id: currentUser.id,
        verification_type: verificationType,
        is_verified: true,
        notes: notes || null,
        verified_at: new Date().toISOString()
    });

    const { data: report } = await supabase
        .from('reports')
        .select('user_id, matched_report_id, full_name')
        .eq('id', pendingActionReportId)
        .single();

    if (report) {
        if (pendingActionType === 'receive') {
            await supabase.from('notifications').insert({
                user_id: report.user_id,
                message: `Your document(s) have been received at ${currentStation.name}. The owner has been notified to come collect them. Your reward will be processed after collection.`,
                type: 'success',
                status: 'unread',
                related_report_id: pendingActionReportId,
                notification_action: 'view_reports'
            });

            if (report.matched_report_id) {
                const { data: lostReport } = await supabase
                    .from('reports')
                    .select('user_id')
                    .eq('id', report.matched_report_id)
                    .single();

                if (lostReport) {
                    await supabase.from('notifications').insert({
                        user_id: lostReport.user_id,
                        message: `Great news! Your document(s) have arrived at ${currentStation.name} (${currentStation.constituency}, ${currentStation.county}). Please go collect them and complete payment.`,
                        type: 'success',
                        status: 'unread',
                        related_report_id: report.matched_report_id,
                        notification_action: 'view_reports'
                    });
                }
            }
        } else {
            await supabase.from('notifications').insert({
                user_id: report.user_id,
                message: `Your document(s) have been marked as claimed at ${currentStation.name}. Your reward has been processed. Thank you for your honesty!`,
                type: 'success',
                status: 'unread',
                related_report_id: pendingActionReportId,
                notification_action: 'view_reports'
            });
        }
    }

    await logStationAction(
        pendingActionType === 'receive' ? 'delivery_verified' : 'document_claimed',
        'report',
        pendingActionReportId,
        `${pendingActionType === 'receive' ? 'Document received' : 'Document claimed'} at ${currentStation.name}. ${notes ? 'Notes: ' + notes : ''}`
    );

    closeConfirmModal();
    await loadOverview();
    await loadPending();
    if (pendingActionType === 'receive') await loadReceived();
}

async function logStationAction(action, resourceType, resourceId, details) {
    await supabase.from('audit_logs').insert({
        admin_id: currentUser.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        details
    });
}

// ===== CONFIRM MODAL =====
function setupConfirmModal() {
    document.getElementById('closeConfirmModal')?.addEventListener('click', closeConfirmModal);
    document.getElementById('cancelConfirmModal')?.addEventListener('click', closeConfirmModal);
    document.getElementById('doConfirmBtn')?.addEventListener('click', executeStatusChange);
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    document.getElementById('confirmNotes').value = '';
    pendingActionReportId = null;
    pendingActionType = null;
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const sectionId = link.dataset.section;
            document.getElementById('pageTitle').textContent = link.querySelector('.nav-text').textContent.trim();

            document.querySelectorAll('.section').forEach(s => {
                s.style.display = s.id === sectionId ? 'block' : 'none';
            });

            if (sectionId === 'overview-section') await loadOverview();
            if (sectionId === 'pending-section') await loadPending();
            if (sectionId === 'received-section') await loadReceived();
            if (sectionId === 'claimed-section') await loadClaimed();
            if (sectionId === 'all-section') await loadAll();
        });
    });

    document.getElementById('applyAllFilter')?.addEventListener('click', () => {
        const val = document.getElementById('allDeliveryFilter').value;
        loadAll(val);
    });
}

function setupTheme() {
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') {
        document.body.classList.add('dark-mode');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
    toggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

function setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'admin-login.html';
    });
}

// ===== HTML HELPERS =====
function loadingRow(cols) {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--light-text-muted);">Loading...</td></tr>`;
}

function emptyRow(cols, msg) {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--light-text-muted);">${msg}</td></tr>`;
}

function errorRow(cols, msg) {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--danger-color);">Error: ${msg || 'Unknown'}</td></tr>`;
}

document.addEventListener('DOMContentLoaded', init);
