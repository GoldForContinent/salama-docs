// notification.js
// Handles notification UI and logic for the dashboard and other pages

// Show a notification toast
export function showNotification(message, type = 'info') {
    console.log(`🔔 Notification (${type}):`, message);
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            display: none;
            max-width: 400px;
            word-wrap: break-word;
        `;
        document.body.appendChild(notification);
    }
    // Set colors based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = 'block';
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Notification bell and count logic
export function setupNotificationBell() {
    const topNotificationCount = document.getElementById('topNotificationCount');
    let notificationCount = 0;
    const countEl = document.getElementById('notificationCount');
    if (countEl) {
        notificationCount = parseInt(countEl.textContent, 10) || 0;
    }
    if (topNotificationCount) {
        topNotificationCount.textContent = notificationCount;
    }
    // Optional: clicking the bell shows notifications section
    const topNotificationBell = document.getElementById('topNotificationBell');
    if (topNotificationBell) {
        topNotificationBell.addEventListener('click', () => {
            if (typeof window.showSection === 'function') {
                window.showSection('notifications');
            }
        });
    }
}

// Attach to window for global use
window.showNotification = showNotification;
window.setupNotificationBell = setupNotificationBell; 