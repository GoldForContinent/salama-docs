import { supabase } from './supabase.js';

let documentCounter = 1;
let selectedTimeline = 'today';

// Initialize the form
document.addEventListener('DOMContentLoaded', function() {
    handleDocumentTypeChange();
    updateTotalFee();
    initializeEventListeners();
    loadSavedForm();
    
    // Auto-save every 30 seconds
    setInterval(autoSaveForm, 30000);
});

// Initialize all event listeners
function initializeEventListeners() {
    // Add document button
    document.getElementById('add-document')?.addEventListener('click', addDocument);
    
    // Form submission
    const form = document.getElementById('lost-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Document removal (event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-document')) {
            removeDocument(e.target.closest('.document-item'));
        }
    });
    
    // Timeline clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('timeline-step')) {
            setTimeline(e.target);
        }
    });
    
    // Auto-save on input change
    document.addEventListener('input', function(e) {
        if (e.target.form && e.target.form.id === 'lost-form') {
            autoSaveForm();
        }
    });
}

// Document type change handler
function handleDocumentTypeChange() {
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('document-type')) {
            const selectedOption = e.target.selectedOptions[0];
            const fee = selectedOption?.dataset.fee || 200;
            const feeDisplay = e.target.closest('.document-item').querySelector('.document-fee');
            if (feeDisplay) feeDisplay.textContent = `KSh ${fee}`;
            updateTotalFee();
        }
    });
}

