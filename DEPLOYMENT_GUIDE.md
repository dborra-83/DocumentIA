# Guía de Despliegue - Document Analysis con Bedrock

## 📋 Requisitos Previos

Antes de desplegar, asegúrate de tener:

### 1. Herramientas Instaladas
- ✅ Node.js 20.x o superior
- ✅ Python 3.12
- ✅ AWS CLI configurado
- ✅ AWS CDK CLI instalado (`npm install -g aws-cdk`)

### 2. Credenciales AWS
```bash
# Verificar que AWS CLI está configurado
aws sts get-caller-identity

# Deberías ver tu Account ID y región
```

### 3. Permisos AWS Necesarios
Tu usuario/rol de AWS necesita permisos para:
- CloudFormation (crear/actualizar stacks)
- IAM (crear roles y políticas)
- Lambda (crear funciones)
- S3 (crear buckets)
- DynamoDB (crear tablas)
- Cognito (crear user pools)
- API Gateway (crear APIs)
- Step Functions (crear state machines)
- CloudWatch (crear logs y métricas)

---

## 🚀 Pasos de Despliegue

### Paso 1: Instalar Dependencias

```bash
# Instalar dependencias de infraestructura
cd infrastructure
npm install

# Volver al directorio raíz
cd ..
```

### Paso 2: Compilar el Código TypeScript

```bash
cd infrastructure
npm run build
```

### Paso 3: Bootstrap de AWS CDK (Solo Primera Vez)

Si es la primera vez que usas CDK en tu cuenta/región:

```bash
# Bootstrap para la región us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-1

# O dejar que CDK detecte automáticamente
cdk bootstrap
```

**Nota**: Reemplaza `ACCOUNT-ID` con tu AWS Account ID.

### Paso 4: Verificar la Síntesis del Stack

```bash
# Sintetizar el template de CloudFormation
cdk synth

# Esto generará el template en cdk.out/
```

### Paso 5: Revisar los Cambios (Diff)

```bash
# Ver qué recursos se crearán
cdk diff
```

### Paso 6: Desplegar a Desarrollo

```bash
# Desplegar el stack completo
cdk deploy --all

# O especificar el ambiente explícitamente
cdk deploy --all --context environment=dev
```

**Importante**: CDK te pedirá confirmación antes de crear recursos. Revisa los cambios y escribe `y` para confirmar.

---

## 📦 Recursos que se Crearán

### S3 Buckets (3)
- `document-analysis-documents-{AccountId}-dev` - Documentos subidos
- `document-analysis-results-{AccountId}-dev` - Resultados y exportaciones
- `document-analysis-web-{AccountId}-dev` - Hosting del frontend

### DynamoDB Tables (3)
- `DocumentAnalysis-Documents-dev` - Metadatos de documentos
- `DocumentAnalysis-Results-dev` - Resultados de análisis
- `DocumentAnalysis-Metrics-dev` - Métricas de usuarios

### Cognito
- User Pool: `DocumentAnalysisUserPool-dev`
- App Client para autenticación web

### Lambda Functions (7)
- `DocumentUploadHandler-dev`
- `BedrockProcessor-dev`
- `HistoryManager-dev`
- `MetricsAggregator-dev`
- `ExportHandler-dev`
- `ErrorHandler-dev`
- `StepFunctionsTrigger-dev`

### IAM Roles (6)
- Roles específicos para cada Lambda con permisos mínimos

### Step Functions
- State Machine: `DocumentProcessingWorkflow-dev`

### API Gateway
- REST API: `DocumentAnalysis-API-dev`
- 6 endpoints con autenticación Cognito

---

## ⏱️ Tiempo Estimado de Despliegue

- **Primera vez**: 10-15 minutos
- **Actualizaciones**: 5-10 minutos

---

## 🔍 Verificar el Despliegue

### 1. Verificar el Stack en CloudFormation

```bash
aws cloudformation describe-stacks --stack-name DocumentAnalysis-dev
```

### 2. Obtener las URLs de Salida

```bash
# Ver todos los outputs del stack
aws cloudformation describe-stacks \
  --stack-name DocumentAnalysis-dev \
  --query 'Stacks[0].Outputs'
```

Busca estos outputs importantes:
- `ApiUrl` - URL del API Gateway
- `UserPoolId` - ID del Cognito User Pool
- `UserPoolClientId` - ID del App Client

### 3. Verificar las Lambda Functions

```bash
# Listar todas las funciones Lambda
aws lambda list-functions --query 'Functions[?contains(FunctionName, `dev`)].FunctionName'
```

### 4. Verificar las Tablas DynamoDB

```bash
# Listar tablas
aws dynamodb list-tables --query 'TableNames[?contains(@, `DocumentAnalysis`)]'
```

### 5. Verificar los Buckets S3

```bash
# Listar buckets
aws s3 ls | grep document-analysis
```

---

## 🧪 Probar el Despliegue

### 1. Crear un Usuario de Prueba en Cognito

