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

    // 6. ENHANCED DEBUGGING - Override render method with Venice AI suggestions
    console.log('🔍 ===== ENHANCED DEBUGGING =====');

    if (window.unifiedNotifications) {
        // Override render method with detailed Venice AI logging
        const originalRender = window.unifiedNotifications.render;
        window.unifiedNotifications.render = function(searchQuery = '') {
            console.log('🎨 VENICE DEBUG: ===== RENDER START =====');
            console.log('🎨 VENICE DEBUG: render() called with searchQuery:', searchQuery);
            console.log('🎨 VENICE DEBUG: this.notifications:', this.notifications);
            console.log('🎨 VENICE DEBUG: this.notifications.length:', this.notifications.length);
            console.log('🎨 VENICE DEBUG: this.currentFilter:', this.currentFilter);

            // Log the filtered notifications (Venice AI Step 1)
            let filteredNotifications = [...this.notifications];
            console.log('🎨 VENICE DEBUG: Initial filtered notifications:', filteredNotifications.length);

            // Apply type filter
            if (this.currentFilter !== 'all') {
                filteredNotifications = filteredNotifications.filter(notif => notif.type === this.currentFilter);
                console.log('🎨 VENICE DEBUG: After type filter:', filteredNotifications.length);
            }

            // Apply search filter
            const searchQueryLower = searchQuery.toLowerCase();
            if (searchQueryLower) {
                filteredNotifications = filteredNotifications.filter(notif =>
                    notif.message.toLowerCase().includes(searchQueryLower)
                );
                console.log('🎨 VENICE DEBUG: After search filter:', searchQueryLower, '->', filteredNotifications.length);
            }

            console.log('🎨 VENICE DEBUG: Final notifications to render:', filteredNotifications.length);

            // Check if we have notifications to display
            if (filteredNotifications.length === 0) {
                console.log('🎨 VENICE DEBUG: No notifications to display - showing empty state');
                // Call original render for empty state
                return originalRender.call(this, searchQuery);
            }

            // Log each notification that will be rendered
            filteredNotifications.forEach((notif, index) => {
                console.log(`🎨 VENICE DEBUG: Notification ${index + 1}:`, {
                    id: notif.id,
                    type: notif.type,
                    message: notif.message.substring(0, 50) + '...',
                    status: notif.status,
                    created_at: notif.created_at
                });
            });

            // Call original render
            console.log('🎨 VENICE DEBUG: Calling original render method...');
            const result = originalRender.call(this, searchQuery);

            // Check DOM after render (Venice AI Step 3)
            console.log('🎨 VENICE DEBUG: Render completed, checking DOM...');
            const listAfter = document.getElementById('notificationList');
            if (listAfter) {
                console.log('🎨 VENICE DEBUG: List element found');
                console.log('🎨 VENICE DEBUG: List children count:', listAfter.children.length);
                console.log('🎨 VENICE DEBUG: List innerHTML length:', listAfter.innerHTML.length);
                console.log('🎨 VENICE DEBUG: List innerHTML preview:', listAfter.innerHTML.substring(0, 200) + '...');

                // Check each child element
                Array.from(listAfter.children).forEach((child, index) => {
                    console.log(`🎨 VENICE DEBUG: Child ${index + 1}:`, {
                        tagName: child.tagName,
                        className: child.className,
                        innerHTML: child.innerHTML.substring(0, 100) + '...'
                    });
                });

                // Force visibility check
                const computedStyle = window.getComputedStyle(listAfter);
                console.log('🎨 VENICE DEBUG: List computed styles:', {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    height: computedStyle.height
                });

            } else {
                console.error('🎨 VENICE DEBUG: ❌ List element NOT found after render!');
            }

            console.log('🎨 VENICE DEBUG: ===== RENDER END =====');
            return result;
        };

        // Override createNotificationItem method (Venice AI Step 2)
        const originalCreateItem = window.unifiedNotifications.renderNotification;
        window.unifiedNotifications.renderNotification = function(notification) {
            console.log('🎨 VENICE DEBUG: ===== CREATE ITEM START =====');
            console.log('🎨 VENICE DEBUG: Creating item for notification:', notification.id, notification.message.substring(0, 30) + '...');

            const result = originalCreateItem.call(this, notification);

            console.log('🎨 VENICE DEBUG: Generated HTML length:', result.length);
            console.log('🎨 VENICE DEBUG: Generated HTML preview:', result.substring(0, 150) + '...');
            console.log('🎨 VENICE DEBUG: ===== CREATE ITEM END =====');

            return result;
        };

        // Override open method (Venice AI Step 4)
        const originalOpen = window.unifiedNotifications.open;
        window.unifiedNotifications.open = function() {
            console.log('🔔 VENICE DEBUG: ===== MODAL OPEN START =====');

            const result = originalOpen.call(this);

            // Force additional visibility (Venice AI Step 4)
            const modal = document.getElementById('notificationModal');
            if (modal) {
                modal.style.display = 'flex !important';
                modal.style.visibility = 'visible !important';
                modal.style.opacity = '1 !important';
                modal.style.zIndex = '10000 !important';
                console.log('🔔 VENICE DEBUG: Modal forced visible');
            } else {
                console.error('🔔 VENICE DEBUG: ❌ Modal element not found!');
            }

            console.log('🔔 VENICE DEBUG: ===== MODAL OPEN END =====');
            return result;
        };

        console.log('✅ VENICE DEBUG: All methods overridden with enhanced logging');
    }

    console.log('🔍 ===== DEBUG COMPLETE =====');
    console.log('📝 If you see colored borders/backgrounds, the content IS there but normally hidden.');
    console.log('📝 If modal is still empty, check the console logs above for specific errors.');
    console.log('📝 Look for "CUSTOM DEBUG" messages to see what happens during render.');
})();
