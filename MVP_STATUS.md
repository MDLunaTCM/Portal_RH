# MVP_STATUS.md — Estado Final del Portal RH

> Fecha: 2026-03-26
> Sprint completado: Sprint 3 (TASK-000 → TASK-031)
> Estado general: **MVP implementado y funcional**

---

## 1. Resumen Ejecutivo

El portal de RH pasó de una base V0 estática (UI completa, datos mock, auth simulada) a una aplicación **completamente funcional integrada con Supabase**. Se implementaron los 4 sprints planificados, cubriendo los 10 flujos del MVP y todos los criterios de aceptación del TASKS.md.

El sistema es **seguro por diseño**: autenticación con Supabase Auth, RLS en todas las tablas sensibles, permisos validados en server actions (nunca en cliente), URLs firmadas para descarga de archivos, y bitácora de auditoría para acciones críticas.

---

## 2. Stack Final

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.1 (App Router, `proxy.ts`) |
| UI | React 19.2.4 |
| Estilos | Tailwind CSS 4 (OKLch, variables CSS, sin hardcoded colors) |
| Lenguaje | TypeScript 5 |
| Backend / DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (PKCE, SSR) |
| Storage | Supabase Storage (4 buckets privados) |
| Componentes base | Design system propio (shadcn-style, `components/ui/`) |

---

## 3. Módulos MVP — Terminados

### 3.1 Auth (TASK-004, TASK-005, TASK-006)
| Funcionalidad | Estado |
|--------------|--------|
| Login con email + contraseña | ✅ |
| Logout | ✅ |
| Olvidé mi contraseña | ✅ |
| Establecer contraseña nueva | ✅ |
| Sesión persistente (SSR + cliente) | ✅ |
| Protección de rutas (`proxy.ts`) | ✅ |
| Sistema de roles: employee, manager, hr_admin, super_admin | ✅ |
| Guards de rol por página (render + redirect) | ✅ |

### 3.2 Dashboard (TASK-009, TASK-020)
| Vista | Estado |
|-------|--------|
| Dashboard colaborador (stats, quick actions, solicitudes pendientes, anuncios) | ✅ |
| Dashboard manager (stats de equipo, solicitudes, vacaciones) | ✅ |
| Dashboard RH (métricas operativas: activos, pendientes, documentos, ingresos 30d) | ✅ |
| Alertas de equipo (HR) | ✅ |
| Widget de nómina | ✅ |
| Widget de balance vacacional (datos reales cuando existen) | ✅ |

### 3.3 Solicitudes — Colaborador (TASK-010 al TASK-015)
| Funcionalidad | Estado |
|--------------|--------|
| Catálogo de tipos: vacaciones, constancia, reposición tarjeta, estacionamiento, gafete, actualización documental | ✅ |
| Formulario dinámico por tipo (text, number, date, select, textarea, boolean, file) | ✅ |
| Validación por campo + cross-field validation configurable | ✅ |
| Adjuntos con upload a Storage | ✅ |
| Listado propio con filtros y tabs (todas/pendientes/aprobadas/rechazadas) | ✅ |
| Detalle con timeline de estado y metadata dinámica | ✅ |
| Descarga de adjuntos vía URL firmada | ✅ |
| Redirecciones legacy (`/requests/vacations`, `/requests/letters`, `/requests/cards`) | ✅ |

### 3.4 Solicitudes — RH/Gestor (TASK-021, TASK-022)
| Funcionalidad | Estado |
|--------------|--------|
| Bandeja RH con todas las solicitudes + filtros (tipo, estado, fechas, búsqueda) | ✅ |
| Flujo de aprobación / rechazo / solicitar cambios | ✅ |
| Notas del revisor obligatorias en rechazo | ✅ |
| Historial en timeline del detalle de solicitud | ✅ |
| Registro en audit log por cada acción de revisión | ✅ |

### 3.5 Recibos de Nómina (TASK-014)
| Funcionalidad | Estado |
|--------------|--------|
| Listado de recibos por periodo (desc) | ✅ |
| Modal de detalle: ingresos, deducciones, neto | ✅ |
| Descarga PDF vía URL firmada | ✅ |
| Resumen YTD (acumulado del año) | ✅ |
| Estado vacío + error + loading skeleton | ✅ |

### 3.6 Directorio de Colaboradores (TASK-016)
| Funcionalidad | Estado |
|--------------|--------|
| Listado con búsqueda por nombre, puesto, departamento | ✅ |
| Filtros por departamento y puesto | ✅ |
| Modal de detalle por colaborador | ✅ |
| Estados loading / empty / error | ✅ |

