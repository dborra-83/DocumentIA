# Script para verificar documentos pendientes en DynamoDB

Write-Host "=== Verificando Documentos Pendientes ===" -ForegroundColor Cyan
Write-Host ""

# Obtener todos los documentos
$result = aws dynamodb scan `
    --table-name DocumentAnalysis-Documents-dev `
    --region us-east-1 `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al consultar DynamoDB" -ForegroundColor Red
    exit 1
}

# Guardar en archivo temporal
$result | Out-File -FilePath "temp-docs.json" -Encoding UTF8

# Leer y parsear
$data = Get-Content "temp-docs.json" -Raw | ConvertFrom-Json

Write-Host "Total de documentos en la tabla: $($data.Items.Count)" -ForegroundColor Yellow
Write-Host ""

# Contar por estado
$pending = @($data.Items | Where-Object { $_.status.S -eq 'pending' })
$processing = @($data.Items | Where-Object { $_.status.S -eq 'processing' })
$completed = @($data.Items | Where-Object { $_.status.S -eq 'completed' })
$failed = @($data.Items | Where-Object { $_.status.S -eq 'failed' })

Write-Host "Documentos por estado:" -ForegroundColor Cyan
Write-Host "  Pending:    $($pending.Count)" -ForegroundColor Yellow
Write-Host "  Processing: $($processing.Count)" -ForegroundColor Blue
Write-Host "  Completed:  $($completed.Count)" -ForegroundColor Green
Write-Host "  Failed:     $($failed.Count)" -ForegroundColor Red
Write-Host ""

# Mostrar documentos pendientes
if ($pending.Count -gt 0) {
    Write-Host "=== Documentos Pendientes ===" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($doc in $pending) {
        $docId = $doc.documentId.S
        $fileName = $doc.fileName.S
        $uploadedAt = $doc.uploadedAt.S
        $userId = $doc.userId.S
        
        Write-Host "Document ID: $docId" -ForegroundColor White
        Write-Host "  File: $fileName"
        Write-Host "  User: $userId"
        Write-Host "  Uploaded: $uploadedAt"
        
        # Calcular tiempo transcurrido
        $uploadTime = [DateTime]::Parse($uploadedAt)
        $elapsed = (Get-Date) - $uploadTime
        Write-Host "  Time elapsed: $($elapsed.TotalMinutes.ToString('F1')) minutes" -ForegroundColor $(if ($elapsed.TotalMinutes -gt 10) { 'Red' } else { 'Yellow' })
        
        # Verificar si existe en S3
        $s3Key = $doc.s3Key.S
        Write-Host "  S3 Key: $s3Key"
        
        $s3Check = aws s3 ls "s3://document-analysis-documents-520754296204-dev/$s3Key" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  S3 Status: EXISTS" -ForegroundColor Green
        } else {
            Write-Host "  S3 Status: NOT FOUND" -ForegroundColor Red
        }
        
        Write-Host ""
    }
    
    Write-Host "=== Recomendaciones ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Documentos pendientes por más de 10 minutos probablemente están atorados." -ForegroundColor Yellow
    Write-Host "Posibles causas:" -ForegroundColor White
    Write-Host "  1. Step Function no se disparó"
    Write-Host "  2. Lambda falló sin actualizar el estado"
    Write-Host "  3. Archivo no se subió correctamente a S3"
    Write-Host ""
    Write-Host "Para reprocesar un documento:" -ForegroundColor Cyan
    Write-Host "  .\reprocess-document.ps1 -DocumentId <document-id>" -ForegroundColor White
    Write-Host ""
}

# Mostrar documentos en processing por mucho tiempo
if ($processing.Count -gt 0) {
    Write-Host "=== Documentos en Processing ===" -ForegroundColor Blue
    Write-Host ""
    
    foreach ($doc in $processing) {
        $docId = $doc.documentId.S
        $fileName = $doc.fileName.S
        $uploadedAt = $doc.uploadedAt.S
        
        $uploadTime = [DateTime]::Parse($uploadedAt)
        $elapsed = (Get-Date) - $uploadTime
        
        if ($elapsed.TotalMinutes -gt 5) {
            Write-Host "Document ID: $docId" -ForegroundColor White
            Write-Host "  File: $fileName"
            Write-Host "  Uploaded: $uploadedAt"
            Write-Host "  Time elapsed: $($elapsed.TotalMinutes.ToString('F1')) minutes" -ForegroundColor Red
            Write-Host "  WARNING: Processing for too long!" -ForegroundColor Red
            Write-Host ""
        }
    }
}

# Limpiar archivo temporal
Remove-Item "temp-docs.json" -ErrorAction SilentlyContinue

Write-Host "=== Verificación Completa ===" -ForegroundColor Green
