"""
Unit tests for BedrockProcessor Lambda handler.

Tests the Bedrock client initialization, prompt construction, and API invocation.

Requirements: 4.5, 4.6
"""

import json
import os
import sys
import pytest
from unittest.mock import patch, MagicMock, Mock

# Add shared module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

# Import handler functions
from handler import (
    construct_prompt,
    invoke_bedrock,
    lambda_handler,
    store_analysis_results,
    update_document_status_failed,
    update_document_status_processing,
    download_document_from_s3,
    BEDROCK_MODEL_ID,
    BEDROCK_TEMPERATURE,
    BEDROCK_MAX_TOKENS
)


class TestPromptConstruction:
    """Test suite for prompt construction functionality."""
    
    def test_construct_prompt_with_valid_vertical(self):
        """Test prompt construction with a valid vertical."""
        vertical = "healthcare"
        document_text = "Patient report with medical information."
        
        prompt = construct_prompt(vertical, document_text)
        
        # Verify prompt contains the document text
        assert document_text in prompt
        
        # Verify prompt contains vertical-specific content
        assert "healthcare" in prompt.lower() or "patient" in prompt.lower()
        
        # Verify prompt contains JSON format instructions
        assert "JSON" in prompt or "json" in prompt
        assert "executive_summary" in prompt
        assert "key_points" in prompt
        assert "next_steps" in prompt
    
    def test_construct_prompt_with_all_verticals(self):
        """Test prompt construction works for all 8 verticals."""
        verticals = [
            "healthcare", "education", "retail", "legal",
            "finance", "manufacturing", "hr", "technology"
        ]
        document_text = "Sample document content for testing."
        
        for vertical in verticals:
            prompt = construct_prompt(vertical, document_text)
            
            # Each prompt should contain the document text
            assert document_text in prompt
            
            # Each prompt should have JSON format instructions
            assert "executive_summary" in prompt
            assert "key_points" in prompt
            assert "next_steps" in prompt
    
    def test_construct_prompt_with_invalid_vertical(self):
        """Test prompt construction fails with invalid vertical."""
        vertical = "invalid_vertical"
        document_text = "Sample document content."
        
        with pytest.raises(ValueError) as exc_info:
            construct_prompt(vertical, document_text)
        
        assert "Invalid vertical" in str(exc_info.value)
    
    def test_construct_prompt_with_empty_text(self):
        """Test prompt construction fails with empty document text."""
        vertical = "healthcare"
        document_text = ""
        
        with pytest.raises(ValueError) as exc_info:
            construct_prompt(vertical, document_text)
        
        assert "empty" in str(exc_info.value).lower()
    
    def test_construct_prompt_with_whitespace_only_text(self):
        """Test prompt construction fails with whitespace-only text."""
        vertical = "healthcare"
        document_text = "   \n\t  "
        
        with pytest.raises(ValueError) as exc_info:
            construct_prompt(vertical, document_text)
        
        assert "empty" in str(exc_info.value).lower()
    
    def test_construct_prompt_with_special_characters(self):
        """Test prompt construction handles special characters."""
        vertical = "legal"
        document_text = "Contract with special chars: $100, 50%, & more!"
        
        prompt = construct_prompt(vertical, document_text)
        
        # Verify special characters are preserved
        assert "$100" in prompt
        assert "50%" in prompt
        assert "&" in prompt


