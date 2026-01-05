import { supabase } from './supabase.js';
import { notificationManager } from './notification-manager.js';
import { UnifiedNotificationSystem } from './notifications-unified.js';
import { getCachedUserReports, getCachedUserProfile, invalidateUserReports, invalidateUserProfile, invalidateDashboardStats } from './cache.js';

// Document type mapping for readable names
const docTypeMap = {
    'national_id': 'National ID Card',
    'passport': 'Kenyan Passport',
    'alien_id': 'Alien ID Card',
    'refugee_id': 'Refugee ID',
    'military_id': 'Military ID',
    'driving_license': 'Driving License',
    'logbook': 'Vehicle Logbook',
    'psi_certificate': 'PSI Certificate',
    'towing_permit': 'Towing Permit',
    'badge': 'PSV Badge',
    'kcpe_certificate': 'KCPE Certificate',
    'kcse_certificate': 'KCSE Certificate',
    'university_degree': 'University Degree',
    'college_diploma': 'College Diploma/Certificate',
    'transcript': 'Official Transcript',
    'student_id': 'Student ID Card',
    'work_permit': 'Work Permit',
    'professional_license': 'Professional License',
    'practicing_certificate': 'Practicing Certificate',
    'kra_pin': 'KRA PIN Certificate',
    'business_permit': 'Business Permit',
    'title_deed': 'Title Deed',
    'lease_agreement': 'Lease Agreement',
    'allotment_letter': 'Land Allotment Letter',
    'court_order': 'Court Order',
    'power_attorney': 'Power of Attorney',
    'bank_card': 'Bank/ATM Card',
    'checkbook': 'Checkbook',
    'loan_agreement': 'Loan Agreement',
    'insurance_policy': 'Insurance Policy',
    'birth_certificate': 'Birth Certificate',
    'death_certificate': 'Death Certificate',
    'marriage_certificate': 'Marriage Certificate',
    'medical_report': 'Medical Report',
    'nhif_card': 'NHIF Card',
    'will': 'Will/Testament',
    'adoption_papers': 'Adoption Papers',
    'guardianship': 'Guardianship Papers',
    'other': 'Other Document'
};
// Helper for readable doc type
function getReadableDocType(type) {
    return docTypeMap[type] || type || 'Unknown Document';
}

// DOM Elements
const elements = {
    // Profile Elements
    userName: document.getElementById('userName'),
    userDisplayName: document.getElementById('userDisplayName'),
    userAvatar: document.getElementById('userAvatar'),
    profileName: document.getElementById('profileName'),
    profileId: document.getElementById('profileId'),
    profileEmail: document.getElementById('profileEmail'),
    profilePhone: document.getElementById('profilePhone'),
    profileLocation: document.getElementById('profileLocation'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileJoined: document.getElementById('profileJoined'),

    // Form Elements
    editProfileForm: document.getElementById('editProfileForm'),
    changePasswordForm: document.getElementById('changePasswordForm'),

    // Skeleton Elements
    welcomeTitleSkeleton: document.getElementById('welcomeTitleSkeleton'),
    userAvatarSkeleton: document.getElementById('userAvatarSkeleton'),
    userDisplayNameSkeleton: document.getElementById('userDisplayNameSkeleton'),
    statsSkeleton: document.getElementById('statsSkeleton'),
    statsGrid: document.getElementById('statsGrid'),
    profileSkeleton: document.getElementById('profileSkeleton'),
    profileContent: document.getElementById('profileContent'),
    recentReportsSkeleton: document.getElementById('recentReportsSkeleton'),

    // Other
    recentReports: document.getElementById('recentReports')
};

// Global variable to store current user data
let currentUser = null;
let currentProfile = null;

// Pagination state
let currentPage = 0;
const PAGE_SIZE = 20; // Load 20 reports per page
let totalReportsCount = 0;
let currentFilter = 'all';

// Skeleton loading management functions
function showSkeleton(element) {
    if (element) element.style.display = 'block';
}

function hideSkeleton(element) {
    if (element) element.style.display = 'none';
}

function showContent(element) {
    if (element) element.style.display = 'block';
}

function hideContent(element) {
    if (element) element.style.display = 'none';
}

// Initialize skeleton loading states
function initializeSkeletonLoading() {
    console.log('🦴 Initializing skeleton loading states...');

    // Show skeleton elements initially
    showSkeleton(elements.welcomeTitleSkeleton);
    showSkeleton(elements.userAvatarSkeleton);
    showSkeleton(elements.userDisplayNameSkeleton);
    showSkeleton(elements.statsSkeleton);
    showSkeleton(elements.profileSkeleton);
    showSkeleton(elements.recentReportsSkeleton);

    // Hide actual content initially
    hideContent(elements.userName);
    hideContent(elements.userDisplayName);
    hideContent(elements.userAvatar);
    hideContent(elements.statsGrid);
    hideContent(elements.profileContent);
    hideContent(elements.recentReports);
}

// Session Management
let sessionTimeout;
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        console.log('⏰ Session expired due to inactivity');
        handleSessionExpiry();
    }, SESSION_TIMEOUT);
}

function handleSessionExpiry() {
    // Show session expiry warning
    if (confirm('Your session has expired due to inactivity. Click OK to login again.')) {
        logout();
    } else {
        logout(); // Force logout anyway
    }
}

async function logout() {
    try {
        console.log('🚪 Logging out user...');
        await supabase.auth.signOut();
        window.location.href = 'loginpage.html';
    } catch (error) {
        console.error('❌ Error during logout:', error);
        // Force redirect even if logout fails
        window.location.href = 'loginpage.html';
    }
}

// Activity listeners
function setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
        document.addEventListener(event, resetSessionTimeout, true);
    });

    // Start the initial timeout
    resetSessionTimeout();
    console.log('✅ Session timeout initialized (10 minutes)');
}

// Initialize the dashboard
let hasRunInitialMatching = false;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Initializing dashboard...');
        initializeUI();
        initializeSkeletonLoading();
        setupActivityListeners(); // Initialize session timeout
        await loadUserData();
        await setupRealtimeSubscriptions();
        await showSection('dashboard');
        setupReportFilters();

        // Temporarily disable automated matching during initialization
        // to prevent dashboard loading issues
        console.log('🔍 Automated matching disabled during initialization to prevent loading issues');

        // Set up periodic automated matching every 5 minutes (reduced frequency)
        setInterval(async () => {
            if (typeof window.runAutomatedMatching === 'function') {
                console.log('🔍 Running periodic automated matching...');
                await window.runAutomatedMatching();
            }
        }, 5 * 60 * 1000); // 5 minutes
        
        populateMyReportsSection('all');

        // === Dark/Light Mode Toggle Logic ===
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const themeToggleIcon = document.getElementById('themeToggleIcon');
        const setTheme = (mode) => {
            if (mode === 'dark') {
                document.body.classList.add('dark-mode');
                if (themeToggleIcon) {
                    themeToggleIcon.classList.remove('fa-moon');
                    themeToggleIcon.classList.add('fa-sun');
                }
            } else {
                document.body.classList.remove('dark-mode');
                if (themeToggleIcon) {
                    themeToggleIcon.classList.remove('fa-sun');
                    themeToggleIcon.classList.add('fa-moon');
                }
            }
        };
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) setTheme(savedTheme);
        // Toggle handler
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const isDark = document.body.classList.toggle('dark-mode');
                setTheme(isDark ? 'dark' : 'light');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }

        // === Notification System Initialized ===
        // Notification manager is now global and ready to use
    } catch (error) {
        console.error('❌ Initialization error:', error);
        notificationManager.error('Failed to initialize dashboard. Please refresh the page.');
    }
});

function initializeUI() {
    console.log('🔧 Setting up UI event listeners...');
    
    // Profile dropdown toggle with session check
    const profileDropdownBtn = document.getElementById('profileDropdownBtn');
    if (profileDropdownBtn) {
        profileDropdownBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
        });
    }

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function() {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    });

    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', async function() {
            const section = this.getAttribute('data-section');
            if (section) {
                await showSection(section);
            }
        });
    });

    // Form submissions
    if (elements.editProfileForm) {
        elements.editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Profile form submitted');
            await updateProfile();
        });
    }

    if (elements.changePasswordForm) {
        elements.changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🔐 Password form submitted');
            await changePassword();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleLogout();
        });
    }

    // Profile picture preview
    const profilePictureInput = document.getElementById('profilePicture');
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    showError('editProfileModal', 'Please select a valid image file (JPEG, PNG, or WebP)');
                    this.value = '';
                    return;
                }
                
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    showError('editProfileModal', 'Image file must be less than 5MB');
                    this.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('profilePicturePreview');
                    if (preview) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    console.log('✅ UI initialization complete');
}

async function handleLogout() {
    try {
        // Show modal with logout options
        const modal = document.createElement('div');
        modal.id = 'logoutModal';
        modal.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white; border-radius: 12px; padding: 30px; max-width: 400px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center;
            ">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">Logout</h3>
                <p style="margin: 0 0 25px 0; color: #666; font-size: 14px;">Where would you like to go after logout?</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="window.performLogout('loginpage.html')" style="
                        background: #006600; color: white; border: none; padding: 12px 24px;
                        border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#004d00'" onmouseout="this.style.background='#006600'">
                        <i class="fas fa-sign-in-alt"></i> Login Page
                    </button>
                    <button onclick="window.performLogout('index.html')" style="
                        background: #BB0000; color: white; border: none; padding: 12px 24px;
                        border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#8b0000'" onmouseout="this.style.background='#BB0000'">
                        <i class="fas fa-home"></i> Homepage
                    </button>
                    <button onclick="window.closeLogoutModal()" style="
                        background: #999; color: white; border: none; padding: 12px 24px;
                        border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#777'" onmouseout="this.style.background='#999'">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
        notificationManager.error('Error during logout. Please try again.');
    }
}

window.closeLogoutModal = function() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.remove();
};

window.performLogout = async function(redirectUrl) {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear any stored data
        currentUser = null;
        currentProfile = null;
        
        // Redirect to specified page
        window.location.href = redirectUrl;
    } catch (error) {
        console.error('❌ Logout error:', error);
        notificationManager.error('Error during logout. Please try again.');
    }
};

async function showSection(sectionName) {
    console.log(`🔄 Switching to section: ${sectionName}`);

    // Check session validity before showing section
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            console.log('⏰ Session expired during navigation, redirecting to login');
            window.location.href = 'loginpage.html';
            return;
        }
    } catch (error) {
        console.error('❌ Error checking session:', error);
        window.location.href = 'loginpage.html';
        return;
    }

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.style.display = 'block';

        // Handle skeleton loading for profile section
        if (sectionName === 'profile') {
            // If profile data is already loaded, show content immediately
            if (currentProfile) {
                hideSkeleton(elements.profileSkeleton);
                showContent(elements.profileContent);
            } else {
                // Show profile skeleton if data not loaded yet
                showSkeleton(elements.profileSkeleton);
                hideContent(elements.profileContent);
            }
        }

        // If Payments section, refresh payment table
        if (sectionName === 'payments') {
            refreshPaymentSection();
        }
        // If Payments section, render the payment table
        if (sectionName === 'payments' && window.renderPaymentTable) {
            window.renderPaymentTable();
        }
    } else {
        console.warn(`⚠️ Section ${sectionName}-section not found`);
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function openModal(modalId) {
    console.log(`📋 Opening modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        
        if (modalId === 'editProfileModal') {
            populateEditProfileForm();
        }
    } else {
        console.warn(`⚠️ Modal ${modalId} not found`);
    }
}

function closeModal(modalId) {
    console.log(`❌ Closing modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        clearErrors(modal);
        
        // Reset forms
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Hide profile picture preview
        const preview = document.getElementById('profilePicturePreview');
        if (preview) preview.style.display = 'none';
    }
}

function clearErrors(modal) {
    const errorElements = modal.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.remove();
    });
}

