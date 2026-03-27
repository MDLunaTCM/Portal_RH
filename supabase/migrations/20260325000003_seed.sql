-- ============================================================
-- TASK-003: Seed data — Portal RH MVP
-- ============================================================
-- Run order: 3 of 3 (schema → triggers → seed)
-- Idempotent: uses ON CONFLICT DO NOTHING
-- ============================================================

-- ============================================================
-- REQUEST TYPES catalog
-- ============================================================

insert into public.request_types (code, name, description, requires_approval, metadata_schema)
values
  (
    'vacation',
    'Vacaciones',
    'Solicitud de días de vacaciones con base en antigüedad.',
    true,
    '{
      "type": "object",
      "required": ["start_date", "end_date", "days_requested"],
      "properties": {
        "start_date":      { "type": "string", "format": "date" },
        "end_date":        { "type": "string", "format": "date" },
        "days_requested":  { "type": "integer", "minimum": 1 },
        "notes":           { "type": "string" }
      }
    }'::jsonb
  ),
  (
    'employment_letter',
    'Constancia de empleo',
    'Carta que acredita la relación laboral vigente del colaborador.',
    false,
    '{
      "type": "object",
      "required": ["purpose"],
      "properties": {
        "purpose":        { "type": "string", "enum": ["general", "visa", "credit", "rental", "other"] },
        "include_salary": { "type": "boolean" },
        "notes":          { "type": "string" }
      }
    }'::jsonb
  ),
  (
    'card_replacement',
    'Reposición de tarjeta',
    'Solicitud de reposición de tarjeta de nómina por robo, extravío o daño.',
    true,
    '{
      "type": "object",
      "required": ["reason"],
      "properties": {
        "reason":      { "type": "string", "enum": ["lost", "stolen", "damaged"] },
        "last_digits": { "type": "string", "maxLength": 4 },
        "notes":       { "type": "string" }
      }
    }'::jsonb
  ),
  (
    'permission',
    'Permiso',
    'Solicitud de permiso de ausencia (médico, personal u otro).',
    true,
    '{
      "type": "object",
      "required": ["permission_type", "date", "hours"],
      "properties": {
        "permission_type": { "type": "string", "enum": ["medical", "personal", "bereavement", "other"] },
        "date":            { "type": "string", "format": "date" },
        "hours":           { "type": "number", "minimum": 0.5 },
        "notes":           { "type": "string" }
      }
    }'::jsonb
  ),
  (
    'advance_payment',
    'Anticipo de nómina',
    'Solicitud de anticipo sobre el salario del periodo en curso.',
    true,
    '{
      "type": "object",
      "required": ["amount"],
      "properties": {
        "amount":  { "type": "number", "minimum": 1 },
        "reason":  { "type": "string" }
      }
    }'::jsonb
  ),
  (
    'document_request',
    'Solicitud de documento',
    'Solicitud de copia de documentos del expediente personal (contrato, recibo, etc.).',
    false,
    '{
      "type": "object",
      "required": ["document_type"],
      "properties": {
        "document_type": { "type": "string", "enum": ["contract", "payroll_receipt", "social_security", "tax_id", "other"] },
        "notes":         { "type": "string" }
      }
    }'::jsonb
  )
on conflict (code) do nothing;