class TestBedrockInvocation:
    """Test suite for Bedrock API invocation."""
    
    @patch('handler.bedrock_client')
    def test_invoke_bedrock_success(self, mock_bedrock_client):
        """Test successful Bedrock API invocation."""
        # Mock Bedrock response
        mock_response = {
            'body': MagicMock()
        }
        
        # Claude 3 response format with token usage
        bedrock_response_body = {
            'content': [
                {
                    'text': json.dumps({
                        'executive_summary': 'This is a test summary.',
                        'key_points': ['Point 1', 'Point 2', 'Point 3'],
                        'next_steps': ['Step 1', 'Step 2']
                    })
                }
            ],
            'usage': {
                'input_tokens': 150,
                'output_tokens': 75
            }
        }
        
        mock_response['body'].read.return_value = json.dumps(bedrock_response_body)
        mock_bedrock_client.invoke_model.return_value = mock_response
        
        # Test invocation
        prompt = "Test prompt for analysis"
        result, token_usage = invoke_bedrock(prompt)
        
        # Verify result structure
        assert 'executive_summary' in result
        assert 'key_points' in result
        assert 'next_steps' in result
        
        # Verify result content
        assert result['executive_summary'] == 'This is a test summary.'
        assert len(result['key_points']) == 3
        assert len(result['next_steps']) == 2
        
        # Verify token usage
        assert 'input_tokens' in token_usage
        assert 'output_tokens' in token_usage
        assert token_usage['input_tokens'] == 150
        assert token_usage['output_tokens'] == 75
        
        # Verify Bedrock was called with correct parameters
        mock_bedrock_client.invoke_model.assert_called_once()
        call_args = mock_bedrock_client.invoke_model.call_args
        
        assert call_args[1]['modelId'] == BEDROCK_MODEL_ID
        
        # Verify request body structure
        request_body = json.loads(call_args[1]['body'])
        assert request_body['max_tokens'] == BEDROCK_MAX_TOKENS
        assert request_body['temperature'] == BEDROCK_TEMPERATURE
        assert request_body['messages'][0]['role'] == 'user'
        assert request_body['messages'][0]['content'] == prompt
    
    @patch('handler.bedrock_client')
    def test_invoke_bedrock_with_missing_fields(self, mock_bedrock_client):
        """Test Bedrock invocation fails when response is missing required fields."""
        # Mock Bedrock response with missing fields
        mock_response = {
            'body': MagicMock()
        }
        
        bedrock_response_body = {
            'content': [
                {
                    'text': json.dumps({
                        'executive_summary': 'Summary only, missing other fields'
                    })
                }
            ],
            'usage': {
                'input_tokens': 100,
                'output_tokens': 50
            }
        }
        
        mock_response['body'].read.return_value = json.dumps(bedrock_response_body)
        mock_bedrock_client.invoke_model.return_value = mock_response
        
        # Test invocation should fail
        prompt = "Test prompt"
        
        with pytest.raises(ValueError) as exc_info:
            invoke_bedrock(prompt)
        
        assert "Missing required field" in str(exc_info.value)
    
    @patch('handler.bedrock_client')
    def test_invoke_bedrock_with_invalid_json(self, mock_bedrock_client):
        """Test Bedrock invocation fails when response is not valid JSON."""
        # Mock Bedrock response with invalid JSON
        mock_response = {
            'body': MagicMock()
        }
        
        bedrock_response_body = {
            'content': [
                {
                    'text': 'This is not valid JSON'
                }
            ],
            'usage': {
                'input_tokens': 100,
                'output_tokens': 50
            }
        }
        
        mock_response['body'].read.return_value = json.dumps(bedrock_response_body)
        mock_bedrock_client.invoke_model.return_value = mock_response
        
        # Test invocation should fail
        prompt = "Test prompt"
        
        with pytest.raises(ValueError) as exc_info:
            invoke_bedrock(prompt)
        
        assert "parse" in str(exc_info.value).lower()
    
    @patch('handler.bedrock_client')
    def test_invoke_bedrock_with_empty_response(self, mock_bedrock_client):
        """Test Bedrock invocation fails when response is empty."""
        # Mock Bedrock response with empty content
        mock_response = {
            'body': MagicMock()
        }
        
        bedrock_response_body = {
            'content': [],
            'usage': {
                'input_tokens': 100,
                'output_tokens': 0
            }
        }
        
        mock_response['body'].read.return_value = json.dumps(bedrock_response_body)
        mock_bedrock_client.invoke_model.return_value = mock_response
        
        # Test invocation should fail
        prompt = "Test prompt"
        
        with pytest.raises(ValueError) as exc_info:
            invoke_bedrock(prompt)
        
        assert "Empty response" in str(exc_info.value)
    
    @patch('handler.bedrock_client')
    def test_invoke_bedrock_api_error(self, mock_bedrock_client):
        """Test Bedrock invocation handles API errors."""
        # Mock Bedrock API error
        mock_bedrock_client.invoke_model.side_effect = Exception("Bedrock API error")
        
        # Test invocation should fail
        prompt = "Test prompt"
        
        with pytest.raises(Exception) as exc_info:
            invoke_bedrock(prompt)
        
        assert "Bedrock API invocation failed" in str(exc_info.value)


