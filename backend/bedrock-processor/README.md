# BedrockProcessor Lambda Function

## Overview

The BedrockProcessor Lambda function is responsible for processing documents using Amazon Bedrock with Claude 3 Sonnet. It constructs prompts using vertical-specific templates and invokes the Bedrock API to generate intelligent analysis.

## Task 8.1 Implementation

This implementation completes **Task 8.1: Create Bedrock client and prompt construction** from the specification.

### Features Implemented

1. **Bedrock Client Initialization**
   - Initialized boto3 Bedrock runtime client
   - Configured for the specified region (default: us-east-1)
   - Model ID: `anthropic.claude-3-sonnet-20240229-v1:0`

2. **Prompt Construction**
   - `construct_prompt()` function combines vertical templates with extracted text
   - Validates vertical identifier against supported verticals
   - Validates document text is not empty
   - Uses the `vertical_templates` module for template loading

3. **Bedrock Configuration**
   - **Temperature**: 0.7 (balances creativity and consistency)
   - **Max Tokens**: 4096 (sufficient for detailed analysis)
   - **Model**: Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)

4. **Bedrock API Invocation**
   - `invoke_bedrock()` function calls Bedrock InvokeModel API
   - Constructs proper request body with Claude 3 message format
   - Parses JSON response from Claude
   - Validates required fields: executive_summary, key_points, next_steps
   - Comprehensive error handling for API failures and invalid responses

## Functions

### `construct_prompt(vertical: str, document_text: str) -> str`

Constructs a complete prompt for Bedrock using the vertical template and extracted text.

**Parameters:**
- `vertical`: Business vertical identifier (e.g., 'healthcare', 'education')
- `document_text`: Extracted text content from the document

**Returns:**
- Complete prompt string ready for Bedrock API

**Raises:**
- `ValueError`: If vertical is invalid or document_text is empty

**Requirements:** 4.5

### `invoke_bedrock(prompt: str) -> Dict[str, Any]`

Invokes Amazon Bedrock with Claude 3 Sonnet model.

**Parameters:**
- `prompt`: The complete prompt to send to Bedrock

**Returns:**
- Dictionary containing:
  - `executive_summary`: str
  - `key_points`: List[str]
  - `next_steps`: List[str]

**Raises:**
- `ValueError`: If response parsing fails or required fields are missing
- `Exception`: If Bedrock API call fails

**Requirements:** 4.6

### `lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]`

Main Lambda handler for document processing with Bedrock.

**Event Structure:**
```json
{
  "documentId": "uuid-string",
  "vertical": "healthcare",
  "documentText": "extracted text content"
}
```

**Returns:**
```json
{
  "status": "completed",
  "documentId": "uuid-string",
  "vertical": "healthcare",
  "analysis": {
    "executive_summary": "...",
    "key_points": ["...", "..."],
    "next_steps": ["...", "..."]
  },
  "message": "Document processed successfully"
}
```

## Environment Variables

- `DOCUMENTS_BUCKET_NAME`: S3 bucket for document storage
- `RESULTS_BUCKET_NAME`: S3 bucket for results storage
- `DOCUMENTS_TABLE_NAME`: DynamoDB documents table
- `RESULTS_TABLE_NAME`: DynamoDB results table
- `BEDROCK_MODEL_ID`: Bedrock model identifier (default: anthropic.claude-3-sonnet-20240229-v1:0)
- `BEDROCK_REGION`: AWS region for Bedrock (default: us-east-1)

## Dependencies

- `boto3>=1.34.0`: AWS SDK for Python
- `vertical_templates` module from shared layer

## Testing

The implementation includes comprehensive unit tests covering:

### Prompt Construction Tests
- Valid vertical with document text
- All 8 supported verticals
- Invalid vertical handling
- Empty document text handling
- Whitespace-only text handling
- Special characters in text

### Bedrock Invocation Tests
- Successful API invocation
- Missing required fields in response
- Invalid JSON response
- Empty response handling
- API error handling

### Lambda Handler Tests
- Successful execution
- Missing documentId
- Missing vertical
- Missing documentText
- Bedrock error handling

### Configuration Tests
- Model ID configuration
- Temperature configuration
- Max tokens configuration

**Run tests:**
```bash
python -m pytest backend/bedrock-processor/test_handler.py -v
```

**Test Results:** All 19 tests passing ✅

## Integration with Vertical Templates

The BedrockProcessor uses the `vertical_templates` module which provides:

- 8 industry-specific templates (Healthcare, Education, Retail, Legal, Finance, Manufacturing, HR, Technology)
- Each template includes:
  - Vertical-specific instructions
  - Focus areas
  - Key terminology
  - Analysis guidelines

The `get_prompt_template()` function from the vertical_templates module constructs the complete prompt by:
1. Validating the vertical identifier
2. Loading the appropriate template
3. Injecting vertical-specific instructions
4. Including the document text
5. Adding JSON format requirements

## Next Steps

The following tasks remain to complete the BedrockProcessor:

- **Task 8.3**: Implement Bedrock API invocation with retry logic (exponential backoff)
- **Task 9.1**: Create result persistence functions (DynamoDB and S3)
- **Task 10.1**: Wire together text extraction, Bedrock, and storage

## Requirements Validated

- ✅ **Requirement 4.5**: BedrockProcessor SHALL construct prompts using the selected vertical template
- ✅ **Requirement 4.6**: BedrockProcessor SHALL invoke Bedrock with model anthropic.claude-3-sonnet-20240229-v1:0

## Notes

- The Bedrock client is initialized at module level for Lambda container reuse
- Temperature is set to 0.7 to balance creativity with consistency
- Max tokens is set to 4096 to allow for detailed analysis
- Error handling distinguishes between validation errors and processing errors
- The implementation follows AWS Lambda best practices for Python
