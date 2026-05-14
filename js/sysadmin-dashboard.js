import { supabase } from './supabase.js';
import { initNotifBell } from './notif.js';

let currentUser = null;
let allStations = [];
let roleMap = {};

supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace('admin-login.html');
});

async function init() {
    const session = await getSession();
    if (!session) return redirect('admin-login.html');

    const profile = await getProfile(session.user.id);
    if (!profile) return redirect('admin-login.html');

    const roleName = roleMap[profile.role_id] || '';
    if (roleName !== 'system_admin') {
        alert('Access denied. System Admin privileges required.');
        return redirect('admin-login.html');
    }

    currentUser = { ...session.user, profile };

    document.getElementById('adminName').textContent = profile.full_name || session.user.email;
    const initial = (profile.full_name || session.user.email)[0].toUpperCase();
    document.getElementById('avatarInitial').textContent = initial;

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContainer').style.visibility = 'visible';

    const bellAnchor = document.getElementById('notifBellAnchor');
    if (bellAnchor) initNotifBell(bellAnchor, { userId: session.user.id });

    setupTheme();
    setupNavigation();
    setupLogout();
    await loadRoles();
    await loadOverview();
    loadAllStationsCache();
}

async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return session;
}

async function getProfile(userId) {
    const { data: roles } = await supabase.from('admin_roles').select('id, name');
    if (roles) roles.forEach(r => { roleMap[r.id] = r.name; });

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role_id, station_id')
        .eq('user_id', userId)
        .maybeSingle();
    return profile;
}

function redirect(url) {
    document.getElementById('loadingScreen').style.display = 'none';
    window.location.replace(url);
}

async function loadRoles() {
    const { data } = await supabase.from('admin_roles').select('id, name');
    if (data) data.forEach(r => { roleMap[r.id] = r.name; });
}

// ===== OVERVIEW =====
async function loadOverview() {
    const [
        { count: totalReports },
        { count: lostCount },
        { count: foundCount },
        { count: recovered },
        { count: stationsCount },
        { count: usersCount }
    ] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('report_type', 'lost'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('report_type', 'found'),
        supabase.from('recovered_reports').select('*', { count: 'exact', head: true }),
        supabase.from('stations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    document.getElementById('statTotalReports').textContent = (totalReports || 0).toLocaleString();
    document.getElementById('statLost').textContent = (lostCount || 0).toLocaleString();
    document.getElementById('statFound').textContent = (foundCount || 0).toLocaleString();
    document.getElementById('statRecovered').textContent = (recovered || 0).toLocaleString();
    document.getElementById('statStations').textContent = (stationsCount || 0).toLocaleString();
    document.getElementById('statUsers').textContent = (usersCount || 0).toLocaleString();

    await loadStationPerformance();
}

async function loadStationPerformance(countyFilter = '') {
    let query = supabase
        .from('stations')
        .select('id, name, county, constituency, is_active')
        .eq('is_active', true)
        .order('county')
        .order('name');

    if (countyFilter) query = query.eq('county', countyFilter);

    const { data: stations } = await query;
    if (!stations) return;

    const countyFilterEl = document.getElementById('stationCountyFilter');
    if (countyFilterEl.options.length <= 1) {
        const { data: allStationsData } = await supabase.from('stations').select('county').eq('is_active', true).order('county');
        const counties = [...new Set((allStationsData || []).map(s => s.county).filter(Boolean))].sort();
        counties.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            countyFilterEl.appendChild(opt);
        });
    }

    const tbody = document.getElementById('stationPerfBody');

    if (stations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--light-text-muted);">No registered stations found.</td></tr>';
        return;
    }

    const stationIds = stations.map(s => s.id);

    const [
        { data: foundReports },
        { data: verifiedReports },
        { data: claimedReports }
    ] = await Promise.all([
        supabase.from('reports').select('station_id').eq('report_type', 'found').in('station_id', stationIds),
        supabase.from('reports').select('station_id').eq('delivery_status', 'unclaimed_verified').in('station_id', stationIds),
        supabase.from('reports').select('station_id').eq('delivery_status', 'claimed').in('station_id', stationIds)
    ]);

    const countByStation = (arr, key) => {
        const map = {};
        (arr || []).forEach(r => {
            map[r[key]] = (map[r[key]] || 0) + 1;
        });
        return map;
    };

    const foundMap = countByStation(foundReports, 'station_id');
    const verifiedMap = countByStation(verifiedReports, 'station_id');
    const claimedMap = countByStation(claimedReports, 'station_id');

    tbody.innerHTML = stations.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.county || '—'}</td>
            <td>${s.constituency || '—'}</td>
            <td>${foundMap[s.id] || 0}</td>
            <td>${verifiedMap[s.id] || 0}</td>
            <td>${claimedMap[s.id] || 0}</td>
            <td><span style="padding:0.25rem 0.65rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:rgba(16,185,129,0.12);color:#059669;">Active</span></td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const cf = document.getElementById('stationCountyFilter');
    if (cf) cf.addEventListener('change', () => loadStationPerformance(cf.value));
});