class TestRetryLogic:
    """Test suite for retry logic with exponential backoff."""
    
    @patch('handler.time.sleep')
    @patch('handler.bedrock_client')
    def test_retry_on_throttling_exception(self, mock_bedrock_client, mock_sleep):
        """Test retry logic on ThrottlingException."""
        from botocore.exceptions import ClientError
        
        # Mock Bedrock response - fail twice, then succeed
        mock_response = {
            'body': MagicMock()
        }
        
        bedrock_response_body = {
            'content': [
                {
                    'text': json.dumps({
                        'executive_summary': 'Success after retries',
                        'key_points': ['Point 1'],
                        'next_steps': ['Step 1']
                    })
                }
            ],
            'usage': {
                'input_tokens': 100,
                'output_tokens': 50
            }
        }
        
        mock_response['body'].read.return_value = json.dumps(bedrock_response_body)
        
        # First two calls raise ThrottlingException, third succeeds
        throttling_error = ClientError(
            {'Error': {'Code': 'ThrottlingException', 'Message': 'Rate exceeded'}},
            'InvokeModel'
        )
        
        mock_bedrock_client.invoke_model.side_effect = [
            throttling_error,
            throttling_error,
            mock_response
        ]
        
        # Test invocation
        prompt = "Test prompt"
        result, token_usage = invoke_bedrock(prompt)
        
        # Verify success after retries
        assert result['executive_summary'] == 'Success after retries'
        assert token_usage['input_tokens'] == 100
        
        # Verify retry attempts
        assert mock_bedrock_client.invoke_model.call_count == 3
        
        # Verify exponential backoff delays
        # First retry: 1 second, Second retry: 2 seconds
        assert mock_sleep.call_count == 2
        assert mock_sleep.call_args_list[0][0][0] == 1.0  # First delay
        assert mock_sleep.call_args_list[1][0][0] == 2.0  # Second delay
    
    @patch('handler.time.sleep')
    @patch('handler.bedrock_client')
    def test_retry_exhausted_after_max_attempts(self, mock_bedrock_client, mock_sleep):
        """Test that retry logic exhausts after max attempts."""
        from botocore.exceptions import ClientError
        
        # Mock Bedrock to always fail with throttling
        throttling_error = ClientError(
            {'Error': {'Code': 'ThrottlingException', 'Message': 'Rate exceeded'}},
            'InvokeModel'
        )
        
        mock_bedrock_client.invoke_model.side_effect = throttling_error
        
        # Test invocation should fail after all retries
        prompt = "Test prompt"
        
        with pytest.raises(Exception) as exc_info:
            invoke_bedrock(prompt)
        
        assert "failed after 3 attempts" in str(exc_info.value)
        
        # Verify all attempts were made
        assert mock_bedrock_client.invoke_model.call_count == 3
        
        # Verify exponential backoff delays (2 sleeps for 3 attempts)
        assert mock_sleep.call_count == 2
    
    @patch('handler.time.sleep')
    @patch('handler.bedrock_client')
    def test_exponential_backoff_max_delay(self, mock_bedrock_client, mock_sleep):
        """Test that exponential backoff respects max delay."""
        from botocore.exceptions import ClientError
        
        # Mock Bedrock to fail with service unavailable
        service_error = ClientError(
            {'Error': {'Code': 'ServiceUnavailableException', 'Message': 'Service unavailable'}},
            'InvokeModel'
        )
        
        mock_bedrock_client.invoke_model.side_effect = service_error
        
        # Test invocation
        prompt = "Test prompt"
        
        with pytest.raises(Exception):
            invoke_bedrock(prompt)
        
        # Verify delays don't exceed max delay (8 seconds)
        # Delays should be: 1s, 2s (both under 8s max)
        for call in mock_sleep.call_args_list:
            delay = call[0][0]
            assert delay <= 8.0
    
    @patch('handler.bedrock_client')
    def test_no_retry_on_non_retryable_error(self, mock_bedrock_client):
        """Test that non-retryable errors fail immediately without retry."""
        from botocore.exceptions import ClientError
        
        # Mock Bedrock to fail with validation error (non-retryable)
        validation_error = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Invalid request'}},
            'InvokeModel'
        )
        
        mock_bedrock_client.invoke_model.side_effect = validation_error
        
        # Test invocation should fail immediately
        prompt = "Test prompt"
        
        with pytest.raises(Exception) as exc_info:
            invoke_bedrock(prompt)
        
        assert "Bedrock API invocation failed" in str(exc_info.value)
        
        # Verify only one attempt was made (no retries)
        assert mock_bedrock_client.invoke_model.call_count == 1
    
    @patch('handler.bedrock_client')
    def test_no_retry_on_json_parse_error(self, mock_bedrock_client):
        """Test that JSON parse errors fail immediately without retry."""
        # Mock Bedrock response with invalid JSON
        mock_response = {
            'body': MagicMock()
        }
        
        bedrock_response_body = {
            'content': [
                {
                    'text': 'Not valid JSON'
                }
            ],
            'usage': {
                'input_tokens': 100,
                'output_tokens': 50
            }
        }
        
        mock_response['body'].read.return_value = json.dumps(bedrock_response_body)
        mock_bedrock_client.invoke_model.return_value = mock_response
        
        # Test invocation should fail immediately
        prompt = "Test prompt"
        
        with pytest.raises(ValueError) as exc_info:
            invoke_bedrock(prompt)
        
        assert "parse" in str(exc_info.value).lower()
        
        # Verify only one attempt was made (no retries for parse errors)
        assert mock_bedrock_client.invoke_model.call_count == 1
    
    @patch('handler.bedrock_client')
    def test_token_usage_with_missing_usage_field(self, mock_bedrock_client):
        """Test that token usage defaults to 0 when usage field is missing."""
        # Mock Bedrock response without usage field
        mock_response = {
            'body': MagicMock()
        }
        
        bedrock_response_body = {
            'content': [
                {
                    'text': json.dumps({
                        'executive_summary': 'Test summary',
                        'key_points': ['Point 1'],
                        'next_steps': ['Step 1']
                    })
                }
            ]
            # No 'usage' field
        }
        
        mock_response['body'].read.return_value = json.dumps(bedrock_response_body)
        mock_bedrock_client.invoke_model.return_value = mock_response
        
        # Test invocation
        prompt = "Test prompt"
        result, token_usage = invoke_bedrock(prompt)
        
        # Verify token usage defaults to 0
        assert token_usage['input_tokens'] == 0
        assert token_usage['output_tokens'] == 0
        
        # Verify result is still valid
        assert result['executive_summary'] == 'Test summary'


