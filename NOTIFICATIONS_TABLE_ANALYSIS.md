# 🔍 Notifications Table Analysis & Recommendations

## ✅ Your Current Schema

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'unread',
  related_report_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_related_report_id_fkey FOREIGN KEY (related_report_id) REFERENCES reports(id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_status_check CHECK (status IN ('unread', 'read', 'deleted'))
);
```

---

## 📊 Analysis: What's Good & What's Missing

### ✅ **What's Good**

| Field | Why It Works |
|-------|-------------|
| **id** | Unique identifier, proper UUID |
| **user_id** | Links to user, enables filtering |
| **message** | Stores notification text |
| **status** | Tracks read/unread state |
| **related_report_id** | Links to report for context |
| **created_at** | Timestamps for sorting |
| **Constraints** | Proper foreign keys and validation |

---

### ❌ **What's Missing for Your Workflow**

| Field | Why Needed | Impact |
|-------|-----------|--------|
| **type** | Categorize notifications (info, warning, success, error) | UI rendering, filtering, analytics |
| **notification_action** | Define what action user should take | Navigation, UX flow |
| **action_data** | Store parameters for actions | Pass data to modals/pages |
| **read_at** | Track when notification was read | Analytics, user experience |
| **priority** | High/medium/low for sorting | Show important notifications first |
| **expires_at** | Auto-delete old notifications | Data cleanup, storage management |

---

## 🎯 Recommended Enhanced Schema

```sql
CREATE TABLE public.notifications (
  -- Core Fields (EXISTING)
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'unread',
  related_report_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- NEW: Notification Type & Categorization
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',
  
  -- NEW: Action Handling
  notification_action VARCHAR(50) NULL,
  action_data JSONB NULL,
  
  -- NEW: Tracking
  read_at TIMESTAMP WITH TIME ZONE NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Constraints
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_related_report_id_fkey FOREIGN KEY (related_report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT notifications_status_check CHECK (status IN ('unread', 'read', 'deleted')),
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'warning', 'success', 'error')),
  CONSTRAINT notifications_priority_check CHECK (priority IN ('low', 'medium', 'high'))
);

-- Indexes for Performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
```

---

## 🆕 New Fields Explained

### **1. type** (VARCHAR 20)
**Purpose**: Categorize notification type for UI rendering and filtering

**Values**:
- `'info'` - General information (blue)
- `'warning'` - Action required (orange)
- `'success'` - Positive outcome (green)
- `'error'` - Problem occurred (red)

**Examples**:
```
type: 'info'     → "🔍 Search started for your lost National ID"
type: 'warning'  → "✅ Potential match found! Please verify"
type: 'warning'  → "💰 Document verified! Pay KES 300"
type: 'success'  → "📍 Payment received! Check Recovered section"
type: 'success'  → "🎉 You've earned KES 150 reward"
type: 'error'    → "❌ Payment failed. Please try again"
```

**Why**: 
- Different colors in UI
- Filter by type in notification center
- Analytics on notification types
- Better UX with visual hierarchy

---

### **2. priority** (VARCHAR 10)
**Purpose**: Determine notification importance and display order

**Values**:
- `'low'` - Can wait (old reports, general info)
- `'medium'` - Standard (most notifications)
- `'high'` - Urgent (payment required, reward available)

**Examples**:
```
priority: 'high'   → "💰 Document verified! Pay KES 300"
priority: 'high'   → "🎉 You've earned KES 150 reward"
priority: 'medium' → "✅ Potential match found"
priority: 'low'    → "🔍 Search started"
```

**Why**:
- Show important notifications first
- Sort by priority in notification center
- Highlight urgent actions
- Better user experience

---

### **3. notification_action** (VARCHAR 50)
**Purpose**: Define what action user should take when clicking notification

**Values**:
- `'view_report'` - Open report details
- `'verify_document'` - Open verification modal
- `'make_payment'` - Open payment modal
- `'view_recovered'` - Go to Recovered section
- `'claim_reward'` - Open reward claiming modal
- `'view_collection_point'` - Show collection point details
- `'view_location'` - Show document location

**Examples**:
```
notification_action: 'view_report'
→ Click notification → Opens report details page

notification_action: 'verify_document'
→ Click notification → Opens verification modal

