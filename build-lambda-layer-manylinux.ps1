# Build Lambda Layer for Linux without Docker
# Downloads manylinux wheels from PyPI

param(
    [string]$LayerPath = "backend/shared"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Lambda Layer for Linux" -ForegroundColor Cyan
Write-Host "  (Using manylinux wheels from PyPI)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create python directory
$pythonDir = Join-Path $LayerPath "python"
if (Test-Path $pythonDir) {
    Write-Host "Removing old python directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $pythonDir
}
New-Item -ItemType Directory -Path $pythonDir -Force | Out-Null

Write-Host "✅ Python directory created" -ForegroundColor Green
Write-Host ""

# Install dependencies for manylinux (compatible with Lambda)
Write-Host "Installing dependencies for manylinux..." -ForegroundColor Cyan
Write-Host ""

# Use pip with platform-specific options
pip install `
    --platform manylinux2014_x86_64 `
    --target $pythonDir `
    --implementation cp `
    --python-version 3.12 `
    --only-binary=:all: `
    --upgrade `
    lxml==5.3.0 `
    python-docx==1.1.0 `
    PyPDF2==3.0.1 `
    typing-extensions==4.15.0

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Copy custom modules
Write-Host "Copying custom modules..." -ForegroundColor Yellow
Copy-Item (Join-Path $LayerPath "file_validator.py") (Join-Path $pythonDir "file_validator.py")
Copy-Item (Join-Path $LayerPath "text_extractor.py") (Join-Path $pythonDir "text_extractor.py")
Copy-Item (Join-Path $LayerPath "vertical_templates.py") (Join-Path $pythonDir "vertical_templates.py")
Copy-Item (Join-Path $LayerPath "__init__.py") (Join-Path $pythonDir "__init__.py")

Write-Host "✅ Custom modules copied" -ForegroundColor Green
Write-Host ""

# Create ZIP
Write-Host "Creating ZIP file..." -ForegroundColor Yellow
$zipPath = Join-Path $LayerPath "layer.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Create zip from python directory
Push-Location $LayerPath
Compress-Archive -Path "python" -DestinationPath "layer.zip" -Force
Pop-Location

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "✅ Layer ZIP created: $zipPath ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Lambda Layer Built Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy the layer:" -ForegroundColor White
Write-Host "   cd infrastructure" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   cdk deploy --all --context environment=prod" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the Lambda function" -ForegroundColor White
Write-Host ""
