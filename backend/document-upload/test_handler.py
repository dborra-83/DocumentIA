"""
Unit tests for DocumentUploadHandler Lambda function.

Tests cover:
- JWT token validation and userId extraction
- File metadata validation
- Presigned URL generation
- DynamoDB document record creation
- Error handling scenarios
"""

import json
import os
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Set environment variables before importing handler
os.environ['DOCUMENTS_BUCKET_NAME'] = 'test-documents-bucket'
os.environ['DOCUMENTS_TABLE_NAME'] = 'test-documents-table'
os.environ['PRESIGNED_URL_EXPIRATION'] = '900'

from handler import (
    lambda_handler,
    extract_user_id_from_event,
    validate_file_metadata,
    generate_presigned_url,
    create_document_record,
    ALLOWED_VERTICALS
)


class TestExtractUserId:
    """Tests for extract_user_id_from_event function."""
    
    def test_extract_user_id_from_sub_claim(self):
        """Test extracting userId from 'sub' claim."""
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-123'
                    }
                }
            }
        }
        user_id = extract_user_id_from_event(event)
        assert user_id == 'user-123'
    
    def test_extract_user_id_from_cognito_username(self):
        """Test extracting userId from 'cognito:username' claim."""
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'cognito:username': 'user-456'
                    }
                }
            }
        }
        user_id = extract_user_id_from_event(event)
        assert user_id == 'user-456'
    
    def test_extract_user_id_from_username(self):
        """Test extracting userId from 'username' claim."""
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'username': 'user-789'
                    }
                }
            }
        }
        user_id = extract_user_id_from_event(event)
        assert user_id == 'user-789'
    
    def test_extract_user_id_missing_claims(self):
        """Test handling missing claims."""
        event = {
            'requestContext': {
                'authorizer': {}
            }
        }
        user_id = extract_user_id_from_event(event)
        assert user_id is None
    
    def test_extract_user_id_empty_event(self):
        """Test handling empty event."""
        event = {}
        user_id = extract_user_id_from_event(event)
        assert user_id is None


class TestValidateFileMetadata:
    """Tests for validate_file_metadata function."""
    
    def test_valid_pdf_file(self):
        """Test validation passes for valid PDF file."""
        error = validate_file_metadata('document.pdf', 'pdf', 5000000, 'healthcare')
        assert error is None
    
    def test_valid_docx_file(self):
        """Test validation passes for valid DOCX file."""
        error = validate_file_metadata('report.docx', 'docx', 3000000, 'finance')
        assert error is None
    
    def test_valid_txt_file(self):
        """Test validation passes for valid TXT file."""
        error = validate_file_metadata('notes.txt', 'txt', 1000000, 'legal')
        assert error is None
    
    def test_invalid_file_type(self):
        """Test validation fails for invalid file type."""
        error = validate_file_metadata('image.jpg', 'jpg', 5000000, 'healthcare')
        assert error is not None
        assert 'Invalid file type' in error or 'Only' in error
    
    def test_file_size_exceeds_limit(self):
        """Test validation fails when file size exceeds 10MB."""
        error = validate_file_metadata('large.pdf', 'pdf', 11 * 1024 * 1024, 'healthcare')
        assert error is not None
        assert 'exceeds maximum allowed size' in error
    
    def test_negative_file_size(self):
        """Test validation fails for negative file size."""
        error = validate_file_metadata('document.pdf', 'pdf', -100, 'healthcare')
        assert error is not None
        assert 'must be greater than 0' in error or 'positive' in error
    
    def test_zero_file_size(self):
        """Test validation fails for zero file size."""
        error = validate_file_metadata('document.pdf', 'pdf', 0, 'healthcare')
        assert error is not None
        assert 'must be greater than 0' in error or 'positive' in error
    
    def test_empty_file_name(self):
        """Test validation fails for empty file name."""
        error = validate_file_metadata('', 'pdf', 5000000, 'healthcare')
        assert error is not None
        assert 'File name is required' in error
    
    def test_whitespace_file_name(self):
        """Test validation fails for whitespace-only file name."""
        error = validate_file_metadata('   ', 'pdf', 5000000, 'healthcare')
        assert error is not None
        assert 'File name is required' in error
    
    def test_invalid_vertical(self):
        """Test validation fails for invalid vertical."""
        error = validate_file_metadata('document.pdf', 'pdf', 5000000, 'invalid-vertical')
        assert error is not None
        assert 'Vertical must be one of' in error
    
    def test_case_insensitive_file_type(self):
        """Test file type validation is case-insensitive."""
        error = validate_file_metadata('document.PDF', 'PDF', 5000000, 'healthcare')
        assert error is None
    
    def test_case_insensitive_vertical(self):
        """Test vertical validation is case-insensitive."""
        error = validate_file_metadata('document.pdf', 'pdf', 5000000, 'HEALTHCARE')
        assert error is None


class TestGeneratePresignedUrl:
    """Tests for generate_presigned_url function."""
    
    @patch('handler.s3_client')
    def test_successful_presigned_url_generation(self, mock_s3_client):
        """Test successful presigned URL generation."""
        mock_s3_client.generate_presigned_url.return_value = 'https://s3.amazonaws.com/test-bucket/test-key?signature=xyz'
        
        url = generate_presigned_url('test-bucket', 'test-key', 900)
        
        assert url is not None
        assert url.startswith('https://')
        mock_s3_client.generate_presigned_url.assert_called_once_with(
            'put_object',
            Params={'Bucket': 'test-bucket', 'Key': 'test-key'},
            ExpiresIn=900
        )
    
    @patch('handler.s3_client')
    def test_presigned_url_generation_failure(self, mock_s3_client):
        """Test handling of S3 client error."""
        from botocore.exceptions import ClientError
        mock_s3_client.generate_presigned_url.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'generate_presigned_url'
        )
        
        url = generate_presigned_url('test-bucket', 'test-key', 900)
        
        assert url is None


