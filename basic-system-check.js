// BASIC SYSTEM CHECK - Run this FIRST to see if anything is working

(function() {
    console.log('🔍 ===== BASIC SYSTEM CHECK =====');

    // Wait a moment for page to load
    setTimeout(() => {
        console.log('1️⃣ Page Load Check:');
        console.log('✅ DOM ready state:', document.readyState);
        console.log('✅ Current URL:', window.location.href);

        console.log('2️⃣ Script Loading Check:');
        const scripts = document.querySelectorAll('script[src]');
        let notificationScript = false;
        let supabaseScript = false;

        scripts.forEach(script => {
            if (script.src.includes('notifications-unified.js')) {
                notificationScript = true;
                console.log('✅ notifications-unified.js loaded');
            }
            if (script.src.includes('supabase.js')) {
                supabaseScript = true;
                console.log('✅ supabase.js loaded');
            }
        });

        if (!notificationScript) console.error('❌ notifications-unified.js NOT loaded');
        if (!supabaseScript) console.error('❌ supabase.js NOT loaded');

        console.log('3️⃣ Global Objects Check:');
        console.log('✅ window.supabase:', typeof window.supabase);
        console.log('✅ window.UnifiedNotificationSystem:', typeof window.UnifiedNotificationSystem);
        console.log('✅ window.unifiedNotifications:', typeof window.unifiedNotifications);

        console.log('4️⃣ HTML Elements Check:');
        const bell = document.querySelector('.notification-bell');
        const badge = document.querySelector('.notification-badge');
        const modal = document.getElementById('notificationModal');

        console.log('🔔 Bell element:', bell ? 'EXISTS' : 'MISSING');
        console.log('🏷️ Badge element:', badge ? 'EXISTS' : 'MISSING');
        console.log('📱 Modal element:', modal ? 'EXISTS' : 'MISSING');

        if (badge) {
            console.log('🏷️ Badge content:', badge.textContent);
            console.log('🏷️ Badge display:', window.getComputedStyle(badge).display);
        }

        console.log('5️⃣ Initialization Test:');
        if (window.unifiedNotifications) {
            const ns = window.unifiedNotifications;
            console.log('✅ Instance exists');
            console.log('📊 Notifications array:', ns.notifications ? ns.notifications.length : 'undefined');
            console.log('👤 Current user:', ns.currentUser ? ns.currentUser.email : 'none');

            // Test badge update
            if (typeof ns.updateBadge === 'function') {
                console.log('🔄 Testing badge update...');
                ns.updateBadge();
                setTimeout(() => {
                    const badgeAfter = document.querySelector('.notification-badge');
                    console.log('🏷️ Badge after update:', badgeAfter ? badgeAfter.textContent : 'not found');
                }, 100);
            } else {
                console.error('❌ updateBadge method missing');
            }
        } else {
            console.error('❌ unifiedNotifications instance missing');
        }

        console.log('🔍 ===== BASIC CHECK COMPLETE =====');
        console.log('🎯 If you see multiple ❌ errors, the system is broken');
        console.log('🎯 If badge shows "0", try the restore script next');

    }, 2000); // Wait 2 seconds for everything to load
})();
