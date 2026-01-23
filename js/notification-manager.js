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
    const index = this.notifications.findIndex(n => String(n.id) === String(id));
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
    return this.notifications.find(n => String(n.id) === String(id)) || null;
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

  // ==================== WORKFLOW NOTIFICATION METHODS ====================

  /**
   * Notify owner verification result
   * @param {string} matchId - Match ID
   * @param {boolean} isVerified - Verification result
   * @param {string} verificationNotes - Optional notes
   */
  static async notifyOwnerVerification(matchId, isVerified, verificationNotes = '') {
    try {
      console.log(`🔍 Processing owner verification for match ${matchId}: ${isVerified}`);
      
      // Get match details with reports
      const { data: match, error: matchError } = await supabase
        .from('recovered_reports')
        .select(`
          *,
          lost_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number)
          ),
          found_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number),
            collection_point
          )
        `)
        .eq('id', matchId)
        .single();
      
      if (matchError) throw matchError;
      
      const lostReport = match.lost_reports;
      const foundReport = match.found_reports;
      const lostDoc = lostReport.report_documents[0];
      const foundDoc = foundReport.report_documents[0];
      
      if (isVerified) {
        // Update recovered_reports status
        await supabase
          .from('recovered_reports')
          .update({ 
            status: 'payment_pending',
            updated_at: new Date()
          })
          .eq('id', matchId);
        
        // Update both reports status
        await supabase
          .from('reports')
          .update({ 
            status: 'matched_successfully',
            updated_at: new Date()
          })
          .eq('id', lostReport.id);
        
        await supabase
          .from('reports')
          .update({ 
            status: 'matched_successfully',
            updated_at: new Date()
          })
          .eq('id', foundReport.id);
        
        // Notify OWNER - verification successful
        await this.createWorkflowNotification(
          lostReport.user_id,
          `✅ Verification successful! Your ${lostDoc.document_type} has been confirmed. ` +
          `Please wait for collection point notification.`,
          'success',
          {
            action: 'view_collection_info',
            actionData: { 
              recovered_report_id: matchId,
              verification_status: 'verified'
            }
          },
          lostReport.id
        );
        
        // Notify FINDER - owner verified, take to collection
        await this.createWorkflowNotification(
          foundReport.user_id,
          `✅ Owner verification successful! ` +
          `Please take the ${foundDoc.document_type} to: ${foundReport.collection_point}.`,
          'success',
          {
            action: 'view_collection_point',
            actionData: { 
              recovered_report_id: matchId,
              collection_point: foundReport.collection_point
            }
          },
          foundReport.id
        );
        
        console.log('✅ Owner verification notifications sent');
        
      } else {
        // Verification failed - reset to searching
        await supabase
          .from('recovered_reports')
          .update({ 
            status: 'recovered',
            updated_at: new Date()
          })
          .eq('id', matchId);
        
        // Update both reports back to active
        await supabase
          .from('reports')
          .update({ 
            status: 'active',
            matched_report_id: null,
            updated_at: new Date()
          })
          .eq('id', lostReport.id);
        
        await supabase
          .from('reports')
          .update({ 
            status: 'active',
            matched_report_id: null,
            updated_at: new Date()
          })
          .eq('id', foundReport.id);
        
        // Notify both parties - verification failed
        await this.createWorkflowNotification(
          lostReport.user_id,
          `❌ Verification failed. The document doesn't match yours. ` +
          `We'll continue searching for your ${lostDoc.document_type}.`,
          'warning',
          {
            action: 'view_reports',
            actionData: { verification_status: 'failed' }
          },
          lostReport.id
        );
        
        await this.createWorkflowNotification(
          foundReport.user_id,
          `❌ Owner verification failed. ` +
          `We'll continue searching for the owner of the ${foundDoc.document_type}.`,
          'warning',
          {
            action: 'view_reports',
            actionData: { verification_status: 'failed' }
          },
          foundReport.id
        );
        
        console.log('❌ Verification failure notifications sent');
      }
      
    } catch (error) {
      console.error('❌ Error in owner verification notification:', error);
    }
  }

  /**
   * Notify document delivered to collection point
   * @param {string} matchId - Match ID
   * @param {Object} collectionDetails - Collection point details
   */
  static async notifyDocumentAtCollection(matchId, collectionDetails) {
    try {
      console.log(`📦 Document delivered to collection point for match ${matchId}`);
      
      // Get match details
      const { data: match, error: matchError } = await supabase
        .from('recovered_reports')
        .select(`
          *,
          lost_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number)
          ),
          found_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number)
          )
        `)
        .eq('id', matchId)
        .single();
      
      if (matchError) throw matchError;
      
      const lostReport = match.lost_reports;
      const foundReport = match.found_reports;
      const lostDoc = lostReport.report_documents[0];
      
      // Update delivery status
      await supabase
        .from('reports')
        .update({ 
          delivery_status: 'unclaimed_verified',
          updated_at: new Date()
        })
        .eq('id', foundReport.id);
      
      // Notify OWNER - payment required to reveal location
      await this.createWorkflowNotification(
        lostReport.user_id,
        `💰 To reveal collection point location for your ${lostDoc.document_type}, ` +
        `please complete payment of KES ${lostReport.recovery_fee || 200}.`,
        'payment',
        {
          action: 'make_payment',
          actionData: { 
            recovered_report_id: matchId,
            amount: lostReport.recovery_fee || 200
          }
        },
        lostReport.id
      );
      
      // Notify FINDER - document is at collection point
      await this.createWorkflowNotification(
        foundReport.user_id,
        `✅ Your ${foundDoc.document_type} has been delivered to the collection point. ` +
        `Waiting for owner payment and collection.`,
        'info',
        {
          action: 'view_status',
          actionData: { 
            recovered_report_id: matchId,
            status: 'at_collection_point'
          }
        },
        foundReport.id
      );
      
      console.log('✅ Collection point notifications sent');
      
    } catch (error) {
      console.error('❌ Error in collection point notification:', error);
    }
  }

  /**
   * Notify payment successful
   * @param {string} matchId - Match ID
   * @param {Object} paymentDetails - Payment details
   */
  static async notifyPaymentSuccess(matchId, paymentDetails) {
    try {
      console.log(`💰 Payment successful for match ${matchId}`);
      
      // Get match details
      const { data: match, error: matchError } = await supabase
        .from('recovered_reports')
        .select(`
          *,
          lost_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number),
            collection_point
          ),
          found_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number)
          )
        `)
        .eq('id', matchId)
        .single();
      
      if (matchError) throw matchError;
      
      const lostReport = match.lost_reports;
      const foundReport = match.found_reports;
      const lostDoc = lostReport.report_documents[0];
      
      // Update recovered_reports status
      await supabase
        .from('recovered_reports')
        .update({ 
          status: 'completed',
          updated_at: new Date()
        })
        .eq('id', matchId);
      
      // Notify OWNER - location revealed
      await this.createWorkflowNotification(
        lostReport.user_id,
        `✅ Payment received! Go to: ${lostReport.collection_point}. ` +
        `Your ${lostDoc.document_type} is ready for collection. ` +
        `Contact the collection point for assistance.`,
        'success',
        {
          action: 'view_location',
          actionData: { 
            recovered_report_id: matchId,
            collection_point: lostReport.collection_point
          }
        },
        lostReport.id
      );
      
      // Notify FINDER - can claim reward
      await this.createWorkflowNotification(
        foundReport.user_id,
        `🎁 Owner payment completed! You can now claim your reward of KES ${foundReport.reward_amount || 500}.`,
        'success',
        {
          action: 'claim_reward',
          actionData: { 
            recovered_report_id: matchId,
            amount: foundReport.reward_amount || 500
          }
        },
        foundReport.id
      );
      
      console.log('✅ Payment success notifications sent');
      
    } catch (error) {
      console.error('❌ Error in payment success notification:', error);
    }
  }

  /**
   * Notify reward claimed
   * @param {string} matchId - Match ID
   * @param {Object} rewardDetails - Reward details
   */
  static async notifyRewardClaimed(matchId, rewardDetails) {
    try {
      console.log(`🎉 Reward claimed for match ${matchId}`);
      
      // Get match details
      const { data: match, error: matchError } = await supabase
        .from('recovered_reports')
        .select(`
          *,
          found_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number)
          )
        `)
        .eq('id', matchId)
        .single();
      
      if (matchError) throw matchError;
      
      const foundReport = match.found_reports;
      const foundDoc = foundReport.report_documents[0];
      
      // Update recovered_reports
      await supabase
        .from('recovered_reports')
        .update({ 
          reward_claimed: true,
          updated_at: new Date()
        })
        .eq('id', matchId);
      
      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          report_id: foundReport.id,
          transaction_type: 'reward',
          amount: rewardDetails.amount || foundReport.reward_amount || 500,
          phone_number: foundReport.phone,
          status: 'pending',
          user_id: foundReport.user_id,
          notes: `Reward for ${foundDoc.document_type} recovery`,
          provider: 'airtime'
        });
      
      // Notify FINDER - reward processing
      await this.createWorkflowNotification(
        foundReport.user_id,
        `🎉 Reward of KES ${rewardDetails.amount || foundReport.reward_amount || 500} claimed! ` +
        `Airtime will be processed within 24 hours.`,
        'success',
        {
          action: 'view_transactions',
          actionData: { 
            recovered_report_id: matchId,
            transaction_type: 'reward'
          }
        },
        foundReport.id
      );
      
      console.log('✅ Reward claimed notification sent');
      
    } catch (error) {
      console.error('❌ Error in reward claimed notification:', error);
    }
  }

  /**
   * Notify document collected
   * @param {string} matchId - Match ID
   */
  static async notifyDocumentCollected(matchId) {
    try {
      console.log(`📦 Document collected for match ${matchId}`);
      
      // Get match details
      const { data: match, error: matchError } = await supabase
        .from('recovered_reports')
        .select(`
          *,
          lost_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number)
          ),
          found_reports!inner(
            id, user_id, full_name, phone, email,
            report_documents!inner(document_type, document_number)
          )
        `)
        .eq('id', matchId)
        .single();
      
      if (matchError) throw matchError;
      
      const lostReport = match.lost_reports;
      const foundReport = match.found_reports;
      const lostDoc = lostReport.report_documents[0];
      
      // Update delivery status
      await supabase
        .from('reports')
        .update({ 
          delivery_status: 'claimed',
          status: 'completed',
          updated_at: new Date()
        })
        .eq('id', lostReport.id);
      
      await supabase
        .from('reports')
        .update({ 
          status: 'completed',
          updated_at: new Date()
        })
        .eq('id', foundReport.id);
      
      // Notify OWNER - collection complete
      await this.createWorkflowNotification(
        lostReport.user_id,
        `📦 Your ${lostDoc.document_type} has been collected! ` +
        `Thank you for using Salama Docs.`,
        'success',
        {
          action: 'view_history',
          actionData: { 
            recovered_report_id: matchId,
            status: 'completed'
          }
        },
        lostReport.id
      );
      
      console.log('✅ Document collected notification sent');
      
    } catch (error) {
      console.error('❌ Error in document collected notification:', error);
    }
  }

  /**
   * Helper function to create workflow notifications
   * @param {string} userId - User ID
   * @param {string} message - Message
   * @param {string} type - Notification type
   * @param {Object} actionData - Action data
   * @param {string} relatedReportId - Related report ID
   */
  static async createWorkflowNotification(userId, message, type = 'info', actionData = null, relatedReportId = null) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: message,
          type: type,
          notification_action: actionData?.action || null,
          action_data: actionData?.actionData || null,
          related_report_id: relatedReportId,
          status: 'unread',
          created_at: new Date()
        })
        .select();

      if (error) {
        console.error('❌ Failed to create workflow notification:', error);
        return null;
      }

      console.log('✅ Workflow notification created:', data[0]);
      return data[0];

    } catch (error) {
      console.error('❌ Error creating workflow notification:', error);
      return null;
    }
  }
}

// Create global instance
const notificationManager = new NotificationManager();

// Notifications are now handled by UnifiedNotificationSystem
// Toast notifications are handled separately from persistent notifications

// Export for ES6 modules
export { notificationManager, NotificationManager };

// Make workflow notification methods available globally for admin dashboard
window.WorkflowNotificationManager = {
  notifyOwnerVerification: NotificationManager.notifyOwnerVerification,
  notifyDocumentAtCollection: NotificationManager.notifyDocumentAtCollection,
  notifyPaymentSuccess: NotificationManager.notifyPaymentSuccess,
  notifyRewardClaimed: NotificationManager.notifyRewardClaimed,
  notifyDocumentCollected: NotificationManager.notifyDocumentCollected
};

// Attach to window for global access (toast notifications only)
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