class TestCreateDocumentRecord:
    """Tests for create_document_record function."""
    
    @patch('handler.dynamodb')
    def test_successful_document_record_creation(self, mock_dynamodb):
        """Test successful document record creation in DynamoDB."""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        
        success = create_document_record(
            'test-table',
            'doc-123',
            'user-456',
            'test.pdf',
            5000000,
            'pdf',
            'healthcare',
            'documents/user-456/doc-123.pdf'
        )
        
        assert success is True
        mock_dynamodb.Table.assert_called_once_with('test-table')
        mock_table.put_item.assert_called_once()
        
        # Verify the item structure
        call_args = mock_table.put_item.call_args
        item = call_args[1]['Item']
        assert item['documentId'] == 'doc-123'
        assert item['userId'] == 'user-456'
        assert item['fileName'] == 'test.pdf'
        assert item['fileSize'] == 5000000
        assert item['fileType'] == 'pdf'
        assert item['vertical'] == 'healthcare'
        assert item['s3Key'] == 'documents/user-456/doc-123.pdf'
        assert item['status'] == 'pending'
        assert 'uploadedAt' in item
    
    @patch('handler.dynamodb')
    def test_document_record_creation_failure(self, mock_dynamodb):
        """Test handling of DynamoDB client error."""
        from botocore.exceptions import ClientError
        mock_table = MagicMock()
        mock_table.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Table not found'}},
            'put_item'
        )
        mock_dynamodb.Table.return_value = mock_table
        
        success = create_document_record(
            'test-table',
            'doc-123',
            'user-456',
            'test.pdf',
            5000000,
            'pdf',
            'healthcare',
            'documents/user-456/doc-123.pdf'
        )
        
        assert success is False


class TestLambdaHandler:
    """Tests for lambda_handler function."""
    
    @patch('handler.create_document_record')
    @patch('handler.generate_presigned_url')
    @patch('handler.uuid.uuid4')
    def test_successful_upload_request(self, mock_uuid, mock_generate_url, mock_create_record):
        """Test successful upload request processing."""
        mock_uuid.return_value = Mock(hex='doc-123-456')
        mock_generate_url.return_value = 'https://s3.amazonaws.com/bucket/key?signature=xyz'
        mock_create_record.return_value = True
        
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-789'
                    }
                }
            },
            'body': json.dumps({
                'fileName': 'test.pdf',
                'fileType': 'pdf',
                'fileSize': 5000000,
                'vertical': 'healthcare'
            })
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'uploadUrl' in body
        assert 'documentId' in body
        assert 'expiresIn' in body
        assert body['expiresIn'] == 900
    
    def test_missing_authentication(self):
        """Test request without authentication."""
        event = {
            'requestContext': {},
            'body': json.dumps({
                'fileName': 'test.pdf',
                'fileType': 'pdf',
                'fileSize': 5000000,
                'vertical': 'healthcare'
            })
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'Unauthorized' in body['error']
    
    def test_invalid_json_body(self):
        """Test request with invalid JSON body."""
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-789'
                    }
                }
            },
            'body': 'invalid json'
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'Invalid JSON' in body['error']
    
    def test_invalid_file_type(self):
        """Test request with invalid file type."""
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-789'
                    }
                }
            },
            'body': json.dumps({
                'fileName': 'image.jpg',
                'fileType': 'jpg',
                'fileSize': 5000000,
                'vertical': 'healthcare'
            })
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'Invalid file type' in body['error'] or 'Only' in body['error']
    
    def test_file_size_exceeds_limit(self):
        """Test request with file size exceeding limit."""
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-789'
                    }
                }
            },
            'body': json.dumps({
                'fileName': 'large.pdf',
                'fileType': 'pdf',
                'fileSize': 11 * 1024 * 1024,  # 11MB
                'vertical': 'healthcare'
            })
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'exceeds maximum allowed size' in body['error']
    
    @patch('handler.generate_presigned_url')
    @patch('handler.uuid.uuid4')
    def test_presigned_url_generation_failure(self, mock_uuid, mock_generate_url):
        """Test handling of presigned URL generation failure."""
        mock_uuid.return_value = Mock(hex='doc-123-456')
        mock_generate_url.return_value = None
        
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-789'
                    }
                }
            },
            'body': json.dumps({
                'fileName': 'test.pdf',
                'fileType': 'pdf',
                'fileSize': 5000000,
                'vertical': 'healthcare'
            })
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'Failed to generate presigned URL' in body['error']
    
    @patch('handler.create_document_record')
    @patch('handler.generate_presigned_url')
    @patch('handler.uuid.uuid4')
    def test_document_record_creation_failure(self, mock_uuid, mock_generate_url, mock_create_record):
        """Test handling of document record creation failure."""
        mock_uuid.return_value = Mock(hex='doc-123-456')
        mock_generate_url.return_value = 'https://s3.amazonaws.com/bucket/key?signature=xyz'
        mock_create_record.return_value = False
        
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-789'
                    }
                }
            },
            'body': json.dumps({
                'fileName': 'test.pdf',
                'fileType': 'pdf',
                'fileSize': 5000000,
                'vertical': 'healthcare'
            })
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'Failed to create document record' in body['error']
    
    def test_missing_required_fields(self):
        """Test request with missing required fields."""
        event = {
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-789'
                    }
                }
            },
            'body': json.dumps({
                'fileName': 'test.pdf'
                # Missing fileType, fileSize, vertical
            })
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
