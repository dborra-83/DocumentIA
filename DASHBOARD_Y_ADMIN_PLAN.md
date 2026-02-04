# Plan: Dashboard y Administración con Nueva Paleta de Colores

## 🎨 Paleta de Colores

| Nº | Color | HEX | RGB | Uso Sugerido |
|----|-------|-----|-----|--------------|
| 1️⃣ | Azul oscuro casi negro | #000024 | (0, 0, 36) | Fondos oscuros, texto principal |
| 2️⃣ | Azul petróleo oscuro | #0A1732 | (10, 23, 50) | Sidebar, headers, cards oscuras |
| 3️⃣ | Azul brillante | #008FD0 | (0, 143, 208) | Botones primarios, links, acentos |
| 4️⃣ | Celeste muy claro | #E9F3FA | (233, 243, 250) | Fondos claros, hover states |
| 5️⃣ | Blanco | #FFFFFF | (255, 255, 255) | Texto en fondos oscuros, cards |
| 6️⃣ | Turquesa | #08BDBA | (8, 189, 186) | Éxito, completado, positivo |
| 7️⃣ | Violeta | #A56EFF | (165, 110, 255) | Categorías, tags, badges |
| 8️⃣ | Rosa | #EE5396 | (238, 83, 150) | Alertas importantes, destacados |
| 9️⃣ | Amarillo dorado | #F1C21B | (241, 194, 27) | Advertencias, pendientes |
| 🔟 | Rojo coral | #ED4739 | (231, 71, 57) | Errores, eliminación, crítico |

---

## 📊 Fase 1: Dashboard

### Componentes del Dashboard

1. **Estadísticas Generales** (Cards superiores)
   - Total de documentos analizados
   - Documentos este mes
   - Tiempo promedio de análisis
   - Verticales más usados

2. **Gráficos**
   - Documentos por vertical (gráfico de barras)
   - Análisis por día (gráfico de línea)
   - Distribución de estados (gráfico de dona)

3. **Actividad Reciente**
   - Últimos 5 documentos analizados
   - Quick actions

4. **Métricas de Uso**
   - Tokens consumidos
   - Costo estimado
   - Documentos por usuario (si multi-usuario)

### Tecnologías
- **Gráficos**: Recharts (ya compatible con React + TypeScript)
- **Iconos**: Heroicons (ya en uso)
- **Animaciones**: Framer Motion (opcional)

---

## ⚙️ Fase 2: Administración / Configuración

### Sección de Marca Blanca

1. **Identidad Visual**
   - Logo de la aplicación (upload + preview)
   - Nombre de la aplicación
   - Tagline / descripción
   - Favicon

2. **Colores** (opcional para futuro)
   - Color primario
   - Color secundario
   - Color de acento

3. **Configuración General**
   - Idioma por defecto
   - Zona horaria
   - Formato de fecha

4. **Límites y Cuotas**
   - Tamaño máximo de archivo
   - Número máximo de páginas PDF
   - Documentos por mes

5. **Integraciones** (futuro)
   - API keys
   - Webhooks
   - Notificaciones

### Almacenamiento
- **Frontend**: LocalStorage para configuración temporal
- **Backend**: DynamoDB tabla de configuración (futuro)
- **S3**: Para logos y assets

---

## 🎯 Implementación

### Paso 1: Actualizar Paleta de Colores en Tailwind
```javascript
// tailwind.config.js
colors: {
  'navy-dark': '#000024',
  'navy-blue': '#0A1732',
  'bright-blue': '#008FD0',
  'sky-light': '#E9F3FA',
  'turquoise': '#08BDBA',
  'violet': '#A56EFF',
  'pink': '#EE5396',
  'gold': '#F1C21B',
  'coral': '#ED4739',
}
```

### Paso 2: Crear Página de Dashboard
- `/dashboard` - Vista principal con estadísticas
- Componentes:
  - `StatsCard.tsx` - Card de estadística
  - `ChartCard.tsx` - Card con gráfico
  - `RecentActivity.tsx` - Lista de actividad reciente
  - `QuickActions.tsx` - Botones de acción rápida

### Paso 3: Crear Página de Administración
- `/admin` o `/settings` - Configuración
- Tabs:
  - General
  - Marca Blanca
  - Límites
  - Usuarios (futuro)

### Paso 4: Actualizar Navegación
- Agregar Dashboard al menú
- Agregar Settings al menú
- Actualizar Header con nuevo diseño

### Paso 5: Rediseñar Páginas Existentes
- Aplicar nueva paleta de colores
- Actualizar componentes existentes
- Mantener consistencia visual

---

## 📁 Estructura de Archivos

