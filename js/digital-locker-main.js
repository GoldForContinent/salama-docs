import { supabase } from './supabase.js';
import { 
  DOCUMENT_TYPES, 
  getDocIcon, 
  formatFileSize, 
  formatDate,
  validateFile,
  uploadDocumentToStorage,
  deleteDocumentFromStorage,
  createLockerDocument,
  getUserLockerDocuments,
  updateDocumentName,
  updateDocumentDescription,
  deleteLockerDocument,
  archiveLockerDocument,
  searchLockerDocuments,
  getDocumentCount,
  getDocument,
  showNotification,
  debounce
} from './locker-helpers.js';

// ============ STATE ============
let currentUser = null;
let allDocuments = [];
let filteredDocuments = [];
let currentViewMode = 'grid';
let currentFilter = 'all';

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  setupEventListeners();
});

async function initializeApp() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      window.location.href = 'index.html';
      return;
    }
    
    currentUser = session.user;
    await loadDocuments();
    updateStatistics();
  } catch (error) {
    console.error('Init error:', error);
    showNotification('Error initializing app', 'error');
  }
}

// ============ LOAD DOCUMENTS ============
async function loadDocuments() {
  try {
    const result = await getUserLockerDocuments(currentUser.id, false);
    
    if (!result.success) {
      showNotification('Error loading documents', 'error');
      return;
    }
    
    allDocuments = result.documents || [];
    filteredDocuments = [...allDocuments];
    renderDocuments();
  } catch (error) {
    console.error('Load error:', error);
    showNotification('Error loading documents', 'error');
  }
}

