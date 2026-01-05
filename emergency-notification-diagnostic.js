// EMERGENCY NOTIFICATION DIAGNOSTIC
// Check why the bell isn't showing notification count

(function() {
    console.log('🚨 ===== EMERGENCY NOTIFICATION DIAGNOSTIC =====');

    // 1. Check if system exists
    console.log('1️⃣ SYSTEM EXISTENCE CHECK:');
    console.log('✅ UnifiedNotificationSystem class:', typeof window.UnifiedNotificationSystem);
    console.log('✅ unifiedNotifications instance:', typeof window.unifiedNotifications);

    if (!window.unifiedNotifications) {
        console.error('❌ CRITICAL: unifiedNotifications instance does not exist!');
        console.log('🔍 Checking if script loaded...');

        // Check if the script file exists
        const scripts = document.querySelectorAll('script');
        let notificationScriptFound = false;
        scripts.forEach(script => {
            if (script.src && script.src.includes('notifications-unified.js')) {
                notificationScriptFound = true;
                console.log('✅ Script tag found:', script.src);
            }
        });

        if (!notificationScriptFound) {
            console.error('❌ Script not loaded! Check HTML for notifications-unified.js');
        }

        return; // Can't continue without instance
    }

    // 2. Check basic properties
    console.log('2️⃣ BASIC PROPERTIES CHECK:');
    const ns = window.unifiedNotifications;
    console.log('✅ Current user:', ns.currentUser ? ns.currentUser.email : 'null');
    console.log('✅ Notifications array:', ns.notifications);
    console.log('✅ Notifications count:', ns.notifications ? ns.notifications.length : 'undefined');
    console.log('✅ Current filter:', ns.currentFilter);
    console.log('✅ Is open:', ns.isOpen);

    // 3. Check HTML elements
    console.log('3️⃣ HTML ELEMENTS CHECK:');
    const bell = document.querySelector('.notification-bell');
    const badge = document.querySelector('.notification-badge');
    const modal = document.getElementById('notificationModal');
    const list = document.getElementById('notificationList');

    console.log('🔔 Bell element:', bell ? 'EXISTS' : 'MISSING');
    console.log('🏷️ Badge element:', badge ? 'EXISTS' : 'MISSING');
    console.log('📱 Modal element:', modal ? 'EXISTS' : 'MISSING');
    console.log('📋 List element:', list ? 'EXISTS' : 'MISSING');

    if (badge) {
        console.log('🏷️ Badge text content:', badge.textContent);
        console.log('🏷️ Badge display style:', window.getComputedStyle(badge).display);
    }

    // 4. Test badge update manually
    console.log('4️⃣ MANUAL BADGE UPDATE TEST:');
    if (ns && typeof ns.updateBadge === 'function') {
        console.log('🔄 Calling updateBadge()...');
        try {
            ns.updateBadge();
            console.log('✅ updateBadge() completed without error');

            // Check badge again
            const badgeAfter = document.querySelector('.notification-badge');
            if (badgeAfter) {
                console.log('🏷️ Badge after update:', badgeAfter.textContent);
            }
        } catch (error) {
            console.error('❌ updateBadge() failed:', error);
        }
    } else {
        console.error('❌ updateBadge method not found!');
    }

    // 5. Test notification fetch manually
    console.log('5️⃣ MANUAL FETCH TEST:');
    if (ns && typeof ns.fetchNotifications === 'function') {
        console.log('📥 Calling fetchNotifications()...');
        ns.fetchNotifications().then(() => {
            console.log('✅ fetchNotifications() completed');
            console.log('📊 Notifications after fetch:', ns.notifications.length);
        }).catch(error => {
            console.error('❌ fetchNotifications() failed:', error);
        });
    } else {
        console.error('❌ fetchNotifications method not found!');
    }

    // 6. Check for JavaScript errors
    console.log('6️⃣ JAVASCRIPT ERROR CHECK:');
    console.log('🔍 Check browser console for any red error messages above this line');

    // 7. Check Supabase connection
    console.log('7️⃣ SUPABASE CONNECTION CHECK:');
    console.log('🗄️ Supabase client:', typeof window.supabase);
    if (window.supabase) {
        console.log('✅ Supabase available');
    } else {
        console.error('❌ Supabase not available - check supabase.js loading');
    }

    // 8. Force badge update with test data
    console.log('8️⃣ FORCE BADGE UPDATE TEST:');
    if (badge) {
        console.log('🔧 Forcing badge to show "99" for testing...');
        badge.textContent = '99';
        badge.style.display = 'flex';
        badge.style.background = 'red';
        badge.style.color = 'white';
        console.log('✅ Forced badge update complete - should show red "99" now');
    }

    // 9. Check for CSS conflicts
    console.log('9️⃣ CSS CONFLICT CHECK:');
    const allStyles = document.styleSheets;
    let notificationStylesFound = false;
    for (let i = 0; i < allStyles.length; i++) {
        try {
            const sheet = allStyles[i];
            if (sheet.href && sheet.href.includes('notifications-unified.css')) {
                notificationStylesFound = true;
                console.log('✅ notifications-unified.css found');
                break;
            }
        } catch (e) {
            // Cross-origin stylesheet, skip
        }
    }

    if (!notificationStylesFound) {
        console.error('❌ notifications-unified.css not loaded!');
    }

    console.log('🚨 ===== DIAGNOSTIC COMPLETE =====');
    console.log('📋 SUMMARY:');
    console.log('🔍 Check the results above for any ❌ CRITICAL errors');
    console.log('🎯 If bell/badge elements are missing, check HTML');
    console.log('🎯 If methods are missing, check script loading');
    console.log('🎯 If fetch fails, check Supabase/auth');
})();
