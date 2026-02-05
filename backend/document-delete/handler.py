"""
Lambda function to delete documents and their associated data
"""

import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

DOCUMENTS_TABLE = os.environ.get('DOCUMENTS_TABLE_NAME', 'DocumentAnalysis-Documents-dev')
RESULTS_TABLE = os.environ.get('RESULTS_TABLE_NAME', 'DocumentAnalysis-Results-dev')
DOCUMENTS_BUCKET = os.environ.get('DOCUMENTS_BUCKET_NAME', 'document-analysis-documents-520754296204-dev')
RESULTS_BUCKET = os.environ.get('RESULTS_BUCKET_NAME', 'document-analysis-results-520754296204-dev')

def lambda_handler(event, context):
    """
    Delete a document and all its associated data
    
    Expected event from API Gateway:
    {
        "pathParameters": {"documentId": "uuid"},
        "requestContext": {
            "authorizer": {
                "claims": {"sub": "user-id"}
            }
        }
    }
    """
    
    print(f"Delete document request: {json.dumps(event)}")
    
    try:
        # Extract parameters from API Gateway event
        path_params = event.get('pathParameters', {})
        document_id = path_params.get('documentId') if path_params else None
        
        # Get user ID from Cognito authorizer
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('sub')
        
        if not document_id or not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required parameters: documentId and userId'
                })
            }
        
        # 1. Get document to verify ownership and get S3 keys
        documents_table = dynamodb.Table(DOCUMENTS_TABLE)
        
        response = documents_table.get_item(
            Key={'documentId': document_id}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Document not found'
                })
            }
        
        document = response['Item']
        
        # Verify ownership
        if document.get('userId') != user_id:
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Unauthorized: You do not own this document'
                })
            }
        
        s3_key = document.get('s3Key')
        
        # 2. Delete from S3 (documents bucket)
        if s3_key:
            try:
                s3.delete_object(
                    Bucket=DOCUMENTS_BUCKET,
                    Key=s3_key
                )
                print(f"Deleted document from S3: {s3_key}")
            except Exception as e:
                print(f"Error deleting from S3: {str(e)}")
                # Continue even if S3 delete fails
        
        # 3. Delete results from S3 (results bucket)
        try:
            # Results are stored as: results/{userId}/{documentId}/analysis.json
            result_prefix = f"results/{user_id}/{document_id}/"
            
            # List all objects with this prefix
            response = s3.list_objects_v2(
                Bucket=RESULTS_BUCKET,
                Prefix=result_prefix
            )
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    s3.delete_object(
                        Bucket=RESULTS_BUCKET,
                        Key=obj['Key']
                    )
                    print(f"Deleted result from S3: {obj['Key']}")
        except Exception as e:
            print(f"Error deleting results from S3: {str(e)}")
            # Continue even if S3 delete fails
        
        # 4. Delete from AnalysisResults table
        try:
            results_table = dynamodb.Table(RESULTS_TABLE)
            results_table.delete_item(
                Key={'documentId': document_id}
            )
            print(f"Deleted analysis result from DynamoDB")
        except Exception as e:
            print(f"Error deleting from AnalysisResults table: {str(e)}")
            # Continue even if this fails
        
        # 5. Delete from Documents table
        documents_table.delete_item(
            Key={'documentId': document_id}
        )
        print(f"Deleted document from DynamoDB")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Document deleted successfully',
                'documentId': document_id
            })
        }
        
    except Exception as e:
        print(f"Error deleting document: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