```bash
# Obtener el User Pool ID
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name DocumentAnalysis-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

# Crear usuario
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

### 2. Probar el Endpoint de Health

```bash
# Obtener la URL del API
API_URL=$(aws cloudformation describe-stacks \
  --stack-name DocumentAnalysis-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Probar el endpoint de health (no requiere autenticación)
curl ${API_URL}health
```

Deberías ver una respuesta como:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-30T...",
  "environment": "dev"
}
```

---

## 🔧 Comandos Útiles de CDK

```bash
# Ver la lista de stacks
cdk list

# Sintetizar un stack específico
cdk synth DocumentAnalysis-dev

# Ver diferencias antes de desplegar
cdk diff

# Desplegar con aprobación automática (¡cuidado!)
cdk deploy --all --require-approval never

# Destruir el stack (eliminar todos los recursos)
cdk destroy --all

# Ver los logs de CloudFormation
cdk deploy --all --verbose
```

---

## 🐛 Solución de Problemas

### Error: "Unable to resolve AWS account"

**Solución**: Configura las credenciales de AWS
```bash
aws configure
```

### Error: "CDK bootstrap required"

**Solución**: Ejecuta el bootstrap
```bash
cdk bootstrap
```

### Error: "Insufficient permissions"

**Solución**: Verifica que tu usuario tiene los permisos necesarios. Puedes usar la política `AdministratorAccess` para desarrollo (no recomendado para producción).

### Error: "Resource already exists"

**Solución**: Puede haber recursos de un despliegue anterior. Opciones:
1. Eliminar el stack anterior: `cdk destroy`
2. Cambiar el nombre del ambiente en `cdk.json`

### Error de compilación TypeScript

**Solución**: 
```bash
cd infrastructure
npm install
npm run build
```

### Lambda function code is too large

**Solución**: Las dependencias de Python pueden ser grandes. Considera:
1. Usar Lambda Layers para dependencias compartidas
2. Optimizar las dependencias en `requirements.txt`

---

## 📊 Monitoreo Post-Despliegue

### CloudWatch Logs

```bash
# Ver logs de una Lambda específica
aws logs tail /aws/lambda/BedrockProcessor-dev --follow
```

### CloudWatch Metrics

Accede a la consola de CloudWatch para ver:
- Invocaciones de Lambda
- Errores y throttling
- Latencia de API Gateway
- Uso de DynamoDB

### X-Ray Tracing

El API Gateway tiene X-Ray habilitado. Accede a la consola de X-Ray para ver:
- Trazas de requests
- Mapa de servicios
- Análisis de latencia

---

## 🔄 Actualizar el Despliegue

Cuando hagas cambios en el código:

```bash
# 1. Compilar TypeScript
cd infrastructure
npm run build

# 2. Ver los cambios
cdk diff

# 3. Desplegar
cdk deploy --all
```

---

## 🗑️ Eliminar el Despliegue

Para eliminar todos los recursos:

```bash
# Eliminar el stack completo
cdk destroy --all
```

**Advertencia**: Esto eliminará:
- Todas las Lambda functions
- Todas las tablas DynamoDB (y sus datos)
- Todos los buckets S3 (y sus contenidos)
- El User Pool de Cognito (y todos los usuarios)
- El API Gateway
- Todos los demás recursos

---

## 💰 Estimación de Costos

### Capa Gratuita de AWS (12 meses)
- Lambda: 1M requests/mes gratis
- DynamoDB: 25 GB storage gratis
- S3: 5 GB storage gratis
- API Gateway: 1M requests/mes gratis

### Costos Estimados (después de capa gratuita)
- **Lambda**: ~$0.20 por 1M requests
- **DynamoDB**: ~$0.25 por GB/mes (on-demand)
- **S3**: ~$0.023 por GB/mes
- **API Gateway**: ~$3.50 por 1M requests
- **Bedrock (Claude 3 Sonnet)**: ~$0.003 por 1K input tokens, ~$0.015 por 1K output tokens

**Estimación mensual para uso moderado**: $10-50/mes

---

## 📝 Próximos Pasos

Después del despliegue exitoso:

1. ✅ **Configurar el frontend** (Tasks 21-30)
2. ✅ **Implementar monitoreo adicional** (Task 18)
3. ✅ **Configurar CloudFront** (Task 19)
4. ✅ **Implementar CI/CD** (Task 31)
5. ✅ **Pruebas end-to-end** (Task 34)

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de CloudWatch
2. Verifica los eventos de CloudFormation
3. Consulta la documentación de AWS CDK: https://docs.aws.amazon.com/cdk/
4. Revisa los archivos de documentación en `/infrastructure/docs/`

---

## ✅ Checklist de Despliegue

- [ ] AWS CLI configurado
- [ ] CDK CLI instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Código compilado (`npm run build`)
- [ ] Bootstrap ejecutado (primera vez)
- [ ] Stack desplegado (`cdk deploy --all`)
- [ ] Outputs verificados
- [ ] Health endpoint probado
- [ ] Usuario de prueba creado en Cognito
- [ ] Logs de CloudWatch verificados

---

¡Listo para desplegar! 🚀