// ===== CASES =====
let casesPage = 0;
const PAGE_SIZE = 20;

async function loadCases() {
    const type = document.getElementById('caseTypeFilter').value;
    const county = document.getElementById('caseCountyFilter').value;
    const stationId = document.getElementById('caseStationFilter').value;
    const status = document.getElementById('caseStatusFilter').value;
    const delivery = document.getElementById('caseDeliveryFilter').value;

    const tbody = document.getElementById('casesBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">Loading...</td></tr>';

    let query = supabase
        .from('reports')
        .select(`
            id, report_type, full_name, phone, status, delivery_status, created_at, collection_point,
            stations(id, name, county, constituency),
            report_documents(document_type, document_number)
        `)
        .order('created_at', { ascending: false })
        .range(casesPage * PAGE_SIZE, (casesPage + 1) * PAGE_SIZE - 1);

    if (type) query = query.eq('report_type', type);
    if (stationId) query = query.eq('station_id', stationId);
    if (status) query = query.eq('status', status);
    if (delivery) query = query.eq('delivery_status', delivery);

    const { data, error } = await query;

    if (error || !data) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--danger-color);">Error: ${error?.message || 'Unknown error'}</td></tr>`;
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--light-text-muted);">No cases match your filters.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(r => {
        const docs = (r.report_documents || []).map(d => d.document_type?.replace(/_/g, ' ')).join(', ') || '—';
        const station = r.stations ? `${r.stations.name}` : (r.collection_point || '—');
        return `
        <tr>
            <td><span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:700;background:${r.report_type === 'found' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'};color:${r.report_type === 'found' ? '#059669' : '#dc2626'};">${r.report_type.toUpperCase()}</span></td>
            <td>${r.full_name}<br><small style="color:var(--light-text-muted);">${r.phone}</small></td>
            <td style="max-width:200px;white-space:normal;">${docs}</td>
            <td>${station}</td>
            <td>${formatStatus(r.status)}</td>
            <td>${formatDelivery(r.delivery_status)}</td>
            <td style="white-space:nowrap;">${new Date(r.created_at).toLocaleDateString('en-KE')}</td>
        </tr>`;
    }).join('');
}

function formatStatus(s) {
    const map = {
        active: ['Active', '#2563eb', 'rgba(59,130,246,0.12)'],
        potential_match: ['Potential Match', '#d97706', 'rgba(245,158,11,0.12)'],
        matched_successfully: ['Matched', '#059669', 'rgba(16,185,129,0.12)'],
        payment_pending: ['Payment Pending', '#7c3aed', 'rgba(124,58,237,0.12)'],
        completed: ['Completed', '#059669', 'rgba(16,185,129,0.12)']
    };
    const [label, color, bg] = map[s] || [s, '#64748b', 'rgba(100,116,139,0.12)'];
    return `<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:${bg};color:${color};">${label}</span>`;
}

function formatDelivery(s) {
    const map = {
        unclaimed_unverified: ['Awaiting Delivery', '#d97706', 'rgba(245,158,11,0.12)'],
        unclaimed_verified: ['Received', '#2563eb', 'rgba(59,130,246,0.12)'],
        claimed: ['Claimed', '#059669', 'rgba(16,185,129,0.12)']
    };
    const [label, color, bg] = map[s] || [s || '—', '#64748b', 'rgba(100,116,139,0.12)'];
    return `<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:${bg};color:${color};">${label}</span>`;
}