### 3.7 Anuncios (TASK-017, TASK-024)
| Funcionalidad | Estado |
|--------------|--------|
| Tablón público: cards con categoría, fijado, vence pronto | ✅ |
| Modal de anuncio completo | ✅ |
| Filtros: búsqueda + categoría | ✅ |
| Widget en dashboard (3 más recientes) | ✅ |
| Gestión RH: crear, editar, publicar, despublicar, eliminar | ✅ |
| Audiencia configurable por rol | ✅ |
| Categorías: General, Eventos, Beneficios, Avisos, Urgente | ✅ |

### 3.8 Reglamentos y Políticas (TASK-018, TASK-025)
| Funcionalidad | Estado |
|--------------|--------|
| Tablón público: grid con descarga directa vía URL firmada | ✅ |
| Filtros: búsqueda + categoría | ✅ |
| Gestión RH: subir PDF/DOCX, editar metadatos, publicar, despublicar, eliminar | ✅ |
| Categorías: Reglamentos, Manuales, Procedimientos, Beneficios, Seguridad | ✅ |
| Versioning semántico por documento | ✅ |

### 3.9 Expediente del Colaborador (TASK-019, TASK-023)
| Funcionalidad | Estado |
|--------------|--------|
| Vista personal: listado de documentos propios con estado de revisión | ✅ |
| Upload de documentos con validación (PDF/imágenes, 20 MB máx) | ✅ |
| Vista de detalle con estado, notas del revisor y descarga | ✅ |
| Gestión RH: revisar, aprobar/revocar expedientes de todos los colaboradores | ✅ |
| Notas del revisor visibles al colaborador | ✅ |
| Rollback de storage en caso de error en DB | ✅ |

### 3.10 Bitácora de Auditoría (TASK-026)
| Funcionalidad | Estado |
|--------------|--------|
| Registro automático en acciones de solicitudes, documentos, anuncios, políticas | ✅ |
| Vista de bitácora solo para super_admin | ✅ |
| Filtros: acción, recurso, rango de fechas | ✅ |
| Payload de metadata por acción | ✅ |
| `writeAuditLog` fire-and-forget (no bloquea el flujo principal) | ✅ |

---

## 4. Infraestructura Técnica

### 4.1 Arquitectura de módulos
```
modules/
├── auth/          context, actions, hooks, types, permissions
├── requests/      actions, catalog, hooks (list, detail, types, my-requests), types
├── documents/     actions, hooks (personal, HR), types
├── announcements/ actions, hooks (dashboard widget, board, HR), types
├── policies/      actions, hooks (public, HR), types
├── payroll/       hooks, types
├── hr/            hooks (dashboard, pending, requests-list), types
├── directory/     hooks
├── audit/         log (write), hooks (read)
└── storage/       actions (signed URLs, delete), paths
```

### 4.2 Storage — Buckets privados
| Bucket | Propósito | Convención de path |
|--------|-----------|-------------------|
| `payroll-receipts` | Recibos PDF | `{employee_id}/{period}/{filename}` |
| `employee-documents` | Expediente | `{employee_id}/{category}/{filename}` |
| `policies` | Reglamentos y políticas | `{category}/{filename}` |
| `request-attachments` | Adjuntos de solicitudes | `{request_id}/{filename}` |

### 4.3 Rutas implementadas
| Ruta | Acceso | Módulo |
|------|--------|--------|
| `/` | Redirect → `/login` | — |
| `/login` | Público | Auth |
| `/forgot-password` | Público | Auth |
| `/set-password` | Público | Auth |
| `/dashboard` | Todos | Dashboard |
| `/requests` | Todos | Solicitudes |
| `/requests/new` | Todos | Solicitudes |
| `/requests/[id]` | Todos (own) | Solicitudes |
| `/payroll/receipts` | Todos | Nómina |
| `/organization/directory` | Todos | Directorio |
| `/announcements` | Todos | Anuncios |
| `/documents/personal` | Todos | Expediente |
| `/documents/policies` | Todos | Reglamentos |
| `/hr/requests` | hr_admin, super_admin | Bandeja RH |
| `/documents/management` | hr_admin, super_admin | Gestión expedientes |
| `/announcements/management` | hr_admin, super_admin | Gestión anuncios |
| `/documents/policies/management` | hr_admin, super_admin | Gestión reglamentos |
| `/audit` | super_admin | Bitácora |

