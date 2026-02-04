/**
 * File validation utilities for document upload
 * Validates file type, size, and PDF page count
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_PDF_PAGES = 100;

/**
 * Validate file type (PDF, DOCX, TXT only)
 */
export const validateFileType = (file: File): ValidationResult => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Check MIME type
  if (Object.keys(ALLOWED_TYPES).includes(fileType)) {
    return { isValid: true };
  }

  // Fallback: check file extension
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  if (Object.values(ALLOWED_TYPES).includes(extension)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Invalid file type. Only PDF, DOCX, and TXT files are allowed.',
  };
};

/**
 * Validate file size (max 10MB)
 */
export const validateFileSize = (file: File): ValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${sizeMB}MB) exceeds the maximum limit of 10MB.`,
    };
  }

  return { isValid: true };
};

/**
 * Validate PDF page count (max 100 pages)
 * Note: This is a client-side estimation. Actual validation happens on the backend.
 */
export const validatePDFPages = async (file: File): Promise<ValidationResult> => {
  if (file.type !== 'application/pdf') {
    return { isValid: true }; // Not a PDF, skip this validation
  }

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to string to search for page count
    const text = new TextDecoder('latin1').decode(uint8Array);
    
    // Look for /Type /Page or /Type/Page patterns
    const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
    
    if (pageMatches && pageMatches.length > MAX_PDF_PAGES) {
      return {
        isValid: false,
        error: `PDF has ${pageMatches.length} pages, which exceeds the maximum limit of ${MAX_PDF_PAGES} pages.`,
      };
    }

    return { isValid: true };
  } catch (error) {
    // If we can't parse the PDF, let the backend handle it
    console.warn('Could not validate PDF page count on client:', error);
    return { isValid: true };
  }
};

/**
 * Validate file completely (type, size, and PDF pages)
 */
export const validateFile = async (file: File): Promise<ValidationResult> => {
  // Validate type
  const typeResult = validateFileType(file);
  if (!typeResult.isValid) {
    return typeResult;
  }

  // Validate size
  const sizeResult = validateFileSize(file);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  // Validate PDF pages if applicable
  const pagesResult = await validatePDFPages(file);
  if (!pagesResult.isValid) {
    return pagesResult;
  }

  return { isValid: true };
};