function showError(modalId, message) {
    console.error(`❌ Error in ${modalId}:`, message);
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Clear previous errors
    clearErrors(modal);
    
    // Create new error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.cssText = 'color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 8px 12px; border-radius: 4px; margin: 10px 0; font-size: 14px;';
    errorElement.textContent = message;
    
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.insertBefore(errorElement, modalBody.firstChild);
    }
}

async function loadUserData() {
    try {
        console.log('👤 Loading user data...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('🔍 Auth result:', { user: user?.email, error: authError });
        if (authError) throw authError;
        if (!user) {
            console.log('🚫 No user found, redirecting to login');
            window.location.href = 'loginpage.html';
            return;
        }
        console.log('✅ User authenticated:', user.email);

        currentUser = user;
        window.currentUser = user; // Set global user context for payments.js
        console.log('✅ Current user loaded:', user.email);

        // Notification service is auto-initialized via notifications-unified.js

        // Get user profile with caching
        console.log('📋 Loading user profile...');
        let profile;
        try {
            profile = await getCachedUserProfile(user.id, async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
                return data;
            });

            if (!profile) {
                console.log('📝 Profile not found, creating default profile...');
                // Create default profile if doesn't exist
                const { data, error } = await supabase
                    .from('profiles')
                    .insert([{ 
                        user_id: user.id,
                        email: user.email,
                        full_name: user.email.split('@')[0],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                profile = data;
                console.log('✅ Default profile created:', profile);
                // Invalidate cache so next time it's fresh
                invalidateUserProfile(user.id);
            } else {
                console.log('✅ Profile found (from cache or DB):', profile);
            }
        } catch (profileError) {
            console.error('❌ Error loading profile:', profileError);
            throw profileError;
        }

        currentProfile = profile;
        updateUserUI(user, profile);
        await loadDashboardData();

        // Set a timeout to force show content if loading hangs
        setTimeout(() => {
            console.log('⏰ Loading timeout reached, forcing content display...');
            hideSkeleton(elements.statsSkeleton);
            hideSkeleton(elements.recentReportsSkeleton);
            showContent(elements.statsGrid);
            showContent(elements.recentReports);
        }, 10000); // 10 seconds

    } catch (error) {
        console.error('❌ Error loading user data:', error);
        notificationManager.error('Error loading user data. Please refresh the page.');

        // Force hide skeletons and show basic content even on error
        console.log('🚨 Force hiding skeletons due to error...');
        hideSkeleton(elements.welcomeTitleSkeleton);
        hideSkeleton(elements.userAvatarSkeleton);
        hideSkeleton(elements.userDisplayNameSkeleton);
        hideSkeleton(elements.statsSkeleton);
        hideSkeleton(elements.profileSkeleton);
        hideSkeleton(elements.recentReportsSkeleton);

        // Show basic content
        showContent(elements.userName);
        showContent(elements.userDisplayName);
        showContent(elements.userAvatar);
        showContent(elements.statsGrid);
        showContent(elements.profileContent);
        showContent(elements.recentReports);
    }
}

function updateUserUI(user, profile) {
    console.log('🎨 Updating UI with user data...');
    const fullName = profile?.full_name || user.email.split('@')[0];
    const avatarUrl = profile?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

        // Hide skeleton elements and show actual content
        hideSkeleton(elements.welcomeTitleSkeleton);
        hideSkeleton(elements.userAvatarSkeleton);
        hideSkeleton(elements.userDisplayNameSkeleton);
        hideSkeleton(elements.statsSkeleton);
        hideSkeleton(elements.profileSkeleton);
        hideSkeleton(elements.recentReportsSkeleton);

        showContent(elements.userName);
        showContent(elements.userDisplayName);
        showContent(elements.userAvatar);
        showContent(elements.statsGrid);
        showContent(elements.profileContent);
        showContent(elements.recentReports);

    // Update welcome message and profile
    if (elements.userName) elements.userName.textContent = fullName;
    if (elements.userDisplayName) elements.userDisplayName.textContent = fullName;
    if (elements.profileName) elements.profileName.textContent = fullName;
    
    // Update profile details
    if (elements.profileId) {
        elements.profileId.textContent = profile?.id_number || 'Not provided';
        elements.profileId.style.display = 'inline';
    }
    if (elements.profileEmail) {
        elements.profileEmail.textContent = user.email;
        elements.profileEmail.style.display = 'inline';
    }
    if (elements.profilePhone) {
        elements.profilePhone.textContent = profile?.phone || 'Not provided';
        elements.profilePhone.style.display = 'inline';
    }
    if (elements.profileLocation) {
        const location = profile?.county || profile?.address || 'Not provided';
        elements.profileLocation.textContent = location;
        elements.profileLocation.style.display = 'inline';
    }
    if (elements.profileJoined && user.created_at) {
        elements.profileJoined.textContent = new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        elements.profileJoined.style.display = 'inline';
    }

    // Show profile name
    if (elements.profileName) {
        elements.profileName.style.display = 'block';
    }

    // Update avatars with error handling
    const updateAvatar = (element, url) => {
        if (element) {
            element.src = url;
            element.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
            };
        }
    };

    updateAvatar(elements.userAvatar, avatarUrl);
    updateAvatar(elements.profileAvatar, avatarUrl);

    // Ensure profile avatar is visible
    if (elements.profileAvatar) {
        elements.profileAvatar.style.display = 'block';
    }

    console.log('✅ UI updated successfully');
}

async function populateEditProfileForm() {
    try {
        console.log('📝 Populating edit profile form...');
        
        if (!currentUser || !currentProfile) {
            console.log('⚠️ User or profile not loaded, loading data...');
            await loadUserData();
        }

        if (!currentProfile) {
            showError('editProfileModal', 'Unable to load profile data');
            return;
        }

        // Split full name into first and last names
        const names = currentProfile?.full_name ? currentProfile.full_name.split(' ') : ['', ''];
        const firstName = names[0] || '';
        const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

        // Helper function to safely set form field values
        const setFieldValue = (id, value) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = value || '';
                console.log(`✅ Set ${id} to: "${value}"`);
            } else {
                console.warn(`⚠️ Field ${id} not found in DOM`);
            }
        };

        // Populate all form fields
        setFieldValue('editFirstName', firstName);
        setFieldValue('editLastName', lastName);
        setFieldValue('editEmail', currentUser.email);
        setFieldValue('editPhone', currentProfile?.phone);
        setFieldValue('editLocation', currentProfile?.county || currentProfile?.address);

        // Hide profile picture preview
        const preview = document.getElementById('profilePicturePreview');
        if (preview) preview.style.display = 'none';

        console.log('✅ Form populated successfully');

    } catch (error) {
        console.error('❌ Error populating edit form:', error);
        showError('editProfileModal', 'Error loading profile data. Please try again.');
    }
}

async function updateProfile() {
    console.log('💾 Starting profile update...');
    
    try {
        // Clear previous errors
        clearErrors(document.getElementById('editProfileModal'));

        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Helper function to get form field values safely
        const getFieldValue = (id) => {
            const field = document.getElementById(id);
            const value = field ? field.value.trim() : '';
            console.log(`📝 ${id} value: "${value}"`);
            return value;
        };

        // Get all form values
        const firstName = getFieldValue('editFirstName');
        const lastName = getFieldValue('editLastName');
        const phone = getFieldValue('editPhone');
        const location = getFieldValue('editLocation');
        const profilePictureFile = document.getElementById('profilePicture')?.files[0];

        console.log('📋 Form data collected:', {
            firstName, 
            lastName, 
            phone, 
            location, 
            hasProfilePicture: !!profilePictureFile
        });

        // Validate required fields
        if (!firstName || !lastName) {
            throw new Error('First name and last name are required');
        }

        // Validate phone number (Kenyan format)
        if (phone && !/^(\+254|0)[17]\d{8}$/.test(phone)) {
            throw new Error('Please enter a valid Kenyan phone number (e.g., 0722123456 or +254722123456)');
        }

        // Show loading state
        const submitBtn = document.querySelector('#editProfileModal .modal-btn.primary');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #ffffff; border-radius: 50%; border-top-color: transparent; animation: spin 1s ease-in-out infinite;"></div> Updating...';
        }

        let profilePhotoUrl = currentProfile?.profile_photo || '';

        // Handle profile picture upload if a new file was selected
        if (profilePictureFile) {
            console.log('📸 Uploading new profile picture...');
            
            // Delete old profile picture if it exists and isn't a default avatar
            const oldAvatarUrl = currentProfile?.profile_photo;
            if (oldAvatarUrl && !oldAvatarUrl.includes('ui-avatars.com') && !oldAvatarUrl.includes('randomuser.me')) {
                try {
                    const oldFilePath = oldAvatarUrl.split('profile-photos/')[1];
                    if (oldFilePath) {
                        await supabase.storage.from('profile-photos').remove([oldFilePath]);
                        console.log('🗑️ Old profile picture deleted');
                    }
                } catch (deleteError) {
                    console.warn('⚠️ Could not delete old profile picture:', deleteError);
                }
            }

            // Upload new profile picture
            const fileExt = profilePictureFile.name.split('.').pop();
            const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase
                .storage
                .from('profile-photos')
                .upload(filePath, profilePictureFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('❌ Upload error:', uploadError);
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('profile-photos')
                .getPublicUrl(filePath);

            profilePhotoUrl = publicUrl;
            console.log('✅ Profile picture uploaded successfully:', profilePhotoUrl);
        }

        // Prepare update data
        const fullName = `${firstName} ${lastName}`;
        const updateData = {
            full_name: fullName,
            phone: phone || null,
            county: location || null,
            updated_at: new Date().toISOString()
        };

        // Only update profile_photo if a new one was uploaded
        if (profilePictureFile) {
            updateData.profile_photo = profilePhotoUrl;
        }

        console.log('💾 Updating profile with data:', updateData);

        // Update profile in database using upsert
        const { data, error: profileError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('user_id', currentUser.id)
            .select()
            .single();

        if (profileError) {
            console.error('❌ Profile update error:', profileError);
            throw profileError;
        }

        console.log('✅ Profile updated successfully in database:', data);

        // Invalidate profile cache since it was updated
        invalidateUserProfile(currentUser.id);
        console.log('🗑️ Invalidated profile cache after update');

        // Update current profile data
        currentProfile = { ...currentProfile, ...updateData };
        if (profilePictureFile) {
            currentProfile.profile_photo = profilePhotoUrl;
        }

        // Update UI with new data
        updateUserUI(currentUser, currentProfile);

        notificationManager.success('Profile updated successfully!');
        closeModal('editProfileModal');
        
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        let errorMessage = error.message || 'Failed to update profile';
        
        // Handle specific Supabase errors
        if (error.code === '23505') { // unique constraint violation
            errorMessage = 'This phone number is already in use by another account';
        } else if (error.message.includes('row-level security')) {
            errorMessage = 'You do not have permission to update this profile';
        }
        
        showError('editProfileModal', errorMessage);
    } finally {
        // Reset button state
        const submitBtn = document.querySelector('#editProfileModal .modal-btn.primary');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Profile';
        }
    }
}

