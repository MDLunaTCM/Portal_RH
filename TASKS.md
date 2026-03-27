# TASKS.md

## Objetivo

Este archivo define el plan de ejecución del MVP del portal de RH con **React + Supabase**. Debe usarse como guía operativa para que un coding agent implemente el proyecto **tarea por tarea**, respetando el estado actual del proyecto y reutilizando las pantallas/vistas ya diseñadas en V0 antes de crear nuevas.

---

## Reglas obligatorias antes de comenzar

1. **Leer `CLAUDE.md` antes de ejecutar cualquier tarea.**
2. **Leer `reglas_diseno.md` antes de tocar UI.**
3. **Auditar el proyecto actual antes de crear nuevas vistas.**
4. **Identificar qué pantallas ya existen y cuáles provienen de V0.**
5. **Reutilizar componentes, layouts y vistas existentes antes de crear nuevas.**
6. **No romper la estética ni los patrones visuales ya definidos.**
7. **Toda funcionalidad sensible debe contemplar permisos y RLS en Supabase.**
8. **No avanzar a una tarea dependiente si la tarea base no está terminada.**

---

## Definición de Done (DoD)

Una tarea se considera terminada si cumple con todo lo siguiente:

* código implementado y funcionando
* tipado correcto
* sin duplicar vistas existentes innecesariamente
* respeta `CLAUDE.md`
* respeta `reglas_diseno.md`
* criterios de aceptación cubiertos
* manejo de loading / empty / error states
* permisos considerados si aplica
* integración con Supabase validada si aplica
* archivos y cambios documentados brevemente

---

## Orden de ejecución recomendado

* Sprint 0: descubrimiento + base técnica
* Sprint 1: experiencia del colaborador
* Sprint 2: operación RH
* Sprint 3: endurecimiento, QA y cierre del MVP

---

# Sprint 0 — Descubrimiento y Base Técnica

## Objetivo

Reconocer el proyecto actual, documentar lo existente en V0 y dejar lista la base técnica para desarrollar sin retrabajo.

### TASK-000

**Título:** Auditar proyecto actual y mapear vistas existentes

**Descripción:**
Revisar la estructura del proyecto y documentar todas las vistas, rutas, componentes y layouts existentes. Identificar cuáles fueron creadas en V0 y cuáles están incompletas o solo son UX/UI.

**Entregables:**

* inventario de rutas actuales
* inventario de vistas existentes
* listado de vistas provenientes de V0
* listado de vistas faltantes para el MVP
* propuesta de reutilización por módulo

**Criterios de aceptación:**

* existe un documento/resumen del estado actual del proyecto
* quedan marcadas las vistas reutilizables
* quedan identificadas las vistas nuevas mínimas necesarias
* no hay ambigüedad sobre qué se conserva y qué se crea

**Dependencias:** ninguna

---

### TASK-001

**Título:** Definir estructura modular del frontend

**Descripción:**
Organizar el proyecto en módulos por dominio sin romper la base actual. La estructura debe facilitar escalabilidad y mantenimiento.

**Entregables:**

* estructura de carpetas propuesta e implementada si aplica
* separación clara por módulos
* carpeta shared/ui/services/lib si corresponde

**Criterios de aceptación:**

* estructura clara por dominio
* fácil navegación del proyecto
* no se rompe el código existente
* documentada la convención de organización

**Dependencias:** TASK-000

---

### TASK-002

**Título:** Configurar Supabase en el proyecto

**Descripción:**
Conectar el frontend con Supabase y configurar cliente, variables de entorno y archivos base de acceso.

**Entregables:**

* cliente Supabase configurado
* variables de entorno documentadas
* acceso centralizado al cliente

**Criterios de aceptación:**

* el proyecto se conecta correctamente a Supabase
* configuración reutilizable y tipada
* no hay credenciales hardcodeadas

**Dependencias:** TASK-001

---

### TASK-003

**Título:** Diseñar esquema inicial de base de datos

**Descripción:**
Definir las tablas mínimas del MVP, relaciones, catálogos e índices básicos.

**Entregables:**

* esquema inicial de tablas
* relaciones documentadas
* scripts o migraciones iniciales

**Tablas mínimas esperadas:**

* profiles
* departments
* positions
* request_types
* requests
* request_attachments
* payroll_receipts
* employee_documents
* announcements
* policies
* audit_logs

**Criterios de aceptación:**

* esquema cubre el MVP
* relaciones claras
* nombres consistentes
* listo para implementar en Supabase

**Dependencias:** TASK-002

---

### TASK-004

**Título:** Implementar autenticación y sesiones

**Descripción:**
Implementar login, logout, manejo de sesión y protección de rutas.

