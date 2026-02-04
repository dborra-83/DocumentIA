"""
File validation module for document analysis system.

This module provides validation functions for uploaded documents:
- File type validation (PDF, DOCX, TXT only)
- File size validation (max 10MB)
- PDF page count validation (max 100 pages)

Requirements: 2.1, 2.2, 2.3, 2.4
"""

import os
from typing import Dict, Optional, Tuple
from io import BytesIO
import PyPDF2


# Constants
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
MAX_PDF_PAGES = 100
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
}


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class FileValidator:
    """Validator for document files."""
    
    @staticmethod
    def validate_file_type(filename: str, mime_type: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate that the file type is allowed.
        
        Args:
            filename: Name of the file including extension
            mime_type: Optional MIME type of the file
            
        Returns:
            Tuple of (is_valid, error_message)
            
        Requirements: 2.1, 2.2
        """
        # Extract file extension
        _, ext = os.path.splitext(filename.lower())
        
        if not ext:
            return False, "File must have an extension"
        
        if ext not in ALLOWED_EXTENSIONS:
            allowed = ', '.join(sorted(ALLOWED_EXTENSIONS))
            return False, f"Invalid file type '{ext}'. Only {allowed} files are allowed"
        
        # If MIME type is provided, validate it as well
        if mime_type and mime_type not in ALLOWED_MIME_TYPES:
            return False, f"Invalid MIME type '{mime_type}'. File type not supported"
        
        return True, None
    
    @staticmethod
    def validate_file_size(file_size: int) -> Tuple[bool, Optional[str]]:
        """
        Validate that the file size is within limits.
        
        Args:
            file_size: Size of the file in bytes
            
        Returns:
            Tuple of (is_valid, error_message)
            
        Requirements: 2.3
        """
        if file_size <= 0:
            return False, "File size must be greater than 0"
        
        if file_size > MAX_FILE_SIZE_BYTES:
            max_size_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
            actual_size_mb = file_size / (1024 * 1024)
            return False, f"File size ({actual_size_mb:.2f}MB) exceeds maximum allowed size of {max_size_mb:.0f}MB"
        
        return True, None
    
    @staticmethod
    def validate_pdf_page_count(file_content: bytes) -> Tuple[bool, Optional[str]]:
        """
        Validate that a PDF file does not exceed the maximum page count.
        
        Args:
            file_content: Binary content of the PDF file
            
        Returns:
            Tuple of (is_valid, error_message)
            
        Requirements: 2.4
        """
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            page_count = len(pdf_reader.pages)
            
            if page_count > MAX_PDF_PAGES:
                return False, f"PDF has {page_count} pages, which exceeds the maximum allowed {MAX_PDF_PAGES} pages"
            
            return True, None
            
        except PyPDF2.errors.PdfReadError as e:
            return False, f"Invalid or corrupted PDF file: {str(e)}"
        except Exception as e:
            return False, f"Error reading PDF file: {str(e)}"
    
    @staticmethod
    def validate_file(
        filename: str,
        file_size: int,
        file_content: Optional[bytes] = None,
        mime_type: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Perform comprehensive validation on a file.
        
        Args:
            filename: Name of the file including extension
            file_size: Size of the file in bytes
            file_content: Optional binary content of the file (required for PDF page count validation)
            mime_type: Optional MIME type of the file
            
        Returns:
            Dictionary with validation results:
            {
                'valid': bool,
                'errors': list of error messages,
                'file_type': str (extension without dot)
            }
            
        Requirements: 2.1, 2.2, 2.3, 2.4, 2.9
        """
        errors = []
        
        # Validate file type
        is_valid_type, type_error = FileValidator.validate_file_type(filename, mime_type)
        if not is_valid_type:
            errors.append(type_error)
        
        # Validate file size
        is_valid_size, size_error = FileValidator.validate_file_size(file_size)
        if not is_valid_size:
            errors.append(size_error)
        
        # Extract file extension for additional validation
        _, ext = os.path.splitext(filename.lower())
        file_type = ext[1:] if ext else None  # Remove the dot
        
        # For PDF files, validate page count if content is provided
        if file_type == 'pdf' and file_content is not None:
            is_valid_pages, pages_error = FileValidator.validate_pdf_page_count(file_content)
            if not is_valid_pages:
                errors.append(pages_error)
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'file_type': file_type
        }


def validate_file_metadata(filename: str, file_size: int, mime_type: Optional[str] = None) -> Dict[str, any]:
    """
    Convenience function to validate file metadata without file content.
    
    This is useful for pre-upload validation where the file content is not yet available.
    
    Args:
        filename: Name of the file including extension
        file_size: Size of the file in bytes
        mime_type: Optional MIME type of the file
        
    Returns:
        Dictionary with validation results
        
    Requirements: 2.1, 2.2, 2.3, 2.9
    """
    return FileValidator.validate_file(filename, file_size, None, mime_type)


def validate_file_complete(
    filename: str,
    file_size: int,
    file_content: bytes,
    mime_type: Optional[str] = None
) -> Dict[str, any]:
    """
    Convenience function to perform complete validation including PDF page count.
    
    Args:
        filename: Name of the file including extension
        file_size: Size of the file in bytes
        file_content: Binary content of the file
        mime_type: Optional MIME type of the file
        
    Returns:
        Dictionary with validation results
        
    Requirements: 2.1, 2.2, 2.3, 2.4, 2.9
    """
    return FileValidator.validate_file(filename, file_size, file_content, mime_type)
