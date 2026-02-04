"""
HistoryManager Lambda Handler

This Lambda function handles document history queries for authenticated users.
It supports pagination, filtering by vertical and date range, and search by document name.

Requirements: 7.1, 7.2, 7.5, 7.6, 7.7
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key, Attr

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
DOCUMENTS_TABLE_NAME = os.environ['DOCUMENTS_TABLE_NAME']
RESULTS_TABLE_NAME = os.environ['RESULTS_TABLE_NAME']

# Get table references
documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)
results_table = dynamodb.Table(RESULTS_TABLE_NAME)


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder for DynamoDB Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for document history queries
    
    Supports two operations:
    1. List documents with pagination and filters (GET /documents)
    2. Get single document by ID (GET /documents/{documentId})
    
    Args:
        event: API Gateway event with query parameters and path parameters
        context: Lambda context object
        
    Returns:
        API Gateway response with document list or single document
    """
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters') or {}
        
        # Extract userId from JWT claims (set by API Gateway authorizer)
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('sub') or claims.get('cognito:username')
        
        if not user_id:
            logger.error("No userId found in JWT claims")
            return {
                'statusCode': 401,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Unauthorized - No user ID in token'})
            }
        
        logger.info(f"Processing request for user: {user_id}, method: {http_method}, path: {path}")
        
        # Route to appropriate handler
        if 'documentId' in path_parameters:
            # GET /documents/{documentId}
            document_id = path_parameters['documentId']
            return get_document_by_id(user_id, document_id)
        else:
            # GET /documents with query parameters
            query_params = event.get('queryStringParameters') or {}
            return list_documents(user_id, query_params)
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Internal server error'})
        }


def list_documents(user_id: str, query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List documents for a user with pagination and filters
    
    Query parameters:
    - page: Page number (default: 1)
    - pageSize: Items per page (default: 20, max: 100)
    - vertical: Filter by vertical (optional)
    - dateFrom: Filter by start date ISO format (optional)
    - dateTo: Filter by end date ISO format (optional)
    - search: Search by document name case-insensitive (optional)
    
    Requirements: 7.1, 7.2, 7.5, 7.6, 7.7
    """
    try:
        # Parse query parameters
        page = int(query_params.get('page', '1'))
        page_size = min(int(query_params.get('pageSize', '20')), 100)
        vertical = query_params.get('vertical')
        date_from = query_params.get('dateFrom')
        date_to = query_params.get('dateTo')
        search = query_params.get('search', '').lower()
        
        logger.info(f"Listing documents for user {user_id}: page={page}, pageSize={page_size}, "
                   f"vertical={vertical}, dateFrom={date_from}, dateTo={date_to}, search={search}")
        
        # Query DynamoDB using UserIdIndex GSI
        # The GSI has userId as partition key and uploadedAt as sort key
        query_kwargs = {
            'IndexName': 'UserIdIndex',
            'KeyConditionExpression': Key('userId').eq(user_id),
            'ScanIndexForward': False,  # Sort descending (newest first)
            'Limit': page_size * page  # Get enough items to support pagination
        }
        
        # Build filter expression
        filter_expressions = []
        
        if vertical:
            filter_expressions.append(Attr('vertical').eq(vertical))
        
        if date_from:
            filter_expressions.append(Attr('uploadedAt').gte(date_from))
        
        if date_to:
            filter_expressions.append(Attr('uploadedAt').lte(date_to))
        
        if search:
            # Case-insensitive search on fileName
            filter_expressions.append(Attr('fileName').contains(search))
        
        # Combine filter expressions
        if filter_expressions:
            combined_filter = filter_expressions[0]
            for expr in filter_expressions[1:]:
                combined_filter = combined_filter & expr
            query_kwargs['FilterExpression'] = combined_filter
        
        # Execute query
        response = documents_table.query(**query_kwargs)
        items = response.get('Items', [])
        
        # Calculate pagination
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_items = items[start_index:end_index]
        
        # Get total count (approximate for filtered queries)
        total_count = len(items)
        has_more = len(items) >= (page_size * page)
        
        # Format response
        documents = []
        for item in paginated_items:
            documents.append({
                'documentId': item['documentId'],
                'fileName': item['fileName'],
                'fileSize': int(item.get('fileSize', 0)),
                'fileType': item.get('fileType', ''),
                'vertical': item.get('vertical', ''),
                'status': item.get('status', 'pending'),
                'uploadedAt': item['uploadedAt'],
                'processingTimeMs': int(item.get('processingTimeMs', 0)) if 'processingTimeMs' in item else None
            })
        
        result = {
            'documents': documents,
            'pagination': {
                'page': page,
                'pageSize': page_size,
                'totalCount': total_count,
                'hasMore': has_more
            }
        }
        
        logger.info(f"Returning {len(documents)} documents for user {user_id}")
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps(result, cls=DecimalEncoder)
        }
        
    except ValueError as e:
        logger.error(f"Invalid query parameter: {str(e)}")
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': f'Invalid query parameter: {str(e)}'})
        }
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to list documents'})
        }


def get_document_by_id(user_id: str, document_id: str) -> Dict[str, Any]:
    """
    Get a single document by ID with its analysis results
    
    Requirements: 7.4
    """
    try:
        logger.info(f"Getting document {document_id} for user {user_id}")
        
        # Get document from Documents table
        doc_response = documents_table.get_item(
            Key={'documentId': document_id}
        )
        
        if 'Item' not in doc_response:
            logger.warning(f"Document {document_id} not found")
            return {
                'statusCode': 404,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Document not found'})
            }
        
        document = doc_response['Item']
        
        # Verify document belongs to user
        if document.get('userId') != user_id:
            logger.warning(f"User {user_id} attempted to access document {document_id} owned by {document.get('userId')}")
            return {
                'statusCode': 403,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Access denied'})
            }
        
        # Get analysis results if document is completed
        analysis = None
        if document.get('status') == 'completed':
            try:
                results_response = results_table.get_item(
                    Key={'documentId': document_id}
                )
                if 'Item' in results_response:
                    result_item = results_response['Item']
                    analysis = {
                        'executiveSummary': result_item.get('executiveSummary', ''),
                        'keyPoints': result_item.get('keyPoints', []),
                        'nextSteps': result_item.get('nextSteps', []),
                        'analyzedAt': result_item.get('analyzedAt', ''),
                        'inputTokens': int(result_item.get('inputTokens', 0)),
                        'outputTokens': int(result_item.get('outputTokens', 0))
                    }
            except Exception as e:
                logger.error(f"Error fetching analysis results: {str(e)}")
                # Continue without analysis results
        
        # Format response
        result = {
            'documentId': document['documentId'],
            'fileName': document['fileName'],
            'fileSize': int(document.get('fileSize', 0)),
            'fileType': document.get('fileType', ''),
            'vertical': document.get('vertical', ''),
            'status': document.get('status', 'pending'),
            'uploadedAt': document['uploadedAt'],
            'processingTimeMs': int(document.get('processingTimeMs', 0)) if 'processingTimeMs' in document else None,
            'analysis': analysis
        }
        
        logger.info(f"Successfully retrieved document {document_id}")
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps(result, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error getting document: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to get document'})
        }


def get_cors_headers() -> Dict[str, str]:
    """Get CORS headers for API responses"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  # Configure with actual frontend domain in production
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    }
