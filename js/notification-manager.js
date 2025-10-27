/**
 * Unified Notification Manager
 * Handles all notifications across the application
 * Features: Queue system, animations, dismiss buttons, accessibility
 */

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.maxVisible = 3;
    this.notificationId = 0;
    this.init();
  }

  /**
   * Initialize the notification system
   */
  init() {
    // Create container if it doesn't exist
    if (!document.getElementById('notifications-container')) {
      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.className = 'notifications-container';
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', 'Notifications');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('notifications-container');
    }
  }

  /**
   * Show a notification
   * @param {string} message - The notification message
   * @param {Object} options - Configuration options
   * @returns {number} Notification ID
   */
  show(message, options = {}) {
    const {
      type = 'info',
      duration = 5000,
      priority = 'normal',
      dismissible = true,
      action = null
    } = options;

    // Validate type
    if (!['success', 'error', 'warning', 'info'].includes(type)) {
      console.warn(`Invalid notification type: ${type}. Using 'info' instead.`);
      options.type = 'info';
    }

    const id = ++this.notificationId;
    const notification = {
      id,
      message,
      type,
      duration,
      priority,
      dismissible,
      action,
      element: null,
      timeout: null
    };

    this.notifications.push(notification);
    this.render(notification);

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      notification.timeout = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Render a notification
   * @param {Object} notification - Notification object
   */
  render(notification) {
    const element = document.createElement('div');
    element.className = `notification ${notification.type} priority-${notification.priority}`;
    element.setAttribute('role', 'alert');
    element.setAttribute('data-notification-id', notification.id);

    // Icon mapping
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    // Build HTML
    let html = `
      <div class="notification-icon">
        <i class="${icons[notification.type]}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-message">${this.escapeHtml(notification.message)}</div>
    `;

    // Add action button if provided
    if (notification.action) {
      html += `
        <div class="notification-action">
          <button type="button" data-action-id="${notification.id}">
            ${this.escapeHtml(notification.action.label)}
          </button>
        </div>
      `;
    }

    html += `</div>`;

    // Add dismiss button if dismissible
    if (notification.dismissible) {
      html += `
        <button class="notification-dismiss" 
                type="button" 
                aria-label="Dismiss notification"
                data-dismiss-id="${notification.id}">
          <i class="fas fa-times"></i>
        </button>
      `;
    }

    // Add progress bar if auto-dismiss
    if (notification.duration > 0) {
      html += `<div class="notification-progress" style="animation-duration: ${notification.duration}ms;"></div>`;
    }

    element.innerHTML = html;
    notification.element = element;

    // Add event listeners
    if (notification.dismissible) {
      const dismissBtn = element.querySelector('[data-dismiss-id]');
      dismissBtn.addEventListener('click', () => this.dismiss(notification.id));
    }

    if (notification.action) {
      const actionBtn = element.querySelector('[data-action-id]');
      actionBtn.addEventListener('click', () => {
        notification.action.callback();
        this.dismiss(notification.id);
      });
    }

    // Add to container
    this.container.appendChild(element);

    // Trigger animation
    requestAnimationFrame(() => {
      element.style.animation = element.style.animation;
    });
  }

  /**
   * Dismiss a notification
   * @param {number} id - Notification ID
   */
  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return;

    const notification = this.notifications[index];

    // Clear timeout if exists
    if (notification.timeout) {
      clearTimeout(notification.timeout);
    }

    // Animate out
    if (notification.element) {
      notification.element.classList.add('removing');
      setTimeout(() => {
        if (notification.element && notification.element.parentNode) {
          notification.element.remove();
        }
        this.notifications.splice(index, 1);
      }, 300);
    } else {
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    const ids = [...this.notifications].map(n => n.id);
    ids.forEach(id => this.dismiss(id));
  }

  /**
   * Get all notifications
   * @returns {Array} Array of notifications
   */
  getAll() {
    return [...this.notifications];
  }

  /**
   * Get notification by ID
   * @param {number} id - Notification ID
   * @returns {Object|null} Notification object or null
   */
  getById(id) {
    return this.notifications.find(n => n.id === id) || null;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show success notification
   * @param {string} message - Message
   * @param {Object} options - Options
   * @returns {number} Notification ID
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  /**
   * Show error notification
   * @param {string} message - Message
   * @param {Object} options - Options
   * @returns {number} Notification ID
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error', duration: options.duration || 6000 });
  }

  /**
   * Show warning notification
   * @param {string} message - Message
   * @param {Object} options - Options
   * @returns {number} Notification ID
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  /**
   * Show info notification
   * @param {string} message - Message
   * @param {Object} options - Options
   * @returns {number} Notification ID
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }
}

// Create global instance
const notificationManager = new NotificationManager();

// Export for ES6 modules
export { notificationManager, NotificationManager };

// Attach to window for global access
window.notificationManager = notificationManager;

/**
 * Global helper function for backward compatibility
 * @param {string} message - Message
 * @param {string} type - Type (success, error, warning, info)
 * @param {Object} options - Additional options
 */
export function showNotification(message, type = 'info', options = {}) {
  return notificationManager.show(message, { ...options, type });
}

// Attach to window for global access
window.showNotification = showNotification;
