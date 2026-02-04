# Cómo Probar el Sistema - Guía Completa

## ✅ Sistema Funcionando

El problema de los documentos pendientes ha sido resuelto. Todos los documentos ahora se procesan correctamente con Bedrock.

## Pasos para Probar

### 1. Verificar que el Frontend está Corriendo

El servidor de desarrollo debe estar corriendo en http://localhost:3000

Si no está corriendo, ejecutar:
```powershell
cd frontend
npm run dev
```

### 2. Acceder a la Aplicación

1. Abrir navegador en: http://localhost:3000
2. Login con las credenciales de prueba:
   - **Email**: admin@documentia.com
   - **Password**: Admin123!Pass

### 3. Ver Documentos Procesados

1. Click en "History" en el menú superior
2. Deberías ver **7 documentos completados**
3. Cada documento muestra:
   - ✅ Estado: "completed" (verde)
   - 📄 Nombre del archivo
   - 📊 Tamaño del archivo
   - 🏢 Vertical: Legal
   - 📅 Fecha de subida
   - ⏱️ Tiempo de procesamiento

4. Click en cualquier documento para ver los resultados del análisis:
   - **Executive Summary**: Resumen ejecutivo del documento
   - **Key Points**: Puntos clave extraídos (7 puntos)
   - **Next Steps**: Próximos pasos recomendados (5 pasos)

### 4. Subir un Nuevo Documento (Opcional)

1. Click en "Analyze" en el menú
2. Seleccionar vertical (por ejemplo: Legal, Healthcare, Finance)
3. Arrastrar un archivo PDF o hacer click para seleccionar
4. Esperar confirmación de upload exitoso
5. Ir a "History" para ver el documento
6. El documento debería cambiar de "pending" → "processing" → "completed" en ~10-15 segundos
7. Refrescar la página para ver el estado actualizado

### 5. Verificar Análisis de Bedrock

Los documentos procesados muestran análisis generado por **Claude 3 Sonnet** de AWS Bedrock:

**Ejemplo de Análisis (Documento Legal)**:
- **Executive Summary**: Resumen del contrato de alquiler
- **Key Points**:
  - Precio de alquiler: USD 12,000/mes
  - Depósito de seguridad requerido
  - Ley aplicable: Ley 27.551
  - Propiedad libre de gravámenes
  - Derechos exclusivos por 90 días
  - Jurisdicción: tribunales de Neuquén
- **Next Steps**:
  - Revisión legal exhaustiva
  - Evaluación de riesgos
  - Análisis de cláusula de resolución de disputas
  - Revisión de propiedad intelectual
  - Análisis de cumplimiento regulatorio

## Verificación Técnica (Opcional)

### Ver Logs de Lambda

```powershell
# Ver logs del BedrockProcessor
aws logs tail /aws/lambda/BedrockProcessor-dev --follow

# Ver ejecuciones de Step Functions
aws stepfunctions list-executions --state-machine-arn "arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-dev" --max-results 5
```

### Ver Documentos en DynamoDB

```powershell
# Contar documentos completados
aws dynamodb scan --table-name DocumentAnalysis-Documents-dev --filter-expression "#status = :status" --expression-attribute-names '{\"#status\": \"status\"}' --expression-attribute-values '{\":status\": {\"S\": \"completed\"}}' --select COUNT

# Ver un documento específico
aws dynamodb get-item --table-name DocumentAnalysis-Documents-dev --key '{\"documentId\": {\"S\": \"124dca89-9bff-474d-b664-9126a4fc99ac\"}}'
```

### Ver Resultados en S3

```powershell
# Listar resultados en S3
aws s3 ls s3://document-analysis-results-520754296204-dev/results/ --recursive
```

## Problemas Conocidos (Menores)

### 1. Doble Upload
**Síntoma**: Después de subir exitosamente, pide seleccionar el archivo nuevamente
**Workaround**: Hacer click en "Upload Another" y seleccionar el archivo de nuevo
**Impacto**: Molesto pero no bloquea funcionalidad
**Estado**: Pendiente de arreglar

### 2. Estado No Se Actualiza Automáticamente
**Síntoma**: Después de subir, el documento aparece como "pending" en History
**Workaround**: Refrescar la página después de 15-20 segundos
**Impacto**: Menor - el documento se procesa correctamente en background
**Estado**: Pendiente implementar polling o WebSockets

## Métricas del Sistema

### Documentos Procesados
- **Total**: 8 documentos
- **Completados**: 7 (87.5%)
- **Pendientes**: 0
- **Fallidos**: 1 (el primero, antes del fix)

### Performance
- **Tiempo de procesamiento**: 10-15 segundos por documento
- **Tokens usados**: ~2,000 input / ~600 output por documento
- **Costo estimado**: ~$0.01 USD por documento

### Infraestructura
- **Lambda Functions**: 7 funciones desplegadas
- **Lambda Layer**: Versión 6 (con lxml compilado correctamente)
- **DynamoDB Tables**: 3 tablas (Documents, Results, Metrics)
- **S3 Buckets**: 3 buckets (Documents, Results, Web)
- **Step Functions**: 1 workflow (DocumentProcessing-dev)
- **API Gateway**: 1 REST API con 6 endpoints
- **Cognito**: 1 User Pool con 1 usuario de prueba

## Conclusión

✅ **El sistema está completamente funcional**

Puedes:
1. ✅ Subir documentos
2. ✅ Ver análisis generados por Bedrock
3. ✅ Ver historial de documentos
4. ✅ Ver resultados detallados (Executive Summary, Key Points, Next Steps)

**Próximo paso recomendado**: Subir un documento nuevo para ver el flujo completo en acción.
