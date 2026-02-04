"""
StepFunctionsTrigger Lambda Function

Triggered by S3 upload events to start Step Functions execution.
Extracts document metadata and starts the document processing workflow.

Requirements: 4.1
"""

import json
import os
from typing import Dict, Any
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

# Environment variables
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')
DOCUMENTS_TABLE_NAME = os.environ.get('DOCUMENTS_TABLE_NAME')

# AWS clients
stepfunctions_client = boto3.client('stepfunctions')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle S3 upload events and trigger Step Functions execution.
    
    Extracts document metadata from DynamoDB and starts the processing workflow.
    
    Args:
        event: S3 event notification with:
            - Records: List of S3 event records
        context: Lambda context
        
    Returns:
        Result with execution details
        
    Requirements: 4.1
    """
    try:
        print(f"Received S3 event: {json.dumps(event)}")
        
        # Process each S3 record
        executions_started = []
        
        for record in event.get('Records', []):
            # Extract S3 information
            s3_info = record.get('s3', {})
            bucket_name = s3_info.get('bucket', {}).get('name')
            s3_key = unquote_plus(s3_info.get('object', {}).get('key', ''))
            
            print(f"Processing S3 object: s3://{bucket_name}/{s3_key}")
            
            # Extract documentId from S3 key
            # Expected format: documents/{userId}/{documentId}.{extension}
            key_parts = s3_key.split('/')
            if len(key_parts) < 3 or key_parts[0] != 'documents':
                print(f"Skipping invalid S3 key format: {s3_key}")
                continue
            
            user_id = key_parts[1]
            filename_with_ext = key_parts[2]
            document_id = filename_with_ext.rsplit('.', 1)[0]
            file_extension = filename_with_ext.rsplit('.', 1)[1] if '.' in filename_with_ext else ''
            
            print(f"Extracted: userId={user_id}, documentId={document_id}, extension={file_extension}")
            
            # Retrieve document metadata from DynamoDB
            documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)
            
            try:
                response = documents_table.get_item(
                    Key={'documentId': document_id}
                )
                
                if 'Item' not in response:
                    print(f"Document {document_id} not found in DynamoDB")
                    continue
                
                document = response['Item']
                vertical = document.get('vertical')
                file_type = document.get('fileType')
                
                print(f"Retrieved document metadata: vertical={vertical}, fileType={file_type}")
                
            except ClientError as e:
                print(f"Error retrieving document from DynamoDB: {str(e)}")
                continue
            
            # Prepare Step Functions input
            execution_input = {
                'documentId': document_id,
                'userId': user_id,
                'vertical': vertical,
                's3Key': s3_key,
                'fileType': file_type,
            }
            
            # Start Step Functions execution
            try:
                execution_name = f"doc-{document_id}-{context.aws_request_id[:8]}"
                
                response = stepfunctions_client.start_execution(
                    stateMachineArn=STATE_MACHINE_ARN,
                    name=execution_name,
                    input=json.dumps(execution_input)
                )
                
                execution_arn = response['executionArn']
                print(f"Started Step Functions execution: {execution_arn}")
                
                executions_started.append({
                    'documentId': document_id,
                    'executionArn': execution_arn,
                    'executionName': execution_name,
                })
                
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                error_message = e.response.get('Error', {}).get('Message', '')
                print(f"Error starting Step Functions execution: {error_code} - {error_message}")
                continue
        
        print(f"Successfully started {len(executions_started)} Step Functions executions")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Started {len(executions_started)} executions',
                'executions': executions_started,
            })
        }
        
    except Exception as e:
        print(f"Unexpected error in StepFunctionsTrigger: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
            })
        }