**Entregables:**

* flujo de login
* logout
* persistencia de sesión
* rutas protegidas

**Criterios de aceptación:**

* login funcional
* logout funcional
* no se puede acceder a rutas privadas sin sesión
* redirección básica post-login

**Dependencias:** TASK-002

---

### TASK-005

**Título:** Implementar sistema de roles y permisos

**Descripción:**
Definir y conectar roles base del sistema: `employee`, `manager`, `hr_admin`, `super_admin`.

**Entregables:**

* modelo de roles integrado
* guards/validaciones en frontend
* base para RLS en backend

**Criterios de aceptación:**

* la app distingue roles correctamente
* las vistas muestran contenido según permisos
* existe una estrategia clara para RLS

**Dependencias:** TASK-003, TASK-004

---

### TASK-006

**Título:** Configurar RLS para tablas sensibles

**Descripción:**
Crear políticas de acceso en Supabase para proteger datos personales, solicitudes, recibos y documentos.

**Entregables:**

* políticas RLS para tablas del MVP
* validación por owner y por rol

**Criterios de aceptación:**

* employee solo accede a su información
* hr_admin accede a lo permitido por su rol
* manager solo ve lo correspondiente
* tablas sensibles protegidas

**Dependencias:** TASK-005

---

### TASK-007

**Título:** Configurar Storage para documentos sensibles

**Descripción:**
Crear buckets y estrategia de organización para recibos, adjuntos y documentos del expediente.

**Entregables:**

* buckets definidos
* convención de paths
* acceso seguro según rol/ownership

**Criterios de aceptación:**

* archivos organizados por módulo/tipo
* acceso restringido
* estrategia documentada

**Dependencias:** TASK-002, TASK-006

---

### TASK-008

**Título:** Construir layout base y navegación principal

**Descripción:**
Crear o adaptar el layout principal usando lo ya hecho en V0, con navegación por rol y estructura responsive.

**Entregables:**

* layout principal
* sidebar/header/topbar según diseño existente
* navegación inicial del MVP

**Criterios de aceptación:**

* layout consistente con diseño existente
* navegación usable
* responsive
* reutilización priorizada de V0

**Dependencias:** TASK-000, TASK-004, TASK-005

---

# Sprint 1 — MVP Colaborador

## Objetivo

Entregar la primera experiencia funcional para el colaborador final.

### TASK-009

**Título:** Implementar dashboard del colaborador

**Descripción:**
Construir o adaptar la pantalla inicial del colaborador con accesos rápidos, resumen de solicitudes y anuncios recientes.

**Entregables:**

* dashboard colaborador
* accesos rápidos
* resumen básico

**Criterios de aceptación:**

* carga información básica del colaborador
* muestra accesos a módulos principales
* muestra anuncios recientes
* se adapta a mobile y desktop

**Dependencias:** TASK-008

---

### TASK-010

**Título:** Implementar catálogo de tipos de solicitud

**Descripción:**
Crear la base de tipos de solicitud del MVP y su representación en frontend.

**Tipos mínimos:**

* vacaciones
* constancia laboral
* reposición de tarjeta
* tarjeta de estacionamiento
* gafete
* actualización documental

**Criterios de aceptación:**

* catálogo disponible en DB y frontend
* cada tipo tiene nombre, código y reglas mínimas
* listo para alimentar formularios

**Dependencias:** TASK-003

---

### TASK-011

**Título:** Implementar listado de solicitudes del colaborador

**Descripción:**
Permitir al colaborador ver sus solicitudes con filtros básicos y estatus.

**Entregables:**

* vista de listado
* filtros mínimos
* navegación a detalle

**Criterios de aceptación:**

* solo muestra solicitudes propias
* permite identificar tipo, fecha y estatus
* tiene estados loading/empty/error

**Dependencias:** TASK-010, TASK-005

---

### TASK-012

**Título:** Implementar creación de solicitudes

**Descripción:**
Construir el flujo para que el colaborador genere una nueva solicitud según el tipo seleccionado.

**Entregables:**

* formulario dinámico por tipo
* validaciones mínimas
* guardado en DB

**Criterios de aceptación:**

* se puede crear una solicitud válida
* se guardan metadata y campos necesarios
* valida adjuntos si aplica
* respeta diseño existente

**Dependencias:** TASK-010, TASK-011, TASK-007

---

### TASK-013

**Título:** Implementar detalle e historial de solicitud

**Descripción:**
Mostrar detalle de la solicitud, estatus, comentarios y adjuntos.

**Criterios de aceptación:**

* el colaborador puede ver el detalle completo
* muestra timeline o historial básico si existe
* muestra comentarios RH si existen
* permite revisar adjuntos