// Add new document function
function addDocument() {
    if (documentCounter >= 10) {
        alert('Maximum 10 documents can be reported at once. Please submit this form and create a new report for additional documents.');
        return;
    }
    
    documentCounter++;
    const container = document.getElementById('documents-container');
    if (!container) return;
    
    const newDocument = document.createElement('div');
    newDocument.className = 'document-item';
    newDocument.setAttribute('data-document-index', documentCounter);
    
    newDocument.innerHTML = `
        <button type="button" class="remove-document" title="Remove this document">
            <i class="fas fa-times"></i>
        </button>
        <h4><span class="document-counter">${documentCounter}</span> Document Details</h4>
        
        <div class="form-group">
            <label>What type of document did you lose? 
                <span class="recovery-fee document-fee">KSh 200</span>
            </label>
            <select class="document-type" required>
                <option value="">Select document type</option>
                <optgroup label="🆔 Government Identification">
                    <option value="national_id" data-fee="300" data-category="Gov ID">National ID Card</option>
                    <option value="passport" data-fee="800" data-category="Gov ID">Kenyan Passport</option>
                    <option value="alien_id" data-fee="400" data-category="Gov ID">Alien ID Card</option>
                    <option value="refugee_id" data-fee="350" data-category="Gov ID">Refugee ID</option>
                    <option value="military_id" data-fee="500" data-category="Gov ID">Military ID</option>
                </optgroup>
                <optgroup label="🚗 Driving & Vehicle">
                    <option value="driving_license" data-fee="400" data-category="Transport">Driving License</option>
                    <option value="logbook" data-fee="1500" data-category="Transport">Vehicle Logbook</option>
                    <option value="psi_certificate" data-fee="300" data-category="Transport">PSI Certificate</option>
                    <option value="towing_permit" data-fee="200" data-category="Transport">Towing Permit</option>
                    <option value="badge" data-fee="250" data-category="Transport">PSV Badge</option>
                </optgroup>
                <optgroup label="🎓 Educational Documents">
                    <option value="kcpe_certificate" data-fee="300" data-category="Education">KCPE Certificate</option>
                    <option value="kcse_certificate" data-fee="400" data-category="Education">KCSE Certificate</option>
                    <option value="university_degree" data-fee="800" data-category="Education">University Degree</option>
                    <option value="college_diploma" data-fee="600" data-category="Education">College Diploma/Certificate</option>
                    <option value="transcript" data-fee="500" data-category="Education">Official Transcript</option>
                    <option value="student_id" data-fee="150" data-category="Education">Student ID Card</option>
                </optgroup>
                <optgroup label="💼 Professional Documents">
                    <option value="work_permit" data-fee="800" data-category="Professional">Work Permit</option>
                    <option value="professional_license" data-fee="600" data-category="Professional">Professional License</option>
                    <option value="practicing_certificate" data-fee="700" data-category="Professional">Practicing Certificate</option>
                    <option value="kra_pin" data-fee="200" data-category="Professional">KRA PIN Certificate</option>
                    <option value="business_permit" data-fee="500" data-category="Professional">Business Permit</option>
                </optgroup>
                <optgroup label="🏠 Property & Legal">
                    <option value="title_deed" data-fee="2000" data-category="Property">Title Deed</option>
                    <option value="lease_agreement" data-fee="600" data-category="Property">Lease Agreement</option>
                    <option value="allotment_letter" data-fee="800" data-category="Property">Land Allotment Letter</option>
                    <option value="court_order" data-fee="1000" data-category="Legal">Court Order</option>
                    <option value="power_attorney" data-fee="700" data-category="Legal">Power of Attorney</option>
                </optgroup>
                <optgroup label="💳 Financial Documents">
                    <option value="bank_card" data-fee="200" data-category="Financial">Bank/ATM Card</option>
                    <option value="checkbook" data-fee="300" data-category="Financial">Checkbook</option>
                    <option value="loan_agreement" data-fee="400" data-category="Financial">Loan Agreement</option>
                    <option value="insurance_policy" data-fee="350" data-category="Financial">Insurance Policy</option>
                </optgroup>
                <optgroup label="🏥 Health Documents">
                    <option value="birth_certificate" data-fee="400" data-category="Health">Birth Certificate</option>
                    <option value="death_certificate" data-fee="500" data-category="Health">Death Certificate</option>
                    <option value="marriage_certificate" data-fee="600" data-category="Health">Marriage Certificate</option>
                    <option value="medical_report" data-fee="250" data-category="Health">Medical Report</option>
                    <option value="nhif_card" data-fee="150" data-category="Health">NHIF Card</option>
                </optgroup>
                <optgroup label="📄 Other Important">
                    <option value="will" data-fee="1200" data-category="Legal">Will/Testament</option>
                    <option value="adoption_papers" data-fee="800" data-category="Legal">Adoption Papers</option>
                    <option value="guardianship" data-fee="700" data-category="Legal">Guardianship Papers</option>
                    <option value="other" data-fee="100" data-category="Other">Other Document</option>
                </optgroup>
            </select>
        </div>
        
        <div class="form-group">
            <label>Document Number (if known)</label>
            <input type="text" class="document-number" placeholder="e.g. 12345678 or any visible number">
        </div>
    `;
    
    container.appendChild(newDocument);
    newDocument.style.opacity = '0';
    newDocument.style.transform = 'translateY(20px)';
    setTimeout(() => {
        newDocument.style.transition = 'all 0.3s ease';
        newDocument.style.opacity = '1';
        newDocument.style.transform = 'translateY(0)';
    }, 10);
    
    updateTotalFee();
    updateDocumentCounters();
}

// Remove document function
function removeDocument(documentItem) {
    if (!documentItem || document.querySelectorAll('.document-item').length <= 1) {
        alert('You must report at least one document.');
        return;
    }
    
    documentItem.style.transition = 'all 0.3s ease';
    documentItem.style.opacity = '0';
    documentItem.style.transform = 'translateX(-100%)';
    
    setTimeout(() => {
        documentItem.remove();
        updateTotalFee();
        updateDocumentCounters();
    }, 300);
}

// Update document counters
function updateDocumentCounters() {
    const documentItems = document.querySelectorAll('.document-item');
    documentItems.forEach((item, index) => {
        const counter = item.querySelector('.document-counter');
        if (counter) counter.textContent = index + 1;
        item.setAttribute('data-document-index', index + 1);
    });
    documentCounter = documentItems.length;
    document.getElementById('document-count').textContent = documentCounter;
}

