# 🚀 Notification System - Quick Reference

## 📌 TL;DR

Your app now has a **unified, professional notification system**. Use it like this:

```javascript
notificationManager.success('Done!');
notificationManager.error('Oops!');
notificationManager.warning('Careful!');
notificationManager.info('FYI');
```

---

## 🎯 Basic Usage

### **Success** (Green)
```javascript
notificationManager.success('Profile updated successfully!');
```

### **Error** (Red)
```javascript
notificationManager.error('Failed to save changes');
```

### **Warning** (Orange)
```javascript
notificationManager.warning('This action cannot be undone');
```

### **Info** (Blue)
```javascript
notificationManager.info('New message received');
```

---

## ⚙️ Advanced Options

### **Custom Duration**
```javascript
// 3 seconds
notificationManager.success('Quick message', { duration: 3000 });

// Never auto-dismiss
notificationManager.show('Important!', { duration: 0 });
```

### **With Action Button**
```javascript
notificationManager.show('Deleted', {
  type: 'info',
  action: {
    label: 'Undo',
    callback: () => restoreItem()
  }
});
```

### **Priority Levels**
```javascript
// Critical (bounce animation)
notificationManager.error('Critical error!', { priority: 'critical' });

// High (stronger shadow)
notificationManager.warning('Important!', { priority: 'high' });
```

### **Full Control**
```javascript
const id = notificationManager.show('Custom notification', {
  type: 'success',
  duration: 5000,
  priority: 'normal',
  dismissible: true,
  action: {
    label: 'Action',
    callback: () => console.log('Clicked!')
  }
});

// Dismiss manually
notificationManager.dismiss(id);

// Dismiss all
notificationManager.dismissAll();
```

---

## 🎨 Types & Colors

| Type | Color | Use Case |
|------|-------|----------|
| **success** | Green | Operation completed |
| **error** | Red | Something failed |
| **warning** | Orange | Caution needed |
| **info** | Blue | General information |

---

## 📱 Features

✅ **Auto-dismiss** - Disappears after 5 seconds (configurable)  
✅ **Manual dismiss** - Click X button to close  
✅ **Queue system** - Shows up to 3 at once  
✅ **Animations** - Smooth slide-in/out  
✅ **Mobile responsive** - Works on all devices  
✅ **Accessible** - Full ARIA support  
✅ **Action buttons** - Optional callback actions  

---

## 🔍 Debugging

### **Check all notifications**
```javascript
console.log(notificationManager.getAll());
```

### **Get specific notification**
```javascript
const notif = notificationManager.getById(1);
console.log(notif);
```

### **Clear everything**
```javascript
notificationManager.dismissAll();
```

---

## 📍 Where It's Used

### **Digital Locker**
- File uploads
- Document operations
- Form validation

### **Dashboard**
- Profile updates
- Password changes
- Report matching
- Payment processing

---

## 🚫 Don't Use Old System

❌ **Old** (no longer works):
```javascript
showNotification('Message', 'success');  // ❌ Don't use
```

✅ **New** (use this):
```javascript
notificationManager.success('Message');  // ✅ Use this
```

---

## 💡 Pro Tips

1. **Success notifications** auto-dismiss in 5 seconds
2. **Error notifications** auto-dismiss in 6 seconds
3. Use **priority: 'critical'** for important errors
4. Set **duration: 0** for persistent messages
5. Add **action buttons** for undo/retry operations

---

## 🎓 Examples from Codebase

### **File Upload**
```javascript
notificationManager.success('Document uploaded successfully');
```

### **Error Handling**
```javascript
notificationManager.error('Error uploading document');
```

### **Profile Update**
```javascript
notificationManager.success('Profile updated successfully!');
```

### **Password Change**
```javascript
notificationManager.success('Password changed successfully!');
```

### **Data Operations**
```javascript
notificationManager.success('Document deleted');
notificationManager.error('Error deleting document');
```

---

## 📚 Full Documentation

For complete details, see:
- `PHASE1_IMPLEMENTATION_SUMMARY.md` - Full overview
- `NOTIFICATION_TESTING_GUIDE.md` - Testing procedures
- `NOTIFICATION_PHASE1_COMPLETE.md` - API reference

---

## ✨ That's It!

You now have a professional notification system. Just use:

```javascript
notificationManager.success('message');
notificationManager.error('message');
notificationManager.warning('message');
notificationManager.info('message');
```

Happy coding! 🚀
