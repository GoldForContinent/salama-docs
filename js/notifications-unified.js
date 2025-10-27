/**
 * UNIFIED NOTIFICATION SYSTEM
 * Single file handling all notifications for the dashboard
 * - Creates notifications in Supabase
 * - Displays notification modal
 * - Manages notification center
 */

import { supabase } from './supabase.js';

class UnifiedNotificationSystem {
  constructor() {
    this.isOpen = false;
    this.currentFilter = 'all';
    this.notifications = [];
    this.init();
  }

  /**
   * Initialize the notification system
   */
  init() {
    this.createBell();
    this.createModal();
    this.attachEventListeners();
    this.setupSubscriptions();
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
      <span class="notification-badge">0</span>
    `;
    bell.addEventListener('click', () => this.toggle());

    // Add to profile dropdown area
    const profileDropdown = document.getElementById('profileDropdownBtn');
    if (profileDropdown && profileDropdown.parentNode) {
      profileDropdown.parentNode.insertBefore(bell, profileDropdown);
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
  setupSubscriptions() {
    // Subscribe to notifications table changes
    supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          this.fetchNotifications();
        }
      )
      .subscribe();
  }

  /**
   * Fetch notifications from Supabase
   */
  async fetchNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.notifications = data || [];
      this.updateBadge();
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
    const modal = document.getElementById('notificationModal');
    if (modal) {
      await this.fetchNotifications();
      modal.classList.add('active');
      this.isOpen = true;
      this.render();

      // Focus search
      const searchInput = document.getElementById('notificationSearch');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
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
    if (!list) return;

    let notifications = this.notifications;

    // Filter by type
    if (this.currentFilter !== 'all') {
      notifications = notifications.filter(n => n.type === this.currentFilter);
    }

    // Filter by search
    if (searchQuery) {
      notifications = notifications.filter(n =>
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="notification-modal-empty">
          <i class="fas fa-inbox"></i>
          <h3>No notifications</h3>
          <p>${searchQuery ? 'No matching notifications found' : 'You\'re all caught up!'}</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.map(n => this.renderNotification(n)).join('');
    this.attachItemListeners();
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

    return `
      <div class="notification-modal-item ${type} ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
        <div class="notification-modal-item-icon">
          <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-modal-item-content">
          <p class="notification-modal-item-message">${this.escapeHtml(notification.message)}</p>
          <p class="notification-modal-item-time">${time}</p>
        </div>
        <div class="notification-modal-item-actions">
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

            await this.fetchNotifications();
            this.render();
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

            await this.fetchNotifications();
            this.render();
          } catch (error) {
            console.error('Error deleting notification:', error);
          }
        });
      }
    });
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
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      const unreadCount = this.notifications.filter(n => n.status === 'unread').length;
      badge.textContent = unreadCount > 0 ? unreadCount : '0';
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Create notification in Supabase
   */
  static async createNotification(userId, message, type = 'info', priority = 'medium', reportId = null, action = null, actionData = null) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: message,
          type: type,
          priority: priority,
          status: 'unread',
          related_report_id: reportId,
          notification_action: action,
          action_data: actionData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log('✅ Notification created:', message);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }
}

// Initialize on page load
let unifiedNotifications;
document.addEventListener('DOMContentLoaded', () => {
  unifiedNotifications = new UnifiedNotificationSystem();
});

// Export for use in other files
export { UnifiedNotificationSystem };
window.UnifiedNotificationSystem = UnifiedNotificationSystem;
