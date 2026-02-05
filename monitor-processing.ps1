# Monitor Document Processing in Real-Time
# This script monitors all Lambda functions involved in document processing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Monitoring Document Processing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sube un documento en la aplicación y observa los logs aquí" -ForegroundColor Yellow
Write-Host "URL: https://d2twnt4egn896m.cloudfront.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el monitoreo" -ForegroundColor Gray
Write-Host ""

# Function to display logs with color
function Show-Logs {
    param(
        [string]$FunctionName,
        [string]$Color = "White"
    )
    
    Write-Host "========================================" -ForegroundColor $Color
    Write-Host "  $FunctionName" -ForegroundColor $Color
    Write-Host "========================================" -ForegroundColor $Color
    
    aws logs tail "/aws/lambda/$FunctionName" --since 5m --format short --follow
}

# Monitor in sequence (you can open multiple terminals for parallel monitoring)
Write-Host "Monitoreando StepFunctionsTrigger..." -ForegroundColor Green
Write-Host ""

try {
    Show-Logs -FunctionName "StepFunctionsTrigger-prod" -Color "Green"
} catch {
    Write-Host "Error monitoreando logs: $_" -ForegroundColor Red
}
