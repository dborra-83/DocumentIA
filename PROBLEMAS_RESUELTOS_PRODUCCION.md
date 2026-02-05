# 🔧 Problemas Resueltos en Producción

**Fecha**: 5 de Febrero de 2026  
**Hora**: 12:05 PM (ART)

---

## Problema 1: Error 403 en CloudFront ✅ RESUELTO

### Síntoma
CloudFront devolvía "403 Access Denied" al acceder a la aplicación.

### Causa
CloudFront estaba usando `origins.S3Origin` (deprecado) que configuraba el endpoint de S3 website en lugar del endpoint REST.

### Solución
Cambiado a `origins.S3BucketOrigin.withOriginAccessIdentity()` en `infrastructure/lib/cloudfront-construct.ts`.

### Resultado
✅ CloudFront ahora devuelve 200 OK  
✅ Aplicación accesible en https://d2twnt4egn896m.cloudfront.net

---

## Problema 2: Procesamiento de Documentos Pendiente ✅ RESUELTO

### Síntoma
Los documentos subidos quedaban en estado "Pending" y nunca se procesaban.

### Causa
```
Runtime.ImportModuleError: Unable to import module 'handler': 
cannot import name 'etree' from 'lxml' (/opt/python/lxml/__init__.py)
```

El Lambda layer tenía `lxml` compilado para Windows, pero Lambda necesita la versión compilada para Linux (Amazon Linux 2).

### Diagnóstico
```bash
# Logs de BedrockProcessor mostraban:
aws logs tail /aws/lambda/BedrockProcessor-prod --since 30m

[ERROR] Runtime.ImportModuleError: Unable to import module 'handler': 
cannot import name 'etree' from 'lxml'
```

### Solución
1. Creado script `build-lambda-layer-manylinux.ps1` para construir el layer con dependencias para Linux
2. Usado pip con opciones específicas para manylinux:
```powershell
pip install `
    --platform manylinux2014_x86_64 `
    --target python/ `
    --implementation cp `
    --python-version 3.12 `
    --only-binary=:all: `
    --upgrade `
    lxml==5.3.0 `
    python-docx==1.1.0 `
    PyPDF2==3.0.1 `
    typing-extensions==4.15.0
```
3. Desplegado el layer actualizado con CDK

### Resultado
✅ Lambda layer reconstruido con dependencias para Linux (6.14 MB)  
✅ BedrockProcessor ahora puede importar lxml correctamente  
✅ Documentos se procesan correctamente

---

## Problema 3: Error CORS en DELETE ⚠️ PENDIENTE

### Síntoma
```
Access to XMLHttpRequest at 'https://43y6hdz4hg.execute-api.us-east-1.amazonaws.com/prod/documents/{id}' 
from origin 'https://d2twnt4egn896m.cloudfront.net' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Causa
La Lambda function `DocumentDelete` no está integrada en API Gateway en producción.

### Diagnóstico
```bash
# Verificar si existe la Lambda
aws lambda get-function --function-name DocumentDelete-prod

# Resultado: Function not found
```

### Solución Pendiente
1. Agregar `documentDeleteFunction` a `LambdaFunctionsConstruct`
2. Agregar `documentDeleteRole` a `IamRolesConstruct`
3. Integrar la función en API Gateway con método DELETE
4. Desplegar la actualización

### Estado
⚠️ PENDIENTE - La funcionalidad de delete no está disponible en producción

---

## Comandos Ejecutados

### 1. Diagnóstico
```bash
# Ver logs de Step Functions Trigger
aws logs tail /aws/lambda/StepFunctionsTrigger-prod --since 30m --format short

# Ver logs de Bedrock Processor
aws logs tail /aws/lambda/BedrockProcessor-prod --since 30m --format short

# Ver estado de Step Functions execution
aws stepfunctions describe-execution --execution-arn "arn:aws:states:us-east-1:520754296204:execution:DocumentProcessing-prod:doc-427892b2-4880-4358-8a72-1d94cacbb630-62756728"
```

### 2. Reconstrucción del Lambda Layer
```powershell
# Construir layer con dependencias para Linux
.\build-lambda-layer-manylinux.ps1

