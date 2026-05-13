// Temporary fix for profile loading issues
// Run this in browser console to debug profile loading

(async function debugProfileLoading() {
    console.log('🔍 Starting profile loading debug...');
    
    try {
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            return;
        }
        
        if (!user) {
            console.error('❌ No user authenticated');
            return;
        }
        
        console.log('✅ User authenticated:', user.email, 'ID:', user.id);
        
        // Try direct profile query without caching
        console.log('📋 Querying profile directly...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
        if (profileError) {
            console.error('❌ Profile query error:', profileError);
            
            // Try without .single() to see if multiple profiles exist
            const { data: profiles, error: multipleError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id);
                
            if (multipleError) {
                console.error('❌ Multiple profiles query error:', multipleError);
            } else {
                console.log('📊 Found profiles:', profiles);
            }
        } else {
            console.log('✅ Profile found:', profile);
            
            // Try to update UI directly
            const userNameEl = document.getElementById('userName');
            const userDisplayNameEl = document.getElementById('userDisplayName');
            const userAvatarEl = document.getElementById('userAvatar');
            
            if (userNameEl) {
                userNameEl.textContent = profile?.full_name || user.email.split('@')[0];
                userNameEl.style.display = 'block';
                console.log('✅ Updated userName element');
            }
            
            if (userDisplayNameEl) {
                userDisplayNameEl.textContent = profile?.full_name || user.email.split('@')[0];
                userDisplayNameEl.style.display = 'block';
                console.log('✅ Updated userDisplayName element');
            }
            
            if (userAvatarEl) {
                const avatarUrl = profile?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || user.email.split('@')[0])}&background=random`;
                userAvatarEl.src = avatarUrl;
                userAvatarEl.style.display = 'block';
                console.log('✅ Updated userAvatar element');
            }
            
            // Hide skeletons
            const skeletons = document.querySelectorAll('.skeleton');
            skeletons.forEach(skeleton => {
                skeleton.style.display = 'none';
            });
            console.log('✅ Hidden all skeleton elements');
        }
        
        // Check RLS policies by testing a simple query
        console.log('🔐 Testing RLS policies...');
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .eq('user_id', user.id);
            
        if (testError) {
            console.error('❌ RLS test error:', testError);
        } else {
            console.log('✅ RLS test passed, can access profiles');
        }
        
    } catch (error) {
        console.error('❌ Debug function error:', error);
    }
})();