### 4.4 Capas de seguridad
1. **`proxy.ts`** — redirige a `/login` si no hay sesión activa
2. **Render guard en página** — redirige por rol (positive matching: `role !== "hr_admin" && role !== "super_admin"`)
3. **Server actions** — verifican identidad del usuario server-side, nunca confían en el cliente
4. **Supabase RLS** — políticas en DB para cada tabla y bucket

---

## 5. Deuda Técnica Conocida

### Prioridad alta
| Deuda | Descripción |
|-------|-------------|
| Stats con `—` en dashboard | Balance vacacional, capacitaciones, próximo pago, métricas de manager usan placeholder `—`. Requieren queries específicos o módulos aún no implementados. |
| Tipos Supabase desactualizados | `request_attachments` usa `as any` porque los tipos locales no se regeneraron tras la migración. Corregir con `supabase gen types typescript`. |
| Sin toast de éxito | Las operaciones CRUD no muestran confirmación visual de éxito (la UI se actualiza por refetch implícito). Falta integrar `react-hot-toast` o equivalente. |

### Prioridad media
| Deuda | Descripción |
|-------|-------------|
| Filter bars con `<select>` nativo | Los filtros de `hr/requests`, `documents/management` y `audit` usan `<select>` HTML nativo con tokens correctos, no el componente `Select` del design system. Funcional y bien estilizado, pero inconsistente. |
| Sin paginación real | Listas usan `.limit(300)` o similar. Para datasets grandes se necesita paginación con cursor o offset. |
| Quick actions en dashboard con rutas 404 | Accesos rápidos a módulos del backlog (asistencia, capacitación, desempeño, reclutamiento) llevan a la página catch-all `[...slug]`. No rompen el app, pero el UX es confuso. |
| `[...slug]` catch-all sin diseño de "próximamente" | La página muestra contenido genérico. Debería mostrar una vista amigable de "módulo en desarrollo". |

### Prioridad baja
| Deuda | Descripción |
|-------|-------------|
| Sin i18n infraestructura | Textos en español hardcodeados directamente. Si el proyecto requiere multilenguaje en el futuro, requiere refactor importante. |
| Sin manejo de sesión expirada en tiempo real | Si una sesión expira mientras el usuario está activo, la siguiente petición fallará silenciosamente. Falta un interceptor que detecte `401` y redirija a login. |
| Sin rate limiting en server actions | Las acciones de auth y upload no tienen rate limiting a nivel aplicación (depende de Supabase). |
| Migraciones no en el repo | `supabase/migrations/` existe pero no se verificó si el schema completo está commiteado. |

---

## 6. Pendientes Post-MVP (Backlog)

Los siguientes módulos están referenciados en el sidebar pero no implementados. Están en el backlog y **no son parte del MVP**:

### Gestión de Personas
- Altas y bajas de colaboradores
- Organigrama dinámico
- Control de headcount
- Actas administrativas

### Reclutamiento
- Requisición de vacantes
- Seguimiento de candidatos
- Filtrado de CVs con IA

### Capacitación y Desempeño
- LMS / onboarding
- Evaluaciones de desempeño
- KPIs y tableros gerenciales

### Asistencia y Accesos
- Checador de asistencia
- Gestión de accesos y gafetes (administración)
- Materiales y equipo de trabajo

### Bienestar y Clima
- Buzón de sugerencias / denuncias NOM-035
- Muro de reconocimientos
- Encuestas de clima laboral
- Biblioteca digital y préstamos

### Integraciones y Plataforma
- Integración con sistemas de nómina actuales
- Chatbot 24/7 de RH (IA)
- App móvil nativa
- Reportes y analíticas avanzadas

---

## 7. Variables de Entorno Requeridas

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# Supabase Service Role (solo server-side, para audit log)
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

> El archivo `.env.local` está en `.gitignore`. Para un nuevo entorno de desarrollo, copiar `.env.example` (si existe) o solicitar las variables al equipo.

---

## 8. Cómo Iniciar el Entorno de Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local   # o solicitar al equipo

# 3. Iniciar Supabase local (opcional — requiere Docker)
npx supabase start

# 4. Correr el proyecto
npm run dev
```

Para regenerar los tipos de Supabase tras cambios en el schema:
```bash
npx supabase gen types typescript --local > types/database.ts
```

---

## 9. Criterios de Aceptación — Validación TASK-031

| Criterio | Estado |
|---------|--------|
| Documentación breve del estado actual | ✅ Secciones 1–4 |
| Lista de módulos MVP terminados | ✅ Sección 3 (10 módulos) |
| Lista de pendientes post-MVP | ✅ Sección 6 |
| Lista de deuda técnica conocida | ✅ Sección 5 (9 items priorizados) |
