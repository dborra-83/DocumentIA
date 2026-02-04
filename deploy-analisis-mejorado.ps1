# Script de Deployment: Análisis Mejorado en Español con Datos Extraídos
# Fecha: 2026-02-04

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment: Análisis Mejorado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$AWS_REGION = "us-east-1"
$AWS_ACCOUNT = "520754296204"

# Step 1: Actualizar Lambda Layer (shared code)
Write-Host "[1/4] Actualizando Lambda Layer..." -ForegroundColor Yellow
Set-Location backend/shared

# Crear directorio python si no existe
if (!(Test-Path "python")) {
    New-Item -ItemType Directory -Path "python" -Force | Out-Null
}

# Copiar archivos Python al directorio python
Copy-Item "vertical_templates.py" "python/" -Force
Copy-Item "text_extractor.py" "python/" -Force
Copy-Item "file_validator.py" "python/" -Force
Copy-Item "__init__.py" "python/" -Force

# Crear layer.zip
if (Test-Path "layer.zip") {
    Remove-Item "layer.zip" -Force
}

Compress-Archive -Path "python/*" -DestinationPath "layer.zip" -Force

Write-Host "  ✓ layer.zip creado" -ForegroundColor Green

# Publicar nueva versión del layer
Write-Host "  Publicando layer a AWS..." -ForegroundColor Yellow
$layerOutput = aws lambda publish-layer-version `
    --layer-name document-analysis-shared `
    --zip-file fileb://layer.zip `
    --compatible-runtimes python3.12 `
    --region $AWS_REGION `
    --output json | ConvertFrom-Json

$LAYER_VERSION = $layerOutput.Version
$LAYER_ARN = $layerOutput.LayerVersionArn

Write-Host "  ✓ Layer publicado: Versión $LAYER_VERSION" -ForegroundColor Green
Write-Host "  ARN: $LAYER_ARN" -ForegroundColor Gray

Set-Location ../..

# Step 2: Actualizar BedrockProcessor Lambda
Write-Host ""
Write-Host "[2/4] Actualizando BedrockProcessor Lambda..." -ForegroundColor Yellow
Set-Location backend/bedrock-processor

# Crear package.zip
if (Test-Path "package.zip") {
    Remove-Item "package.zip" -Force
}

Compress-Archive -Path "handler.py" -DestinationPath "package.zip" -Force

Write-Host "  ✓ package.zip creado" -ForegroundColor Green

# Actualizar código de la función
Write-Host "  Actualizando código de función..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name BedrockProcessor-dev `
    --zip-file fileb://package.zip `
    --region $AWS_REGION `
    --output json | Out-Null

Write-Host "  ✓ Código actualizado" -ForegroundColor Green

Set-Location ../..

# Step 3: Actualizar configuración de Lambda con nuevo Layer
Write-Host ""
Write-Host "[3/4] Actualizando configuración de Lambda..." -ForegroundColor Yellow

aws lambda update-function-configuration `
    --function-name BedrockProcessor-dev `
    --layers $LAYER_ARN `
    --region $AWS_REGION `
    --output json | Out-Null

Write-Host "  ✓ Configuración actualizada con Layer versión $LAYER_VERSION" -ForegroundColor Green

# Step 4: Esperar a que la función esté lista
Write-Host ""
Write-Host "[4/4] Esperando a que la función esté lista..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "  ✓ Esperando completado" -ForegroundColor Green

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Completado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cambios desplegados:" -ForegroundColor White
Write-Host "  ✓ Lambda Layer actualizado (versión $LAYER_VERSION)" -ForegroundColor Green
Write-Host "  ✓ BedrockProcessor actualizado" -ForegroundColor Green
Write-Host "  ✓ Prompt en español implementado" -ForegroundColor Green
Write-Host "  ✓ Extracción de datos estructurados habilitada" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor White
Write-Host "  1. Sube un documento en /analyze" -ForegroundColor Gray
Write-Host "  2. Ve a /history y verifica el análisis en español" -ForegroundColor Gray
Write-Host "  3. Revisa los datos extraídos" -ForegroundColor Gray
Write-Host "  4. Descarga el JSON" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentación: MEJORAS_ANALISIS_ESPAÑOL_JSON.md" -ForegroundColor Cyan
Write-Host ""
