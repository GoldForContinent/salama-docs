// Admin Login Handler - Modern Version
import { supabase } from './supabase.js';

// DOM Elements
const form = document.getElementById('adminSignInForm');
const emailInput = document.getElementById('adminEmail');
const passwordInput = document.getElementById('adminPassword');
const errorMessage = document.getElementById('errorMessage');
const signinBtn = document.getElementById('signinBtn');
const passwordToggle = document.getElementById('passwordToggle');
const themeToggle = document.getElementById('themeToggle');
const successPopup = document.getElementById('successPopup');
const successMessage = document.getElementById('successMessage');
const continueBtn = document.getElementById('continueBtn');

// Initialize the login page
async function initLoginPage() {
    console.log('🚀 Initializing admin login page...');
    
    // Clear any existing session
    await clearExistingSession();
    
    // Set up theme toggle
    setupThemeToggle();
    
    // Set up password visibility toggle
    setupPasswordToggle();
    
    // Set up form submission
    if (form) {
        setupFormSubmission();
    }
    
    // Set up success popup
    setupSuccessPopup();
    
    // Check for error in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
        showError(getErrorMessage(errorParam));
    }
}

// Clear existing session when on login page
async function clearExistingSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('🧹 Clearing existing session on login page...');
            await supabase.auth.signOut();
        }
    } catch (error) {
        console.log('ℹ️ No existing session to clear');
    }
}

// Get user-friendly error message from error code
function getErrorMessage(errorCode) {
    const messages = {
        'unauthorized': 'You do not have permission to access the admin dashboard.',
        'auth_error': 'An authentication error occurred. Please try again.',
        'default': 'An error occurred. Please try again.'
    };
    return messages[errorCode] || messages['default'];
}

// Theme toggle functionality
function setupThemeToggle() {
    if (!themeToggle) return;
    
    // Check for saved theme preference or use preferred color scheme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}

// Password visibility toggle
function setupPasswordToggle() {
    if (!passwordToggle || !passwordInput) return;
    
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = passwordToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    });
}

// Form submission setup
function setupFormSubmission() {
    form.addEventListener('submit', handleLogin);
}

// Success popup setup
function setupSuccessPopup() {
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            hideSuccessPopup();
            window.location.href = 'admin-dashboard.html';
        });
    }
}

// Show success popup
function showSuccessPopup(userName) {
    if (successPopup && successMessage) {
        successMessage.textContent = `Welcome back, ${userName}! You have successfully logged in. Redirecting to your admin dashboard...`;
        successPopup.classList.add('active');
        
        // Auto-redirect after 3 seconds
        setTimeout(() => {
            hideSuccessPopup();
            window.location.href = 'admin-dashboard.html';
        }, 3000);
    }
}

// Hide success popup
function hideSuccessPopup() {
    if (successPopup) {
        successPopup.classList.remove('active');
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('📝 Login form submitted');
    
    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    console.log('🔐 Attempting to sign in with:', email);
    
    showLoading(true);
    hideError();
    
    try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Sign in error:', error);
            showError('Invalid email or password. Please try again.');
            return;
        }
        
        console.log('✅ Sign in successful:', data.user.email);
        
        // Check admin role
        const { isAdmin, userName } = await checkAdminRole(data.user.id);
        
        if (isAdmin) {
            console.log('✅ User has admin privileges');
            showSuccessPopup(userName);
        } else {
            console.log('❌ User does not have admin privileges');
            await supabase.auth.signOut();
            showError('Access denied. You do not have admin privileges.');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showError('Login failed. Please check your credentials and try again.');
    } finally {
        showLoading(false);
    }
}

// Check admin role
async function checkAdminRole(userId) {
    try {
        console.log('🔍 Checking admin role for user:', userId);
        
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role_id, full_name')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('❌ Error fetching profile:', error);
            return { isAdmin: false, userName: 'Unknown' };
        }

        console.log('📊 Profile data:', profile);

        if (profile && profile.role_id) {
            console.log('✅ User has admin role:', profile.role_id);
            return { 
                isAdmin: true, 
                userName: profile.full_name || 'Admin User' 
            };
        }

        console.log('❌ No admin role found');
        return { isAdmin: false, userName: profile?.full_name || 'Unknown' };
        
    } catch (error) {
        console.error('❌ Error checking admin role:', error);
        return { isAdmin: false, userName: 'Unknown' };
    }
}

// Show loading state
function showLoading(loading) {
    if (!signinBtn) return;
    
    if (loading) {
        signinBtn.classList.add('loading');
        signinBtn.disabled = true;
    } else {
        signinBtn.classList.remove('loading');
        signinBtn.disabled = false;
    }
}

// Show error message
function showError(message) {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Hide error message after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error message
function hideError() {
    if (!errorMessage) return;
    errorMessage.style.display = 'none';
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    initLoginPage();
} 