async function populateCaseFilters() {
    const { data: counties } = await supabase.from('stations').select('county').eq('is_active', true).order('county');
    const countyEl = document.getElementById('caseCountyFilter');
    const uniqueCounties = [...new Set((counties || []).map(c => c.county).filter(Boolean))].sort();
    uniqueCounties.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        countyEl.appendChild(opt);
    });

    countyEl.addEventListener('change', async () => {
        const stationEl = document.getElementById('caseStationFilter');
        stationEl.innerHTML = '<option value="">All Stations</option>';
        if (!countyEl.value) return;
        const { data: sts } = await supabase.from('stations').select('id, name').eq('county', countyEl.value).eq('is_active', true).order('name');
        (sts || []).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            stationEl.appendChild(opt);
        });
    });
}

// ===== STATIONS =====
async function loadAllStationsCache() {
    const { data } = await supabase.from('stations').select('id, name, county, constituency').order('county').order('name');
    allStations = data || [];
}

async function loadStations() {
    const tbody = document.getElementById('stationsBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">Loading...</td></tr>';

    const { data: stations, error } = await supabase
        .from('stations')
        .select('*')
        .order('county')
        .order('name');

    if (error || !stations) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--danger-color);">Error loading stations.</td></tr>`;
        return;
    }

    if (stations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--light-text-muted);">No stations registered yet. Click "Register New Station" to add the first one.</td></tr>';
        return;
    }

    tbody.innerHTML = stations.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.county || '—'}</td>
            <td>${s.constituency || '—'}</td>
            <td>${s.address || '—'}</td>
            <td>${s.contact_phone || '—'}</td>
            <td>
                <label class="toggle-active">
                    <input type="checkbox" ${s.is_active ? 'checked' : ''} onchange="toggleStation('${s.id}', this.checked)">
                    <span class="slider"></span>
                </label>
            </td>
            <td>
                <button class="btn-primary" style="padding:0.35rem 0.9rem;font-size:0.8rem;background:rgba(59,130,246,0.12);color:#2563eb;" onclick="editStation('${s.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </td>
        </tr>
    `).join('');
}

window.toggleStation = async function (stationId, isActive) {
    const { error } = await supabase
        .from('stations')
        .update({ is_active: isActive })
        .eq('id', stationId);

    if (error) {
        alert('Failed to update station status: ' + error.message);
        return;
    }

    await logAction('station_' + (isActive ? 'activate' : 'deactivate'), 'station', stationId, `Station ${isActive ? 'activated' : 'deactivated'}`);
    await loadStations();
};

window.editStation = async function (stationId) {
    const { data: station } = await supabase.from('stations').select('*').eq('id', stationId).single();
    if (!station) return;

    document.getElementById('stationModalTitle').textContent = 'Edit Police Station';
    document.getElementById('stationEditId').value = station.id;
    document.getElementById('stationName').value = station.name;
    document.getElementById('stationCounty').value = station.county || '';
    document.getElementById('stationConstituency').value = station.constituency || '';
    document.getElementById('stationPhone').value = station.contact_phone || '';
    document.getElementById('stationAddress').value = station.address || '';
    document.getElementById('stationActive').checked = station.is_active;
    document.getElementById('stationModal').style.display = 'flex';
};

async function saveStation(e) {
    e.preventDefault();
    const editId = document.getElementById('stationEditId').value;
    const payload = {
        name: document.getElementById('stationName').value.trim(),
        county: document.getElementById('stationCounty').value,
        constituency: document.getElementById('stationConstituency').value.trim(),
        contact_phone: document.getElementById('stationPhone').value.trim() || null,
        address: document.getElementById('stationAddress').value.trim() || null,
        is_active: document.getElementById('stationActive').checked
    };

    let error;
    if (editId) {
        ({ error } = await supabase.from('stations').update(payload).eq('id', editId));
        if (!error) await logAction('station_update', 'station', editId, `Updated: ${payload.name}`);
    } else {
        const { data, error: insertErr } = await supabase.from('stations').insert(payload).select().single();
        error = insertErr;
        if (!error && data) await logAction('station_register', 'station', data.id, `Registered: ${payload.name}`);
    }

    if (error) {
        alert('Error saving station: ' + error.message);
        return;
    }

    closeStationModal();
    await loadStations();
    await loadAllStationsCache();
}

function closeStationModal() {
    document.getElementById('stationModal').style.display = 'none';
    document.getElementById('stationForm').reset();
    document.getElementById('stationEditId').value = '';
    document.getElementById('stationModalTitle').textContent = 'Register New Police Station';
}

// ===== USERS =====
async function searchUsers() {
    const query = document.getElementById('userSearch').value.trim();
    const roleFilter = document.getElementById('userRoleFilter').value;
    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">Loading...</td></tr>';

    let dbQuery = supabase
        .from('profiles')
        .select(`
            user_id, full_name, email, phone, role_id, station_id, status,
            stations(name)
        `)
        .order('full_name')
        .limit(50);

    if (roleFilter) dbQuery = dbQuery.eq('role_id', roleFilter);

    const { data, error } = await dbQuery;

    if (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--danger-color);">Error: ${error.message}</td></tr>`;
        return;
    }

    let filtered = data || [];
    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(u =>
            (u.full_name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--light-text-muted);">No users found.</td></tr>';
        return;
    }

    const roleLabels = { system_admin: 'System Admin', police_admin: 'Police Admin' };

    tbody.innerHTML = filtered.map(u => {
        const roleName = roleMap[u.role_id] || 'user';
        const roleLabel = roleLabels[roleName] || 'Regular User';
        const roleBadgeClass = roleName === 'system_admin' ? 'sysadmin' : roleName === 'police_admin' ? 'police' : 'user';
        return `
        <tr>
            <td><strong>${u.full_name || '—'}</strong></td>
            <td>${u.email || '—'}</td>
            <td>${u.phone || '—'}</td>
            <td><span class="badge-role ${roleBadgeClass}">${roleLabel}</span></td>
            <td>${u.stations?.name || '—'}</td>
            <td><span style="font-size:0.78rem;color:${u.status === 'active' ? '#059669' : '#dc2626'};">${u.status || 'active'}</span></td>
            <td>
                <button class="btn-primary" style="padding:0.35rem 0.9rem;font-size:0.8rem;background:rgba(124,58,237,0.12);color:#7c3aed;" onclick="openRoleModal('${u.user_id}', '${u.full_name || ''}', '${u.email || ''}', '${roleName}', '${u.station_id || ''}')">
                    <i class="fas fa-user-edit"></i> Role
                </button>
            </td>
        </tr>`;
    }).join('');
}

