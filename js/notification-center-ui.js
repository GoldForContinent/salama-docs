/**
 * Notification Center UI
 * Handles rendering and interaction of the notification center
 */

class NotificationCenterUI {
  constructor() {
    this.isOpen = false;
    this.currentFilter = 'all';
    this.init();
  }

  /**
   * Initialize UI
   */
  init() {
    this.createBell();
    this.createModal();
    this.attachEventListeners();
  }

  /**
   * Create notification bell
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

    // Try to add next to profile dropdown (preferred location)
    const profileDropdown = document.getElementById('profileDropdownBtn');
    if (profileDropdown && profileDropdown.parentNode) {
      profileDropdown.parentNode.insertBefore(bell, profileDropdown);
      return;
    }

    // Try to add to header top-right area
    const headerRight = document.querySelector('.header-right') ||
                        document.querySelector('.top-right') ||
                        document.querySelector('.navbar-right');
    if (headerRight) {
      headerRight.appendChild(bell);
      return;
    }

    // Try to add to header
    const header = document.querySelector('.header') || 
                   document.querySelector('header') ||
                   document.querySelector('.navbar') ||
                   document.querySelector('.top-bar');

    if (header) {
      header.appendChild(bell);
      return;
    }

    // Fallback: add to body
    document.body.appendChild(bell);
  }

  /**
   * Create notification center modal
   */
  createModal() {
    // Check if modal already exists
    if (document.querySelector('.notification-center-modal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'notification-center-modal';
    modal.id = 'notificationCenterModal';
    modal.innerHTML = `
      <div class="notification-center-content">
        <div class="notification-center-header">
          <h2>Notifications</h2>
          <button class="notification-center-close" aria-label="Close notifications">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="notification-center-toolbar">
          <div class="notification-center-search">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search notifications..." id="notificationSearch">
          </div>
          <div class="notification-center-actions">
            <button class="notification-center-btn" id="markAllReadBtn" title="Mark all as read">
              <i class="fas fa-check-double"></i> Mark All Read
            </button>
            <button class="notification-center-btn danger" id="clearAllBtn" title="Clear all notifications">
              <i class="fas fa-trash"></i> Clear All
            </button>
          </div>
        </div>

        <div class="notification-center-filters">
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

        <div class="notification-center-list" id="notificationList">
          <!-- Notifications will be rendered here -->
        </div>

        <div class="notification-center-footer">
          <button class="notification-center-footer-btn" id="closeBtn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Attach event listeners
    this.attachModalListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close on background click
    const modal = document.getElementById('notificationCenterModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // Keyboard shortcut (Escape)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Attach modal-specific listeners
   */
  attachModalListeners() {
    // Close button
    const closeBtn = document.querySelector('.notification-center-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close footer button
    const footerCloseBtn = document.getElementById('closeBtn');
    if (footerCloseBtn) {
      footerCloseBtn.addEventListener('click', () => this.close());
    }

    // Mark all as read
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        if (window.notificationCenter) {
          window.notificationCenter.markAllAsRead();
          this.render();
        }
      });
    }

    // Clear all
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all notifications?')) {
          if (window.notificationCenter) {
            window.notificationCenter.deleteAll();
            this.render();
          }
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
  open() {
    const modal = document.getElementById('notificationCenterModal');
    if (modal) {
      modal.classList.add('active');
      this.isOpen = true;
      this.render();
      
      // Focus search input
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
    const modal = document.getElementById('notificationCenterModal');
    if (modal) {
      const content = modal.querySelector('.notification-center-content');
      if (content) {
        content.classList.add('closing');
        setTimeout(() => {
          modal.classList.remove('active');
          content.classList.remove('closing');
          this.isOpen = false;
        }, 300);
      }
    }
  }

  /**
   * Render notifications
   * @param {string} searchQuery - Optional search query
   */
  render(searchQuery = '') {
    const list = document.getElementById('notificationList');
    if (!list || !window.notificationCenter) return;

    let notifications = window.notificationCenter.getByType(this.currentFilter);

    // Apply search
    if (searchQuery) {
      notifications = notifications.filter(n =>
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="notification-center-empty">
          <i class="fas fa-inbox"></i>
          <h3>No notifications</h3>
          <p>${searchQuery ? 'No matching notifications found' : 'You\'re all caught up!'}</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.map(notif => this.renderNotification(notif)).join('');

    // Attach item listeners
    this.attachItemListeners();
  }

  /**
   * Render single notification
   * @param {Object} notification - Notification object
   * @returns {string} HTML
   */
  renderNotification(notification) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const relativeTime = window.notificationCenter.formatRelativeTime(notification.timestamp);

    return `
      <div class="notification-item ${notification.type} ${!notification.read ? 'unread' : ''}" data-id="${notification.id}">
        <div class="notification-item-icon">
          <i class="${icons[notification.type]}"></i>
        </div>
        <div class="notification-item-content">
          <p class="notification-item-message">${this.escapeHtml(notification.message)}</p>
          <p class="notification-item-time">${relativeTime}</p>
        </div>
        <div class="notification-item-actions">
          ${!notification.read ? `
            <button class="notification-item-action-btn mark-read" title="Mark as read">
              <i class="fas fa-envelope-open"></i>
            </button>
          ` : `
            <button class="notification-item-action-btn mark-unread" title="Mark as unread">
              <i class="fas fa-envelope"></i>
            </button>
          `}
          <button class="notification-item-action-btn delete" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        ${!notification.read ? '<div class="notification-item-unread-indicator"></div>' : ''}
      </div>
    `;
  }

  /**
   * Attach item listeners
   */
  attachItemListeners() {
    const items = document.querySelectorAll('.notification-item');
    items.forEach(item => {
      const id = parseInt(item.dataset.id);

      // Mark as read/unread
      const markBtn = item.querySelector('.mark-read, .mark-unread');
      if (markBtn) {
        markBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.notificationCenter) {
            const notif = window.notificationCenter.getById(id);
            if (notif.read) {
              window.notificationCenter.markAsUnread(id);
            } else {
              window.notificationCenter.markAsRead(id);
            }
            this.render();
          }
        });
      }

      // Delete
      const deleteBtn = item.querySelector('.delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.notificationCenter) {
            window.notificationCenter.deleteNotification(id);
            this.render();
          }
        });
      }
    });
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
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
    if (window.notificationCenter) {
      window.notificationCenter.updateBadge();
    }
  }
}

// Create global instance
const notificationCenterUI = new NotificationCenterUI();

// Export for ES6 modules
export { notificationCenterUI, NotificationCenterUI };

// Attach to window for global access
window.notificationCenterUI = notificationCenterUI;
