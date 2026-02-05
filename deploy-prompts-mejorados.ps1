# Deploy Prompts Mejorados - DocumentIA
# Script para desplegar mejoras en prompts de extracción de datos

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Prompts Mejorados - DocumentIA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend/shared/vertical_templates.py")) {
    Write-Host "Error: No se encuentra backend/shared/vertical_templates.py" -ForegroundColor Red
    Write-Host "Asegurate de ejecutar este script desde la raiz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "1. Verificando cambios en vertical_templates.py..." -ForegroundColor Yellow
$templateContent = Get-Content "backend/shared/vertical_templates.py" -Raw
if ($templateContent -match "analisis_sentimiento" -and $templateContent -match "relaciones_entidades") {
    Write-Host "   ✓ Cambios detectados en vertical_templates.py" -ForegroundColor Green
} else {
    Write-Host "   ✗ No se detectaron las mejoras en vertical_templates.py" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Reconstruyendo Lambda Layer con dependencias para Linux..." -ForegroundColor Yellow

# Verificar que existe el script de build
if (-not (Test-Path "build-lambda-layer-manylinux.ps1")) {
    Write-Host "   ✗ No se encuentra build-lambda-layer-manylinux.ps1" -ForegroundColor Red
    exit 1
}

# Ejecutar el script de build
Write-Host "   Ejecutando build-lambda-layer-manylinux.ps1..." -ForegroundColor Cyan
& .\build-lambda-layer-manylinux.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Error al construir Lambda Layer" -ForegroundColor Red
    exit 1
}

Write-Host "   ✓ Lambda Layer reconstruido exitosamente" -ForegroundColor Green

Write-Host ""
Write-Host "3. Desplegando infraestructura con CDK..." -ForegroundColor Yellow

# Cambiar al directorio de infrastructure
Push-Location infrastructure

try {
    # Verificar que CDK está instalado
    $cdkVersion = cdk --version 2>$null
    if (-not $cdkVersion) {
        Write-Host "   ✗ CDK no está instalado" -ForegroundColor Red
        Write-Host "   Instala CDK con: npm install -g aws-cdk" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "   CDK Version: $cdkVersion" -ForegroundColor Cyan

    # Desplegar con CDK
    Write-Host "   Desplegando stack de producción..." -ForegroundColor Cyan
    cdk deploy --all --context environment=prod --require-approval never

    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Error al desplegar con CDK" -ForegroundColor Red
        exit 1
    }

    Write-Host "   ✓ Infraestructura desplegada exitosamente" -ForegroundColor Green

} finally {
    # Volver al directorio original
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Cambios desplegados:" -ForegroundColor Cyan
Write-Host "  • Lambda Layer actualizado con vertical_templates.py mejorado" -ForegroundColor White
Write-Host "  • BedrockProcessor Lambda function actualizada" -ForegroundColor White
Write-Host ""

Write-Host "Nuevas capacidades de extracción:" -ForegroundColor Cyan
Write-Host "  ✓ Análisis de sentimiento (tono, formalidad, urgencia)" -ForegroundColor White
Write-Host "  ✓ Relaciones entre entidades (personas, empresas, etc.)" -ForegroundColor White
Write-Host "  ✓ Línea de tiempo de eventos (hitos, deadlines)" -ForegroundColor White
Write-Host "  ✓ Validaciones de datos (consistencia, completitud)" -ForegroundColor White
Write-Host "  ✓ Cálculos automáticos (totales, promedios, duraciones)" -ForegroundColor White
Write-Host "  ✓ Detección de patrones (temporales, financieros)" -ForegroundColor White
Write-Host "  ✓ Alertas automáticas (vencimientos, cumplimiento)" -ForegroundColor White
Write-Host "  ✓ Recomendaciones priorizadas (urgencia, impacto)" -ForegroundColor White
Write-Host "  ✓ Comparación contextual (calidad, complejidad)" -ForegroundColor White
Write-Host "  ✓ KPIs y métricas de rendimiento" -ForegroundColor White
Write-Host ""

Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Probar subiendo un documento en: https://d2twnt4egn896m.cloudfront.net" -ForegroundColor White
Write-Host "  2. Verificar que el análisis incluye las nuevas secciones" -ForegroundColor White
Write-Host "  3. Revisar alertas y recomendaciones generadas" -ForegroundColor White
Write-Host "  4. Validar extracción de relaciones entre entidades" -ForegroundColor White
Write-Host ""

Write-Host "Para monitorear el procesamiento:" -ForegroundColor Yellow
Write-Host "  .\watch-logs.ps1" -ForegroundColor Cyan
Write-Host ""