// Update total fee
function updateTotalFee() {
    const documentTypes = document.querySelectorAll('.document-type');
    let totalFee = 0;
    
    documentTypes.forEach(select => {
        const selectedOption = select.selectedOptions[0];
        totalFee += selectedOption?.dataset.fee ? parseInt(selectedOption.dataset.fee) : 200;
    });
    
    const totalFeeElement = document.querySelector('.total-fee .amount');
    if (totalFeeElement) {
        totalFeeElement.textContent = `KSh ${totalFee.toLocaleString()}`;
    }
    
    const confirmTotalFee = document.getElementById('confirm-total-fee');
    if (confirmTotalFee) {
        confirmTotalFee.textContent = `KSh ${totalFee.toLocaleString()}`;
    }
}

// Robust setTimeline function
function setTimeline(input) {
    let value = 'today';
    let clickedElement = null;

    if (!input) {
        selectedTimeline = value;
    } else if (typeof input === 'string') {
        value = input;
        selectedTimeline = value;
    } else if (input.getAttribute) {
        // Try to get a data-value or value attribute, fallback to textContent
        value = input.getAttribute('data-value') || input.value || input.textContent.trim().toLowerCase() || 'today';
        selectedTimeline = value;
        clickedElement = input;
    }

    // Update UI: remove .active from all, add to the clicked one
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.classList.remove('active');
        // If the value matches, add .active
        if (
            (step.getAttribute('data-value') && step.getAttribute('data-value') === value) ||
            (step.textContent.trim().toLowerCase() === value)
        ) {
            step.classList.add('active');
        }
    });
}

// Validate phone number
function validatePhoneNumber(phone) {
    return /^(07|01)\d{8}$/.test(phone.replace(/\s+/g, ''));
}

// Validate email
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('🚀 Form submission started');
    
    const errors = validateForm();
    if (errors.length > 0) {
        console.log('❌ Form validation failed:', errors);
        showValidationErrors(errors);
        return;
    }
    console.log('✅ Form validation passed');
    
    const formData = collectFormData();
    if (!formData) {
        console.log('❌ Form data collection failed');
        return;
    }
    console.log('✅ Form data collected:', formData);
    
    // Ensure timeline is valid
    const allowedTimelines = ['today', 'yesterday', 'week', 'month'];
    if (!allowedTimelines.includes(formData.timeline)) {
        console.warn('Invalid timeline value:', formData.timeline, 'Defaulting to today');
        formData.timeline = 'today';
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    if (!submitBtn) {
        console.error('❌ Submit button not found');
        return;
    }
    
    console.log('🔄 Setting loading state on submit button');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    try {
        console.log('🔐 Getting current user...');
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('❌ User authentication failed:', userError);
            throw new Error("User not logged in");
        }
        console.log('✅ User authenticated:', user.email);

        console.log('💾 Submitting report to Supabase...');
        // Submit to Supabase
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .insert([{
                user_id: user.id,
                report_type: 'lost',
                status: 'active',
                full_name: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                timeline: formData.timeline,
                location_description: formData.lastSeenLocation,
                additional_details: formData.additionalInfo,
                recovery_fee: formData.totalFee
            }])
            .select()
            .single();

        if (reportError) {
            console.error('❌ Report submission failed:', reportError);
            throw reportError;
        }
        console.log('✅ Report submitted successfully:', report);

        console.log('🔔 Creating notification...');
        // 🔔 Send notification to user
        try {
            // Get the first document details for specific notification
            const firstDoc = formData.documents[0];
            const documentType = firstDoc?.type || 'document';
            const documentNumber = firstDoc?.number || 'N/A';
            
            // Direct notification creation without importing UnifiedNotificationSystem
            await supabase.from('notifications').insert({
                user_id: user.id,
                message: `🔍 Search started for your lost ${documentType} (No: ${documentNumber}). We'll notify you when we find potential matches.`,
                type: 'info',
                status: 'unread',
                related_report_id: report.id,
                notification_action: 'view_reports',
                action_data: { report_id: report.id },
                created_at: new Date().toISOString()
            });
            console.log('✅ Lost report notification created successfully');
            
            // Start match detection system if not already running
            if (window.unifiedNotifications && typeof window.unifiedNotifications.startMatchDetection === 'function') {
                window.unifiedNotifications.startMatchDetection();
                console.log('🔍 Match detection system started from reportlost');
            }
            
        } catch (notifError) {
            console.error('❌ Notification error:', notifError);
            // Don't fail the report creation if notification fails
        }

        console.log('📄 Saving documents...');
        // Save documents
        console.log('formData.documents:', formData.documents); // DEBUG LOG
        const documentPromises = formData.documents.map(doc => 
            supabase.from('report_documents').insert({
                report_id: report.id,
                document_type: doc.value, // Use doc.value (database value) instead of doc.type (display text)
                document_number: doc.number,
                category: doc.category,
                is_recovered: false // Ensure this is set
            })
        );

        console.log('⏳ Waiting for document saves to complete...');
        await Promise.all(documentPromises);
        console.log('✅ All documents saved successfully');
        
        console.log('🎉 Showing confirmation screen...');
        showConfirmation(report);
        
        console.log('📢 Showing success alert...');
        // Success notification
        alert("Report submitted successfully!");
        
        console.log('🔄 Resetting form...');
        // Optionally reset the form
        document.getElementById('lost-form').reset();
        // Optionally clear saved form data
        clearSavedForm();
        
        console.log('✅ Form submission completed successfully');
    } catch (error) {
        console.error("❌ Submission failed:", error);
        alert("Error submitting report. Please try again.\n" + (error.message || error));
    } finally {
        console.log('🔄 Resetting submit button state...');
        submitBtn.innerHTML = 'Submit Report';
        submitBtn.disabled = false;
        console.log('✅ Submit button reset complete');
    }
}

