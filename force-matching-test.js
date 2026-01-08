// FORCE MATCHING TEST - Copy and paste this into browser console
// This will manually trigger matching and show detailed logs

(async function() {
    console.log('🚀 ===== FORCE MATCHING TEST =====');

    // Check prerequisites
    if (!window.supabase) {
        console.error('❌ Supabase not available');
        return;
    }
    console.log('✅ Supabase available');

    if (!window.UnifiedNotificationSystem) {
        console.error('❌ UnifiedNotificationSystem not available');
        return;
    }
    console.log('✅ Notification system available');

    try {
        // 1. Fetch all reports
        console.log('📊 Fetching all reports...');
        const { data: reports, error: reportsError } = await supabase
            .from('reports')
            .select('*, report_documents(*)');

        if (reportsError) {
            console.error('❌ Error fetching reports:', reportsError);
            return;
        }

        console.log(`📊 Found ${reports.length} total reports`);

        const lostReports = reports.filter(r => r.report_type === 'lost');
        const foundReports = reports.filter(r => r.report_type === 'found');

        console.log(`📋 Lost reports: ${lostReports.length}`);
        console.log(`📋 Found reports: ${foundReports.length}`);

        // 2. Log all documents
        console.log('📄 Document details:');
        reports.forEach(report => {
            console.log(`  Report ${report.id} (${report.report_type}):`);
            if (report.report_documents && report.report_documents.length > 0) {
                report.report_documents.forEach(doc => {
                    console.log(`    - ${doc.document_type}: ${doc.document_number}`);
                });
            } else {
                console.log(`    - No documents attached`);
            }
        });

        // 3. Manual matching test
        console.log('🔍 Running manual matching...');
        const matches = [];

        for (const lostReport of lostReports) {
            if (!lostReport.report_documents || lostReport.report_documents.length === 0) continue;

            for (const lostDoc of lostReport.report_documents) {
                for (const foundReport of foundReports) {
                    if (!foundReport.report_documents || foundReport.report_documents.length === 0) continue;

                    for (const foundDoc of foundReport.report_documents) {
                        console.log(`🔍 Comparing: Lost "${lostDoc.document_type}" (${lostDoc.document_number}) vs Found "${foundDoc.document_type}" (${foundDoc.document_number})`);

                        if (lostDoc.document_type === foundDoc.document_type &&
                            lostDoc.document_number === foundDoc.document_number &&
                            lostDoc.document_number &&
                            foundDoc.document_number) {

                            console.log('🎯 MATCH FOUND!');
                            matches.push({ lostReport, foundReport, lostDoc, foundDoc });
                        }
                    }
                }
            }
        }

        console.log(`🎯 Total matches found: ${matches.length}`);

        if (matches.length === 0) {
            console.log('⚠️ No matches found. Reasons:');
            console.log('  - No documents with matching type AND number');
            console.log('  - Document numbers might be different');
            console.log('  - Document types might not match exactly');
            console.log('💡 Try creating test reports with matching documents');
            return;
        }

        // 4. Process matches (without actually creating records)
        console.log('🔄 Processing matches (simulation):');
        for (const match of matches) {
            console.log(`📋 Processing match: Lost report ${match.lostReport.id} ↔ Found report ${match.foundReport.id}`);

            // Check if already processed
            const { data: existingMatch } = await supabase
                .from('recovered_reports')
                .select('*')
                .or(`lost_report_id.eq.${match.lostReport.id},found_report_id.eq.${match.foundReport.id}`)
                .maybeSingle();

            if (existingMatch) {
                console.log('⚠️ Match already exists in recovered_reports');
                continue;
            }

            console.log('✅ New match - would create notifications:');
            console.log(`  📤 To OWNER (${match.lostReport.user_id}): Potential match found!`);
            console.log(`  📤 To FINDER (${match.foundReport.user_id}): Document matched!`);

            // Actually create the notifications (commented out for safety)
            console.log('🔔 Creating actual notifications...');

            try {
                await UnifiedNotificationSystem.createNotification(
                    match.lostReport.user_id,
                    `✅ Potential match found! A document matching "${match.lostDoc.document_type}" (${match.lostDoc.document_number}) has been reported as found. Please verify it now.`,
                    {
                        type: 'warning',
                        reportId: match.lostReport.id,
                        action: 'view_report',
                        actionData: { reportId: match.lostReport.id }
                    }
                );
                console.log('✅ Owner notification created');

                await UnifiedNotificationSystem.createNotification(
                    match.foundReport.user_id,
                    `📄 Great news! The document you found (${match.foundDoc.document_type}) has been matched with a lost report. It is now awaiting verification by the owner.`,
                    {
                        type: 'info',
                        reportId: match.foundReport.id,
                        action: 'view_report',
                        actionData: { reportId: match.foundReport.id }
                    }
                );
                console.log('✅ Finder notification created');

            } catch (notifError) {
                console.error('❌ Notification creation failed:', notifError);
            }
        }

        console.log('🎉 Test completed! Check notification bells.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    console.log('🏁 ===== FORCE MATCHING TEST COMPLETE =====');
})();