window.openRoleModal = async function (userId, name, email, currentRole, currentStationId) {
    document.getElementById('roleUserId').value = userId;
    document.getElementById('roleModalUserInfo').innerHTML = `
        <strong>${name || email}</strong><br>
        <small style="color:var(--light-text-muted);">${email}</small>
    `;
    document.getElementById('roleSelect').value = currentRole === 'user' ? '' : currentRole;

    const stationGroup = document.getElementById('stationAssignGroup');
    const stationSelect = document.getElementById('stationAssignSelect');

    stationSelect.innerHTML = '<option value="">Select Station</option>';
    allStations.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.county})`;
        if (s.id === currentStationId) opt.selected = true;
        stationSelect.appendChild(opt);
    });

    stationGroup.style.display = currentRole === 'police_admin' ? 'block' : 'none';

    document.getElementById('roleModal').style.display = 'flex';
};

async function saveRole() {
    const userId = document.getElementById('roleUserId').value;
    const roleName = document.getElementById('roleSelect').value;
    const stationId = document.getElementById('stationAssignSelect').value;

    if (roleName === 'police_admin' && !stationId) {
        alert('Please assign a station for Police Admin role.');
        return;
    }

    const { data: roleRow } = await supabase.from('admin_roles').select('id').eq('name', roleName).maybeSingle();
    const roleId = roleRow?.id || null;

    const update = { role_id: roleId };
    if (roleName === 'police_admin') update.station_id = stationId;
    else update.station_id = null;

    const { error } = await supabase.from('profiles').update(update).eq('user_id', userId);

    if (error) {
        alert('Failed to update role: ' + error.message);
        return;
    }

    await logAction('role_change', 'user', userId, `Role set to: ${roleName || 'user'}`);

    document.getElementById('roleModal').style.display = 'none';
    await searchUsers();
}

// ===== AUDIT LOGS =====
async function loadAuditLogs() {
    const action = document.getElementById('auditActionFilter').value;
    const from = document.getElementById('auditDateFrom').value;
    const to = document.getElementById('auditDateTo').value;
    const tbody = document.getElementById('auditBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">Loading...</td></tr>';

    let query = supabase
        .from('audit_logs')
        .select('id, action, resource_type, resource_id, details, created_at, admin_id')
        .order('created_at', { ascending: false })
        .limit(100);

    if (action) query = query.eq('action', action);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to + 'T23:59:59Z');

    const { data, error } = await query;

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger-color);">Error: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--light-text-muted);">No audit logs found for selected filters.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(log => `
        <tr>
            <td style="white-space:nowrap;">${new Date(log.created_at).toLocaleString('en-KE')}</td>
            <td><small style="color:var(--light-text-muted);">${log.admin_id?.slice(0, 8)}...</small></td>
            <td><code style="background:var(--light-bg);padding:0.2rem 0.5rem;border-radius:0.25rem;font-size:0.8rem;">${log.action}</code></td>
            <td>${log.resource_type}</td>
            <td>${log.details || '—'}</td>
        </tr>
    `).join('');
}

// ===== HELPER: Log audit action =====
async function logAction(action, resourceType, resourceId, details) {
    if (!currentUser) return;
    await supabase.from('audit_logs').insert({
        admin_id: currentUser.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        details
    });
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const sectionId = link.dataset.section;
            document.getElementById('pageTitle').textContent = link.querySelector('.nav-text').textContent.trim();

            document.querySelectorAll('.section').forEach(s => {
                s.style.display = s.id === sectionId ? 'block' : 'none';
            });

            if (sectionId === 'cases-section') { populateCaseFilters(); }
            if (sectionId === 'stations-section') { loadStations(); }
            if (sectionId === 'users-section') { searchUsers(); }
        });
    });

    document.getElementById('applyFiltersBtn')?.addEventListener('click', loadCases);
    document.getElementById('searchUsersBtn')?.addEventListener('click', searchUsers);
    document.getElementById('loadAuditBtn')?.addEventListener('click', loadAuditLogs);

    document.getElementById('addStationBtn')?.addEventListener('click', () => {
        document.getElementById('stationModal').style.display = 'flex';
    });
    document.getElementById('closeStationModal')?.addEventListener('click', closeStationModal);
    document.getElementById('cancelStationModal')?.addEventListener('click', closeStationModal);
    document.getElementById('stationForm')?.addEventListener('submit', saveStation);

    document.getElementById('closeRoleModal')?.addEventListener('click', () => {
        document.getElementById('roleModal').style.display = 'none';
    });
    document.getElementById('cancelRoleModal')?.addEventListener('click', () => {
        document.getElementById('roleModal').style.display = 'none';
    });
    document.getElementById('saveRoleBtn')?.addEventListener('click', saveRole);

    document.getElementById('roleSelect')?.addEventListener('change', function () {
        document.getElementById('stationAssignGroup').style.display =
            this.value === 'police_admin' ? 'block' : 'none';
    });

    document.getElementById('userSearch')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchUsers();
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
        localStorage.removeItem('salamaFormDraft');
        await supabase.auth.signOut();
        window.location.replace('admin-login.html');
    });
}

function setupSessionTimeout() {
    let timeout;
    const TIMEOUT_MS = 30 * 60 * 1000;
    function reset() {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            await supabase.auth.signOut();
            window.location.replace('admin-login.html?error=timeout');
        }, TIMEOUT_MS);
    }
    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(ev =>
        document.addEventListener(ev, reset)
    );
    reset();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    setupSessionTimeout();
});
