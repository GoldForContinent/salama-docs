// Digital Locker Helper Functions and Supabase Operations
import { supabase } from './supabase.js';

// ============ CONSTANTS ============
export const DOCUMENT_TYPES = {
  // Government Identification
  'national_id': 'National ID Card',
  'passport': 'Kenyan Passport',
  'alien_id': 'Alien ID Card',
  'refugee_id': 'Refugee ID',
  'military_id': 'Military ID',
  
  // Driving & Vehicle
  'driving_license': 'Driving License',
  'logbook': 'Vehicle Logbook',
  'psi_certificate': 'PSI Certificate',
  'towing_permit': 'Towing Permit',
  'badge': 'PSV Badge',
  
  // Education
  'kcpe_certificate': 'KCPE Certificate',
  'kcse_certificate': 'KCSE Certificate',
  'university_degree': 'University Degree',
  'college_diploma': 'College Diploma/Certificate',
  'transcript': 'Official Transcript',
  'student_id': 'Student ID Card',
  
  // Professional
  'work_permit': 'Work Permit',
  'professional_license': 'Professional License',
  'practicing_certificate': 'Practicing Certificate',
  'tax_pin': 'KRA PIN Certificate',
  'business_permit': 'Business Permit',
  
  // Property & Legal
  'title_deed': 'Title Deed',
  'lease_agreement': 'Lease Agreement',
  'allotment_letter': 'Land Allotment Letter',
  'court_order': 'Court Order',
  'power_attorney': 'Power of Attorney',
  
  // Financial
  'bank_card': 'Bank/ATM Card',
  'checkbook': 'Checkbook',
  'loan_agreement': 'Loan Agreement',
  'insurance_policy': 'Insurance Policy',
  
  // Health
  'birth_certificate': 'Birth Certificate',
  'death_certificate': 'Death Certificate',
  'marriage_certificate': 'Marriage Certificate',
  'medical_report': 'Medical Report',
  'nhif_card': 'NHIF Card',
  
  // Other Important
  'will': 'Will/Testament',
  'adoption_papers': 'Adoption Papers',
  'guardianship': 'Guardianship Papers',
  'other': 'Other Document'
};

// ============ HELPER FUNCTIONS ============

export function getDocIcon(docType) {
  const icons = {
    // Government Identification
    'national_id': 'fa-id-card',
    'passport': 'fa-passport',
    'alien_id': 'fa-id-card',
    'refugee_id': 'fa-id-card',
    'military_id': 'fa-id-card',
    
    // Driving & Vehicle
    'driving_license': 'fa-car',
    'logbook': 'fa-book',
    'psi_certificate': 'fa-certificate',
    'towing_permit': 'fa-file-contract',
    'badge': 'fa-badge',
    
    // Education
    'kcpe_certificate': 'fa-graduation-cap',
    'kcse_certificate': 'fa-graduation-cap',
    'university_degree': 'fa-graduation-cap',
    'college_diploma': 'fa-certificate',
    'transcript': 'fa-file-alt',
    'student_id': 'fa-id-card',
    
    // Professional
    'work_permit': 'fa-file-contract',
    'professional_license': 'fa-certificate',
    'practicing_certificate': 'fa-certificate',
    'tax_pin': 'fa-file-invoice-dollar',
    'business_permit': 'fa-store',
    
    // Property & Legal
    'title_deed': 'fa-home',
    'lease_agreement': 'fa-file-contract',
    'allotment_letter': 'fa-file-alt',
    'court_order': 'fa-gavel',
    'power_attorney': 'fa-file-signature',
    
    // Financial
    'bank_card': 'fa-credit-card',
    'checkbook': 'fa-book',
    'loan_agreement': 'fa-file-contract',
    'insurance_policy': 'fa-shield-alt',
    
    // Health
    'birth_certificate': 'fa-birthday-cake',
    'death_certificate': 'fa-cross',
    'marriage_certificate': 'fa-ring',
    'medical_report': 'fa-file-medical',
    'nhif_card': 'fa-credit-card',
    
    // Other Important
    'will': 'fa-scroll',
    'adoption_papers': 'fa-file-alt',
    'guardianship': 'fa-file-alt',
    'other': 'fa-file-alt'
  };
  return icons[docType] || 'fa-file';
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function validateFile(file, maxSize = 52428800) {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Please upload images (JPEG, PNG, GIF, WebP) or PDFs.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)} limit.`
    };
  }

  return { valid: true };
}

// ============ SUPABASE OPERATIONS ============

// Upload document to storage
export async function uploadDocumentToStorage(file, userId, documentId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${documentId}.${fileExt}`;
    const filePath = `${userId}/documents/${fileName}`;

    const { data, error } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('user-documents')
      .getPublicUrl(filePath);

    return {
      success: true,
      filePath,
      publicUrl: publicUrl.publicUrl,
      fileSize: file.size,
      mimeType: file.type
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Delete document from storage
export async function deleteDocumentFromStorage(filePath) {
  try {
    const { error } = await supabase.storage
      .from('user-documents')
      .remove([filePath]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
}

// Create locker document record in database
export async function createLockerDocument(userId, documentData) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .insert([{
        user_id: userId,
        document_name: documentData.documentName,
        document_type: documentData.documentType,
        file_path: documentData.filePath,
        file_size: documentData.fileSize,
        mime_type: documentData.mimeType,
        storage_url: documentData.publicUrl,
        description: documentData.description || '',
        tags: documentData.tags || []
      }])
      .select();

    if (error) throw error;
    return { success: true, document: data[0] };
  } catch (error) {
    console.error('Create document error:', error);
    return { success: false, error: error.message };
  }
}

// Get user's locker documents
export async function getUserLockerDocuments(userId, archived = false) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', archived)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { success: true, documents: data };
  } catch (error) {
    console.error('Get documents error:', error);
    return { success: false, error: error.message };
  }
}