// ============ RENDER DOCUMENTS ============
function renderDocuments() {
  const container = document.getElementById('documents-container');
  
  if (!container) return;
  
  if (filteredDocuments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No Documents Yet</h3>
        <p>Upload your first document to get started</p>
        <button class="btn-primary" onclick="openUploadModal()">
          <i class="fas fa-upload"></i> Upload Document
        </button>
      </div>
    `;
    return;
  }
  
  if (currentViewMode === 'grid') {
    renderGridView();
  } else {
    renderListView();
  }
}

function renderGridView() {
  const container = document.getElementById('documents-container');
  
  container.innerHTML = filteredDocuments.map(doc => `
    <div class="document-card" data-doc-id="${doc.id}">
      <div class="document-icon">
        <i class="fas ${getDocIcon(doc.document_type)}"></i>
      </div>
      
      <div class="document-header">
        <h4 class="document-name" onclick="editDocumentName('${doc.id}', '${doc.document_name}')">
          ${doc.document_name}
        </h4>
        <p class="document-type">${DOCUMENT_TYPES[doc.document_type] || doc.document_type}</p>
      </div>
      
      <div class="document-info">
        <span class="file-size"><i class="fas fa-file"></i> ${formatFileSize(doc.file_size)}</span>
        <span class="upload-date"><i class="fas fa-calendar"></i> ${formatDate(doc.uploaded_at)}</span>
      </div>
      
      <div class="document-actions">
        <button class="btn-icon" onclick="viewDocument('${doc.id}')" title="View">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="downloadDocument('${doc.id}')" title="Download">
          <i class="fas fa-download"></i>
        </button>
        <button class="btn-icon" onclick="deleteDocument('${doc.id}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function renderListView() {
  const container = document.getElementById('documents-container');
  
  container.innerHTML = `
    <table class="documents-table">
      <thead>
        <tr>
          <th>Document Name</th>
          <th>Type</th>
          <th>Size</th>
          <th>Uploaded</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filteredDocuments.map(doc => `
          <tr data-doc-id="${doc.id}">
            <td class="doc-name-cell">
              <i class="fas ${getDocIcon(doc.document_type)}"></i>
              <span class="document-name" onclick="editDocumentName('${doc.id}', '${doc.document_name}')">
                ${doc.document_name}
              </span>
            </td>
            <td>${DOCUMENT_TYPES[doc.document_type] || doc.document_type}</td>
            <td>${formatFileSize(doc.file_size)}</td>
            <td>${formatDate(doc.uploaded_at)}</td>
            <td class="actions-cell">
              <button class="btn-icon" onclick="viewDocument('${doc.id}')" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-icon" onclick="downloadDocument('${doc.id}')" title="Download">
                <i class="fas fa-download"></i>
              </button>
              <button class="btn-icon" onclick="deleteDocument('${doc.id}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============ DOCUMENT ACTIONS ============
async function viewDocument(documentId) {
  try {
    const result = await getDocument(documentId);
    
    if (!result.success) {
      showNotification('Error loading document', 'error');
      return;
    }
    
    const doc = result.document;
    const modal = document.getElementById('viewModal');
    
    if (!modal) return;
    
    const viewer = document.getElementById('documentViewer');
    const fileName = document.getElementById('viewDocumentName');
    const fileType = document.getElementById('viewDocumentType');
    const fileSize = document.getElementById('viewFileSize');
    const uploadedDate = document.getElementById('viewUploadedDate');
    
    fileName.textContent = doc.document_name;
    fileType.textContent = DOCUMENT_TYPES[doc.document_type] || doc.document_type;
    fileSize.textContent = formatFileSize(doc.file_size);
    uploadedDate.textContent = formatDate(doc.uploaded_at);
    
    // Display document based on type
    if (doc.mime_type.startsWith('image/')) {
      viewer.innerHTML = `<img src="${doc.storage_url}" alt="${doc.document_name}" style="max-width: 100%; max-height: 500px;">`;
    } else if (doc.mime_type === 'application/pdf') {
      viewer.innerHTML = `<iframe src="${doc.storage_url}" style="width: 100%; height: 500px; border: none;"></iframe>`;
    } else {
      viewer.innerHTML = `
        <div class="document-preview-placeholder">
          <i class="fas fa-file"></i>
          <p>${doc.document_name}</p>
          <p class="small">${doc.mime_type}</p>
          <button class="btn-primary" onclick="downloadDocument('${doc.id}')">
            <i class="fas fa-download"></i> Download to View
          </button>
        </div>
      `;
    }
    
    modal.style.display = 'flex';
  } catch (error) {
    console.error('View error:', error);
    showNotification('Error viewing document', 'error');
  }
}

async function downloadDocument(documentId) {
  try {
    const result = await getDocument(documentId);
    
    if (!result.success) {
      showNotification('Error loading document', 'error');
      return;
    }
    
    const doc = result.document;
    const link = document.createElement('a');
    link.href = doc.storage_url;
    link.download = doc.document_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Document downloaded', 'success');
  } catch (error) {
    console.error('Download error:', error);
    showNotification('Error downloading document', 'error');
  }
}

async function editDocumentName(documentId, currentName) {
  const newName = prompt('Edit document name:', currentName);
  
  if (!newName || newName === currentName) return;
  
  try {
    const result = await updateDocumentName(documentId, newName);
    
    if (!result.success) {
      showNotification('Error updating document name', 'error');
      return;
    }
    
    await loadDocuments();
    showNotification('Document name updated', 'success');
  } catch (error) {
    console.error('Edit error:', error);
    showNotification('Error updating document name', 'error');
  }
}

async function deleteDocument(documentId) {
  if (!confirm('Are you sure you want to delete this document?')) return;
  
  try {
    const doc = allDocuments.find(d => d.id === documentId);
    
    if (!doc) {
      showNotification('Document not found', 'error');
      return;
    }
    
    const result = await deleteLockerDocument(documentId, doc.file_path);
    
    if (!result.success) {
      showNotification('Error deleting document', 'error');
      return;
    }
    
    await loadDocuments();
    updateStatistics();
    showNotification('Document deleted', 'success');
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('Error deleting document', 'error');
  }
}

// ============ SEARCH & FILTER ============
function setupSearchListener() {
  const searchInput = document.getElementById('searchInput');
  
  if (!searchInput) return;
  
  searchInput.addEventListener('input', debounce(async (e) => {
    const searchTerm = e.target.value.trim();
    
    if (!searchTerm) {
      filteredDocuments = [...allDocuments];
    } else {
      const result = await searchLockerDocuments(currentUser.id, searchTerm);
      filteredDocuments = result.success ? result.documents : [];
    }
    
    renderDocuments();
  }, 300));
}

function filterByType(docType) {
  currentFilter = docType;
  
  if (docType === 'all') {
    filteredDocuments = [...allDocuments];
  } else {
    filteredDocuments = allDocuments.filter(doc => doc.document_type === docType);
  }
  
  renderDocuments();
}

// ============ VIEW MODE ============
function toggleViewMode(mode) {
  currentViewMode = mode;
  
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  
  if (gridBtn && listBtn) {
    gridBtn.classList.toggle('active', mode === 'grid');
    listBtn.classList.toggle('active', mode === 'list');
  }
  
  renderDocuments();
}

// ============ STATISTICS ============
async function updateStatistics() {
  try {
    const result = await getDocumentCount(currentUser.id);
    
    if (!result.success) return;
    
    const totalSize = allDocuments.reduce((sum, doc) => sum + doc.file_size, 0);
    
    const statsContainer = document.getElementById('statistics');
    
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <i class="fas fa-file"></i>
          <div>
            <h4>${result.count}</h4>
            <p>Documents</p>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Stats error:', error);
  }
}

// ============ UPLOAD MODAL ============
function openUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (modal) modal.style.display = 'flex';
}

function closeUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (modal) modal.style.display = 'none';
  
  const form = document.getElementById('uploadForm');
  if (form) form.reset();
  
  // Reset file input
  const fileInput = document.getElementById('documentFile');
  if (fileInput) fileInput.value = '';
  
  // Reset upload area styling
  const fileUploadArea = document.getElementById('fileUploadArea');
  if (fileUploadArea) {
    fileUploadArea.style.borderColor = 'var(--border-color)';
    fileUploadArea.style.backgroundColor = 'transparent';
  }
}

