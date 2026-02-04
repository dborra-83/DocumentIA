"""
BedrockProcessor Lambda Function

Extracts text from documents and invokes Amazon Bedrock for analysis.

Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.7
"""

import json
import os
import sys
import time
from typing import Dict, Any, Tuple

import boto3
from botocore.exceptions import ClientError

# Add shared module to path
sys.path.append('/opt/python')  # Lambda layer path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from vertical_templates import get_prompt_template, validate_vertical
from text_extractor import extract_text, TextExtractionError


# Environment variables
DOCUMENTS_BUCKET_NAME = os.environ.get('DOCUMENTS_BUCKET_NAME')
RESULTS_BUCKET_NAME = os.environ.get('RESULTS_BUCKET_NAME')
DOCUMENTS_TABLE_NAME = os.environ.get('DOCUMENTS_TABLE_NAME')
RESULTS_TABLE_NAME = os.environ.get('RESULTS_TABLE_NAME')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0')
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', 'us-east-1')

# Bedrock configuration
BEDROCK_TEMPERATURE = 0.7  # Balance between creativity and consistency
BEDROCK_MAX_TOKENS = 4096  # Maximum tokens for response

# Retry configuration
MAX_RETRY_ATTEMPTS = 3  # Maximum number of retry attempts
RETRY_BASE_DELAY = 1.0  # Base delay in seconds for exponential backoff
RETRY_MAX_DELAY = 8.0  # Maximum delay in seconds between retries

# AWS clients
s3_client = boto3.client('s3')
bedrock_client = boto3.client('bedrock-runtime', region_name=BEDROCK_REGION)
dynamodb = boto3.resource('dynamodb')
dynamodb_client = boto3.client('dynamodb')


def construct_prompt(vertical: str, document_text: str) -> str:
    """
    Construct a prompt for Bedrock using the vertical template and extracted text.
    
    Args:
        vertical: The business vertical identifier (e.g., 'healthcare', 'education')
        document_text: The extracted text content from the document
        
    Returns:
        Complete prompt string ready for Bedrock API
        
    Raises:
        ValueError: If vertical is invalid or document_text is empty
        
    Requirements: 4.5
    """
    if not document_text or not document_text.strip():
        raise ValueError("Document text cannot be empty")
    
    if not validate_vertical(vertical):
        raise ValueError(f"Invalid vertical: {vertical}")
    
    # Use the vertical_templates module to construct the prompt
    prompt = get_prompt_template(vertical, document_text)
    
    return prompt