async function changePassword() {
    console.log('🔐 Starting password change...');
    
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const submitBtn = document.querySelector('#changePasswordModal .modal-btn.primary');
    
    if (!submitBtn) return;

    // Clear previous errors
    clearErrors(document.getElementById('changePasswordModal'));

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('changePasswordModal', 'All password fields are required');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('changePasswordModal', 'New passwords do not match');
        return;
    }

    if (newPassword.length < 8) {
        showError('changePasswordModal', 'Password must be at least 8 characters long');
        return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        showError('changePasswordModal', 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
        return;
    }

    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #ffffff; border-radius: 50%; border-top-color: transparent; animation: spin 1s ease-in-out infinite;"></div> Updating...';

        // First verify current password
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword
        });

        if (verifyError) {
            throw new Error('Current password is incorrect');
        }

        // Update password using Supabase Auth
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        console.log('✅ Password changed successfully');
        notificationManager.success('Password changed successfully!');
        closeModal('changePasswordModal');
        
    } catch (error) {
        console.error('❌ Error changing password:', error);
        let errorMessage = 'Failed to change password';
        
        if (error.message.includes('New password should be different')) {
            errorMessage = 'New password must be different from your current password';
        } else if (error.message.includes('Password should be at least')) {
            errorMessage = 'Password does not meet security requirements';
        } else if (error.message.includes('Current password is incorrect')) {
            errorMessage = 'Current password is incorrect';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError('changePasswordModal', errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        if (!currentUser) {
            console.log('⚠️ No current user, skipping dashboard data load');
            return;
        }

        // Skip automated matching here - it's already run during initialization
        console.log('📋 Loading user reports and documents...');
        const { reports } = await loadUserReportsAndDocuments();
        console.log('📊 Reports loaded:', reports?.length || 0);

        updateDashboardStats(reports);
        loadRecentActivity(reports.slice(0, 3));
        await updateRecoveredCount(); // Call updateRecoveredCount after loading reports

        // Hide skeleton elements and show actual content
        console.log('🎨 Updating UI...');
        hideSkeleton(elements.statsSkeleton);
        hideSkeleton(elements.recentReportsSkeleton);
        showContent(elements.statsGrid);
        showContent(elements.recentReports);
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
    }
}

function updateDashboardStats(reports) {
    const lostCount = reports?.filter(r => r.report_type === 'lost').length || 0;
    const foundCount = reports?.filter(r => r.report_type === 'found').length || 0;
    const completedCount = reports?.filter(r => r.status === 'completed').length || 0;
    // Only count reports that are in 'recovered' or 'potential_match' (not completed)
    const recoveredCount = reports?.filter(r =>
        r.status === 'recovered' || r.status === 'potential_match'
    ).length || 0;

    const updateStat = (id, count) => {
        const element = document.getElementById(id);
        if (element) element.textContent = count;
    };

    updateStat('lostReportsCount', lostCount);
    updateStat('foundReportsCount', foundCount);
    updateStat('completedReportsCount', completedCount);
    updateStat('recoveredReportsCount', recoveredCount);
}

async function updateRecoveredCount() {
    // Get all reports for the current user
    const { reports } = await loadUserReportsAndDocuments();
    const myLostIds = reports.filter(r => r.user_id === currentUser.id && r.report_type === 'lost').map(r => r.id);
    const myFoundIds = reports.filter(r => r.user_id === currentUser.id && r.report_type === 'found').map(r => r.id);
    // Fetch all recovered reports where user is lost or found owner
    const { data: recLost } = await supabase
        .from('recovered_reports')
        .select('*')
        .in('lost_report_id', myLostIds.length ? myLostIds : ['00000000-0000-0000-0000-000000000000']);
    const { data: recFound } = await supabase
        .from('recovered_reports')
        .select('*')
        .in('found_report_id', myFoundIds.length ? myFoundIds : ['00000000-0000-0000-0000-000000000000']);
    const recoveredRows = [
        ...(recLost || []),
        ...(recFound || [])
    ];
    // Only count those with status 'recovered' or 'potential_match'
    const recoveredCount = recoveredRows.filter(
        r => r.status === 'recovered' || r.status === 'potential_match'
    ).length;
    // Update the stat
    const element = document.getElementById('recoveredReportsCount');
    if (element) element.textContent = recoveredCount;
}

function loadRecentActivity(reports) {
    if (!elements.recentReports) return;
    elements.recentReports.innerHTML = '';
    if (!reports || reports.length === 0) {
        elements.recentReports.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No recent reports found</p>';
        return;
    }
    reports.forEach(report => {
        // Get document types from report_documents
        let docTypes = 'Unknown Document';
        if (report.report_documents && report.report_documents.length > 0) {
            docTypes = report.report_documents.map(doc => doc.typeName || doc.document_type || 'Unknown').join(', ');
        }
        const reportElement = document.createElement('div');
        reportElement.className = 'report-item';
        reportElement.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white;';
        reportElement.innerHTML = `
            <div class="report-info">
                <h4 style="margin: 0 0 8px 0; color: #111827;">${docTypes}</h4>
                <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Status: ${report.status || 'Unknown'}</p>
                <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Date: ${new Date(report.created_at).toLocaleDateString()}</p>
            </div>
            <div class="report-actions" style="margin-top: 8px;">
                <span class="status-badge ${report.status || 'unknown'}" style="
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 12px; 
                    font-weight: 500;
                    background: ${report.status === 'completed' ? '#d1fae5' : report.status === 'pending' ? '#fef3c7' : '#f3f4f6'};
                    color: ${report.status === 'completed' ? '#065f46' : report.status === 'pending' ? '#92400e' : '#374151'};
                ">${report.status || 'Unknown'}</span>
            </div>
        `;
        elements.recentReports.appendChild(reportElement);
    });
}

// Add CSS for spinner animation and recovered document styling
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .blurred {
        filter: blur(4px);
        user-select: none;
        pointer-events: none;
    }
    
    .recovered-block {
        transition: all 0.3s ease;
        border-radius: 12px;
        padding: 20px;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #e5e7eb;
    }
    
    .recovered-block:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    
    .recovered-block.paid {
        border: 2px solid #10b981;
        box-shadow: 0 4px 12px rgba(16,185,129,0.15);
    }
    
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 0.95em;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        letter-spacing: 0.3px;
    }
