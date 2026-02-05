# Check Processing Logs
# Shows recent logs from all Lambda functions involved in document processing

param(
    [int]$Minutes = 5
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Document Processing Logs" -ForegroundColor Cyan
Write-Host "  (Last $Minutes minutes)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$functions = @(
    "StepFunctionsTrigger-prod",
    "BedrockProcessor-prod",
    "ErrorHandler-prod"
)

foreach ($func in $functions) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  $func" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    try {
        aws logs tail "/aws/lambda/$func" --since "${Minutes}m" --format short 2>&1 | Out-String
    } catch {
        Write-Host "No logs found or error: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step Functions Executions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get recent Step Functions executions
aws stepfunctions list-executions `
    --state-machine-arn "arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-prod" `
    --max-results 5 `
    --query "executions[*].{Name:name,Status:status,StartDate:startDate,StopDate:stopDate}" `
    --output table

Write-Host ""
Write-Host "Para monitorear en tiempo real, ejecuta:" -ForegroundColor Yellow
Write-Host "  aws logs tail /aws/lambda/BedrockProcessor-prod --follow" -ForegroundColor Gray
Write-Host ""
