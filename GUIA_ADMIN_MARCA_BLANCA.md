# Guía: Cómo Usar la Página de Admin y Marca Blanca

## 🎯 Acceso Rápido

1. **Inicia sesión** en la aplicación
2. **Click en "Admin"** en el header (navegación superior)
3. Ya estás en la página de configuración

---

## 📋 Tabs Disponibles

### 1️⃣ General
Configuración general de la aplicación:
- **Idioma**: Español / English
- **Zona Horaria**: Selecciona tu zona horaria
- **Formato de Fecha**: DD/MM/YYYY, MM/DD/YYYY, etc.

### 2️⃣ Marca Blanca ⭐
Personaliza la identidad visual de tu aplicación:

#### Logo de la Aplicación
1. Click en **"Seleccionar Logo"**
2. Elige una imagen (PNG, JPG, SVG)
3. Verás un preview inmediato
4. El logo aparecerá en el header de toda la app

**Tip**: Tamaño recomendado 200x200px

#### Nombre de la Aplicación
- Campo de texto editable
- Por defecto: "DocumentIA"
- Aparece en el header junto al logo

#### Tagline / Descripción
- Campo de texto editable
- Por defecto: "AI-Powered Document Analysis"
- Aparece debajo del nombre en el preview

#### Preview en Tiempo Real
- Sección oscura que muestra cómo se verá el header
- Se actualiza mientras escribes
- Muestra logo + nombre + tagline

### 3️⃣ Límites
Configura límites de uso:
- **Tamaño Máximo de Archivo**: En MB
- **Número Máximo de Páginas**: Para PDFs
- **Documentos por Mes**: Límite mensual

---

## 💾 Guardar Cambios

### Botón "Guardar Cambios"
1. Haz tus modificaciones en cualquier tab
2. Click en **"Guardar Cambios"** (botón azul abajo a la derecha)
3. Verás un mensaje verde: "Configuración guardada exitosamente"
4. Los cambios se aplican inmediatamente en toda la app
5. La configuración se guarda en tu navegador (localStorage)

### Botón "Restablecer"
1. Click en **"Restablecer"** (botón gris)
2. Confirma la acción
3. Todo vuelve a los valores por defecto
4. Logo se elimina
5. Nombre vuelve a "DocumentIA"

---

## 🎨 Ejemplo de Uso

### Caso: Personalizar para tu empresa

**Paso 1**: Ve a Admin → Marca Blanca

**Paso 2**: Sube tu logo
- Click en "Seleccionar Logo"
- Elige el logo de tu empresa
- Verás el preview

**Paso 3**: Cambia el nombre
- En "Nombre de la Aplicación" escribe: "Acme Corp Docs"

**Paso 4**: Cambia el tagline
- En "Tagline" escribe: "Sistema de Análisis Documental"

**Paso 5**: Revisa el preview
- Verás cómo se ve en el header oscuro

**Paso 6**: Guarda
- Click en "Guardar Cambios"
- ¡Listo! Tu app ahora tiene tu marca

**Paso 7**: Verifica
- Ve a Dashboard, Analyze, o History
- El header mostrará tu logo y nombre personalizado

---

## 🔄 Persistencia

### ¿Dónde se guarda la configuración?
- **LocalStorage del navegador**
- Se mantiene entre sesiones
- Persiste al recargar la página
- Específico de cada navegador/dispositivo

### ¿Qué pasa si cierro el navegador?
- La configuración se mantiene
- Al volver a abrir, verás tu personalización

### ¿Qué pasa si cambio de navegador?
- Cada navegador tiene su propia configuración
- Tendrás que configurar de nuevo

### ¿Qué pasa si limpio el caché?
- Se pierde la configuración
- Vuelve a valores por defecto
- Tendrás que configurar de nuevo

---

## 🎯 Casos de Uso

### 1. White-Label para Clientes
Personaliza la app para cada cliente:
- Logo del cliente
- Nombre de su empresa
- Colores corporativos (futuro)

### 2. Diferentes Departamentos
Configura para diferentes áreas:
- Logo del departamento
- Nombre específico
- Límites personalizados

### 3. Testing
Prueba diferentes configuraciones:
- Sube diferentes logos
- Prueba nombres largos/cortos
- Verifica el preview

---

## 🎨 Paleta de Colores de la Admin Page

La página de Admin usa la nueva paleta de colores:

- **Fondo**: Gradiente celeste claro → blanco
- **Tabs activos**: Azul brillante (#008FD0)
- **Botones primarios**: Azul brillante → Turquesa
- **Mensajes de éxito**: Verde turquesa
- **Mensajes de error**: Rojo coral
- **Preview header**: Azul oscuro → Azul petróleo

---

## 📱 Responsive

La página de Admin es responsive:
- **Desktop**: Vista completa con tabs horizontales
- **Tablet**: Se adapta al ancho
- **Mobile**: Tabs apilados, formularios full-width

---

## ⚠️ Notas Importantes

### Sobre el Logo
- **Formatos aceptados**: PNG, JPG, SVG
- **Tamaño recomendado**: 200x200px
- **Peso máximo**: Depende del navegador (generalmente 5-10MB)
- **Se guarda como**: Base64 en localStorage

### Sobre el Nombre
- **Longitud**: Sin límite, pero se recomienda corto
- **Caracteres especiales**: Permitidos
- **Emojis**: Permitidos ✨

### Sobre el Tagline
- **Longitud**: Sin límite
- **Uso**: Solo se muestra en el preview por ahora
- **Futuro**: Podría mostrarse en login, footer, etc.

---

## 🚀 Próximas Funcionalidades

### En desarrollo
- [ ] Personalización de colores
- [ ] Subir logo a S3 (persistencia en la nube)
- [ ] Guardar config en DynamoDB
- [ ] Múltiples temas predefinidos
- [ ] Favicon personalizado
- [ ] Email templates personalizados

### Sugerencias
¿Qué más te gustaría personalizar?
- Colores del tema
- Fuentes
- Imágenes de fondo
- Textos de la interfaz
- Idiomas adicionales

---

## 🐛 Solución de Problemas

### El logo no se muestra
- Verifica que el archivo sea una imagen válida
- Intenta con otro formato (PNG en lugar de JPG)
- Verifica el tamaño del archivo

### Los cambios no se guardan
- Asegúrate de hacer click en "Guardar Cambios"
- Verifica que no haya errores en la consola del navegador
- Intenta limpiar el localStorage y configurar de nuevo

### El preview no se actualiza
- Refresca la página
- Verifica que estés en el tab correcto
- Intenta cambiar de tab y volver

### La configuración se perdió
- Verifica si limpiaste el caché del navegador
- Verifica si cambiaste de navegador
- Reconfigura desde Admin

---

## 💡 Tips y Trucos

### Tip 1: Preview antes de guardar
Siempre revisa el preview antes de guardar para ver cómo se verá

### Tip 2: Nombres cortos
Usa nombres cortos para que se vean bien en mobile

### Tip 3: Logos con fondo transparente
Usa PNGs con fondo transparente para mejor resultado

### Tip 4: Guarda una copia
Guarda una copia de tu logo en caso de que necesites reconfigurarlo

### Tip 5: Prueba en diferentes páginas
Después de guardar, visita diferentes páginas para ver cómo se ve

---

## 📞 Soporte

Si tienes problemas o sugerencias:
1. Revisa esta guía
2. Verifica la consola del navegador (F12)
3. Intenta restablecer la configuración
4. Contacta al administrador del sistema

---

¡Disfruta personalizando tu aplicación! 🎨✨