**Dependencias:** TASK-011, TASK-012

---

### TASK-014

**Título:** Implementar módulo de recibos de nómina

**Descripción:**
Permitir al colaborador listar y descargar sus recibos XML/PDF.

**Entregables:**

* listado por periodo
* descarga XML
* descarga PDF

**Criterios de aceptación:**

* solo el dueño accede a sus recibos
* listado ordenado por fecha
* descargas funcionales
* interfaz clara y responsive

**Dependencias:** TASK-007, TASK-006

---

### TASK-015

**Título:** Implementar módulo de constancias y reposiciones desde solicitudes

**Descripción:**
Aterrizar los tipos de solicitud del MVP con sus formularios y validaciones específicas.

**Criterios de aceptación:**

* vacaciones funcional
* constancia funcional
* reposición funcional
* estacionamiento/gafete funcional
* validaciones por tipo operando

**Dependencias:** TASK-012

---

### TASK-016

**Título:** Implementar directorio de colaboradores

**Descripción:**
Crear o adaptar una vista para consultar colaboradores por nombre, área o puesto.

**Entregables:**

* listado de colaboradores
* búsqueda/filtros
* detalle resumido

**Criterios de aceptación:**

* carga lista desde DB
* búsqueda usable
* respeta permisos
* UI consistente con el sistema

**Dependencias:** TASK-003, TASK-008

---

### TASK-017

**Título:** Implementar tablero de anuncios

**Descripción:**
Mostrar anuncios internos publicados por RH.

**Criterios de aceptación:**

* se listan anuncios publicados
* se puede abrir detalle
* ordenados por fecha/publicación
* soporta estado vacío

**Dependencias:** TASK-003, TASK-008

---

### TASK-018

**Título:** Implementar reglamentos y documentos internos

**Descripción:**
Mostrar reglamentos, políticas o documentos internos descargables.

**Criterios de aceptación:**

* listado visible para usuarios autorizados
* detalle o descarga funcional
* estructura por categoría si aplica

**Dependencias:** TASK-003, TASK-007

---

### TASK-019

**Título:** Implementar expediente del colaborador

**Descripción:**
Crear el módulo para visualizar y actualizar documentos del expediente propio.

**Criterios de aceptación:**

* ve listado de documentos propios
* puede subir actualización documental
* ve estatus de revisión
* flujo seguro para archivos

**Dependencias:** TASK-007, TASK-006

---

# Sprint 2 — MVP RH / Aprobaciones

## Objetivo

Dar herramientas operativas a RH para administrar solicitudes y documentos.

### TASK-020

**Título:** Implementar dashboard RH

**Descripción:**
Crear dashboard para RH con resumen de pendientes, solicitudes y actividad reciente.

**Criterios de aceptación:**

* muestra métricas operativas básicas
* accesos rápidos RH
* responsive
* distingue experiencia RH de colaborador

**Dependencias:** TASK-008, TASK-005

---

### TASK-021

**Título:** Implementar bandeja RH de solicitudes

**Descripción:**
Crear listado administrativo de solicitudes con filtros y acciones.

**Entregables:**

* tabla/listado de solicitudes
* filtros por tipo, estatus, fecha, colaborador
* navegación a detalle

**Criterios de aceptación:**

* RH puede consultar solicitudes permitidas
* filtros funcionales
* buen rendimiento en listados
* estados visuales correctos

**Dependencias:** TASK-020, TASK-012

---

### TASK-022

**Título:** Implementar flujo de aprobación/rechazo de solicitudes

**Descripción:**
Permitir que RH y/o manager aprueben, rechacen o soliciten cambios a una solicitud.

**Criterios de aceptación:**

* cambio de estatus persistido
* comentario opcional/obligatorio según acción
* historial mínimo de revisión
* permisos correctos

**Dependencias:** TASK-021

---

### TASK-023

**Título:** Implementar gestión RH de expedientes

**Descripción:**
Permitir a RH revisar, aprobar o rechazar documentos del expediente del colaborador.

**Criterios de aceptación:**

* RH puede ver expedientes autorizados
* puede aprobar/rechazar documentos
* puede dejar comentarios
* cambios quedan guardados

**Dependencias:** TASK-019, TASK-020

---

### TASK-024

**Título:** Implementar administración de anuncios

**Descripción:**
Permitir a RH crear, editar, publicar y despublicar anuncios.

**Criterios de aceptación:**

* CRUD básico de anuncios
* control de publicación
* audiencia configurable mínima si aplica
* solo RH/admin puede acceder

**Dependencias:** TASK-017, TASK-020

---

### TASK-025

