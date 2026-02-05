# Script para desplegar los 4 fixes
# Fecha: 2026-02-05

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy 4 Fixes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Fixes incluidos:" -ForegroundColor Yellow
Write-Host "  1. Modal de análisis - Race condition fix" -ForegroundColor White
Write-Host "  2. Datos extraídos - Mapeo de extractedData" -ForegroundColor White
Write-Host "  3. Columna Usuario - Mostrar email" -ForegroundColor White
Write-Host "  4. Confirmación de email - Nueva página" -ForegroundColor White
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "infrastructure")) {
    Write-Host "Error: Debe ejecutar este script desde el directorio raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Paso 1: Deploy backend changes (history-manager)
Write-Host "[1/3] Deploying backend changes..." -ForegroundColor Yellow
cd infrastructure
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building CDK" -ForegroundColor Red
    cd ..
    exit 1
}

npx cdk deploy DocumentAnalysis-prod --require-approval never -c environment=prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error deploying backend" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "✓ Backend deployed successfully" -ForegroundColor Green
Write-Host ""

cd ..

# Paso 2: Build frontend
Write-Host "[2/3] Building frontend..." -ForegroundColor Yellow
cd frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building frontend" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "✓ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Paso 3: Deploy frontend to S3
Write-Host "[3/3] Deploying frontend to S3..." -ForegroundColor Yellow
$bucketName = "document-analysis-web-520754296204-prod"
aws s3 sync dist/ s3://$bucketName/ --delete
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error deploying frontend to S3" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "✓ Frontend deployed to S3" -ForegroundColor Green
Write-Host ""

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
$distributionId = "E26VMZ6ATIG54Y"
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Warning: Could not invalidate CloudFront cache" -ForegroundColor Yellow
} else {
    Write-Host "✓ CloudFront cache invalidated" -ForegroundColor Green
}
Write-Host ""

cd ..

# Resumen
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes deployed:" -ForegroundColor White
Write-Host "  ✓ Fix 1: Modal race condition resolved" -ForegroundColor Green
Write-Host "  ✓ Fix 2: extractedData mapping added" -ForegroundColor Green
Write-Host "  ✓ Fix 3: User email column updated" -ForegroundColor Green
Write-Host "  ⏳ Fix 4: Email confirmation page (pending)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test modal loading in History page" -ForegroundColor White
Write-Host "  2. Verify extracted data display" -ForegroundColor White
Write-Host "  3. Check user email in table" -ForegroundColor White
Write-Host "  4. Implement email confirmation page" -ForegroundColor White
Write-Host ""
Write-Host "URL: https://d2twnt4egn896m.cloudfront.net" -ForegroundColor Cyan
Write-Host ""
