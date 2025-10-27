/**
 * Notification Center
 * Manages notification history, persistence, and UI
 */

class NotificationCenter {
  constructor() {
    this.storageKey = 'salama_notifications_history';
    this.maxItems = 50;
    this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    this.history = [];
    this.init();
  }

  /**
   * Initialize the notification center
   */
  init() {
    this.loadHistory();
    this.cleanup();
  }

  /**
   * Load history from localStorage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.history = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notification history:', error);
      this.history = [];
    }
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('Error saving notification history:', error);
    }
  }

  /**
   * Add notification to history
   * @param {Object} notification - Notification object
   */
  addNotification(notification) {
    const item = {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      timestamp: new Date().toISOString(),
      read: false,
      action: notification.action || null
    };

    this.history.unshift(item); // Add to beginning

    // Keep only max items
    if (this.history.length > this.maxItems) {
      this.history = this.history.slice(0, this.maxItems);
    }

    this.saveHistory();
    this.updateBadge();
  }

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   */
  markAsRead(id) {
    const notification = this.history.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveHistory();
      this.updateBadge();
    }
  }

  /**
   * Mark notification as unread
   * @param {number} id - Notification ID
   */
  markAsUnread(id) {
    const notification = this.history.find(n => n.id === id);
    if (notification) {
      notification.read = false;
      this.saveHistory();
      this.updateBadge();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.history.forEach(n => n.read = true);
    this.saveHistory();
    this.updateBadge();
  }

  /**
   * Delete notification
   * @param {number} id - Notification ID
   */
  deleteNotification(id) {
    this.history = this.history.filter(n => n.id !== id);
    this.saveHistory();
    this.updateBadge();
  }

  /**
   * Delete all notifications
   */
  deleteAll() {
    this.history = [];
    this.saveHistory();
    this.updateBadge();
  }

  /**
   * Get all notifications
   * @returns {Array} Notifications
   */
  getAll() {
    return [...this.history];
  }

  /**
   * Get unread count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return this.history.filter(n => !n.read).length;
  }

  /**
   * Get notifications by type
   * @param {string} type - Type filter
   * @returns {Array} Filtered notifications
   */
  getByType(type) {
    if (type === 'all') return this.getAll();
    return this.history.filter(n => n.type === type);
  }

  /**
   * Search notifications
   * @param {string} query - Search query
   * @returns {Array} Matching notifications
   */
  search(query) {
    const q = query.toLowerCase();
    return this.history.filter(n => 
      n.message.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
  }

  /**
   * Cleanup old notifications
   */
  cleanup() {
    const now = Date.now();
    this.history = this.history.filter(n => {
      const age = now - new Date(n.timestamp).getTime();
      return age < this.maxAge;
    });
    this.saveHistory();
  }

  /**
   * Update badge count
   */
  updateBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      const count = this.getUnreadCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Format timestamp as relative time
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Relative time string
   */
  formatRelativeTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Get notification by ID
   * @param {number} id - Notification ID
   * @returns {Object|null} Notification or null
   */
  getById(id) {
    return this.history.find(n => n.id === id) || null;
  }

  /**
   * Clear old notifications (manual cleanup)
   */
  clearOld() {
    this.cleanup();
  }

  /**
   * Export notifications as JSON
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Import notifications from JSON
   * @param {string} json - JSON string
   */
  import(json) {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        this.history = data;
        this.saveHistory();
        this.updateBadge();
      }
    } catch (error) {
      console.error('Error importing notifications:', error);
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      total: this.history.length,
      unread: this.getUnreadCount(),
      success: this.history.filter(n => n.type === 'success').length,
      error: this.history.filter(n => n.type === 'error').length,
      warning: this.history.filter(n => n.type === 'warning').length,
      info: this.history.filter(n => n.type === 'info').length
    };
  }
}

// Create global instance
const notificationCenter = new NotificationCenter();

// Export for ES6 modules
export { notificationCenter, NotificationCenter };

// Attach to window for global access
window.notificationCenter = notificationCenter;
