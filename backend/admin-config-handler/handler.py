"""
AdminConfigHandler Lambda Function

Allows admins to read and update the Bedrock model configuration.
Stores the selected model ID in SSM Parameter Store.
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

SSM_PARAMETER_NAME = os.environ.get('SSM_MODEL_PARAMETER', '/documentai/bedrock-model-id')
BEDROCK_LAMBDA_NAME = os.environ.get('BEDROCK_LAMBDA_NAME', '')

ssm_client = boto3.client('ssm')
lambda_client = boto3.client('lambda')

# Available Anthropic models on Amazon Bedrock (on-demand, no inference profile required)
AVAILABLE_MODELS = [
    {
        "id": "anthropic.claude-3-sonnet-20240229-v1:0",
        "name": "Claude 3 Sonnet (Recomendado)",
        "description": "Balance entre inteligencia y velocidad"
    },
    {
        "id": "anthropic.claude-3-haiku-20240307-v1:0",
        "name": "Claude 3 Haiku",
        "description": "Más rápido y económico"
    },
]

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Content-Type': 'application/json',
}


def get_current_model() -> str:
    """Get current model ID from SSM or return default."""
    try:
        response = ssm_client.get_parameter(Name=SSM_PARAMETER_NAME)
        return response['Parameter']['Value']
    except ClientError as e:
        if e.response['Error']['Code'] == 'ParameterNotFound':
            return 'anthropic.claude-3-sonnet-20240229-v1:0'
        raise


def update_model(model_id: str) -> None:
    """Save model ID to SSM Parameter Store and update Lambda env var."""
    # Validate model ID
    valid_ids = [m['id'] for m in AVAILABLE_MODELS]
    if model_id not in valid_ids:
        raise ValueError(f"Invalid model ID: {model_id}")

    # Save to SSM
    ssm_client.put_parameter(
        Name=SSM_PARAMETER_NAME,
        Value=model_id,
        Type='String',
        Overwrite=True,
        Description='Bedrock model ID used by DocumentIA'
    )

    # Update BedrockProcessor Lambda environment variable
    if BEDROCK_LAMBDA_NAME:
        try:
            current_config = lambda_client.get_function_configuration(
                FunctionName=BEDROCK_LAMBDA_NAME
            )
            env_vars = current_config.get('Environment', {}).get('Variables', {})
            env_vars['BEDROCK_MODEL_ID'] = model_id
            lambda_client.update_function_configuration(
                FunctionName=BEDROCK_LAMBDA_NAME,
                Environment={'Variables': env_vars}
            )
        except ClientError as e:
            print(f"Warning: Could not update Lambda env var: {e}")


def lambda_handler(event: dict, context) -> dict:
    method = event.get('httpMethod', '')
    path = event.get('path', '')

    # Handle OPTIONS preflight
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        # GET /admin/config - return current model and available models
        if method == 'GET':
            current_model = get_current_model()
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'currentModel': current_model,
                    'availableModels': AVAILABLE_MODELS
                })
            }

        # PUT /admin/config - update model
        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            model_id = body.get('modelId')
            if not model_id:
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'modelId is required'})
                }
            update_model(model_id)
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'Model updated successfully', 'modelId': model_id})
            }

        return {
            'statusCode': 405,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Internal server error'})
        }