class TestLambdaHandler:
    """Test suite for Lambda handler function."""
    
    @patch('handler.store_analysis_results')
    @patch('handler.invoke_bedrock')
    @patch('handler.construct_prompt')
    @patch('handler.extract_text')
    @patch('handler.download_document_from_s3')
    @patch('handler.update_document_status_processing')
    def test_lambda_handler_success(
        self, mock_update_processing, mock_download, mock_extract,
        mock_construct_prompt, mock_invoke_bedrock, mock_store_results
    ):
        """Test successful Lambda handler execution with new event structure."""
        # Mock event with s3Key and fileType
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            's3Key': 'documents/user-456/test-doc-123.pdf',
            'fileType': 'pdf'
        }

        # Mock S3 download
        mock_download.return_value = b'PDF file content'

        # Mock text extraction
        mock_extract.return_value = 'Patient medical report content.'

        # Mock prompt construction
        mock_construct_prompt.return_value = "Mocked prompt"

        # Mock Bedrock response with token usage
        mock_invoke_bedrock.return_value = (
            {
                'executive_summary': 'Test summary',
                'key_points': ['Point 1', 'Point 2'],
                'next_steps': ['Step 1', 'Step 2']
            },
            {
                'input_tokens': 150,
                'output_tokens': 75
            }
        )

        # Execute handler
        result = lambda_handler(event, None)

        # Verify result
        assert result['status'] == 'completed'
        assert result['documentId'] == 'test-doc-123'
        assert result['vertical'] == 'healthcare'
        assert 'analysis' in result
        assert result['analysis']['executive_summary'] == 'Test summary'
        assert 'tokenUsage' in result
        assert result['tokenUsage']['input_tokens'] == 150
        assert result['tokenUsage']['output_tokens'] == 75

        # Verify functions were called
        mock_update_processing.assert_called_once_with('test-doc-123')
        mock_download.assert_called_once_with('documents/user-456/test-doc-123.pdf')
        mock_extract.assert_called_once_with(b'PDF file content', 'pdf')
        mock_construct_prompt.assert_called_once_with('healthcare', 'Patient medical report content.')
        mock_invoke_bedrock.assert_called_once_with("Mocked prompt")
    
    def test_lambda_handler_missing_document_id(self):
        """Test Lambda handler fails when documentId is missing."""
        event = {
            'vertical': 'healthcare',
            'documentText': 'Some text'
        }
        
        result = lambda_handler(event, None)
        
        assert result['status'] == 'failed'
        assert 'documentid' in result['error'].lower()
        assert result['errorType'] == 'ValidationError'
    
    def test_lambda_handler_missing_vertical(self):
        """Test Lambda handler fails when vertical is missing."""
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'documentText': 'Some text'
        }
        
        result = lambda_handler(event, None)
        
        assert result['status'] == 'failed'
        assert 'vertical' in result['error'].lower()
        assert result['errorType'] == 'ValidationError'
    
    def test_lambda_handler_missing_document_text(self):
        """Test Lambda handler fails when s3Key is missing (replaces documentText test)."""
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            'fileType': 'pdf'
            # Missing s3Key
        }
        
        result = lambda_handler(event, None)
        
        assert result['status'] == 'failed'
        assert 's3key' in result['error'].lower()
        assert result['errorType'] == 'ValidationError'
    
    @patch('handler.invoke_bedrock')
    @patch('handler.construct_prompt')
    @patch('handler.extract_text')
    @patch('handler.download_document_from_s3')
    @patch('handler.update_document_status_processing')
    def test_lambda_handler_bedrock_error(
        self, mock_update_processing, mock_download, mock_extract,
        mock_construct_prompt, mock_invoke_bedrock
    ):
        """Test Lambda handler handles Bedrock errors."""
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            's3Key': 'documents/user-456/test-doc-123.pdf',
            'fileType': 'pdf'
        }

        # Mock S3 download
        mock_download.return_value = b'PDF content'

        # Mock text extraction
        mock_extract.return_value = 'Patient medical report content.'

        mock_construct_prompt.return_value = "Mocked prompt"
        mock_invoke_bedrock.side_effect = Exception("Bedrock API error")
        
        result = lambda_handler(event, None)
        
        assert result['status'] == 'failed'
        assert 'error' in result
        assert result['errorType'] == 'ProcessingError'