def invoke_bedrock(prompt: str) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Invoke Amazon Bedrock with Claude 3 Sonnet model with retry logic.
    
    Implements exponential backoff retry strategy:
    - 3 attempts maximum
    - Base delay: 1 second
    - Max delay: 8 seconds
    - Exponential backoff: delay = min(base * 2^attempt, max_delay)
    
    Args:
        prompt: The complete prompt to send to Bedrock
        
    Returns:
        Tuple containing:
        - Dictionary with parsed JSON response from Bedrock with keys:
          - executive_summary: str
          - key_points: List[str]
          - next_steps: List[str]
        - Dictionary with token usage:
          - input_tokens: int
          - output_tokens: int
        
    Raises:
        Exception: If Bedrock API call fails after all retries or response parsing fails
        
    Requirements: 4.6, 4.7, 15.1
    """
    # Construct the request body for Claude 3 Sonnet
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": BEDROCK_MAX_TOKENS,
        "temperature": BEDROCK_TEMPERATURE,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    last_exception = None
    
    # Retry loop with exponential backoff
    for attempt in range(MAX_RETRY_ATTEMPTS):
        try:
            # Invoke Bedrock model
            response = bedrock_client.invoke_model(
                modelId=BEDROCK_MODEL_ID,
                body=json.dumps(request_body)
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            # Extract token usage information
            usage = response_body.get('usage', {})
            token_usage = {
                'input_tokens': usage.get('input_tokens', 0),
                'output_tokens': usage.get('output_tokens', 0)
            }
            
            # Extract the text content from Claude's response
            # Claude 3 returns content in a specific format
            content = response_body.get('content', [])
            if not content:
                raise ValueError("Empty response from Bedrock")
            
            # Get the text from the first content block
            response_text = content[0].get('text', '')
            
            # Parse the JSON from the response text
            # Claude might wrap JSON in markdown code blocks or add extra text
            # Try to extract JSON if it's wrapped
            json_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if json_text.startswith('```'):
                # Find the actual JSON content between code blocks
                lines = json_text.split('\n')
                json_lines = []
                in_code_block = False
                for line in lines:
                    if line.startswith('```'):
                        in_code_block = not in_code_block
                        continue
                    if in_code_block or (not line.startswith('```')):
                        json_lines.append(line)
                json_text = '\n'.join(json_lines).strip()
            
            # Try to find JSON object if there's extra text
            if not json_text.startswith('{'):
                # Look for the first { and last }
                start_idx = json_text.find('{')
                end_idx = json_text.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_text = json_text[start_idx:end_idx + 1]
            
            analysis_result = json.loads(json_text)
            
            # Validate required fields (now in Spanish)
            required_fields = ['resumen_ejecutivo', 'puntos_clave', 'proximos_pasos']
            for field in required_fields:
                if field not in analysis_result:
                    raise ValueError(f"Missing required field in Bedrock response: {field}")
            
            # Optional fields with defaults
            if 'datos_extraidos' not in analysis_result:
                analysis_result['datos_extraidos'] = {}
            if 'metadatos' not in analysis_result:
                analysis_result['metadatos'] = {}
            
            # Success - return result and token usage
            print(f"Bedrock invocation successful on attempt {attempt + 1}")
            print(f"Token usage - Input: {token_usage['input_tokens']}, "
                  f"Output: {token_usage['output_tokens']}")
            
            return analysis_result, token_usage
            
        except json.JSONDecodeError as e:
            last_exception = ValueError(f"Failed to parse Bedrock response as JSON: {str(e)}")
            # JSON parsing errors are not transient - don't retry
            raise last_exception from e
        
        except ValueError as e:
            # ValueError for missing fields or empty response - not transient
            last_exception = e
            raise
        
        except ClientError as e:
            # AWS client errors - check if retryable
            error_code = e.response.get('Error', {}).get('Code', '')
            last_exception = e
            
            # Retryable errors: throttling, service unavailable, etc.
            retryable_errors = [
                'ThrottlingException',
                'ServiceUnavailableException',
                'InternalServerError',
                'ModelTimeoutException'
            ]
            
            if error_code not in retryable_errors:
                # Non-retryable error - fail immediately
                raise Exception(f"Bedrock API invocation failed: {str(e)}") from e
            
            # Log retry attempt
            print(f"Bedrock API error ({error_code}) on attempt {attempt + 1}/{MAX_RETRY_ATTEMPTS}")
            
            # Calculate exponential backoff delay
            if attempt < MAX_RETRY_ATTEMPTS - 1:  # Don't sleep after last attempt
                delay = min(RETRY_BASE_DELAY * (2 ** attempt), RETRY_MAX_DELAY)
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
        
        except Exception as e:
            # Unexpected errors - treat as transient and retry
            last_exception = e
            print(f"Unexpected error on attempt {attempt + 1}/{MAX_RETRY_ATTEMPTS}: {str(e)}")
            
            # Calculate exponential backoff delay
            if attempt < MAX_RETRY_ATTEMPTS - 1:  # Don't sleep after last attempt
                delay = min(RETRY_BASE_DELAY * (2 ** attempt), RETRY_MAX_DELAY)
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
    
    # All retries exhausted
    raise Exception(
        f"Bedrock API invocation failed after {MAX_RETRY_ATTEMPTS} attempts: {str(last_exception)}"
    ) from last_exception


def store_analysis_results(
    document_id: str,
    user_id: str,
    vertical: str,
    analysis_result: Dict[str, Any],
    token_usage: Dict[str, int],
    processing_time_ms: int
) -> None:
    """
    Store analysis results in DynamoDB and S3 using transactions for consistency.

    This function:
    1. Creates a record in the AnalysisResults table
    2. Uploads the complete analysis JSON to S3
    3. Updates the Documents table status to 'completed' with processing time
    4. Uses DynamoDB transactions to ensure consistency

    Args:
        document_id: Unique document identifier
        user_id: User identifier
        vertical: Business vertical
        analysis_result: Parsed analysis from Bedrock (executive_summary, key_points, next_steps)
        token_usage: Dictionary with input_tokens and output_tokens
        processing_time_ms: Processing time in milliseconds

    Raises:
        Exception: If DynamoDB transaction or S3 upload fails

    Requirements: 5.2, 5.3, 5.7
    """
    from datetime import datetime

    # Generate timestamps
    analyzed_at = datetime.utcnow().isoformat() + 'Z'
    processed_at = analyzed_at

    # Construct S3 key for result JSON
    s3_result_key = f"results/{user_id}/{document_id}/analysis.json"

    # Prepare complete result JSON for S3
    complete_result = {
        'documentId': document_id,
        'userId': user_id,
        'vertical': vertical,
        'analysis': analysis_result,
        'tokenUsage': token_usage,
        'processingTimeMs': processing_time_ms,
        'analyzedAt': analyzed_at,
        'bedrockModelId': BEDROCK_MODEL_ID
    }

    try:
        # Upload complete result JSON to S3
        print(f"Uploading analysis results to S3: {s3_result_key}")
        s3_client.put_object(
            Bucket=RESULTS_BUCKET_NAME,
            Key=s3_result_key,
            Body=json.dumps(complete_result, indent=2),
            ContentType='application/json',
            ServerSideEncryption='AES256'
        )
        print(f"Successfully uploaded results to S3")

        # Use DynamoDB transactions to ensure consistency between tables
        # Transaction items:
        # 1. Create AnalysisResults record
        # 2. Update Documents record status to 'completed'

        print(f"Executing DynamoDB transaction for document {document_id}")

        # Prepare transaction items
        transact_items = [
            {
                'Put': {
                    'TableName': RESULTS_TABLE_NAME,
                    'Item': {
                        'documentId': {'S': document_id},
                        'userId': {'S': user_id},
                        'vertical': {'S': vertical},
                        'executiveSummary': {'S': analysis_result.get('resumen_ejecutivo', '')},
                        'keyPoints': {'L': [{'S': point} for point in analysis_result.get('puntos_clave', [])]},
                        'nextSteps': {'L': [{'S': step} for step in analysis_result.get('proximos_pasos', [])]},
                        'analyzedAt': {'S': analyzed_at},
                        'bedrockModelId': {'S': BEDROCK_MODEL_ID},
                        'bedrockRequestId': {'S': 'N/A'},  # Bedrock doesn't provide request ID in response
                        'inputTokens': {'N': str(token_usage['input_tokens'])},
                        'outputTokens': {'N': str(token_usage['output_tokens'])},
                        's3ResultKey': {'S': s3_result_key},
                        # Store extracted data as JSON string
                        'extractedData': {'S': json.dumps(analysis_result.get('datos_extraidos', {}))},
                        'metadata': {'S': json.dumps(analysis_result.get('metadatos', {}))}
                    }
                }
            },
            {
                'Update': {
                    'TableName': DOCUMENTS_TABLE_NAME,
                    'Key': {
                        'documentId': {'S': document_id}
                    },
                    'UpdateExpression': 'SET #status = :status, processedAt = :processedAt, processingTimeMs = :processingTimeMs',
                    'ExpressionAttributeNames': {
                        '#status': 'status'
                    },
                    'ExpressionAttributeValues': {
                        ':status': {'S': 'completed'},
                        ':processedAt': {'S': processed_at},
                        ':processingTimeMs': {'N': str(processing_time_ms)}
                    }
                }
            }
        ]

        # Execute transaction
        dynamodb_client.transact_write_items(TransactItems=transact_items)

        print(f"Successfully stored analysis results for document {document_id}")
        print(f"AnalysisResults record created, Documents status updated to 'completed'")

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        error_message = e.response.get('Error', {}).get('Message', '')
        print(f"AWS error storing results: {error_code} - {error_message}")
        raise Exception(f"Failed to store analysis results: {error_message}") from e

    except Exception as e:
        print(f"Unexpected error storing results: {str(e)}")
        raise Exception(f"Failed to store analysis results: {str(e)}") from e


def update_document_status_failed(document_id: str, error_message: str) -> None:
    """
    Update document status to 'failed' with error message.

    Args:
        document_id: Unique document identifier
        error_message: Error message to store

    Requirements: 4.10, 15.2
    """
    from datetime import datetime

    try:
        documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)

        documents_table.update_item(
            Key={'documentId': document_id},
            UpdateExpression='SET #status = :status, errorMessage = :errorMessage, processedAt = :processedAt',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'failed',
                ':errorMessage': error_message,
                ':processedAt': datetime.utcnow().isoformat() + 'Z'
            }
        )

        print(f"Updated document {document_id} status to 'failed'")

    except Exception as e:
        print(f"Error updating document status to failed: {str(e)}")
        # Don't raise - this is a best-effort update


def update_document_status_processing(document_id: str) -> None:
    """
    Update document status to 'processing'.

    Args:
        document_id: Unique document identifier

    Requirements: 4.10
    """
    from datetime import datetime

    try:
        documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)

        documents_table.update_item(
            Key={'documentId': document_id},
            UpdateExpression='SET #status = :status, processingStartedAt = :startedAt',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'processing',
                ':startedAt': datetime.utcnow().isoformat() + 'Z'
            }
        )

        print(f"Updated document {document_id} status to 'processing'")

    except Exception as e:
        print(f"Error updating document status to processing: {str(e)}")
        # Don't raise - continue with processing


def download_document_from_s3(s3_key: str) -> bytes:
    """
    Download document from S3.

    Args:
        s3_key: S3 object key for the document

    Returns:
        Document content as bytes

    Raises:
        Exception: If S3 download fails

    Requirements: 4.1
    """
    try:
        print(f"Downloading document from S3: {s3_key}")
        response = s3_client.get_object(
            Bucket=DOCUMENTS_BUCKET_NAME,
            Key=s3_key
        )

        file_content = response['Body'].read()
        print(f"Successfully downloaded {len(file_content)} bytes from S3")

        return file_content

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        error_message = e.response.get('Error', {}).get('Message', '')
        print(f"S3 download error: {error_code} - {error_message}")
        raise Exception(f"Failed to download document from S3: {error_message}") from e

    except Exception as e:
        print(f"Unexpected error downloading from S3: {str(e)}")
        raise Exception(f"Failed to download document from S3: {str(e)}") from e


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for document processing with Bedrock.

    Complete data flow:
    1. Receive event with documentId, userId, vertical, s3Key, fileType
    2. Update Documents table status to 'processing'
    3. Download document from S3 using s3Key
    4. Extract text based on fileType (pdf, docx, txt)
    5. Construct prompt with vertical template
    6. Invoke Bedrock with retry logic
    7. Store results in DynamoDB and S3 using transactions
    8. Update status to 'completed' with processing time
    9. Return processing summary

    Args:
        event: Step Functions event with document metadata:
            - documentId: Unique document identifier
            - userId: User identifier
            - vertical: Business vertical (healthcare, education, etc.)
            - s3Key: S3 object key for the document
            - fileType: File type (pdf, docx, txt)
        context: Lambda context

    Returns:
        Processing result with status and analysis data

    Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.7
    """
    start_time = time.time()
    document_id = None

    try:
        # Extract document metadata from event
        document_id = event.get('documentId')
        user_id = event.get('userId')
        vertical = event.get('vertical')
        s3_key = event.get('s3Key')
        file_type = event.get('fileType')

        # Validate required fields
        if not document_id:
            raise ValueError("Missing documentId in event")
        if not user_id:
            raise ValueError("Missing userId in event")
        if not vertical:
            raise ValueError("Missing vertical in event")
        if not s3_key:
            raise ValueError("Missing s3Key in event")
        if not file_type:
            raise ValueError("Missing fileType in event")

        print(f"Processing document {document_id} for user {user_id}")
        print(f"Vertical: {vertical}, File type: {file_type}, S3 key: {s3_key}")

        # Step 1: Update document status to 'processing'
        update_document_status_processing(document_id)

        # Step 2: Download document from S3
        file_content = download_document_from_s3(s3_key)

        # Step 3: Extract text based on file type
        print(f"Extracting text from {file_type} document")
        try:
            document_text = extract_text(file_content, file_type)
            print(f"Successfully extracted {len(document_text)} characters")
        except TextExtractionError as e:
            raise ValueError(f"Text extraction failed: {str(e)}") from e

        if not document_text or not document_text.strip():
            raise ValueError("No text could be extracted from document")

        # Step 4: Construct prompt with vertical template and extracted text
        print(f"Constructing prompt for vertical: {vertical}")
        prompt = construct_prompt(vertical, document_text)

        # Step 5: Invoke Bedrock API with retry logic
        print(f"Invoking Bedrock with model: {BEDROCK_MODEL_ID}")
        analysis_result, token_usage = invoke_bedrock(prompt)

        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        print(f"Successfully analyzed document {document_id}")
        print(f"Total tokens used - Input: {token_usage['input_tokens']}, "
              f"Output: {token_usage['output_tokens']}")
        print(f"Processing time: {processing_time_ms}ms")

        # Step 6: Store results in DynamoDB and S3
        print(f"Storing results for document {document_id}")
        store_analysis_results(
            document_id=document_id,
            user_id=user_id,
            vertical=vertical,
            analysis_result=analysis_result,
            token_usage=token_usage,
            processing_time_ms=processing_time_ms
        )

        print(f"Document {document_id} processing completed successfully")

        # Step 7: Return processing summary
        return {
            'status': 'completed',
            'documentId': document_id,
            'userId': user_id,
            'vertical': vertical,
            'analysis': analysis_result,
            'tokenUsage': token_usage,
            'processingTimeMs': processing_time_ms,
            'message': 'Document processed successfully'
        }

    except ValueError as e:
        print(f"Validation error in BedrockProcessor: {str(e)}")
        # Update document status to failed
        if document_id:
            update_document_status_failed(document_id, str(e))
        return {
            'status': 'failed',
            'documentId': document_id,
            'error': str(e),
            'errorType': 'ValidationError'
        }
    except Exception as e:
        print(f"Error in BedrockProcessor: {str(e)}")
        # Update document status to failed
        if document_id:
            update_document_status_failed(document_id, str(e))
        return {
            'status': 'failed',
            'documentId': document_id,
            'error': str(e),
            'errorType': 'ProcessingError'
        }
