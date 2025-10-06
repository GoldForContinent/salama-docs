 let documentCounter = 1;
let selectedTimeline = 'today';

// Initialize the form
document.addEventListener('DOMContentLoaded', function() {
    handleDocumentTypeChange();
    updateTotalFee();
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Add document button
    const addDocBtn = document.getElementById('add-document');
    if (addDocBtn) {
        addDocBtn.addEventListener('click', addDocument);
    }
    
    // Form submission - Multiple ways to ensure it works
    const form = document.getElementById('lost-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Also attach to submit button directly as backup
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleFormSubmit(e);
        });
    }
    
    // Document removal (event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-document') || e.target.closest('.remove-document')) {
            removeDocument(e.target.closest('.document-item'));
        }
    });
    
    // Timeline clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('timeline-step')) {
            setTimeline(e.target);
        }
    });
}

// Document type change handler
function handleDocumentTypeChange() {
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('document-type')) {
            const selectedOption = e.target.selectedOptions[0];
            const fee = selectedOption.dataset.fee || 200;
            const feeDisplay = e.target.closest('.document-item').querySelector('.document-fee');
            feeDisplay.textContent = `KSh ${fee}`;
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
                
                <!-- Government Identification -->
                <optgroup label="🆔 Government Identification">
                    <option value="national-id" data-fee="300" data-category="Gov ID">National ID Card</option>
                    <option value="passport" data-fee="800" data-category="Gov ID">Kenyan Passport</option>
                    <option value="alien-id" data-fee="400" data-category="Gov ID">Alien ID Card</option>
                    <option value="refugee-id" data-fee="350" data-category="Gov ID">Refugee ID</option>
                    <option value="military-id" data-fee="500" data-category="Gov ID">Military ID</option>
                </optgroup>
                
                <!-- Driving & Vehicle -->
                <optgroup label="🚗 Driving & Vehicle">
                    <option value="driving-license" data-fee="400" data-category="Transport">Driving License</option>
                    <option value="logbook" data-fee="1500" data-category="Transport">Vehicle Logbook</option>
                    <option value="psi-certificate" data-fee="300" data-category="Transport">PSI Certificate</option>
                    <option value="towing-permit" data-fee="200" data-category="Transport">Towing Permit</option>
                    <option value="badge" data-fee="250" data-category="Transport">PSV Badge</option>
                </optgroup>
                
                <!-- Education -->
                <optgroup label="🎓 Educational Documents">
                    <option value="kcpe-certificate" data-fee="300" data-category="Education">KCPE Certificate</option>
                    <option value="kcse-certificate" data-fee="400" data-category="Education">KCSE Certificate</option>
                    <option value="university-degree" data-fee="800" data-category="Education">University Degree</option>
                    <option value="college-diploma" data-fee="600" data-category="Education">College Diploma/Certificate</option>
                    <option value="transcript" data-fee="500" data-category="Education">Official Transcript</option>
                    <option value="student-id" data-fee="150" data-category="Education">Student ID Card</option>
                </optgroup>
                
                <!-- Professional -->
                <optgroup label="💼 Professional Documents">
                    <option value="work-permit" data-fee="800" data-category="Professional">Work Permit</option>
                    <option value="professional-license" data-fee="600" data-category="Professional">Professional License</option>
                    <option value="practicing-certificate" data-fee="700" data-category="Professional">Practicing Certificate</option>
                    <option value="tax-pin" data-fee="200" data-category="Professional">KRA PIN Certificate</option>
                    <option value="business-permit" data-fee="500" data-category="Professional">Business Permit</option>
                </optgroup>
                
                <!-- Property & Legal -->
                <optgroup label="🏠 Property & Legal">
                    <option value="title-deed" data-fee="2000" data-category="Property">Title Deed</option>
                    <option value="lease-agreement" data-fee="600" data-category="Property">Lease Agreement</option>
                    <option value="allotment-letter" data-fee="800" data-category="Property">Land Allotment Letter</option>
                    <option value="court-order" data-fee="1000" data-category="Legal">Court Order</option>
                    <option value="power-attorney" data-fee="700" data-category="Legal">Power of Attorney</option>
                </optgroup>
                
                <!-- Financial -->
                <optgroup label="💳 Financial Documents">
                    <option value="bank-card" data-fee="200" data-category="Financial">Bank/ATM Card</option>
                    <option value="checkbook" data-fee="300" data-category="Financial">Checkbook</option>
                    <option value="loan-agreement" data-fee="400" data-category="Financial">Loan Agreement</option>
                    <option value="insurance-policy" data-fee="350" data-category="Financial">Insurance Policy</option>
                </optgroup>
                
                <!-- Health -->
                <optgroup label="🏥 Health Documents">
                    <option value="birth-certificate" data-fee="400" data-category="Health">Birth Certificate</option>
                    <option value="death-certificate" data-fee="500" data-category="Health">Death Certificate</option>
                    <option value="marriage-certificate" data-fee="600" data-category="Health">Marriage Certificate</option>
                    <option value="medical-report" data-fee="250" data-category="Health">Medical Report</option>
                    <option value="nhif-card" data-fee="150" data-category="Health">NHIF Card</option>
                </optgroup>
                
                <!-- Other Important -->
                <optgroup label="📄 Other Important">
                    <option value="will" data-fee="1200" data-category="Legal">Will/Testament</option>
                    <option value="adoption-papers" data-fee="800" data-category="Legal">Adoption Papers</option>
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
    
    // Add entrance animation
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
    if (document.querySelectorAll('.document-item').length <= 1) {
        alert('You must report at least one document.');
        return;
    }
    
    // Animate removal
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
        if (counter) {
            counter.textContent = index + 1;
        }
        item.setAttribute('data-document-index', index + 1);
    });
    documentCounter = documentItems.length;
}

