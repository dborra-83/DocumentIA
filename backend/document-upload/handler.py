"""
DocumentUploadHandler Lambda Function

Generates presigned URLs for S3 uploads and creates document records in DynamoDB.

Requirements: 2.5, 2.6
"""

import json
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import logging

import boto3
from botocore.exceptions import ClientError

# Note: We don't use the shared file_validator here because it has dependencies (PyPDF2)
# that we don't need for basic metadata validation. The actual file validation
# happens in the BedrockProcessor after the file is uploaded to S3.

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
DOCUMENTS_BUCKET_NAME = os.environ.get('DOCUMENTS_BUCKET_NAME')
DOCUMENTS_TABLE_NAME = os.environ.get('DOCUMENTS_TABLE_NAME')
PRESIGNED_URL_EXPIRATION = int(os.environ.get('PRESIGNED_URL_EXPIRATION', '900'))

# AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Allowed verticals
ALLOWED_VERTICALS = ['healthcare', 'education', 'retail', 'legal', 'finance', 'manufacturing', 'hr', 'technology']


def extract_user_id_from_event(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract userId from JWT claims in API Gateway authorizer context.
    
    Args:
        event: API Gateway event
        
    Returns:
        User ID string or None if not found
    """
    try:
        # API Gateway authorizer puts claims in requestContext.authorizer.claims
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        
        # Try different possible claim names for user ID
        user_id = claims.get('sub') or claims.get('cognito:username') or claims.get('username')
        
        if user_id:
            logger.info(f"Extracted userId: {user_id}")
            return user_id
        else:
            logger.warning("No userId found in JWT claims")
            return None
            
    except Exception as e:
        logger.error(f"Error extracting userId from event: {str(e)}")
        return None


def validate_file_metadata(file_name: str, file_type: str, file_size: int, vertical: str) -> Optional[str]:
    """
    Validate file metadata (basic validation only - no file content inspection).
    
    Args:
        file_name: Name of the file
        file_type: File extension (pdf, docx, txt)
        file_size: File size in bytes
        vertical: Business vertical
        
    Returns:
        Error message if validation fails, None if valid
        
    Requirements: 2.1, 2.2, 2.3, 2.9
    """
    # Validate file name
    if not file_name or not isinstance(file_name, str) or len(file_name.strip()) == 0:
        return "File name is required and must be a non-empty string"
    
    # Validate vertical
    if not vertical or vertical.lower() not in ALLOWED_VERTICALS:
        return f"Vertical must be one of: {', '.join(ALLOWED_VERTICALS)}"
    
    # Validate file type
    allowed_types = ['pdf', 'docx', 'txt']
    if not file_type or file_type.lower() not in allowed_types:
        return f"File type must be one of: {', '.join(allowed_types)}"
    
    # Validate file size (max 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    if not isinstance(file_size, (int, float)) or file_size <= 0:
        return "File size must be a positive number"
    
    if file_size > MAX_FILE_SIZE:
        size_mb = file_size / (1024 * 1024)
        return f"File size ({size_mb:.2f}MB) exceeds maximum allowed size of 10MB"
    
    return None


def generate_presigned_url(bucket_name: str, object_key: str, expiration: int, content_type: str = 'application/octet-stream') -> Optional[str]:
    """
    Generate presigned S3 URL for upload.
    
    Args:
        bucket_name: S3 bucket name
        object_key: S3 object key
        expiration: URL expiration time in seconds
        content_type: Content-Type header for the upload
        
    Returns:
        Presigned URL string or None if generation fails
    """
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_key,
                'ContentType': content_type,
            },
            ExpiresIn=expiration
        )
        logger.info(f"Generated presigned URL for key: {object_key}")
        return presigned_url
        
    except ClientError as e:
        logger.error(f"Error generating presigned URL: {str(e)}")
        return None


def create_document_record(
    table_name: str,
    document_id: str,
    user_id: str,
    file_name: str,
    file_size: int,
    file_type: str,
    vertical: str,
    s3_key: str
) -> bool:
    """
    Create document record in DynamoDB.
    
    Args:
        table_name: DynamoDB table name
        document_id: Unique document ID
        user_id: User ID from JWT
        file_name: Original file name
        file_size: File size in bytes
        file_type: File extension
        vertical: Business vertical
        s3_key: S3 object key
        
    Returns:
        True if successful, False otherwise
    """
    try:
        table = dynamodb.Table(table_name)
        
        timestamp = datetime.now(timezone.utc).isoformat()
        
        item = {
            'documentId': document_id,
            'userId': user_id,
            'fileName': file_name,
            'fileSize': file_size,
            'fileType': file_type.lower(),
            'vertical': vertical.lower(),
            's3Key': s3_key,
            'status': 'pending',
            'uploadedAt': timestamp,
        }
        
        table.put_item(Item=item)
        logger.info(f"Created document record for documentId: {document_id}")
        return True
        
    except ClientError as e:
        logger.error(f"Error creating document record in DynamoDB: {str(e)}")
        return False


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for document upload.
    
    Args:
        event: API Gateway event with request body containing fileName, fileType, fileSize, vertical
        context: Lambda context
        
    Returns:
        API Gateway response with presigned URL and document ID
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # 1. Extract userId from JWT claims
        user_id = extract_user_id_from_event(event)
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Unauthorized: Invalid or missing authentication token'
                })
            }
        
        # 2. Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Invalid JSON in request body'
                })
            }
        
        file_name = body.get('fileName')
        file_type = body.get('fileType')
        file_size = body.get('fileSize')
        vertical = body.get('vertical')
        
        # 3. Validate file metadata
        validation_error = validate_file_metadata(file_name, file_type, file_size, vertical)
        if validation_error:
            logger.warning(f"Validation error: {validation_error}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': validation_error
                })
            }
        
        # 4. Generate unique documentId
        document_id = str(uuid.uuid4())
        logger.info(f"Generated documentId: {document_id}")
        
        # 5. Create S3 object key
        s3_key = f"documents/{user_id}/{document_id}.{file_type.lower()}"
        
        # 6. Determine Content-Type based on file type
        content_type_map = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
        }
        content_type = content_type_map.get(file_type.lower(), 'application/octet-stream')
        
        # 7. Generate presigned S3 URL
        presigned_url = generate_presigned_url(
            DOCUMENTS_BUCKET_NAME,
            s3_key,
            PRESIGNED_URL_EXPIRATION,
            content_type
        )
        
        if not presigned_url:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Failed to generate presigned URL'
                })
            }
        
        # 8. Create document record in DynamoDB
        success = create_document_record(
            DOCUMENTS_TABLE_NAME,
            document_id,
            user_id,
            file_name,
            file_size,
            file_type,
            vertical,
            s3_key
        )
        
        if not success:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Failed to create document record'
                })
            }
        
        # 9. Return success response
        logger.info(f"Successfully processed upload request for documentId: {document_id}")
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'documentId': document_id,
                'expiresIn': PRESIGNED_URL_EXPIRATION
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in DocumentUploadHandler: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
