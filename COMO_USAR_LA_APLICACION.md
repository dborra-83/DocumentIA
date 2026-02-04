# Cómo Usar la Aplicación de Análisis de Documentos

## 🚀 Inicio Rápido

### 1. Acceder a la Aplicación
- Abre tu navegador en: **http://localhost:3000**
- Si no estás autenticado, serás redirigido a la página de login

### 2. Iniciar Sesión
**Usuario de prueba:**
- Email: `admin@documentia.com`
- Password: `Admin123!Pass`

O crea una cuenta nueva con el botón "Register"

## 📤 Subir un Documento

### Paso 1: Ir a Analyze
- Click en "Analyze" en el menú superior
- Verás la página de upload

### Paso 2: Seleccionar Tipo de Documento
Elige el vertical que mejor describe tu documento:
- **Healthcare**: Documentos médicos, historias clínicas, informes
- **Education**: Material educativo, planes de estudio, evaluaciones
- **Retail**: Inventarios, reportes de ventas, análisis de mercado
- **Legal**: Contratos, acuerdos, documentos legales
- **Finance**: Estados financieros, reportes, análisis
- **Manufacturing**: Procesos, especificaciones, reportes de producción
- **HR**: Políticas, evaluaciones, documentos de RRHH
- **Technology**: Documentación técnica, especificaciones, manuales

### Paso 3: Subir Archivo
**Opción A - Drag & Drop:**
1. Arrastra tu archivo al área de upload
2. Suelta el archivo

**Opción B - Click para Seleccionar:**
1. Click en el área de upload
2. Selecciona tu archivo del explorador

**Formatos Soportados:**
- PDF (hasta 100 páginas)
- DOCX (Microsoft Word)
- TXT (Texto plano)

**Tamaño Máximo:** 10 MB

### Paso 4: Confirmar y Analizar
1. Verifica que el archivo y vertical sean correctos
2. Click en "Upload and Analyze"
3. Espera a que se complete el upload (verás una barra de progreso)

### Paso 5: Ver Confirmación
- Verás un mensaje verde: "Document uploaded successfully!"
- El documento está siendo analizado por AWS Bedrock

## 📊 Ver Resultados

### Opción 1: Desde la Página de Upload
- Click en "View in History" después del upload exitoso

### Opción 2: Desde el Menú
- Click en "History" en el menú superior

### En la Página de History Verás:
- **Lista de todos tus documentos**
- **Estado de cada documento:**
  - 🟡 **pending**: Esperando procesamiento
  - 🔵 **processing**: Siendo analizado por Bedrock
  - 🟢 **completed**: Análisis completo
  - 🔴 **failed**: Error en el procesamiento

### Para Documentos Completados:
Verás 3 secciones de análisis:

1. **Executive Summary**
   - Resumen ejecutivo del documento
   - Visión general de alto nivel

2. **Key Points**
   - Puntos clave extraídos
   - Información más importante
   - Lista con bullets

3. **Next Steps**
   - Acciones recomendadas
   - Pasos a seguir
   - Lista con bullets

### Actualizar Estado
- Click en "Refresh" para actualizar la lista
- Los documentos en procesamiento se actualizarán a "completed"

## 🔄 Subir Otro Documento

### Desde la Página de Upload:
1. Click en "Upload Another" después de un upload exitoso
2. El formulario se resetea automáticamente
3. Selecciona nuevo vertical y archivo

### Desde History:
1. Click en "Analyze" en el menú
2. Sigue el proceso normal de upload

## 🐛 Solución de Problemas

### El archivo no se sube
**Verifica:**
- ✅ Formato correcto (PDF, DOCX, TXT)
- ✅ Tamaño menor a 10 MB
- ✅ PDF con menos de 100 páginas
- ✅ Vertical seleccionado
- ✅ Conexión a internet activa

### No veo resultados en History
**Posibles causas:**
1. **Documento aún en procesamiento**
   - Espera 30-60 segundos
   - Click en "Refresh"

2. **Error en el análisis**
   - Verás estado "failed" con mensaje de error
   - Intenta subir el documento nuevamente

3. **Sesión expirada**
   - Cierra sesión y vuelve a iniciar
   - Verifica en Debug page el estado de autenticación

### Error de autenticación
1. Ve a la página Debug: http://localhost:3000/debug
2. Verifica el estado de autenticación
3. Si es necesario, click en "Clear Session"
4. Vuelve a iniciar sesión

## 📱 Navegación

### Menú Principal:
- **Dashboard**: Estadísticas (próximamente)
- **Analyze**: Subir documentos
- **History**: Ver documentos y resultados
- **Debug**: Información de sesión (desarrollo)
- **Logout**: Cerrar sesión

## ⚡ Tips y Mejores Prácticas

### Para Mejores Resultados:
1. **Selecciona el vertical correcto** - El análisis se optimiza según el tipo
2. **Usa documentos claros** - Texto legible, sin imágenes borrosas
3. **Evita documentos muy largos** - Mejor dividir en secciones
4. **Espera el análisis completo** - No subas el mismo documento múltiples veces

### Optimización:
- **PDFs**: Asegúrate que tengan texto seleccionable (no solo imágenes)
- **DOCX**: Formato estándar de Word, sin macros
- **TXT**: Codificación UTF-8 preferida

## 🔒 Seguridad

- Todos los documentos se almacenan encriptados en S3
- La autenticación usa AWS Cognito con tokens JWT
- Las sesiones expiran automáticamente
- Los documentos son privados por usuario

## 💡 Casos de Uso Comunes

### Healthcare
- Análisis de historias clínicas
- Resumen de informes médicos
- Extracción de diagnósticos y tratamientos

### Legal
- Revisión de contratos
- Identificación de cláusulas importantes
- Resumen de términos y condiciones

### Finance
- Análisis de estados financieros
- Extracción de métricas clave
- Identificación de tendencias

### Education
- Resumen de material educativo
- Extracción de conceptos clave
- Generación de puntos de estudio

## 📞 Soporte

Si encuentras problemas:
1. Verifica los logs en la consola del navegador (F12)
2. Revisa la página Debug para información de sesión
3. Intenta cerrar sesión y volver a iniciar
4. Verifica que el servidor de desarrollo esté corriendo

## 🎯 Próximas Funcionalidades

- Dashboard con estadísticas de uso
- Export de resultados (PDF, Excel, Word)
- Métricas de usuario
- Búsqueda y filtros en History
- Comparación de documentos
- Análisis batch (múltiples archivos)
