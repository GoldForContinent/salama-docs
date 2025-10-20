// Enhanced Digital Locker Page
import { supabase } from './supabase.js';
import {
  DOCUMENT_TYPES,
  FOLDER_COLORS,
  getDocIcon,
  formatFileSize,
  getUserLockerDocuments,
  getUserLockerFolders,
  createLockerFolder,
  moveDocumentToFolder,
  deleteLockerDocument,
  archiveLockerDocument,
  searchLockerDocuments,
  getLockerStatistics
} from './locker-utils.js';

let currentUser = null;
let allDocuments = [];
let allFolders = [];
let currentFolderId = null;
let currentViewMode = 'grid'; // grid or list

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await initializeLocker();
});

async function initializeLocker() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = 'loginpage.html';
      return;
    }

    currentUser = user;
    await loadLockerData();
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

async function loadLockerData() {
  try {
    // Load documents
    const docsResult = await getUserLockerDocuments(currentUser.id);
    if (docsResult.success) {
      allDocuments = docsResult.documents;
    }

    // Load folders
    const foldersResult = await getUserLockerFolders(currentUser.id);
    if (foldersResult.success) {
      allFolders = foldersResult.folders;
    }

    // Load statistics
    const statsResult = await getLockerStatistics(currentUser.id);
    if (statsResult.success) {
      updateStatistics(statsResult.stats);
    }

    renderDocuments();
    renderFolders();
  } catch (error) {
    console.error('Load data error:', error);
  }
}

function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('searchDocuments');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  // Filter by type
  const typeFilter = document.getElementById('filterDocType');
  if (typeFilter) {
    typeFilter.addEventListener('change', filterDocuments);
  }

  // Sort
  const sortSelect = document.getElementById('sortDocuments');
  if (sortSelect) {
    sortSelect.addEventListener('change', sortDocuments);
  }

  // View mode toggle
  const gridViewBtn = document.getElementById('gridViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');
  if (gridViewBtn) gridViewBtn.addEventListener('click', () => setViewMode('grid'));
  if (listViewBtn) listViewBtn.addEventListener('click', () => setViewMode('list'));
}

function renderDocuments() {
  const container = document.getElementById('documentsContainer');
  const emptyState = document.getElementById('emptyState');

  if (!container) return;

  if (allDocuments.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  const documentsHTML = allDocuments.map(doc => `
    <div class="document-card ${currentViewMode}" data-doc-id="${doc.id}">
      <div class="doc-header">
        <div class="doc-icon-wrapper">
          <i class="fas ${getDocIcon(doc.document_type)}"></i>
        </div>
        <div class="doc-actions">
          <button class="action-btn" onclick="openDocumentMenu('${doc.id}')" title="More options">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      <div class="doc-content">
        <h3 class="doc-name">${doc.document_name}</h3>
        <p class="doc-type">${DOCUMENT_TYPES[doc.document_type] || 'Document'}</p>
        ${doc.description ? `<p class="doc-description">${doc.description}</p>` : ''}
        
        <div class="doc-meta">
          <span class="doc-size"><i class="fas fa-file"></i> ${formatFileSize(doc.file_size)}</span>
          <span class="doc-date"><i class="fas fa-calendar"></i> ${new Date(doc.uploaded_at).toLocaleDateString()}</span>
        </div>

        ${doc.locker_folders ? `
          <div class="doc-folder">
            <i class="fas fa-folder"></i> ${doc.locker_folders.folder_name}
          </div>
        ` : ''}

        ${doc.tags && doc.tags.length > 0 ? `
          <div class="doc-tags">
            ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      <div class="doc-footer">
        <button class="btn-action btn-view" onclick="viewDocument('${doc.id}')">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="btn-action btn-download" onclick="downloadDocument('${doc.id}')">
          <i class="fas fa-download"></i> Download
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = documentsHTML;
}

function renderFolders() {
  const container = document.getElementById('foldersContainer');
  if (!container) return;

  const foldersHTML = allFolders.map(folder => `
    <div class="folder-item" style="border-left: 4px solid ${folder.color};">
      <div class="folder-header">
        <i class="fas fa-folder" style="color: ${folder.color};"></i>
        <span class="folder-name">${folder.folder_name}</span>
        <button class="folder-menu-btn" onclick="openFolderMenu('${folder.id}')">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </div>
      <p class="folder-description">${folder.description || 'No description'}</p>
      <button class="btn-open-folder" onclick="openFolder('${folder.id}')">
        Open Folder
      </button>
    </div>
  `).join('');

  container.innerHTML = foldersHTML;
}

async function handleSearch(e) {
  const searchTerm = e.target.value.trim();
  if (!searchTerm) {
    await loadLockerData();
    return;
  }

  try {
    const result = await searchLockerDocuments(currentUser.id, searchTerm);
    if (result.success) {
      allDocuments = result.documents;
      renderDocuments();
    }
  } catch (error) {
    console.error('Search error:', error);
  }
}

function filterDocuments() {
  const typeFilter = document.getElementById('filterDocType')?.value;
  if (!typeFilter) {
    renderDocuments();
    return;
  }

  const filtered = allDocuments.filter(doc => doc.document_type === typeFilter);
  const container = document.getElementById('documentsContainer');
  
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No documents found</p>';
    return;
  }

  allDocuments = filtered;
  renderDocuments();
}

function sortDocuments() {
  const sortBy = document.getElementById('sortDocuments')?.value || 'date-desc';

  switch (sortBy) {
    case 'date-desc':
      allDocuments.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
      break;
    case 'date-asc':
      allDocuments.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));
      break;
    case 'name-asc':
      allDocuments.sort((a, b) => a.document_name.localeCompare(b.document_name));
      break;
    case 'name-desc':
      allDocuments.sort((a, b) => b.document_name.localeCompare(a.document_name));
      break;
    case 'size-asc':
      allDocuments.sort((a, b) => a.file_size - b.file_size);
      break;
    case 'size-desc':
      allDocuments.sort((a, b) => b.file_size - a.file_size);
      break;
  }

  renderDocuments();
}

