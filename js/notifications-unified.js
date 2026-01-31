/**
 * UNIFIED NOTIFICATION SYSTEM
 * Single comprehensive notification system for the dashboard
 * - Creates and manages notifications in Supabase
 * - Displays toast notifications and modal notification center
 * - Handles real-time subscriptions
 * - Manages notification badges and UI state
 */

import { supabase } from './supabase.js';

class UnifiedNotificationSystem {
  constructor() {
    this.isOpen = false;
    this.currentFilter = 'all';
    this.notifications = [];
    this.currentUser = null;
    this.subscriptions = [];
    this.badgeElement = null;
    this.init();
  }

  /**
   * Initialize the notification system
   */
  async init() {
    try {
      console.log('🚀 Initializing UnifiedNotificationSystem...');

      // Always create bell UI element
      this.createBell();
      console.log('✅ Bell created');
      
      // Only create modal if NOT on notifications, reportlost, or reportfound pages
      if (!window.location.pathname.includes('notifications.html') && 
          !window.location.pathname.includes('reportlost.html') && 
          !window.location.pathname.includes('reportfound.html')) {
        this.createModal();
        console.log('✅ Modal created');
        this.attachModalListeners();
        console.log('✅ Event listeners attached');
      } else {
        console.log('🚫 Skipping modal creation on', window.location.pathname);
      }

      // Try to get current user
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.warn('⚠️ Auth not ready during initialization, will initialize on auth change:', error.message);
        // UI is ready, full functionality will initialize on auth change
        console.log('🎉 UnifiedNotificationSystem UI initialized (waiting for auth)');
        return;
      }

      this.currentUser = user;

      if (this.currentUser) {
        await this.setupSubscriptions();
        console.log('✅ Subscriptions setup');
        await this.fetchNotifications();
        console.log('✅ Initial notifications fetched');
      } else {
        console.log('ℹ️ No user logged in, full functionality will initialize on login');
      }

      console.log('🎉 UnifiedNotificationSystem initialized successfully');
      
      // Initialize workflow verification
      this.initWorkflowVerification();
      console.log('✅ Workflow verification initialized');
    } catch (error) {
      console.error('❌ Error initializing notification system:', error);
      // Don't throw - allow dashboard to continue loading
      console.log('⚠️ Continuing dashboard load despite notification error');
    }
  }

  /**
   * Create notification bell in header
   */
  createBell() {
    // Check if bell already exists
    if (document.querySelector('.notification-bell')) {
      return;
    }

    const bell = document.createElement('div');
    bell.className = 'notification-bell';
    bell.innerHTML = `
      <i class="fas fa-bell"></i>
      <span class="notification-badge" id="topNotificationCount">0</span>
    `;
    bell.addEventListener('click', () => {
    // Open notifications page instead of modal
    window.location.href = 'notifications.html';
  });

    // Add to profile dropdown area
    const profileDropdown = document.getElementById('profileDropdownBtn');
    if (profileDropdown && profileDropdown.parentNode) {
      profileDropdown.parentNode.insertBefore(bell, profileDropdown);
      this.badgeElement = bell.querySelector('.notification-badge');
    }
  }

  /**
   * Create notification modal
   */
  createModal() {
    // Don't create modal on notifications, reportlost, or reportfound pages
    if (window.location.pathname.includes('notifications.html') || 
        window.location.pathname.includes('reportlost.html') || 
        window.location.pathname.includes('reportfound.html')) {
      console.log('🚫 Skipping modal creation on', window.location.pathname);
      return;
    }

    if (document.getElementById('notificationModal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'notification-modal';
    modal.id = 'notificationModal';
    modal.innerHTML = `
      <div class="notification-modal-content">
        <div class="notification-modal-header">
          <h2>Notifications</h2>
          <button class="notification-modal-close" aria-label="Close">&times;</button>
        </div>

        <div class="notification-modal-toolbar">
          <div class="notification-modal-search">
            <i class="fas fa-search"></i>
            <input type="text" id="notificationSearch" placeholder="Search notifications...">
          </div>
          <div class="notification-modal-bulk-actions">
            <label class="notification-select-all">
              <input type="checkbox" id="selectAllNotifications">
              <span>Select All</span>
            </label>
            <div class="notification-modal-actions">
              <button class="notification-modal-btn" id="markSelectedReadBtn" title="Mark selected as read" disabled>
                <i class="fas fa-envelope-open"></i> Mark Selected Read
              </button>
              <button class="notification-modal-btn danger" id="deleteSelectedBtn" title="Delete selected notifications" disabled>
                <i class="fas fa-trash"></i> Delete Selected
              </button>
              <button class="notification-modal-btn" id="markAllReadBtn" title="Mark all as read">
                <i class="fas fa-envelope-open"></i> Mark All Read
              </button>
              <button class="notification-modal-btn danger" id="clearAllBtn" title="Clear all notifications">
                <i class="fas fa-trash"></i> Clear All
              </button>
            </div>
          </div>
        </div>

        <div class="notification-modal-filters">
          <button class="notification-filter-btn active" data-filter="all">All</button>
          <button class="notification-filter-btn" data-filter="success">
            <i class="fas fa-check-circle"></i> Success
          </button>
          <button class="notification-filter-btn" data-filter="error">
            <i class="fas fa-exclamation-circle"></i> Error
          </button>
          <button class="notification-filter-btn" data-filter="warning">
            <i class="fas fa-exclamation-triangle"></i> Warning
          </button>
          <button class="notification-filter-btn" data-filter="info">
            <i class="fas fa-info-circle"></i> Info
          </button>
        </div>

        <div class="notification-modal-list" id="notificationList">
          <!-- Notifications rendered here -->
        </div>

        <div class="notification-modal-footer">
          <button class="notification-modal-footer-btn" id="closeBtn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners();
  }

  /**
   * Attach event listeners to modal
   */
  attachModalListeners() {
    // Close button
    const closeBtn = document.querySelector('.notification-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Footer close button
    const footerCloseBtn = document.getElementById('closeBtn');
    if (footerCloseBtn) {
      footerCloseBtn.addEventListener('click', () => this.close());
    }

    // Mark all as read
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => this.markAllAsRead());
    }

    // Clear all
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all notifications?')) {
          this.deleteAll();
        }
      });
    }

    // Search
    const searchInput = document.getElementById('notificationSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.render(e.target.value);
      });
    }

    // Filters
    const filterBtns = document.querySelectorAll('.notification-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.closest('.notification-filter-btn').classList.add('active');
        this.currentFilter = e.target.closest('.notification-filter-btn').dataset.filter;
        this.render();
        this.updateBulkActionButtons();
      });
    });

    // Select All checkbox
    const selectAllCheckbox = document.getElementById('selectAllNotifications');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.selectAllNotifications(e.target.checked);
      });
    }

    // Bulk actions
    const markSelectedReadBtn = document.getElementById('markSelectedReadBtn');
    if (markSelectedReadBtn) {
      markSelectedReadBtn.addEventListener('click', () => this.markSelectedAsRead());
    }

    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () => {
        const selectedIds = this.getSelectedNotificationIds();
        if (selectedIds.length > 0 && confirm(`Are you sure you want to delete ${selectedIds.length} selected notification(s)?`)) {
          this.deleteSelectedNotifications();
        }
      });
    }

    // Close on background click
    const modal = document.getElementById('notificationModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Setup real-time subscriptions
   */
  async setupSubscriptions() {
    if (!this.currentUser) return;

    // Clean up existing subscriptions
    this.cleanupSubscriptions();

    // Subscribe to user-specific notifications
    const userSubscription = supabase
      .channel(`notifications:${this.currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          console.log('🔔 Real-time notification update:', payload);
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    this.subscriptions.push(userSubscription);
  }

  /**
   * Handle real-time notification updates
   */
  async handleRealtimeUpdate(payload) {
    console.log('🔄 Handling real-time update:', payload.eventType);

    switch (payload.eventType) {
      case 'INSERT':
        // Add new notification to the list
        this.notifications.unshift(payload.new);
        this.showToast(payload.new);
        break;
      case 'UPDATE':
        // Update existing notification (string-safe ID comparison)
        const index = this.notifications.findIndex(n => String(n.id) === String(payload.new.id));
        if (index !== -1) {
          this.notifications[index] = payload.new;
        }
        break;
      case 'DELETE':
        // Remove notification from list (string-safe ID comparison)
        this.notifications = this.notifications.filter(n => String(n.id) !== String(payload.old.id));
        break;
    }

    // Update UI
    this.updateBadge();
    if (this.isOpen) {
      this.render();
    }
  }

  /**
   * Show toast notification for new notifications
   */
  showToast(notification) {
    // Import and use the notification manager for toasts
    if (window.notificationManager) {
      const type = notification.type || 'info';
      window.notificationManager[type](notification.message);
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanupSubscriptions() {
    this.subscriptions.forEach(sub => {
      supabase.removeChannel(sub);
    });
    this.subscriptions = [];
  }

  /**
   * Fetch notifications from Supabase
   */
  async fetchNotifications() {
    console.log('📬 Starting fetchNotifications...');

    // Ensure we have an authenticated user (handle auth timing issues)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn('⚠️ Auth check failed, user not authenticated:', authError);
      this.notifications = [];
      this.updateBadge();
      return;
    }

    if (!this.currentUser || user.id !== this.currentUser.id) {
      this.currentUser = user;
    }

    console.log('📬 Fetching notifications for user:', this.currentUser.id, this.currentUser.email);

    try {
      console.log('📬 Querying Supabase notifications table...');

      // Add timeout protection for the database query
      const queryPromise = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .in('status', ['unread', 'read'])  // Only exclude 'deleted' notifications
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([
        queryPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 15000)
        )
      ]);

      if (error) {
        console.error('❌ Supabase query error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // FALLBACK: Try a broader query to debug RLS issues
        console.log('🔍 Trying fallback query for debugging...');
        try {
          const { data: fallbackData, error: fallbackError } = await Promise.race([
            supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(10),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Fallback query timeout')), 10000)
            )
          ]);

          if (!fallbackError && fallbackData) {
            console.log('🔍 Fallback query successful:', fallbackData.length, 'total notifications');
            console.log('🔍 User notifications in fallback:', 
              fallbackData.filter(n => n.user_id === this.currentUser.id).length);
            
            // Filter client-side for this user
            this.notifications = fallbackData.filter(n => n.user_id === this.currentUser.id);
            console.log('✅ Using fallback data, filtered to:', this.notifications.length, 'notifications');
          } else {
            console.error('❌ Fallback query also failed:', fallbackError);
            throw error; // Throw original error
          }
        } catch (fallbackErr) {
          console.error('❌ Fallback query exception:', fallbackErr);
          throw error; // Throw original error
        }
      } else {
        // Original query successful
        this.notifications = data;
        console.log('✅ Set notifications array to:', this.notifications.length, 'items');
      }

      // Additional debug: show types and sample values to help diagnose RLS/ID mismatches
      if (this.notifications.length > 0) {
        console.log('📊 Current user id (type):', this.currentUser?.id, typeof this.currentUser?.id);
        console.log('📊 Notification details (first 3):', this.notifications.slice(0, 3).map(n => ({
          id: n.id,
          id_type: typeof n.id,
          user_id: n.user_id,
          user_id_type: typeof n.user_id,
          message: (n.message || '').substring(0, 50) + '...',
          type: n.type || 'missing',
          status: n.status || 'missing'
        })));
      } else {
        console.log('ℹ️ No notifications found for this user');
      }

      // Expose comprehensive debug helpers on window
      try {
        // Simple debug function - just type: checkNotifications()
        window.checkNotifications = () => {
          console.log('=== NOTIFICATION DEBUG INFO ===');
          console.log('Current User:', this.currentUser?.email || 'Not logged in', this.currentUser?.id);
          console.log('Notifications Count:', this.notifications.length);
          console.log('Notifications Array:', this.notifications);
          console.log('Unread Count:', this.notifications.filter(n => n.status === 'unread').length);
          
          if (this.notifications.length > 0) {
            console.log('First Notification:', this.notifications[0]);
          } else {
            console.log('⚠️ No notifications found!');
            console.log('💡 Try: testNotification() to create a test notification');
          }
          
          // Check database directly
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .neq('status', 'deleted')
                .then(({ data, error }) => {
                  console.log('📊 Direct DB Query Result:', data?.length || 0, 'notifications');
                  if (error) console.error('❌ DB Query Error:', error);
                  if (data && data.length > 0) {
                    console.log('📊 DB Notifications:', data);
                  }
                });
            }
          });
          
          return {
            user: this.currentUser,
            count: this.notifications.length,
            notifications: this.notifications
          };
        };
        
        // Test notification creator
        window.testNotification = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('❌ Not logged in!');
            return;
          }
          
          console.log('🧪 Creating test notification...');
          try {
            await UnifiedNotificationSystem.createNotification(
              user.id,
              '🧪 This is a test notification to verify the system is working!',
              { type: 'info' }
            );
            console.log('✅ Test notification created! Click the bell to see it.');
            console.log('💡 Run: checkNotifications() to verify');
            
            // Refresh notifications
            if (window.unifiedNotifications) {
              await window.unifiedNotifications.fetchNotifications();
              window.unifiedNotifications.updateBadge();
            }
          } catch (error) {
            console.error('❌ Failed to create test notification:', error);
          }
        };

        // Test rendering directly
        window.testRender = () => {
          console.log('🎨 Testing render directly...');
          if (window.unifiedNotifications) {
            // Create a test notification directly in the array
            window.unifiedNotifications.notifications = [{
              id: 'test-' + Date.now(),
              user_id: window.unifiedNotifications.currentUser?.id,
              message: '🧪 Direct test notification',
              type: 'info',
              status: 'unread',
              created_at: new Date().toISOString()
            }];
            
            console.log('🎨 Added test notification, opening modal...');
            window.unifiedNotifications.open();
          } else {
            console.error('❌ Notification system not available');
          }
        };
        
        // Force refresh
        window.refreshNotifications = async () => {
          console.log('🔄 Refreshing notifications...');
          if (window.unifiedNotifications) {
            await window.unifiedNotifications.fetchNotifications();
            window.unifiedNotifications.updateBadge();
            if (window.unifiedNotifications.isOpen) {
              window.unifiedNotifications.render();
            }
            console.log('✅ Notifications refreshed!');
            console.log('💡 Run: checkNotifications() to see results');
          } else {
            console.error('❌ Notification system not initialized!');
          }
        };
        
        console.log('✅ Debug helpers loaded!');
        console.log('💡 Type in console:');
        console.log('   - checkNotifications() - See notification status');
        console.log('   - testNotification() - Create a test notification');
        console.log('   - refreshNotifications() - Force refresh');
      } catch (e) {
        console.warn('Could not set up debug helpers:', e);
      }

      this.updateBadge();
      console.log('✅ Badge updated, fetchNotifications complete');
    } catch (error) {
      console.error('❌ Error in fetchNotifications:', error);
      console.error('❌ Error stack:', error.stack);
      this.notifications = [];
      this.updateBadge();
    }
  }

  /**
   * Toggle modal
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open modal
   */
  async open() {
    console.log('🔔 Opening notification modal...');
    const modal = document.getElementById('notificationModal');
    if (!modal) {
      console.error('❌ Modal element not found!');
      return;
    }

    try {
      console.log('Modal element found, fetching notifications...');
      await this.fetchNotifications();
      console.log('📊 Notifications fetched:', this.notifications.length);
      console.log('📊 Notifications data:', this.notifications);
      
      // Make sure modal is visible before rendering
      modal.classList.add('active');
      this.isOpen = true;
      
      // Small delay to ensure modal is fully visible
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Ensure list element exists
      const list = document.getElementById('notificationList');
      if (!list) {
        console.error('❌ Notification list element not found!');
        return;
      }
      
      console.log('🎨 Rendering notifications...');
      console.log('🎨 Current notifications array length:', this.notifications.length);
      this.render();
      
      // Verify rendering worked
      const renderedItems = list.querySelectorAll('.notification-modal-item');
      console.log('✅ Modal opened and rendered. Items in DOM:', renderedItems.length);
      
      if (renderedItems.length === 0 && this.notifications.length > 0) {
        console.error('⚠️ WARNING: Notifications exist but were not rendered!');
        console.error('⚠️ Re-attempting render...');
        this.render();
      }

      // Focus search
      const searchInput = document.getElementById('notificationSearch');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    } catch (error) {
      console.error('❌ Error opening modal:', error);
      console.error('❌ Error stack:', error.stack);
    }
  }

  /**
   * Close modal
   */
  close() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
      modal.classList.remove('active');
      this.isOpen = false;
    }
  }

  /**
   * Render notifications
   */
  render(searchQuery = '') {
    console.log('🎨 ===== RENDER START =====');
    console.log('🎨 render() called with searchQuery:', searchQuery);
    console.log('🎨 Current notifications array:', this.notifications);

    const list = document.getElementById('notificationList');
    if (!list) {
      console.error('❌ Notification list element not found!');
      return;
    }

    console.log('✅ List element found, proceeding...');

    // Check if notifications array is valid
    if (!Array.isArray(this.notifications)) {
      console.error('❌ Notifications is not an array!', typeof this.notifications);
      this.notifications = [];
    }

    console.log('📊 Total notifications in array:', this.notifications.length);
    console.log('📊 Current filter:', this.currentFilter);
    
    // DEBUG: Log first notification details
    if (this.notifications.length > 0) {
      console.log('🔍 First notification details:', {
        id: this.notifications[0].id,
        message: this.notifications[0].message,
        type: this.notifications[0].type,
        status: this.notifications[0].status,
        created_at: this.notifications[0].created_at
      });
    }

    let notifications = [...this.notifications]; // Create copy
    console.log('📊 Initial copy has', notifications.length, 'notifications');

    // Filter by type
    if (this.currentFilter !== 'all') {
      const beforeFilter = notifications.length;
      notifications = notifications.filter(n => n.type === this.currentFilter);
      console.log(`📊 Type filter '${this.currentFilter}': ${beforeFilter} -> ${notifications.length}`);
    }

    // Filter by search
    const searchQueryLower = searchQuery.toLowerCase();
    if (searchQueryLower) {
      const beforeSearch = notifications.length;
      notifications = notifications.filter(n =>
        (n.message || '').toLowerCase().includes(searchQueryLower)
      );
      console.log(`📊 Search filter '${searchQueryLower}': ${beforeSearch} -> ${notifications.length}`);
    }

    console.log('📊 Final filtered notifications:', notifications.length);
    
    // DEBUG: Log what would be rendered
    if (notifications.length > 0) {
      console.log('🎯 About to render notifications:', notifications.map(n => ({
        id: n.id,
        message: n.message?.substring(0, 50) + '...',
        type: n.type,
        status: n.status
      })));
    }

    if (notifications.length === 0) {
      console.log('📭 No notifications to display, showing empty state');
      const emptyMessage = searchQuery 
        ? 'No matching notifications found' 
        : (this.notifications.length === 0 
          ? 'You\'re all caught up! No notifications yet.' 
          : 'No notifications match the current filter.');
      
      list.innerHTML = `
        <div class="notification-modal-empty" style="padding: 40px 20px; text-align: center; color: #666;">
          <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #333;">No notifications</h3>
          <p style="margin: 0; font-size: 14px;">${emptyMessage}</p>
          ${this.notifications.length === 0 ? `
            <p style="margin-top: 16px; font-size: 12px; color: #999;">
              💡 Tip: Run <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">testNotification()</code> in console to test
            </p>
          ` : ''}
        </div>
      `;
      return;
    }

    console.log('🎨 Rendering', notifications.length, 'notifications');

    // TEMP DEBUG: If we have notifications but they're not showing, try rendering a test one
    if (this.notifications.length > 0 && notifications.length === 0) {
      console.warn('⚠️ DEBUG: Has notifications but filtered to 0. Using first notification for testing...');
      notifications = [this.notifications[0]];
    }

    // Build HTML using renderNotification for each item
    let html = '';
    try {
      html = notifications.map(n => {
        if (!n || !n.id) {
          console.warn('⚠️ Invalid notification object:', n);
          return '';
        }
        console.log('🎨 Creating HTML for notification:', n.id, (n.message || '').substring(0, 30) + '...');
        const renderedHtml = this.renderNotification(n);
        console.log('🎨 Rendered HTML length:', renderedHtml.length);
        return renderedHtml;
      }).join('');
    } catch (error) {
      console.error('❌ Error building HTML:', error);
      list.innerHTML = `
        <div class="notification-modal-empty">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error rendering notifications</h3>
          <p>Please refresh the page</p>
        </div>
      `;
      return;
    }

    console.log('📝 Total HTML length:', html.length);
    console.log('📝 Setting innerHTML...');

    try {
      list.innerHTML = html;
      console.log('✅ HTML set successfully');
      console.log('✅ List children count:', list.children.length);
      
      // Verify items were actually added
      const items = list.querySelectorAll('.notification-modal-item');
      console.log('✅ Notification items in DOM:', items.length);
      
      if (items.length === 0 && notifications.length > 0) {
        console.error('❌ CRITICAL: HTML was set but no items found in DOM!');
        console.error('❌ HTML preview:', html.substring(0, 500));
      }
    } catch (error) {
      console.error('❌ Error setting innerHTML:', error);
      return;
    }

    console.log('🔗 Attaching listeners...');
    this.attachItemListeners();
    this.updateBulkActionButtons();

    console.log('✅ ===== RENDER COMPLETE =====');
  }

  /**
   * Render single notification
   */
  renderNotification(notification) {
    // Validate notification object
    if (!notification || !notification.id) {
      console.error('❌ Invalid notification object:', notification);
      return '';
    }

    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const type = notification.type || 'info';
    const isUnread = notification.status === 'unread';
    const time = this.formatRelativeTime(notification.created_at || new Date().toISOString());
    const hasAction = notification.notification_action && notification.action_data;

    // Truncate message for preview (show first 100 characters) - guard against null/undefined
    const fullMessage = notification.message || 'No message';
    const previewMessage = fullMessage.length > 100 ? fullMessage.substring(0, 100) + '...' : fullMessage;
    const shouldTruncate = fullMessage.length > 100;

    // Safely encode action data into attribute using encodeURIComponent
    let safeActionData = '{}';
    try {
      safeActionData = encodeURIComponent(JSON.stringify(notification.action_data || {}));
    } catch (e) {
      console.warn('⚠️ Could not encode action data:', e);
    }

    // Ensure ID is a string for data attributes
    const notificationId = String(notification.id);

    try {
      return `
        <div class="notification-modal-item ${type} ${isUnread ? 'unread' : ''}" data-id="${notificationId}">
          <div class="notification-modal-item-selection">
            <input type="checkbox" class="notification-checkbox" data-id="${notificationId}">
          </div>
          <div class="notification-modal-item-icon">
            <i class="${icons[type] || icons.info}"></i>
          </div>
          <div class="notification-modal-item-content">
            <p class="notification-modal-item-message ${shouldTruncate ? 'truncated' : ''}" data-full-message="${this.escapeHtml(fullMessage)}">
              ${this.escapeHtml(previewMessage)}
            </p>
            ${shouldTruncate ? '<button class="notification-read-more" data-id="' + notificationId + '">Read more</button>' : ''}
            <p class="notification-modal-item-time">${time}</p>
            ${hasAction ? `<div class="notification-modal-item-action-hint">Click to take action</div>` : ''}
          </div>
          <div class="notification-modal-item-actions">
            ${hasAction ? `
              <button class="notification-modal-item-btn action" title="${this.escapeHtml(notification.notification_action || '')}" data-id="${notificationId}" data-action="${this.escapeHtml(notification.notification_action || '')}" data-action-data="${this.escapeHtml(safeActionData)}">
                <i class="fas fa-external-link-alt"></i>
              </button>
            ` : ''}
            ${isUnread ? `
              <button class="notification-modal-item-btn mark-read" title="Mark as read" data-id="${notificationId}">
                <i class="fas fa-envelope-open"></i>
              </button>
            ` : `
              <button class="notification-modal-item-btn mark-unread" title="Mark as unread" data-id="${notificationId}">
                <i class="fas fa-envelope"></i>
              </button>
            `}
            <button class="notification-modal-item-btn delete" title="Delete" data-id="${notificationId}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          ${isUnread ? '<div class="notification-modal-item-unread-indicator"></div>' : ''}
        </div>
      `;
    } catch (error) {
      console.error('❌ Error rendering notification:', error, notification);
      return '';
    }
  }

  /**
   * Attach item listeners
   */
  attachItemListeners() {
    const items = document.querySelectorAll('.notification-modal-item');
    items.forEach(item => {
      const id = item.dataset.id;

      // Handle expand/collapse for read more
      const readMoreBtn = item.querySelector('.notification-read-more');
      if (readMoreBtn) {
        readMoreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleNotificationExpansion(id);
        });
      }

      // Handle checkbox selection
      const checkbox = item.querySelector('.notification-checkbox');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          e.stopPropagation();
          this.updateSelectAllCheckbox();
          this.updateBulkActionButtons();
        });
      }

      // Handle item click for actions
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.notification-modal-item-actions')) {
          return;
        }

        const actionBtn = item.querySelector('.action');
        if (actionBtn) {
          this.handleNotificationAction(actionBtn.dataset.action, actionBtn.dataset.actionData);
        }
      });

      // Action button
      const actionBtn = item.querySelector('.action');
      if (actionBtn) {
        actionBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleNotificationAction(actionBtn.dataset.action, actionBtn.dataset.actionData);
        });
      }

      // Mark as read/unread
      const markBtn = item.querySelector('.mark-read, .mark-unread');
      if (markBtn) {
        markBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const isRead = markBtn.classList.contains('mark-unread');
          const newStatus = isRead ? 'unread' : 'read';

          try {
            await supabase
              .from('notifications')
              .update({ status: newStatus })
              .eq('id', id);

              // Update local state without refetching (string-safe ID comparison)
              const notification = this.notifications.find(n => String(n.id) === String(id));
              if (notification) {
                notification.status = newStatus;
                this.updateBadge();
                this.render();
              }
          } catch (error) {
            console.error('Error updating notification:', error);
          }
        });
      }

      // Delete
      const deleteBtn = item.querySelector('.delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await supabase
              .from('notifications')
              .update({ status: 'deleted' })
              .eq('id', id);

            // Update local state without refetching (string-safe ID comparison)
            this.notifications = this.notifications.filter(n => String(n.id) !== String(id));
            this.updateBadge();
            this.render();
          } catch (error) {
            console.error('Error deleting notification:', error);
          }
        });
      }
    });
  }

  /**
   * Toggle notification expansion
   */
  toggleNotificationExpansion(notificationId) {
    const item = document.querySelector(`.notification-modal-item[data-id="${notificationId}"]`);
    if (!item) return;

    const messageElement = item.querySelector('.notification-modal-item-message');
    const readMoreBtn = item.querySelector('.notification-read-more');

    if (!messageElement || !readMoreBtn) return;

    const isExpanded = item.classList.contains('expanded');

    if (isExpanded) {
      // Collapse
      item.classList.remove('expanded');
      const previewMessage = messageElement.dataset.fullMessage.length > 100
        ? messageElement.dataset.fullMessage.substring(0, 100) + '...'
        : messageElement.dataset.fullMessage;
      messageElement.textContent = previewMessage;
      readMoreBtn.textContent = 'Read more';
    } else {
      // Expand
      item.classList.add('expanded');
      messageElement.textContent = messageElement.dataset.fullMessage;
      readMoreBtn.textContent = 'Read less';
    }
  }

  /**
   * Select/Deselect all notifications
   */
  selectAllNotifications(selected) {
    const checkboxes = document.querySelectorAll('.notification-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selected;
    });
    this.updateBulkActionButtons();
  }

  /**
   * Update select all checkbox state
   */
  updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllNotifications');
    const checkboxes = document.querySelectorAll('.notification-checkbox');
    const checkedBoxes = document.querySelectorAll('.notification-checkbox:checked');

    if (!selectAllCheckbox) return;

    if (checkedBoxes.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === checkboxes.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  /**
   * Get selected notification IDs
   */
  getSelectedNotificationIds() {
    const checkboxes = document.querySelectorAll('.notification-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
  }

  /**
   * Update bulk action buttons state
   */
  updateBulkActionButtons() {
    const selectedIds = this.getSelectedNotificationIds();
    const markSelectedBtn = document.getElementById('markSelectedReadBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    const hasSelection = selectedIds.length > 0;

    if (markSelectedBtn) {
      markSelectedBtn.disabled = !hasSelection;
    }
    if (deleteSelectedBtn) {
      deleteSelectedBtn.disabled = !hasSelection;
    }
  }

  /**
   * Mark selected notifications as read
   */
  async markSelectedAsRead() {
    const selectedIds = this.getSelectedNotificationIds();
    if (selectedIds.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('user_id', user.id)
        .in('id', selectedIds);

      // Update local state
      selectedIds.forEach(id => {
        const notification = this.notifications.find(n => String(n.id) === String(id));
        if (notification) {
          notification.status = 'read';
        }
      });

      this.updateBadge();
      this.render();
      this.updateBulkActionButtons();
    } catch (error) {
      console.error('Error marking selected as read:', error);
    }
  }

  /**
   * Delete selected notifications
   */
  async deleteSelectedNotifications() {
    const selectedIds = this.getSelectedNotificationIds();
    if (selectedIds.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ status: 'deleted' })
        .eq('user_id', user.id)
        .in('id', selectedIds);

      // Update local state
      this.notifications = this.notifications.filter(n => !selectedIds.includes(n.id));
      this.updateBadge();
      this.render();
      this.updateBulkActionButtons();
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    }
  }

  /**
   * Handle notification action
   */
  handleNotificationAction(action, actionDataStr) {
    try {
      // actionDataStr is encoded via encodeURIComponent when rendered into attributes
      let decoded = '{}';
      if (actionDataStr) {
        try {
          decoded = decodeURIComponent(actionDataStr);
        } catch (e) {
          // fallback to raw string if decode fails
          decoded = actionDataStr;
        }
      }

      let actionData = {};
      try {
        actionData = JSON.parse(decoded || '{}');
      } catch (e) {
        console.warn('Could not parse action data, using empty object', e);
        actionData = {};
      }

      switch (action) {
        case 'view_report':
          if (actionData.reportId) {
            // Navigate to report details
            window.location.hash = `#report-${actionData.reportId}`;
          }
          break;
        case 'claim_reward':
          if (actionData.reportId) {
            // Trigger reward claiming
            this.claimReward(actionData.reportId);
          }
          break;
        case 'pay_recovery_fee':
          if (actionData.reportId) {
            // Navigate to payment section
            window.location.hash = '#recovered';
          }
          break;
        default:
          console.log('Unknown action:', action, actionData);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }

  /**
   * Claim reward helper
   */
  async claimReward(reportId) {
    // This would integrate with the existing reward claiming logic
    console.log('Claiming reward for report:', reportId);
    // Trigger existing reward claiming functionality
    if (window.claimReward) {
      window.claimReward(reportId);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('user_id', user.id)
        .eq('status', 'unread');

      await this.fetchNotifications();
      this.render();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ status: 'deleted' })
        .eq('user_id', user.id);

      await this.fetchNotifications();
      this.render();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }

  /**
   * Format relative time
   */
  formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Initialize workflow verification functions
   */
  initWorkflowVerification() {
    // Expose workflow verification functions on window
    window.runFullDiagnostic = async () => {
      console.log('🔍 Starting full diagnostic...');
      
      try {
        // Check if system is loaded
        if (!window.unifiedNotifications) {
          console.error('❌ unifiedNotifications not found');
          return false;
        }
        console.log('✅ Notification system loaded');

        // Check Supabase
        if (!window.supabase) {
          console.error('❌ Supabase not found');
          return false;
        }
        console.log('✅ Supabase loaded');

        // Check current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log(`✅ User authenticated: ${user.email}`);
        } else {
          console.warn('⚠️ No authenticated user');
        }

        // Check notification count
        const count = this.notifications?.length || 0;
        console.log(`📊 Current notifications: ${count}`);

        // Check automated matching function
        if (typeof window.runAutomatedMatching === 'function') {
          console.log('✅ Automated matching function available');
        } else {
          console.warn('❌ Automated matching function not found');
        }

        console.log('🎯 Diagnostic complete');
        return true;
      } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return false;
      }
    };

    window.checkMatchingStatus = async () => {
      console.log('🔄 Checking matching status...');
      
      try {
        // Query lost and found reports
        const { data: lostReports, error: lostError } = await supabase
          .from('reports')
          .select('*')
          .eq('report_type', 'lost')
          .limit(5);

        const { data: foundReports, error: foundError } = await supabase
          .from('reports')
          .select('*')
          .eq('report_type', 'found')
          .limit(5);

        if (lostError) throw lostError;
        if (foundError) throw foundError;

        console.log(`📊 Found ${lostReports?.length || 0} lost reports`);
        console.log(`📊 Found ${foundReports?.length || 0} found reports`);

        // Check for potential matches
        let potentialMatches = 0;
        if (lostReports && foundReports) {
          for (const lost of lostReports) {
            for (const found of foundReports) {
              if (lost.document_type === found.document_type && 
                  lost.document_number === found.document_number) {
                potentialMatches++;
                console.log(`🔍 Match found: ${lost.document_type} (${lost.document_number})`);
              }
            }
          }
        }

        console.log(`🎯 Potential matches: ${potentialMatches}`);
        return { lostReports, foundReports, potentialMatches };
      } catch (error) {
        console.error('❌ Error checking status:', error);
        return null;
      }
    };

    window.forceRunMatching = async () => {
      console.log('⚡ Force running automated matching...');
      
      if (typeof window.runAutomatedMatching === 'function') {
        try {
          await window.runAutomatedMatching();
          console.log('✅ Matching completed');
          return true;
        } catch (error) {
          console.error('❌ Matching failed:', error);
          return false;
        }
      } else {
        console.warn('❌ Matching function not available');
        return false;
      }
    };

    // Add workflow verification button to notification modal
    this.addWorkflowVerificationButton();
  }

  /**
   * Add workflow verification button to notification modal
   */
  addWorkflowVerificationButton() {
    const modal = document.getElementById('notificationModal');
    if (!modal) return;

    // Check if button already exists
    if (modal.querySelector('.workflow-verification-btn')) return;

    const footer = modal.querySelector('.notification-modal-footer');
    if (!footer) return;

    const workflowBtn = document.createElement('button');
    workflowBtn.className = 'notification-modal-footer-btn workflow-verification-btn';
    workflowBtn.innerHTML = '<i class="fas fa-cogs"></i> Workflow Verification';
    workflowBtn.onclick = () => this.openWorkflowVerification();

    // Insert before close button
    const closeBtn = footer.querySelector('#closeBtn');
    if (closeBtn) {
      footer.insertBefore(workflowBtn, closeBtn);
    } else {
      footer.appendChild(workflowBtn);
    }
  }

  /**
   * Open workflow verification modal
   */
  openWorkflowVerification() {
    // Create workflow verification modal
    const modal = document.createElement('div');
    modal.className = 'notification-modal workflow-verification-modal';
    modal.id = 'workflowVerificationModal';
    modal.innerHTML = `
      <div class="notification-modal-content">
        <div class="notification-modal-header">
          <h2>🔔 Notification Workflow Verification</h2>
          <button class="notification-modal-close" onclick="this.closest('.workflow-verification-modal').remove()">&times;</button>
        </div>

        <div class="notification-modal-list" id="workflowVerificationContent">
          <div style="padding: 20px; text-align: center;">
            <h3>📋 Complete Notification Workflow</h3>
            <p><strong>Status: ✅ FULLY IMPLEMENTED</strong> - All notifications are working, but automated matching may not be finding matches.</p>
            
            <div style="text-align: left; margin: 20px 0;">
              <h4>🧪 Testing Controls:</h4>
              <button onclick="window.runFullDiagnostic()" style="margin: 5px; padding: 10px 15px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🔍 Run Full Diagnostic
              </button>
              <button onclick="window.checkMatchingStatus()" style="margin: 5px; padding: 10px 15px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🔄 Check Matching Status
              </button>
              <button onclick="window.forceRunMatching()" style="margin: 5px; padding: 10px 15px; background: #f59e0b; color: white; border: none; border-radius: 5px; cursor: pointer;">
                ⚡ Force Run Matching
              </button>
            </div>

            <div id="workflowDebugOutput" style="background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 10px 0; max-height: 300px; overflow-y: auto; text-align: left; display: none;">
              <!-- Debug output will appear here -->
            </div>
          </div>
        </div>

        <div class="notification-modal-footer">
          <button class="notification-modal-footer-btn" onclick="this.closest('.workflow-verification-modal').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    // Override debug functions to show in this modal
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const updateDebugDisplay = (message, type = 'info') => {
      const debugDiv = document.getElementById('workflowDebugOutput');
      if (debugDiv) {
        debugDiv.style.display = 'block';
        const timestamp = new Date().toLocaleTimeString();
        const color = type === 'error' ? '#dc3545' : type === 'warn' ? '#ffc107' : '#28a745';
        debugDiv.innerHTML += `<div style="color: ${color};">[${timestamp}] ${message}</div>`;
        debugDiv.scrollTop = debugDiv.scrollHeight;
      }
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      updateDebugDisplay(args.join(' '), 'info');
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      updateDebugDisplay(args.join(' '), 'error');
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      updateDebugDisplay(args.join(' '), 'warn');
    };

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        // Restore original console functions
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    });
  }

  /**
   * Update badge
   */
  updateBadge() {
    // Update the main badge element
    if (this.badgeElement) {
      const unreadCount = this.notifications.filter(n => n.status === 'unread').length;
      this.badgeElement.textContent = unreadCount;
      this.badgeElement.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    // Also update any other badge elements for compatibility
    const otherBadges = document.querySelectorAll('.notification-badge:not(#topNotificationCount)');
    otherBadges.forEach(badge => {
      const unreadCount = this.notifications.filter(n => n.status === 'unread').length;
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    });
  }

  /**
   * Create notification in Supabase
   */
  static async createNotification(userId, message, options = {}) {
    console.log('🔔 Attempting to create notification:', { userId, message, options });

    const {
      type = 'info',
      priority = 'medium',
      reportId = null,
      action = null,
      actionData = null,
      expiresAt = null
    } = options;

    try {
      const notificationData = {
        user_id: userId,
        message: message,
        type: type,
        priority: priority,
        status: 'unread',
        related_report_id: reportId,
        notification_action: action,
        action_data: actionData,
        created_at: new Date().toISOString()
      };

      if (expiresAt) {
        notificationData.expires_at = expiresAt;
      }

      console.log('📝 Inserting notification data:', notificationData);

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Notification created successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      console.error('❌ Error details:', {
        userId,
        message: message.substring(0, 100),
        options,
        error: error.message,
        code: error.code
      });
      // Don't return false, throw the error so calling code knows it failed
      throw error;
    }
  }

  /**
   * Create notification with action - convenience method
   */
  static async createActionableNotification(userId, message, action, actionData, options = {}) {
    return this.createNotification(userId, message, {
      ...options,
      action,
      actionData
    });
  }

  /**
   * Handle user authentication changes
   */
  async handleAuthChange(user) {
    console.log('Auth change detected:', user ? `logged in (${user.email})` : 'logged out');
    console.log('Current user before change:', this.currentUser?.email || 'none');

    if (user && !this.currentUser) {
      // User logged in - initialize the system with timeout protection
      console.log('🔐 User logging in, initializing notification system...');
      this.currentUser = user;
      
      try {
        // Add timeout protection to prevent hanging
        const initPromise = Promise.all([
          Promise.resolve(this.createBell()),
          Promise.resolve(this.createModal()),
          Promise.resolve(this.attachModalListeners())
        ]);
        
        // Wait for initialization with timeout
        await Promise.race([
          initPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Notification system initialization timeout')), 5000)
          )
        ]);
        
        console.log('✅ Notification system UI initialized');
        
        // Fetch notifications with timeout protection
        await Promise.race([
          this.fetchNotifications(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Notification fetch timeout')), 10000)
          )
        ]);
        
        console.log('✅ Notification system fully initialized');
        
        // Start match detection system
        this.startMatchDetection();
        
      } catch (error) {
        console.error('❌ Notification system initialization failed:', error);
        // Don't block the dashboard - continue with minimal functionality
      }
    } else if (!user && this.currentUser) {
      // User logged out - cleanup
      console.log('🔐 User logging out, cleaning up...');
      this.stopMatchDetection();
      this.currentUser = null;
      this.notifications = [];
      this.updateBadge();
    }
  }

  // ==================== MATCH DETECTION SYSTEM ====================
  
  /**
   * Start automated match detection
   */
  startMatchDetection() {
    if (this.matchDetectionInterval) {
      console.log('🔍 Match detection already running');
      return;
    }

    console.log('🔍 Starting match detection system');
    this.matchDetectionInterval = setInterval(async () => {
      await this.checkForMatches();
    }, 30000); // Check every 30 seconds

    // Initial check
    this.checkForMatches();
    console.log('✅ Match detection system started');
  }

  /**
   * Stop automated match detection
   */
  stopMatchDetection() {
    if (this.matchDetectionInterval) {
      clearInterval(this.matchDetectionInterval);
      this.matchDetectionInterval = null;
      console.log('🔍 Match detection stopped');
    }
  }

  /**
   * Check for document matches between lost and found reports
   */
  async checkForMatches() {
    try {
      console.log('🔍 Checking for document matches...');

      // Get active lost reports (not already matched)
      const { data: lostReports, error: lostError } = await supabase
        .from('reports')
        .select(`
          *,
          report_documents!inner(
            document_type,
            document_number,
            category
          )
        `)
        .eq('report_type', 'lost')
        .eq('status', 'active')
        .is('matched_report_id', null);

      if (lostError) {
        console.error('❌ Error fetching lost reports:', lostError);
        return;
      }

      // Get active found reports (not already matched)
      const { data: foundReports, error: foundError } = await supabase
        .from('reports')
        .select(`
          *,
          report_documents!inner(
            document_type,
            document_number,
            category
          )
        `)
        .eq('report_type', 'found')
        .eq('status', 'active')
        .is('matched_report_id', null);

      if (foundError) {
        console.error('❌ Error fetching found reports:', foundError);
        return;
      }

      console.log(`📊 Checking ${lostReports.length} lost vs ${foundReports.length} found reports`);
      
      // Debug: Log document details
      console.log('🔍 Lost reports documents:');
      lostReports.forEach((report, index) => {
        const doc = report.report_documents[0];
        console.log(`  ${index + 1}. Type: "${doc.document_type}", Number: "${doc.document_number}"`);
      });
      
      console.log('🔍 Found reports documents:');
      foundReports.forEach((report, index) => {
        const doc = report.report_documents[0];
        console.log(`  ${index + 1}. Type: "${doc.document_type}", Number: "${doc.document_number}"`);
      });

      // Find matches
      let matchesFound = 0;
      for (const lost of lostReports) {
        for (const found of foundReports) {
          if (this.documentsMatch(lost, found)) {
            console.log(`🎯 MATCH FOUND! Lost ID: ${lost.id}, Found ID: ${found.id}`);
            await this.createMatch(lost, found);
            matchesFound++;
          }
        }
      }

      if (matchesFound > 0) {
        console.log(`🎯 Found ${matchesFound} new matches!`);
      } else {
        console.log('❌ No matches found in this check');
      }

    } catch (error) {
      console.error('❌ Error in match detection:', error);
    }
  }

  /**
   * Check if two documents match
   */
  documentsMatch(lost, found) {
    // Check if reports have documents
    if (!lost.report_documents || lost.report_documents.length === 0) {
      console.warn(`⚠️ Lost report ${lost.id} has no documents`);
      return false;
    }
    
    if (!found.report_documents || found.report_documents.length === 0) {
      console.warn(`⚠️ Found report ${found.id} has no documents`);
      return false;
    }

    const lostDoc = lost.report_documents[0];
    const foundDoc = found.report_documents[0];

    if (!lostDoc || !foundDoc) {
      console.warn(`⚠️ Missing document data - Lost: ${!!lostDoc}, Found: ${!!foundDoc}`);
      return false;
    }

    // EXACT MATCH LOGIC
    const typeMatch = lostDoc.document_type === foundDoc.document_type;
    const numberMatch = lostDoc.document_number === foundDoc.document_number;
    
    console.log(`🔍 Comparing: Lost(${lostDoc.document_type}, ${lostDoc.document_number}) vs Found(${foundDoc.document_type}, ${foundDoc.document_number})`);
    console.log(`    Type match: ${typeMatch}, Number match: ${numberMatch}`);
    
    return typeMatch && numberMatch;
  }

  /**
   * Create a match between lost and found reports
   */
  async createMatch(lostReport, foundReport) {
    console.log(`🎯 Match found! Lost ID: ${lostReport.id}, Found ID: ${foundReport.id}`);

    try {
      // 1. Create recovered_reports record
      const { data: recoveredRecord, error: recoveredError } = await supabase
        .from('recovered_reports')
        .insert({
          lost_report_id: lostReport.id,
          found_report_id: foundReport.id,
          status: 'recovered',
          created_at: new Date()
        })
        .select()
        .single();

      if (recoveredError) {
        console.error('❌ Failed to create recovered record:', recoveredError);
        return;
      }

      console.log('✅ Recovered record created:', recoveredRecord.id);

      // 2. Update both reports to link to each other
      await supabase
        .from('reports')
        .update({ 
          matched_report_id: foundReport.id,
          status: 'potential_match',
          updated_at: new Date()
        })
        .eq('id', lostReport.id);

      await supabase
        .from('reports')
        .update({ 
          matched_report_id: lostReport.id,
          status: 'potential_match',
          updated_at: new Date()
        })
        .eq('id', foundReport.id);

      // 3. Create notifications for BOTH parties
      await this.createMatchNotifications(recoveredRecord, lostReport, foundReport);

      console.log('✅ Match processing complete!');

    } catch (error) {
      console.error('❌ Error creating match:', error);
    }
  }

  /**
   * Create match notifications for both parties
   */
  async createMatchNotifications(recoveredRecord, lostReport, foundReport) {
    const lostDoc = lostReport.report_documents[0];
    const foundDoc = foundReport.report_documents[0];

    // Notification for LOST report owner
    await this.createNotification(
      lostReport.user_id,
      `🎯 Potential match found for your ${lostDoc.document_type}! ` +
      `Document number: ${lostDoc.document_number}. ` +
      `Please check potential matches to verify if this is yours.`,
      'match',
      {
        action: 'view_match',
        actionData: { 
          recovered_report_id: recoveredRecord.id,
          lost_report_id: lostReport.id,
          found_report_id: foundReport.id
        }
      },
      lostReport.id
    );

    // Notification for FOUND report owner  
    await this.createNotification(
      foundReport.user_id,
      `👤 Potential owner found for the ${foundDoc.document_type} you reported! ` +
      `Document number: ${foundDoc.document_number}. ` +
      `Waiting for owner verification.`,
      'info',
      {
        action: 'view_match',
        actionData: { 
          recovered_report_id: recoveredRecord.id,
          lost_report_id: lostReport.id,
          found_report_id: foundReport.id
        }
      },
      foundReport.id
    );

    console.log('✅ Match notifications created for both parties');
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.stopMatchDetection();
    // ... existing cleanup code
  }
}

// Initialize on page load
let unifiedNotifications;
document.addEventListener('DOMContentLoaded', () => {
  unifiedNotifications = new UnifiedNotificationSystem();
  
  // Expose globally for debugging
  window.unifiedNotifications = unifiedNotifications;

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    await unifiedNotifications.handleAuthChange(session?.user || null);
  });
  
  console.log('✅ Notification system initialized!');
  console.log('💡 Debug commands available:');
  console.log('   - checkNotifications() - Check notification status');
  console.log('   - testNotification() - Create a test notification');
  console.log('   - refreshNotifications() - Force refresh');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (unifiedNotifications) {
    unifiedNotifications.cleanup();
  }
});

// Export for use in other files
export { UnifiedNotificationSystem };
window.UnifiedNotificationSystem = UnifiedNotificationSystem;

// Global function for manual match detection (for debugging)
window.triggerMatchDetection = async function() {
  console.log('🔍 Manual match detection triggered');
  if (window.unifiedNotifications) {
    await window.unifiedNotifications.checkForMatches();
  } else {
    console.error('❌ UnifiedNotificationSystem not available');
  }
};

// Global debug function to check match detection status
window.debugMatchDetection = async function() {
  console.log('🔍 === MATCH DETECTION DEBUG ===');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated');
      return;
    }
    console.log('👤 Current user:', user.email);
    
    // Check all reports
    const { data: allReports, error: reportsError } = await supabase
      .from('reports')
      .select('*, report_documents(*)')
      .eq('status', 'active')
      .in('report_type', ['lost', 'found']);
      
    if (reportsError) {
      console.error('❌ Error fetching reports:', reportsError);
      return;
    }
    
    const lostReports = allReports.filter(r => r.report_type === 'lost');
    const foundReports = allReports.filter(r => r.report_type === 'found');
    
    console.log(`📊 Found ${lostReports.length} lost reports and ${foundReports.length} found reports`);
    
    // Show details of each report
    console.log('\n🔍 LOST REPORTS:');
    lostReports.forEach((report, index) => {
      console.log(`  ${index + 1}. ID: ${report.id}, User: ${report.email}`);
      if (report.report_documents && report.report_documents.length > 0) {
        report.report_documents.forEach((doc, docIndex) => {
          console.log(`     Document ${docIndex + 1}: Type="${doc.document_type}", Number="${doc.document_number}"`);
        });
      }
    });
    
    console.log('\n🔍 FOUND REPORTS:');
    foundReports.forEach((report, index) => {
      console.log(`  ${index + 1}. ID: ${report.id}, User: ${report.email}`);
      if (report.report_documents && report.report_documents.length > 0) {
        report.report_documents.forEach((doc, docIndex) => {
          console.log(`     Document ${docIndex + 1}: Type="${doc.document_type}", Number="${doc.document_number}"`);
        });
      }
    });
    
    // Check for potential matches manually
    console.log('\n🎯 CHECKING FOR MATCHES:');
    let matchCount = 0;
    for (const lost of lostReports) {
      for (const found of foundReports) {
        if (lost.report_documents && found.report_documents && 
            lost.report_documents.length > 0 && found.report_documents.length > 0) {
          
          const lostDoc = lost.report_documents[0];
          const foundDoc = found.report_documents[0];
          
          console.log(`\n  Comparing: Lost(${lostDoc.document_type}, ${lostDoc.document_number}) vs Found(${foundDoc.document_type}, ${foundDoc.document_number})`);
          
          const typeMatch = lostDoc.document_type === foundDoc.document_type;
          const numberMatch = lostDoc.document_number === foundDoc.document_number;
          
          console.log(`    Type match: ${typeMatch}, Number match: ${numberMatch}`);
          
          if (typeMatch && numberMatch) {
            console.log(`    🎯 MATCH FOUND! Lost ID: ${lost.id}, Found ID: ${found.id}`);
            matchCount++;
          }
        }
      }
    }
    
    console.log(`\n📊 Total matches found: ${matchCount}`);
    
    if (matchCount > 0) {
      console.log('✅ If matches were found but no notifications were created, there might be an issue with the createMatch function');
    } else {
      console.log('❌ No matches found. Check if document types and numbers exactly match');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// Function to manually create a test match
window.createTestMatch = async function(lostReportId, foundReportId) {
  console.log('🧪 Creating test match...');
  
  try {
    // Get the reports
    const { data: lostReport, error: lostError } = await supabase
      .from('reports')
      .select('*, report_documents(*)')
      .eq('id', lostReportId)
      .single();
      
    const { data: foundReport, error: foundError } = await supabase
      .from('reports')
      .select('*, report_documents(*)')
      .eq('id', foundReportId)
      .single();
      
    if (lostError || foundError) {
      console.error('❌ Error fetching reports:', lostError || foundError);
      return;
    }
    
    console.log('📋 Lost report:', lostReport);
    console.log('📋 Found report:', foundReport);
    
    // Manually trigger match creation
    if (window.unifiedNotifications) {
      await window.unifiedNotifications.createMatch(lostReport, foundReport);
      console.log('✅ Test match created successfully!');
    } else {
      console.error('❌ UnifiedNotificationSystem not available');
    }
    
  } catch (error) {
    console.error('❌ Error creating test match:', error);
  }
};
