# 🔧 Dashboard Notifications - Implementation Guide

## 📋 Overview

This guide shows how to integrate the dashboard notification system into your existing code.

---

## 🚀 Quick Start

### **1. Import the Service**

Add to `dashboard.js`:
```javascript
import { 
  dashboardNotificationsService,
  notifyLostReportCreated,
  notifyFoundReportCreated,
  notifyPotentialMatch,
  notifyPaymentRequired,
  notifyLocationRevealed,
  notifyTakeToCollectionPoint,
  notifyRewardAvailable,
  notifyRewardClaimed,
  notifyRecoveryComplete
} from './dashboard-notifications.js';
```

### **2. Initialize Service**

In the dashboard initialization:
```javascript
// After user is loaded
await dashboardNotificationsService.init(currentUser);
```

### **3. Add Notification Calls**

Add notification calls at each workflow step (see below).

---

## 📍 Integration Points

### **Point 1: Lost Report Creation**

**File**: `reportlost.html` or report creation handler  
**Location**: After successful report insertion

```javascript
// After report is created in Supabase
const { data: report } = await supabase
  .from('reports')
  .insert({
    user_id: currentUser.id,
    report_type: 'lost',
    // ... other fields
  })
  .select()
  .single();

// Add this notification
await notifyLostReportCreated(
  currentUser.id,
  report.id,
  report.document_type // e.g., 'National ID'
);
```

---

### **Point 2: Found Report Creation**

**File**: `reportfound.html` or report creation handler  
**Location**: After successful report insertion

```javascript
// After report is created in Supabase
const { data: report } = await supabase
  .from('reports')
  .insert({
    user_id: currentUser.id,
    report_type: 'found',
    // ... other fields
  })
  .select()
  .single();

// Add this notification
await notifyFoundReportCreated(
  currentUser.id,
  report.id,
  report.document_type
);
```

---

### **Point 3: Automated Matching**

**File**: `dashboard.js`  
**Function**: `automatedMatching()`  
**Location**: After match is found and inserted into recovered_reports

```javascript
// In automatedMatching function, after creating match
if (matches.length > 0) {
  for (const match of matches) {
    // Get the other report
    const otherReport = reports.find(r => 
      r.report_type !== match.report_type && 
      r.document_type === match.document_type &&
      r.document_number === match.document_number
    );

    if (otherReport) {
      // Notify lost owner
      await notifyPotentialMatch(
        match.user_id,
        match.id,
        match.document_type
      );

      // Notify found owner
      await notifyPotentialMatch(
        otherReport.user_id,
        otherReport.id,
        otherReport.document_type
      );

      // Insert into recovered_reports
      await supabase.from('recovered_reports').insert({
        lost_report_id: match.report_type === 'lost' ? match.id : otherReport.id,
        found_report_id: match.report_type === 'found' ? match.id : otherReport.id,
        status: 'recovered'
      });
    }
  }
}
```

---

### **Point 4: Document Verification**

**File**: `dashboard.js`  
**Function**: `verifyDocuments()`  
**Location**: After verification is successful

```javascript
// In verifyDocuments function, after update to payment_pending
await supabase
  .from('recovered_reports')
  .update({ status: 'payment_pending' })
  .eq('id', recovered.id);

// Notify lost owner to pay
await notifyPaymentRequired(
  lostReport.user_id,
  recovered.lost_report_id,
  lostReport.recovery_fee
);

// Notify found owner to take to collection point
await notifyTakeToCollectionPoint(
  foundReport.user_id,
  recovered.found_report_id,
  lostReport.collection_point
);
```

---

### **Point 5: Payment Processing**

**File**: `dashboard.js` or `payments.js`  
**Function**: `processPayment()`  
**Location**: After payment transaction is completed

```javascript
// In processPayment function, after successful payment
await supabase
  .from('recovered_reports')
  .update({ status: 'completed' })
  .eq('id', recovered.id);

// Notify lost owner - location revealed
await notifyLocationRevealed(
  lostReport.user_id,
  recovered.lost_report_id
);

// Notify found owner - reward available
await notifyRewardAvailable(
  foundReport.user_id,
  recovered.found_report_id,
  foundReport.reward_amount
);
```