function setViewMode(mode) {
  currentViewMode = mode;
  document.getElementById('gridViewBtn')?.classList.toggle('active', mode === 'grid');
  document.getElementById('listViewBtn')?.classList.toggle('active', mode === 'list');
  renderDocuments();
}

async function viewDocument(docId) {
  const doc = allDocuments.find(d => d.id === docId);
  if (!doc) return;

  // Create preview modal
  const modal = document.createElement('div');
  modal.className = 'document-preview-modal';
  modal.innerHTML = `
    <div class="preview-container">
      <div class="preview-header">
        <h3>${doc.document_name}</h3>
        <button class="close-btn" onclick="this.closest('.document-preview-modal').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="preview-content">
        ${doc.mime_type.startsWith('image/') ? 
          `<img src="${doc.storage_url}" alt="${doc.document_name}" style="max-width:100%;max-height:600px;">` :
          `<iframe src="${doc.storage_url}" style="width:100%;height:600px;border:none;"></iframe>`
        }
      </div>
      <div class="preview-footer">
        <button class="btn-action" onclick="downloadDocument('${docId}')">
          <i class="fas fa-download"></i> Download
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

async function downloadDocument(docId) {
  const doc = allDocuments.find(d => d.id === docId);
  if (!doc) return;

  try {
    const link = document.createElement('a');
    link.href = doc.storage_url;
    link.download = doc.document_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download document');
  }
}

async function openDocumentMenu(docId) {
  const doc = allDocuments.find(d => d.id === docId);
  if (!doc) return;

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.innerHTML = `
    <button onclick="viewDocument('${docId}')"><i class="fas fa-eye"></i> View</button>
    <button onclick="downloadDocument('${docId}')"><i class="fas fa-download"></i> Download</button>
    <button onclick="moveDocumentModal('${docId}')"><i class="fas fa-folder-open"></i> Move to Folder</button>
    <button onclick="archiveDocumentAction('${docId}')"><i class="fas fa-archive"></i> Archive</button>
    <button onclick="deleteDocumentAction('${docId}')" style="color:#dc3545;"><i class="fas fa-trash"></i> Delete</button>
  `;

  document.body.appendChild(menu);
  menu.style.display = 'block';
  setTimeout(() => menu.remove(), 5000);
}

async function moveDocumentModal(docId) {
  const folderOptions = allFolders.map(f => 
    `<option value="${f.id}">${f.folder_name}</option>`
  ).join('');

  const folderId = prompt(`Select folder:\n${allFolders.map(f => `${f.id}: ${f.folder_name}`).join('\n')}`);
  if (folderId) {
    await moveDocumentToFolder(docId, folderId);
    await loadLockerData();
  }
}

async function archiveDocumentAction(docId) {
  if (confirm('Archive this document?')) {
    await archiveLockerDocument(docId, true);
    await loadLockerData();
  }
}

async function deleteDocumentAction(docId) {
  if (confirm('Delete this document permanently?')) {
    const doc = allDocuments.find(d => d.id === docId);
    if (doc) {
      await deleteLockerDocument(docId, doc.file_path);
      await loadLockerData();
    }
  }
}

async function openFolder(folderId) {
  currentFolderId = folderId;
  const folder = allFolders.find(f => f.id === folderId);
  
  const folderDocs = allDocuments.filter(d => d.folder_id === folderId);
  allDocuments = folderDocs;
  
  renderDocuments();
}

function openFolderMenu(folderId) {
  // Implement folder menu
  console.log('Folder menu for:', folderId);
}

function updateStatistics(stats) {
  const statsContainer = document.getElementById('lockerStats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-item">
        <i class="fas fa-file"></i>
        <div>
          <p class="stat-value">${stats.totalDocuments}</p>
          <p class="stat-label">Documents</p>
        </div>
      </div>
      <div class="stat-item">
        <i class="fas fa-database"></i>
        <div>
          <p class="stat-value">${stats.formattedSize}</p>
          <p class="stat-label">Storage Used</p>
        </div>
      </div>
      <div class="stat-item">
        <i class="fas fa-folder"></i>
        <div>
          <p class="stat-value">${stats.totalFolders}</p>
          <p class="stat-label">Folders</p>
        </div>
      </div>
    `;
  }
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export for dashboard
window.loadLockerDocuments = loadLockerData;
