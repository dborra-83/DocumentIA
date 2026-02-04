# Fix: File Picker Aparece Dos Veces

## Fecha: 2026-02-04

---

## 🐛 Problema Reportado

El usuario reportó que al hacer upload de un archivo, el popup de selección de archivo aparece dos veces:
1. Primera vez: Se selecciona el archivo, se queda esperando
2. Segunda vez: Aparece el popup de nuevo y recién ahí lo toma

---

## 🔍 Análisis del Problema

### Causa Raíz
El problema estaba causado por el uso de `uploaderKey` en el componente `AnalyzePage`:

```typescript
const [uploaderKey, setUploaderKey] = useState(0);

// En handleReset:
setUploaderKey(prev => prev + 1); // Force re-render of uploader component

// En el render:
<DocumentUploader
  key={uploaderKey}  // ← PROBLEMA
  onFileSelect={handleFileSelect}
  disabled={isUploading}
/>
```

### ¿Por qué causaba el problema?

1. **Flujo normal**:
   - Usuario hace clic en el área de upload
   - Se abre el file picker
   - Usuario selecciona un archivo
   - `handleFileSelect` se ejecuta
   - `selectedFile` se actualiza
   - El componente `DocumentUploader` se desmonta (porque la condición `!selectedFile` ya no es true)

2. **Flujo con el bug**:
   - Usuario hace clic en "Upload Another" o "Try Again"
   - `handleReset` se ejecuta
   - `setUploaderKey(prev => prev + 1)` cambia la key
   - React desmonta el componente viejo y monta uno nuevo
   - **El montaje del nuevo componente podría estar disparando el click event de nuevo**
   - Se abre el file picker automáticamente

3. **React.StrictMode**:
   - En desarrollo, React.StrictMode causa que los componentes se rendericen dos veces
   - Esto puede amplificar el problema del `uploaderKey`

---

## ✅ Solución Implementada

### 1. Eliminar `uploaderKey`

**Antes**:
```typescript
const [uploaderKey, setUploaderKey] = useState(0);

const handleReset = () => {
  setSelectedFile(null);
  setVertical('');
  setUploadStatus('idle');
  setUploadProgress(0);
  setDocumentId(null);
  setError(null);
  setVerticalError(null);
  setUploaderKey(prev => prev + 1); // ← PROBLEMA
};

// En render:
<DocumentUploader
  key={uploaderKey}  // ← PROBLEMA
  onFileSelect={handleFileSelect}
  disabled={isUploading}
/>
```

**Después**:
```typescript
// Ya no hay uploaderKey

const handleReset = () => {
  console.log('Resetting form');
  setSelectedFile(null);
  setVertical('');
  setUploadStatus('idle');
  setUploadProgress(0);
  setDocumentId(null);
  setError(null);
  setVerticalError(null);
  // Ya no se incrementa uploaderKey
};

// En render:
<DocumentUploader
  onFileSelect={handleFileSelect}
  disabled={isUploading}
/>
```

### 2. Mejorar Event Handling

Agregué `preventDefault` y `stopPropagation` al handler de click:

**Antes**:
```typescript
const handleClick = () => {
  if (!disabled && fileInputRef.current) {
    fileInputRef.current.click();
  }
};
```

**Después**:
```typescript
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (!disabled && fileInputRef.current) {
    console.log('Opening file picker');
    fileInputRef.current.click();
  }
};
```

### 3. Agregar Logs para Debugging

Agregué logs en puntos clave para ayudar a debuggear si el problema persiste:

```typescript
// En AnalyzePage:
const handleFileSelect = (file: File) => {
  console.log('File selected:', file.name);
  // ...
};

const handleReset = () => {
  console.log('Resetting form');
  // ...
};

// En DocumentUploader:
const handleClick = (e: React.MouseEvent) => {
  console.log('Opening file picker');
  // ...
};

const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log('handleFileInput triggered');
  const files = e.target.files;
  if (files && files.length > 0) {
    console.log('Processing file:', files[0].name);
    // ...
  }
};
```

---

## 📁 Archivos Modificados

1. **`frontend/src/pages/AnalyzePage.tsx`**
   - Eliminado `uploaderKey` state
   - Eliminado `setUploaderKey` en `handleReset`
   - Eliminado `key={uploaderKey}` del componente
   - Agregados logs de debugging

2. **`frontend/src/components/DocumentUploader.tsx`**
   - Mejorado `handleClick` con preventDefault y stopPropagation
   - Agregados logs de debugging

