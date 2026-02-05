# Script para desplegar la función Lambda de eliminación de documentos

Write-Host "=== Desplegando DocumentDelete Lambda ===" -ForegroundColor Cyan
Write-Host ""

$FUNCTION_NAME = "DocumentDelete-dev"
$REGION = "us-east-1"
$ACCOUNT_ID = "520754296204"

# 1. Crear el paquete ZIP
Write-Host "1. Creando paquete ZIP..." -ForegroundColor Yellow

Set-Location backend/document-delete

# Limpiar paquete anterior
if (Test-Path "package.zip") {
    Remove-Item "package.zip"
}

# Crear ZIP con el handler
Compress-Archive -Path "handler.py" -DestinationPath "package.zip" -Force

Write-Host "  Paquete creado: package.zip" -ForegroundColor Green
Write-Host ""

# 2. Verificar si la función existe
Write-Host "2. Verificando si la función existe..." -ForegroundColor Yellow

$functionExists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Función existe, actualizando código..." -ForegroundColor Blue
    
    # Actualizar código
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file fileb://package.zip `
        --region $REGION | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Código actualizado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "  Error al actualizar código" -ForegroundColor Red
        Set-Location ../..
        exit 1
    }
} else {
    Write-Host "  Función no existe, creando..." -ForegroundColor Blue
    
    # Crear la función
    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime python3.12 `
        --role "arn:aws:iam::${ACCOUNT_ID}:role/DocumentAnalysis-DocumentDeleteRole-dev" `
        --handler handler.lambda_handler `
        --zip-file fileb://package.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={DOCUMENTS_TABLE_NAME=DocumentAnalysis-Documents-dev,RESULTS_TABLE_NAME=DocumentAnalysis-Results-dev,DOCUMENTS_BUCKET_NAME=document-analysis-documents-520754296204-dev,RESULTS_BUCKET_NAME=document-analysis-results-520754296204-dev}" `
        --region $REGION | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Función creada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "  Error al crear función" -ForegroundColor Red
        Set-Location ../..
        exit 1
    }
}

Write-Host ""

# 3. Agregar permisos para API Gateway
Write-Host "3. Configurando permisos..." -ForegroundColor Yellow

$API_ID = "jo17j8ghzf"

# Remover permiso anterior si existe
aws lambda remove-permission `
    --function-name $FUNCTION_NAME `
    --statement-id apigateway-delete-document `
    --region $REGION 2>&1 | Out-Null

# Agregar nuevo permiso
aws lambda add-permission `
    --function-name $FUNCTION_NAME `
    --statement-id apigateway-delete-document `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" `
    --region $REGION | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Permisos configurados" -ForegroundColor Green
} else {
    Write-Host "  Advertencia: Error al configurar permisos" -ForegroundColor Yellow
}

Write-Host ""

# 4. Crear endpoint en API Gateway
Write-Host "4. Configurando API Gateway..." -ForegroundColor Yellow

# Obtener el resource ID de /documents
$resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json | ConvertFrom-Json

$documentsResource = $resources.items | Where-Object { $_.path -eq '/documents' }

if ($documentsResource) {
    $PARENT_ID = $documentsResource.id
    Write-Host "  Resource /documents encontrado: $PARENT_ID" -ForegroundColor Green
    
    # Buscar si ya existe el resource {documentId}
    $docIdResource = $resources.items | Where-Object { $_.pathPart -eq '{documentId}' -and $_.parentId -eq $PARENT_ID }
    
    if (-not $docIdResource) {
        Write-Host "  Creando resource {documentId}..." -ForegroundColor Blue
        
        $createResourceResult = aws apigateway create-resource `
            --rest-api-id $API_ID `
            --parent-id $PARENT_ID `
            --path-part '{documentId}' `
            --region $REGION --output json | ConvertFrom-Json
        
        $RESOURCE_ID = $createResourceResult.id
        Write-Host "  Resource creado: $RESOURCE_ID" -ForegroundColor Green
    } else {
        $RESOURCE_ID = $docIdResource.id
        Write-Host "  Resource {documentId} ya existe: $RESOURCE_ID" -ForegroundColor Green
    }
    
    # Crear método DELETE
    Write-Host "  Configurando método DELETE..." -ForegroundColor Blue
    
    # Eliminar método anterior si existe
    aws apigateway delete-method `
        --rest-api-id $API_ID `
        --resource-id $RESOURCE_ID `
        --http-method DELETE `
        --region $REGION 2>&1 | Out-Null
    
    # Crear método DELETE
    aws apigateway put-method `
        --rest-api-id $API_ID `
        --resource-id $RESOURCE_ID `
        --http-method DELETE `
        --authorization-type COGNITO_USER_POOLS `
        --authorizer-id "72gndd" `
        --region $REGION | Out-Null
    
    # Configurar integración con Lambda
    $LAMBDA_ARN = "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"
    
    aws apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $RESOURCE_ID `
        --http-method DELETE `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" `
        --region $REGION | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Método DELETE configurado" -ForegroundColor Green
    } else {
        Write-Host "  Error al configurar método DELETE" -ForegroundColor Red
    }
    
    # Desplegar API
    Write-Host "  Desplegando API..." -ForegroundColor Blue
    
    aws apigateway create-deployment `
        --rest-api-id $API_ID `
        --stage-name dev `
        --region $REGION | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  API desplegada" -ForegroundColor Green
    } else {
        Write-Host "  Error al desplegar API" -ForegroundColor Red
    }
} else {
    Write-Host "  Error: Resource /documents no encontrado" -ForegroundColor Red
}

Set-Location ../..

Write-Host ""
Write-Host "=== Deployment Completo ===" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoint disponible:" -ForegroundColor Cyan
Write-Host "  DELETE https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents/{documentId}" -ForegroundColor White
Write-Host ""
Write-Host "Uso:" -ForegroundColor Cyan
Write-Host "  curl -X DELETE https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents/{documentId} \" -ForegroundColor White
Write-Host "       -H 'Authorization: Bearer <token>'" -ForegroundColor White
