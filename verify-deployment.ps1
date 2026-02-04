# Script de Verificación Post-Despliegue
# Verifica que todos los recursos se hayan creado correctamente

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev'
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificación de Despliegue" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$stackName = "DocumentAnalysis-$Environment"
$allPassed = $true

# Función para verificar un recurso
function Test-Resource {
    param(
        [string]$Name,
        [scriptblock]$Test
    )
    
    Write-Host "Verificando $Name..." -NoNewline
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✅" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ❌" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "🔍 Verificando recursos de AWS..." -ForegroundColor Yellow
Write-Host ""

# 1. Verificar CloudFormation Stack
$passed = Test-Resource "CloudFormation Stack" {
    $stack = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].StackStatus' --output text 2>$null
    return $stack -eq "CREATE_COMPLETE" -or $stack -eq "UPDATE_COMPLETE"
}
$allPassed = $allPassed -and $passed

# 2. Verificar Lambda Functions
Write-Host ""
Write-Host "Lambda Functions:" -ForegroundColor Cyan

$lambdaFunctions = @(
    "DocumentUploadHandler-$Environment",
    "BedrockProcessor-$Environment",
    "HistoryManager-$Environment",
    "MetricsAggregator-$Environment",
    "ExportHandler-$Environment",
    "ErrorHandler-$Environment",
    "StepFunctionsTrigger-$Environment"
)

foreach ($func in $lambdaFunctions) {
    $passed = Test-Resource "  $func" {
        $result = aws lambda get-function --function-name $func 2>$null
        return $LASTEXITCODE -eq 0
    }
    $allPassed = $allPassed -and $passed
}

# 3. Verificar DynamoDB Tables
Write-Host ""
Write-Host "DynamoDB Tables:" -ForegroundColor Cyan

$tables = @(
    "DocumentAnalysis-Documents-$Environment",
    "DocumentAnalysis-Results-$Environment",
    "DocumentAnalysis-Metrics-$Environment"
)

foreach ($table in $tables) {
    $passed = Test-Resource "  $table" {
        $result = aws dynamodb describe-table --table-name $table 2>$null
        return $LASTEXITCODE -eq 0
    }
    $allPassed = $allPassed -and $passed
}

# 4. Verificar S3 Buckets
Write-Host ""
Write-Host "S3 Buckets:" -ForegroundColor Cyan

$accountId = (aws sts get-caller-identity --query 'Account' --output text)
$buckets = @(
    "document-analysis-documents-$accountId-$Environment",
    "document-analysis-results-$accountId-$Environment",
    "document-analysis-web-$accountId-$Environment"
)

foreach ($bucket in $buckets) {
    $passed = Test-Resource "  $bucket" {
        $result = aws s3 ls "s3://$bucket" 2>$null
        return $LASTEXITCODE -eq 0
    }
    $allPassed = $allPassed -and $passed
}

# 5. Verificar Cognito User Pool
Write-Host ""
Write-Host "Cognito User Pool:" -ForegroundColor Cyan

$passed = Test-Resource "  User Pool" {
    $userPoolId = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>$null
    if ($userPoolId) {
        $result = aws cognito-idp describe-user-pool --user-pool-id $userPoolId 2>$null
        return $LASTEXITCODE -eq 0
    }
    return $false
}
$allPassed = $allPassed -and $passed

# 6. Verificar API Gateway
Write-Host ""
Write-Host "API Gateway:" -ForegroundColor Cyan

$passed = Test-Resource "  REST API" {
    $apiId = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`ApiId`].OutputValue' --output text 2>$null
    if ($apiId) {
        $result = aws apigateway get-rest-api --rest-api-id $apiId 2>$null
        return $LASTEXITCODE -eq 0
    }
    return $false
}
$allPassed = $allPassed -and $passed

# 7. Verificar Step Functions
Write-Host ""
Write-Host "Step Functions:" -ForegroundColor Cyan

$passed = Test-Resource "  State Machine" {
    $stateMachines = aws stepfunctions list-state-machines --query "stateMachines[?contains(name, '$Environment')].name" --output text 2>$null
    return $stateMachines -ne ""
}
$allPassed = $allPassed -and $passed

# 8. Probar Health Endpoint
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Cyan

$apiUrl = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text 2>$null

if ($apiUrl) {
    $passed = Test-Resource "  Health Endpoint" {
        try {
            $response = Invoke-RestMethod -Uri "${apiUrl}health" -Method Get -TimeoutSec 10
            return $response.status -eq "healthy"
        } catch {
            return $false
        }
    }
    $allPassed = $allPassed -and $passed
} else {
    Write-Host "  Health Endpoint... ⚠️  No se pudo obtener la URL del API" -ForegroundColor Yellow
}

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  ✅ Todos los recursos verificados" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar información útil
    Write-Host "📋 Información del Despliegue:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($apiUrl) {
        Write-Host "API URL:" -ForegroundColor Yellow
        Write-Host "  $apiUrl" -ForegroundColor White
        Write-Host ""
    }
    
    $userPoolId = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>$null
    if ($userPoolId) {
        Write-Host "Cognito User Pool ID:" -ForegroundColor Yellow
        Write-Host "  $userPoolId" -ForegroundColor White
        Write-Host ""
    }
    
    $userPoolClientId = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text 2>$null
    if ($userPoolClientId) {
        Write-Host "Cognito App Client ID:" -ForegroundColor Yellow
        Write-Host "  $userPoolClientId" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Crear un usuario de prueba:" -ForegroundColor White
    Write-Host "     aws cognito-idp admin-create-user --user-pool-id $userPoolId --username test@example.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Probar el API:" -ForegroundColor White
    Write-Host "     curl ${apiUrl}health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Ver logs de Lambda:" -ForegroundColor White
    Write-Host "     aws logs tail /aws/lambda/BedrockProcessor-$Environment --follow" -ForegroundColor Gray
    Write-Host ""
    
    exit 0
} else {
    Write-Host "  ❌ Algunos recursos fallaron" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa los logs de CloudFormation:" -ForegroundColor Yellow
    Write-Host "  aws cloudformation describe-stack-events --stack-name $stackName" -ForegroundColor White
    Write-Host ""
    exit 1
}
