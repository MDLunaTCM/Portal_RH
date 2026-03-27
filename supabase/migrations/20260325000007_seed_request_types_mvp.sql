-- ============================================================
-- TASK-010: Add MVP request types missing from TASK-003 seed
-- ============================================================
-- Run order: 7 (after 006_storage_buckets)
-- Idempotent: ON CONFLICT (code) DO NOTHING
--
-- Types added here:
--   badge_replacement  — Reposición de gafete
--   parking_card       — Tarjeta de estacionamiento
--   document_update    — Actualización documental
--
-- These complete the minimum catalog required for Sprint 1:
--   vacation            (TASK-003) ✓
--   employment_letter   (TASK-003) ✓
--   card_replacement    (TASK-003) ✓
--   badge_replacement   (this migration)
--   parking_card        (this migration)
--   document_update     (this migration)
-- ============================================================

insert into public.request_types (code, name, description, requires_approval, metadata_schema)
values
  -- ---------------------------------------------------------------
  -- Gafete de identificación
  -- ---------------------------------------------------------------
  (
    'badge_replacement',
    'Reposición de gafete',
    'Solicitud de reposición del gafete de identificación personal por extravío, robo, daño o vencimiento.',
    true,
    '{
      "type": "object",
      "required": ["reason"],
      "properties": {
        "reason": {
          "type": "string",
          "enum": ["lost", "stolen", "damaged", "expired"],
          "enumLabels": {
            "lost":    "Extravío",
            "stolen":  "Robo",
            "damaged": "Daño",
            "expired": "Vencido"
          }
        },
        "notes": { "type": "string" }
      }
    }'::jsonb
  ),

  -- ---------------------------------------------------------------
  -- Tarjeta de estacionamiento
  -- ---------------------------------------------------------------
  (
    'parking_card',
    'Tarjeta de estacionamiento',
    'Solicitud de nueva tarjeta o reposición de la tarjeta de acceso al estacionamiento.',
    true,
    '{
      "type": "object",
      "required": ["reason"],
      "properties": {
        "reason": {
          "type": "string",
          "enum": ["new", "replacement", "lost", "damaged"],
          "enumLabels": {
            "new":         "Nueva asignación",
            "replacement": "Reposición",
            "lost":        "Extravío",
            "damaged":     "Daño"
          }
        },
        "vehicle_plate": {
          "type": "string",
          "maxLength": 10,
          "description": "Placa del vehículo (opcional)"
        },
        "notes": { "type": "string" }
      }
    }'::jsonb
  ),

  -- ---------------------------------------------------------------
  -- Actualización documental
  -- ---------------------------------------------------------------
  (
    'document_update',
    'Actualización documental',
    'Solicitud para actualizar información personal en el expediente: NSS, RFC, domicilio, contacto de emergencia, datos bancarios u otro.',
    false,
    '{
      "type": "object",
      "required": ["document_type"],
      "properties": {
        "document_type": {
          "type": "string",
          "enum": ["nss", "rfc", "address", "emergency_contact", "bank_info", "other"],
          "enumLabels": {
            "nss":               "Número de Seguro Social",
            "rfc":               "RFC",
            "address":           "Domicilio",
            "emergency_contact": "Contacto de emergencia",
            "bank_info":         "Datos bancarios",
            "other":             "Otro"
          }
        },
        "notes": { "type": "string" }
      }
    }'::jsonb
  )
on conflict (code) do nothing;
