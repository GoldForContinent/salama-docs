// FINAL COMPREHENSIVE NOTIFICATION DEBUG SCRIPT
// This script implements ALL Venice AI debugging suggestions plus additional diagnostics

(function() {
    console.log('🔍 ===== FINAL COMPREHENSIVE NOTIFICATION DEBUG =====');

    // STEP 1: Basic system check
    console.log('1️⃣ SYSTEM CHECK:');
    console.log('✅ UnifiedNotificationSystem loaded:', typeof window.UnifiedNotificationSystem !== 'undefined');
    console.log('✅ unifiedNotifications instance:', typeof window.unifiedNotifications !== 'undefined');

    if (window.unifiedNotifications) {
        console.log('📊 Current notifications count:', window.unifiedNotifications.notifications.length);
        console.log('📊 Current filter:', window.unifiedNotifications.currentFilter);
        console.log('📊 Is modal open:', window.unifiedNotifications.isOpen);
        console.log('📊 Current user:', window.unifiedNotifications.currentUser ? window.unifiedNotifications.currentUser.email : 'none');
    }

    // STEP 2: HTML elements check
    console.log('2️⃣ HTML ELEMENTS CHECK:');
    const modal = document.getElementById('notificationModal');
    const list = document.getElementById('notificationList');

    console.log('🎨 Modal element exists:', !!modal);
    console.log('🎨 List element exists:', !!list);

    // STEP 3: VENICE AI STEP 1 - Enhanced render method logging
    console.log('3️⃣ VENICE AI STEP 1 - RENDER METHOD ENHANCEMENT:');

    if (window.unifiedNotifications) {
        const originalRender = window.unifiedNotifications.render;
        window.unifiedNotifications.render = function(searchQuery = '') {
            console.log('🎨 VENICE RENDER: ===== START =====');
            console.log('🎨 VENICE RENDER: Called with searchQuery:', searchQuery);
            console.log('🎨 VENICE RENDER: Total notifications:', this.notifications.length);

            // Venice AI filtering logic
            let notifications = [...this.notifications];
            console.log('🎨 VENICE RENDER: Initial copy:', notifications.length);

            // Type filtering
            if (this.currentFilter !== 'all') {
                const beforeFilter = notifications.length;
                notifications = notifications.filter(n => n.type === this.currentFilter);
                console.log(`🎨 VENICE RENDER: Type filter '${this.currentFilter}': ${beforeFilter} -> ${notifications.length}`);
            }

            // Search filtering
            if (searchQuery) {
                const beforeSearch = notifications.length;
                const query = searchQuery.toLowerCase();
                notifications = notifications.filter(n =>
                    n.message.toLowerCase().includes(query)
                );
                console.log(`🎨 VENICE RENDER: Search filter '${query}': ${beforeSearch} -> ${notifications.length}`);
            }

            console.log('🎨 VENICE RENDER: Final count to render:', notifications.length);

            if (notifications.length === 0) {
                console.log('🎨 VENICE RENDER: No notifications - calling original for empty state');
                return originalRender.call(this, searchQuery);
            }

            // Log sample of notifications
            notifications.slice(0, 3).forEach((n, i) => {
                console.log(`🎨 VENICE RENDER: Notification ${i+1}:`, {
                    id: n.id,
                    type: n.type,
                    message: n.message.substring(0, 50) + '...',
                    status: n.status
                });
            });

            // Call original render
            console.log('🎨 VENICE RENDER: Calling original render...');
            const result = originalRender.call(this, searchQuery);

            // Check DOM after render
            const listAfter = document.getElementById('notificationList');
            if (listAfter) {
                console.log('🎨 VENICE RENDER: DOM check - children:', listAfter.children.length);
                console.log('🎨 VENICE RENDER: DOM check - HTML length:', listAfter.innerHTML.length);

                if (listAfter.children.length === 0 && notifications.length > 0) {
                    console.error('🎨 VENICE RENDER: ❌ CRITICAL - No DOM children but had notifications to render!');
                    console.log('🎨 VENICE RENDER: Attempting manual injection...');

                    // Manual injection test
                    listAfter.innerHTML = '<div style="color: red; font-weight: bold; padding: 20px;">MANUAL INJECTION TEST</div>';
                    console.log('🎨 VENICE RENDER: Manual injection complete');
                }
            }

            console.log('🎨 VENICE RENDER: ===== END =====');
            return result;
        };
    }

    // STEP 4: VENICE AI STEP 2 - createNotificationItem logging
    console.log('4️⃣ VENICE AI STEP 2 - CREATE ITEM ENHANCEMENT:');

    if (window.unifiedNotifications) {
        const originalCreateItem = window.unifiedNotifications.renderNotification;
        window.unifiedNotifications.renderNotification = function(notification) {
            console.log('🎨 VENICE CREATE: Creating item for notification:', notification.id);

            const result = originalCreateItem.call(this, notification);

            console.log('🎨 VENICE CREATE: Generated HTML length:', result.length);
            console.log('🎨 VENICE CREATE: HTML preview:', result.substring(0, 100) + '...');

            // Check if HTML contains expected content
            if (!result.includes('notification-modal-item')) {
                console.error('🎨 VENICE CREATE: ❌ Generated HTML missing expected classes!');
            }
            if (!result.includes(notification.message.substring(0, 20))) {
                console.error('🎨 VENICE CREATE: ❌ Generated HTML missing notification message!');
            }

            return result;
        };
    }

    // STEP 5: VENICE AI STEP 4 - Force modal visibility
    console.log('5️⃣ VENICE AI STEP 4 - MODAL VISIBILITY ENHANCEMENT:');

    if (window.unifiedNotifications) {
        const originalOpen = window.unifiedNotifications.open;
        window.unifiedNotifications.open = function() {
            console.log('🔔 VENICE OPEN: Forcing modal open...');

            const result = originalOpen.call(this);

            const modal = document.getElementById('notificationModal');
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex !important';
                modal.style.visibility = 'visible !important';
                modal.style.opacity = '1 !important';
                modal.style.zIndex = '10000 !important';
                console.log('🔔 VENICE OPEN: Modal forced visible');
            }

            return result;
        };
    }

    // STEP 6: Apply super aggressive debug CSS
    console.log('6️⃣ SUPER AGGRESSIVE DEBUG CSS:');

    const debugStyle = document.createElement('style');
    debugStyle.id = 'final-debug-styles';
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
            color: #000 !important;
            background: white !important;
            border: 2px solid red !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 14px !important;
            font-weight: bold !important;
            padding: 5px !important;
            margin: 2px !important;
        }

        .notification-modal-list {
            border: 5px solid purple !important;
            background: yellow !important;
            min-height: 300px !important;
            padding: 20px !important;
        }

        .notification-modal-item {
            border: 3px solid blue !important;
            background: lightcyan !important;
            margin: 15px 0 !important;
            padding: 15px !important;
        }

        .notification-modal-item-message {
            color: #000 !important;
            background: white !important;
            border: 3px solid green !important;
            padding: 10px !important;
            margin: 5px 0 !important;
            font-size: 16px !important;
            line-height: 1.4 !important;
        }

        .notification-modal-item-message::before {
            content: "📝 MESSAGE: " !important;
            color: red !important;
            font-weight: bold !important;
        }

        .notification-modal-item-time {
            color: #666 !important;
            background: lightgray !important;
            border: 2px solid orange !important;
            font-size: 12px !important;
        }

        .notification-modal-item-icon {
            color: darkblue !important;
            background: lightblue !important;
            font-size: 20px !important;
            border: 2px solid navy !important;
        }
    `;

    // Remove existing debug styles
    const existing = document.getElementById('final-debug-styles');
    if (existing) existing.remove();

    document.head.appendChild(debugStyle);
    console.log('✅ Final debug CSS applied');

    // STEP 7: Force test render
    console.log('7️⃣ FORCE TEST RENDER:');

    setTimeout(() => {
        if (window.unifiedNotifications) {
            console.log('🧪 Triggering test render...');
            window.unifiedNotifications.render();
        }
    }, 1000);

    // STEP 8: Instructions
    console.log('📋 ===== DEBUG COMPLETE =====');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Click your notification bell');
    console.log('2. Check console for VENICE RENDER logs');
    console.log('3. Look for colored borders and forced visibility');
    console.log('4. If still no text, the issue is in JavaScript rendering logic');
    console.log('5. Share the VENICE RENDER logs with me');

    console.log('🔍 ===== WAITING FOR USER ACTION =====');
})();