// Collect form data
function collectFormData() {
    const documentItems = document.querySelectorAll('.document-item');
    const documents = [];
    let totalFee = 0;
    
    try {
        documentItems.forEach((item, index) => {
            const documentType = item.querySelector('.document-type');
            const documentNumber = item.querySelector('.document-number');
            
            if (!documentType.value) {
                throw new Error(`Please select a document type for document ${index + 1}`);
            }
            
            const selectedOption = documentType.selectedOptions[0];
            const fee = parseInt(selectedOption.dataset.fee) || 200;
            totalFee += fee;
            
            documents.push({
                value: documentType.value,        // Database value (e.g., 'towing_permit')
                type: selectedOption.textContent,  // Display text (e.g., 'Towing Permit')
                number: documentNumber?.value.trim() || '',
                fee: fee,
                category: selectedOption.dataset.category || 'Other'
            });
        });
    } catch (error) {
        alert(error.message);
        return null;
    }
    
    return {
        fullName: document.getElementById('full-name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        lastSeenLocation: document.getElementById('last-seen-location').value.trim(),
        lastSeenDetails: document.getElementById('last-seen-details').value.trim(),
        additionalInfo: document.getElementById('additional-info').value.trim(),
        timeline: selectedTimeline,
        documents: documents,
        totalFee: totalFee
    };
}

// Validate form
function validateForm() {
    const errors = [];
    const requiredFields = [
        { id: 'full-name', name: 'Full name', minLength: 3 },
        { id: 'phone', name: 'Phone number', validator: validatePhoneNumber },
        { id: 'email', name: 'Email address', validator: validateEmail },
        { id: 'last-seen-location', name: 'Last seen location', minLength: 5 }
    ];
    
    requiredFields.forEach(field => {
        const value = document.getElementById(field.id)?.value.trim();
        if (!value) {
            errors.push(`${field.name} is required`);
        } else if (field.minLength && value.length < field.minLength) {
            errors.push(`${field.name} must be at least ${field.minLength} characters`);
        } else if (field.validator && !field.validator(value)) {
            errors.push(`Please enter a valid ${field.name.toLowerCase()}`);
        }
    });
    
    // Check at least one document is selected
    const hasSelectedDocument = Array.from(document.querySelectorAll('.document-type'))
        .some(select => select.value);
    
    if (!hasSelectedDocument) {
        errors.push('Please select at least one document type');
    }
    
    return errors;
}

// Submit report to Supabase
async function submitReport(formData) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');
    
    // Create main report
    const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert([{
            user_id: user.id,
            report_type: 'lost',
            status: 'active',
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            timeline: formData.timeline,
            location_description: formData.lastSeenLocation,
            additional_details: formData.additionalInfo,
            recovery_fee: formData.totalFee
        }])
        .select()
        .single();
    
    if (reportError) throw reportError;
    
    // Create document records
    const documentPromises = formData.documents.map(doc => 
        supabase.from('report_documents').insert({
            report_id: report.id,
            document_type: doc.type, // Always use the value key
            document_number: doc.number,
            category: doc.category,
            is_recovered: false // Ensure this is set
        })
    );
    
    const results = await Promise.all(documentPromises);
    const docErrors = results.filter(r => r.error);
    if (docErrors.length > 0) throw docErrors[0].error;
    
    return {
        ...formData,
        id: report.id,
        timestamp: new Date().toISOString(),
        status: 'active'
    };
}