`;
document.head.appendChild(style);

// Make functions available to HTML onclick handlers
// Mobile sidebar toggle function
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Make function globally available
window.toggleMobileSidebar = toggleMobileSidebar;
window.showSection = showSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.updateProfile = updateProfile; 
window.changePassword = changePassword; 

console.log('🎉 Dashboard JavaScript loaded successfully!');

// --- BEGIN: Report Management Integration ---

// Automated matching function that runs when dashboard loads
window.runAutomatedMatching = async function() {
    try {
        console.log('🔍 Running automated matching...');
        const { data: reports, error: reportsError } = await supabase
            .from('reports')
            .select('*, report_documents(*)');
        if (reportsError) {
            console.error('Error fetching reports for matching:', reportsError);
            return;
        }
        if (!reports || reports.length === 0) {
            console.log('No reports found in database');
            return;
        }
        const lostReports = reports.filter(r => r.report_type === 'lost');
        const foundReports = reports.filter(r => r.report_type === 'found');
        
        console.log('📊 Reports found in database:');
        console.log('Total reports:', reports.length);
        console.log('Lost reports:', lostReports.length);
        console.log('Found reports:', foundReports.length);
        
        // Log all reports with their documents
        reports.forEach(report => {
            console.log(`📋 Report ID: ${report.id}, Type: ${report.report_type}, Status: ${report.status}`);
            if (report.report_documents && report.report_documents.length > 0) {
                report.report_documents.forEach(doc => {
                    console.log(`  📄 Document: ${doc.document_type} (${doc.document_number})`);
                });
            } else {
                console.log(`  ⚠️ No documents attached to this report`);
            }
        });
        
        const matches = [];
        for (const lostReport of lostReports) {
            if (!lostReport.report_documents || lostReport.report_documents.length === 0) continue;
            for (const lostDoc of lostReport.report_documents) {
                for (const foundReport of foundReports) {
                    if (!foundReport.report_documents || foundReport.report_documents.length === 0) continue;
                    for (const foundDoc of foundReport.report_documents) {
                        console.log(`🔍 Comparing: Lost "${lostDoc.document_type}" (${lostDoc.document_number}) vs Found "${foundDoc.document_type}" (${foundDoc.document_number})`);
                        
                        if (lostDoc.document_type === foundDoc.document_type && lostDoc.document_number === foundDoc.document_number && lostDoc.document_number && foundDoc.document_number) {
                            // Check if this match already exists in recovered_reports
                            const { data: existingMatch } = await supabase
                                .from('recovered_reports')
                                .select('*')
                                .or(`lost_report_id.eq.${lostReport.id},found_report_id.eq.${foundReport.id}`)
                                .maybeSingle();
                            
                            // Also check if transactions already exist for these reports
                            const { data: existingTransactions } = await supabase
                                .from('transactions')
                                .select('*')
                                .or(`report_id.eq.${lostReport.id},report_id.eq.${foundReport.id}`);
                            
                            if (!existingMatch && (!existingTransactions || existingTransactions.length === 0)) {
                                matches.push({ lostReport, foundReport, lostDoc, foundDoc });
                            } else if (existingMatch && (!existingTransactions || existingTransactions.length === 0)) {
                                console.log(`⚠️ Match exists but missing transactions for reports ${lostReport.id} and ${foundReport.id}`);
                            }
                        }
                    }
                }
            }
        }
        for (const match of matches) {
            try {
                // Update both reports to potential_match
                await supabase.from('reports').update({ status: 'potential_match' }).eq('id', match.lostReport.id);
                await supabase.from('reports').update({ status: 'potential_match' }).eq('id', match.foundReport.id);
                
                // Invalidate cache for both users since reports were updated
                if (match.lostReport.user_id) invalidateUserReports(match.lostReport.user_id);
                if (match.foundReport.user_id) invalidateUserReports(match.foundReport.user_id);
                // Insert into recovered_reports
                await supabase.from('recovered_reports').insert({
                    lost_report_id: match.lostReport.id,
                    found_report_id: match.foundReport.id,
                    status: 'recovered'
                });

                // 🔔 Send notifications to both users for potential match
                try {
                    // --- STEP 1: Notify LOST OWNER of Potential Match ---
                    await UnifiedNotificationSystem.createNotification(
                        match.lostReport.user_id,
                        `✅ Potential match found! A document matching "${match.lostReport.document_type}" (${match.lostReport.document_number}) has been reported as found. Please verify it now.`,
                        {
                            type: 'warning',
                            reportId: match.lostReport.id,
                            action: 'view_report',
                            actionData: { reportId: match.lostReport.id }
                        }
                    );

                    // --- STEP 2: Notify FOUND OWNER of Awaiting Verification ---
                    await UnifiedNotificationSystem.createNotification(
                        match.foundReport.user_id,
                        `📄 Great news! The document you found (${match.foundReport.document_type}) has been matched with a lost report. It is now awaiting verification by the owner.`,
                        {
                            type: 'info',
                            reportId: match.foundReport.id,
                            action: 'view_report',
                            actionData: { reportId: match.foundReport.id }
                        }
                    );

                    console.log('✅ Match processed and notifications sent for reports:', match.lostReport.id, match.foundReport.id);
                } catch (notifError) {
                    console.error('❌ Notification error during matching:', notifError);
                }

                // Prepare transaction data
                const recoveryFee = (typeof match.lostReport.recovery_fee === 'number' && !isNaN(match.lostReport.recovery_fee)) ? match.lostReport.recovery_fee : 200;
                const rewardAmount = (typeof match.foundReport.reward_amount === 'number' && !isNaN(match.foundReport.reward_amount)) ? match.foundReport.reward_amount : 100;
                const recoveryTxData = {
                  report_id: match.lostReport.id,
                  transaction_type: 'recovery',
                  amount: recoveryFee,
                  status: 'pending',
                  user_id: match.lostReport.user_id,
                  phone_number: '',
                  provider: '',
                  notes: `Recovery fee for ${match.lostDoc.document_type}`
                };
                const rewardTxData = {
                  report_id: match.foundReport.id,
                  transaction_type: 'reward',
                  amount: rewardAmount,
                  status: 'pending',
                  user_id: match.foundReport.user_id,
                  phone_number: '',
                  provider: '',
                  notes: `Reward for finding ${match.foundDoc.document_type}`
                };
                // Use SQL function for atomic insert
                console.log('🔍 About to call create_match_transactions with:');
                console.log('Recovery data:', recoveryTxData);
                console.log('Reward data:', rewardTxData);
                
                const { error, data } = await supabase.rpc('create_match_transactions', {
                  recovery_data: recoveryTxData,
                  reward_data: rewardTxData
                });
                
                if (error) {
                  console.error('❌ Transaction creation error:', error);
                  console.error('Error details:', error.message, error.details, error.hint);
                  
                  // Fallback: Try direct inserts if RPC fails
                  console.log('🔄 Attempting fallback transaction creation...');
                  try {
                    const { error: recoveryError } = await supabase
                      .from('transactions')
                      .insert(recoveryTxData);
                    
                    const { error: rewardError } = await supabase
                      .from('transactions')
                      .insert(rewardTxData);
                    
                    if (recoveryError || rewardError) {
                      console.error('❌ Fallback transaction creation failed:', recoveryError || rewardError);
                    } else {
                      console.log('✅ Fallback transactions created successfully');
                      refreshPaymentSection();
                      if (typeof updateDashboardStats === 'function') updateDashboardStats();
                    }
                  } catch (fallbackError) {
                    console.error('❌ Fallback transaction creation failed:', fallbackError);
                  }
                } else {
                  console.log('✅ Transactions created successfully');
                  console.log('Returned data:', data);
                  refreshPaymentSection();
                  if (typeof updateDashboardStats === 'function') updateDashboardStats();
                }
            } catch (error) {
                console.error('❌ Error processing match:', error);
            }
        }
        
        // After processing new matches, check for existing matches that might be missing transactions
        console.log('🔍 Checking for existing matches with missing transactions...');
        await window.createMissingTransactions();
        console.log(`📊 Processing ${matches.length} matches...`);
        if (matches.length > 0) {
            notificationManager.success(`Found ${matches.length} potential matches! Check your reports.`);
        } else {
            console.log('ℹ️ No new matches found.');
        }
    } catch (error) {
        console.error('❌ Error in automated matching:', error);
    }
};

// Fetch all reports and their documents for the current user
async function loadUserReportsAndDocuments(page = 0) {
    if (!currentUser) return { reports: [], documents: [], total: 0 };
    
    // Use cached reports with fetch function
    const result = await getCachedUserReports(currentUser.id, page, async () => {
        // Get total count first (for pagination info)
        const { count, error: countError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);
        
        if (countError) {
            console.error('Error counting reports:', countError);
            return { reports: [], documents: [], total: 0, page, hasMore: false };
        }
        
        totalReportsCount = count || 0;
        
        // Fetch paginated reports
        const { data: reports, error: reportsError } = await supabase
            .from('reports')
            .select('*, report_documents(*)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
        if (reportsError) {
            console.error('Error fetching reports:', reportsError);
            return { reports: [], documents: [], total: count || 0, page, hasMore: false };
        }
        
        // Flatten documents
        let allDocuments = [];
        reports.forEach(r => {
            if (r.report_documents && Array.isArray(r.report_documents)) {
                allDocuments = allDocuments.concat(r.report_documents.map(d => ({ ...d, report_type: r.report_type, report_status: r.status, report_id: r.id, created_at: r.created_at })));
            }
        });
        
        return { 
            reports: reports || [], 
            documents: allDocuments,
            total: count || 0,
            page,
            hasMore: (page + 1) * PAGE_SIZE < (count || 0)
        };
    });
    
    return result;
}

async function populateMyReportsSection(filter = 'all', page = 0) {
    // Reset to page 0 if filter changed
    if (filter !== currentFilter) {
        page = 0;
        currentPage = 0;
        currentFilter = filter;
    } else {
        currentPage = page;
    }
    
    const container = document.getElementById('allReports');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div style="text-align:center;padding:40px;"><div style="display:inline-block;width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:16px;color:#666;">Loading reports...</p></div>';
    
    // Run matching logic before rendering reports (only on first page load, not on pagination)
    if (page === 0 && typeof window.runAutomatedMatching === 'function') {
        await window.runAutomatedMatching();
    }
    
    const { reports, total, hasMore } = await loadUserReportsAndDocuments(page);
    
    container.innerHTML = '';
    
    // Deduplicate reports by ID
    const uniqueReportsMap = new Map();
    reports.forEach(r => {
        if (!uniqueReportsMap.has(r.id)) {
            uniqueReportsMap.set(r.id, r);
        }
    });
    let filteredReports = Array.from(uniqueReportsMap.values());
    
    // Apply filters (client-side filtering for current page)
    if (filter === 'lost') filteredReports = filteredReports.filter(r => r.report_type === 'lost');
    if (filter === 'found') filteredReports = filteredReports.filter(r => r.report_type === 'found');
    if (filter === 'completed') filteredReports = filteredReports.filter(r => r.status === 'completed');
    // Modernized Recovered Section
    if (filter === 'recovered') {
        let recoveredRows = [];
        if (currentUser) {
            // Get all lost and found report IDs for this user
            const myLostIds = reports.filter(r => r.user_id === currentUser.id && r.report_type === 'lost').map(r => r.id);
            const myFoundIds = reports.filter(r => r.user_id === currentUser.id && r.report_type === 'found').map(r => r.id);
            // Fetch all recovered reports where user is lost or found owner
            const { data: recLost } = await supabase
                .from('recovered_reports')
                .select('*')
                .in('lost_report_id', myLostIds.length ? myLostIds : ['00000000-0000-0000-0000-000000000000']);
            const { data: recFound } = await supabase
                .from('recovered_reports')
                .select('*')
                .in('found_report_id', myFoundIds.length ? myFoundIds : ['00000000-0000-0000-0000-000000000000']);
            recoveredRows = [
                ...(recLost || []),
                ...(recFound || [])
            ];
        }
        if (recoveredRows.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No recovered reports found.</p>';
            return;
        }
        
        // OPTIMIZATION: Batch fetch all lost and found reports instead of N+1 queries
        const lostReportIds = recoveredRows.map(r => r.lost_report_id).filter(Boolean);
        const foundReportIds = recoveredRows.map(r => r.found_report_id).filter(Boolean);
        
        const { data: allLostReports } = await supabase
            .from('reports')
            .select('*, report_documents(*)')
            .in('id', lostReportIds.length ? lostReportIds : ['00000000-0000-0000-0000-000000000000']);
        
        const { data: allFoundReports } = await supabase
            .from('reports')
            .select('*, report_documents(*)')
            .in('id', foundReportIds.length ? foundReportIds : ['00000000-0000-0000-0000-000000000000']);
        
        // Create maps for O(1) lookup
        const lostReportMap = new Map((allLostReports || []).map(r => [r.id, r]));
        const foundReportMap = new Map((allFoundReports || []).map(r => [r.id, r]));
        
        // Batch fetch all transactions for payment status checks
        const allReportIds = [...lostReportIds, ...foundReportIds];
        const { data: allTransactions } = await supabase
            .from('transactions')
            .select('*')
            .in('report_id', allReportIds.length ? allReportIds : ['00000000-0000-0000-0000-000000000000']);
        
        const transactionMap = new Map();
        (allTransactions || []).forEach(tx => {
            if (!transactionMap.has(tx.report_id)) {
                transactionMap.set(tx.report_id, []);
            }
            transactionMap.get(tx.report_id).push(tx);
        });
        
        for (const rec of recoveredRows) {
            // Get reports from maps (O(1) lookup)
            const lostReport = lostReportMap.get(rec.lost_report_id);
            const foundReport = foundReportMap.get(rec.found_report_id);
            
            // Prefer the found document for display, fallback to lost
            let doc = null;
            if (foundReport && foundReport.report_documents && foundReport.report_documents.length > 0) {
                doc = foundReport.report_documents[0];
            } else if (lostReport && lostReport.report_documents && lostReport.report_documents.length > 0) {
                doc = lostReport.report_documents[0];
            }
            const docType = doc ? getReadableDocType(doc.document_type) : 'Unknown Document';
            const docNumber = doc && doc.document_number ? doc.document_number : 'N/A';
            const foundDocImage = doc && doc.photo_url ? doc.photo_url : null;
            const foundCollectionPoint = foundReport ? foundReport.collection_point : null;
            const isLostOwner = lostReport && lostReport.user_id === currentUser.id;
            const isFoundOwner = foundReport && foundReport.user_id === currentUser.id;
            let rewardAmount = foundReport && foundReport.reward_amount ? foundReport.reward_amount : 100;
            let claimRewardBtn = '';
            
            // Check if payment has been made (from pre-fetched transactions)
            let isPaid = false;
            if (isLostOwner && lostReport) {
                const txs = transactionMap.get(lostReport.id) || [];
                isPaid = txs.some(tx => tx.transaction_type === 'recovery' && tx.status === 'completed');
            }
            
            // Show Claim Reward button for finder if not already claimed and status is claimable
            if (isFoundOwner && (rec.status === 'recovered' || rec.status === 'potential_match') && !rec.reward_claimed) {
                claimRewardBtn = `<button onclick="window.showClaimRewardModal('${foundReport.id}', ${rewardAmount})" class="action-btn btn-warning" style="margin-top:12px;background:linear-gradient(90deg,#10b981 60%,#ffd600 100%);color:#222;font-weight:700;font-size:1.1em;box-shadow:0 2px 8px rgba(16,185,129,0.12);border:none;display:flex;align-items:center;gap:8px;">
                    <i class='fas fa-gift' style='color:#fff;font-size:1.2em;'></i> Claim Reward (KSh ${rewardAmount})
                </button>`;
            }
            // Defensive recovery fee fallback
            const recoveryFee = (typeof lostReport.recovery_fee === 'number' && !isNaN(lostReport.recovery_fee))
                ? lostReport.recovery_fee
                : 200;
            container.innerHTML += `
            <div class="report-block recovered-block" style="${isPaid ? 'border: 2px solid #10b981; box-shadow: 0 4px 12px rgba(16,185,129,0.15);' : ''}">
                <h4 style="${isPaid ? 'color: #10b981; font-weight: 700;' : ''}">Recovered Document</h4>
                <div style="margin-bottom:8px;font-size:1.1em;"><strong>Document:</strong> ${docType} <span style="color:#888;">(${docNumber})</span></div>
                <div class="doc-image-container" style="position:relative;width:180px;height:120px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);border:${isPaid ? '2px solid #10b981' : '1px solid #e5e7eb'};">
                    ${foundDocImage ? `<img src="${foundDocImage}" class="doc-image${isLostOwner && !isPaid ? ' blurred' : ''}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);display:flex;align-items:center;justify-content:center;color:#9ca3af;"><i class="fas fa-image" style="font-size:2em;"></i></div>'}
                </div>
                <div class="location-container" style="margin-top:10px;padding:8px 12px;background:${isPaid ? '#f0fdf4' : '#f9fafb'};border-radius:6px;border:1px solid ${isPaid ? '#bbf7d0' : '#e5e7eb'};">
                    <strong style="color:${isPaid ? '#065f46' : '#374151'};">Collection Point:</strong> 
                    <span class="${isLostOwner && !isPaid ? 'blurred' : ''}" style="color:${isPaid ? '#065f46' : '#6b7280'};font-weight:500;">${foundCollectionPoint || 'Unknown'}</span>
                </div>
                <div class="status-container" style="margin-top:10px;">
                    <strong>Status:</strong> 
                    ${isLostOwner ? 
                        (isPaid ? 
                            '<span style="display:inline-block;background:#d1fae5;color:#065f46;font-weight:700;padding:6px 12px;border-radius:6px;font-size:0.95em;box-shadow:0 2px 4px rgba(16,185,129,0.1);letter-spacing:0.3px;border:1px solid #bbf7d0;"><i class="fas fa-check-circle" style="color:#10b981;margin-right:6px;font-size:1em;"></i>Already Paid</span>' 
                            : 
                            '<span style="display:inline-block;background:#fef2f2;color:#991b1b;font-weight:700;padding:6px 12px;border-radius:6px;font-size:0.95em;box-shadow:0 2px 4px rgba(239,68,68,0.1);letter-spacing:0.3px;border:1px solid #fecaca;"><i class="fas fa-lock" style="color:#dc2626;margin-right:6px;font-size:1em;"></i>Payment Required</span>'
                        ) 
                        : 
                        isFoundOwner ? 
                            '<span style="display:inline-block;background:#f0f9ff;color:#1e40af;font-weight:700;padding:6px 12px;border-radius:6px;font-size:0.95em;box-shadow:0 2px 4px rgba(59,130,246,0.1);letter-spacing:0.3px;border:1px solid #bfdbfe;"><i class="fas fa-handshake" style="color:#3b82f6;margin-right:6px;font-size:1em;"></i>Potential Match</span>' 
                            : 
                            '<span style="display:inline-block;background:#f3f4f6;color:#374151;font-weight:700;padding:6px 12px;border-radius:6px;font-size:0.95em;box-shadow:0 2px 4px rgba(0,0,0,0.1);letter-spacing:0.3px;border:1px solid #e5e7eb;"><i class="fas fa-check" style="color:#6b7280;margin-right:6px;font-size:1em;"></i>Recovered</span>'
                    }
                </div>
                ${isLostOwner && !isPaid ? `<button onclick="window.showPaymentModal('${lostReport.id}', ${recoveryFee})" class="action-btn" style="background:#BB0000;margin-top:10px;">Pay to Reveal</button>` : ''}
                ${isLostOwner && isPaid ? `
                    <div style="margin-top:12px;padding:8px 12px;background:#d1fae5;border-radius:6px;border:1px solid #bbf7d0;text-align:center;box-shadow:0 2px 4px rgba(16,185,129,0.1);">
                        <i class="fas fa-check-circle" style="color:#10b981;margin-right:6px;"></i>
                        <span style="color:#065f46;font-weight:600;font-size:0.95em;">Document ready for collection!</span>
                    </div>
                ` : ''}
                ${claimRewardBtn}
            </div>
            `;
        }
        return;
    }
    // Modernized All/Lost/Found/Completed Cards
    if (filteredReports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                <h3 style="color: #6b7280; margin-bottom: 8px;">No Reports Found</h3>
                <p style="color: #9ca3af; text-align: center;">No reports match the selected filter.</p>
            </div>
        `;
        return;
    }
    for (const report of filteredReports) {
        const reportItem = document.createElement('div');
        reportItem.className = `report-item ${report.report_type === 'found' ? 'found' : ''}`;
        // Status badge
        const statusClass = `status-${report.status.toLowerCase().replace(' ', '_')}`;
        const statusText = report.status.replace('_', ' ').toUpperCase();
        // Document info
        let docTypes = 'Unknown Document';
        let docImage = '';
        let docNumber = '';
        let docTypeShort = '';
        let docPhotoUrl = '';
        if (report.report_documents && report.report_documents.length > 0) {
            const doc = report.report_documents[0];
            docTypes = getReadableDocType(doc.document_type);
            docNumber = doc.document_number || '';
            // Short badge (first word or abbreviation)
            docTypeShort = (docTypes.split(' ')[0] || 'DOC').toUpperCase();
            docPhotoUrl = doc.photo_url || '';
            
            // Always show icon, add View Image button if photo exists
            docImage = `
              <div class="modern-doc-icon">
                <span class="icon-bg"><i class="fas fa-file-alt"></i></span>
                <span class="doc-type-badge">${docTypeShort}</span>
              </div>
            `;
        } else {
            docImage = `
              <div class="modern-doc-icon">
                <span class="icon-bg"><i class="fas fa-file-alt"></i></span>
                <span class="doc-type-badge">DOC</span>
              </div>
            `;
        }
        // Actions
        let actions = '';
        if (report.report_type === 'lost' && report.status === 'potential_match' && currentUser && report.user_id === currentUser.id) {
            actions = `
                <button onclick="showVerificationModal('${report.id}')" class="action-btn btn-primary">
                    <i class="fas fa-check-circle"></i> Verify
                </button>
            `;
        }
        if (report.report_type === 'lost' && report.status === 'matched_successfully' && currentUser && report.user_id === currentUser.id) {
            let recoveryFee = report.recovery_fee || 200;
            actions = `
                <span style="display:inline-block;background:linear-gradient(90deg,#ffe0e0 60%,#fffbe6 100%);color:#b91c1c;font-weight:700;padding:8px 18px;border-radius:8px;font-size:1.08em;margin-top:8px;box-shadow:0 2px 8px rgba(185,28,28,0.08);letter-spacing:0.5px;">
                    <i class="fas fa-lock" style="color:#b91c1c;margin-right:7px;font-size:1.1em;"></i>
                    Recovery Fee: KSh ${recoveryFee}
                </span>
            `;
        }
        if (report.report_type === 'found' && report.status === 'completed' && currentUser && report.user_id === currentUser.id) {
            const rewardAmount = report.reward_amount || 100;
            actions = `
                <button class="action-btn btn-warning claim-reward-btn" 
                    data-report-id="${report.id}" 
                    data-reward-amount="${rewardAmount}">
                    <i class="fas fa-gift"></i> Claim Reward (KSh ${rewardAmount})
                </button>
            `;
        }
        reportItem.innerHTML = `
            <div class="report-header">
                <div>
                    <h3 class="report-title">${report.report_type === 'lost' ? 'Lost' : 'Found'} Report</h3>
                    <div class="report-date">
                        ${new Date(report.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="report-content">
                ${docImage}
                <div class="report-details">
                    <div class="report-doc-type">${docTypes}</div>
                    ${docNumber ? `<div class="report-doc-number">${docNumber}</div>` : ''}
                    ${docPhotoUrl ? `<button onclick="window.openImageViewer('${docPhotoUrl}', '${docTypes}')" class="view-image-btn" style="margin-top:8px;background:#3b82f6;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;transition:all 0.3s ease;"><i class="fas fa-eye"></i> View Image</button>` : ''}
                    ${report.collection_point ? `
                        <div style="font-size:14px;color:#4b5563;margin-top:8px;">
                            <i class="fas fa-map-marker-alt" style="color:#BB0000;"></i>
                            ${report.collection_point}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="report-footer">
                <div>
                    ${report.report_type === 'found' ? `
                        <span style="display:inline-block;background:linear-gradient(90deg,#bbf7d0 60%,#ffe066 100%);color:#065f46;font-weight:700;padding:8px 18px;border-radius:8px;font-size:1.08em;box-shadow:0 2px 8px rgba(16,185,129,0.08);letter-spacing:0.5px;">
                            <i class='fas fa-gift' style='color:#ffd600;margin-right:7px;font-size:1.1em;'></i>
                            Reward: KSh ${report.reward_amount || 100}
                        </span>
                    ` : ''}
                </div>
                ${actions ? `<div>${actions}</div>` : ''}
            </div>
        `;
        container.appendChild(reportItem);
    }
    // Add event listeners for claim reward buttons
    document.querySelectorAll('.claim-reward-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const reportId = this.getAttribute('data-report-id');
            let rewardAmount = this.getAttribute('data-reward-amount');
            if (!reportId) return;
            if (!rewardAmount || isNaN(Number(rewardAmount))) {
                const { data: report } = await supabase.from('reports').select('reward_amount').eq('id', reportId).maybeSingle();
                rewardAmount = (report && report.reward_amount) ? report.reward_amount : 100;
            }
            showModal({
                title: 'Claim Your Reward',
                content: `
                    <div style="text-align:center; margin-bottom:20px;">
                        <i class="fas fa-gift" style="font-size:48px;color:#ffc107;"></i>
                        <h3 style="margin:16px 0 8px;">Thank you for helping!</h3>
                        <p>You've earned a reward for reuniting this document with its owner.</p>
                        <div style="font-size:24px;font-weight:600;color:#BB0000;margin:16px 0;">
                            KSh ${rewardAmount}
                        </div>
                    </div>
                `,
                actions: [
                    {
                        label: 'Claim Reward',
                        style: 'background:#ffc107;color:#000;padding:10px 20px;border-radius:6px;font-weight:600;',
                        onClick: async () => {
                            await supabase.from('transactions').insert({
                                report_id: reportId,
                                type: 'reward',
                                status: 'completed',
                                amount: Number(rewardAmount),
                                created_at: new Date().toISOString()
                            });
                            notificationManager.success('Reward claimed! Funds will be sent to your phone.');
                            document.getElementById('customModal')?.remove();
                            populateMyReportsSection(filter, currentPage); // Keep current page
                            await updateRecoveredCount(); // Update count after claiming reward
                        }
                    },
                    {
                        label: 'Cancel',
                        style: 'background:#BB0000;color:#fff;padding:10px 20px;border-radius:6px;font-weight:600;',
                        onClick: () => document.getElementById('customModal')?.remove()
                    }
                ]
            });
        });
    });
    
    // Add pagination controls (only for non-recovered filters and if there are more reports)
    if (filter !== 'recovered' && total > PAGE_SIZE) {
        const paginationDiv = createPaginationControls(page, total, hasMore, filter);
        container.appendChild(paginationDiv);
    }
}

