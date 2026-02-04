# Solución a Errores CORS y API 502

**Fecha:** 30 de enero de 2026  
**Problemas:**
1. ❌ Error CORS: "No 'Access-Control-Allow-Origin' header"
2. ❌ Error 502 Bad Gateway en `/upload`

---

## 🔍 Diagnóstico

### Error 1: CORS
```
Access to XMLHttpRequest at 'https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/upload' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Causa:** El Lambda está devolviendo un error 502 ANTES de que API Gateway pueda agregar los headers CORS.

### Error 2: 502 Bad Gateway
```
POST https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/upload 
net::ERR_FAILED 502 (Bad Gateway)
```

**Causa:** El Lambda `DocumentUploadHandler` está fallando. Posibles razones:
1. Variables de entorno no configuradas
2. Permisos IAM faltantes
3. Error en el código del Lambda
4. Timeout del Lambda

---

## ✅ Soluciones

### Paso 1: Verificar Variables de Entorno del Lambda

Ejecuta este comando para ver las variables de entorno:

```powershell
aws lambda get-function-configuration --function-name DocumentUploadHandler-dev --query "Environment.Variables"
```

**Debe mostrar:**
```json
{
  "DOCUMENTS_BUCKET_NAME": "document-analysis-documents-520754296204-dev",
  "DOCUMENTS_TABLE_NAME": "DocumentAnalysis-Documents-dev",
  "PRESIGNED_URL_EXPIRATION": "900"
}
```

**Si falta alguna variable**, actualiza el Lambda construct en CDK y redespliega.

---

### Paso 2: Verificar Logs de CloudWatch

Ejecuta este comando para ver los logs recientes:

```powershell
aws logs tail /aws/lambda/DocumentUploadHandler-dev --since 10m --format short
```

**Busca errores como:**
- `KeyError: 'DOCUMENTS_BUCKET_NAME'` → Variables de entorno faltantes
- `AccessDenied` → Permisos IAM faltantes
- `Task timed out` → Lambda timeout (aumentar timeout)
- `ImportError` → Dependencias faltantes

---

### Paso 3: Verificar Permisos IAM

El Lambda necesita permisos para:
1. **S3**: `s3:PutObject`, `s3:GetObject` en el bucket de documentos
2. **DynamoDB**: `dynamodb:PutItem` en la tabla Documents
3. **CloudWatch Logs**: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

Verifica el rol IAM:

```powershell
aws lambda get-function-configuration --function-name DocumentUploadHandler-dev --query "Role"
```

Luego verifica las políticas del rol:

```powershell
# Reemplaza <ROLE_NAME> con el nombre del rol
aws iam list-attached-role-policies --role-name <ROLE_NAME>
aws iam list-role-policies --role-name <ROLE_NAME>
```

---

### Paso 4: Probar el Lambda Directamente

Crea un archivo `test-event.json`:

```json
{
  "body": "{\"fileName\":\"test.pdf\",\"fileType\":\"pdf\",\"fileSize\":1024,\"vertical\":\"healthcare\"}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-123",
        "email": "admin@documentia.com"
      }
    }
  }
}
```

Invoca el Lambda:

```powershell
aws lambda invoke --function-name DocumentUploadHandler-dev --payload file://test-event.json response.json
cat response.json
```

**Respuesta esperada:**
```json
{
  "statusCode": 200,
  "body": "{\"uploadUrl\":\"https://...\",\"documentId\":\"...\",\"expiresIn\":900}"
}
```

---

### Paso 5: Redesplegar el Stack (Si es necesario)

Si las variables de entorno o permisos están mal configurados:

```powershell
cd infrastructure
cdk deploy --all --context environment=dev
```

---

## 🔧 Solución Rápida: Verificar y Corregir

### Opción 1: Verificar el Stack Actual

```powershell
# Ver todos los recursos del stack
aws cloudformation describe-stack-resources --stack-name DocumentAnalysis-dev --query "StackResources[?ResourceType=='AWS::Lambda::Function'].PhysicalResourceId"

