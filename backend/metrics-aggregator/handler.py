"""
MetricsAggregator Lambda Handler

This Lambda function calculates and aggregates user metrics from document processing data.
It queries the Documents table to calculate:
- Total documents count
- Documents by vertical
- Average processing time
- Favorite vertical (most used)
- Documents by date for time-series data

The aggregated metrics are stored in the UserMetrics table for fast retrieval.

Requirements: 6.1, 6.2, 6.3, 6.7
"""

import json
import os
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional
from collections import defaultdict, Counter

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
DOCUMENTS_TABLE_NAME = os.environ.get('DOCUMENTS_TABLE_NAME', 'DocumentAnalysis-Documents-dev')
METRICS_TABLE_NAME = os.environ.get('METRICS_TABLE_NAME', 'DocumentAnalysis-Metrics-dev')

# Get table references
documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)
metrics_table = dynamodb.Table(METRICS_TABLE_NAME)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal types to JSON-serializable types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def validate_jwt_token(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract and validate userId from JWT token in API Gateway authorizer context.
    
    Args:
        event: Lambda event from API Gateway
        
    Returns:
        userId if valid, None otherwise
    """
    try:
        # Extract userId from authorizer context
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        user_id = authorizer.get('claims', {}).get('sub')
        
        if not user_id:
            # Fallback: try to get from cognito:username
            user_id = authorizer.get('claims', {}).get('cognito:username')
        
        if not user_id:
            logger.error("No userId found in JWT token")
            return None
            
        logger.info(f"Validated userId: {user_id}")
        return user_id
        
    except Exception as e:
        logger.error(f"Error validating JWT token: {str(e)}")
        return None


def query_user_documents(user_id: str) -> List[Dict[str, Any]]:
    """
    Query all documents for a user from the Documents table using the UserIdIndex GSI.
    
    Args:
        user_id: User ID to query documents for
        
    Returns:
        List of document records
    """
    try:
        logger.info(f"Querying documents for user: {user_id}")
        
        documents = []
        last_evaluated_key = None
        
        # Paginate through all results
        while True:
            query_params = {
                'IndexName': 'UserIdIndex',
                'KeyConditionExpression': Key('userId').eq(user_id),
            }
            
            if last_evaluated_key:
                query_params['ExclusiveStartKey'] = last_evaluated_key
            
            response = documents_table.query(**query_params)
            documents.extend(response.get('Items', []))
            
            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break
        
        logger.info(f"Found {len(documents)} documents for user {user_id}")
        return documents
        
    except ClientError as e:
        logger.error(f"DynamoDB error querying documents: {e.response['Error']['Message']}")
        raise
    except Exception as e:
        logger.error(f"Error querying user documents: {str(e)}")
        raise


def calculate_metrics(documents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate aggregated metrics from document list.
    
    Args:
        documents: List of document records
        
    Returns:
        Dictionary containing calculated metrics
    """
    try:
        # Initialize metrics
        total_documents = len(documents)
        documents_by_vertical = defaultdict(int)
        processing_times = []
        documents_by_date = defaultdict(int)
        
        # Process each document
        for doc in documents:
            # Count by vertical
            vertical = doc.get('vertical', 'unknown')
            documents_by_vertical[vertical] += 1
            
            # Collect processing times (only for completed documents)
            if doc.get('status') == 'completed' and doc.get('processingTimeMs'):
                processing_time = float(doc.get('processingTimeMs', 0))
                processing_times.append(processing_time)
            
            # Group by date
            uploaded_at = doc.get('uploadedAt', '')
            if uploaded_at:
                # Extract date (YYYY-MM-DD) from ISO timestamp
                date_str = uploaded_at.split('T')[0]
                documents_by_date[date_str] += 1
        
        # Calculate average processing time
        average_processing_time = 0
        if processing_times:
            average_processing_time = sum(processing_times) / len(processing_times)
        
        # Determine favorite vertical (most used)
        favorite_vertical = None
        if documents_by_vertical:
            favorite_vertical = max(documents_by_vertical.items(), key=lambda x: x[1])[0]
        
        # Convert defaultdicts to regular dicts for JSON serialization
        metrics = {
            'totalDocuments': total_documents,
            'documentsByVertical': dict(documents_by_vertical),
            'averageProcessingTimeMs': round(average_processing_time, 2),
            'favoriteVertical': favorite_vertical,
            'documentsByDate': dict(documents_by_date),
            'completedDocuments': len(processing_times),
        }
        
        logger.info(f"Calculated metrics: {json.dumps(metrics, cls=DecimalEncoder)}")
        return metrics
        
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        raise


def store_metrics(user_id: str, metrics: Dict[str, Any]) -> None:
    """
    Store aggregated metrics in the UserMetrics table.
    
    Args:
        user_id: User ID
        metrics: Calculated metrics dictionary
    """
    try:
        # Get current date for metric date
        metric_date = datetime.utcnow().strftime('%Y-%m-%d')
        timestamp = datetime.utcnow().isoformat()
        
        # Prepare item for DynamoDB
        item = {
            'userId': user_id,
            'metricDate': metric_date,
            'totalDocuments': metrics['totalDocuments'],
            'documentsByVertical': metrics['documentsByVertical'],
            'averageProcessingTimeMs': Decimal(str(metrics['averageProcessingTimeMs'])),
            'favoriteVertical': metrics.get('favoriteVertical', 'none'),
            'completedDocuments': metrics['completedDocuments'],
            'lastUpdated': timestamp,
        }
        
        # Store in DynamoDB
        metrics_table.put_item(Item=item)
        
        logger.info(f"Stored metrics for user {user_id} on date {metric_date}")
        
    except ClientError as e:
        logger.error(f"DynamoDB error storing metrics: {e.response['Error']['Message']}")
        raise
    except Exception as e:
        logger.error(f"Error storing metrics: {str(e)}")
        raise


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for MetricsAggregator.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with metrics
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Validate JWT token and extract userId
        user_id = validate_jwt_token(event)
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': 'Unauthorized',
                    'message': 'Invalid or missing authentication token'
                })
            }
        
        # Query all documents for the user
        documents = query_user_documents(user_id)
        
        # Calculate metrics
        metrics = calculate_metrics(documents)
        
        # Store metrics in DynamoDB
        store_metrics(user_id, metrics)
        
        # Return metrics
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'userId': user_id,
                'metrics': metrics,
                'calculatedAt': datetime.utcnow().isoformat()
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': 'Failed to calculate metrics'
            })
        }