// Create pagination controls
function createPaginationControls(currentPage, total, hasMore, filter) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-container';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 1.5rem; margin: 2rem 0; padding: 1.5rem; background: var(--card-bg); border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
    
    const totalPages = Math.ceil(total / PAGE_SIZE);
    
    paginationDiv.innerHTML = `
        <button 
            onclick="loadPreviousPage('${filter}')" 
            ${currentPage === 0 ? 'disabled' : ''}
            class="pagination-btn pagination-btn-prev"
            style="padding: 0.75rem 1.5rem; background: ${currentPage === 0 ? '#ccc' : 'var(--button-bg)'}; color: white; border: none; border-radius: 6px; cursor: ${currentPage === 0 ? 'not-allowed' : 'pointer'}; font-size: 0.95rem; font-weight: 500; transition: all 0.3s ease; opacity: ${currentPage === 0 ? '0.6' : '1'}; display: flex; align-items: center; gap: 0.5rem;"
        >
            <i class="fas fa-chevron-left"></i> Previous
        </button>
        <span class="pagination-info" style="font-size: 0.95rem; color: var(--secondary-text); font-weight: 500;">
            Page <strong style="color: var(--text-color);">${currentPage + 1}</strong> of <strong style="color: var(--text-color);">${totalPages}</strong>
            <span style="color: var(--secondary-text); margin-left: 0.5rem;">(${total} total)</span>
        </span>
        <button 
            onclick="loadNextPage('${filter}')" 
            ${!hasMore ? 'disabled' : ''}
            class="pagination-btn pagination-btn-next"
            style="padding: 0.75rem 1.5rem; background: ${!hasMore ? '#ccc' : 'var(--button-bg)'}; color: white; border: none; border-radius: 6px; cursor: ${!hasMore ? 'not-allowed' : 'pointer'}; font-size: 0.95rem; font-weight: 500; transition: all 0.3s ease; opacity: ${!hasMore ? '0.6' : '1'}; display: flex; align-items: center; gap: 0.5rem;"
        >
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    return paginationDiv;
}

// Pagination navigation functions
window.loadNextPage = async function(filter = currentFilter) {
    const newPage = currentPage + 1;
    await populateMyReportsSection(filter, newPage);
    // Scroll to top of reports section
    const container = document.getElementById('allReports');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.loadPreviousPage = async function(filter = currentFilter) {
    if (currentPage > 0) {
        const newPage = currentPage - 1;
        await populateMyReportsSection(filter, newPage);
        // Scroll to top of reports section
        const container = document.getElementById('allReports');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

// ... existing code after populateMyReportsSection ...

// Add event listeners for filter tabs with debouncing
let filterDebounceTimer = null;
function setupReportFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            
            // Show loading indicator
            const container = document.getElementById('allReports');
            if (container) {
                container.innerHTML = '<div style="text-align:center;padding:40px;"><div style="display:inline-block;width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:16px;color:#666;">Loading reports...</p></div>';
            }
            
            // Debounce filter changes
            clearTimeout(filterDebounceTimer);
            filterDebounceTimer = setTimeout(() => {
                populateMyReportsSection(filter, 0); // Reset to page 0 when filter changes
            }, 100);
        });
    });
}

// --- END: Report Management Integration ---

// Add CSS for blur effect and lock icon
const recoveredStyle = document.createElement('style');
recoveredStyle.textContent = `
.blurred {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}
.locked-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 2em;
  border-radius: 8px;
}
.lock-icon {
  font-size: 2em;
  display: inline-block;
}
`;
document.head.appendChild(recoveredStyle);

// Add test and debug functions
window.testRecoveredReport = async function() {
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    // Get user's reports
    const { reports } = await loadUserReportsAndDocuments();
    const lostReports = reports.filter(r => r.report_type === 'lost' && r.status === 'active');
    const foundReports = reports.filter(r => r.report_type === 'found' && r.status === 'active');
    
    if (lostReports.length === 0 || foundReports.length === 0) {
        alert('You need at least one lost and one found report to test');
        return;
    }
    
    // Create a test recovered report
    const { data, error } = await supabase.from('recovered_reports').insert({
        lost_report_id: lostReports[0].id,
        found_report_id: foundReports[0].id,
        status: 'recovered'
    });
    
    if (error) {
        alert('Error creating test recovered report: ' + error.message);
    } else {
        alert('Test recovered report created! Check the Recovered tab.');
        populateMyReportsSection('recovered');
    }
};

window.debugRecoveredReports = async function() {
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    // Check if we can access recovered_reports
    const { data, error } = await supabase.from('recovered_reports').select('*');
    
    if (error) {
        alert('Error accessing recovered_reports: ' + error.message);
    } else {
        alert('Found ' + (data?.length || 0) + ' recovered reports in database');
        console.log('Recovered reports:', data);
    }
};

/**
 * Simulate a match between a lost and found report.
 * @param {string} lostReportId - The ID of the lost report.
 * @param {string} foundReportId - The ID of the found report.
 */
window.simulatePotentialMatch = async function(lostReportId, foundReportId) {
    try {
        // 1. Update both reports to potential_match
        let { error: lostError } = await supabase
            .from('reports')
            .update({ status: 'potential_match' })
            .eq('id', lostReportId);
        let { error: foundError } = await supabase
            .from('reports')
            .update({ status: 'potential_match' })
            .eq('id', foundReportId);

        if (lostError || foundError) {
            alert('Error updating report statuses');
            return;
        }

        // 2. Insert into recovered_reports
        const { data, error } = await supabase
            .from('recovered_reports')
            .insert({
                lost_report_id: lostReportId,
                found_report_id: foundReportId,
                status: 'recovered'
            });

        if (error) {
            alert('Error creating recovered report: ' + error.message);
            return;
        }

        alert('Potential match created! Both reports are now in potential_match status and recovered_reports row created.');
        // Optionally refresh the dashboard
        populateMyReportsSection('recovered');
        await updateRecoveredCount(); // Update count after simulating match
    } catch (err) {
        alert('Unexpected error: ' + err.message);
    }
};

/**
 * Frontend matching function that finds lost and found reports with the same document type and number,
 * updates both to 'potential_match', and inserts a row in recovered_reports.
 */
window.matchReports = async function() {
    try {
        // Get all reports
        const { data: reports } = await supabase.from('reports').select('*');
        
        // Find matching lost and found reports
        const matches = reports.filter(r1 => reports.some(r2 => 
            r1.report_type !== r2.report_type && 
            r1.document_type === r2.document_type && 
            r1.document_number === r2.document_number
        ));
        
        // Update reports to potential_match and insert into recovered_reports
        for (const match of matches) {
            const otherReport = reports.find(r => 
                r.report_type !== match.report_type && 
                r.document_type === match.document_type && 
                r.document_number === match.document_number
            );
            
            if (otherReport) {
                await supabase.from('reports').update({ status: 'potential_match' }).eq('id', match.id);
                await supabase.from('reports').update({ status: 'potential_match' }).eq('id', otherReport.id);
                
                await supabase.from('recovered_reports').insert({
                    lost_report_id: match.report_type === 'lost' ? match.id : otherReport.id,
                    found_report_id: match.report_type === 'found' ? match.id : otherReport.id,
                    status: 'recovered'
                });
            }
        }
        
        notificationManager.success('Matching complete! Check the Recovered tab.');
        populateMyReportsSection('recovered');
        await updateRecoveredCount(); // Update count after matching
    } catch (err) {
        alert('Unexpected error: ' + err.message);
    }
};

// --- Status Transition Functions ---

/**
 * Verify documents and update status (Lost Owner)
 */
window.verifyDocuments = async function(reportId) {
    try {
        // 1. Get the recovered report record
        const { data: recovered } = await supabase
            .from('recovered_reports')
            .select('*')
            .or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`)
            .maybeSingle();

        if (!recovered) throw new Error('No matching recovered record found');

        // 2. Update both reports to matched_successfully
        const { error } = await supabase
            .from('reports')
            .update({ status: 'matched_successfully' })
            .in('id', [recovered.lost_report_id, recovered.found_report_id]);

        if (error) throw error;

        // 3. Update recovered_reports to payment_pending
        await supabase
            .from('recovered_reports')
            .update({ status: 'payment_pending' })
            .eq('id', recovered.id);

        // 🔔 Send notifications to both users after verification
        try {
            const { data: lostReport } = await supabase.from('reports').select('user_id, collection_point, recovery_fee, document_type').eq('id', recovered.lost_report_id).single();
            const { data: foundReport } = await supabase.from('reports').select('user_id, reward_amount, document_type').eq('id', recovered.found_report_id).single();

            // --- Notify LOST OWNER to Pay Recovery Fee ---
            if (lostReport) {
                await UnifiedNotificationSystem.createNotification(
                    lostReport.user_id,
                    `💰 Verification Successful! Please pay the recovery fee to reveal the location of your ${lostReport.document_type}.`,
                    {
                        type: 'success',
                        reportId: recovered.lost_report_id,
                        action: 'pay_recovery_fee',
                        actionData: { reportId: recovered.lost_report_id }
                    }
                );
            }

            // --- Notify FOUND OWNER that Owner Verified ---
            if (foundReport) {
                await UnifiedNotificationSystem.createNotification(
                    foundReport.user_id,
                    `🎉 The owner has verified the document! You can now claim your reward once the recovery fee is paid.`,
                    {
                        type: 'success',
                        reportId: recovered.found_report_id,
                        action: 'view_report',
                        actionData: { reportId: recovered.found_report_id }
                    }
                );
            }
        } catch (notifError) {
            console.error('❌ Notification error during verification:', notifError);
        }

        notificationManager.success('Documents verified successfully!');
        populateMyReportsSection('recovered');
        await updateRecoveredCount(); // Update count after verification
        closeModal();
    } catch (error) {
        notificationManager.error('Verification failed: ' + error.message);
    }
};

