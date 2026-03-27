@AGENTS.md
# CLAUDE.md

## Contexto del proyecto
Este proyecto es un portal web de Recursos Humanos construido con React + Supabase.

## Objetivo
Construir una intranet RH moderna, segura y escalable, priorizando:
- reutilización de vistas ya diseñadas en V0
- consistencia visual con el diseño existente
- arquitectura modular y mantenible
- seguridad por roles y protección de documentos sensibles

## Instrucciones obligatorias antes de desarrollar
1. Antes de crear o modificar vistas, revisa el estado actual del proyecto.
2. Identifica qué pantallas ya fueron desarrolladas en V0 y reutilízalas o adáptalas antes de crear nuevas.
3. Lee obligatoriamente el archivo `reglas_diseno.md` antes de tocar componentes UI.
4. Respeta la estética, patrones visuales y estructura ya existente en el proyecto.
5. No reconstruyas pantallas completas si ya existe una versión usable hecha en V0.
6. Si hace falta una nueva vista, crea solo las mínimas necesarias y mantén coherencia visual con lo ya desarrollado.

## Stack
- React
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage

## Principios de implementación
- Arquitectura modular por dominio
- Componentes reutilizables
- Formularios tipados y validados
- Manejo claro de loading, empty states y errores
- Seguridad desde base de datos con RLS
- Los permisos no se confían al frontend solamente

## Reglas de producto
- Priorizar MVP funcional
- Evitar sobreingeniería
- Cada módulo debe quedar implementable y testeable por separado
- Cada vista debe tener criterios de aceptación claros
- Cada nueva feature debe respetar roles y permisos

## Módulos MVP
- Auth
- Dashboard
- Solicitudes
- Recibos de nómina
- Constancias y reposiciones
- Directorio
- Anuncios y reglamentos
- Expediente del colaborador
- Panel RH de aprobaciones

## Roles
- employee
- manager
- hr_admin
- super_admin

## Reglas para vistas
- Revisar primero si ya existe una pantalla equivalente en V0
- Reutilizar layouts, cards, tablas, formularios y patrones ya hechos
- Mantener spacing, tipografía, jerarquía visual y tono del diseño existente
- Solo crear nuevas vistas si de verdad no existe una base reutilizable

## Reglas para datos
- Crear tipos compartidos por módulo
- No duplicar contratos
- Tipar respuestas de Supabase
- Mantener separación entre:
  - tipos de DB
  - tipos de UI
  - mappers/adaptadores

## Reglas para Supabase
- Toda tabla sensible debe tener RLS
- Los documentos deben almacenarse en buckets organizados por módulo
- El acceso a archivos debe respetar ownership o rol
- Registrar acciones sensibles en audit_logs

## Flujo de trabajo recomendado
Para cada tarea:
1. entender el requerimiento
2. revisar si ya existe vista/componente similar en V0
3. revisar `reglas_diseno.md`
4. definir impacto en datos, permisos y navegación
5. implementar
6. validar criterios de aceptación
7. documentar lo necesario

## Entregables esperados por tarea
- código funcional
- tipado correcto
- integración con Supabase
- validación
- manejo de errores
- UI consistente con V0
- criterios de aceptación cubiertos