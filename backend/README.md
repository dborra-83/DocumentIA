# Backend Lambda Functions

This directory contains all Lambda function code for the Document Analysis system.

## Structure

```
backend/
├── document-upload/       # DocumentUploadHandler - Generates presigned URLs
├── bedrock-processor/     # BedrockProcessor - Processes documents with Bedrock
├── history-manager/       # HistoryManager - Queries document history
├── metrics-aggregator/    # MetricsAggregator - Aggregates user metrics
├── export-handler/        # ExportHandler - Generates exports in multiple formats
├── shared/                # Shared utilities and libraries
└── requirements.txt       # Python dependencies
```

## Lambda Functions

### DocumentUploadHandler
- **Runtime**: Python 3.12
- **Memory**: 256 MB
- **Timeout**: 10 seconds
- **Purpose**: Generate presigned URLs for S3 uploads and create document records

### BedrockProcessor
- **Runtime**: Python 3.12
- **Memory**: 1024 MB
- **Timeout**: 300 seconds
- **Purpose**: Extract text from documents and invoke Bedrock for analysis

### HistoryManager
- **Runtime**: Python 3.12
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Purpose**: Query and return document history with filtering

### MetricsAggregator
- **Runtime**: Python 3.12
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Purpose**: Aggregate and return user metrics

### ExportHandler
- **Runtime**: Python 3.12
- **Memory**: 1024 MB
- **Timeout**: 60 seconds
- **Purpose**: Generate exports in PDF, JSON, Excel, and Word formats

## Development

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run tests

```bash
pytest
```

### Run tests with coverage

```bash
pytest --cov=. --cov-report=html
```

## Testing

Each Lambda function has:
- Unit tests for specific scenarios
- Property-based tests for universal correctness
- Integration tests for AWS service interactions

See the `tests/` directory in each function folder.