// Show confirmation screen
function showConfirmation(reportData) {
    const form = document.getElementById('lost-form');
    const confirmation = document.getElementById('confirmation');
    if (!form || !confirmation) return;
    form.style.display = 'none';
    confirmation.style.display = 'block';
    document.getElementById('confirm-phone').textContent = reportData.phone;
    document.getElementById('confirm-email').textContent = reportData.email;
    const totalFee = reportData.totalFee || 0;
    document.getElementById('confirm-total-fee').textContent = `KSh ${totalFee.toLocaleString()}`;
    // Document summary
    const documentsSummary = document.getElementById('documents-summary');
    // Fetch and display document details
    supabase
      .from('report_documents')
      .select('*')
      .eq('report_id', reportData.id)
      .then(({ data: docs }) => {
        if (docs && docs.length > 0) {
          documentsSummary.innerHTML = docs.map(doc =>
            `<div><strong>${getReadableDocType(doc.document_type) || doc.typeName || doc.document_type || 'Unknown'}</strong> ${doc.document_number ? doc.document_number : ''}</div>`
          ).join('');
        } else {
          documentsSummary.innerHTML = 'No document details available.';
        }
      });
    
    // Run automated matching after a short delay to ensure the report is fully saved
    setTimeout(async () => {
        if (typeof window.runAutomatedMatching === 'function') {
            console.log('🔍 Running automated matching after lost report submission...');
            await window.runAutomatedMatching();
        }
    }, 2000);
}

// Send notifications
async function sendNotifications(reportData) {
    console.log('Sending notifications for report:', reportData.id);
    
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user found');
            return;
        }
        
        // Create notification in database
        const notification = await window.createReportNotification(
            user.id, 
            'lost', 
            reportData.id, 
            reportData.documents?.length || 1
        );
        
        if (notification) {
            // Show success message
            const successNotification = document.createElement('div');
            successNotification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
            successNotification.innerHTML = `
        <i class="fas fa-check-circle"></i>
                Report submitted successfully! You'll receive notifications for any matches.
    `;
    
            document.body.appendChild(successNotification);
            setTimeout(() => successNotification.remove(), 5000);
        }
        
        // TODO: Send SMS and email notifications here
        console.log('SMS and email notifications would be sent to:', reportData.phone, reportData.email);
        
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

// Report another document
function reportAnother() {
    const form = document.getElementById('lost-form');
    const confirmation = document.getElementById('confirmation');
    if (!form || !confirmation) return;
    
    form.reset();
    form.style.display = 'block';
    confirmation.style.display = 'none';
    
    // Reset documents
    documentCounter = 1;
    const container = document.getElementById('documents-container');
    if (container) {
        const documentItems = container.querySelectorAll('.document-item');
        for (let i = 1; i < documentItems.length; i++) {
            documentItems[i].remove();
        }
        
        const firstDocument = container.querySelector('.document-item');
        if (firstDocument) {
            firstDocument.querySelector('.document-type').selectedIndex = 0;
            firstDocument.querySelector('.document-number').value = '';
            firstDocument.querySelector('.document-fee').textContent = 'KSh 200';
        }
    }
    
    // Reset timeline
    selectedTimeline = 'today';
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.timeline-step')?.classList.add('active');
    
    updateTotalFee();
    updateDocumentCounters();
    window.scrollTo(0, 0);
}