// Update total fee
function updateTotalFee() {
    const documentTypes = document.querySelectorAll('.document-type');
    let totalFee = 0;
    let documentCount = 0;
    
    documentTypes.forEach(select => {
        const selectedOption = select.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            const fee = parseInt(selectedOption.dataset.fee) || 200;
            totalFee += fee;
            documentCount++;
        } else {
            totalFee += 200; // Default fee for unselected documents
            documentCount++;
        }
    });
    
    const totalFeeElement = document.querySelector('.total-fee .amount');
    const documentCountElement = document.getElementById('document-count');
    
    if (totalFeeElement) {
        totalFeeElement.textContent = `KSh ${totalFee.toLocaleString()}`;
    }
    
    if (documentCountElement) {
        documentCountElement.textContent = documentCount;
    }
}

// Set timeline function
function setTimeline(element) {
    selectedTimeline = element.getAttribute('onclick')?.replace('setTimeline(\'', '').replace('\')', '') || 'today';
    
    // Update active state
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.classList.remove('active');
    });
    
    element.classList.add('active');
}

// Validate phone number
function validatePhoneNumber(phone) {
    const phoneRegex = /^(07|01)\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Validate email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        fullName: document.getElementById('full-name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        lastSeenLocation: document.getElementById('last-seen-location').value.trim(),
        lastSeenDetails: document.getElementById('last-seen-details').value.trim(),
        additionalInfo: document.getElementById('additional-info').value.trim(),
        timeline: selectedTimeline,
        documents: []
    };
    
    // Validate required fields
    if (!formData.fullName || !formData.phone || !formData.email || !formData.lastSeenLocation) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(formData.phone)) {
        alert('Please enter a valid Kenyan phone number (07XXXXXXXX or 01XXXXXXXX).');
        return;
    }
    
    // Validate email
    if (!validateEmail(formData.email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Collect document data
    const documentItems = document.querySelectorAll('.document-item');
    let totalFee = 0;
    
    documentItems.forEach((item, index) => {
        const documentType = item.querySelector('.document-type');
        const documentNumber = item.querySelector('.document-number');
        
        if (!documentType.value) {
            alert(`Please select a document type for document ${index + 1}.`);
            throw new Error('Validation failed');
        }
        
        const selectedOption = documentType.selectedOptions[0];
        const fee = parseInt(selectedOption.dataset.fee) || 200;
        totalFee += fee;
        
        formData.documents.push({
            type: documentType.value,
            typeName: selectedOption.textContent,
            number: documentNumber.value.trim(),
            fee: fee,
            category: selectedOption.dataset.category || 'Other'
        });
    });
    
    formData.totalFee = totalFee;
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Store data (in a real app, this would be sent to a server)
            const reportId = generateReportId();
            const reportData = {
                ...formData,
                id: reportId,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            
            // Store in memory (in a real app, this would be in a database)
            storeReportData(reportData);
            
            // Show confirmation
            showConfirmation(reportData);
            
        } catch (error) {
            alert('There was an error submitting your report. Please try again.');
            console.error('Submission error:', error);
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 2000);
}

// Generate unique report ID
function generateReportId() {
    return 'SLD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Store report data (in memory for demo - Note: localStorage won't work in Claude artifacts)
function storeReportData(data) {
    // In Claude artifacts, we can't use localStorage, so we'll just log it
    console.log('Storing report data:', data);
    
    // In a real application, this would be sent to a server
    // For demo purposes, we'll store it in a global variable
    if (!window.salamaReports) {
        window.salamaReports = [];
    }
    window.salamaReports.push(data);
}

// Show confirmation screen
function showConfirmation(reportData) {
    const form = document.getElementById('lost-form');
    const confirmation = document.getElementById('confirmation');
    
    // Populate confirmation details
    document.getElementById('confirm-phone').textContent = reportData.phone;
    document.getElementById('confirm-email').textContent = reportData.email;
    document.getElementById('confirm-total-fee').textContent = `KSh ${reportData.totalFee.toLocaleString()}`;
    
    // Populate documents summary
    const documentsSummary = document.getElementById('documents-summary');
    const summaryContent = reportData.documents.map((doc, index) => {
        return `
            <div class="document-summary-item">
                <span>${index + 1}. ${doc.typeName}</span>
                <span>KSh ${doc.fee}</span>
            </div>
        `;
    }).join('');
    
    documentsSummary.innerHTML = `
        <h4><i class="fas fa-list"></i> Documents Reported</h4>
        ${summaryContent}
        <div class="document-summary-item">
            <span><strong>Total Recovery Fee</strong></span>
            <span><strong>KSh ${reportData.totalFee.toLocaleString()}</strong></span>
        </div>
    `;
    
    // Hide form and show confirmation
    form.style.display = 'none';
    confirmation.style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Send notifications (simulate)
    sendNotifications(reportData);
}

// Simulate sending notifications
function sendNotifications(reportData) {
    // In a real app, this would trigger SMS and email notifications
    console.log('Sending SMS notification to:', reportData.phone);
    console.log('Sending email notification to:', reportData.email);
    
    // Show success message
    setTimeout(() => {
        const notification = document.createElement('div');
        notification.style.cssText = `
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
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            SMS and email notifications sent successfully!
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }, 1000);
}

// Report another document
function reportAnother() {
    // Reset form
    document.getElementById('lost-form').reset();
    document.getElementById('lost-form').style.display = 'block';
    document.getElementById('confirmation').style.display = 'none';
    
    // Reset document counter and container
    documentCounter = 1;
    const container = document.getElementById('documents-container');
    const documentItems = container.querySelectorAll('.document-item');
    
    // Remove extra documents, keep only the first one
    for (let i = 1; i < documentItems.length; i++) {
        documentItems[i].remove();
    }
    
    // Reset the first document
    const firstDocument = container.querySelector('.document-item');
    firstDocument.querySelector('.document-type').selectedIndex = 0;
    firstDocument.querySelector('.document-number').value = '';
    firstDocument.querySelector('.document-fee').textContent = 'KSh 200';
    
    // Reset timeline
    selectedTimeline = 'today';
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.timeline-step').classList.add('active');
    
    // Update totals
    updateTotalFee();
    updateDocumentCounters();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
}

// Utility function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Auto-save form data (modified for Claude artifacts)
function autoSaveForm() {
    const formData = {
        fullName: document.getElementById('full-name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        lastSeenLocation: document.getElementById('last-seen-location').value,
        lastSeenDetails: document.getElementById('last-seen-details').value,
        additionalInfo: document.getElementById('additional-info').value,
        timeline: selectedTimeline
    };
    
    // Store in memory instead of localStorage for Claude artifacts
    window.salamaFormDraft = formData;
}

// Load saved form data (modified for Claude artifacts)
function loadSavedForm() {
    const savedData = window.salamaFormDraft;
    if (savedData) {
        document.getElementById('full-name').value = savedData.fullName || '';
        document.getElementById('phone').value = savedData.phone || '';
        document.getElementById('email').value = savedData.email || '';
        document.getElementById('last-seen-location').value = savedData.lastSeenLocation || '';
        document.getElementById('last-seen-details').value = savedData.lastSeenDetails || '';
        document.getElementById('additional-info').value = savedData.additionalInfo || '';
        selectedTimeline = savedData.timeline || 'today';
    }
}

// Clear saved form data (modified for Claude artifacts)
function clearSavedForm() {
    window.salamaFormDraft = null;
}

// Initialize auto-save
document.addEventListener('DOMContentLoaded', function() {
    loadSavedForm();
    
    // Auto-save every 30 seconds
    setInterval(autoSaveForm, 30000);
    
    // Auto-save on input change
    document.addEventListener('input', function(e) {
        if (e.target.form && e.target.form.id === 'lost-form') {
            autoSaveForm();
        }
    });
});

// Clear saved data when form is successfully submitted
function clearFormData() {
    clearSavedForm();
}

// Enhanced form validation
function validateForm() {
    const errors = [];
    
    // Name validation
    const fullName = document.getElementById('full-name').value.trim();
    if (!fullName) {
        errors.push('Full name is required');
    } else if (fullName.length < 3) {
        errors.push('Full name must be at least 3 characters');
    }
    
    // Phone validation
    const phone = document.getElementById('phone').value.trim();
    if (!phone) {
        errors.push('Phone number is required');
    } else if (!validatePhoneNumber(phone)) {
        errors.push('Please enter a valid Kenyan phone number');
    }
    
    // Email validation
    const email = document.getElementById('email').value.trim();
    if (!email) {
        errors.push('Email is required');
    } else if (!validateEmail(email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Location validation
    const location = document.getElementById('last-seen-location').value.trim();
    if (!location) {
        errors.push('Last seen location is required');
    } else if (location.length < 5) {
        errors.push('Please provide more details about the location');
    }
    
    // Document validation
    const documentTypes = document.querySelectorAll('.document-type');
    let hasValidDocument = false;
    
    documentTypes.forEach((select, index) => {
        if (select.value) {
            hasValidDocument = true;
        } else {
            errors.push(`Please select document type for document ${index + 1}`);
        }
    });
    
    if (!hasValidDocument) {
        errors.push('At least one document must be selected');
    }
    
    return errors;
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
    
    // Remove existing error container
    const existingErrors = document.querySelector('.validation-errors');
    if (existingErrors) {
        existingErrors.remove();
    }
    
    // Insert at the top of the form
    const form = document.getElementById('lost-form');
    form.insertBefore(errorContainer, form.firstChild);
    
    // Scroll to errors
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}

// Enhanced submit handler with validation
function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('Form submit triggered'); // Debug log
    
    // Get form data
    const formData = {
        fullName: document.getElementById('full-name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        lastSeenLocation: document.getElementById('last-seen-location').value.trim(),
        lastSeenDetails: document.getElementById('last-seen-details').value.trim(),
        additionalInfo: document.getElementById('additional-info').value.trim(),
        timeline: selectedTimeline,
        documents: []
    };
    
    console.log('Form data:', formData); // Debug log
    
    // Validate required fields
    if (!formData.fullName || !formData.phone || !formData.email || !formData.lastSeenLocation) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(formData.phone)) {
        alert('Please enter a valid Kenyan phone number (07XXXXXXXX or 01XXXXXXXX).');
        return;
    }
    
    // Validate email
    if (!validateEmail(formData.email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Collect document data
    const documentItems = document.querySelectorAll('.document-item');
    let totalFee = 0;
    
    try {
        documentItems.forEach((item, index) => {
            const documentType = item.querySelector('.document-type');
            const documentNumber = item.querySelector('.document-number');
            
            if (!documentType.value) {
                alert(`Please select a document type for document ${index + 1}.`);
                throw new Error('Validation failed');
            }
            
            const selectedOption = documentType.selectedOptions[0];
            const fee = parseInt(selectedOption.dataset.fee) || 200;
            totalFee += fee;
            
            formData.documents.push({
                type: documentType.value,
                typeName: selectedOption.textContent,
                number: documentNumber.value.trim(),
                fee: fee,
                category: selectedOption.dataset.category || 'Other'
            });
        });
    } catch (error) {
        return; // Stop if validation fails
    }
    
    formData.totalFee = totalFee;
    
    console.log('Final form data:', formData); // Debug log
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Generate report ID
            const reportId = generateReportId();
            const reportData = {
                ...formData,
                id: reportId,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            
            console.log('Report data:', reportData); // Debug log
            
            // Store data
            storeReportData(reportData);
            
            // Show confirmation
            showConfirmation(reportData);
            
            // Clear form draft
            clearSavedForm();
            
        } catch (error) {
            alert('There was an error submitting your report. Please try again.');
            console.error('Submission error:', error);
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 2000);
}
