# Text Extraction Utilities

This module provides utilities for extracting text from various document formats used in the document analysis system.

## Overview

The `text_extractor.py` module supports text extraction from:
- **PDF files** - Using PyPDF2/pypdf library
- **DOCX files** - Using python-docx library
- **TXT files** - Using standard Python file reading with encoding detection

## Features

- ✅ Robust error handling for corrupted files
- ✅ Support for encrypted PDFs (with empty password)
- ✅ Multi-page PDF extraction
- ✅ DOCX table text extraction
- ✅ UTF-8 and Latin-1 encoding support for TXT files
- ✅ Detailed logging for debugging
- ✅ Custom exception types for better error handling

## Usage

### Basic Usage

```python
from text_extractor import extract_text

# Read file content
with open('document.pdf', 'rb') as f:
    file_content = f.read()

# Extract text based on file type
try:
    text = extract_text(file_content, 'pdf')
    print(f"Extracted {len(text)} characters")
except TextExtractionError as e:
    print(f"Extraction failed: {e}")
```

### Format-Specific Functions

```python
from text_extractor import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt
)

# PDF extraction
pdf_text = extract_text_from_pdf(pdf_bytes)

# DOCX extraction
docx_text = extract_text_from_docx(docx_bytes)

# TXT extraction
txt_text = extract_text_from_txt(txt_bytes)
```

## API Reference

### `extract_text(file_content: bytes, file_type: str) -> str`

Main convenience function that routes to the appropriate extraction function.

**Parameters:**
- `file_content` (bytes): Raw bytes of the file
- `file_type` (str): File type ('pdf', 'docx', 'doc', or 'txt')

**Returns:**
- `str`: Extracted text content

**Raises:**
- `TextExtractionError`: If extraction fails
- `ValueError`: If file type is not supported

### `extract_text_from_pdf(file_content: bytes) -> str`

Extract text from PDF files.

**Features:**
- Handles encrypted PDFs (attempts decryption with empty password)
- Extracts text from all pages
- Continues extraction even if some pages fail
- Validates that PDF has pages and extractable text

**Parameters:**
- `file_content` (bytes): Raw bytes of the PDF file

**Returns:**
- `str`: Extracted text with pages separated by double newlines

**Raises:**
- `TextExtractionError`: If PDF is corrupted, has no pages, or no text can be extracted

### `extract_text_from_docx(file_content: bytes) -> str`

Extract text from DOCX files.

**Features:**
- Extracts text from paragraphs
- Extracts text from tables
- Filters out empty paragraphs and cells

**Parameters:**
- `file_content` (bytes): Raw bytes of the DOCX file

**Returns:**
- `str`: Extracted text with paragraphs separated by double newlines

**Raises:**
- `TextExtractionError`: If DOCX is corrupted or contains no text

### `extract_text_from_txt(file_content: bytes) -> str`

Extract text from TXT files.

**Features:**
- Attempts UTF-8 decoding first
- Falls back to Latin-1 if UTF-8 fails
- Validates that file is not empty

**Parameters:**
- `file_content` (bytes): Raw bytes of the TXT file

**Returns:**
- `str`: Decoded text content

**Raises:**
- `TextExtractionError`: If file is empty or cannot be decoded

## Error Handling

All extraction functions raise `TextExtractionError` with descriptive messages:

```python
from text_extractor import extract_text, TextExtractionError

try:
    text = extract_text(file_content, file_type)
except TextExtractionError as e:
    # Handle extraction error
    logger.error(f"Failed to extract text: {e}")
    # Provide user-friendly error message
except ValueError as e:
    # Handle unsupported file type
    logger.error(f"Unsupported file type: {e}")
```

## Testing

The module includes comprehensive unit tests covering:
- Valid file extraction for all formats
- Multi-page PDFs
- Encrypted PDFs
- DOCX files with tables
- Empty files
- Corrupted files
- Encoding edge cases
- Error scenarios

Run tests:
```bash
cd backend/shared
python -m pytest test_text_extractor.py -v
```

## Dependencies

- `PyPDF2>=3.0.0` or `pypdf` (for PDF extraction)
- `python-docx>=1.1.0` (for DOCX extraction)
- Standard library: `io`, `logging`

## Integration with BedrockProcessor

This module is designed to be used by the BedrockProcessor Lambda function:

```python
from text_extractor import extract_text, TextExtractionError

def process_document(s3_key, file_type):
    # Download from S3
    file_content = s3_client.get_object(Bucket=bucket, Key=s3_key)['Body'].read()
    
    # Extract text
    try:
        text = extract_text(file_content, file_type)
    except TextExtractionError as e:
        # Update document status to 'failed'
        update_document_status(document_id, 'failed', str(e))
        raise
    
    # Continue with Bedrock processing...
```

## Logging

The module uses Python's standard logging module. Configure logging in your application:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

Log messages include:
- Info: Successful extraction with character count
- Warning: Encrypted PDFs, page extraction failures, encoding fallbacks
- Error: Extraction failures (via exceptions)

## Performance Considerations

- **PDF**: Extraction time scales with number of pages and complexity
- **DOCX**: Generally fast, even for large documents
- **TXT**: Very fast, limited by file size and encoding detection

For large files (>5MB), consider:
- Implementing timeout mechanisms
- Processing in chunks if possible
- Monitoring memory usage

## Future Enhancements

Potential improvements:
- Support for more formats (RTF, ODT, etc.)
- OCR support for scanned PDFs
- Text cleaning and normalization options
- Streaming extraction for very large files
- Parallel page extraction for PDFs
- Better handling of complex PDF layouts

## Requirements Validation

This module satisfies the following requirements:
- **Requirement 4.2**: Extract text from PDF documents
- **Requirement 4.3**: Extract text from DOCX documents
- **Requirement 4.4**: Read text from TXT documents
- **Requirement 4.8**: Handle text extraction failures with error logging