class TestBedrockConfiguration:
    """Test suite for Bedrock configuration."""
    
    def test_bedrock_model_id_configured(self):
        """Test that Bedrock model ID is correctly configured."""
        assert BEDROCK_MODEL_ID == 'anthropic.claude-3-sonnet-20240229-v1:0'
    
    def test_bedrock_temperature_configured(self):
        """Test that Bedrock temperature is appropriately set."""
        assert 0.0 <= BEDROCK_TEMPERATURE <= 1.0
        assert BEDROCK_TEMPERATURE == 0.7
    
    def test_bedrock_max_tokens_configured(self):
        """Test that Bedrock max tokens is appropriately set."""
        assert BEDROCK_MAX_TOKENS > 0
        assert BEDROCK_MAX_TOKENS == 4096


if __name__ == '__main__':
    pytest.main([__file__, '-v'])


class TestResultPersistence:
    """Test suite for result persistence functions."""

    @patch('handler.dynamodb_client')
    @patch('handler.s3_client')
    def test_store_analysis_results_success(self, mock_s3_client, mock_dynamodb_client):
        """Test successful storage of analysis results."""
        from handler import store_analysis_results

        # Test data
        document_id = 'test-doc-123'
        user_id = 'user-456'
        vertical = 'healthcare'
        analysis_result = {
            'executive_summary': 'Test summary',
            'key_points': ['Point 1', 'Point 2'],
            'next_steps': ['Step 1', 'Step 2']
        }
        token_usage = {
            'input_tokens': 150,
            'output_tokens': 75
        }
        processing_time_ms = 1500

        # Execute function
        store_analysis_results(
            document_id=document_id,
            user_id=user_id,
            vertical=vertical,
            analysis_result=analysis_result,
            token_usage=token_usage,
            processing_time_ms=processing_time_ms
        )

        # Verify S3 upload was called
        mock_s3_client.put_object.assert_called_once()
        s3_call_args = mock_s3_client.put_object.call_args[1]
        assert s3_call_args['Bucket'] == os.environ.get('RESULTS_BUCKET_NAME')
        assert f'results/{user_id}/{document_id}/analysis.json' in s3_call_args['Key']
        assert s3_call_args['ContentType'] == 'application/json'
        assert s3_call_args['ServerSideEncryption'] == 'AES256'

        # Verify S3 body contains expected data
        s3_body = json.loads(s3_call_args['Body'])
        assert s3_body['documentId'] == document_id
        assert s3_body['userId'] == user_id
        assert s3_body['vertical'] == vertical
        assert s3_body['analysis'] == analysis_result
        assert s3_body['tokenUsage'] == token_usage
        assert s3_body['processingTimeMs'] == processing_time_ms

        # Verify DynamoDB transaction was called
        mock_dynamodb_client.transact_write_items.assert_called_once()
        transaction_call_args = mock_dynamodb_client.transact_write_items.call_args[1]
        transact_items = transaction_call_args['TransactItems']

        # Verify transaction has 2 items (Put and Update)
        assert len(transact_items) == 2

        # Verify AnalysisResults Put operation
        put_item = transact_items[0]['Put']
        assert put_item['TableName'] == os.environ.get('RESULTS_TABLE_NAME')
        assert put_item['Item']['documentId']['S'] == document_id
        assert put_item['Item']['userId']['S'] == user_id
        assert put_item['Item']['vertical']['S'] == vertical
        assert put_item['Item']['executiveSummary']['S'] == 'Test summary'
        assert len(put_item['Item']['keyPoints']['L']) == 2
        assert len(put_item['Item']['nextSteps']['L']) == 2
        assert put_item['Item']['inputTokens']['N'] == '150'
        assert put_item['Item']['outputTokens']['N'] == '75'

        # Verify Documents Update operation
        update_item = transact_items[1]['Update']
        assert update_item['TableName'] == os.environ.get('DOCUMENTS_TABLE_NAME')
        assert update_item['Key']['documentId']['S'] == document_id
        assert update_item['ExpressionAttributeValues'][':status']['S'] == 'completed'
        assert update_item['ExpressionAttributeValues'][':processingTimeMs']['N'] == '1500'

    @patch('handler.dynamodb_client')
    @patch('handler.s3_client')
    def test_store_analysis_results_s3_failure(self, mock_s3_client, mock_dynamodb_client):
        """Test that S3 upload failure raises exception."""
        from handler import store_analysis_results
        from botocore.exceptions import ClientError

        # Mock S3 to fail
        mock_s3_client.put_object.side_effect = ClientError(
            {'Error': {'Code': 'InternalError', 'Message': 'S3 error'}},
            'PutObject'
        )

        # Test data
        document_id = 'test-doc-123'
        user_id = 'user-456'
        vertical = 'healthcare'
        analysis_result = {
            'executive_summary': 'Test summary',
            'key_points': ['Point 1'],
            'next_steps': ['Step 1']
        }
        token_usage = {'input_tokens': 100, 'output_tokens': 50}
        processing_time_ms = 1000

        # Execute function - should raise exception
        with pytest.raises(Exception) as exc_info:
            store_analysis_results(
                document_id=document_id,
                user_id=user_id,
                vertical=vertical,
                analysis_result=analysis_result,
                token_usage=token_usage,
                processing_time_ms=processing_time_ms
            )

        assert "Failed to store analysis results" in str(exc_info.value)

        # Verify DynamoDB transaction was NOT called (S3 failed first)
        mock_dynamodb_client.transact_write_items.assert_not_called()

    @patch('handler.dynamodb_client')
    @patch('handler.s3_client')
    def test_store_analysis_results_dynamodb_failure(self, mock_s3_client, mock_dynamodb_client):
        """Test that DynamoDB transaction failure raises exception."""
        from handler import store_analysis_results
        from botocore.exceptions import ClientError

        # Mock DynamoDB to fail
        mock_dynamodb_client.transact_write_items.side_effect = ClientError(
            {'Error': {'Code': 'TransactionCanceledException', 'Message': 'Transaction failed'}},
            'TransactWriteItems'
        )

        # Test data
        document_id = 'test-doc-123'
        user_id = 'user-456'
        vertical = 'healthcare'
        analysis_result = {
            'executive_summary': 'Test summary',
            'key_points': ['Point 1'],
            'next_steps': ['Step 1']
        }
        token_usage = {'input_tokens': 100, 'output_tokens': 50}
        processing_time_ms = 1000

        # Execute function - should raise exception
        with pytest.raises(Exception) as exc_info:
            store_analysis_results(
                document_id=document_id,
                user_id=user_id,
                vertical=vertical,
                analysis_result=analysis_result,
                token_usage=token_usage,
                processing_time_ms=processing_time_ms
            )

        assert "Failed to store analysis results" in str(exc_info.value)

        # Verify S3 upload was called (succeeded before DynamoDB)
        mock_s3_client.put_object.assert_called_once()

    @patch('handler.dynamodb')
    def test_update_document_status_failed(self, mock_dynamodb):
        """Test updating document status to failed."""
        from handler import update_document_status_failed

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Test data
        document_id = 'test-doc-123'
        error_message = 'Processing failed due to invalid format'

        # Execute function
        update_document_status_failed(document_id, error_message)

        # Verify table was accessed
        mock_dynamodb.Table.assert_called_once_with(os.environ.get('DOCUMENTS_TABLE_NAME'))

        # Verify update_item was called
        mock_table.update_item.assert_called_once()
        call_args = mock_table.update_item.call_args[1]

        # Verify update parameters
        assert call_args['Key']['documentId'] == document_id
        assert call_args['ExpressionAttributeValues'][':status'] == 'failed'
        assert call_args['ExpressionAttributeValues'][':errorMessage'] == error_message
        assert ':processedAt' in call_args['ExpressionAttributeValues']

    @patch('handler.dynamodb')
    def test_update_document_status_failed_handles_error(self, mock_dynamodb):
        """Test that update_document_status_failed handles errors gracefully."""
        from handler import update_document_status_failed

        # Mock DynamoDB table to fail
        mock_table = MagicMock()
        mock_table.update_item.side_effect = Exception("DynamoDB error")
        mock_dynamodb.Table.return_value = mock_table

        # Test data
        document_id = 'test-doc-123'
        error_message = 'Processing failed'

        # Execute function - should not raise exception
        try:
            update_document_status_failed(document_id, error_message)
        except Exception:
            pytest.fail("update_document_status_failed should not raise exceptions")

    @patch('handler.update_document_status_processing')
    @patch('handler.download_document_from_s3')
    @patch('handler.extract_text')
    @patch('handler.construct_prompt')
    @patch('handler.invoke_bedrock')
    @patch('handler.update_document_status_failed')
    def test_lambda_handler_calls_update_status_on_error(
        self, mock_update_status, mock_invoke_bedrock, mock_construct_prompt,
        mock_extract, mock_download, mock_update_processing
    ):
        """Test that lambda_handler updates document status on error."""
        # Mock event
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            's3Key': 'documents/user-456/test-doc-123.pdf',
            'fileType': 'pdf'
        }

        # Mock S3 download
        mock_download.return_value = b'PDF content'

        # Mock text extraction
        mock_extract.return_value = 'Patient medical report content.'

        # Mock prompt construction
        mock_construct_prompt.return_value = "Mocked prompt"

        # Mock Bedrock to fail
        mock_invoke_bedrock.side_effect = Exception("Bedrock API error")

        # Execute handler
        result = lambda_handler(event, None)

        # Verify result indicates failure
        assert result['status'] == 'failed'
        assert result['errorType'] == 'ProcessingError'

        # Verify update_document_status_failed was called
        mock_update_status.assert_called_once_with('test-doc-123', 'Bedrock API error')

    @patch('handler.update_document_status_failed')
    def test_lambda_handler_updates_status_on_validation_error(self, mock_update_status):
        """Test that lambda_handler updates document status on validation error."""
        # Mock event with missing userId
        event = {
            'documentId': 'test-doc-123',
            'vertical': 'healthcare',
            'documentText': 'Some text'
        }

        # Execute handler
        result = lambda_handler(event, None)

        # Verify result indicates failure
        assert result['status'] == 'failed'
        assert result['errorType'] == 'ValidationError'

        # Verify update_document_status_failed was called
        mock_update_status.assert_called_once()
        call_args = mock_update_status.call_args[0]
        assert call_args[0] == 'test-doc-123'
        assert 'userid' in call_args[1].lower()



