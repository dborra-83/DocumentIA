"""
ErrorHandler Lambda Function

Handles errors from the document processing workflow.
Updates document status to 'failed' and logs error details.

Requirements: 15.2, 15.9
"""

import json
import os
from typing import Dict, Any
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

# Environment variables
DOCUMENTS_TABLE_NAME = os.environ.get('DOCUMENTS_TABLE_NAME')

# AWS clients
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle errors from document processing workflow.
    
    Updates the document status to 'failed' and stores error information.
    
    Args:
        event: Error event from Step Functions with:
            - documentId: Unique document identifier
            - userId: User identifier
            - error: Error message
            - errorType: Type of error (ValidationError, ProcessingError, etc.)
        context: Lambda context
        
    Returns:
        Result with status and error details
        
    Requirements: 15.2, 15.9
    """
    try:
        # Extract error information from event
        document_id = event.get('documentId')
        user_id = event.get('userId')
        error_message = event.get('error', 'Unknown error')
        error_type = event.get('errorType', 'UnknownError')
        
        print(f"Handling error for document {document_id}")
        print(f"Error type: {error_type}")
        print(f"Error message: {error_message}")
        
        if not document_id:
            print("Warning: No documentId provided in error event")
            return {
                'status': 'error_handled',
                'message': 'No documentId provided',
            }
        
        # Update document status to 'failed'
        documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)
        
        update_expression = 'SET #status = :status, errorMessage = :errorMessage, errorType = :errorType, processedAt = :processedAt'
        expression_attribute_names = {
            '#status': 'status'
        }
        expression_attribute_values = {
            ':status': 'failed',
            ':errorMessage': error_message,
            ':errorType': error_type,
            ':processedAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        documents_table.update_item(
            Key={'documentId': document_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        print(f"Successfully updated document {document_id} status to 'failed'")
        
        return {
            'status': 'error_handled',
            'documentId': document_id,
            'userId': user_id,
            'errorType': error_type,
            'errorMessage': error_message,
            'message': 'Error handled successfully',
        }
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        error_msg = e.response.get('Error', {}).get('Message', '')
        print(f"DynamoDB error in ErrorHandler: {error_code} - {error_msg}")
        
        return {
            'status': 'error_handler_failed',
            'error': f"Failed to update document status: {error_msg}",
        }
        
    except Exception as e:
        print(f"Unexpected error in ErrorHandler: {str(e)}")
        
        return {
            'status': 'error_handler_failed',
            'error': str(e),
        }
