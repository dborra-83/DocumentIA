# 🚀 Ejecutar Ahora - Deployment a Producción

## Comandos para Ejecutar AHORA MISMO

### Paso 1: Actualizar GitHub (2 minutos)

```powershell
# Commit y push de todos los cambios
.\update-github.ps1 -CommitMessage "Production ready: CloudFront + deployment automation + CI/CD"
```

**Esto hará**:
- ✅ Git add de todos los cambios
- ✅ Commit con el mensaje
- ✅ Push a GitHub (main branch)

---

### Paso 2: Desplegar a AWS (10-15 minutos)

```powershell
# Deployment completo a producción
.\deploy-production.ps1 -Environment prod
```

**Esto hará**:
1. ✅ Verificar prerequisitos (AWS CLI, Node, Python, CDK)
2. ✅ Ejecutar tests (backend y frontend)
3. ✅ Build de Lambda packages (5 funciones)
4. ✅ Deploy infraestructura con CDK
5. ✅ Build del frontend (React)
6. ✅ Upload a S3
7. ✅ Invalidar CloudFront cache
8. ✅ Mostrar URL de la aplicación

**Confirmación**: El script pedirá confirmación antes de desplegar a producción.

---

### Paso 3: Crear Usuario de Prueba (1 minuto)

```powershell
# Obtener User Pool ID del output de CDK
$USER_POOL_ID = aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text

# Crear usuario admin
aws cognito-idp admin-create-user `
  --user-pool-id $USER_POOL_ID `
  --username admin@documentia.com `
  --user-attributes Name=email,Value=admin@documentia.com Name=email_verified,Value=true `
  --temporary-password "TempPass123!" `
  --message-action SUPPRESS

# Establecer password permanente
aws cognito-idp admin-set-user-password `
  --user-pool-id $USER_POOL_ID `
  --username admin@documentia.com `
  --password "Admin123!Pass" `
  --permanent

Write-Host "✅ Usuario creado: admin@documentia.com / Admin123!Pass" -ForegroundColor Green
```

---

### Paso 4: Obtener URL de la Aplicación (30 segundos)

```powershell
# Obtener URL de CloudFront
$CLOUDFRONT_URL = aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ¡Deployment Completo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URL de la aplicación: $CLOUDFRONT_URL" -ForegroundColor Cyan
Write-Host "Usuario: admin@documentia.com" -ForegroundColor Cyan
Write-Host "Password: Admin123!Pass" -ForegroundColor Cyan
Write-Host ""

# Abrir en navegador
Start-Process $CLOUDFRONT_URL
```

---

## Verificación Rápida

### Ver Recursos Creados

```powershell
# Ver stack de CloudFormation
aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod

# Ver buckets S3
aws s3 ls | Select-String "document-analysis"

# Ver Lambda functions
aws lambda list-functions --query "Functions[?contains(FunctionName, 'DocumentAnalysis')].[FunctionName]" --output table

# Ver CloudFront distribution
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='DocumentAnalysis prod distribution'].[Id,DomainName]" --output table
```

### Ver Logs en Tiempo Real

```powershell
# Logs de Bedrock Processor
aws logs tail /aws/lambda/BedrockProcessor-prod --follow

# Logs de API Gateway
aws logs tail /aws/apigateway/DocumentAnalysisApi-prod --follow
```

---

## Troubleshooting Rápido

### Si el deployment falla:

```powershell
# 1. Verificar credenciales AWS
aws sts get-caller-identity

# 2. Verificar región
aws configure get region

# 3. Bootstrap CDK (si es primera vez)
cd infrastructure
cdk bootstrap aws://520754296204/us-east-1

# 4. Intentar deployment manual
cdk deploy --all --context environment=prod --require-approval never
```

### Si el frontend no carga:

```powershell
# Invalidar cache de CloudFront
$DISTRIBUTION_ID = aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text

aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

Write-Host "✅ Cache invalidado. Espera 2-3 minutos y recarga la página." -ForegroundColor Green
```

### Si Bedrock da error:

```powershell
Write-Host "Habilita acceso a Bedrock:" -ForegroundColor Yellow
Write-Host "1. Ve a AWS Console → Bedrock → Model access" -ForegroundColor White
Write-Host "2. Solicita acceso a 'Claude 3 Sonnet'" -ForegroundColor White
Write-Host "3. Espera aprobación (usualmente instantánea)" -ForegroundColor White
Write-Host "4. Vuelve a probar la aplicación" -ForegroundColor White
```

---

## Comandos Útiles Post-Deployment

### Monitoreo

```powershell
# Ver métricas de Lambda
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Invocations `
  --dimensions Name=FunctionName,Value=BedrockProcessor-prod `
  --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
  --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
  --period 300 `
  --statistics Sum

# Ver errores de API Gateway
aws cloudwatch get-metric-statistics `
  --namespace AWS/ApiGateway `
  --metric-name 4XXError `
  --dimensions Name=ApiName,Value=DocumentAnalysisApi-prod `
  --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
  --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
  --period 300 `
  --statistics Sum
```

### Gestión de Usuarios

```powershell
# Listar usuarios de Cognito
aws cognito-idp list-users --user-pool-id $USER_POOL_ID

# Crear otro usuario
aws cognito-idp admin-create-user `
  --user-pool-id $USER_POOL_ID `
  --username usuario@example.com `
  --user-attributes Name=email,Value=usuario@example.com Name=email_verified,Value=true `
  --temporary-password "TempPass123!" `
  --message-action SUPPRESS

# Eliminar usuario
aws cognito-idp admin-delete-user `
  --user-pool-id $USER_POOL_ID `
  --username usuario@example.com
```

### Actualizar Frontend

```powershell
# Si haces cambios en el frontend
cd frontend
npm run build

$BUCKET_NAME = aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='WebHostingBucketName'].OutputValue" --output text

aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

$DISTRIBUTION_ID = aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text

aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

Write-Host "✅ Frontend actualizado" -ForegroundColor Green
```

---

## Resumen de Comandos

```powershell
# 1. Actualizar GitHub
.\update-github.ps1 -CommitMessage "Production ready"

# 2. Desplegar a AWS
.\deploy-production.ps1 -Environment prod

# 3. Crear usuario
# (Ver comandos arriba)

# 4. Obtener URL
# (Ver comandos arriba)

# 5. Abrir aplicación
Start-Process $CLOUDFRONT_URL
```

---

## ¿Necesitas Ayuda?

- **Guía Completa**: Ver `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Resumen**: Ver `PRODUCTION_READY_SUMMARY.md`
- **GitHub Issues**: https://github.com/dborra-83/DocumentIA/issues

---

**¡Listo para desplegar!** Ejecuta los comandos en orden 🚀
