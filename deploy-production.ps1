# Deploy DocumentIA to AWS Production
# This script deploys the complete application to AWS

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'prod',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [string]$DomainName,
    
    [Parameter(Mandatory=$false)]
    [string]$CertificateArn
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DocumentIA Production Deployment" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: AWS CLI not found. Please install AWS CLI." -ForegroundColor Red
    exit 1
}

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Check Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python not found. Please install Python 3.12+." -ForegroundColor Red
    exit 1
}

# Check CDK
if (!(Get-Command cdk -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: AWS CDK not found. Installing..." -ForegroundColor Yellow
    npm install -g aws-cdk
}

Write-Host "✓ All prerequisites met" -ForegroundColor Green
Write-Host ""

# Get AWS account info
Write-Host "Getting AWS account information..." -ForegroundColor Yellow
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$AWS_REGION = aws configure get region
if (!$AWS_REGION) {
    $AWS_REGION = "us-east-1"
}

Write-Host "  Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Cyan
Write-Host "  Region: $AWS_REGION" -ForegroundColor Cyan
Write-Host ""

# Confirm deployment
if ($Environment -eq 'prod') {
    Write-Host "WARNING: You are about to deploy to PRODUCTION!" -ForegroundColor Red
    $confirmation = Read-Host "Type 'yes' to continue"
    if ($confirmation -ne 'yes') {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Step 1: Run tests (unless skipped)
if (!$SkipTests) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 1: Running Tests" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Backend tests
    Write-Host "Running backend tests..." -ForegroundColor Yellow
    Push-Location backend
    try {
        python -m pytest -v
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Backend tests failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Backend tests passed" -ForegroundColor Green
    } finally {
        Pop-Location
    }
    
    # Frontend tests
    Write-Host "Running frontend tests..." -ForegroundColor Yellow
    Push-Location frontend
    try {
        npm test -- --run
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Frontend tests failed, but continuing..." -ForegroundColor Yellow
        } else {
            Write-Host "✓ Frontend tests passed" -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
    
    Write-Host ""
} else {
    Write-Host "Skipping tests..." -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Build Lambda packages
if (!$SkipBuild) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 2: Building Lambda Packages" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Build shared layer
    Write-Host "Building shared layer..." -ForegroundColor Yellow
    Push-Location backend/shared
    try {
        if (Test-Path "layer.zip") {
            Remove-Item "layer.zip" -Force
        }
        
        # Create python directory structure
        if (Test-Path "python") {
            Remove-Item "python" -Recurse -Force
        }
        New-Item -ItemType Directory -Path "python" -Force | Out-Null
        
        # Install dependencies
        pip install -r requirements.txt -t python/ --upgrade
        
        # Copy shared modules
        Copy-Item "file_validator.py" "python/"
        Copy-Item "text_extractor.py" "python/"
        Copy-Item "vertical_templates.py" "python/"
        
        # Create zip
        Compress-Archive -Path "python/*" -DestinationPath "layer.zip" -Force
        
        Write-Host "✓ Shared layer built" -ForegroundColor Green
    } finally {
        Pop-Location
    }
    
    # Build Lambda functions
    $lambdaFunctions = @(
        "document-upload",
        "bedrock-processor",
        "step-functions-trigger",
        "document-delete"
    )
    
    foreach ($func in $lambdaFunctions) {
        Write-Host "Building $func..." -ForegroundColor Yellow
        Push-Location "backend/$func"
        try {
            if (Test-Path "package.zip") {
                Remove-Item "package.zip" -Force
            }
            
            # Install dependencies if requirements.txt exists
            if (Test-Path "requirements.txt") {
                pip install -r requirements.txt -t . --upgrade
            }
            
            # Create zip
            Compress-Archive -Path "*" -DestinationPath "package.zip" -Force
            
            Write-Host "✓ $func built" -ForegroundColor Green
        } finally {
            Pop-Location
        }
    }
    
    Write-Host ""
} else {
    Write-Host "Skipping build..." -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Deploy infrastructure with CDK
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Deploying Infrastructure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Push-Location infrastructure
try {
    # Install CDK dependencies
    Write-Host "Installing CDK dependencies..." -ForegroundColor Yellow
    npm install
    
    # Bootstrap CDK (if needed)
    Write-Host "Bootstrapping CDK..." -ForegroundColor Yellow
    cdk bootstrap "aws://$AWS_ACCOUNT_ID/$AWS_REGION"
    
    # Build CDK
    Write-Host "Building CDK..." -ForegroundColor Yellow
    npm run build
    
    # Deploy
    Write-Host "Deploying CDK stack..." -ForegroundColor Yellow
    
    $cdkArgs = @(
        "deploy",
        "--all",
        "--require-approval", "never",
        "--context", "environment=$Environment"
    )
    
    if ($DomainName) {
        $cdkArgs += "--context"
        $cdkArgs += "domainName=$DomainName"
    }
    
    if ($CertificateArn) {
        $cdkArgs += "--context"
        $cdkArgs += "certificateArn=$CertificateArn"
    }
    
    & cdk @cdkArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: CDK deployment failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Infrastructure deployed" -ForegroundColor Green
    
    # Get outputs
    Write-Host ""
    Write-Host "Getting stack outputs..." -ForegroundColor Yellow
    $outputs = cdk deploy --all --outputs-file ../cdk-outputs.json --require-approval never --context environment=$Environment
    
} finally {
    Pop-Location
}

Write-Host ""

# Step 4: Build and deploy frontend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Building and Deploying Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Push-Location frontend
try {
    # Read CDK outputs
    if (Test-Path "../cdk-outputs.json") {
        $cdkOutputs = Get-Content "../cdk-outputs.json" | ConvertFrom-Json
        $stackName = "DocumentAnalysisStack-$Environment"
        
        if ($cdkOutputs.$stackName) {
            $API_URL = $cdkOutputs.$stackName.ApiGatewayUrl
            $USER_POOL_ID = $cdkOutputs.$stackName.UserPoolId
            $USER_POOL_CLIENT_ID = $cdkOutputs.$stackName.UserPoolClientId
            $WEB_BUCKET = $cdkOutputs.$stackName.WebHostingBucketName
            $CLOUDFRONT_DOMAIN = $cdkOutputs.$stackName.CloudFrontUrl
            
            Write-Host "  API URL: $API_URL" -ForegroundColor Cyan
            Write-Host "  User Pool ID: $USER_POOL_ID" -ForegroundColor Cyan
            Write-Host "  CloudFront: $CLOUDFRONT_DOMAIN" -ForegroundColor Cyan
            Write-Host ""
            
            # Create production .env file
            Write-Host "Creating production environment file..." -ForegroundColor Yellow
            @"
VITE_API_URL=$API_URL
VITE_API_REGION=$AWS_REGION
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_COGNITO_REGION=$AWS_REGION
VITE_ENVIRONMENT=$Environment
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
            
            Write-Host "✓ Environment file created" -ForegroundColor Green
        }
    }
    
    # Install dependencies
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    
    # Build
    Write-Host "Building frontend..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Frontend built" -ForegroundColor Green
    
    # Deploy to S3
    if ($WEB_BUCKET) {
        Write-Host "Deploying to S3..." -ForegroundColor Yellow
        aws s3 sync dist/ "s3://$WEB_BUCKET/" --delete
        
        Write-Host "✓ Frontend deployed to S3" -ForegroundColor Green
        
        # Invalidate CloudFront cache
        if ($cdkOutputs.$stackName.DistributionId) {
            $DISTRIBUTION_ID = $cdkOutputs.$stackName.DistributionId
            Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
            aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
            Write-Host "✓ CloudFront cache invalidated" -ForegroundColor Green
        }
    }
    
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($CLOUDFRONT_DOMAIN) {
    Write-Host "Application URL: $CLOUDFRONT_DOMAIN" -ForegroundColor Cyan
}

if ($DomainName) {
    Write-Host "Custom Domain: https://$DomainName" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the application at the URL above" -ForegroundColor White
Write-Host "2. Create a Cognito user for testing" -ForegroundColor White
Write-Host "3. Monitor CloudWatch logs and metrics" -ForegroundColor White
Write-Host "4. Set up CloudWatch alarms for production" -ForegroundColor White
Write-Host ""
