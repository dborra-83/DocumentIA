# Quick Reference: Admin y Marca Blanca

## 🚀 Acceso Rápido

```
URL: http://localhost:3000/admin
Requiere: Autenticación
```

---

## 📋 Tabs Disponibles

| Tab | Funcionalidad |
|-----|---------------|
| **General** | Idioma, zona horaria, formato de fecha |
| **Marca Blanca** | Logo, nombre, tagline |
| **Límites** | Tamaño archivo, páginas PDF, docs/mes |

---

## 🎨 Marca Blanca - Pasos Rápidos

1. **Admin** → **Marca Blanca**
2. **Seleccionar Logo** → Elige imagen
3. **Nombre** → Escribe nombre de tu app
4. **Tagline** → Escribe descripción
5. **Guardar Cambios** → ¡Listo!

---

## 💾 Comandos Útiles

### Guardar Configuración
```typescript
const { updateConfig } = useBranding();
updateConfig({ appName: "Mi App" });
```

### Leer Configuración
```typescript
const { config } = useBranding();
console.log(config.appName);
```

### Resetear
```typescript
const { resetConfig } = useBranding();
resetConfig();
```

---

## 🎯 Valores por Defecto

```typescript
{
  appName: "DocumentIA",
  appTagline: "AI-Powered Document Analysis",
  logoUrl: null,
  primaryColor: "#008FD0",
  secondaryColor: "#0A1732"
}
```

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `AdminPage.tsx` | Página de admin |
| `BrandingContext.tsx` | Estado global |
| `Header.tsx` | Usa branding config |
| `App.tsx` | Envuelve con BrandingProvider |

---

## 🎨 Paleta de Colores

| Color | HEX | Clase Tailwind |
|-------|-----|----------------|
| Navy Dark | #000024 | `navy-dark` |
| Navy Blue | #0A1732 | `navy-blue` |
| Bright Blue | #008FD0 | `bright-blue` |
| Sky Light | #E9F3FA | `sky-light` |
| Turquoise | #08BDBA | `turquoise` |
| Violet | #A56EFF | `violet` |
| Pink | #EE5396 | `pink` |
| Gold | #F1C21B | `gold` |
| Coral | #ED4739 | `coral` |

---

## 🔧 Troubleshooting

| Problema | Solución |
|----------|----------|
| Logo no se muestra | Verifica formato (PNG/JPG/SVG) |
| Cambios no persisten | Click en "Guardar Cambios" |
| Config se perdió | Limpiaste caché? Reconfigura |
| Preview no actualiza | Refresca página |

---

## ✅ Checklist Rápido

- [ ] Login en la app
- [ ] Click en "Admin"
- [ ] Ve a "Marca Blanca"
- [ ] Sube logo
- [ ] Cambia nombre
- [ ] Cambia tagline
- [ ] Revisa preview
- [ ] Guarda cambios
- [ ] Verifica en header
- [ ] Recarga página
- [ ] Config persiste ✓

---

## 🚀 Dev Server

```bash
cd frontend
npm run dev
```

**URL**: http://localhost:3000

---

## 📚 Documentación Completa

- `ADMIN_IMPLEMENTADO.md` - Detalles técnicos
- `GUIA_ADMIN_MARCA_BLANCA.md` - Guía de usuario
- `SESION_DASHBOARD_ADMIN_COMPLETA.md` - Resumen completo

---

¡Todo listo para personalizar! 🎨✨
