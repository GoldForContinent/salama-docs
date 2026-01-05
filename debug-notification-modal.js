// COMPREHENSIVE NOTIFICATION MODAL DEBUG SCRIPT
// Copy and paste this into the browser console when on the dashboard page

(function() {
    console.log('🔍 ===== COMPREHENSIVE NOTIFICATION MODAL DEBUG =====');

    // 1. Check if UnifiedNotificationSystem exists
    console.log('✅ UnifiedNotificationSystem loaded:', typeof window.UnifiedNotificationSystem !== 'undefined');
    console.log('✅ unifiedNotifications instance:', typeof window.unifiedNotifications !== 'undefined');

    if (window.unifiedNotifications) {
        console.log('📊 Current notifications count:', window.unifiedNotifications.notifications.length);
        console.log('📊 Current filter:', window.unifiedNotifications.currentFilter);
        console.log('📊 Is modal open:', window.unifiedNotifications.isOpen);
        console.log('📊 Current user:', window.unifiedNotifications.currentUser ? window.unifiedNotifications.currentUser.email : 'none');

        // Log first 3 notifications if they exist
        if (window.unifiedNotifications.notifications.length > 0) {
            console.log('📋 Sample notifications:');
            window.unifiedNotifications.notifications.slice(0, 3).forEach((n, i) => {
                console.log(`  ${i+1}. ID: ${n.id}, Type: ${n.type}, Message: ${n.message.substring(0, 50)}..., Status: ${n.status}`);
            });
        }
    }

    // 2. Check HTML elements
    const modal = document.getElementById('notificationModal');
    const list = document.getElementById('notificationList');

    console.log('🎨 Modal element exists:', !!modal);
    console.log('🎨 List element exists:', !!list);

    if (modal) {
        console.log('🎨 Modal has active class:', modal.classList.contains('active'));
        console.log('🎨 Modal display style:', window.getComputedStyle(modal).display);
        console.log('🎨 Modal visibility:', window.getComputedStyle(modal).visibility);
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

        // Check for any child elements
        if (list.children.length > 0) {
            console.log('🎨 First child element:', list.children[0].outerHTML.substring(0, 200) + '...');
        }
    }

    // 3. Test manual render
    console.log('🧪 Testing manual render...');
    if (window.unifiedNotifications && list) {
        try {
            window.unifiedNotifications.render();
            console.log('✅ Manual render completed');
            console.log('📊 List after manual render - children:', list.children.length);
            console.log('📊 List after manual render - HTML length:', list.innerHTML.length);
        } catch (error) {
            console.error('❌ Manual render failed:', error);
        }
    }

    // 4. Apply ULTRA aggressive debug CSS to force visibility
    console.log('🎨 Applying ULTRA aggressive debug CSS...');

    const debugStyle = document.createElement('style');
    debugStyle.id = 'debug-notification-styles';
    debugStyle.textContent = `
        /* FORCE ABSOLUTE VISIBILITY */
        .notification-modal,
        .notification-modal *,
        .notification-modal-list,
        .notification-modal-item,
        .notification-modal-item-content,
        .notification-modal-item-message,
        .notification-modal-item-time,
        .notification-modal-item-icon,
        .notification-modal-item-actions,
        .notification-modal-item-btn {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            color: #000 !important;
            background: white !important;
            border: 2px solid red !important;
            padding: 5px !important;
            margin: 2px !important;
            font-size: 14px !important;
            font-weight: bold !important;
            text-shadow: none !important;
        }

        .notification-modal-list {
            border: 5px solid red !important;
            background: yellow !important;
            min-height: 300px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 10000 !important;
            position: relative !important;
            padding: 20px !important;
        }

        .notification-modal-item {
            border: 3px solid blue !important;
            background: lightblue !important;
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 10001 !important;
            margin: 10px 0 !important;
            padding: 15px !important;
            color: black !important;
            font-weight: bold !important;
            flex-direction: column !important;
            align-items: flex-start !important;
        }

        .notification-modal-item-message {
            color: #000 !important;
            font-weight: bold !important;
            background: white !important;
            padding: 8px !important;
            border: 2px solid green !important;
            margin: 5px 0 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 16px !important;
            line-height: 1.4 !important;
        }

        .notification-modal-item-message::before {
            content: "MESSAGE: " !important;
            color: red !important;
            font-weight: bold !important;
        }

        .notification-modal-item-icon {
            color: red !important;
            font-size: 24px !important;
            background: yellow !important;
            padding: 5px !important;
            border: 2px solid purple !important;
        }

        .notification-checkbox {
            width: 24px !important;
            height: 24px !important;
            border: 3px solid purple !important;
            background: pink !important;
            margin-right: 10px !important;
        }

        .notification-read-more {
            background: orange !important;
            color: black !important;
            border: 3px solid brown !important;
            padding: 8px !important;
            font-size: 14px !important;
            font-weight: bold !important;
            margin: 5px 0 !important;
            display: inline-block !important;
        }

        .notification-modal-item-actions {
            background: lightgreen !important;
            border: 2px solid darkgreen !important;
            padding: 5px !important;
            margin-top: 10px !important;
        }

        .notification-modal-item-btn {
            background: cyan !important;
            color: black !important;
            border: 2px solid blue !important;
            padding: 6px 10px !important;
            margin: 2px !important;
            font-size: 12px !important;
            display: inline-block !important;
        }
    `;

    // Remove existing debug styles
    const existingDebug = document.getElementById('debug-notification-styles');
    if (existingDebug) {
        existingDebug.remove();
    }

    document.head.appendChild(debugStyle);
    console.log('✅ Aggressive debug CSS applied');

    // 5. Force open modal and render
    console.log('🔔 Forcing modal open and render...');
    if (window.unifiedNotifications) {
        window.unifiedNotifications.open();
    }

    // 6. Check for JavaScript errors in render process
    console.log('🔍 Checking for render errors...');

    // Override the render method temporarily to add more logging
    if (window.unifiedNotifications) {
        const originalRender = window.unifiedNotifications.render;
        window.unifiedNotifications.render = function(searchQuery = '') {
            console.log('🎨 CUSTOM DEBUG: render() called with searchQuery:', searchQuery);
            console.log('🎨 CUSTOM DEBUG: this.notifications:', this.notifications);
            console.log('🎨 CUSTOM DEBUG: this.notifications.length:', this.notifications.length);

            // Call original render
            const result = originalRender.call(this, searchQuery);

            console.log('🎨 CUSTOM DEBUG: render completed, checking DOM...');
            const listAfter = document.getElementById('notificationList');
            if (listAfter) {
                console.log('🎨 CUSTOM DEBUG: list children after render:', listAfter.children.length);
                console.log('🎨 CUSTOM DEBUG: list HTML length:', listAfter.innerHTML.length);
            }

            return result;
        };
        console.log('✅ Render method overridden with debug logging');
    }

    console.log('🔍 ===== DEBUG COMPLETE =====');
    console.log('📝 If you see colored borders/backgrounds, the content IS there but normally hidden.');
    console.log('📝 If modal is still empty, check the console logs above for specific errors.');
    console.log('📝 Look for "CUSTOM DEBUG" messages to see what happens during render.');
})();