// Update document name
export async function updateDocumentName(documentId, newName) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .update({ document_name: newName })
      .eq('id', documentId)
      .select();

    if (error) throw error;
    return { success: true, document: data[0] };
  } catch (error) {
    console.error('Update document error:', error);
    return { success: false, error: error.message };
  }
}

// Update document description
export async function updateDocumentDescription(documentId, description) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .update({ description })
      .eq('id', documentId)
      .select();

    if (error) throw error;
    return { success: true, document: data[0] };
  } catch (error) {
    console.error('Update description error:', error);
    return { success: false, error: error.message };
  }
}

// Archive document
export async function archiveLockerDocument(documentId, archived = true) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .update({ is_archived: archived })
      .eq('id', documentId)
      .select();

    if (error) throw error;
    return { success: true, document: data[0] };
  } catch (error) {
    console.error('Archive document error:', error);
    return { success: false, error: error.message };
  }
}

// Delete locker document (both from storage and database)
export async function deleteLockerDocument(documentId, filePath) {
  try {
    // Delete from storage
    const storageResult = await deleteDocumentFromStorage(filePath);
    if (!storageResult.success) throw new Error(storageResult.error);

    // Delete from database
    const { error } = await supabase
      .from('locker_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return { success: false, error: error.message };
  }
}

// Search documents
export async function searchLockerDocuments(userId, searchTerm) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .or(`document_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { success: true, documents: data };
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, error: error.message };
  }
}

// Get document count
export async function getDocumentCount(userId) {
  try {
    const { count, error } = await supabase
      .from('locker_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false);

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Get count error:', error);
    return { success: false, error: error.message };
  }
}

// Get single document
export async function getDocument(documentId) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) throw error;
    return { success: true, document: data };
  } catch (error) {
    console.error('Get document error:', error);
    return { success: false, error: error.message };
  }
}

// Add tags to document
export async function addTagsToDocument(documentId, tags) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .update({ tags })
      .eq('id', documentId)
      .select();

    if (error) throw error;
    return { success: true, document: data[0] };
  } catch (error) {
    console.error('Add tags error:', error);
    return { success: false, error: error.message };
  }
}

// Get documents by type
export async function getDocumentsByType(userId, documentType) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .eq('is_archived', false)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { success: true, documents: data };
  } catch (error) {
    console.error('Get documents by type error:', error);
    return { success: false, error: error.message };
  }
}

// ============ UTILITY FUNCTIONS ============

export function debounce(func, wait) {
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

export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#fef3c7'};
    color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#92400e'};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    font-weight: 500;
  `;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}
  `;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}