---

### **Point 6: Reward Claiming**

**File**: `dashboard.js`  
**Function**: Reward claim handler  
**Location**: After reward transaction is created

```javascript
// After reward transaction is inserted
await supabase.from('transactions').insert({
  report_id: reportId,
  transaction_type: 'reward',
  status: 'completed',
  amount: rewardAmount,
  user_id: currentUser.id
});

// Notify found owner - reward claimed
await notifyRewardClaimed(
  currentUser.id,
  reportId,
  rewardAmount
);
```

---

### **Point 7: Recovery Completion**

**File**: `dashboard.js`  
**Location**: When recovered_reports status becomes 'completed'

```javascript
// After both parties complete their actions
await notifyRecoveryComplete(
  lostReport.user_id,
  recovered.lost_report_id
);

await notifyRecoveryComplete(
  foundReport.user_id,
  recovered.found_report_id
);
```

---

## 🔌 Update Notification Center UI

### **Modify notification-center-ui.js**

Update the `renderNotification()` method to fetch from Supabase:

```javascript
/**
 * Render notifications from Supabase
 */
async render(searchQuery = '') {
  const list = document.getElementById('notificationList');
  if (!list) return;

  try {
    // Fetch from Supabase
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    // Apply filter
    if (this.currentFilter !== 'all') {
      query = query.eq('status', this.currentFilter);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Apply search
    let filtered = notifications;
    if (searchQuery) {
      filtered = notifications.filter(n =>
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="notification-center-empty">
          <i class="fas fa-inbox"></i>
          <h3>No notifications</h3>
          <p>${searchQuery ? 'No matching notifications found' : 'You're all caught up!'}</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(notif => this.renderNotification(notif)).join('');
    this.attachItemListeners();
  } catch (error) {
    console.error('Error rendering notifications:', error);
  }
}

/**
 * Render single notification from Supabase
 */
renderNotification(notification) {
  const relativeTime = this.formatRelativeTime(notification.created_at);
  const isUnread = notification.status === 'unread';

  return `
    <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
      <div class="notification-item-icon">
        <i class="fas fa-bell"></i>
      </div>
      <div class="notification-item-content">
        <p class="notification-item-message">${this.escapeHtml(notification.message)}</p>
        <p class="notification-item-time">${relativeTime}</p>
      </div>
      <div class="notification-item-actions">
        ${isUnread ? `
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
      ${isUnread ? '<div class="notification-item-unread-indicator"></div>' : ''}
    </div>
  `;
}
```

---

## 📊 Error Handling

### **Add Error Notifications**

```javascript
// Payment failed
catch (error) {
  console.error('Payment error:', error);
  await notifyPaymentFailed(
    currentUser.id,
    reportId,
    'Please check your phone number and try again.'
  );
}

// Verification failed
catch (error) {
  console.error('Verification error:', error);
  await notifyVerificationFailed(currentUser.id, reportId);
}

// Match not confirmed (timeout)
if (timeoutOccurred) {
  await notifyMatchNotConfirmed(userId, reportId);
}
```

---

## 🧪 Testing

### **Test Lost Report Flow**
1. Create lost report
2. Check notification created in Supabase
3. Check badge updated
4. Check toast shown
5. Check notification center displays it

### **Test Match Flow**
1. Create lost and found reports
2. Run automated matching
3. Check both users get notifications
4. Check badge counts correct

### **Test Payment Flow**
1. Verify document
2. Check payment notification created
3. Process payment
4. Check location revealed notification
5. Check reward available notification

### **Test Reward Flow**
1. Claim reward
2. Check reward claimed notification
3. Check status updated

---

## 📝 Notes

- All notifications stored in Supabase
- Real-time updates via Supabase subscriptions
- Toast notifications for immediate feedback
- Notification center for history
- Related report ID for navigation
- Workflow-specific messages

---

## 🚀 Deployment Checklist

- [ ] Create notifications table in Supabase
- [ ] Import dashboard-notifications.js
- [ ] Add notification calls at each step
- [ ] Update notification center UI
- [ ] Setup real-time listeners
- [ ] Test complete workflow
- [ ] Test error scenarios
- [ ] Deploy to production

---

**Status**: Ready for implementation
