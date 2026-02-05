# 📝 Instrucciones para Probar el Procesamiento

## 🎯 Objetivo
Verificar que el procesamiento de documentos funcione correctamente después de actualizar el Lambda layer con las dependencias correctas para Linux.

---

## 📋 Pasos para Probar

### 1. Abrir la Aplicación
```
https://d2twnt4egn896m.cloudfront.net
```

### 2. Iniciar Sesión
- **Email**: admin@documentia.com
- **Password**: Admin123!Pass

### 3. Ir a "Analizar Documento"
- Click en el menú "Analizar Documento"

### 4. Subir un Documento
- Seleccionar vertical: **Legal** (o cualquier otra)
- Arrastrar o seleccionar un archivo PDF o DOCX
- Click en "Analizar Documento"

### 5. Observar el Procesamiento
- El documento debería aparecer en "Historial"
- El estado debería cambiar de "Pending" a "Processing" y luego a "Completed"
- Esto puede tardar 30-60 segundos

---

## 🔍 Monitoreo de Logs

### Opción 1: Script Automático
```powershell
# Ver logs de las últimas ejecuciones
.\check-processing-logs.ps1 -Minutes 5
```

### Opción 2: Monitoreo en Tiempo Real
```powershell
# Abrir en una terminal separada
aws logs tail /aws/lambda/BedrockProcessor-prod --follow
```

### Opción 3: Ver Logs Individuales
```powershell
# Step Functions Trigger
aws logs tail /aws/lambda/StepFunctionsTrigger-prod --since 5m --format short

# Bedrock Processor
aws logs tail /aws/lambda/BedrockProcessor-prod --since 5m --format short

# Error Handler (si hay errores)
aws logs tail /aws/lambda/ErrorHandler-prod --since 5m --format short
```

---

## ✅ Señales de Éxito

### En la Aplicación
- ✅ El documento aparece en "Historial"
- ✅ El estado cambia a "Processing"
- ✅ El estado cambia a "Completed"
- ✅ Se puede hacer click en "Ver Análisis"
- ✅ El análisis muestra información en español

### En los Logs
```
StepFunctionsTrigger-prod:
✅ "Started Step Functions execution: arn:aws:states:..."
✅ "Successfully started 1 Step Functions executions"

BedrockProcessor-prod:
✅ "Processing document: {documentId}"
✅ "Extracted text from document"
✅ "Calling Bedrock with model: anthropic.claude-3-sonnet..."
✅ "Successfully processed document"
✅ "Document status updated to: completed"
```

---

## ❌ Señales de Error

### En la Aplicación
- ❌ El documento queda en "Pending" por más de 2 minutos
- ❌ El estado cambia a "Failed"
- ❌ No aparece el botón "Ver Análisis"

### En los Logs
```
BedrockProcessor-prod:
❌ "Runtime.ImportModuleError"
❌ "Unable to import module"
❌ "Error processing document"
❌ "Bedrock API error"
```

---

## 🐛 Troubleshooting

### Si el documento queda en "Pending"
1. Verificar logs de StepFunctionsTrigger:
```powershell
aws logs tail /aws/lambda/StepFunctionsTrigger-prod --since 5m
```

2. Verificar que la Step Function se haya iniciado:
```powershell
aws stepfunctions list-executions `
  --state-machine-arn "arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-prod" `
  --max-results 5
```

### Si el documento falla en "Processing"
1. Verificar logs de BedrockProcessor:
```powershell
aws logs tail /aws/lambda/BedrockProcessor-prod --since 5m
```

2. Verificar que Bedrock esté habilitado:
```powershell
aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId, 'claude-3-sonnet')]"
```

### Si hay error de importación de lxml
```
❌ Error: cannot import name 'etree' from 'lxml'
```

**Solución**: El Lambda layer no se actualizó correctamente. Ejecutar:
```powershell
.\build-lambda-layer-manylinux.ps1
cd infrastructure
npm run build
cdk deploy --all --context environment=prod
```

---

## 📊 Verificar Estado de la Ejecución

### Ver detalles de una ejecución específica
```powershell
# Obtener el ARN de la última ejecución
$executionArn = aws stepfunctions list-executions `
  --state-machine-arn "arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-prod" `
  --max-results 1 `
  --query "executions[0].executionArn" `
  --output text

# Ver detalles
aws stepfunctions describe-execution --execution-arn $executionArn
```

### Ver historial de eventos
```powershell
aws stepfunctions get-execution-history --execution-arn $executionArn --query "events[*].{Type:type,Timestamp:timestamp}" --output table
```

---

## 🎉 Resultado Esperado

Después de subir el documento, deberías ver:

1. **En la aplicación**:
   - Documento en "Historial" con estado "Completed"
   - Botón "Ver Análisis" disponible
   - Análisis completo en español con:
     - Resumen ejecutivo
     - Análisis detallado
     - Puntos clave
     - Recomendaciones

2. **En los logs**:
   - Sin errores de importación
   - Procesamiento exitoso
   - Llamada a Bedrock exitosa
   - Documento actualizado a "completed"

3. **En DynamoDB**:
   - Registro en `DocumentAnalysis-Documents-prod` con status "completed"
   - Registro en `DocumentAnalysis-Results-prod` con el análisis

---

## 📝 Notas

- El procesamiento puede tardar 30-60 segundos dependiendo del tamaño del documento
- Si el documento es muy grande (>5MB), puede tardar más tiempo
- La primera invocación de Lambda puede tener "cold start" (~2-3 segundos adicionales)
- Los logs pueden tardar unos segundos en aparecer en CloudWatch

---

**¡Listo para probar!** 🚀

Sube un documento y observa los logs para verificar que todo funcione correctamente.
