# TASK-000 — Auditoría del Proyecto y Mapeo de Vistas Existentes

> Fecha: 2026-03-25
> Estado: Completado

---

## 1. Stack Técnico Real (detectado)

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19.2.4 |
| Estilos | Tailwind CSS 4 (OKLch, variables CSS) |
| Lenguaje | TypeScript 5 |
| Backend / DB | **No instalado aún** — Supabase pendiente |
| Auth | **Simulada** — window.location.href, sin Supabase Auth |
| Componentes base | Primitivos custom (sin shadcn/ui instalado formalmente) |

> **Nota:** El `package.json` solo contiene `next`, `react`, `react-dom`. Supabase, React Hook Form, Zod, Zustand, etc. mencionados en `reglas_diseno.md` **no están instalados aún**. Esto debe resolverse en TASK-002.

---

## 2. Inventario de Rutas Actuales

| Ruta | Archivo | Estado |
|------|---------|--------|
| `/login` | `app/(auth)/login/page.tsx` | V0 — UI completa, auth simulada |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | V0 — UI completa |
| `/set-password` | `app/(auth)/set-password/page.tsx` | V0 — UI completa |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | V0 — UI completa, datos mock |
| `/requests/vacations` | `app/(app)/requests/vacations/page.tsx` | V0 — UI completa, datos mock |
| `/requests/letters` | `app/(app)/requests/letters/page.tsx` | V0 — UI completa, datos mock |
| `/requests/cards` | `app/(app)/requests/cards/page.tsx` | V0 — UI completa, datos mock |
| `/payroll/receipts` | `app/(app)/payroll/receipts/page.tsx` | V0 — UI completa, datos mock |

### Rutas referenciadas en sidebar SIN página implementada

Estas rutas existen en la navegación pero no tienen `page.tsx`:

| Ruta | Módulo MVP |
|------|-----------|
| `/requests/equipment` | Fuera de MVP core |
| `/payroll/management` | Sprint 2 |
| `/attendance` | Backlog post-MVP |
| `/training/courses` | Backlog post-MVP |
| `/training/onboarding` | Backlog post-MVP |
| `/training/admin` | Backlog post-MVP |
| `/performance/reviews` | Backlog post-MVP |
| `/performance/kpis` | Backlog post-MVP |
| `/performance/team` | Backlog post-MVP |
| `/organization/directory` | MVP — TASK-016 |
| `/organization/chart` | Backlog post-MVP |
| `/organization/departments` | Backlog post-MVP |
| `/recruitment/*` | Backlog post-MVP |
| `/documents/personal` | MVP — TASK-019 (expediente) |
| `/documents/policies` | MVP — TASK-018 |
| `/documents/management` | Sprint 2 — TASK-025 |
| `/access/parking` | Ver notas abajo |
| `/access/badges` | Ver notas abajo |
| `/access/management` | Sprint 2 |
| `/announcements` | MVP — TASK-017 |
| `/reports/*` | Backlog post-MVP |
| `/feedback/*` | Backlog post-MVP |
| `/settings` | Fuera del MVP |
| `/help` | Fuera del MVP |

> **Nota acceso/tarjetas:** Las solicitudes de gafete y tarjeta de estacionamiento ya están cubiertas por `/requests/cards`. Las rutas `/access/parking` y `/access/badges` del sidebar apuntan a una vista de *administración* de esos accesos, que es Sprint 2.

---

## 3. Inventario de Vistas V0 — Reutilizables

Todas las vistas y componentes siguientes vienen de V0 y están **en buen estado para reutilizar**:

### Layouts
| Componente | Archivo | Reutilizable para |
|-----------|---------|------------------|
| App Layout | `app/(app)/layout.tsx` | Todas las vistas del portal |
| Auth Layout | `app/(auth)/layout.tsx` | Login, forgot-password, set-password |
| Sidebar | `components/layout/sidebar.tsx` | Layout principal — solo ajustar nav por rol real |
| Header | `components/layout/header.tsx` | Layout principal |
| Breadcrumbs | `components/layout/breadcrumbs.tsx` | Navegación interna |