class TestS3Download:
    """Test suite for S3 download functionality."""

    @patch('handler.s3_client')
    def test_download_document_from_s3_success(self, mock_s3_client):
        """Test successful document download from S3."""
        # Mock S3 response
        mock_response = {
            'Body': Mock()
        }
        file_content = b'PDF file content bytes'
        mock_response['Body'].read.return_value = file_content
        mock_s3_client.get_object.return_value = mock_response

        # Test download
        s3_key = 'documents/user-456/test-doc-123.pdf'
        result = download_document_from_s3(s3_key)

        # Verify result
        assert result == file_content

        # Verify S3 was called correctly
        mock_s3_client.get_object.assert_called_once()
        call_args = mock_s3_client.get_object.call_args[1]
        assert call_args['Bucket'] == os.environ.get('DOCUMENTS_BUCKET_NAME')
        assert call_args['Key'] == s3_key

    @patch('handler.s3_client')
    def test_download_document_from_s3_not_found(self, mock_s3_client):
        """Test S3 download when document not found."""
        from botocore.exceptions import ClientError

        # Mock S3 to return NoSuchKey error
        mock_s3_client.get_object.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchKey', 'Message': 'The specified key does not exist'}},
            'GetObject'
        )

        # Test download should fail
        s3_key = 'documents/user-456/nonexistent.pdf'

        with pytest.raises(Exception) as exc_info:
            download_document_from_s3(s3_key)

        assert "Failed to download document from S3" in str(exc_info.value)


