"""
Unit tests for file validation module.

Tests cover:
- File type validation
- File size validation
- PDF page count validation
- Comprehensive file validation
- Error message generation

Requirements: 2.1, 2.2, 2.3, 2.4, 2.9
"""

import pytest
from io import BytesIO
import PyPDF2
from PyPDF2 import PdfWriter

from .file_validator import (
    FileValidator,
    validate_file_metadata,
    validate_file_complete,
    MAX_FILE_SIZE_BYTES,
    MAX_PDF_PAGES,
    ALLOWED_EXTENSIONS
)


class TestFileTypeValidation:
    """Tests for file type validation (Requirements 2.1, 2.2)."""
    
    def test_valid_pdf_extension(self):
        """Test that PDF files are accepted."""
        is_valid, error = FileValidator.validate_file_type("document.pdf")
        assert is_valid is True
        assert error is None
    
    def test_valid_docx_extension(self):
        """Test that DOCX files are accepted."""
        is_valid, error = FileValidator.validate_file_type("document.docx")
        assert is_valid is True
        assert error is None
    
    def test_valid_txt_extension(self):
        """Test that TXT files are accepted."""
        is_valid, error = FileValidator.validate_file_type("document.txt")
        assert is_valid is True
        assert error is None
    
    def test_case_insensitive_extension(self):
        """Test that extensions are case-insensitive."""
        is_valid, error = FileValidator.validate_file_type("document.PDF")
        assert is_valid is True
        assert error is None
        
        is_valid, error = FileValidator.validate_file_type("document.DOCX")
        assert is_valid is True
        assert error is None
    
    def test_invalid_extension(self):
        """Test that invalid file types are rejected."""
        is_valid, error = FileValidator.validate_file_type("document.exe")
        assert is_valid is False
        assert "Invalid file type" in error
        assert ".exe" in error
    
    def test_no_extension(self):
        """Test that files without extension are rejected."""
        is_valid, error = FileValidator.validate_file_type("document")
        assert is_valid is False
        assert "must have an extension" in error
    
    def test_valid_mime_type_pdf(self):
        """Test that valid PDF MIME type is accepted."""
        is_valid, error = FileValidator.validate_file_type(
            "document.pdf",
            mime_type="application/pdf"
        )
        assert is_valid is True
        assert error is None
    
    def test_valid_mime_type_docx(self):
        """Test that valid DOCX MIME type is accepted."""
        is_valid, error = FileValidator.validate_file_type(
            "document.docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        assert is_valid is True
        assert error is None
    
    def test_invalid_mime_type(self):
        """Test that invalid MIME types are rejected."""
        is_valid, error = FileValidator.validate_file_type(
            "document.pdf",
            mime_type="application/x-executable"
        )
        assert is_valid is False
        assert "Invalid MIME type" in error


class TestFileSizeValidation:
    """Tests for file size validation (Requirement 2.3)."""
    
    def test_valid_file_size(self):
        """Test that files under 10MB are accepted."""
        file_size = 5 * 1024 * 1024  # 5MB
        is_valid, error = FileValidator.validate_file_size(file_size)
        assert is_valid is True
        assert error is None
    
    def test_file_size_at_limit(self):
        """Test that files exactly at 10MB are accepted."""
        file_size = MAX_FILE_SIZE_BYTES
        is_valid, error = FileValidator.validate_file_size(file_size)
        assert is_valid is True
        assert error is None
    
    def test_file_size_exceeds_limit(self):
        """Test that files over 10MB are rejected."""
        file_size = 11 * 1024 * 1024  # 11MB
        is_valid, error = FileValidator.validate_file_size(file_size)
        assert is_valid is False
        assert "exceeds maximum allowed size" in error
        assert "10MB" in error
    
    def test_zero_file_size(self):
        """Test that zero-byte files are rejected."""
        is_valid, error = FileValidator.validate_file_size(0)
        assert is_valid is False
        assert "must be greater than 0" in error
    
    def test_negative_file_size(self):
        """Test that negative file sizes are rejected."""
        is_valid, error = FileValidator.validate_file_size(-100)
        assert is_valid is False
        assert "must be greater than 0" in error


class TestPDFPageCountValidation:
    """Tests for PDF page count validation (Requirement 2.4)."""
    
    def create_pdf_with_pages(self, num_pages: int) -> bytes:
        """Helper to create a PDF with specified number of pages."""
        pdf_writer = PdfWriter()
        
        for _ in range(num_pages):
            # Create a blank page
            pdf_writer.add_blank_page(width=612, height=792)
        
        output = BytesIO()
        pdf_writer.write(output)
        return output.getvalue()
    
    def test_valid_pdf_page_count(self):
        """Test that PDFs with less than 100 pages are accepted."""
        pdf_content = self.create_pdf_with_pages(50)
        is_valid, error = FileValidator.validate_pdf_page_count(pdf_content)
        assert is_valid is True
        assert error is None
    
    def test_pdf_at_page_limit(self):
        """Test that PDFs with exactly 100 pages are accepted."""
        pdf_content = self.create_pdf_with_pages(MAX_PDF_PAGES)
        is_valid, error = FileValidator.validate_pdf_page_count(pdf_content)
        assert is_valid is True
        assert error is None
    
    def test_pdf_exceeds_page_limit(self):
        """Test that PDFs with more than 100 pages are rejected."""
        pdf_content = self.create_pdf_with_pages(101)
        is_valid, error = FileValidator.validate_pdf_page_count(pdf_content)
        assert is_valid is False
        assert "exceeds the maximum allowed" in error
        assert "101" in error
        assert str(MAX_PDF_PAGES) in error
    
    def test_single_page_pdf(self):
        """Test that single-page PDFs are accepted."""
        pdf_content = self.create_pdf_with_pages(1)
        is_valid, error = FileValidator.validate_pdf_page_count(pdf_content)
        assert is_valid is True
        assert error is None
    
    def test_corrupted_pdf(self):
        """Test that corrupted PDF files are rejected with descriptive error."""
        corrupted_content = b"This is not a valid PDF"
        is_valid, error = FileValidator.validate_pdf_page_count(corrupted_content)
        assert is_valid is False
        assert "Invalid or corrupted PDF" in error or "Error reading PDF" in error
    
    def test_empty_pdf_content(self):
        """Test that empty content is rejected."""
        is_valid, error = FileValidator.validate_pdf_page_count(b"")
        assert is_valid is False
        assert error is not None


class TestComprehensiveValidation:
    """Tests for comprehensive file validation (Requirements 2.1-2.4, 2.9)."""
    
    def test_valid_pdf_metadata_only(self):
        """Test validation of valid PDF metadata without content."""
        result = validate_file_metadata("document.pdf", 5 * 1024 * 1024)
        assert result['valid'] is True
        assert result['errors'] == []
        assert result['file_type'] == 'pdf'
    
    def test_valid_docx_metadata(self):
        """Test validation of valid DOCX metadata."""
        result = validate_file_metadata("report.docx", 3 * 1024 * 1024)
        assert result['valid'] is True
        assert result['errors'] == []
        assert result['file_type'] == 'docx'
    
    def test_valid_txt_metadata(self):
        """Test validation of valid TXT metadata."""
        result = validate_file_metadata("notes.txt", 1024 * 1024)
        assert result['valid'] is True
        assert result['errors'] == []
        assert result['file_type'] == 'txt'
    
    def test_invalid_type_and_size(self):
        """Test that multiple validation errors are collected."""
        result = validate_file_metadata("document.exe", 15 * 1024 * 1024)
        assert result['valid'] is False
        assert len(result['errors']) == 2
        assert any("Invalid file type" in err for err in result['errors'])
        assert any("exceeds maximum allowed size" in err for err in result['errors'])
    
    def test_complete_validation_with_valid_pdf(self):
        """Test complete validation with valid PDF content."""
        # Create a small PDF
        pdf_writer = PdfWriter()
        pdf_writer.add_blank_page(width=612, height=792)
        output = BytesIO()
        pdf_writer.write(output)
        pdf_content = output.getvalue()
        
        result = validate_file_complete(
            "document.pdf",
            len(pdf_content),
            pdf_content
        )
        assert result['valid'] is True
        assert result['errors'] == []
        assert result['file_type'] == 'pdf'
    
    def test_complete_validation_with_oversized_pdf(self):
        """Test that oversized PDFs are rejected."""
        # Create a small PDF but claim it's larger
        pdf_writer = PdfWriter()
        pdf_writer.add_blank_page(width=612, height=792)
        output = BytesIO()
        pdf_writer.write(output)
        pdf_content = output.getvalue()
        
        result = validate_file_complete(
            "document.pdf",
            15 * 1024 * 1024,  # Claim 15MB
            pdf_content
        )
        assert result['valid'] is False
        assert any("exceeds maximum allowed size" in err for err in result['errors'])
    
    def test_complete_validation_with_too_many_pages(self):
        """Test that PDFs with too many pages are rejected."""
        # Create a PDF with 101 pages
        pdf_writer = PdfWriter()
        for _ in range(101):
            pdf_writer.add_blank_page(width=612, height=792)
        output = BytesIO()
        pdf_writer.write(output)
        pdf_content = output.getvalue()
        
        result = validate_file_complete(
            "document.pdf",
            len(pdf_content),
            pdf_content
        )
        assert result['valid'] is False
        assert any("exceeds the maximum allowed" in err for err in result['errors'])
        assert any("101" in err for err in result['errors'])
    
    def test_descriptive_error_messages(self):
        """Test that error messages are descriptive (Requirement 2.9)."""
        # Test invalid file type
        result = validate_file_metadata("malware.exe", 1024)
        assert result['valid'] is False
        assert any(".exe" in err for err in result['errors'])
        assert any("Only" in err and "allowed" in err for err in result['errors'])
        
        # Test oversized file
        result = validate_file_metadata("large.pdf", 20 * 1024 * 1024)
        assert result['valid'] is False
        assert any("20" in err and "MB" in err for err in result['errors'])
        assert any("10MB" in err for err in result['errors'])


class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""
    
    def test_filename_with_multiple_dots(self):
        """Test files with multiple dots in the name."""
        result = validate_file_metadata("my.document.final.pdf", 1024 * 1024)
        assert result['valid'] is True
        assert result['file_type'] == 'pdf'
    
    def test_filename_with_spaces(self):
        """Test files with spaces in the name."""
        result = validate_file_metadata("my document.pdf", 1024 * 1024)
        assert result['valid'] is True
        assert result['file_type'] == 'pdf'
    
    def test_filename_with_special_characters(self):
        """Test files with special characters in the name."""
        result = validate_file_metadata("report_2024-01-15.pdf", 1024 * 1024)
        assert result['valid'] is True
        assert result['file_type'] == 'pdf'
    
    def test_very_small_file(self):
        """Test very small files (1 byte)."""
        result = validate_file_metadata("tiny.txt", 1)
        assert result['valid'] is True
    
    def test_file_size_just_under_limit(self):
        """Test file size just under the limit."""
        result = validate_file_metadata("large.pdf", MAX_FILE_SIZE_BYTES - 1)
        assert result['valid'] is True
    
    def test_file_size_just_over_limit(self):
        """Test file size just over the limit."""
        result = validate_file_metadata("large.pdf", MAX_FILE_SIZE_BYTES + 1)
        assert result['valid'] is False
        assert any("exceeds maximum allowed size" in err for err in result['errors'])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