### Páginas completas V0
| Vista | Estado actual | Acción recomendada |
|-------|--------------|-------------------|
| Login | UI completa, auth mock | Conectar Supabase Auth (TASK-004) |
| Forgot Password | UI completa | Conectar Supabase Auth |
| Set Password | UI completa | Conectar Supabase Auth |
| Dashboard (Employee/HR/Manager) | UI completa, datos mock | Conectar datos reales (TASK-009, TASK-020) |
| Solicitudes — Vacaciones | UI completa, loading/empty/error states | Conectar Supabase (TASK-011, TASK-012) |
| Solicitudes — Constancias | UI completa, modal de solicitud | Conectar Supabase |
| Solicitudes — Tarjetas/Gafete | UI completa, timeline, file upload | Conectar Supabase |
| Recibos de nómina | UI completa, filtros, detalle con desglose | Conectar Supabase + Storage (TASK-014) |

### Componentes UI base (`components/ui/`)
| Componente | Descripción |
|-----------|-------------|
| `Card`, `CardHeader`, `CardContent` | Contenedor estándar de vistas |
| `Button` | Variantes: primary, secondary, outline, ghost, danger; con isLoading |
| `Badge` | Variantes: success, warning, error, info, outline |
| `Input` | Campo de texto con label y error |
| `Tabs` | Filtros con contadores |
| `EmptyState` | Estado vacío con icono, título, descripción, acción |
| `Skeleton` | Loading placeholder |
| `Avatar` | Foto de perfil con fallback |
| `Progress` | Barra de progreso |
| `Divider` | Separador con label opcional |

### Componentes UI extendidos (`components/ui/shared.tsx`)
| Componente | Descripción |
|-----------|-------------|
| `Modal` | Diálogo con tamaños sm/md/lg/xl, footer, ESC key |
| `Drawer` | Panel lateral derecho/izquierdo |
| `Timeline` | Historial de pasos con estados completed/current/rejected |
| `Stepper` | Asistente de pasos |
| `Select` | Dropdown custom con búsqueda |
| `FileUpload` | Drag & drop con lista de archivos |
| `DatePicker` | Input de fecha con label/error |
| `Textarea` | Área de texto con label/error |
| `Checkbox` | Con descripción |
| `FilterBar` | Barra de filtros con selects |
| `SearchInput` | Búsqueda con botón limpiar |
| `ConfirmDialog` | Diálogo de confirmación destructiva |
| `DataTable` | Tabla genérica con columnas configurables |

### Dashboard Widgets (`components/dashboard/widgets.tsx`)
`StatsCard`, `QuickActions`, `PendingRequests`, `VacationBalance`, `Announcements`, `TrainingProgress`, `TeamAlerts`, `HROperations`, `PayrollWidget`

### Iconos (`components/icons.tsx`)
Biblioteca completa de iconos SVG inline (Lucide-style). Disponibles: Dashboard, Calendar, Wallet, Document, Users, Briefcase, GraduationCap, Megaphone, ChartBar, Target, Settings, HelpCircle, ChevronDown/Right, Car, IdCard, MessageSquare, FileText, Clock, Inbox, Plus, Check, Close, AlertCircle, Eye, EyeOff, Download, ArrowRight, TrendingUp/Down, Mail, Lock, y más.

---

## 4. Estado del Sistema de Diseño

- Tema: OKLch, variables CSS definidas en globals.css
- Acento: naranja/terracota (`--primary: oklch(0.62 0.2212 25.56)`)
- Dark mode: soportado via clase `.dark` en `html`
- Radio: `0.3rem`
- El diseño es **consistente y completo** — no romper bajo ninguna circunstancia

---

## 5. Vistas Faltantes para el MVP

Las siguientes vistas deben **crearse nuevas** respetando el diseño V0:

| Vista | Tarea | Prioridad |
|-------|-------|-----------|
| Directorio de colaboradores | TASK-016 | Sprint 1 |
| Tablero de anuncios | TASK-017 | Sprint 1 |
| Reglamentos/políticas (listado + descarga) | TASK-018 | Sprint 1 |
| Expediente del colaborador (mis documentos) | TASK-019 | Sprint 1 |
| Detalle de solicitud (historial/timeline) | TASK-013 | Sprint 1 |
| Dashboard RH (métricas operativas) | TASK-020 | Sprint 2 |
| Bandeja RH de solicitudes | TASK-021 | Sprint 2 |
| Flujo de aprobación/rechazo | TASK-022 | Sprint 2 |
| Gestión RH de expedientes | TASK-023 | Sprint 2 |
| Administración de anuncios (CRUD RH) | TASK-024 | Sprint 2 |
| Administración de reglamentos (CRUD RH) | TASK-025 | Sprint 2 |

