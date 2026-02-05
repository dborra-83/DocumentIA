# Guía de Deployment a Producción - DocumentIA

Esta guía te llevará paso a paso para desplegar DocumentIA en AWS con CloudFront, Cognito y todos los servicios necesarios para producción.

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Deployment Automático](#deployment-automático)
4. [Deployment Manual](#deployment-manual)
5. [Configuración Post-Deployment](#configuración-post-deployment)
6. [Verificación](#verificación)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

### Software Requerido

- **Node.js 18+** y npm
- **Python 3.12+** y pip
- **AWS CLI** configurado con credenciales
- **AWS CDK CLI**: `npm install -g aws-cdk`
- **Git** para control de versiones

### Permisos AWS Requeridos

Tu usuario/rol de AWS debe tener permisos para:
- CloudFormation (crear/actualizar stacks)
- S3 (crear buckets, subir objetos)
- Lambda (crear funciones, layers)
- API Gateway (crear APIs)
- CloudFront (crear distribuciones)
- Cognito (crear user pools)
- DynamoDB (crear tablas)
- IAM (crear roles y políticas)
- Step Functions (crear state machines)
- CloudWatch (crear logs, métricas, alarmas)

### Verificar Prerequisitos

```powershell
# Verificar instalaciones
node --version    # Debe ser 18+
python --version  # Debe ser 3.12+
aws --version
cdk --version
git --version

# Verificar credenciales AWS
aws sts get-caller-identity
```

---

## Configuración Inicial

### 1. Clonar el Repositorio

```powershell
git clone https://github.com/dborra-83/DocumentIA.git
cd DocumentIA
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# AWS Configuration
AWS_ACCOUNT_ID=520754296204
AWS_REGION=us-east-1
ENVIRONMENT=prod

# Optional: Custom Domain
# DOMAIN_NAME=documentia.example.com
# CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/xxx
```

### 3. Instalar Dependencias

```powershell
# CDK dependencies
cd infrastructure
npm install

# Backend dependencies
cd ../backend
pip install -r requirements.txt

# Frontend dependencies
cd ../frontend
npm install

cd ..
```

---

## Deployment Automático

### Opción 1: Script Completo (Recomendado)

Este script hace todo el proceso automáticamente:

```powershell
# Deployment a producción
.\deploy-production.ps1 -Environment prod

# Deployment a staging
.\deploy-production.ps1 -Environment staging

# Con dominio personalizado
.\deploy-production.ps1 -Environment prod -DomainName "app.documentia.com" -CertificateArn "arn:aws:acm:..."

# Saltar tests (más rápido)
.\deploy-production.ps1 -Environment prod -SkipTests
```

El script ejecuta:
1. ✅ Verificación de prerequisitos
2. ✅ Tests (backend y frontend)
3. ✅ Build de Lambda packages
4. ✅ Deployment de infraestructura (CDK)
5. ✅ Build del frontend
6. ✅ Upload a S3
7. ✅ Invalidación de CloudFront cache

### Opción 2: Actualizar GitHub y Desplegar

```powershell
# 1. Actualizar GitHub con últimos cambios
.\update-github.ps1 -CommitMessage "Production deployment v1.0"

# 2. Desplegar a AWS
.\deploy-production.ps1 -Environment prod
```

---

## Deployment Manual

Si prefieres control total sobre cada paso:

### Paso 1: Tests

```powershell
# Backend tests
cd backend
python -m pytest -v

# Frontend tests
cd ../frontend
npm test -- --run
```

### Paso 2: Build Lambda Packages

```powershell
# Shared layer
cd backend/shared
pip install -r requirements.txt -t python/ --upgrade
Copy-Item "*.py" "python/"
Compress-Archive -Path "python/*" -DestinationPath "layer.zip" -Force

# Document Upload
cd ../document-upload
pip install -r requirements.txt -t . --upgrade
Compress-Archive -Path "*" -DestinationPath "package.zip" -Force

# Bedrock Processor
cd ../bedrock-processor
pip install -r requirements.txt -t . --upgrade
Compress-Archive -Path "*" -DestinationPath "package.zip" -Force

# Step Functions Trigger
cd ../step-functions-trigger
pip install -r requirements.txt -t . --upgrade
Compress-Archive -Path "*" -DestinationPath "package.zip" -Force

# Document Delete
cd ../document-delete
pip install -r requirements.txt -t . --upgrade
Compress-Archive -Path "*" -DestinationPath "package.zip" -Force
```

### Paso 3: Deploy Infraestructura

```powershell
cd ../../infrastructure

# Bootstrap CDK (solo primera vez)
cdk bootstrap aws://520754296204/us-east-1

# Build CDK
npm run build

# Deploy
cdk deploy --all --context environment=prod --require-approval never

# Guardar outputs
cdk deploy --all --outputs-file ../cdk-outputs.json --context environment=prod
```

### Paso 4: Build y Deploy Frontend

```powershell
cd ../frontend

# Crear .env.production con valores del CDK
# (Usar valores de cdk-outputs.json)

# Build
npm run build

# Deploy a S3
$BUCKET_NAME = "document-analysis-web-520754296204-prod"
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Invalidar CloudFront cache
$DISTRIBUTION_ID = "E1234567890ABC"  # Del output de CDK
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

---

## Configuración Post-Deployment

### 1. Crear Usuario de Prueba en Cognito

```powershell
# Obtener User Pool ID del output de CDK
$USER_POOL_ID = "us-east-1_XXXXXXXXX"

# Crear usuario
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
```

### 2. Configurar Dominio Personalizado (Opcional)

Si tienes un dominio personalizado:

1. **Crear certificado SSL en ACM** (us-east-1 para CloudFront):
   ```powershell
   aws acm request-certificate `
     --domain-name app.documentia.com `
     --validation-method DNS `
     --region us-east-1
   ```

2. **Validar el certificado** siguiendo las instrucciones de AWS

3. **Re-desplegar con dominio**:
   ```powershell
   .\deploy-production.ps1 -Environment prod `
     -DomainName "app.documentia.com" `
     -CertificateArn "arn:aws:acm:us-east-1:520754296204:certificate/xxx"
   ```

4. **Configurar DNS** (Route 53 o tu proveedor):
   - Tipo: CNAME o ALIAS
   - Nombre: app.documentia.com
   - Valor: [CloudFront Domain Name]

### 3. Configurar Alarmas de CloudWatch

```powershell
# Crear alarma para errores de API
aws cloudwatch put-metric-alarm `
  --alarm-name "DocumentIA-API-Errors-Prod" `
  --alarm-description "Alert when API error rate is high" `
  --metric-name 4XXError `
  --namespace AWS/ApiGateway `
  --statistic Sum `
  --period 300 `
  --evaluation-periods 2 `
  --threshold 10 `
  --comparison-operator GreaterThanThreshold

# Crear alarma para Lambda errors
aws cloudwatch put-metric-alarm `
  --alarm-name "DocumentIA-Lambda-Errors-Prod" `
  --alarm-description "Alert when Lambda functions fail" `
  --metric-name Errors `
  --namespace AWS/Lambda `
  --statistic Sum `
  --period 300 `
  --evaluation-periods 1 `
  --threshold 5 `
  --comparison-operator GreaterThanThreshold
```

### 4. Habilitar Bedrock Model Access

1. Ve a AWS Console → Bedrock → Model access
2. Solicita acceso a **Claude 3 Sonnet**
3. Espera aprobación (usualmente instantánea)

---

## Verificación

### 1. Verificar Infraestructura

```powershell
# Verificar stack de CloudFormation
aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod

# Verificar buckets S3
aws s3 ls | Select-String "document-analysis"

# Verificar Lambda functions
aws lambda list-functions --query "Functions[?contains(FunctionName, 'DocumentAnalysis')]"

# Verificar API Gateway
aws apigateway get-rest-apis --query "items[?name=='DocumentAnalysisApi-prod']"

# Verificar CloudFront distribution
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='DocumentAnalysis prod distribution']"
```

### 2. Verificar Frontend

```powershell
# Obtener URL de CloudFront
$CLOUDFRONT_URL = aws cloudformation describe-stacks `
  --stack-name DocumentAnalysisStack-prod `
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" `
  --output text

Write-Host "Application URL: $CLOUDFRONT_URL"

# Abrir en navegador
Start-Process $CLOUDFRONT_URL
```

### 3. Test End-to-End

1. **Login**: Accede con el usuario creado
2. **Upload**: Sube un documento de prueba
3. **Analysis**: Verifica que el análisis se complete
4. **History**: Revisa el historial de documentos
5. **Delete**: Prueba eliminar un documento
6. **Language**: Cambia entre español e inglés

### 4. Verificar Logs

```powershell
# Ver logs de Lambda
aws logs tail /aws/lambda/BedrockProcessor-prod --follow

# Ver logs de API Gateway
aws logs tail /aws/apigateway/DocumentAnalysisApi-prod --follow
```

---

## Troubleshooting

### Problema: CDK Bootstrap Falla

**Solución**:
```powershell
# Verificar permisos
aws sts get-caller-identity

# Bootstrap con permisos explícitos
cdk bootstrap aws://520754296204/us-east-1 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

### Problema: Frontend No Carga

**Solución**:
```powershell
# Verificar que los archivos están en S3
aws s3 ls s3://document-analysis-web-520754296204-prod/

# Verificar CloudFront distribution
aws cloudfront get-distribution --id E1234567890ABC

# Invalidar cache
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"

# Verificar .env.production tiene las URLs correctas
cat frontend/.env.production
```

### Problema: API Gateway CORS Errors

**Solución**:
```powershell
# Verificar que API Gateway tiene CORS habilitado
# Re-desplegar API Gateway
cd infrastructure
cdk deploy --all --context environment=prod
```

### Problema: Bedrock Access Denied

**Solución**:
1. Ve a AWS Console → Bedrock → Model access
2. Solicita acceso a Claude 3 Sonnet
3. Espera aprobación
4. Verifica IAM role tiene permisos:
   ```json
   {
     "Effect": "Allow",
     "Action": "bedrock:InvokeModel",
     "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-*"
   }
   ```

### Problema: Lambda Timeout

**Solución**:
```powershell
# Aumentar timeout de Lambda
aws lambda update-function-configuration `
  --function-name BedrockProcessor-prod `
  --timeout 300

# Aumentar memoria (mejora performance)
aws lambda update-function-configuration `
  --function-name BedrockProcessor-prod `
  --memory-size 1024
```

### Problema: S3 Upload Fails

**Solución**:
```powershell
# Verificar CORS en bucket
aws s3api get-bucket-cors --bucket document-analysis-documents-520754296204-prod

# Verificar permisos de Lambda
aws lambda get-function --function-name DocumentUploadHandler-prod
```

---

## Costos Estimados

### Ambiente de Desarrollo (uso bajo)
- **S3**: ~$1-5/mes
- **Lambda**: ~$5-10/mes
- **DynamoDB**: ~$1-5/mes (on-demand)
- **API Gateway**: ~$3-10/mes
- **CloudFront**: ~$1-5/mes
- **Bedrock**: ~$10-50/mes (depende del uso)
- **Total**: ~$20-85/mes

### Ambiente de Producción (uso medio)
- **S3**: ~$10-30/mes
- **Lambda**: ~$20-100/mes
- **DynamoDB**: ~$10-50/mes
- **API Gateway**: ~$10-50/mes
- **CloudFront**: ~$10-50/mes
- **Bedrock**: ~$100-500/mes
- **Total**: ~$160-780/mes

**Nota**: Los costos de Bedrock varían significativamente según el volumen de documentos procesados.

---

## Limpieza (Destruir Recursos)

⚠️ **CUIDADO**: Esto eliminará TODOS los recursos y datos.

```powershell
# Eliminar stack de CDK
cd infrastructure
cdk destroy --all --context environment=prod

# Eliminar buckets S3 manualmente (si tienen objetos)
aws s3 rm s3://document-analysis-documents-520754296204-prod --recursive
aws s3 rb s3://document-analysis-documents-520754296204-prod

aws s3 rm s3://document-analysis-results-520754296204-prod --recursive
aws s3 rb s3://document-analysis-results-520754296204-prod

aws s3 rm s3://document-analysis-web-520754296204-prod --recursive
aws s3 rb s3://document-analysis-web-520754296204-prod
```

---

## Próximos Pasos

1. ✅ **Monitoreo**: Configurar CloudWatch dashboards
2. ✅ **Alertas**: Configurar SNS para notificaciones
3. ✅ **Backup**: Configurar backups de DynamoDB
4. ✅ **CI/CD**: Implementar GitHub Actions
5. ✅ **Testing**: Agregar más tests E2E
6. ✅ **Documentación**: Crear guía de usuario
7. ✅ **Performance**: Optimizar Lambda cold starts
8. ✅ **Security**: Implementar WAF en CloudFront

---

## Soporte

- **GitHub Issues**: https://github.com/dborra-83/DocumentIA/issues
- **Email**: support@documentia.com
- **Documentación**: https://github.com/dborra-83/DocumentIA/wiki

---

**¡Felicidades! Tu aplicación está en producción en AWS** 🎉