notification_action: 'make_payment'
→ Click notification → Opens payment modal

notification_action: 'claim_reward'
→ Click notification → Opens reward claiming modal
```

**Why**:
- Seamless user navigation
- One-click actions
- Better UX flow
- Reduces friction

---

### **4. action_data** (JSONB)
**Purpose**: Store additional data needed for the action

**Format**: JSON object with flexible structure

**Examples**:

```json
{
  "reportId": "uuid-123",
  "documentType": "National ID",
  "amount": 300
}
```

```json
{
  "reportId": "uuid-456",
  "recoveredReportId": "uuid-789",
  "documentType": "Passport"
}
```

```json
{
  "reportId": "uuid-111",
  "amount": 150,
  "documentType": "Driving License"
}
```

```json
{
  "reportId": "uuid-222",
  "location": "Nairobi Police Station",
  "coordinates": {"lat": -1.2921, "lng": 36.8219}
}
```

**Why**:
- Pass parameters to actions
- Avoid additional queries
- Flexible for different notification types
- Store complex data

---

### **5. read_at** (TIMESTAMP)
**Purpose**: Track when notification was read

**Format**: Timestamp with timezone

**Examples**:
```
created_at: 2025-10-27 20:00:00 UTC
read_at: NULL (unread)

created_at: 2025-10-27 20:00:00 UTC
read_at: 2025-10-27 20:05:30 UTC (read 5 minutes later)
```

**Why**:
- Analytics on notification engagement
- Show "Read 2 hours ago"
- Track user behavior
- Better insights

---

### **6. expires_at** (TIMESTAMP)
**Purpose**: Auto-delete old notifications

**Format**: Timestamp with timezone

**Examples**:
```
created_at: 2025-10-27 20:00:00 UTC
expires_at: 2025-11-03 20:00:00 UTC (7 days later)

-- After 7 days, notification can be deleted
```

**Why**:
- Automatic cleanup
- Prevent database bloat
- Manage storage costs
- Keep notifications relevant

---

## 🔄 How to Use Each Field in Your Workflow

### **Scenario 1: Lost Report Created**

```sql
INSERT INTO notifications (
  user_id,
  message,
  type,
  priority,
  status,
  related_report_id,
  notification_action,
  action_data,
  expires_at
) VALUES (
  'user-123',
  '🔍 Search started for your lost National ID. We''ll notify you when we find a match.',
  'info',
  'medium',
  'unread',
  'report-456',
  'view_report',
  '{"reportId": "report-456", "documentType": "National ID"}',
  NOW() + INTERVAL '30 days'
);
```

**User Experience**:
- Toast shows: "🔍 Search started..."
- Badge: +1 unread
- Notification Center: Shows in list
- Click: Opens report details
- Auto-deletes: After 30 days

---

### **Scenario 2: Potential Match Found**

```sql
INSERT INTO notifications (
  user_id,
  message,
  type,
  priority,
  status,
  related_report_id,
  notification_action,
  action_data,
  expires_at
) VALUES (
  'user-123',
  '✅ Potential match found! Please verify the document to confirm it''s yours.',
  'warning',
  'high',
  'unread',
  'report-456',
  'verify_document',
  '{"reportId": "report-456", "recoveredReportId": "recovered-789"}',
  NOW() + INTERVAL '7 days'
);
```

**User Experience**:
- Toast shows: "✅ Potential match found..."
- Badge: +1 unread
- Notification Center: Shows at top (high priority)
- Click: Opens verification modal
- Auto-deletes: After 7 days if not acted on

---

### **Scenario 3: Payment Required**

```sql
INSERT INTO notifications (
  user_id,
  message,
  type,
  priority,
  status,
  related_report_id,
  notification_action,
  action_data,
  expires_at
) VALUES (
  'user-123',
  '💰 Document verified! Pay KES 300 to receive the location of your National ID.',
  'warning',
  'high',
  'unread',
  'report-456',
  'make_payment',
  '{"reportId": "report-456", "amount": 300, "documentType": "National ID"}',
  NOW() + INTERVAL '3 days'
);
```

**User Experience**:
- Toast shows: "💰 Document verified..."
- Badge: +1 unread
- Notification Center: Shows at top (high priority)
- Click: Opens payment modal with amount pre-filled
- Auto-deletes: After 3 days

---

### **Scenario 4: Reward Available**

```sql
INSERT INTO notifications (
  user_id,
  message,
  type,
  priority,
  status,
  related_report_id,
  notification_action,
  action_data,
  expires_at
) VALUES (
  'user-456',
  '🎉 Congratulations! You''ve earned KES 150 reward for the National ID. Click here to claim your reward.',
  'success',
  'high',
  'unread',
  'report-789',
  'claim_reward',
  '{"reportId": "report-789", "amount": 150, "documentType": "National ID"}',
  NOW() + INTERVAL '7 days'
);
```

**User Experience**:
- Toast shows: "🎉 You've earned KES 150..."
- Badge: +1 unread
- Notification Center: Shows at top (high priority)
- Click: Opens reward claiming modal
- Auto-deletes: After 7 days

---

## 📝 Migration Guide

### **If You Already Have the Table**

**Option 1: Add New Fields**
```sql
-- Add new columns
ALTER TABLE notifications ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium';
ALTER TABLE notifications ADD COLUMN notification_action VARCHAR(50) NULL;
ALTER TABLE notifications ADD COLUMN action_data JSONB NULL;
ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Add constraints
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('info', 'warning', 'success', 'error'));
ALTER TABLE notifications ADD CONSTRAINT notifications_priority_check 
  CHECK (priority IN ('low', 'medium', 'high'));

