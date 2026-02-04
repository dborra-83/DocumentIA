# Guía de Prueba del Frontend

## 🚀 Cómo Acceder a la Aplicación

### 1. Iniciar el Servidor de Desarrollo

El servidor ya está corriendo en:
```
http://localhost:3000
```

### 2. Abrir en el Navegador

Abre tu navegador favorito (Chrome, Firefox, Edge) y ve a:
```
http://localhost:3000
```

---

## 📋 Qué Deberías Ver

### Página de Login (Ruta: `/login`)

Deberías ver:
- ✅ Título "Document Analysis"
- ✅ Subtítulo "Sign in to your account"
- ✅ Formulario con campos de Email y Password
- ✅ Botón "Sign in"
- ✅ Link "Forgot password?"
- ✅ Link "Sign up" para registro
- ✅ Cuadro azul con credenciales de prueba

**Credenciales de Prueba:**
- Email: `admin@documentia.com`
- Password: `Admin123!Pass`

---

## 🧪 Pruebas a Realizar

### Prueba 1: Login Exitoso ✅

1. Ve a `http://localhost:3000`
2. Deberías ser redirigido automáticamente a `/login`
3. Ingresa las credenciales de prueba:
   - Email: `admin@documentia.com`
   - Password: `Admin123!Pass`
4. Haz clic en "Sign in"
5. Deberías ver un spinner de carga
6. Serás redirigido a `/dashboard`
7. Verás "Dashboard - Coming soon..."

**Resultado Esperado:** Login exitoso y redirección al dashboard

### Prueba 2: Validación de Formulario ❌

1. Ve a `/login`
2. Deja los campos vacíos
3. Haz clic en "Sign in"
4. Deberías ver mensajes de error en rojo debajo de cada campo

**Resultado Esperado:** Mensajes de validación aparecen

### Prueba 3: Credenciales Incorrectas ❌

1. Ve a `/login`
2. Ingresa email: `test@test.com`
3. Ingresa password: `wrongpassword`
4. Haz clic en "Sign in"
5. Deberías ver un mensaje de error en la parte superior

**Resultado Esperado:** Error de Cognito indicando credenciales incorrectas

### Prueba 4: Registro de Usuario ✅

1. Ve a `/login`
2. Haz clic en "Sign up"
3. Serás redirigido a `/register`
4. Ingresa:
   - Email: tu email real
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
5. Marca el checkbox de términos
6. Haz clic en "Create account"
7. Deberías ver mensaje de éxito
8. Revisa tu email para el código de verificación

**Resultado Esperado:** Registro exitoso y mensaje de verificación

### Prueba 5: Rutas Protegidas 🔒

1. Abre una ventana de incógnito
2. Ve directamente a `http://localhost:3000/dashboard`
3. Deberías ser redirigido automáticamente a `/login`

**Resultado Esperado:** No puedes acceder sin autenticación

### Prueba 6: Logout (Cuando esté implementado)

1. Después de hacer login
2. Busca el botón de logout (aún no implementado en UI)
3. Haz clic
4. Deberías ser redirigido a `/login`

---

## 🐛 Solución de Problemas

### Problema: Página en Blanco

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Comparte los errores para ayudarte

**Posibles Causas:**
- Error de JavaScript
- Problema con las variables de entorno
- Error de compilación

### Problema: Error de Conexión a API

**Síntoma:** Error "Network Error" o "Failed to fetch"

**Solución:**
1. Verifica que el backend esté desplegado
2. Verifica la URL de API en `.env`:
   ```
   VITE_API_URL=https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev
   ```
3. Verifica que Cognito esté configurado correctamente

### Problema: Error de Cognito

**Síntoma:** "User Pool not found" o similar

**Solución:**
1. Verifica las credenciales de Cognito en `.env`:
   ```
   VITE_USER_POOL_ID=us-east-1_b5Vp65XQ3
   VITE_USER_POOL_CLIENT_ID=19j2lqlt7fc5e9ut0k5re692aj
   ```
2. Reinicia el servidor de desarrollo

### Problema: Estilos No Se Ven

**Síntoma:** Página sin colores o mal formateada

**Solución:**
1. Verifica que `index.css` esté importado en `main.tsx`
2. Refresca la página con Ctrl+Shift+R (hard refresh)
3. Limpia la caché del navegador

---

## 📱 Páginas Disponibles

| Ruta | Estado | Descripción |
|------|--------|-------------|
| `/` | ✅ | Redirige a `/login` o `/dashboard` |
| `/login` | ✅ | Página de inicio de sesión |
| `/register` | ✅ | Página de registro |
| `/dashboard` | 🚧 | Placeholder (Coming soon) |
| `/analyze` | 🚧 | Placeholder (Coming soon) |
| `/history` | 🚧 | Placeholder (Coming soon) |
| Otra ruta | ✅ | Muestra 404 |

---

## 🔍 Verificar en la Consola del Navegador

### Comandos Útiles (F12 → Console)

```javascript
// Ver configuración
console.log(import.meta.env)

// Ver si hay usuario autenticado
localStorage.getItem('CognitoIdentityServiceProvider.19j2lqlt7fc5e9ut0k5re692aj.LastAuthUser')

// Limpiar sesión (logout manual)
localStorage.clear()
```

---

## ✅ Checklist de Pruebas

- [ ] Página de login se carga correctamente
- [ ] Formulario de login tiene validación
- [ ] Login con credenciales correctas funciona
- [ ] Login con credenciales incorrectas muestra error
- [ ] Redirección a dashboard después de login
- [ ] Página de registro se carga
- [ ] Validación de contraseña funciona
- [ ] Registro de nuevo usuario funciona
- [ ] Rutas protegidas redirigen a login
- [ ] Estilos se ven correctamente
- [ ] Responsive design funciona en móvil

---

## 📞 Si Necesitas Ayuda

1. **Abre la consola del navegador** (F12)
2. **Copia cualquier error** que veas en rojo
3. **Toma una captura** de lo que ves
4. **Comparte** la información

---

## 🎯 Próximos Pasos

Una vez que el login funcione correctamente:
1. Implementar el módulo de carga de documentos
2. Crear el dashboard con métricas
3. Implementar la página de historial
4. Agregar funcionalidad de exportación

---

## 🚀 Comandos Útiles

### Reiniciar el Servidor
```bash
# Detener: Ctrl+C en la terminal
# Iniciar:
cd frontend
npm run dev
```

### Ver Logs del Servidor
Mira la terminal donde ejecutaste `npm run dev`

### Limpiar y Reinstalar
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

¡Buena suerte con las pruebas! 🎉
