// Import Supabase client
import { supabase } from './supabase.js'


// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.getElementById('password');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const welcomePopup = document.getElementById('welcomePopup');
const continueBtn = document.getElementById('continueBtn');

// Create error popup element
const errorPopup = document.createElement('div');
errorPopup.className = 'error-popup';
errorPopup.innerHTML = `
  <div class="popup-content">
    <i class="fas fa-exclamation-circle"></i>
    <span id="errorMessage"></span>
    <button class="popup-close">&times;</button>
  </div>
`;
document.body.appendChild(errorPopup);

// ==================== CORE FUNCTIONALITIES ====================

// 1. PASSWORD VISIBILITY TOGGLE (FULLY WORKING)
togglePassword.addEventListener('click', function() {
  const icon = this.querySelector('i');
  const isVisible = passwordInput.type === 'text';
  
  passwordInput.type = isVisible ? 'password' : 'text';
  icon.classList.toggle('fa-eye-slash', !isVisible);
  icon.classList.toggle('fa-eye', isVisible);
});

// 2. ERROR HANDLER WITH POPUP
function showError(message) {
  const errorMessage = errorPopup.querySelector('#errorMessage');
  errorMessage.textContent = message;
  errorPopup.classList.add('visible');
  
  setTimeout(() => {
    errorPopup.classList.remove('visible');
  }, 5000);
}

errorPopup.querySelector('.popup-close').addEventListener('click', () => {
  errorPopup.classList.remove('visible');
});

// 3. LOGIN FUNCTIONALITY WITH DASHBOARD REDIRECT
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // UI Loading State
  loginButton.disabled = true;
  const originalText = loginButton.innerHTML;
  loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  try {
    const identifier = document.getElementById('username').value.trim();
    const password = passwordInput.value;

    // Validation
    if (!identifier || !password) {
      throw new Error('Please fill in all fields');
    }

    // Determine login method (email or ID/passport)
    let loginData;
    if (identifier.includes('@')) {
      loginData = { email: identifier, password };
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .or(`id_number.eq.${identifier},passport_number.eq.${identifier}`)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error('Account not found');
      }
      loginData = { email: profile.email, password };
    }

    // Auth Login
    const { data, error } = await supabase.auth.signInWithPassword(loginData);

    if (error) {
      if (error.message.includes('Invalid')) {
        throw new Error('Invalid credentials');
      } else if (error.message.includes('confirmed')) {
        throw new Error('Please verify your email first');
      }
      throw error;
    }

    // Success Flow
    welcomePopup.classList.add('active');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);

  } catch (error) {
    console.error('Login error:', error);
    showError(error.message);
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = originalText;
  }
});

// 4. CONTINUE BUTTON (ALTERNATIVE REDIRECT)
continueBtn.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});

// 5. THEME TOGGLE (OPTIONAL BUT INCLUDED)
themeToggle.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Initialize theme
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

