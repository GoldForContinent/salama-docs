import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Starting automated matching with service role...')

    // Get ALL reports with their documents (bypassing RLS)
    const { data: reports, error: reportsError } = await supabaseClient
      .from('reports')
      .select('*, report_documents(*)')
      
    if (reportsError) {
      console.error('❌ Error fetching reports:', reportsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch reports', details: reportsError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!reports || reports.length === 0) {
      console.log('ℹ️ No reports found in database')
      return new Response(
        JSON.stringify({ message: 'No reports found', matches: [] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📊 Found ${reports.length} total reports in database`)

    // Group reports by type
    const lostReports = reports.filter(r => r.report_type === 'lost' && r.status === 'active')
    const foundReports = reports.filter(r => r.report_type === 'found' && r.status === 'active')

    console.log(`📋 Active lost reports: ${lostReports.length}`)
    console.log(`📋 Active found reports: ${foundReports.length}`)

    // Early exit if no reports to match
    if (lostReports.length === 0 || foundReports.length === 0) {
      console.log('ℹ️ No active lost or found reports to match')
      return new Response(
        JSON.stringify({ 
          message: 'No active reports to match', 
          matches: [],
          stats: { lost: lostReports.length, found: foundReports.length }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find matches based on document type and number
    const matches = []
    const processedMatches = []

    for (const lostReport of lostReports) {
      if (!lostReport.report_documents || lostReport.report_documents.length === 0) {
        console.log(`⚠️ Lost report ${lostReport.id} has no documents`)
        continue
      }

      for (const lostDoc of lostReport.report_documents) {
        console.log(`🔍 Checking lost document: ${lostDoc.document_type} (${lostDoc.document_number})`)

        for (const foundReport of foundReports) {
          if (!foundReport.report_documents || foundReport.report_documents.length === 0) {
            console.log(`⚠️ Found report ${foundReport.id} has no documents`)
            continue
          }

          for (const foundDoc of foundReport.report_documents) {
            console.log(`🔍 Comparing with found document: ${foundDoc.document_type} (${foundDoc.document_number})`)

            // Check if documents match
            if (lostDoc.document_type === foundDoc.document_type && 
                lostDoc.document_number === foundDoc.document_number &&
                lostDoc.document_number && foundDoc.document_number) {

              console.log(`🎯 MATCH FOUND! Document: ${lostDoc.document_type} (${lostDoc.document_number})`)
              console.log(`   Lost Report: ${lostReport.id} (${lostReport.full_name})`)
              console.log(`   Found Report: ${foundReport.id} (${foundReport.full_name})`)

              // Check if this match already exists in recovered_reports
              const { data: existingMatch } = await supabaseClient
                .from('recovered_reports')
                .select('*')
                .or(`lost_report_id.eq.${lostReport.id},found_report_id.eq.${foundReport.id}`)
                .maybeSingle()

              if (!existingMatch) {
                matches.push({
                  lostReport,
                  foundReport,
                  lostDoc,
                  foundDoc
                })
                console.log(`✅ New match added: Lost ${lostReport.id} ↔ Found ${foundReport.id}`)
              } else {
                console.log(`⚠️ Match already exists in recovered_reports`)
              }
            } else {
              // Log why documents don't match
              if (lostDoc.document_type !== foundDoc.document_type) {
                console.log(`   ❌ Document types don't match: ${lostDoc.document_type} vs ${foundDoc.document_type}`)
              }
              if (lostDoc.document_number !== foundDoc.document_number) {
                console.log(`   ❌ Document numbers don't match: "${lostDoc.document_number}" vs "${foundDoc.document_number}"`)
              }
              if (!lostDoc.document_number || !foundDoc.document_number) {
                console.log(`   ❌ Missing document number: lost="${lostDoc.document_number}", found="${foundDoc.document_number}"`)
              }
            }
          }
        }
      }
    }

    console.log(`📊 Found ${matches.length} potential matches`)

    // Process matches
    for (const match of matches) {
      try {
        console.log(`🔄 Processing match: Lost ${match.lostReport.id} ↔ Found ${match.foundReport.id}`)

        // Update both reports to potential_match
        const { error: lostError } = await supabaseClient
          .from('reports')
          .update({ status: 'potential_match' })
          .eq('id', match.lostReport.id)

        const { error: foundError } = await supabaseClient
          .from('reports')
          .update({ status: 'potential_match' })
          .eq('id', match.foundReport.id)

        if (lostError || foundError) {
          console.error('❌ Error updating report statuses:', lostError || foundError)
          continue
        }

        // Insert into recovered_reports
        const { error: recoveredError } = await supabaseClient
          .from('recovered_reports')
          .insert({
            lost_report_id: match.lostReport.id,
            found_report_id: match.foundReport.id,
            status: 'recovered'
          })

        if (recoveredError) {
          console.error('❌ Error creating recovered report:', recoveredError)
          continue
        }

        console.log(`✅ Match created successfully: Lost report ${match.lostReport.id} ↔ Found report ${match.foundReport.id}`)

        // Add to processed matches for response
        processedMatches.push({
          lostReportId: match.lostReport.id,
          foundReportId: match.foundReport.id,
          documentType: match.lostDoc.document_type,
          documentNumber: match.lostDoc.document_number,
          lostOwner: match.lostReport.full_name,
          foundOwner: match.foundReport.full_name
        })

      } catch (error) {
        console.error('❌ Error processing match:', error)
      }
    }

    // Create notifications for users involved in matches
    for (const match of processedMatches) {
      try {
        // Get the lost report owner
        const { data: lostReport } = await supabaseClient
          .from('reports')
          .select('user_id, full_name')
          .eq('id', match.lostReportId)
          .single()

        // Get the found report owner
        const { data: foundReport } = await supabaseClient
          .from('reports')
          .select('user_id, full_name')
          .eq('id', match.foundReportId)
          .single()

        if (lostReport && lostReport.user_id) {
          // Notify lost report owner
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: lostReport.user_id,
              title: 'Potential Match Found!',
              message: `Your lost ${match.documentType} (${match.documentNumber}) may have been found! Check your reports for details.`,
              type: 'potential_match',
              status: 'unread',
              related_id: match.lostReportId,
              created_at: new Date().toISOString()
            })
        }

        if (foundReport && foundReport.user_id) {
          // Notify found report owner
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: foundReport.user_id,
              title: 'Potential Match Found!',
              message: `Your found ${match.documentType} (${match.documentNumber}) may match a lost report! Check your reports for details.`,
              type: 'potential_match',
              status: 'unread',
              related_id: match.foundReportId,
              created_at: new Date().toISOString()
            })
        }

      } catch (error) {
        console.error('❌ Error creating notifications:', error)
      }
    }

    const response = {
      success: true,
      message: `Found ${processedMatches.length} potential matches`,
      matches: processedMatches,
      stats: {
        totalReports: reports.length,
        activeLost: lostReports.length,
        activeFound: foundReports.length,
        newMatches: processedMatches.length
      }
    }

    console.log('✅ Matching completed successfully')
    console.log('📊 Response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in matching function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 