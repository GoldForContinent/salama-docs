/**
 * Dashboard Notifications Service
 * Handles all notifications for the document recovery workflow
 * Integrates with Supabase notifications table
 */

import { supabase } from './supabase.js';

class DashboardNotificationsService {
  constructor() {
    this.currentUser = null;
    this.subscriptions = [];
  }

  /**
   * Initialize the notification service
   * @param {Object} user - Current user object
   */
  async init(user) {
    this.currentUser = user;
    if (user) {
      await this.setupRealtimeListeners();
      await this.loadUnreadCount();
    }
  }

  /**
   * Create a notification in Supabase
   * @param {string} userId - User ID
   * @param {string} message - Notification message
   * @param {string} type - Notification type (for UI)
   * @param {string} reportId - Related report ID (optional)
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(userId, message, type = 'info', reportId = null) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: message,
          status: 'unread',
          related_report_id: reportId
        })
        .select()
        .single();

      if (error) throw error;

      // Also show toast notification
      if (window.notificationManager) {
        window.notificationManager[type](message);
      }

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) throw error;
      await this.loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('user_id', this.currentUser.id)
        .eq('status', 'unread');

      if (error) throw error;
      await this.loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'deleted' })
        .eq('id', notificationId);

      if (error) throw error;
      await this.loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Get unread count
   */
  async loadUnreadCount() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', this.currentUser.id)
        .eq('status', 'unread');

      if (error) throw error;

      const count = data?.length || 0;
      this.updateBadge(count);
      return count;
    } catch (error) {
      console.error('Error loading unread count:', error);
      return 0;
    }
  }

  /**
   * Update badge count in UI
   */
  updateBadge(count) {
    const badge = document.getElementById('topNotificationCount');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  /**
   * Setup real-time listeners for notifications
   */
  async setupRealtimeListeners() {
    if (!this.currentUser) return;

    // Listen for new notifications
    const subscription = supabase
      .channel(`notifications:${this.currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          this.handleNewNotification(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  /**
   * Handle new notification
   */
  handleNewNotification(notification) {
    // Update badge
    this.loadUnreadCount();

    // Show toast if notification manager available
    if (window.notificationManager) {
      window.notificationManager.info(notification.message);
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup() {
    this.subscriptions.forEach(sub => {
      supabase.removeChannel(sub);
    });
    this.subscriptions = [];
  }
}

// Create global instance
const dashboardNotificationsService = new DashboardNotificationsService();

export { dashboardNotificationsService, DashboardNotificationsService };
window.dashboardNotificationsService = dashboardNotificationsService;

/**
 * Workflow-specific notification creators
 */

/**
 * Notify lost report owner that search has started
 */
export async function notifyLostReportCreated(userId, reportId, documentType) {
  const message = `🔍 Search started for your lost ${documentType}. We'll notify you when we find a match.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'info',
    reportId
  );
}

/**
 * Notify found report owner about potential matches
 */
export async function notifyFoundReportCreated(userId, reportId, documentType) {
  const message = `📋 Your found ${documentType} report has been registered. You'll be notified when the owner reports a lost document and we find a match.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'info',
    reportId
  );
}

/**
 * Notify lost owner of potential match
 */
export async function notifyPotentialMatch(userId, reportId, documentType) {
  const message = `✅ Potential match found! We've located a ${documentType} that matches your lost report. Please verify the document to confirm it's yours.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'warning',
    reportId
  );
}

/**
 * Notify lost owner of payment required
 * Fetches actual recovery fee from report
 */
export async function notifyPaymentRequired(userId, reportId) {
  try {
    // Fetch the report to get recovery fee
    const { data: report, error } = await supabase
      .from('reports')
      .select('recovery_fee, document_type')
      .eq('id', reportId)
      .single();

    if (error) throw error;

    const amount = report?.recovery_fee || 0;
    const docType = report?.document_type || 'document';
    
    const message = `💰 Document verified! Pay KES ${amount} to receive the location of your ${docType}.`;
    return dashboardNotificationsService.createNotification(
      userId,
      message,
      'warning',
      reportId
    );
  } catch (error) {
    console.error('Error creating payment notification:', error);
    return null;
  }
}

/**
 * Notify lost owner of payment success and location revealed
 */
export async function notifyLocationRevealed(userId, reportId) {
  const message = `📍 Payment received! Check the "Recovered" section to see the location of your document.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'success',
    reportId
  );
}

/**
 * Notify found owner to take document to collection point
 */
export async function notifyTakeToCollectionPoint(userId, reportId, collectionPoint) {
  const message = `📦 Document verified by owner! Please take the document to: ${collectionPoint}`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'info',
    reportId
  );
}

/**
 * Notify found owner of reward available
 * Fetches actual reward amount from report
 */
export async function notifyRewardAvailable(userId, reportId) {
  try {
    // Fetch the report to get reward amount
    const { data: report, error } = await supabase
      .from('reports')
      .select('reward_amount, document_type')
      .eq('id', reportId)
      .single();

    if (error) throw error;

    const rewardAmount = report?.reward_amount || 0;
    const docType = report?.document_type || 'document';
    
    const message = `🎉 Congratulations! You've earned KES ${rewardAmount} reward for the ${docType}. Click here to claim your reward.`;
    return dashboardNotificationsService.createNotification(
      userId,
      message,
      'success',
      reportId
    );
  } catch (error) {
    console.error('Error creating reward notification:', error);
    return null;
  }
}

/**
 * Notify found owner of reward claimed
 * Fetches actual reward amount from report
 */
export async function notifyRewardClaimed(userId, reportId) {
  try {
    // Fetch the report to get reward amount
    const { data: report, error } = await supabase
      .from('reports')
      .select('reward_amount')
      .eq('id', reportId)
      .single();

    if (error) throw error;

    const rewardAmount = report?.reward_amount || 0;
    
    const message = `✨ Reward of KES ${rewardAmount} claimed successfully! Funds will be sent to your phone.`;
    return dashboardNotificationsService.createNotification(
      userId,
      message,
      'success',
      reportId
    );
  } catch (error) {
    console.error('Error creating reward claimed notification:', error);
    return null;
  }
}

/**
 * Notify on document recovery completion
 */
export async function notifyRecoveryComplete(userId, reportId) {
  const message = `🎊 Document recovery complete! Thank you for using Salama Docs.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'success',
    reportId
  );
}

/**
 * Notify on verification failure
 */
export async function notifyVerificationFailed(userId, reportId) {
  const message = `❌ Document verification failed. Please try again or contact support.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'error',
    reportId
  );
}

/**
 * Notify on payment failure
 */
export async function notifyPaymentFailed(userId, reportId, reason = '') {
  const message = `❌ Payment failed. ${reason} Please try again.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'error',
    reportId
  );
}

/**
 * Notify on match not confirmed
 */
export async function notifyMatchNotConfirmed(userId, reportId) {
  const message = `⏰ Match verification timeout. The potential match has been cancelled.`;
  return dashboardNotificationsService.createNotification(
    userId,
    message,
    'warning',
    reportId
  );
}
