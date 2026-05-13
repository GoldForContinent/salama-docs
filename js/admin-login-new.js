import { supabase } from './supabase.js';

let selectedRole = 'system_admin';

const roleConfig = {
    system_admin: {
        hint: 'Signing in as System Administrator — full platform access.',
        hintClass: '',
        redirect: '/sysadmin',
        features: [
            { icon: 'fa-chart-line', label: 'National Analytics' },
            { icon: 'fa-users-cog', label: 'User & Role Management' },
            { icon: 'fa-building', label: 'Station Management' }
        ]
    },
    police_admin: {
        hint: 'Signing in as Police Station Admin — your station documents & deliveries.',
        hintClass: 'police-mode',
        redirect: '/station',
        features: [
            { icon: 'fa-box-open', label: 'Received Documents' },
            { icon: 'fa-check-double', label: 'Verify Collections' },
            { icon: 'fa-bell', label: 'Station Notifications' }
        ]
    }
};

async function initLoginPage() {
    setupTheme();
    setupPasswordToggle();
    setupRoleToggle();
    setupFormSubmission();
    setupSuccessPopup();

    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) showError(errorParam === 'unauthorized' ? 'You do not have permission to access that dashboard.' : 'An error occurred. Please try again.');

    const preRole = urlParams.get('role');
    if (preRole === 'police_admin') activateRole('police_admin');
}

function setupRoleToggle() {
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activateRole(tab.dataset.role);
        });
    });
}

function activateRole(role) {
    selectedRole = role;
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.role-tab[data-role="${role}"]`);
    if (activeTab) activeTab.classList.add('active');

    const cfg = roleConfig[role];
    const hintEl = document.getElementById('roleHint');
    const hintText = document.getElementById('roleHintText');
    if (hintEl && hintText) {
        hintEl.className = 'role-hint ' + (cfg.hintClass || '');
        hintText.textContent = cfg.hint;
    }

    const features = document.querySelectorAll('.feature-item');
    cfg.features.forEach((f, i) => {
        if (features[i]) {
            features[i].querySelector('i').className = 'fas ' + f.icon;
            features[i].querySelector('span').textContent = f.label;
        }
    });
}

function setupTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') document.body.classList.add('dark-mode');
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}

function setupPasswordToggle() {
    const toggle = document.getElementById('passwordToggle');
    const input = document.getElementById('adminPassword');
    if (!toggle || !input) return;
    toggle.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggle.querySelector('i').classList.toggle('fa-eye');
        toggle.querySelector('i').classList.toggle('fa-eye-slash');
    });
}

function setupFormSubmission() {
    const form = document.getElementById('adminSignInForm');
    if (form) form.addEventListener('submit', handleLogin);

    const forgot = document.getElementById('forgotPassword');
    if (forgot) {
        forgot.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value.trim();
            if (!email) { showError('Enter your email first to reset password.'); return; }
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin-login' });
            if (error) showError('Could not send reset email: ' + error.message);
            else showError('Password reset email sent. Check your inbox.', 'success');
        });
    }
}

function setupSuccessPopup() {
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            document.getElementById('successPopup')?.classList.remove('active');
            window.location.href = roleConfig[selectedRole].redirect;
        });
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (!email || !password) { showError('Please fill in all fields.'); return; }

    showLoading(true);
    hideError();

    try {
        console.log('Attempting sign in with email:', email);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        console.log('Sign in result:', { data, error });
        if (error) { showError('Incorrect email or password.'); return; }

        const { roleName, userName, stationId } = await getUserRole(data.user.id);
        console.log('User role resolved:', { roleName, userName, stationId });

        if (!roleName) {
            await supabase.auth.signOut();
            showError('Access denied. Your account does not have staff privileges. Contact the system administrator.');
            return;
        }

        if (selectedRole === 'system_admin' && roleName !== 'system_admin') {
            await supabase.auth.signOut();
            showError('Access denied. Your account does not have System Admin privileges. If you are a Police Station admin, select "Police Station" above.');
            return;
        }

        if (selectedRole === 'police_admin' && roleName !== 'police_admin') {
            await supabase.auth.signOut();
            showError('Access denied. Your account does not have Police Station Admin privileges. If you are a System Admin, select "System Admin" above.');
            return;
        }

        if (roleName === 'police_admin' && !stationId) {
            await supabase.auth.signOut();
            showError('Your Police Admin account has no station assigned. Contact the system administrator.');
            return;
        }

        const popup = document.getElementById('successPopup');
        const msg = document.getElementById('successMessage');
        if (popup && msg) {
            msg.textContent = `Welcome back, ${userName}! Redirecting you to your dashboard...`;
            popup.classList.add('active');
            setTimeout(() => { window.location.href = roleConfig[roleName].redirect; }, 2500);
        } else {
            window.location.href = roleConfig[roleName].redirect;
        }

    } catch (err) {
        showError('Login failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function getUserRole(userId) {
    console.log('getUserRole called with userId:', userId);

    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name, role_id, station_id')
        .eq('user_id', userId)
        .maybeSingle();

    console.log('Profile query result:', { profile, error: profileErr });

    if (!profile || !profile.role_id) {
        console.warn('Profile not found or has no role_id:', profile);
        return { roleName: null, userName: null, stationId: null };
    }

    const { data: roleRow, error: roleErr } = await supabase
        .from('admin_roles')
        .select('name')
        .eq('id', profile.role_id)
        .maybeSingle();

    console.log('Role query result:', { roleRow, error: roleErr });

    return {
        roleName: roleRow?.name || null,
        userName: profile.full_name || 'Admin',
        stationId: profile.station_id || null
    };
}

function showLoading(loading) {
    const btn = document.getElementById('signinBtn');
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
}

function showError(message, type = 'error') {
    const el = document.getElementById('errorMessage');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.style.color = type === 'success' ? 'var(--admin-success)' : 'var(--admin-danger)';
    el.style.background = type === 'success' ? 'rgba(56,161,105,0.1)' : 'rgba(229,62,62,0.1)';
    setTimeout(hideError, 7000);
}

function hideError() {
    const el = document.getElementById('errorMessage');
    if (el) el.style.display = 'none';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    initLoginPage();
}
