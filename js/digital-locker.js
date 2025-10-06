 // Simple Document Management System
        document.addEventListener('DOMContentLoaded', function() {
            // Check for successful upload from dashboard
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('uploadSuccess')) {
                alert('Document uploaded successfully!');
                // Clean the URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            loadDocuments();
        });

        function loadDocuments() {
            const container = document.getElementById('documentsContainer');
            const emptyState = document.getElementById('emptyState');
            
            try {
                const storedDocs = localStorage.getItem('digitalLockerDocs');
                const documents = storedDocs ? JSON.parse(storedDocs) : [];
                
                container.innerHTML = '';
                
                if (documents.length === 0) {
                    emptyState.style.display = 'block';
                    return;
                }
                
                emptyState.style.display = 'none';
                
                documents.forEach(doc => {
                    const card = document.createElement('div');
                    card.className = 'document-card';
                    card.onclick = () => viewDocument(doc.id);
                    card.innerHTML = `
                        <div class="doc-icon"><i class="fas ${getDocIcon(doc.type)}"></i></div>
                        <h3>${getDocTypeName(doc.type)}</h3>
                        <p>${doc.filename}</p>
                        <div class="doc-meta">
                            <span><i class="far fa-calendar"></i> ${new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                    `;
                    container.appendChild(card);
                });
                
            } catch (error) {
                console.error('Error loading documents:', error);
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Documents</h3>
                    <p>Please refresh the page or try again later</p>
                `;
            }
        }

        function viewDocument(docId) {
            const docs = JSON.parse(localStorage.getItem('digitalLockerDocs'));
            const doc = docs.find(d => d.id === docId);
            
            if (doc) {
                // In a real implementation, this would open the document
                // For now, we'll just show an alert with the document info
                alert(`Viewing document: ${doc.filename}\n\nThis would open the document in a new tab in a full implementation.`);
                
                // This is where you would implement the actual document viewing
                // For PDFs: window.open(doc.fileData, '_blank');
                // For images: show in a modal or new tab
            }
        }

        // Helper Functions
        function getDocTypeName(type) {
            const names = {
                'national_id': 'National ID',
                'passport': 'Passport',
                'driving_license': 'Driving License',
                'kra_pin': 'KRA PIN',
                'birth_certificate': 'Birth Certificate',
                'school_certificate': 'School Certificate',
                'other': 'Document'
            };
            return names[type] || 'Document';
        }

        function getDocIcon(docType) {
            const icons = {
                'national_id': 'fa-id-card',
                'passport': 'fa-passport',
                'driving_license': 'fa-car',
                'kra_pin': 'fa-file-invoice-dollar',
                'birth_certificate': 'fa-birthday-cake',
                'school_certificate': 'fa-graduation-cap',
                'other': 'fa-file-alt'
            };
            return icons[docType] || 'fa-file';
        }