class TestDocumentStatusUpdates:
    """Test suite for document status update functions."""

    @patch('handler.dynamodb')
    def test_update_document_status_processing(self, mock_dynamodb):
        """Test updating document status to processing."""
        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Test data
        document_id = 'test-doc-123'

        # Execute function
        update_document_status_processing(document_id)

        # Verify table was accessed
        mock_dynamodb.Table.assert_called_once_with(os.environ.get('DOCUMENTS_TABLE_NAME'))

        # Verify update_item was called
        mock_table.update_item.assert_called_once()
        call_args = mock_table.update_item.call_args[1]

        # Verify update parameters
        assert call_args['Key']['documentId'] == document_id
        assert call_args['ExpressionAttributeValues'][':status'] == 'processing'
        assert ':startedAt' in call_args['ExpressionAttributeValues']

    @patch('handler.dynamodb')
    def test_update_document_status_processing_handles_error(self, mock_dynamodb):
        """Test that update_document_status_processing handles errors gracefully."""
        # Mock DynamoDB table to fail
        mock_table = MagicMock()
        mock_table.update_item.side_effect = Exception("DynamoDB error")
        mock_dynamodb.Table.return_value = mock_table

        # Test data
        document_id = 'test-doc-123'

        # Execute function - should not raise exception
        try:
            update_document_status_processing(document_id)
        except Exception:
            pytest.fail("update_document_status_processing should not raise exceptions")