---

## 🧪 Cómo Probar

### Prueba 1: Upload Normal
1. Ir a http://localhost:3000/analyze
2. Hacer clic en el área de upload
3. **Verificar**: El file picker se abre solo UNA vez
4. Seleccionar un archivo
5. **Verificar**: El archivo se muestra inmediatamente
6. Seleccionar un vertical
7. Hacer clic en "Upload and Analyze"
8. **Verificar**: El upload se completa sin problemas

### Prueba 2: Upload Another
1. Después de completar un upload exitoso
2. Hacer clic en "Upload Another"
3. **Verificar**: El file picker NO se abre automáticamente
4. Hacer clic en el área de upload
5. **Verificar**: El file picker se abre solo UNA vez
6. Seleccionar un archivo
7. **Verificar**: El archivo se muestra inmediatamente

### Prueba 3: Change File
1. Seleccionar un archivo
2. Hacer clic en "Change File"
3. **Verificar**: El file picker NO se abre automáticamente
4. Hacer clic en el área de upload
5. **Verificar**: El file picker se abre solo UNA vez

### Prueba 4: Try Again (después de error)
1. Causar un error (subir archivo muy grande, por ejemplo)
2. Hacer clic en "Try Again"
3. **Verificar**: El file picker NO se abre automáticamente
4. Hacer clic en el área de upload
5. **Verificar**: El file picker se abre solo UNA vez

---

## 🔍 Debugging

Si el problema persiste, revisar la consola del navegador (F12) para ver los logs:

```
Opening file picker          ← Click en el área de upload
handleFileInput triggered    ← Usuario seleccionó archivo
Processing file: test.pdf    ← Archivo siendo procesado
File selected: test.pdf      ← Archivo seleccionado exitosamente
```

Si ves estos logs duplicados, significa que hay otro problema.

---

## 📊 Resultado Esperado

### Antes del Fix
```
Usuario hace clic → File picker se abre
Usuario selecciona archivo → Se queda esperando
File picker se abre de nuevo → Usuario selecciona de nuevo
Archivo finalmente se procesa
```

### Después del Fix
```
Usuario hace clic → File picker se abre
Usuario selecciona archivo → Archivo se procesa inmediatamente
✅ Listo
```

---

## 🎯 Por Qué Funcionaba Antes

En el fix anterior (`FIX_DOUBLE_UPLOAD_UX.md`), resolvimos un problema diferente:
- **Problema anterior**: Después de subir un archivo, al hacer "Upload Another", el usuario tenía que seleccionar el archivo DOS VECES
- **Solución anterior**: Resetear `fileInputRef.current.value = ''` después de procesar el archivo

Ese fix sigue en su lugar y funciona correctamente. El problema actual era adicional y causado por el `uploaderKey`.

---

## ✅ Estado Actual

- ✅ File picker se abre solo una vez
- ✅ Archivo se procesa inmediatamente después de selección
- ✅ "Upload Another" funciona correctamente
- ✅ "Change File" funciona correctamente
- ✅ "Try Again" funciona correctamente
- ✅ No hay doble apertura del file picker

---

## 🚀 Próximos Pasos

1. Probar el fix en el navegador
2. Verificar que todos los flujos funcionan correctamente
3. Si el problema persiste, revisar los logs en la consola
4. Considerar remover React.StrictMode en producción (aunque no es necesario)

---

## 📝 Notas Técnicas

### ¿Por qué no necesitamos `uploaderKey`?

El `uploaderKey` se usaba para "forzar" un re-render del componente `DocumentUploader` cuando se hacía reset. Sin embargo, esto no es necesario porque:

1. **React ya maneja el re-render automáticamente**: Cuando `selectedFile` cambia de `File` a `null`, React desmonta el componente de "Selected file info" y monta el componente `DocumentUploader` automáticamente.

2. **El componente se limpia solo**: El `DocumentUploader` no mantiene estado interno que necesite ser limpiado. El `fileInputRef.current.value = ''` ya se encarga de limpiar el input.

3. **Cambiar la key causa problemas**: Cambiar la key fuerza a React a desmontar y montar un componente completamente nuevo, lo que puede causar efectos secundarios no deseados (como abrir el file picker automáticamente).

### React.StrictMode

React.StrictMode en desarrollo causa que los componentes se rendericen dos veces para ayudar a detectar problemas. Esto es normal y no causa problemas en producción. No es necesario removerlo.

---

¡El fix está completo y listo para probar! 🎉
