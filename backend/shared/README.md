# Shared Backend Utilities

This directory contains shared utilities used across multiple Lambda functions in the document analysis system.

## Modules

### file_validator.py

File validation module for document uploads.

**Features:**
- File type validation (PDF, DOCX, TXT only)
- File size validation (max 10MB)
- PDF page count validation (max 100 pages)
- Descriptive error messages for validation failures

**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.9

#### Usage

**Basic metadata validation (without file content):**

```python
from shared.file_validator import validate_file_metadata

# Validate file metadata before upload
result = validate_file_metadata(
    filename="document.pdf",
    file_size=5242880,  # 5MB in bytes
    mime_type="application/pdf"  # Optional
)

if result['valid']:
    print(f"File is valid: {result['file_type']}")
else:
    print(f"Validation errors: {result['errors']}")
```

**Complete validation (with file content for PDF page count):**

```python
from shared.file_validator import validate_file_complete

# Validate file with content (includes PDF page count check)
with open('document.pdf', 'rb') as f:
    file_content = f.read()

result = validate_file_complete(
    filename="document.pdf",
    file_size=len(file_content),
    file_content=file_content,
    mime_type="application/pdf"  # Optional
)

if result['valid']:
    print(f"File is valid: {result['file_type']}")
else:
    for error in result['errors']:
        print(f"Error: {error}")
```

**Individual validation functions:**

```python
from shared.file_validator import FileValidator

# Validate file type only
is_valid, error = FileValidator.validate_file_type("document.pdf")

# Validate file size only
is_valid, error = FileValidator.validate_file_size(5242880)

# Validate PDF page count only
with open('document.pdf', 'rb') as f:
    is_valid, error = FileValidator.validate_pdf_page_count(f.read())
```

#### Constants

- `MAX_FILE_SIZE_BYTES`: 10485760 (10MB)
- `MAX_PDF_PAGES`: 100
- `ALLOWED_EXTENSIONS`: {'.pdf', '.docx', '.txt'}
- `ALLOWED_MIME_TYPES`: {'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'}

#### Return Format

All validation functions return a tuple of `(is_valid: bool, error_message: Optional[str])` or a dictionary:

```python
{
    'valid': bool,           # True if all validations pass
    'errors': List[str],     # List of error messages (empty if valid)
    'file_type': str         # File extension without dot (e.g., 'pdf', 'docx', 'txt')
}
```

#### Error Messages

The module provides descriptive error messages for each validation failure:

- **Invalid file type:** "Invalid file type '.exe'. Only .docx, .pdf, .txt files are allowed"
- **File too large:** "File size (15.00MB) exceeds maximum allowed size of 10MB"
- **Too many pages:** "PDF has 150 pages, which exceeds the maximum allowed 100 pages"
- **Corrupted PDF:** "Invalid or corrupted PDF file: [error details]"
- **No extension:** "File must have an extension"

### text_extractor.py

Text extraction module for document processing.

**Features:**
- PDF text extraction using PyPDF2/pypdf
- DOCX text extraction using python-docx
- TXT text reading with encoding detection
- Robust error handling for corrupted files
- Support for encrypted PDFs
- Multi-page PDF extraction
- DOCX table text extraction

**Requirements:** 4.2, 4.3, 4.4, 4.8

#### Usage

**Basic usage:**

```python
from shared.text_extractor import extract_text, TextExtractionError

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

**Format-specific functions:**

```python
from shared.text_extractor import (
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

#### API Reference

- `extract_text(file_content: bytes, file_type: str) -> str`: Main convenience function
- `extract_text_from_pdf(file_content: bytes) -> str`: Extract from PDF files
- `extract_text_from_docx(file_content: bytes) -> str`: Extract from DOCX files
- `extract_text_from_txt(file_content: bytes) -> str`: Extract from TXT files

#### Exception Handling

All functions raise `TextExtractionError` with descriptive messages:

```python
try:
    text = extract_text(file_content, file_type)
except TextExtractionError as e:
    logger.error(f"Failed to extract text: {e}")
except ValueError as e:
    logger.error(f"Unsupported file type: {e}")
```

See [TEXT_EXTRACTOR_README.md](./TEXT_EXTRACTOR_README.md) for detailed documentation.

### vertical_templates.py

Vertical-specific templates for document analysis.

**Features:**
- 8 predefined vertical templates (Healthcare, Education, Retail, Legal, Finance, Manufacturing, HR, Technology)
- Vertical-specific analysis instructions
- Template loading and validation

**Requirements:** 3.3, 14.1-14.10

#### Usage

```python
from shared.vertical_templates import get_vertical_template, VERTICALS

# Get template for a specific vertical
template = get_vertical_template('healthcare')
print(template['name'])
print(template['instructions'])

# List all available verticals
print(VERTICALS)  # ['healthcare', 'education', 'retail', ...]
```

## Testing

Run all tests:

```bash
cd backend/shared
python -m pytest -v
```

Run tests for specific modules:

```bash
# File validator tests
python -m pytest test_file_validator.py -v

# Text extractor tests
python -m pytest test_text_extractor.py -v

# Vertical templates tests
python -m pytest test_vertical_templates.py -v
```

Run tests with coverage:

```bash
python -m pytest --cov=. --cov-report=html
```

## Dependencies

- `PyPDF2>=3.0.0` or `pypdf`: For PDF processing
- `python-docx>=1.1.0`: For DOCX processing
- `pytest>=7.4.0`: For testing
- `hypothesis>=6.92.0`: For property-based testing

## Integration

These utilities are designed to be imported by Lambda functions:

```python
# In Lambda function
from shared.file_validator import validate_file_complete
from shared.text_extractor import extract_text, TextExtractionError
from shared.vertical_templates import get_vertical_template

def lambda_handler(event, context):
    # Validate file
    validation_result = validate_file_complete(...)
    
    # Extract text
    text = extract_text(file_content, file_type)
    
    # Get template
    template = get_vertical_template(vertical)
    
    # Process...
```