> El Dashboard de RH ya tiene un esqueleto dentro de `dashboard/page.tsx` (tab "HR View") — reutilizarlo como base para TASK-020.

---

## 6. Propuesta de Reutilización por Módulo

| Módulo | Reutilizar de V0 | Acción necesaria |
|--------|-----------------|-----------------|
| Auth | `(auth)/login`, `forgot-password`, `set-password` | Solo conectar Supabase Auth |
| Layout | Sidebar, Header, Breadcrumbs, AppLayout | Conectar rol real desde sesión |
| Dashboard colaborador | `dashboard/page.tsx` → `EmployeeDashboard` | Reemplazar mock por datos Supabase |
| Dashboard RH | `dashboard/page.tsx` → `HRDashboard` | Extraer a página independiente + datos reales |
| Solicitudes — listado | `requests/vacations/page.tsx` como patrón | Adaptar para todos los tipos |
| Solicitudes — formulario | `NewRequestForm` + `Modal` + `FileUpload` | Conectar Supabase, validar por tipo |
| Solicitudes — detalle | Componente `Timeline` de `shared.tsx` | Crear página de detalle nueva |
| Recibos de nómina | `payroll/receipts/page.tsx` | Conectar Storage + Supabase |
| Constancias | `requests/letters/page.tsx` | Conectar Supabase |
| Tarjetas/gafete | `requests/cards/page.tsx` | Conectar Supabase |
| Directorio | `DataTable` + `SearchInput` + `FilterBar` | Nueva página, datos de Supabase |
| Anuncios | `Announcements` widget + `Card` | Nueva página, datos de Supabase |
| Reglamentos | `DataTable` + `FileUpload` | Nueva página, datos + Storage |
| Expediente | `FileUpload` + `Timeline` + `DataTable` | Nueva página, datos + Storage |
| Bandeja RH | `DataTable` + `FilterBar` + `SearchInput` | Nueva página, datos de Supabase |
| Aprobaciones | `Timeline` + `Modal` + `ConfirmDialog` | Extender detalle de solicitud |

---

## 7. Lo que NO existe todavía (base técnica)

Estas dependencias son bloqueantes para TASK-002 en adelante:

- [ ] `@supabase/supabase-js` — cliente Supabase
- [ ] `@supabase/ssr` — manejo de sesión SSR/Next.js
- [ ] Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `react-hook-form` + `zod` — formularios validados
- [ ] `zustand` — estado global (sesión, rol)
- [ ] `date-fns` — fechas en español
- [ ] Schema SQL de tablas MVP
- [ ] Políticas RLS
- [ ] Buckets de Storage

---

## 8. Criterios de Aceptación — Validación

| Criterio | Estado |
|---------|--------|
| Existe documento/resumen del estado actual | Completado — este archivo |
| Vistas reutilizables marcadas | Completado — secciones 3 y 6 |
| Vistas nuevas mínimas identificadas | Completado — sección 5 |
| Sin ambigüedad sobre qué se conserva y qué se crea | Completado — sección 6 |

---

## 9. Resumen Ejecutivo

El proyecto tiene una base visual de V0 **solida y completa**: layout principal, 8 rutas de página, sistema de componentes UI completo (30+ componentes), paleta de colores y design tokens definidos, y patterns de loading/empty/error implementados.

**Lo que existe funciona bien y no debe rehacerse.** El trabajo pendiente es:
1. Instalar y configurar Supabase (TASK-002)
2. Definir el schema de base de datos (TASK-003)
3. Reemplazar el mock de auth por Supabase Auth (TASK-004)
4. Conectar roles y permisos reales (TASK-005)
5. Implementar RLS y Storage (TASK-006, TASK-007)
6. Crear las vistas faltantes del MVP usando los patrones y componentes ya existentes
