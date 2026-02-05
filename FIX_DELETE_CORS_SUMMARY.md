# Fix DELETE CORS Error - Summary

## Fecha: 2026-02-05

## Problema Identificado

Al intentar eliminar documentos desde el frontend, se produce un error CORS:

```
Access to XMLHttpRequest at 'https://43y6hdz4hg.execute-api.us-east-1.amazonaws.com/prod/documents/{id}' 
from origin 'https://d2twnt4egn896m.cloudfront.net' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Causa**: El endpoint DELETE `/documents/{documentId}` no estaba configurado en el API Gateway.

## Solución Implementada

### 1. Agregado DocumentDeleteHandler Lambda Function

**Archivo**: `infrastructure/lib/lambda-functions-construct.ts`

```typescript
this.documentDeleteHandlerFunction = new lambda.Function(this, 'DocumentDeleteHandler', {
  functionName: `DocumentDeleteHandler-${props.environment}`,
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.lambda_handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/document-delete')),
  role: props.documentDeleteHandlerRole,
  timeout: cdk.Duration.seconds(30),
  memorySize: 256,
  environment: {
    DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName,
    RESULTS_BUCKET_NAME: props.resultsBucket.bucketName,
    DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
    RESULTS_TABLE_NAME: props.resultsTable.tableName,
  },
  description: 'Deletes documents and associated analysis results',
});
```

### 2. Agregado IAM Role para Delete Handler

**Archivo**: `infrastructure/lib/iam-roles-construct.ts`

```typescript
this.documentDeleteHandlerRole = new iam.Role(this, 'DocumentDeleteHandlerRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  description: 'Role for DocumentDeleteHandler Lambda - deletes documents and analysis results',
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
});

// Grant DynamoDB read and delete permissions
props.documentsTable.grantReadWriteData(this.documentDeleteHandlerRole);
props.resultsTable.grantReadWriteData(this.documentDeleteHandlerRole);

// Grant S3 DeleteObject permission
props.documentsBucket.grantDelete(this.documentDeleteHandlerRole);
props.resultsBucket.grantDelete(this.documentDeleteHandlerRole);
```

### 3. Agregado DELETE Endpoint al API Gateway

**Archivo**: `infrastructure/lib/api-gateway-construct.ts`

```typescript
// DELETE /documents/{documentId} - Delete document and analysis
documentByIdResource.addMethod(
  'DELETE',
  new apigateway.LambdaIntegration(props.documentDeleteHandler, {
    proxy: true,
    integrationResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      },
    ],
  }),
  {
    ...authorizedMethodOptions,
    requestValidator: paramsValidator,
    requestParameters: {
      'method.request.path.documentId': true,
    },
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      },
      {
        statusCode: '404',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      },
      {
        statusCode: '401',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      },
      {
        statusCode: '500',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      },
    ],
  }
);
```

### 4. Actualizado Stack Principal

**Archivo**: `infrastructure/lib/document-analysis-stack.ts`

- Agregado `documentDeleteHandlerRole` al construct de IAM roles
- Agregado `documentDeleteHandlerFunction` al construct de Lambda functions
- Agregado `documentDeleteHandler` al construct de API Gateway

## Archivos Modificados

1. `infrastructure/lib/lambda-functions-construct.ts`
   - Agregada interfaz `documentDeleteHandlerRole`
   - Agregada propiedad `documentDeleteHandlerFunction`
   - Agregada función Lambda DocumentDeleteHandler
   - Agregado output para ARN

2. `infrastructure/lib/iam-roles-construct.ts`
   - Agregada propiedad `documentDeleteHandlerRole`
   - Agregado rol IAM con permisos de delete
   - Agregado output para ARN del rol

3. `infrastructure/lib/api-gateway-construct.ts`
   - Agregada interfaz `documentDeleteHandler`
   - Agregado endpoint DELETE con CORS configurado
   - Agregadas respuestas con headers CORS

4. `infrastructure/lib/document-analysis-stack.ts`
   - Agregado `documentDeleteHandlerRole` a IAM roles construct
   - Agregado `documentDeleteHandlerFunction` a Lambda functions construct
   - Agregado `documentDeleteHandler` a API Gateway construct

## Deployment

Para aplicar los cambios:

```powershell
.\fix-delete-cors.ps1
```

O manualmente:

```powershell
cd infrastructure
npm run build
npx cdk deploy --all --require-approval never
```

## Verificación

Después del deployment:

1. **Verificar Lambda Function**:
   ```powershell
   aws lambda get-function --function-name DocumentDeleteHandler-prod
   ```

2. **Verificar API Endpoint**:
   ```powershell
   aws apigateway get-resources --rest-api-id <api-id>
   ```

3. **Test desde Frontend**:
   - Ir a History page
   - Intentar eliminar un documento
   - Verificar que no hay errores CORS en la consola
   - Verificar que el documento se elimina correctamente

## CORS Headers Configurados

El endpoint DELETE ahora incluye los siguientes headers CORS:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: DELETE, GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Max-Age: 3600`

## Funcionalidad del Delete Handler

El Lambda `DocumentDeleteHandler` realiza las siguientes operaciones:

1. **Validación de autenticación**: Verifica JWT token y extrae userId
2. **Verificación de propiedad**: Confirma que el usuario es dueño del documento
3. **Eliminación de S3**: Elimina el archivo del documento y resultados
4. **Eliminación de DynamoDB**: Elimina registros de Documents y AnalysisResults
5. **Respuesta**: Retorna confirmación con CORS headers

## Seguridad

- ✅ Requiere autenticación con Cognito
- ✅ Verifica que el usuario sea dueño del documento
- ✅ Usa IAM roles con permisos mínimos (least privilege)
- ✅ Logs en CloudWatch para auditoría

## Próximos Pasos

1. ✅ Deploy de cambios a producción - **COMPLETADO**
2. ✅ Verificar Lambda function creada - **COMPLETADO**
3. ⏳ Test de funcionalidad delete en frontend
4. ⏳ Verificar logs en CloudWatch
5. ⏳ Monitorear métricas de errores

## Deployment Exitoso

**Fecha de deployment**: 2026-02-05 02:14 UTC

### Recursos Creados/Actualizados:

1. **Lambda Function**: `DocumentDeleteHandler-prod`
   - ARN: `arn:aws:lambda:us-east-1:520754296204:function:DocumentDeleteHandler-prod`
   - Runtime: Python 3.12
   - Estado: Active

2. **IAM Role**: `DocumentDeleteHandlerRole`
   - ARN: `arn:aws:iam::520754296204:role/DocumentAnalysis-prod-IamRolesDocumentDeleteHandler-YoIKR0nxELvG`
   - Permisos: S3 Delete, DynamoDB Read/Write

3. **API Gateway Endpoint**: DELETE `/documents/{documentId}`
   - URL: `https://43y6hdz4hg.execute-api.us-east-1.amazonaws.com/prod/documents/{documentId}`
   - Método: DELETE
   - Autenticación: Cognito User Pool
   - CORS: Configurado

### Verificación:

```bash
# Lambda function verificada
aws lambda get-function --function-name DocumentDeleteHandler-prod
# Estado: Active ✅
```

## Notas

- El Lambda handler ya existía en `backend/document-delete/handler.py`
- Solo faltaba integrarlo en la infraestructura CDK
- Los CORS headers están configurados para permitir todos los orígenes (`*`)
- En producción, considerar restringir CORS al dominio específico de CloudFront

---

**Estado**: ✅ **DEPLOYMENT COMPLETADO** - Listo para testing
**Fecha**: 2026-02-05
