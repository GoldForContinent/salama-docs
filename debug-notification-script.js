// Debug script for notification modal issues
// Copy and paste this into the browser console when on the dashboard page

(function() {
    console.log('🔍 Starting notification modal debug...');

    // Check if UnifiedNotificationSystem is loaded
    console.log('✅ UnifiedNotificationSystem loaded:', typeof window.UnifiedNotificationSystem !== 'undefined');
    console.log('✅ unifiedNotifications instance:', typeof window.unifiedNotifications !== 'undefined');

    if (window.unifiedNotifications) {
        console.log('📊 Current notifications count:', window.unifiedNotifications.notifications.length);
        console.log('📊 Current filter:', window.unifiedNotifications.currentFilter);
        console.log('📊 Is modal open:', window.unifiedNotifications.isOpen);
        console.log('📊 Current user:', window.unifiedNotifications.currentUser ? window.unifiedNotifications.currentUser.email : 'none');
    }

    // Check HTML elements
    const modal = document.getElementById('notificationModal');
    const list = document.getElementById('notificationList');

    console.log('🎨 Modal element exists:', !!modal);
    console.log('🎨 List element exists:', !!list);

    if (modal) {
        console.log('🎨 Modal has active class:', modal.classList.contains('active'));
        console.log('🎨 Modal display style:', window.getComputedStyle(modal).display);
        console.log('🎨 Modal visibility:', window.getComputedStyle(modal).visibility);
        console.log('🎨 Modal opacity:', window.getComputedStyle(modal).opacity);
        console.log('🎨 Modal z-index:', window.getComputedStyle(modal).zIndex);
    }

    if (list) {
        console.log('🎨 List innerHTML length:', list.innerHTML.length);
        console.log('🎨 List child elements:', list.children.length);
        console.log('🎨 List display style:', window.getComputedStyle(list).display);
        console.log('🎨 List height:', window.getComputedStyle(list).height);
        console.log('🎨 List overflow:', window.getComputedStyle(list).overflow);

        // Show a sample of the HTML
        console.log('🎨 List HTML sample:', list.innerHTML.substring(0, 200) + '...');
    }

    // Apply debug CSS to make sure content is visible
    console.log('🎨 Applying debug CSS overrides...');

    const debugStyle = document.createElement('style');
    debugStyle.textContent = `
        .notification-modal-list {
            border: 3px solid red !important;
            background: yellow !important;
            min-height: 200px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 10000 !important;
        }

        .notification-modal-item {
            border: 2px solid blue !important;
            background: lightblue !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 10001 !important;
        }

        .notification-modal-item-message {
            color: black !important;
            font-weight: bold !important;
        }
    `;
    document.head.appendChild(debugStyle);

    console.log('✅ Debug CSS applied. If you see colored borders and backgrounds, the content is there but normally hidden by CSS.');

    // Test opening the modal
    console.log('🔔 Attempting to open modal...');
    if (window.unifiedNotifications) {
        window.unifiedNotifications.open();
    }

    console.log('🔍 Debug complete. Check the page for red/yellow/blue colored elements.');
})();