// Auto-save form data
function autoSaveForm() {
    const formData = {
        fullName: document.getElementById('full-name')?.value,
        phone: document.getElementById('phone')?.value,
        email: document.getElementById('email')?.value,
        lastSeenLocation: document.getElementById('last-seen-location')?.value,
        lastSeenDetails: document.getElementById('last-seen-details')?.value,
        additionalInfo: document.getElementById('additional-info')?.value,
        timeline: selectedTimeline
    };
    
    window.salamaFormDraft = formData;
}

// Load saved form data
function loadSavedForm() {
    const savedData = window.salamaFormDraft;
    if (!savedData) return;
    
    document.getElementById('full-name').value = savedData.fullName || '';
    document.getElementById('phone').value = savedData.phone || '';
    document.getElementById('email').value = savedData.email || '';
    document.getElementById('last-seen-location').value = savedData.lastSeenLocation || '';
    document.getElementById('last-seen-details').value = savedData.lastSeenDetails || '';
    document.getElementById('additional-info').value = savedData.additionalInfo || '';
    
    if (savedData.timeline) {
        selectedTimeline = savedData.timeline;
        document.querySelectorAll('.timeline-step').forEach(step => {
            step.classList.remove('active');
            if (step.getAttribute('onclick')?.includes(savedData.timeline)) {
                step.classList.add('active');
            }
        });
    }
}

// Clear saved form data
function clearSavedForm() {
    window.salamaFormDraft = null;
}

// Show validation errors
function showValidationErrors(errors) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'validation-errors';
    errorContainer.style.cssText = `
        background: #ffebee;
        color: #c62828;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #c62828;
    `;
    
    errorContainer.innerHTML = `
        <h4><i class="fas fa-exclamation-triangle"></i> Please fix the following errors:</h4>
        <ul>
            ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    `;
    
    const existingErrors = document.querySelector('.validation-errors');
    if (existingErrors) existingErrors.remove();
    
    const form = document.getElementById('lost-form');
    if (form) form.insertBefore(errorContainer, form.firstChild);
    
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Expose setTimeline globally
window.setTimeline = setTimeline;

// Replace docTypeMap with snake_case keys
const docTypeMap = {
    'national_id': 'National ID Card',
    'passport': 'Kenyan Passport',
    'alien_id': 'Alien ID Card',
    'refugee_id': 'Refugee ID',
    'military_id': 'Military ID',
    'driving_license': 'Driving License',
    'logbook': 'Vehicle Logbook',
    'psi_certificate': 'PSI Certificate',
    'towing_permit': 'Towing Permit',
    'badge': 'PSV Badge',
    'kcpe_certificate': 'KCPE Certificate',
    'kcse_certificate': 'KCSE Certificate',
    'university_degree': 'University Degree',
    'college_diploma': 'College Diploma/Certificate',
    'transcript': 'Official Transcript',
    'student_id': 'Student ID Card',
    'work_permit': 'Work Permit',
    'professional_license': 'Professional License',
    'practicing_certificate': 'Practicing Certificate',
    'kra_pin': 'KRA PIN Certificate',
    'business_permit': 'Business Permit',
    'title_deed': 'Title Deed',
    'lease_agreement': 'Lease Agreement',
    'allotment_letter': 'Land Allotment Letter',
    'court_order': 'Court Order',
    'power_attorney': 'Power of Attorney',
    'bank_card': 'Bank/ATM Card',
    'checkbook': 'Checkbook',
    'loan_agreement': 'Loan Agreement',
    'insurance_policy': 'Insurance Policy',
    'birth_certificate': 'Birth Certificate',
    'death_certificate': 'Death Certificate',
    'marriage_certificate': 'Marriage Certificate',
    'medical_report': 'Medical Report',
    'nhif_card': 'NHIF Card',
    'will': 'Will/Testament',
    'adoption_papers': 'Adoption Papers',
    'guardianship': 'Guardianship Papers',
    'other': 'Other Document'
};
function getReadableDocType(type) {
    return docTypeMap[type] || type || 'Unknown Document';
}