async function handleUpload(e) {
  e.preventDefault();
  
  const documentType = document.getElementById('uploadDocumentType').value;
  const documentName = document.getElementById('uploadDocumentName').value;
  const fileInput = document.getElementById('documentFile');
  const file = fileInput.files[0];
  
  if (!file || !documentType || !documentName) {
    showNotification('Please fill all fields', 'error');
    return;
  }
  
  const validation = validateFile(file);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    return;
  }
  
  try {
    const uploadBtn = e.target.querySelector('button[type="submit"]');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    const documentId = crypto.randomUUID();
    
    const uploadResult = await uploadDocumentToStorage(file, currentUser.id, documentId);
    
    if (!uploadResult.success) {
      showNotification(uploadResult.error, 'error');
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
      return;
    }
    
    const dbResult = await createLockerDocument(currentUser.id, {
      documentName,
      documentType,
      filePath: uploadResult.filePath,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType,
      publicUrl: uploadResult.publicUrl,
      description: ''
    });
    
    if (!dbResult.success) {
      await deleteDocumentFromStorage(uploadResult.filePath);
      showNotification('Error saving document', 'error');
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
      return;
    }
    
    showNotification('Document uploaded successfully', 'success');
    closeUploadModal();
    await loadDocuments();
    updateStatistics();
    
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Error uploading document', 'error');
    const uploadBtn = e.target.querySelector('button[type="submit"]');
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
  }
}

// ============ VIEW MODAL ============
function closeViewModal() {
  const modal = document.getElementById('viewModal');
  if (modal) modal.style.display = 'none';
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  const uploadForm = document.getElementById('uploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUpload);
  }
  
  setupSearchListener();
  
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  
  // Setup drag and drop
  setupDragAndDrop();
  
  // Setup file input click - FIXED
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('documentFile');
  
  if (fileUploadArea && fileInput) {
    // Click anywhere on upload area to select file
    fileUploadArea.addEventListener('click', (e) => {
      // Don't trigger if clicking on the hidden input
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });
    
    // Also allow clicking directly on the input
    fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const fileName = e.target.files[0].name;
        console.log('File selected:', fileName);
        showNotification(`File selected: ${fileName}`, 'success');
      }
    });
  }
}

// ============ DRAG AND DROP ============
function setupDragAndDrop() {
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('documentFile');
  
  if (!fileUploadArea || !fileInput) return;
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  // Handle dropped files
  fileUploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e) {
  const fileUploadArea = document.getElementById('fileUploadArea');
  if (fileUploadArea) {
    fileUploadArea.style.borderColor = 'var(--kenya-green)';
    fileUploadArea.style.backgroundColor = 'rgba(0, 102, 0, 0.05)';
  }
}

function unhighlight(e) {
  const fileUploadArea = document.getElementById('fileUploadArea');
  if (fileUploadArea) {
    fileUploadArea.style.borderColor = 'var(--border-color)';
    fileUploadArea.style.backgroundColor = 'transparent';
  }
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  const fileInput = document.getElementById('documentFile');
  
  if (fileInput && files.length > 0) {
    fileInput.files = files;
    console.log('File dropped:', files[0].name);
    
    // Trigger change event
    const event = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(event);
  }
  
  unhighlight(e);
}

// ============ GLOBAL FUNCTIONS ============
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.closeViewModal = closeViewModal;
window.viewDocument = viewDocument;
window.downloadDocument = downloadDocument;
window.editDocumentName = editDocumentName;
window.deleteDocument = deleteDocument;
window.toggleViewMode = toggleViewMode;
window.filterByType = filterByType;
