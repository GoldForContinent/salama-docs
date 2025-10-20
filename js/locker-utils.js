// Digital Locker Utilities and Helper Functions
import { supabase } from './supabase.js';

// Document types mapping
export const DOCUMENT_TYPES = {
  'national_id': 'National ID Card',
  'passport': 'Kenyan Passport',
  'driving_license': 'Driving License',
  'kra_pin': 'KRA PIN Certificate',
  'birth_certificate': 'Birth Certificate',
  'marriage_certificate': 'Marriage Certificate',
  'death_certificate': 'Death Certificate',
  'school_certificate': 'School Certificate',
  'university_degree': 'University Degree',
  'college_diploma': 'College Diploma',
  'work_permit': 'Work Permit',
  'business_permit': 'Business Permit',
  'title_deed': 'Title Deed',
  'lease_agreement': 'Lease Agreement',
  'insurance_policy': 'Insurance Policy',
  'medical_report': 'Medical Report',
  'bank_statement': 'Bank Statement',
  'loan_agreement': 'Loan Agreement',
  'power_attorney': 'Power of Attorney',
  'will': 'Will/Testament',
  'other': 'Other Document'
};

// Folder colors
export const FOLDER_COLORS = [
  '#006600', // Green
  '#BB0000', // Red
  '#0066CC', // Blue
  '#FF6600', // Orange
  '#9900CC', // Purple
  '#00CCCC', // Cyan
  '#FFCC00', // Yellow
  '#CC0066'  // Pink
];

// Get document icon
export function getDocIcon(docType) {
  const icons = {
    'national_id': 'fa-id-card',
    'passport': 'fa-passport',
    'driving_license': 'fa-car',
    'kra_pin': 'fa-file-invoice-dollar',
    'birth_certificate': 'fa-birthday-cake',
    'marriage_certificate': 'fa-ring',
    'death_certificate': 'fa-cross',
    'school_certificate': 'fa-graduation-cap',
    'university_degree': 'fa-graduation-cap',
    'college_diploma': 'fa-certificate',
    'work_permit': 'fa-file-contract',
    'business_permit': 'fa-store',
    'title_deed': 'fa-home',
    'lease_agreement': 'fa-file-contract',
    'insurance_policy': 'fa-shield-alt',
    'medical_report': 'fa-file-medical',
    'bank_statement': 'fa-bank',
    'loan_agreement': 'fa-file-contract',
    'power_attorney': 'fa-file-signature',
    'will': 'fa-scroll',
    'other': 'fa-file-alt'
  };
  return icons[docType] || 'fa-file';
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Validate file
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
    return { valid: false, error: 'File type not allowed. Please upload images or PDFs.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${formatFileSize(maxSize)} limit.` };
  }

  return { valid: true };
}

// Upload document to Supabase Storage
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

// Create locker document record
export async function createLockerDocument(userId, documentData) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .insert([{
        user_id: userId,
        document_name: documentData.documentName,
        document_type: documentData.documentType,
        folder_id: documentData.folderId || null,
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
export async function getUserLockerDocuments(userId, folderId = null, archived = false) {
  try {
    let query = supabase
      .from('locker_documents')
      .select('*, locker_folders(id, folder_name, color)')
      .eq('user_id', userId)
      .eq('is_archived', archived)
      .order('uploaded_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, documents: data };
  } catch (error) {
    console.error('Get documents error:', error);
    return { success: false, error: error.message };
  }
}

// Create folder
export async function createLockerFolder(userId, folderName, description = '', color = '#006600') {
  try {
    const { data, error } = await supabase
      .from('locker_folders')
      .insert([{
        user_id: userId,
        folder_name: folderName,
        description,
        color
      }])
      .select();

    if (error) throw error;
    return { success: true, folder: data[0] };
  } catch (error) {
    console.error('Create folder error:', error);
    return { success: false, error: error.message };
  }
}

// Get user's folders
export async function getUserLockerFolders(userId) {
  try {
    const { data, error } = await supabase
      .from('locker_folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, folders: data };
  } catch (error) {
    console.error('Get folders error:', error);
    return { success: false, error: error.message };
  }
}

// Move document to folder
export async function moveDocumentToFolder(documentId, folderId) {
  try {
    const { data, error } = await supabase
      .from('locker_documents')
      .update({ folder_id: folderId })
      .eq('id', documentId)
      .select();

    if (error) throw error;
    return { success: true, document: data[0] };
  } catch (error) {
    console.error('Move document error:', error);
    return { success: false, error: error.message };
  }
}

// Delete locker document
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

// Get document statistics
export async function getLockerStatistics(userId) {
  try {
    const { data: documents, error: docsError } = await supabase
      .from('locker_documents')
      .select('file_size')
      .eq('user_id', userId)
      .eq('is_archived', false);

    if (docsError) throw docsError;

    const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    const totalDocuments = documents.length;

    const { data: folders, error: foldersError } = await supabase
      .from('locker_folders')
      .select('id')
      .eq('user_id', userId);

    if (foldersError) throw foldersError;

    return {
      success: true,
      stats: {
        totalDocuments,
        totalSize,
        totalFolders: folders.length,
        formattedSize: formatFileSize(totalSize)
      }
    };
  } catch (error) {
    console.error('Statistics error:', error);
    return { success: false, error: error.message };
  }
}