# Ver el estado del Lambda
aws lambda get-function --function-name DocumentUploadHandler-dev
```

### Opción 2: Actualizar Variables de Entorno Manualmente (Temporal)

```powershell
aws lambda update-function-configuration `
  --function-name DocumentUploadHandler-dev `
  --environment "Variables={DOCUMENTS_BUCKET_NAME=document-analysis-documents-520754296204-dev,DOCUMENTS_TABLE_NAME=DocumentAnalysis-Documents-dev,PRESIGNED_URL_EXPIRATION=900}"
```

### Opción 3: Verificar el Construct de Lambda Functions

Abre `infrastructure/lib/lambda-functions-construct.ts` y verifica que el DocumentUploadHandler tenga:

```typescript
const documentUploadHandler = new lambda.Function(this, 'DocumentUploadHandler', {
  // ... otras configuraciones
  environment: {
    DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName,
    DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
    PRESIGNED_URL_EXPIRATION: '900',
  },
});
```

---

## 🧪 Prueba Alternativa: Usar Postman o cURL

Mientras arreglas el Lambda, puedes probar con Postman:

### 1. Obtener Token de Cognito

```powershell
aws cognito-idp initiate-auth `
  --auth-flow USER_PASSWORD_AUTH `
  --client-id 19j2lqlt7fc5e9ut0k5re692aj `
  --auth-parameters USERNAME=admin@documentia.com,PASSWORD=Admin123!Pass `
  --query "AuthenticationResult.IdToken" `
  --output text
```

### 2. Probar el Endpoint con cURL

```powershell
# Reemplaza <TOKEN> con el token del paso anterior
curl -X POST https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/upload `
  -H "Authorization: Bearer <TOKEN>" `
  -H "Content-Type: application/json" `
  -d '{\"fileName\":\"test.pdf\",\"fileType\":\"pdf\",\"fileSize\":1024,\"vertical\":\"healthcare\"}'
```

---

## 📋 Checklist de Diagnóstico

- [ ] Variables de entorno configuradas en el Lambda
- [ ] Permisos IAM correctos (S3, DynamoDB, CloudWatch)
- [ ] Lambda no tiene errores en CloudWatch Logs
- [ ] Lambda responde correctamente a invocaciones de prueba
- [ ] API Gateway tiene CORS configurado
- [ ] Cognito User Pool está activo
- [ ] Tokens de autenticación son válidos

---

## 🎯 Próximos Pasos

### Si el Lambda está fallando:
1. Revisa los logs de CloudWatch
2. Verifica variables de entorno
3. Verifica permisos IAM
4. Prueba el Lambda directamente
5. Redespliega si es necesario

### Si el Lambda funciona pero CORS falla:
1. Verifica que el Lambda devuelva headers CORS en TODAS las respuestas
2. Verifica que API Gateway tenga `defaultCorsPreflightOptions` configurado
3. Redespliega el API Gateway

### Si todo funciona en Postman pero no en el navegador:
1. Es un problema de CORS específico del navegador
2. Verifica que los headers `Access-Control-Allow-Origin` estén en la respuesta
3. Verifica que el método OPTIONS esté configurado (preflight)

---

## 💡 Comandos Útiles

```powershell
# Ver logs en tiempo real
aws logs tail /aws/lambda/DocumentUploadHandler-dev --follow

# Ver últimos 50 logs
aws logs tail /aws/lambda/DocumentUploadHandler-dev --since 1h

# Listar todas las funciones Lambda
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'Document')].FunctionName"

# Ver configuración completa del Lambda
aws lambda get-function --function-name DocumentUploadHandler-dev

# Ver el API Gateway
aws apigateway get-rest-apis --query "items[?name=='DocumentAnalysis-API-dev']"

# Probar el health endpoint (no requiere auth)
curl https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/health
```

---

## 🚨 Solución de Emergencia

Si nada funciona, redespliega todo el stack:

```powershell
cd infrastructure

# Destruir el stack actual
cdk destroy --all --context environment=dev

# Redesplegar desde cero
cdk deploy --all --context environment=dev
```

**⚠️ ADVERTENCIA:** Esto eliminará todos los datos en DynamoDB y S3.

---

## 📞 Información de Contacto

- **Stack Name:** DocumentAnalysis-dev
- **Region:** us-east-1
- **Account:** 520754296204
- **API URL:** https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/
- **Lambda:** DocumentUploadHandler-dev
- **Bucket:** document-analysis-documents-520754296204-dev
- **Table:** DocumentAnalysis-Documents-dev