/**
 * Process payment and reveal location (Lost Owner)
 */
window.processPayment = async function(reportId) {
    try {
        // 1. Get the recovered report
        const { data: recovered } = await supabase
            .from('recovered_reports')
            .select('*')
            .or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`)
            .maybeSingle();

        if (!recovered) throw new Error('No matching recovered record');

        // 2. Create transaction record
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                report_id: reportId,
                transaction_type: 'recovery',
                amount: 200, // Set your fee amount
                status: 'completed'
            });

        if (txError) throw txError;

        // 3. Update all statuses to completed
        await supabase
            .from('recovered_reports')
            .update({ status: 'completed' })
            .eq('id', recovered.id);

        await supabase
            .from('reports')
            .update({ status: 'completed' })
            .in('id', [recovered.lost_report_id, recovered.found_report_id]);

        // 🔔 Send notifications to both users after payment
        try {
            const { data: lostReport } = await supabase.from('reports').select('user_id, collection_point, document_type').eq('id', recovered.lost_report_id).single();
            const { data: foundReport } = await supabase.from('reports').select('user_id, reward_amount, document_type').eq('id', recovered.found_report_id).single();

            // --- Notify LOST OWNER of Successful Payment & Reveal Location ---
            if (lostReport) {
                const locationDetails = lostReport.collection_point || "the designated collection point";
                await UnifiedNotificationSystem.createNotification(
                    lostReport.user_id,
                    `📍 Payment Successful! Your document is ready for collection at ${locationDetails}. You can also view this in the Recovered Reports section.`,
                    {
                        type: 'success',
                        reportId: recovered.lost_report_id,
                        action: 'view_recovered',
                        actionData: { reportId: recovered.lost_report_id }
                    }
                );
            }

            // --- Notify FOUND OWNER to Claim Reward ---
            if (foundReport) {
                await UnifiedNotificationSystem.createNotification(
                    foundReport.user_id,
                    `💳 Recovery fee paid! Please claim your reward. Your reward will be processed within 24 hours.`,
                    {
                        type: 'success',
                        reportId: recovered.found_report_id,
                        action: 'claim_reward',
                        actionData: { reportId: recovered.found_report_id }
                    }
                );
            }
        } catch (notifError) {
            console.error('❌ Notification error during payment:', notifError);
        }

        notificationManager.success('Payment processed! Location revealed.');
        populateMyReportsSection('recovered');
        await updateRecoveredCount(); // Update count after payment
        closeModal();
    } catch (error) {
        notificationManager.error('Payment failed: ' + error.message);
    }
};

// --- Modal Functions ---

// Reusable modal logic
function showModal({ title, content, actions = [], image = null, id = 'customModal' }) {
    // Remove any existing modal
    document.getElementById(id)?.remove();
    // Modal overlay
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'kenya-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';
    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.background = '#fff';
    modalContent.style.padding = '32px';
    modalContent.style.borderRadius = '12px';
    modalContent.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
    modalContent.style.maxWidth = '420px';
    modalContent.style.textAlign = 'center';
    modalContent.style.position = 'relative';
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '12px';
    closeBtn.style.right = '16px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '2rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => modal.remove();
    modalContent.appendChild(closeBtn);
    // Title
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.color = '#006600';
    titleEl.style.marginBottom = '18px';
    modalContent.appendChild(titleEl);
    // Image (if any)
    if (image) {
        const img = document.createElement('img');
        img.src = image;
        img.alt = 'Document Image';
        img.style.maxWidth = '100%';
        img.style.border = '2px solid #BB0000';
        img.style.borderRadius = '8px';
        img.style.margin = '10px 0';
        modalContent.appendChild(img);
    }
    // Content
    const contentEl = document.createElement('div');
    contentEl.innerHTML = content;
    modalContent.appendChild(contentEl);
    // Actions
    if (actions.length > 0) {
        const actionsDiv = document.createElement('div');
        actionsDiv.style.marginTop = '24px';
        actionsDiv.style.display = 'flex';
        actionsDiv.style.justifyContent = 'center';
        actionsDiv.style.gap = '16px';
        actions.forEach(({ label, onClick, style }) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style = style || 'padding: 10px 20px; border-radius: 6px; border: none; font-weight: 600;';
            btn.onclick = onClick;
            actionsDiv.appendChild(btn);
        });
        modalContent.appendChild(actionsDiv);
    }
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

window.showVerificationModal = async function(reportId) {
    // Show loading spinner
    let spinner = document.createElement('div');
    spinner.id = 'verificationSpinner';
    spinner.style.position = 'fixed';
    spinner.style.top = '0';
    spinner.style.left = '0';
    spinner.style.width = '100vw';
    spinner.style.height = '100vh';
    spinner.style.background = 'rgba(0,0,0,0.3)';
    spinner.style.display = 'flex';
    spinner.style.alignItems = 'center';
    spinner.style.justifyContent = 'center';
    spinner.style.zIndex = '9999';
    spinner.innerHTML = `<div style="background:#fff;padding:32px 48px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;">
        <div class='lds-dual-ring' style='margin-bottom:12px;'></div>
        <div style='color:#006600;font-weight:600;'>Loading verification details...</div>
    </div>`;
    document.body.appendChild(spinner);
    // Add spinner CSS if not present
    if (!document.getElementById('lds-dual-ring-style')) {
        const style = document.createElement('style');
        style.id = 'lds-dual-ring-style';
        style.innerHTML = `.lds-dual-ring {display: inline-block;width: 48px;height: 48px;}
        .lds-dual-ring:after {content: " ";display: block;width: 32px;height: 32px;margin: 8px;border-radius: 50%;border: 4px solid #006600;border-color: #006600 transparent #006600 transparent;animation: lds-dual-ring 1.2s linear infinite;}
        @keyframes lds-dual-ring {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}`;
        document.head.appendChild(style);
    }
    try {
        // Fetch the recovered_reports row for this lost report
        const { data: rec } = await supabase.from('recovered_reports').select('*').or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`).maybeSingle();
        if (!rec) {
            document.getElementById('verificationSpinner')?.remove();
            notificationManager.error('No matching recovered record found');
            return;
        }
        // Determine the found report (the one that is not the lost report)
        const foundReportId = rec.lost_report_id === reportId ? rec.found_report_id : rec.lost_report_id;
        // Fetch the found report and its document
        const { data: foundReport } = await supabase.from('reports').select('*, report_documents(*)').eq('id', foundReportId).maybeSingle();
        let doc = null;
        if (foundReport && foundReport.report_documents && foundReport.report_documents.length > 0) {
            doc = foundReport.report_documents[0];
        }
        const docType = doc ? getReadableDocType(doc.document_type) : 'Unknown Document';
        const docNumber = doc && doc.document_number ? doc.document_number : 'N/A';
        const foundDocImage = doc && doc.photo_url ? doc.photo_url : null;
        // Modal content
        let modalContent = `<div style='display:flex;flex-direction:column;align-items:center;'>`;
        if (foundDocImage) {
            modalContent += `
                <a href='${foundDocImage}' target='_blank' rel='noopener noreferrer' style='margin-bottom:12px;'>
                    <img src='${foundDocImage}' alt='Uploaded document for verification: Type ${docType}, Number ${docNumber}' style='width:260px;height:180px;object-fit:cover;border:2px solid #BB0000;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);margin-bottom:8px;cursor:zoom-in;'>
                </a>
                <div style='font-size:0.95em;color:#555;margin-bottom:8px;'>Click image to view full size</div>
            `;
        } else {
            modalContent += `<div style='color:#BB0000;margin-bottom:12px;'>No image available for this document.</div>`;
        }
        modalContent += `
            <div style='margin-bottom:12px;font-size:1.1em;'><strong>Type:</strong> ${docType}<br><strong>Number:</strong> ${docNumber}</div>
            <div style='color:#BB0000;font-weight:600;margin-bottom:18px;'>Is this your document? Please verify carefully before confirming.</div>
        </div>`;
        document.getElementById('verificationSpinner')?.remove();
        showModal({
            title: 'Verify Document',
            image: null,
            content: modalContent,
            actions: [
                {
                    label: 'Yes, Verify',
                    style: 'background: #006600; color: white; padding: 10px 20px; border-radius: 6px; font-weight: 600;',
                    onClick: () => { window.verifyDocuments(reportId); document.getElementById('customModal')?.remove(); }
                },
                {
                    label: 'Cancel',
                    style: 'background: #BB0000; color: white; padding: 10px 20px; border-radius: 6px; font-weight: 600;',
                    onClick: () => document.getElementById('customModal')?.remove()
                }
            ]
        });
    } catch (error) {
        document.getElementById('verificationSpinner')?.remove();
        notificationManager.error('Error loading verification details');
    }
};