-- Create indexes
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
```

**Option 2: Recreate Table (if empty)**
```sql
-- Drop old table
DROP TABLE notifications;

-- Create new table with all fields
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',
  status VARCHAR(10) NOT NULL DEFAULT 'unread',
  related_report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  notification_action VARCHAR(50) NULL,
  action_data JSONB NULL,
  read_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  
  CONSTRAINT notifications_status_check CHECK (status IN ('unread', 'read', 'deleted')),
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'warning', 'success', 'error')),
  CONSTRAINT notifications_priority_check CHECK (priority IN ('low', 'medium', 'high'))
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);
```

---

## 🧹 Maintenance Functions

### **Auto-cleanup Old Notifications**

Create a PostgreSQL function to delete expired notifications:

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run daily via cron (in Supabase)
-- Or call manually when needed
SELECT cleanup_expired_notifications();
```

---

## 📊 Query Examples

### **Get Unread Notifications**
```sql
SELECT * FROM notifications
WHERE user_id = 'user-123'
AND status = 'unread'
ORDER BY priority DESC, created_at DESC;
```

### **Get High Priority Unread**
```sql
SELECT * FROM notifications
WHERE user_id = 'user-123'
AND status = 'unread'
AND priority = 'high'
ORDER BY created_at DESC;
```

### **Get Notifications by Type**
```sql
SELECT * FROM notifications
WHERE user_id = 'user-123'
AND type = 'warning'
ORDER BY created_at DESC;
```

### **Mark as Read**
```sql
UPDATE notifications
SET status = 'read', read_at = NOW()
WHERE id = 'notification-123';
```

### **Get Unread Count**
```sql
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = 'user-123'
AND status = 'unread';
```

---

## ✅ Summary: What to Do

### **Recommended Action**

1. **Add these 6 fields** to your existing table:
   - `type` (VARCHAR 20)
   - `priority` (VARCHAR 10)
   - `notification_action` (VARCHAR 50)
   - `action_data` (JSONB)
   - `read_at` (TIMESTAMP)
   - `expires_at` (TIMESTAMP)

2. **Create indexes** for performance

3. **Enable RLS** for security

4. **Update dashboard-notifications.js** to use new fields

5. **Test complete workflow** with real data

---

## 🎯 Benefits of Enhanced Schema

✅ **Better UX** - Type and priority for visual hierarchy  
✅ **Seamless Navigation** - Action and action_data for one-click flows  
✅ **Analytics** - Track read_at for engagement metrics  
✅ **Storage Management** - expires_at for automatic cleanup  
✅ **Scalability** - Proper indexes for performance  
✅ **Security** - RLS policies for data protection  
✅ **Flexibility** - JSONB for complex data  

---

**Status**: Ready to implement ✅

Your current schema is solid. Adding these 6 fields will make it production-ready!
