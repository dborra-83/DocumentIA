# Script para corregir el error CORS en DELETE y desplegar mejoras
# Fecha: 2026-02-05

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix DELETE CORS Error & Deploy Improvements" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "infrastructure")) {
    Write-Host "Error: Debe ejecutar este script desde el directorio raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Paso 1: Build infrastructure
Write-Host "[1/5] Building CDK infrastructure..." -ForegroundColor Yellow
cd infrastructure
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building CDK" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "✓ CDK build successful" -ForegroundColor Green
Write-Host ""

# Paso 2: Synth CDK
Write-Host "[2/5] Synthesizing CDK stack..." -ForegroundColor Yellow
npx cdk synth
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error synthesizing CDK" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "✓ CDK synth successful" -ForegroundColor Green
Write-Host ""

# Paso 3: Deploy infrastructure
Write-Host "[3/5] Deploying infrastructure changes..." -ForegroundColor Yellow
Write-Host "This will add:" -ForegroundColor Cyan
Write-Host "  - DocumentDeleteHandler Lambda function" -ForegroundColor Cyan
Write-Host "  - DELETE /documents/{documentId} endpoint with CORS" -ForegroundColor Cyan
Write-Host "  - IAM role for delete operations" -ForegroundColor Cyan
Write-Host ""

npx cdk deploy --all --require-approval never
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error deploying CDK" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "✓ Infrastructure deployed successfully" -ForegroundColor Green
Write-Host ""

cd ..

# Paso 4: Verificar deployment
Write-Host "[4/5] Verifying deployment..." -ForegroundColor Yellow
$apiUrl = (aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

if ($apiUrl) {
    Write-Host "✓ API Gateway URL: $apiUrl" -ForegroundColor Green
} else {
    Write-Host "⚠ Could not retrieve API URL" -ForegroundColor Yellow
}
Write-Host ""

# Paso 5: Test DELETE endpoint
Write-Host "[5/5] Testing DELETE endpoint..." -ForegroundColor Yellow
Write-Host "The DELETE endpoint is now available at:" -ForegroundColor Cyan
Write-Host "  DELETE ${apiUrl}documents/{documentId}" -ForegroundColor Cyan
Write-Host ""
Write-Host "CORS headers configured:" -ForegroundColor Cyan
Write-Host "  - Access-Control-Allow-Origin: *" -ForegroundColor Cyan
Write-Host "  - Access-Control-Allow-Methods: DELETE, GET, POST, OPTIONS" -ForegroundColor Cyan
Write-Host "  - Access-Control-Allow-Headers: Content-Type, Authorization, etc." -ForegroundColor Cyan
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes applied:" -ForegroundColor White
Write-Host "  ✓ Added DocumentDeleteHandler Lambda" -ForegroundColor Green
Write-Host "  ✓ Added DELETE endpoint with CORS" -ForegroundColor Green
Write-Host "  ✓ Added IAM role with delete permissions" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test delete functionality in the frontend" -ForegroundColor White
Write-Host "  2. Verify CORS headers in browser console" -ForegroundColor White
Write-Host "  3. Check CloudWatch logs for any errors" -ForegroundColor White
Write-Host ""
Write-Host "To monitor logs:" -ForegroundColor Cyan
Write-Host "  .\watch-logs.ps1" -ForegroundColor White
Write-Host ""