**Título:** Implementar administración de reglamentos/policies

**Descripción:**
Permitir a RH subir y administrar reglamentos, manuales y políticas.

**Criterios de aceptación:**

* RH puede crear/editar/activar/desactivar documentos
* archivos disponibles para usuarios autorizados
* categorización mínima implementada

**Dependencias:** TASK-018, TASK-020, TASK-007

---

### TASK-026

**Título:** Implementar bitácora de auditoría básica

**Descripción:**
Registrar acciones sensibles sobre solicitudes, expedientes y administración.

**Criterios de aceptación:**

* acciones sensibles se registran
* payload mínimo útil
* accesible para perfiles autorizados
* no expone información indebida

**Dependencias:** TASK-003, TASK-022, TASK-023, TASK-024, TASK-025

---

# Sprint 3 — Endurecimiento y Cierre del MVP

## Objetivo

Cerrar huecos de calidad, experiencia y seguridad antes de considerar el MVP listo.

### TASK-027

**Título:** Refinar manejo de errores y estados vacíos

**Descripción:**
Homologar loaders, empty states, errores y mensajes del sistema.

**Criterios de aceptación:**

* todos los módulos MVP tienen loading state
* todos tienen empty state
* errores mostrados de forma consistente
* UX alineada a reglas de diseño

**Dependencias:** Sprint 1 y Sprint 2 avanzados

---

### TASK-028

**Título:** Validar navegación por rol y protección de rutas

**Descripción:**
Verificar que cada rol solo vea y acceda a lo permitido.

**Criterios de aceptación:**

* rutas protegidas correctamente
* navegación visible según rol
* no hay fuga de acceso por UI
* comportamiento consistente con RLS

**Dependencias:** TASK-005, TASK-006

---

### TASK-029

**Título:** Revisar coherencia visual con V0 y reglas de diseño

**Descripción:**
Realizar revisión final de consistencia visual, reutilización y alineación con V0.

**Criterios de aceptación:**

* no hay pantallas fuera de estilo
* componentes reutilizados donde corresponde
* no se duplicó UI existente sin justificación
* `reglas_diseno.md` fue respetado

**Dependencias:** todas las tareas UI

---

### TASK-030

**Título:** QA funcional del MVP

**Descripción:**
Ejecutar checklist funcional de punta a punta para colaborador y RH.

**Checklist mínimo:**

* login
* dashboard
* crear solicitud
* revisar solicitud
* aprobar/rechazar
* descargar recibos
* consultar anuncios
* consultar reglamentos
* subir documento de expediente
* revisar expediente en RH

**Criterios de aceptación:**

* checklist completado
* bugs críticos documentados o corregidos
* flujo MVP usable

**Dependencias:** todas las tareas principales del MVP

---

### TASK-031

**Título:** Documentar estado final del MVP

**Descripción:**
Generar resumen del sistema implementado, módulos disponibles, pendientes y siguientes fases.

**Criterios de aceptación:**

* documentación breve del estado actual
* lista de módulos MVP terminados
* lista de pendientes post-MVP
* lista de deuda técnica conocida si existe

**Dependencias:** TASK-030

---

# Backlog posterior al MVP

Estas tareas no forman parte del MVP inicial, pero deben mantenerse visibles para siguientes fases:

* organigrama dinámico
* evaluaciones de desempeño
* KPIs y tableros gerenciales
* LMS / onboarding
* requisición de vacantes
* seguimiento de candidatos
* control de headcount
* altas y bajas
* actas administrativas
* asistencia / checador
* materiales y equipo de trabajo
* chatbot 24/7 RH
* filtrado de CVs con IA
* buzón de sugerencias / denuncias NOM-035
* muro de reconocimientos
* encuestas de clima
* biblioteca digital y préstamos
* integración con sistemas de nómina actuales
* app móvil nativa si el negocio realmente lo justifica

---

# Instrucción para el coding agent

Al iniciar una tarea:

1. Lee `CLAUDE.md`
2. Lee `reglas_diseno.md`
3. Revisa este `TASKS.md`
4. Identifica dependencias de la tarea
5. Audita si ya existe algo en V0 reutilizable
6. Implementa la tarea sin salirte de su alcance
7. Reporta:

   * qué encontraste ya hecho
   * qué reutilizaste
   * qué archivos cambiaste
   * si se cumplieron los criterios de aceptación

---

# Recomendación de ejecución

Empieza por:

1. TASK-000
2. TASK-001
3. TASK-002
4. TASK-003
5. TASK-004
6. TASK-005
7. TASK-006
8. TASK-007
9. TASK-008

No saltes directo a vistas del negocio si antes no quedó lista la base de auth, permisos y estructura.