# Script para reprocesar un documento atorado

param(
    [Parameter(Mandatory=$true)]
    [string]$DocumentId
)

Write-Host "=== Reprocesando Documento ===" -ForegroundColor Cyan
Write-Host "Document ID: $DocumentId" -ForegroundColor White
Write-Host ""

# 1. Obtener información del documento
Write-Host "1. Obteniendo información del documento..." -ForegroundColor Yellow

$docResult = aws dynamodb get-item `
    --table-name DocumentAnalysis-Documents-dev `
    --key "{\"documentId\":{\"S\":\"$DocumentId\"}}" `
    --region us-east-1 `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Documento no encontrado" -ForegroundColor Red
    exit 1
}

$docResult | Out-File -FilePath "temp-doc.json" -Encoding UTF8
$doc = Get-Content "temp-doc.json" -Raw | ConvertFrom-Json

if (-not $doc.Item) {
    Write-Host "Error: Documento no encontrado" -ForegroundColor Red
    Remove-Item "temp-doc.json" -ErrorAction SilentlyContinue
    exit 1
}

$fileName = $doc.Item.fileName.S
$s3Key = $doc.Item.s3Key.S
$userId = $doc.Item.userId.S
$vertical = $doc.Item.vertical.S
$status = $doc.Item.status.S

Write-Host "  File: $fileName" -ForegroundColor White
Write-Host "  Status: $status" -ForegroundColor Yellow
Write-Host "  S3 Key: $s3Key" -ForegroundColor White
Write-Host ""

# 2. Verificar que el archivo existe en S3
Write-Host "2. Verificando archivo en S3..." -ForegroundColor Yellow

$s3Check = aws s3 ls "s3://document-analysis-documents-520754296204-dev/$s3Key" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Archivo no existe en S3" -ForegroundColor Red
    Write-Host "El documento no puede ser reprocesado sin el archivo." -ForegroundColor Red
    Remove-Item "temp-doc.json" -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "  Archivo encontrado en S3" -ForegroundColor Green
Write-Host ""

# 3. Actualizar estado a 'pending' si está en otro estado
if ($status -ne 'pending') {
    Write-Host "3. Actualizando estado a 'pending'..." -ForegroundColor Yellow
    
    aws dynamodb update-item `
        --table-name DocumentAnalysis-Documents-dev `
        --key "{\"documentId\":{\"S\":\"$DocumentId\"}}" `
        --update-expression "SET #status = :status" `
        --expression-attribute-names '{\"#status\":\"status\"}' `
        --expression-attribute-values '{\":status\":{\"S\":\"pending\"}}' `
        --region us-east-1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Estado actualizado" -ForegroundColor Green
    } else {
        Write-Host "  Error al actualizar estado" -ForegroundColor Red
    }
    Write-Host ""
}

# 4. Invocar Lambda directamente
Write-Host "4. Invocando BedrockProcessor Lambda..." -ForegroundColor Yellow

$payload = @{
    documentId = $DocumentId
    userId = $userId
    fileName = $fileName
    s3Key = $s3Key
    vertical = $vertical
} | ConvertTo-Json -Compress

$payload | Out-File -FilePath "temp-payload.json" -Encoding UTF8 -NoNewline

Write-Host "  Payload: $payload" -ForegroundColor Gray

$invokeResult = aws lambda invoke `
    --function-name BedrockProcessor-dev `
    --payload file://temp-payload.json `
    --region us-east-1 `
    response.json 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Lambda invocado exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar respuesta
    if (Test-Path "response.json") {
        $response = Get-Content "response.json" -Raw | ConvertFrom-Json
        Write-Host "  Respuesta:" -ForegroundColor Cyan
        Write-Host "  $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    }
} else {
    Write-Host "  Error al invocar Lambda" -ForegroundColor Red
    Write-Host "  $invokeResult" -ForegroundColor Red
}

Write-Host ""

# 5. Verificar estado final
Write-Host "5. Verificando estado final..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$finalResult = aws dynamodb get-item `
    --table-name DocumentAnalysis-Documents-dev `
    --key "{\"documentId\":{\"S\":\"$DocumentId\"}}" `
    --region us-east-1 `
    --output json

$finalResult | Out-File -FilePath "temp-final.json" -Encoding UTF8
$finalDoc = Get-Content "temp-final.json" -Raw | ConvertFrom-Json

$finalStatus = $finalDoc.Item.status.S
Write-Host "  Estado final: $finalStatus" -ForegroundColor $(if ($finalStatus -eq 'completed') { 'Green' } elseif ($finalStatus -eq 'failed') { 'Red' } else { 'Yellow' })

if ($finalDoc.Item.errorMessage) {
    Write-Host "  Error: $($finalDoc.Item.errorMessage.S)" -ForegroundColor Red
}

# Limpiar archivos temporales
Remove-Item "temp-doc.json" -ErrorAction SilentlyContinue
Remove-Item "temp-payload.json" -ErrorAction SilentlyContinue
Remove-Item "temp-final.json" -ErrorAction SilentlyContinue
Remove-Item "response.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Reprocesamiento Completo ===" -ForegroundColor Green
