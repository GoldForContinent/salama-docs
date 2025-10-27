# 📢 Dashboard Notifications - Complete Workflow Plan

## 🎯 Overview

This document outlines the complete notification workflow for the document recovery system, integrated with Supabase and the existing dashboard.

---

## 📊 Database Schema

### **notifications table**
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- message (TEXT)
- status (VARCHAR: 'unread', 'read', 'deleted')
- related_report_id (UUID, FK to reports)
- created_at (TIMESTAMP)
```

### **reports table** (existing)
```sql
- id (UUID, PK)
- user_id (UUID)
- report_type ('lost' or 'found')
- status ('active', 'potential_match', 'matched_successfully', 'payment_pending', 'completed')
- reward_amount (INTEGER)
- recovery_fee (INTEGER)
- collection_point (TEXT)
- created_at (TIMESTAMP)
```

### **recovered_reports table** (existing)
```sql
- id (UUID, PK)
- lost_report_id (UUID, FK)
- found_report_id (UUID, FK)
- status ('recovered', 'payment_pending', 'completed')
- created_at (TIMESTAMP)
```

### **transactions table** (existing)
```sql
- id (UUID, PK)
- report_id (UUID, FK)
- transaction_type ('recovery' or 'reward')
- amount (INTEGER)
- status ('pending', 'completed', 'failed')
- user_id (UUID)
- created_at (TIMESTAMP)
```

---

## 🔄 Complete Notification Workflow

### **Phase 1: Report Creation**

#### **1.1 Lost Report Created**
**Trigger**: User submits lost document report  
**Recipient**: Lost document owner  
**Notification**:
```
🔍 Search started for your lost [Document Type]. 
We'll notify you when we find a match.
```
**Status**: Unread  
**Related Report**: Lost report ID  

**Code Integration**:
```javascript
// In report creation handler
await notifyLostReportCreated(userId, reportId, documentType);
```

#### **1.2 Found Report Created**
**Trigger**: User submits found document report  
**Recipient**: Found document reporter  
**Notification**:
```
📋 Your found [Document Type] report has been registered. 
You'll be notified when the owner reports a lost document 
and we find a match.
```
**Status**: Unread  
**Related Report**: Found report ID  

**Code Integration**:
```javascript
// In report creation handler
await notifyFoundReportCreated(userId, reportId, documentType);
```

---

### **Phase 2: Automated Matching**

#### **2.1 Potential Match Found**
**Trigger**: System finds matching lost & found documents  
**Recipients**: Both lost and found report owners  
**For Lost Owner**:
```
✅ Potential match found! 
We've located a [Document Type] that matches your lost report. 
Please verify the document to confirm it's yours.
```
**For Found Owner**:
```
📦 Potential match found! 
The owner of the lost document will verify and proceed with recovery.
```
**Status**: Unread  
**Related Report**: Respective report IDs  

**Code Integration**:
```javascript
// In automatedMatching function
await notifyPotentialMatch(lostOwnerId, lostReportId, documentType);
await notifyPotentialMatch(foundOwnerId, foundReportId, documentType);
```

---

### **Phase 3: Verification & Payment (Lost Owner)**

#### **3.1 Verification Required**
**Trigger**: Potential match created  
**Recipient**: Lost document owner  
**Notification**:
```
✅ Potential match found! 
We've located a [Document Type] that matches your lost report. 
Please verify the document to confirm it's yours.
```
**Action**: Click to view verification modal  
**Status**: Unread  

#### **3.2 Verification Successful**
**Trigger**: Lost owner verifies document  
**Recipient**: Lost document owner  
**Notification**:
```
💰 Document verified! 
Pay KES [Amount] to receive the location of your document.
```
**Action**: Click to proceed with payment  
**Status**: Unread  

**Code Integration**:
```javascript
// In verifyDocuments function
await notifyPaymentRequired(userId, reportId, recoveryFee);
```

#### **3.3 Payment Completed**
**Trigger**: Payment transaction completed  
**Recipient**: Lost document owner  
**Notification**:
```
📍 Payment received! 
Check the "Recovered" section to see the location of your document.
```
**Action**: Click to view recovered section  
**Status**: Unread  

**Code Integration**:
```javascript
// In processPayment function
await notifyLocationRevealed(userId, reportId);
```

#### **3.4 Payment Failed**
**Trigger**: Payment transaction failed  
**Recipient**: Lost document owner  
**Notification**:
```
❌ Payment failed. [Reason]. 
Please try again.
```
**Status**: Unread  

**Code Integration**:
```javascript
// In payment error handler
await notifyPaymentFailed(userId, reportId, errorReason);
```

---

### **Phase 4: Collection & Reward (Found Owner)**

#### **4.1 Document Verified - Take to Collection Point**
**Trigger**: Lost owner verifies document  
**Recipient**: Found document reporter  
**Notification**:
```
📦 Document verified by owner! 
Please take the document to: [Collection Point]
```
**Action**: Click to view details  
**Status**: Unread  

**Code Integration**:
```javascript
// In verifyDocuments function
const foundReport = await getFoundReport(recoveredReportId);
await notifyTakeToCollectionPoint(
  foundReport.user_id, 
  foundReport.id, 
  collectionPoint
);
```

#### **4.2 Reward Available - Claim Now**
**Trigger**: Lost owner pays recovery fee  
**Recipient**: Found document reporter  
**Notification**:
```
🎉 Congratulations! 
You've earned KES [Reward Amount] reward. 
Click here to claim your reward.
```
**Action**: Click to claim reward  
**Status**: Unread  

**Code Integration**:
```javascript
// In processPayment function
const foundReport = await getFoundReport(recoveredReportId);
await notifyRewardAvailable(
  foundReport.user_id, 
  foundReport.id, 
  rewardAmount
);
```

#### **4.3 Reward Claimed**
**Trigger**: Found owner claims reward  
**Recipient**: Found document reporter  
**Notification**:
```
✨ Reward of KES [Amount] claimed successfully! 
Funds will be sent to your phone.
```
**Status**: Unread  

**Code Integration**:
```javascript
// In reward claiming handler
await notifyRewardClaimed(userId, reportId, rewardAmount);
```

---

### **Phase 5: Completion**

#### **5.1 Recovery Complete**
**Trigger**: Both parties complete all steps  
**Recipients**: Both lost and found owners  
**Notification**:
```
🎊 Document recovery complete! 
Thank you for using Salama Docs.
```
**Status**: Unread  

**Code Integration**:
```javascript
// When recovered_reports status = 'completed'
await notifyRecoveryComplete(lostOwnerId, lostReportId);
await notifyRecoveryComplete(foundOwnerId, foundReportId);
```

---

## 🔌 Integration Points

### **1. Report Creation** (reportlost.html / reportfound.html)
```javascript
import { notifyLostReportCreated, notifyFoundReportCreated } from './dashboard-notifications.js';