// Add this near the top with other helper functions
async function refreshPaymentSection() {
  if (document.getElementById('payments-section') && document.getElementById('payments-section').style.display !== 'none') {
    if (window.renderPaymentTable) {
      await window.renderPaymentTable();
    }
  }
}

// Function to create missing transactions for existing matches
window.createMissingTransactions = async function() {
  try {
    console.log('🔍 Creating missing transactions for existing matches...');
    
    // Get all recovered_reports that don't have corresponding transactions
    const { data: recoveredReports, error } = await supabase
      .from('recovered_reports')
      .select('*, lost_report:lost_report_id(*), found_report:found_report_id(*)')
      .eq('status', 'recovered');
    
    if (error) {
      console.error('Error fetching recovered reports:', error);
      return;
    }
    
    console.log(`Found ${recoveredReports.length} recovered reports to process`);
    
    for (const recovered of recoveredReports) {
      // Check if transactions already exist for these reports
      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('*')
        .or(`report_id.eq.${recovered.lost_report_id},report_id.eq.${recovered.found_report_id}`);
      
      if (existingTransactions && existingTransactions.length > 0) {
        console.log(`Transactions already exist for recovered report ${recovered.id}`);
        continue;
      }
      
      // Create missing transactions
      const recoveryFee = recovered.lost_report?.recovery_fee || 200;
      const rewardAmount = recovered.found_report?.reward_amount || 100;
      
      const recoveryTxData = {
        report_id: recovered.lost_report_id,
        transaction_type: 'recovery',
        amount: recoveryFee,
        status: 'pending',
        user_id: recovered.lost_report.user_id,
        phone_number: '',
        provider: '',
        notes: `Recovery fee for document`
      };
      
      const rewardTxData = {
        report_id: recovered.found_report_id,
        transaction_type: 'reward',
        amount: rewardAmount,
        status: 'pending',
        user_id: recovered.found_report.user_id,
        phone_number: '',
        provider: '',
        notes: `Reward for finding document`
      };
      
      console.log('Creating transactions for:', recoveryTxData, rewardTxData);
      
      const { error: txError } = await supabase.rpc('create_match_transactions', {
        recovery_data: recoveryTxData,
        reward_data: rewardTxData
      });
      
      if (txError) {
        console.error('Error creating transactions:', txError);
      } else {
        console.log('✅ Transactions created successfully for recovered report', recovered.id);
      }
    }
    
    console.log('🎉 Finished creating missing transactions');
    refreshPaymentSection();
    
  } catch (error) {
    console.error('Error in createMissingTransactions:', error);
  }
};

// Global function to force complete matching and transaction creation
window.forceCompleteMatching = async function() {
  try {
    console.log('🚀 Force running complete matching and transaction creation...');
    
    // First run automated matching
    if (typeof window.runAutomatedMatching === 'function') {
      await window.runAutomatedMatching();
    }
    
    // Then create any missing transactions
    if (typeof window.createMissingTransactions === 'function') {
      await window.createMissingTransactions();
    }
    
    // Refresh the payment section
    refreshPaymentSection();
    
    console.log('✅ Force complete matching finished');
    
  } catch (error) {
    console.error('❌ Error in forceCompleteMatching:', error);
  }
};

