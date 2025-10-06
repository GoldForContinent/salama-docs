// ======================
        //  CORE FUNCTIONALITY
        // ======================
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize all components
            initTabs();
            initToggleSwitches();
            initBackupSettings();
            initEmergencyContacts();
            initSecuritySettings();
            initDocumentExport();
        });

        // ======================
        //  TAB SYSTEM
        // ======================
        function initTabs() {
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs
                    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    this.classList.add('active');
                    const tabId = this.textContent.trim().toLowerCase().replace(' ', '-');
                    document.getElementById(tabId).classList.add('active');
                });
            });
        }

        // ======================
        //  TOGGLE SWITCHES
        // ======================
        function initToggleSwitches() {
            document.querySelectorAll('.toggle-switch input').forEach(switchEl => {
                switchEl.addEventListener('change', function() {
                    const parentCard = this.closest('.settings-card');
                    const settingName = this.parentElement.previousElementSibling.querySelector('strong').textContent;
                    
                    // Simulate API call to save preference
                    simulateAPICall({
                        setting: settingName,
                        value: this.checked
                    });
                    
                    // Special cases
                    if (settingName === 'Biometric Login') {
                        if (this.checked) {
                            showBiometricSetup();
                        }
                    }
                    
                    if (settingName === 'Emergency Lock') {
                        if (this.checked) {
                            confirmEmergencyLock();
                        }
                    }
                });
            });
        }

        function simulateAPICall(data) {
            console.log('API Call:', data);
            // In a real app, this would be a fetch() to your backend
        }

        // ======================
        //  BIOMETRIC SETUP
        // ======================
        function showBiometricSetup() {
            const modal = document.createElement('div');
            modal.className = 'biometric-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3><i class="fas fa-fingerprint"></i> Set Up Biometric Login</h3>
                    <p>Follow your device prompts to register your fingerprint or face ID</p>
                    <div class="animation-container">
                        <div class="fingerprint-animation"></div>
                    </div>
                    <button class="btn btn-primary" id="complete-bio-setup">Complete Setup</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('complete-bio-setup').addEventListener('click', function() {
                alert('Biometric login successfully set up!');
                document.body.removeChild(modal);
            });
            
            // Add some CSS for the modal
            const style = document.createElement('style');
            style.textContent = `
                .biometric-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    max-width: 400px;
                    text-align: center;
                }
                .fingerprint-animation {
                    width: 80px;
                    height: 80px;
                    margin: 20px auto;
                    background: #f0f0f0;
                    border-radius: 50%;
                    position: relative;
                }
            `;
            document.head.appendChild(style);
        }

        function initBackupSettings() {
            // Manual backup button
            document.querySelector('.backup-now-btn').addEventListener('click', function() {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Backing Up...';
                
                // Simulate backup process
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-check"></i> Backup Complete!';
                    updateLastBackupTime();
                    
                    // Reset button after 3 seconds
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-sync"></i> Backup Now';
                    }, 3000);
                }, 2000);
            });
            
            // Backup frequency selector
            document.querySelector('.backup-frequency').addEventListener('change', function() {
                const frequency = this.value;
                let nextBackup = '';
                
                if (frequency === 'Daily') nextBackup = 'Tomorrow at 2:00 AM';
                if (frequency === 'Weekly') nextBackup = 'Next Monday at 2:00 AM';
                if (frequency === 'Monthly') nextBackup = '1st of next month at 2:00 AM';
                
                document.querySelector('.next-backup-time').textContent = nextBackup;
                simulateAPICall({ setting: 'Backup Frequency', value: frequency });
            });
        }

        function updateLastBackupTime() {
            const now = new Date();
            const options = { 
                hour: '2-digit', 
                minute: '2-digit',
                day: 'numeric',
                month: 'short'
            };
            const timeString = now.toLocaleTimeString('en-KE', options);
            document.querySelector('.last-backup-time').textContent = timeString;
        }

        function initEmergencyContacts() {
            const contacts = [
                { name: "Jane Muthoni", phone: "0722123456", relation: "Wife" },
                { name: "David Kimani", phone: "0733123456", relation: "Brother" }
            ];
            
            renderContacts(contacts);
            
        
            document.querySelector('.add-contact button').addEventListener('click', function() {
                const nameInput = document.querySelector('.add-contact input[name="name"]');
                const phoneInput = document.querySelector('.add-contact input[name="phone"]');
                
                if (nameInput.value && phoneInput.value) {
                    const newContact = {
                        name: nameInput.value,
                        phone: phoneInput.value,
                        relation: "Other"
                    };
                    
                    contacts.push(newContact);
                    renderContacts(contacts);
                    
                    
                    nameInput.value = '';
                    phoneInput.value = '';
                    
                    simulateAPICall({ action: 'Add Contact', data: newContact });
                } else {
                    alert('Please enter both name and phone number');
                }
            });
        }

        function renderContacts(contacts) {
            const container = document.querySelector('.emergency-contacts-list');
            container.innerHTML = '';
            
            contacts.forEach((contact, index) => {
                const contactEl = document.createElement('div');
                contactEl.className = 'contact-item';
                contactEl.innerHTML = `
                    <i class="fas fa-user"></i>
                    <div class="contact-info">
                        <strong>${contact.name}</strong>
                        <small>${contact.phone} (${contact.relation})</small>
                    </div>
                    <div class="contact-actions">
                        <button class="btn btn-sm btn-primary edit-contact" data-index="${index}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-contact" data-index="${index}">Remove</button>
                    </div>
                `;
                container.appendChild(contactEl);
            });
            
            // Add event listeners to new buttons
            document.querySelectorAll('.delete-contact').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = this.getAttribute('data-index');
                    if (confirm(`Remove ${contacts[index].name} from emergency contacts?`)) {
                        const removed = contacts.splice(index, 1);
                        renderContacts(contacts);
                        simulateAPICall({ action: 'Remove Contact', data: removed[0] });
                    }
                });
            });
            
            document.querySelectorAll('.edit-contact').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = this.getAttribute('data-index');
                    showEditContactModal(contacts[index], index);
                });
            });
        }

        function showEditContactModal(contact, index) {
            const modal = document.createElement('div');
            modal.className = 'contact-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3><i class="fas fa-user-edit"></i> Edit Contact</h3>
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" id="edit-contact-name" value="${contact.name}">
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="edit-contact-phone" value="${contact.phone}">
                    </div>
                    <div class="form-group">
                        <label>Relation</label>
                        <select id="edit-contact-relation">
                            <option ${contact.relation === 'Wife' ? 'selected' : ''}>Wife</option>
                            <option ${contact.relation === 'Husband' ? 'selected' : ''}>Husband</option>
                            <option ${contact.relation === 'Brother' ? 'selected' : ''}>Brother</option>
                            <option ${contact.relation === 'Sister' ? 'selected' : ''}>Sister</option>
                            <option ${contact.relation === 'Parent' ? 'selected' : ''}>Parent</option>
                            <option ${contact.relation === 'Friend' ? 'selected' : ''}>Friend</option>
                            <option ${contact.relation === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" id="save-contact-changes">Save Changes</button>
                    <button class="btn btn-danger" id="cancel-edit-contact">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('save-contact-changes').addEventListener('click', function() {
                const updatedContact = {
                    name: document.getElementById('edit-contact-name').value,
                    phone: document.getElementById('edit-contact-phone').value,
                    relation: document.getElementById('edit-contact-relation').value
                };
                
                contacts[index] = updatedContact;
                renderContacts(contacts);
                document.body.removeChild(modal);
                simulateAPICall({ action: 'Update Contact', data: updatedContact });
            });
            
            document.getElementById('cancel-edit-contact').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }

    
        function initSecuritySettings() {
            // Change password button
            document.querySelector('.change-password-btn').addEventListener('click', function() {
                showPasswordChangeModal();
            });
            
            // Log out all devices
            document.querySelector('.logout-all-btn').addEventListener('click', function() {
                if (confirm('This will log you out of all devices except this one. Continue?')) {
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging Out...';
                    
                    setTimeout(() => {
                        alert('All other sessions have been terminated');
                        this.innerHTML = '<i class="fas fa-sign-out-alt"></i> Log Out All Other Devices';
                    }, 1500);
                }
            });
        }

        function showPasswordChangeModal() {
            const modal = document.createElement('div');
            modal.className = 'password-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3><i class="fas fa-key"></i> Change Password</h3>
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" id="current-password">
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" id="new-password">
                        <div class="password-strength-meter">
                            <div class="strength-bar"></div>
                            <span class="strength-text">Weak</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" id="confirm-password">
                    </div>
                    <button class="btn btn-primary" id="submit-password-change">Update Password</button>
                    <button class="btn btn-danger" id="cancel-password-change">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Password strength checker
            document.getElementById('new-password').addEventListener('input', function() {
                checkPasswordStrength(this.value);
            });
            
            document.getElementById('submit-password-change').addEventListener('click', function() {
                const current = document.getElementById('current-password').value;
                const newPass = document.getElementById('new-password').value;
                const confirmPass = document.getElementById('confirm-password').value;
                
                if (!current || !newPass || !confirmPass) {
                    alert('Please fill in all fields');
                    return;
                }
                
                if (newPass !== confirmPass) {
                    alert('New passwords do not match');
                    return;
                }
                
                if (newPass.length < 8) {
                    alert('Password must be at least 8 characters');
                    return;
                }
                
                // Simulate password change
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                
                setTimeout(() => {
                    alert('Password changed successfully!');
                    document.body.removeChild(modal);
                }, 1500);
            });
            
            document.getElementById('cancel-password-change').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }

        function checkPasswordStrength(password) {
            const strengthBar = document.querySelector('.strength-bar');
            const strengthText = document.querySelector('.strength-text');
            
            // Reset
            strengthBar.style.width = '0%';
            strengthBar.style.backgroundColor = '#BB0000';
            
            // Calculate strength
            let strength = 0;
            
            // Length
            if (password.length >= 8) strength += 25;
            if (password.length >= 12) strength += 25;
            
            // Complexity
            if (/[A-Z]/.test(password)) strength += 15;
            if (/[0-9]/.test(password)) strength += 15;
            if (/[^A-Za-z0-9]/.test(password)) strength += 20;
            
            // Update UI
            strengthBar.style.width = strength + '%';
            
            if (strength < 50) {
                strengthBar.style.backgroundColor = '#BB0000';
                strengthText.textContent = 'Weak';
            } else if (strength < 75) {
                strengthBar.style.backgroundColor = '#FFA500';
                strengthText.textContent = 'Medium';
            } else {
                strengthBar.style.backgroundColor = '#006600';
                strengthText.textContent = 'Strong';
            }
        }

        // ======================
        //  DOCUMENT EXPORT
        // ======================
        function initDocumentExport() {
            document.querySelector('.export-documents-btn').addEventListener('click', function() {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Export...';
                
                // Simulate export preparation
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-download"></i> Download Now';
                    
                    // Create download link
                    const link = document.createElement('a');
                    link.href = '#';
                    link.download = 'salama-docs-export.zip';
                    link.innerHTML = ' (Click if download doesn\'t start automatically)';
                    this.appendChild(link);
                    
                    // Simulate download
                    setTimeout(() => {
                        alert('Your document export is ready!');
                    }, 1000);
                }, 3000);
            });
        }

        // ======================
        //  EMERGENCY LOCK
        // ======================
        function confirmEmergencyLock() {
            if (confirm('Are you sure you want to lock all your documents? This will require identity verification to unlock.')) {
                // Show verification modal
                showVerificationModal();
            } else {
                // Uncheck the toggle
                document.querySelector('.emergency-lock-toggle input').checked = false;
            }
        }

        function showVerificationModal() {
            const modal = document.createElement('div');
            modal.className = 'verification-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3><i class="fas fa-lock"></i> Verify Your Identity</h3>
                    <p>For security reasons, please verify your identity to enable emergency lock</p>
                    
                    <div class="verification-options">
                        <button class="btn btn-primary" id="verify-sms">
                            <i class="fas fa-sms"></i> SMS Verification
                        </button>
                        <button class="btn btn-primary" id="verify-email">
                            <i class="fas fa-envelope"></i> Email Verification
                        </button>
                        <button class="btn btn-primary" id="verify-security-questions">
                            <i class="fas fa-question-circle"></i> Security Questions
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners for verification options
            document.getElementById('verify-sms').addEventListener('click', function() {
                startSMSCodeVerification();
            });
            
            document.getElementById('verify-email').addEventListener('click', function() {
                startEmailVerification();
            });
            
            document.getElementById('verify-security-questions').addEventListener('click', function() {
                showSecurityQuestions();
            });
        }

        function startSMSCodeVerification() {
            const modal = document.querySelector('.verification-modal .modal-content');
            modal.innerHTML = `
                <h3><i class="fas fa-mobile-alt"></i> SMS Verification</h3>
                <p>We've sent a 6-digit code to your phone number ending in 5678</p>
                
                <div class="otp-inputs">
                    <input type="text" maxlength="1" pattern="[0-9]">
                    <input type="text" maxlength="1" pattern="[0-9]">
                    <input type="text" maxlength="1" pattern="[0-9]">
                    <input type="text" maxlength="1" pattern="[0-9]">
                    <input type="text" maxlength="1" pattern="[0-9]">
                    <input type="text" maxlength="1" pattern="[0-9]">
                </div>
                
                <p class="resend-text">Didn't receive code? <a href="#" id="resend-sms">Resend</a></p>
                
                <button class="btn btn-primary" id="submit-otp">Verify</button>
                <button class="btn btn-danger" id="cancel-verification">Cancel</button>
            `;
            
            // Auto-focus first input
            modal.querySelector('.otp-inputs input').focus();
            
            // Handle OTP input
            const inputs = modal.querySelectorAll('.otp-inputs input');
            inputs.forEach((input, index) => {
                input.addEventListener('input', function() {
                    if (this.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });
                
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                        inputs[index - 1].focus();
                    }
                });
            });
            
            // Resend SMS
            document.getElementById('resend-sms').addEventListener('click', function(e) {
                e.preventDefault();
                alert('New verification code sent!');
            });
            
            // Submit OTP
            document.getElementById('submit-otp').addEventListener('click', function() {
                const otp = Array.from(inputs).map(input => input.value).join('');
                
                if (otp.length === 6) {
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
                    
                    // Simulate verification
                    setTimeout(() => {
                        alert('Identity verified! Emergency lock is now active.');
                        document.querySelector('.verification-modal').remove();
                        document.querySelector('.emergency-lock-toggle input').checked = true;
                    }, 1500);
                } else {
                    alert('Please enter the full 6-digit code');
                }
            });
            
            // Cancel
            document.getElementById('cancel-verification').addEventListener('click', function() {
                document.querySelector('.verification-modal').remove();
                document.querySelector('.emergency-lock-toggle input').checked = false;
            });
        }

        // [Additional verification methods would follow similar patterns]