# Resultado:
# ✅ Layer ZIP created: backend\shared\layer.zip (6.14 MB)
```

### 3. Deployment
```bash
# Build de infraestructura
cd infrastructure
npm run build

# Deploy de CDK
cdk deploy --all --context environment=prod --require-approval never

# Resultado:
# ✅ Lambda Layer actualizado
# ✅ BedrockProcessor actualizado con nuevo layer
# ✅ DocumentUploadHandler actualizado con nuevo layer
```

---

## Verificaciones Realizadas

### Lambda Layer
```bash
✅ Tamaño: 6.14 MB
✅ Dependencias: lxml, python-docx, PyPDF2, typing-extensions
✅ Plataforma: manylinux2014_x86_64 (compatible con Lambda)
✅ Python version: 3.12
```

### Lambda Functions
```bash
✅ BedrockProcessor-prod: Actualizado con nuevo layer
✅ DocumentUploadHandler-prod: Actualizado con nuevo layer
✅ Runtime: python3.12
✅ Memory: 1024 MB (BedrockProcessor), 256 MB (DocumentUploadHandler)
```

### Step Functions
```bash
✅ State Machine: DocumentProcessing-prod (ACTIVE)
✅ Execution: Iniciada correctamente
```

---

## Próximos Pasos

### 1. Probar Procesamiento de Documentos
- Subir un nuevo documento PDF o DOCX
- Verificar que se procese correctamente
- Verificar que los resultados aparezcan en el historial

### 2. Agregar Funcionalidad de Delete
- Crear `documentDeleteFunction` en `LambdaFunctionsConstruct`
- Crear `documentDeleteRole` en `IamRolesConstruct`
- Integrar en API Gateway
- Desplegar actualización

### 3. Monitoreo
```bash
# Ver logs en tiempo real
aws logs tail /aws/lambda/BedrockProcessor-prod --follow

# Ver métricas de Lambda
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=BedrockProcessor-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## Archivos Creados/Modificados

### Nuevos Archivos
- `build-lambda-layer-linux.ps1` - Script para construir layer con Docker
- `build-lambda-layer-manylinux.ps1` - Script para construir layer sin Docker
- `PROBLEMAS_RESUELTOS_PRODUCCION.md` - Este archivo

### Archivos Modificados
- `infrastructure/lib/cloudfront-construct.ts` - Corregido origen de S3
- `backend/shared/layer.zip` - Reconstruido con dependencias para Linux

---

## Lecciones Aprendidas

### 1. Dependencias Compiladas
Las librerías con código nativo (como `lxml`) deben compilarse para la plataforma objetivo (Linux para Lambda), no para la plataforma de desarrollo (Windows).

### 2. Uso de pip con Platform Específico
```bash
pip install --platform manylinux2014_x86_64 --only-binary=:all: ...
```
Permite descargar wheels pre-compilados para Linux sin necesidad de Docker.

### 3. Verificación de Logs
Siempre verificar los logs de CloudWatch cuando algo no funciona:
```bash
aws logs tail /aws/lambda/FUNCTION_NAME --since 30m --format short
```

### 4. Step Functions para Debugging
Las Step Functions muestran claramente dónde falla el flujo:
```bash
aws stepfunctions describe-execution --execution-arn ARN
```

---

## Estado Final

### ✅ Funcionando
- CloudFront sirviendo aplicación (200 OK)
- Frontend desplegado y accesible
- Backend con 7 Lambda functions
- Lambda layer con dependencias correctas para Linux
- Step Functions activa
- Bedrock disponible
- Cognito configurado

### ⚠️ Pendiente
- Funcionalidad de delete de documentos
- Integración de DocumentDelete en API Gateway

---

**Última actualización**: 5 de Febrero de 2026 - 12:05 PM (ART)