class TestIntegratedLambdaHandler:
    """Test suite for integrated Lambda handler with S3 and text extraction."""

    @patch('handler.store_analysis_results')
    @patch('handler.invoke_bedrock')
    @patch('handler.construct_prompt')
    @patch('handler.extract_text')
    @patch('handler.download_document_from_s3')
    @patch('handler.update_document_status_processing')
    def test_lambda_handler_with_s3_and_extraction(
        self, mock_update_processing, mock_download, mock_extract,
        mock_construct_prompt, mock_invoke_bedrock, mock_store_results
    ):
        """Test Lambda handler with complete S3 download and text extraction flow."""
        # Mock event with s3Key and fileType
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            's3Key': 'documents/user-456/test-doc-123.pdf',
            'fileType': 'pdf'
        }

        # Mock S3 download
        mock_download.return_value = b'PDF file content bytes'

        # Mock text extraction
        mock_extract.return_value = 'Extracted patient medical report content.'

        # Mock prompt construction
        mock_construct_prompt.return_value = "Mocked prompt"

        # Mock Bedrock response
        mock_invoke_bedrock.return_value = (
            {
                'executive_summary': 'Test summary',
                'key_points': ['Point 1', 'Point 2'],
                'next_steps': ['Step 1', 'Step 2']
            },
            {
                'input_tokens': 150,
                'output_tokens': 75
            }
        )

        # Execute handler
        result = lambda_handler(event, None)

        # Verify result
        assert result['status'] == 'completed'
        assert result['documentId'] == 'test-doc-123'
        assert result['userId'] == 'user-456'
        assert result['vertical'] == 'healthcare'

        # Verify functions were called in correct order
        mock_update_processing.assert_called_once_with('test-doc-123')
        mock_download.assert_called_once_with('documents/user-456/test-doc-123.pdf')
        mock_extract.assert_called_once_with(b'PDF file content bytes', 'pdf')
        mock_construct_prompt.assert_called_once_with('healthcare', 'Extracted patient medical report content.')
        mock_invoke_bedrock.assert_called_once()
        mock_store_results.assert_called_once()

    @patch('handler.update_document_status_failed')
    @patch('handler.download_document_from_s3')
    @patch('handler.update_document_status_processing')
    def test_lambda_handler_s3_download_failure(
        self, mock_update_processing, mock_download, mock_update_failed
    ):
        """Test Lambda handler handles S3 download failures."""
        # Mock event
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            's3Key': 'documents/user-456/test-doc-123.pdf',
            'fileType': 'pdf'
        }

        # Mock S3 download to fail
        mock_download.side_effect = Exception("S3 download failed")

        # Execute handler
        result = lambda_handler(event, None)

        # Verify result indicates failure
        assert result['status'] == 'failed'
        assert result['errorType'] == 'ProcessingError'

        # Verify status was updated to processing before failure
        mock_update_processing.assert_called_once_with('test-doc-123')

        # Verify status was updated to failed
        mock_update_failed.assert_called_once()

    @patch('handler.update_document_status_failed')
    @patch('handler.extract_text')
    @patch('handler.download_document_from_s3')
    @patch('handler.update_document_status_processing')
    def test_lambda_handler_text_extraction_failure(
        self, mock_update_processing, mock_download, mock_extract, mock_update_failed
    ):
        """Test Lambda handler handles text extraction failures."""
        from handler import TextExtractionError

        # Mock event
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            's3Key': 'documents/user-456/test-doc-123.pdf',
            'fileType': 'pdf'
        }

        # Mock S3 download success
        mock_download.return_value = b'Corrupted PDF bytes'

        # Mock text extraction to fail
        mock_extract.side_effect = TextExtractionError("Failed to extract text from corrupted PDF")

        # Execute handler
        result = lambda_handler(event, None)

        # Verify result indicates failure
        assert result['status'] == 'failed'
        assert result['errorType'] == 'ValidationError'
        assert 'extraction' in result['error'].lower()

        # Verify status was updated to failed
        mock_update_failed.assert_called_once()

    def test_lambda_handler_missing_s3_key(self):
        """Test Lambda handler fails when s3Key is missing."""
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            'fileType': 'pdf'
            # Missing s3Key
        }

        result = lambda_handler(event, None)

        assert result['status'] == 'failed'
        assert 's3key' in result['error'].lower()
        assert result['errorType'] == 'ValidationError'

    def test_lambda_handler_missing_file_type(self):
        """Test Lambda handler fails when fileType is missing."""
        event = {
            'documentId': 'test-doc-123',
            'userId': 'user-456',
            'vertical': 'healthcare',
            's3Key': 'documents/user-456/test-doc-123.pdf'
            # Missing fileType
        }

        result = lambda_handler(event, None)

        assert result['status'] == 'failed'
        assert 'filetype' in result['error'].lower()
        assert result['errorType'] == 'ValidationError'
