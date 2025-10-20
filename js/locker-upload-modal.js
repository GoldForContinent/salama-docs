// Digital Locker Upload Modal for Dashboard
import { supabase } from './supabase.js';
import { 
  DOCUMENT_TYPES, 
  FOLDER_COLORS,
  validateFile, 
  uploadDocumentToStorage, 
  createLockerDocument,
  getUserLockerFolders,
  formatFileSize 
} from './locker-utils.js';

let currentUser = null;
let selectedFile = null;
let uploadFolders = [];

// Initialize upload modal
export async function initializeUploadModal() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;

  // Load folders
  if (currentUser) {
    const result = await getUserLockerFolders(currentUser.id);
    if (result.success) {
      uploadFolders = result.folders;
    }
  }

  createUploadModalHTML();
  setupUploadModalListeners();
}

// Create upload modal HTML
function createUploadModalHTML() {
  const modalHTML = `
    <div id="lockerUploadModal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3><i class="fas fa-cloud-upload-alt"></i> Upload Document</h3>
          <button class="close-btn" onclick="document.getElementById('lockerUploadModal').style.display='none'">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form id="uploadDocumentForm">
            <!-- Document Type -->
            <div class="form-group">
              <label for="uploadDocType">Document Type *</label>
              <select id="uploadDocType" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
                <option value="">Select document type...</option>
                ${Object.entries(DOCUMENT_TYPES).map(([key, value]) => 
                  `<option value="${key}">${value}</option>`
                ).join('')}
              </select>
            </div>

            <!-- File Input with Drag & Drop -->
            <div class="form-group">
              <label for="uploadFile">Select File *</label>
              <div id="dropZone" class="drop-zone" style="
                border: 2px dashed #006600;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                cursor: pointer;
                background: #f9f9f9;
                transition: all 0.3s ease;
              ">
                <i class="fas fa-cloud-upload-alt" style="font-size:32px;color:#006600;margin-bottom:10px;display:block;"></i>
                <p style="margin:10px 0;color:#333;font-weight:600;">Drag & drop your file here</p>
                <p style="margin:5px 0;color:#666;font-size:13px;">or click to browse</p>
                <input type="file" id="uploadFile" style="display:none;" required>
              </div>
              <div id="fileInfo" style="margin-top:10px;padding:10px;background:#f0f0f0;border-radius:6px;display:none;">
                <p style="margin:0;font-size:13px;"><strong>File:</strong> <span id="fileName"></span></p>
                <p style="margin:5px 0;font-size:13px;"><strong>Size:</strong> <span id="fileSize"></span></p>
              </div>
            </div>

            <!-- Folder Selection -->
            <div class="form-group">
              <label for="uploadFolder">Folder (Optional)</label>
              <select id="uploadFolder" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
                <option value="">No Folder</option>
                ${uploadFolders.map(folder => 
                  `<option value="${folder.id}">${folder.folder_name}</option>`
                ).join('')}
              </select>
              <small style="color:#666;display:block;margin-top:5px;">
                <a href="#" onclick="event.preventDefault();showCreateFolderModal();" style="color:#006600;text-decoration:none;">
                  + Create new folder
                </a>
              </small>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="uploadDescription">Description (Optional)</label>
              <textarea id="uploadDescription" placeholder="Add notes about this document..." 
                style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;resize:vertical;min-height:80px;"></textarea>
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label for="uploadTags">Tags (Optional)</label>
              <input type="text" id="uploadTags" placeholder="e.g., important, 2024, personal" 
                style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
              <small style="color:#666;display:block;margin-top:5px;">Separate tags with commas</small>
            </div>

            <!-- Upload Progress -->
            <div id="uploadProgress" style="display:none;margin:15px 0;">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                <span style="font-size:13px;font-weight:600;">Uploading...</span>
                <span id="uploadPercent" style="font-size:13px;font-weight:600;">0%</span>
              </div>
              <div style="width:100%;height:6px;background:#e5e5e5;border-radius:3px;overflow:hidden;">
                <div id="uploadBar" style="width:0%;height:100%;background:#006600;transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Error Message -->
            <div id="uploadError" style="display:none;padding:10px;background:#fee2e2;border:1px solid #fecaca;border-radius:6px;color:#991b1b;font-size:13px;margin:10px 0;"></div>

            <!-- Buttons -->
            <div style="display:flex;gap:10px;margin-top:20px;">
              <button type="button" class="btn-secondary" onclick="document.getElementById('lockerUploadModal').style.display='none'" 
                style="flex:1;padding:10px;border:1px solid #ddd;background:#f5f5f5;color:#333;border-radius:6px;cursor:pointer;font-weight:600;">
                Cancel
              </button>
              <button type="submit" class="btn-primary" id="uploadSubmitBtn"
                style="flex:1;padding:10px;background:#006600;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">
                <i class="fas fa-upload"></i> Upload
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Add modal to body if not exists
  if (!document.getElementById('lockerUploadModal')) {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}

// Setup upload modal listeners
function setupUploadModalListeners() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('uploadFile');
  const form = document.getElementById('uploadDocumentForm');

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.background = '#e8f5e9';
    dropZone.style.borderColor = '#10b981';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = '#f9f9f9';
    dropZone.style.borderColor = '#006600';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = '#f9f9f9';
    dropZone.style.borderColor = '#006600';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // Click to browse
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleUpload();
  });
}

// Handle file selection
function handleFileSelect(file) {
  const validation = validateFile(file);
  
  if (!validation.valid) {
    showUploadError(validation.error);
    selectedFile = null;
    return;
  }

  selectedFile = file;
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);
  document.getElementById('fileInfo').style.display = 'block';
  document.getElementById('uploadError').style.display = 'none';
}

// Handle upload
async function handleUpload() {
  if (!selectedFile) {
    showUploadError('Please select a file');
    return;
  }

  if (!currentUser) {
    showUploadError('Please log in first');
    return;
  }

  const docType = document.getElementById('uploadDocType').value;
  if (!docType) {
    showUploadError('Please select a document type');
    return;
  }

  try {
    // Disable submit button
    const submitBtn = document.getElementById('uploadSubmitBtn');
    submitBtn.disabled = true;
    document.getElementById('uploadProgress').style.display = 'block';

    // Generate document ID
    const documentId = crypto.randomUUID();

    // Upload to storage
    const storageResult = await uploadDocumentToStorage(selectedFile, currentUser.id, documentId);
    if (!storageResult.success) {
      throw new Error(storageResult.error);
    }

    // Create database record
    const tags = document.getElementById('uploadTags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    const dbResult = await createLockerDocument(currentUser.id, {
      documentName: selectedFile.name,
      documentType: docType,
      folderId: document.getElementById('uploadFolder').value || null,
      filePath: storageResult.filePath,
      fileSize: storageResult.fileSize,
      mimeType: storageResult.mimeType,
      publicUrl: storageResult.publicUrl,
      description: document.getElementById('uploadDescription').value,
      tags
    });

    if (!dbResult.success) {
      throw new Error(dbResult.error);
    }

    // Success
    showNotification('Document uploaded successfully!', 'success');
    document.getElementById('lockerUploadModal').style.display = 'none';
    document.getElementById('uploadDocumentForm').reset();
    selectedFile = null;

    // Refresh digital locker if on that page
    if (typeof window.loadLockerDocuments === 'function') {
      window.loadLockerDocuments();
    }

  } catch (error) {
    showUploadError(error.message);
  } finally {
    const submitBtn = document.getElementById('uploadSubmitBtn');
    submitBtn.disabled = false;
    document.getElementById('uploadProgress').style.display = 'none';
  }
}

// Show upload error
function showUploadError(message) {
  const errorDiv = document.getElementById('uploadError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#d1fae5' : '#fef3c7'};
    color: ${type === 'success' ? '#065f46' : '#92400e'};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i> ${message}
  `;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

// Open upload modal from dashboard
window.openLockerUploadModal = function() {
  const modal = document.getElementById('lockerUploadModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
  }
};

// Create folder modal
function showCreateFolderModal() {
  const folderName = prompt('Enter folder name:');
  if (folderName) {
    // This will be implemented in the main digital locker page
    console.log('Create folder:', folderName);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeUploadModal);
