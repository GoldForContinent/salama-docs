// NOTIFICATION SYSTEM RESTORE SCRIPT
// Emergency restoration of notification functionality

(function() {
    console.log('🔧 ===== NOTIFICATION SYSTEM RESTORE =====');

    // 1. Check if system exists
    if (!window.unifiedNotifications) {
        console.error('❌ unifiedNotifications not found - cannot restore');
        return;
    }

    const ns = window.unifiedNotifications;

    // 2. Force create bell if missing
    console.log('🔔 Checking/creating notification bell...');
    let bell = document.querySelector('.notification-bell');
    if (!bell) {
        console.log('🔨 Bell not found, creating...');
        bell = document.createElement('div');
        bell.className = 'notification-bell';
        bell.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="topNotificationCount">0</span>
        `;

        // Add to profile dropdown area
        const profileDropdown = document.getElementById('profileDropdownBtn');
        if (profileDropdown && profileDropdown.parentNode) {
            profileDropdown.parentNode.insertBefore(bell, profileDropdown);
            console.log('✅ Bell created and inserted');
        } else {
            console.error('❌ Could not find profile dropdown to insert bell');
        }
    } else {
        console.log('✅ Bell already exists');
    }

    // 3. Force create modal if missing
    console.log('📱 Checking/creating notification modal...');
    let modal = document.getElementById('notificationModal');
    if (!modal) {
        console.log('🔨 Modal not found, creating...');
        modal = document.createElement('div');
        modal.className = 'notification-modal';
        modal.id = 'notificationModal';
        modal.innerHTML = `
            <div class="notification-modal-content">
                <div class="notification-modal-header">
                    <h2>Notifications</h2>
                    <button class="notification-modal-close">&times;</button>
                </div>
                <div class="notification-modal-list" id="notificationList">
                    <div style="padding: 20px; text-align: center; color: #666;">
                        Loading notifications...
                    </div>
                </div>
                <div class="notification-modal-footer">
                    <button class="notification-modal-footer-btn">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('✅ Modal created');

        // Attach basic modal listeners
        const closeBtn = modal.querySelector('.notification-modal-close');
        const footerBtn = modal.querySelector('.notification-modal-footer-btn');

        const closeModal = () => {
            modal.classList.remove('active');
            ns.isOpen = false;
        };

        closeBtn.addEventListener('click', closeModal);
        footerBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

    } else {
        console.log('✅ Modal already exists');
    }

    // 4. Force badge update
    console.log('🏷️ Forcing badge update...');
    ns.updateBadge = ns.updateBadge || function() {
        const badge = document.querySelector('.notification-badge');
        if (badge && ns.notifications) {
            const unreadCount = ns.notifications.filter(n => n.status === 'unread').length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            console.log('✅ Badge updated to:', unreadCount);
        }
    };

    // 5. Force notification fetch
    console.log('📥 Forcing notification fetch...');
    if (ns.fetchNotifications) {
        ns.fetchNotifications().then(() => {
            console.log('✅ Notifications fetched, count:', ns.notifications.length);
            ns.updateBadge();
        }).catch(error => {
            console.error('❌ Fetch failed:', error);
        });
    }

    // 6. Force bell click handler
    console.log('🔔 Setting up bell click handler...');
    if (bell) {
        bell.onclick = function() {
            console.log('🔔 Bell clicked');
            if (ns.open) {
                ns.open();
            } else {
                console.error('❌ No open method found');
            }
        };
    }

    // 7. Inject basic CSS if missing
    console.log('🎨 Injecting emergency CSS...');
    let emergencyCSS = document.getElementById('emergency-notification-css');
    if (!emergencyCSS) {
        emergencyCSS = document.createElement('style');
        emergencyCSS.id = 'emergency-notification-css';
        emergencyCSS.textContent = `
            .notification-bell {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                cursor: pointer;
                font-size: 20px;
                color: #006600;
                margin: 0 10px;
            }

            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
            }

            .notification-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999;
            }

            .notification-modal.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .notification-modal-content {
                background: white;
                border-radius: 12px;
                width: 500px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
            }

            .notification-modal-header {
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(135deg, #000000, #006600);
                color: white;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .notification-modal-list {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                min-height: 200px;
            }

            .notification-modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                justify-content: flex-end;
            }

            .notification-modal-footer-btn {
                padding: 10px 16px;
                border: 1px solid #e0e0e0;
                background: white;
                border-radius: 6px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(emergencyCSS);
        console.log('✅ Emergency CSS injected');
    }

    // 8. Final test
    console.log('🧪 Running final test...');
    setTimeout(() => {
        ns.updateBadge();
        console.log('✅ System restore complete - try clicking the bell!');
    }, 1000);

    console.log('🔧 ===== RESTORE COMPLETE =====');
})();
