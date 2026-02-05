# Watch Logs - Refresh every 5 seconds
# Shows the most recent logs from document processing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Watching Document Processing Logs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sube un documento ahora en: https://d2twnt4egn896m.cloudfront.net" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

$lastCheck = Get-Date

while ($true) {
    Clear-Host
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Document Processing Logs" -ForegroundColor Cyan
    Write-Host "  Last updated: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # StepFunctionsTrigger
    Write-Host "--- StepFunctionsTrigger-prod ---" -ForegroundColor Green
    $trigger = aws logs tail /aws/lambda/StepFunctionsTrigger-prod --since 2m --format short 2>&1 | Select-Object -Last 5
    if ($trigger) {
        $trigger | ForEach-Object { Write-Host $_ -ForegroundColor White }
    } else {
        Write-Host "No recent logs" -ForegroundColor Gray
    }
    Write-Host ""
    
    # BedrockProcessor
    Write-Host "--- BedrockProcessor-prod ---" -ForegroundColor Green
    $processor = aws logs tail /aws/lambda/BedrockProcessor-prod --since 2m --format short 2>&1 | Select-Object -Last 10
    if ($processor) {
        $processor | ForEach-Object { 
            if ($_ -match "ERROR|Error|error") {
                Write-Host $_ -ForegroundColor Red
            } elseif ($_ -match "SUCCESS|Successfully|success") {
                Write-Host $_ -ForegroundColor Green
            } else {
                Write-Host $_ -ForegroundColor White
            }
        }
    } else {
        Write-Host "No recent logs" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Step Functions Executions
    Write-Host "--- Recent Executions ---" -ForegroundColor Green
    $executions = aws stepfunctions list-executions `
        --state-machine-arn "arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-prod" `
        --max-results 3 `
        --query "executions[*].{Status:status,Start:startDate}" `
        --output text 2>&1
    
    if ($executions) {
        $executions | ForEach-Object {
            if ($_ -match "SUCCEEDED") {
                Write-Host $_ -ForegroundColor Green
            } elseif ($_ -match "FAILED") {
                Write-Host $_ -ForegroundColor Red
            } elseif ($_ -match "RUNNING") {
                Write-Host $_ -ForegroundColor Yellow
            } else {
                Write-Host $_ -ForegroundColor White
            }
        }
    }
    
    Write-Host ""
    Write-Host "Refreshing in 5 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}
