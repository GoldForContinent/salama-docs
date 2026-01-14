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

      // Always create the UI elements (bell and modal) regardless of auth state
      this.createBell();
      console.log('✅ Bell created');
      this.createModal();
      console.log('✅ Modal created');
      this.attachModalListeners();
      console.log('✅ Event listeners attached');

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
    bell.addEventListener('click', () => this.toggle());

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

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase query error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('📬 Raw query result:', data);
      console.log('📬 Query returned', data?.length || 0, 'notifications');

      // Ensure we have a valid array
      if (!Array.isArray(data)) {
        console.error('❌ Query did not return an array!', typeof data);
        this.notifications = [];
      } else {
        this.notifications = data;
        console.log('✅ Set notifications array to:', this.notifications.length, 'items');
        
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
      }

      // Expose quick debug helper on window for interactive inspection
      try {
        window._debugNotifications = () => ({
          currentUser: this.currentUser,
          notifications: this.notifications,
          count: this.notifications.length
        });
        console.log('💡 Debug helper available: window._debugNotifications()');
      } catch (e) {
        /* ignore in non-browser contexts */
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

    if (notifications.length === 0) {
      console.log('📭 No notifications to display, showing empty state');
      list.innerHTML = `
        <div class="notification-modal-empty">
          <i class="fas fa-inbox"></i>
          <h3>No notifications</h3>
          <p>${searchQuery ? 'No matching notifications found' : 'You\'re all caught up!'}</p>
        </div>
      `;
      return;
    }

    console.log('🎨 Rendering', notifications.length, 'notifications');

    // Build HTML using renderNotification for each item
    let html = '';
    try {
      html = notifications.map(n => {
        if (!n || !n.id) {
          console.warn('⚠️ Invalid notification object:', n);
          return '';
        }
        console.log('🎨 Creating HTML for notification:', n.id, (n.message || '').substring(0, 30) + '...');
        return this.renderNotification(n);
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
      // User logged in - initialize the system
      console.log('🔐 User logging in, initializing notification system...');
      this.currentUser = user;
      this.createBell();
      this.createModal();
      this.attachModalListeners();

      // Fetch notifications for the newly logged in user
      await this.fetchNotifications();
    } else if (!user && this.currentUser) {
      // User logged out
      console.log('🔐 User logging out, clearing notifications...');
      this.currentUser = null;
      this.notifications = [];
      this.updateBadge();
    } else if (user && this.currentUser && user.id !== this.currentUser.id) {
      // User switched
      console.log('🔐 User switched, updating...');
      this.currentUser = user;
      await this.fetchNotifications();
    }
    console.log('Current user after change:', this.currentUser?.email || 'none');
  }

  /**
   * Cleanup on page unload
   */
  cleanup() {
    this.cleanupSubscriptions();
  }
}

// Initialize on page load
let unifiedNotifications;
document.addEventListener('DOMContentLoaded', () => {
  unifiedNotifications = new UnifiedNotificationSystem();

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    await unifiedNotifications.handleAuthChange(session?.user || null);
  });
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
