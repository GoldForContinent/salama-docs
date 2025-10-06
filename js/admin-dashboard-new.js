// Admin Dashboard Handler - Simple Version
import { supabase } from './supabase.js';

// Add session listener for debugging
supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Dashboard Auth state changed:', event, session?.user?.email);
    
    if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out, redirecting to login');
        window.location.href = 'admin-login.html';
    }
});

// Initialize the dashboard
async function initDashboard() {
    console.log('🚀 Initializing admin dashboard...');
    
    // Show loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    const dashboardContainer = document.querySelector('.dashboard-container');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if user is authenticated
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
        console.log('❌ User not authenticated, redirecting to login');
        window.location.href = 'admin-login.html';
        return;
    }
    
    console.log('✅ User authenticated, initializing dashboard components');
    
    // Get user info and update UI
    const user = await getCurrentUser();
    if (user) {
        updateUserInfo(user);
    }
    
    // Initialize dashboard components
    initializeComponents();
    
    // Hide loading screen and show dashboard
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (dashboardContainer) {
        dashboardContainer.style.visibility = 'visible';
    }
    
    // Remove any remaining loading overlays
    const loadingOverlays = document.querySelectorAll('.loading-overlay, .loading-screen, [class*="loading"]');
    loadingOverlays.forEach(overlay => {
        if (overlay) {
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
        }
    });
    
    // Also remove any inline loading styles
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    console.log('🎉 Dashboard loaded successfully!');
}

// Check if user is authenticated
async function checkAuthentication() {
    try {
        console.log('🔍 Checking authentication...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Session error:', error);
            return false;
        }
        
        if (!session) {
            console.log('❌ No session found');
            return false;
        }
        
        console.log('✅ Session found for:', session.user.email);
        console.log('📊 Session details:', {
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
        });
        
        // Check if user has admin role
        const adminData = await checkAdminRole(session.user.id);
        
        if (adminData.isAdmin) {
            console.log('✅ User has admin privileges');
            return true;
        } else {
            console.log('❌ User does not have admin privileges');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Authentication check error:', error);
        return false;
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

// Get current user info
async function getCurrentUser() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('❌ No session found for getCurrentUser');
            return null;
        }
        
        console.log('👤 Getting user info for:', session.user.email);
        
        const adminData = await checkAdminRole(session.user.id);
        
        const user = {
            ...session.user,
            fullName: adminData.userName
        };
        
        console.log('👤 User info:', user);
        return user;
        
    } catch (error) {
        console.error('❌ Error getting current user:', error);
        return null;
    }
}

// Update user information in the dashboard
function updateUserInfo(user) {
    console.log('👤 Updating user info:', user);
    
    // Update profile button
    const profileButton = document.getElementById('profileButton');
    if (profileButton) {
        const nameSpan = profileButton.querySelector('span');
        if (nameSpan) {
            nameSpan.textContent = user.fullName || user.email.split('@')[0];
        }
    }
    
    // Update welcome message
    const welcomeTitle = document.querySelector('.welcome-title');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${user.fullName || 'Admin'}!`;
    }
    
    // Update header subtitle
    const headerSubtitle = document.querySelector('.header-subtitle');
    if (headerSubtitle) {
        headerSubtitle.textContent = `Signed in as ${user.fullName || user.email}`;
    }
}

// Initialize dashboard components
function initializeComponents() {
    console.log('🔧 Initializing dashboard components...');
    
    // Theme Toggle
    setupThemeToggle();
    
    // Profile Dropdown
    setupProfileDropdown();
    
    // Navigation
    setupNavigation();
    
    // Logout functionality
    setupLogout();
    
    // Load initial data
    loadDashboardData();
}

// Theme toggle functionality
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;
    
    if (!themeToggle || !themeIcon) return;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Profile dropdown functionality
function setupProfileDropdown() {
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (!profileButton || !profileDropdown) return;
    
    profileButton.addEventListener('click', () => {
        profileDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileButton.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });
}

// Navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    console.log('🔗 Setting up navigation with', navLinks.length, 'links and', sections.length, 'sections');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            console.log('🖱️ Navigation link clicked:', link.textContent.trim());
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Show corresponding section
            const sectionName = link.getAttribute('data-section');
            console.log('📋 Showing section:', sectionName);
            showSection(sectionName);
        });
    });
}

// Show specific dashboard section
function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    
    console.log('🎯 Showing section:', sectionName);
    console.log('📊 Available sections:', Array.from(sections).map(s => s.id));
    
    sections.forEach(section => {
        if (section.id === sectionName) {
            console.log('✅ Showing section:', section.id);
            section.style.display = 'block';
            section.classList.add('active');
        } else {
            console.log('❌ Hiding section:', section.id);
            section.style.display = 'none';
            section.classList.remove('active');
        }
    });
}

// Logout functionality
function setupLogout() {
    const logoutBtn = document.querySelector('[onclick="handleLogout()"]');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            console.log('👋 Logging out...');
            await supabase.auth.signOut();
            window.location.href = 'admin-login.html';
        };
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Load overview statistics
        await loadOverviewStats();
        
        // Load recent reports
        await loadRecentReports();
        
        // Load audit logs
        await loadAuditLogs();
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
    }
}

// Load overview statistics
async function loadOverviewStats() {
    try {
        // This would typically fetch from your Supabase database
        // For now, we'll use placeholder data
        const stats = {
            totalReports: 150,
            activeReports: 89,
            recoveredReports: 45,
            pendingPayments: 12
        };
        
        updateStatsUI(stats);
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// Update statistics UI
function updateStatsUI(stats) {
    const statElements = {
        'totalReports': document.getElementById('totalReports'),
        'activeReports': document.getElementById('activeReports'),
        'recoveredReports': document.getElementById('recoveredReports'),
        'pendingPayments': document.getElementById('pendingPayments')
    };
    
    Object.entries(stats).forEach(([key, value]) => {
        const element = statElements[key];
        if (element) {
            element.textContent = value.toLocaleString();
        }
    });
}

// Load recent reports
async function loadRecentReports() {
    try {
        // This would fetch from your reports table
        console.log('📋 Loading recent reports...');
        
    } catch (error) {
        console.error('❌ Error loading reports:', error);
    }
}

// Load audit logs
async function loadAuditLogs() {
    try {
        // This would fetch from your audit_logs table
        console.log('📝 Loading audit logs...');
        
    } catch (error) {
        console.error('❌ Error loading audit logs:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard); 