// After successful report creation
await notifyLostReportCreated(userId, reportId, documentType);
```

### **2. Automated Matching** (dashboard.js - automatedMatching)
```javascript
import { notifyPotentialMatch } from './dashboard-notifications.js';

// When match found
await notifyPotentialMatch(lostOwnerId, lostReportId, documentType);
await notifyPotentialMatch(foundOwnerId, foundReportId, documentType);
```

### **3. Verification** (dashboard.js - verifyDocuments)
```javascript
import { notifyPaymentRequired, notifyTakeToCollectionPoint } from './dashboard-notifications.js';

// After verification
await notifyPaymentRequired(lostOwnerId, reportId, recoveryFee);
await notifyTakeToCollectionPoint(foundOwnerId, foundReportId, collectionPoint);
```

### **4. Payment** (dashboard.js - processPayment)
```javascript
import { notifyLocationRevealed, notifyRewardAvailable } from './dashboard-notifications.js';

// After successful payment
await notifyLocationRevealed(lostOwnerId, reportId);
await notifyRewardAvailable(foundOwnerId, foundReportId, rewardAmount);
```

### **5. Reward Claim** (dashboard.js - reward claiming)
```javascript
import { notifyRewardClaimed } from './dashboard-notifications.js';

// After reward claimed
await notifyRewardClaimed(userId, reportId, rewardAmount);
```

---

## 🎨 UI Components

### **Notification Bell** (Top Right)
- Shows unread count
- Click to open notification center
- Real-time badge updates

### **Notification Center Modal**
- List of all notifications
- Filter by status (unread, read, all)
- Search functionality
- Mark as read/unread
- Delete notifications
- Related report link

### **Toast Notifications**
- Appear when new notification created
- Auto-dismiss after 5 seconds
- Type-based colors (info, warning, success, error)

---

## 🔄 Real-time Features

### **Real-time Listeners**
```javascript
// Listen for new notifications
supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update badge
    // Show toast
    // Refresh list
  })
  .subscribe();
```

### **Badge Updates**
- Real-time unread count
- Updates when notification created
- Updates when marked as read

---

## 📱 Mobile Responsive

- Full-screen notification center on mobile
- Touch-friendly buttons
- Optimized spacing
- Readable fonts

---

## ♿ Accessibility

- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management

---

## 🧪 Testing Checklist

- [ ] Lost report notification created
- [ ] Found report notification created
- [ ] Potential match notifications created
- [ ] Payment required notification created
- [ ] Location revealed notification created
- [ ] Collection point notification created
- [ ] Reward available notification created
- [ ] Reward claimed notification created
- [ ] Recovery complete notification created
- [ ] Badge updates in real-time
- [ ] Notifications persist in database
- [ ] Mark as read works
- [ ] Delete works
- [ ] Search works
- [ ] Filter works
- [ ] Mobile responsive

---

## 📊 Notification Types Summary

| Event | Lost Owner | Found Owner | Type | Action |
|-------|-----------|-----------|------|--------|
| Report Created | ✅ | ✅ | info | View report |
| Match Found | ✅ | ✅ | warning | Verify/Proceed |
| Verification Done | ✅ | ✅ | warning | Pay/Take to point |
| Payment Required | ✅ | ❌ | warning | Pay now |
| Payment Success | ✅ | ✅ | success | View location/Claim |
| Reward Available | ❌ | ✅ | success | Claim reward |
| Reward Claimed | ❌ | ✅ | success | View status |
| Complete | ✅ | ✅ | success | Done |

---

## 🚀 Implementation Steps

1. **Create notifications table** in Supabase
2. **Import dashboard-notifications.js** in dashboard.js
3. **Add notification calls** at each workflow step
4. **Update notification center UI** to show Supabase notifications
5. **Setup real-time listeners** for badge updates
6. **Test complete workflow**
7. **Deploy to production**

---

## 📝 Notes

- All notifications stored in Supabase for persistence
- Real-time updates via Supabase subscriptions
- Toast notifications for immediate feedback
- Notification center for history and management
- Workflow-specific messages for clarity
- Related report ID for easy navigation

---

**Status**: Ready for implementation