// Debug function to check the state of matches and transactions
window.debugMatchingState = async function() {
  try {
    console.log('🔍 === DEBUGGING MATCHING STATE ===');
    
    // Check all recovered reports
    const { data: recoveredReports, error: recoveredError } = await supabase
      .from('recovered_reports')
      .select('*, lost_report:lost_report_id(*), found_report:found_report_id(*)')
      .eq('status', 'recovered');
    
    if (recoveredError) {
      console.error('Error fetching recovered reports:', recoveredError);
      return;
    }
    
    console.log(`📊 Found ${recoveredReports.length} recovered reports`);
    
    for (const recovered of recoveredReports) {
      console.log(`\n📋 Recovered Report ID: ${recovered.id}`);
      console.log(`   Lost Report: ${recovered.lost_report_id}`);
      console.log(`   Found Report: ${recovered.found_report_id}`);
      
      // Check transactions for this match
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .or(`report_id.eq.${recovered.lost_report_id},report_id.eq.${recovered.found_report_id}`);
      
      if (transactions && transactions.length > 0) {
        console.log(`   ✅ Has ${transactions.length} transactions`);
        transactions.forEach(tx => {
          console.log(`      - ${tx.transaction_type}: ${tx.amount} (${tx.status})`);
        });
      } else {
        console.log(`   ❌ Missing transactions`);
      }
    }
    
    console.log('\n🔍 === END DEBUGGING ===');
    
  } catch (error) {
    console.error('❌ Error in debugMatchingState:', error);
  }
};

// Function to remove duplicate transactions
window.removeDuplicateTransactions = async function() {
  try {
    console.log('🧹 === REMOVING DUPLICATE TRANSACTIONS ===');
    
    // Get all transactions
    const { data: allTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }
    
    console.log(`📊 Found ${allTransactions.length} total transactions`);
    
    // Group transactions by report_id and transaction_type
    const transactionGroups = {};
    allTransactions.forEach(tx => {
      const key = `${tx.report_id}_${tx.transaction_type}`;
      if (!transactionGroups[key]) {
        transactionGroups[key] = [];
      }
      transactionGroups[key].push(tx);
    });
    
    // Find and remove duplicates
    let duplicatesRemoved = 0;
    for (const [key, transactions] of Object.entries(transactionGroups)) {
      if (transactions.length > 1) {
        console.log(`🔍 Found ${transactions.length} transactions for ${key}`);
        
        // Keep the first (most recent) transaction, delete the rest
        const toDelete = transactions.slice(1);
        for (const duplicate of toDelete) {
          console.log(`🗑️ Deleting duplicate transaction: ${duplicate.id}`);
          const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', duplicate.id);
          
          if (deleteError) {
            console.error(`❌ Error deleting duplicate:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    console.log(`✅ Removed ${duplicatesRemoved} duplicate transactions`);
    console.log('🔄 Refreshing payment section...');
    
    // Refresh the payment section
    refreshPaymentSection();
    
    console.log('🧹 === END DUPLICATE REMOVAL ===');
    
  } catch (error) {
    console.error('❌ Error in removeDuplicateTransactions:', error);
  }
};

// Add real-time subscriptions for transactions and reports
async function setupRealtimeSubscriptions() {
  if (!window.currentUser) return;
  
  // Subscribe to transaction changes
  const transactionsChannel = supabase
    .channel('transactions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${window.currentUser.id}`
      },
      (payload) => {
        console.log('Transaction change:', payload);
        refreshPaymentSection();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
      }
    )
    .subscribe();
  
  // Subscribe to report changes to trigger automated matching
  const reportsChannel = supabase
    .channel('reports_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reports'
      },
      async (payload) => {
        console.log('New report added:', payload);
        // Run automated matching when a new report is added
        if (typeof window.runAutomatedMatching === 'function') {
          console.log('🔍 Running automated matching due to new report...');
          await window.runAutomatedMatching();
        }
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(transactionsChannel);
    supabase.removeChannel(reportsChannel);
  };
}

// Function to clear all data for fresh testing
window.clearAllData = async function() {
  try {
    console.log('🗑️ === CLEARING ALL DATA FOR FRESH TESTING ===');
    
    // Confirm with user
    const confirmed = confirm('⚠️ WARNING: This will delete ALL data from all tables!\n\nThis includes:\n- All reports (lost and found)\n- All report documents\n- All recovered reports\n- All transactions\n- All notifications\n\nAre you sure you want to continue?');
    
    if (!confirmed) {
      console.log('❌ Data clearing cancelled by user');
      return;
    }
    
    console.log('🔄 Starting data deletion...');
    
    // Delete in the correct order to avoid foreign key constraints
    const tablesToDelete = [
      'transactions',
      'recovered_reports', 
      'report_documents',
      'reports',
      'notifications'
    ];
    
    for (const table of tablesToDelete) {
      try {
        console.log(`🗑️ Deleting from ${table}...`);
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
          console.error(`❌ Error deleting from ${table}:`, error);
        } else {
          console.log(`✅ Successfully cleared ${table}`);
        }
      } catch (tableError) {
        console.error(`❌ Exception deleting from ${table}:`, tableError);
      }
    }
    
    console.log('🎉 All data cleared successfully!');
    console.log('🔄 Refreshing dashboard...');
    
    // Refresh the dashboard
    if (typeof window.populateMyReportsSection === 'function') {
      window.populateMyReportsSection('all');
    }
    
    // Refresh payment section
    refreshPaymentSection();
    
    // Show success notification
    notificationManager.success('All data cleared successfully! You can now test fresh.');
    
  } catch (error) {
    console.error('❌ Error in clearAllData:', error);
    notificationManager.error('Error clearing data: ' + error.message);
  }
};

// Function to check current data counts
window.checkDataCounts = async function() {
  try {
    console.log('📊 === CHECKING CURRENT DATA COUNTS ===');
    
    const tables = ['reports', 'report_documents', 'recovered_reports', 'transactions', 'notifications'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Error counting ${table}:`, error);
        } else {
          console.log(`📊 ${table}: ${count} records`);
        }
      } catch (tableError) {
        console.error(`❌ Exception counting ${table}:`, tableError);
      }
    }
    
    console.log('📊 === END DATA COUNT CHECK ===');
    
  } catch (error) {
    console.error('❌ Error in checkDataCounts:', error);
  }
};

// Polished Image Viewer Popup
window.openImageViewer = function(imageUrl, documentType) {
    // Remove existing viewer if any
    const existingViewer = document.getElementById('imageViewerModal');
    if (existingViewer) existingViewer.remove();
    
    const modal = document.createElement('div');
    modal.id = 'imageViewerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-in-out;
    `;
    
    modal.innerHTML = `
        <div style="
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease-out;
        ">
            <!-- Close Button -->
            <button onclick="document.getElementById('imageViewerModal').remove()" style="
                position: absolute;
                top: 16px;
                right: 16px;
                background: rgba(255, 255, 255, 0.95);
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: #333;
                z-index: 10001;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            " onmouseover="this.style.background='white';this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.95)';this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.15)'">
                <i class="fas fa-times"></i>
            </button>
            
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 24px;
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <i class="fas fa-image" style="font-size: 20px;"></i>
                <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${documentType}</h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Document Image</p>
                </div>
            </div>
            
            <!-- Image Container -->
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f5f5f5;
                padding: 20px;
                max-height: calc(90vh - 120px);
                overflow: auto;
            ">
                <img src="${imageUrl}" alt="${documentType}" style="
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 8px;
                    object-fit: contain;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                " onerror="this.parentElement.innerHTML='<div style=\"text-align:center;color:#999;padding:40px;\"><i class=\"fas fa-exclamation-circle\" style=\"font-size:48px;margin-bottom:16px;display:block;\"></i><p>Failed to load image</p></div>'">
            </div>
            
            <!-- Footer -->
            <div style="
                background: #f9f9f9;
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid #e5e7eb;
            ">
                <p style="margin: 0; color: #666; font-size: 13px;">
                    <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
                    Click the X button or press ESC to close
                </p>
                <a href="${imageUrl}" target="_blank" download style="
                    background: #3b82f6;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on ESC key
    const closeOnEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
};

/**
 * Claim reward for found document (Found Owner)
 */
window.claimReward = async function(reportId) {
    try {
        console.log('🎁 Starting reward claim for report:', reportId);

        // 1. Get the recovered report to find the finder
        const { data: recovered } = await supabase
            .from('recovered_reports')
            .select('*')
            .or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`)
            .maybeSingle();

        if (!recovered) throw new Error('No matching recovered record found');

        // 2. Update the recovered_report status to indicate reward claimed
        // Note: reward_claimed column may need to be added to the table
        const updateData = { status: 'reward_claimed' };

        // Try to update reward_claimed if the column exists
        try {
            const { error: testError } = await supabase
                .from('recovered_reports')
                .select('reward_claimed')
                .eq('id', recovered.id)
                .limit(1);

            if (!testError) {
                updateData.reward_claimed = true;
            }
        } catch (e) {
            console.log('reward_claimed column not available, skipping');
        }

        const { error: updateError } = await supabase
            .from('recovered_reports')
            .update(updateData)
            .eq('id', recovered.id);

        if (updateError) throw updateError;

        // 3. Update the transaction status to 'claimed'
        const { error: txError } = await supabase
            .from('transactions')
            .update({ status: 'claimed' })
            .eq('report_id', reportId)
            .eq('transaction_type', 'reward');

        if (txError) {
            console.warn('Transaction status update failed, but continuing:', txError);
        }

        // 4. Get the finder's details for notification
        const { data: foundReport } = await supabase
            .from('reports')
            .select('user_id, reward_amount, document_type')
            .eq('id', recovered.found_report_id)
            .single();

        // 5. Send final notification to the finder
        if (foundReport) {
            await UnifiedNotificationSystem.createNotification(
                foundReport.user_id,
                `✨ Reward of KES ${foundReport.reward_amount} claimed successfully! Funds will be sent to your phone within 24 hours.`,
                {
                    type: 'success',
                    reportId: recovered.found_report_id
                }
            );
        }

        console.log('✅ Reward claimed successfully for report:', reportId);
        notificationManager.success('Reward claimed! Funds will be sent to your phone within 24 hours.');
        populateMyReportsSection('recovered');
        await updateRecoveredCount();
        closeModal();

    } catch (error) {
        console.error('❌ Error claiming reward:', error);
        notificationManager.error('Failed to claim reward: ' + error.message);
    }
};

/**
 * Show claim reward modal
 */
window.showClaimRewardModal = function(reportId, rewardAmount) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.innerHTML = `
        <div class="custom-modal">
            <div class="custom-modal-header">
                <h3>🎉 Claim Your Reward</h3>
                <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()">&times;</button>
            </div>
            <div class="custom-modal-body">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">💰</div>
                    <h4 style="color: #10b981; margin-bottom: 10px;">KES ${rewardAmount}</h4>
                    <p style="margin-bottom: 20px;">Congratulations! Your reward is ready to be claimed.</p>
                    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
                        Funds will be sent to your registered phone number within 24 hours after claiming.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="window.claimReward('${reportId}'); this.closest('.custom-modal-overlay').remove();"
                                class="btn btn-success" style="padding: 12px 24px;">
                            ✅ Claim Reward
                        </button>
                        <button onclick="this.closest('.custom-modal-overlay').remove()"
                                class="btn btn-secondary" style="padding: 12px 24px;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// Add animations
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .view-image-btn:hover {
        background: #2563eb !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
    }
`;
document.head.appendChild(animationStyle);
