# Build Lambda Layer for Linux using Docker
# This script builds the Lambda layer with dependencies compiled for Amazon Linux 2

param(
    [string]$LayerPath = "backend/shared"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Lambda Layer for Linux" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
try {
    docker --version | Out-Null
    Write-Host "✅ Docker found" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Installing dependencies locally (may not work in Lambda)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Building layer locally..." -ForegroundColor Yellow
    
    # Create python directory
    $pythonDir = Join-Path $LayerPath "python"
    if (Test-Path $pythonDir) {
        Remove-Item -Recurse -Force $pythonDir
    }
    New-Item -ItemType Directory -Path $pythonDir -Force | Out-Null
    
    # Install dependencies
    pip install -r (Join-Path $LayerPath "requirements.txt") -t $pythonDir --upgrade
    
    # Copy custom modules
    Copy-Item (Join-Path $LayerPath "file_validator.py") (Join-Path $pythonDir "file_validator.py")
    Copy-Item (Join-Path $LayerPath "text_extractor.py") (Join-Path $pythonDir "text_extractor.py")
    Copy-Item (Join-Path $LayerPath "vertical_templates.py") (Join-Path $pythonDir "vertical_templates.py")
    Copy-Item (Join-Path $LayerPath "__init__.py") (Join-Path $pythonDir "__init__.py")
    
    # Create ZIP
    $zipPath = Join-Path $LayerPath "layer.zip"
    if (Test-Path $zipPath) {
        Remove-Item $zipPath
    }
    
    Compress-Archive -Path (Join-Path $pythonDir "*") -DestinationPath $zipPath -Force
    
    Write-Host "✅ Layer built locally: $zipPath" -ForegroundColor Green
    Write-Host "⚠️  Warning: This may not work in Lambda (Windows binaries)" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Building layer using Docker (Amazon Linux 2)..." -ForegroundColor Cyan
Write-Host ""

# Create temporary directory for build
$buildDir = Join-Path $LayerPath "build"
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
}
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null

# Create python directory
$pythonDir = Join-Path $buildDir "python"
New-Item -ItemType Directory -Path $pythonDir -Force | Out-Null

# Copy requirements.txt to build directory
Copy-Item (Join-Path $LayerPath "requirements.txt") (Join-Path $buildDir "requirements.txt")

# Build using Docker
Write-Host "Running Docker container to build dependencies..." -ForegroundColor Yellow
docker run --rm `
    -v "${PWD}/${LayerPath}/build:/build" `
    -w /build `
    public.ecr.aws/lambda/python:3.12 `
    pip install -r requirements.txt -t python/ --upgrade

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies built successfully" -ForegroundColor Green

# Copy custom modules
Write-Host "Copying custom modules..." -ForegroundColor Yellow
Copy-Item (Join-Path $LayerPath "file_validator.py") (Join-Path $pythonDir "file_validator.py")
Copy-Item (Join-Path $LayerPath "text_extractor.py") (Join-Path $pythonDir "text_extractor.py")
Copy-Item (Join-Path $LayerPath "vertical_templates.py") (Join-Path $pythonDir "vertical_templates.py")
Copy-Item (Join-Path $LayerPath "__init__.py") (Join-Path $pythonDir "__init__.py")

Write-Host "✅ Custom modules copied" -ForegroundColor Green

# Create ZIP
Write-Host "Creating ZIP file..." -ForegroundColor Yellow
$zipPath = Join-Path $LayerPath "layer.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Change to build directory and create zip
Push-Location $buildDir
Compress-Archive -Path "python" -DestinationPath "../layer.zip" -Force
Pop-Location

Write-Host "✅ Layer ZIP created: $zipPath" -ForegroundColor Green

# Clean up build directory
Remove-Item -Recurse -Force $buildDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Lambda Layer Built Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy the layer: cdk deploy --context environment=prod" -ForegroundColor White
Write-Host "2. Test the Lambda function" -ForegroundColor White
Write-Host ""