```
frontend/src/
├── pages/
│   ├── DashboardPage.tsx          # NEW
│   ├── AdminPage.tsx              # NEW
│   ├── AnalyzePage.tsx            # UPDATE
│   ├── HistoryPage.tsx            # UPDATE
│   └── ...
├── components/
│   ├── dashboard/
│   │   ├── StatsCard.tsx          # NEW
│   │   ├── ChartCard.tsx          # NEW
│   │   ├── RecentActivity.tsx     # NEW
│   │   └── QuickActions.tsx       # NEW
│   ├── admin/
│   │   ├── BrandingSettings.tsx   # NEW
│   │   ├── GeneralSettings.tsx    # NEW
│   │   ├── LimitsSettings.tsx     # NEW
│   │   └── LogoUploader.tsx       # NEW
│   └── ...
├── contexts/
│   └── BrandingContext.tsx        # NEW
├── hooks/
│   └── useDashboardData.ts        # NEW
└── utils/
    └── chartHelpers.ts            # NEW
```

---

## 🚀 Plan de Ejecución

### Sesión 1: Setup y Dashboard Básico
1. ✅ Instalar dependencias (recharts)
2. ✅ Actualizar tailwind.config con nueva paleta
3. ✅ Crear página de Dashboard
4. ✅ Crear componentes de estadísticas
5. ✅ Implementar gráficos básicos

### Sesión 2: Dashboard Avanzado
1. ✅ Agregar más gráficos
2. ✅ Implementar actividad reciente
3. ✅ Agregar quick actions
4. ✅ Conectar con datos reales

### Sesión 3: Administración
1. ✅ Crear página de Admin
2. ✅ Implementar tabs de configuración
3. ✅ Crear componente de logo uploader
4. ✅ Implementar configuración de marca blanca

### Sesión 4: Integración y Rediseño
1. ✅ Aplicar nueva paleta a todas las páginas
2. ✅ Actualizar Header y navegación
3. ✅ Crear BrandingContext
4. ✅ Testing y ajustes finales

---

## 💡 Características Adicionales Sugeridas

### Dashboard
- Filtros por rango de fechas
- Exportar reportes a PDF
- Comparación mes a mes
- Alertas y notificaciones

### Admin
- Preview en tiempo real de cambios
- Reset a valores por defecto
- Importar/exportar configuración
- Historial de cambios

### General
- Modo oscuro / claro
- Temas predefinidos
- Personalización avanzada de colores
- Multi-idioma

---

## 🎨 Mockup de Diseño

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header (navy-blue)                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Dashboard                                           │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   150    │ │    45    │ │  2.3s    │ │  Legal   │ │
│  │Documents │ │This Month│ │Avg Time  │ │Top Type  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                         │
│  ┌─────────────────────────┐ ┌────────────────────┐   │
│  │                         │ │                    │   │
│  │  Documentos por Día     │ │  Por Vertical      │   │
│  │  (Gráfico de línea)     │ │  (Gráfico barras)  │   │
│  │                         │ │                    │   │
│  └─────────────────────────┘ └────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Actividad Reciente                              │   │
│  │ • documento1.pdf - Completado - hace 2 min      │   │
│  │ • documento2.docx - Procesando - hace 5 min     │   │
│  │ • documento3.txt - Completado - hace 10 min     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Admin Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header (navy-blue)                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚙️ Configuración                                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [General] [Marca Blanca] [Límites] [Usuarios]  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                 │   │
│  │  Marca Blanca                                   │   │
│  │                                                 │   │
│  │  Logo de la Aplicación                          │   │
│  │  ┌─────────────┐                                │   │
│  │  │   [LOGO]    │  [Cambiar Logo]                │   │
│  │  └─────────────┘                                │   │
│  │                                                 │   │
│  │  Nombre de la Aplicación                        │   │
│  │  [Document Analysis Pro        ]                │   │
│  │                                                 │   │
│  │  Tagline                                        │   │
│  │  [AI-Powered Document Insights ]                │   │
│  │                                                 │   │
│  │  [Guardar Cambios]  [Restablecer]              │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### Setup
- [ ] Instalar recharts
- [ ] Actualizar tailwind.config
- [ ] Crear estructura de carpetas

### Dashboard
- [ ] Crear DashboardPage
- [ ] Crear StatsCard component
- [ ] Crear ChartCard component
- [ ] Implementar gráfico de línea (documentos por día)
- [ ] Implementar gráfico de barras (por vertical)
- [ ] Implementar gráfico de dona (estados)
- [ ] Crear RecentActivity component
- [ ] Crear QuickActions component
- [ ] Conectar con API para datos reales

### Admin
- [ ] Crear AdminPage
- [ ] Crear tabs de navegación
- [ ] Crear BrandingSettings component
- [ ] Crear LogoUploader component
- [ ] Crear GeneralSettings component
- [ ] Crear LimitsSettings component
- [ ] Implementar BrandingContext
- [ ] Guardar configuración en localStorage
- [ ] Aplicar configuración en toda la app

### Rediseño
- [ ] Actualizar Header con nueva paleta
- [ ] Actualizar AnalyzePage
- [ ] Actualizar HistoryPage
- [ ] Actualizar LoginPage
- [ ] Actualizar todos los componentes
- [ ] Testing en todas las páginas

---

¿Empezamos con la implementación? 🚀
