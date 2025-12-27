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
      this.attachEventListeners();
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
          <div class="notification-modal-actions">
            <button class="notification-modal-btn" id="markAllReadBtn" title="Mark all as read">
              <i class="fas fa-envelope-open"></i> Mark All Read
            </button>
            <button class="notification-modal-btn danger" id="clearAllBtn" title="Clear all notifications">
              <i class="fas fa-trash"></i> Clear All
            </button>
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
      });
    });

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
        // Update existing notification
        const index = this.notifications.findIndex(n => n.id === payload.new.id);
        if (index !== -1) {
          this.notifications[index] = payload.new;
        }
        break;
      case 'DELETE':
        // Remove notification from list
        this.notifications = this.notifications.filter(n => n.id !== payload.old.id);
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
    if (!this.currentUser) {
      console.warn('No user logged in for notifications');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.notifications = data || [];
      console.log('📬 Fetched notifications:', this.notifications.length);
      this.updateBadge();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      this.notifications = [];
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
      console.log('Notifications fetched:', this.notifications.length);
      
      // Make sure modal is visible before rendering
      modal.classList.add('active');
      this.isOpen = true;
      
      // Ensure list element exists
      const list = document.getElementById('notificationList');
      if (!list) {
        console.error('❌ Notification list element not found!');
        return;
      }
      
      console.log('Rendering notifications...');
      this.render();
      console.log('✅ Modal opened and rendered');

      // Focus search
      const searchInput = document.getElementById('notificationSearch');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    } catch (error) {
      console.error('Error opening modal:', error);
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
    const list = document.getElementById('notificationList');
    if (!list) {
      console.error('❌ Notification list element not found');
      return;
    }

    console.log('🎨 Starting render. Total notifications:', this.notifications.length);
    console.log('Notifications data:', this.notifications);

    let notifications = [...this.notifications]; // Create copy
    console.log('🎨 Rendering notifications. Total:', notifications.length, 'Filter:', this.currentFilter);

    // Filter by type
    if (this.currentFilter !== 'all') {
      notifications = notifications.filter(n => n.type === this.currentFilter);
      console.log('After type filter:', notifications.length);
    }

    // Filter by search
    if (searchQuery) {
      notifications = notifications.filter(n =>
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('After search filter:', notifications.length);
    }

    if (notifications.length === 0) {
      console.log('No notifications to display');
      list.innerHTML = `
        <div class="notification-modal-empty">
          <i class="fas fa-inbox"></i>
          <h3>No notifications</h3>
          <p>${searchQuery ? 'No matching notifications found' : 'You\'re all caught up!'}</p>
        </div>
      `;
      return;
    }

    console.log('Rendering', notifications.length, 'notifications');
    const html = notifications.map(n => {
      console.log('Creating HTML for notification:', n.id, n.message);
      return this.renderNotification(n);
    }).join('');
    
    console.log('Setting innerHTML with', html.length, 'characters');
    list.innerHTML = html;
    console.log('HTML set, attaching listeners...');
    this.attachItemListeners();
    console.log('✅ Render complete');
  }

  /**
   * Render single notification
   */
  renderNotification(notification) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const type = notification.type || 'info';
    const isUnread = notification.status === 'unread';
    const time = this.formatRelativeTime(notification.created_at);
    const hasAction = notification.notification_action && notification.action_data;

    return `
      <div class="notification-modal-item ${type} ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
        <div class="notification-modal-item-icon">
          <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-modal-item-content">
          <p class="notification-modal-item-message">${this.escapeHtml(notification.message)}</p>
          <p class="notification-modal-item-time">${time}</p>
          ${hasAction ? `<div class="notification-modal-item-action-hint">Click to take action</div>` : ''}
        </div>
        <div class="notification-modal-item-actions">
          ${hasAction ? `
            <button class="notification-modal-item-btn action" title="${notification.notification_action}" data-id="${notification.id}" data-action="${notification.notification_action}" data-action-data="${this.escapeHtml(JSON.stringify(notification.action_data || {}))}">
              <i class="fas fa-external-link-alt"></i>
            </button>
          ` : ''}
          ${isUnread ? `
            <button class="notification-modal-item-btn mark-read" title="Mark as read" data-id="${notification.id}">
              <i class="fas fa-envelope-open"></i>
            </button>
          ` : `
            <button class="notification-modal-item-btn mark-unread" title="Mark as unread" data-id="${notification.id}">
              <i class="fas fa-envelope"></i>
            </button>
          `}
          <button class="notification-modal-item-btn delete" title="Delete" data-id="${notification.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        ${isUnread ? '<div class="notification-modal-item-unread-indicator"></div>' : ''}
      </div>
    `;
  }

  /**
   * Attach item listeners
   */
  attachItemListeners() {
    const items = document.querySelectorAll('.notification-modal-item');
    items.forEach(item => {
      const id = item.dataset.id;

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

            // Update local state without refetching
            const notification = this.notifications.find(n => n.id === id);
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

            // Update local state without refetching
            this.notifications = this.notifications.filter(n => n.id !== id);
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
   * Handle notification action
   */
  handleNotificationAction(action, actionDataStr) {
    try {
      const actionData = JSON.parse(actionDataStr || '{}');

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

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (error) throw error;
      console.log('✅ Notification created:', message, { type, action });
      return true;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return false;
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
    console.log('Auth change detected:', user ? 'logged in' : 'logged out');

    if (user && !this.currentUser) {
      // User logged in - initialize the system
      this.currentUser = user;
      this.createBell();
      this.createModal();
      this.attachEventListeners();
    } else if (!user && this.currentUser) {
      // User logged out
      this.currentUser = null;
      this.notifications = [];
      this.updateBadge();
    }
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
