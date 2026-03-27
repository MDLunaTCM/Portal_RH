/**
 * Static frontend catalog for request types.
 *
 * This file holds UI metadata (icon, color, form fields) that cannot live
 * in the DB. It is the single source of truth for driving dynamic forms
 * (TASK-012) and the request type selector UI.
 *
 * Runtime data (name, description, is_active, metadata_schema) is fetched
 * from the `request_types` table via `useRequestTypes()`.
 * Both sources are merged by `useRequestTypes()` into `EnrichedRequestType`.
 */

import {
  IconCalendar,
  IconDocument,
  IconWallet,
  IconIdCard,
  IconCar,
  IconFileText,
  IconClock,
  IconInbox,
} from "@/components/icons";
import type { RequestTypeCode } from "./types";

// ---------------------------------------------------------------------------
// Form field descriptor
// ---------------------------------------------------------------------------

export type FieldType =
  | "text"
  | "date"
  | "number"
  | "select"
  | "boolean"
  | "textarea"
  | "file";

export interface SelectOption {
  value: string;
  label: string;
}

export interface RequestTypeField {
  /** Key must match the corresponding `metadata` JSON property in the DB */
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helperText?: string;
  options?: SelectOption[]; // for type === "select"
  min?: number;             // for type === "number" | "date"
  max?: number;
  accept?: string;          // for type === "file"
  multiple?: boolean;       // for type === "file"
}

// ---------------------------------------------------------------------------
// Catalog entry
// ---------------------------------------------------------------------------

export interface RequestTypeMeta {
  code: RequestTypeCode;
  /** Lucide-compatible icon component from @/components/icons */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /**
   * Tailwind background class for the icon container.
   * Uses design-system variables only (no hardcoded colors).
   */
  iconBg: string;
  /** Ordered list of form fields that drive the creation form (TASK-012) */
  fields: RequestTypeField[];
  /**
   * Optional cross-field / type-specific validation.
   * Runs after required-field checks in the creation form.
   * Return a map of { fieldKey: errorMessage } for any violations.
   */
  validate?: (
    values: Record<string, string | boolean | number>,
  ) => Record<string, string>;
}

// ---------------------------------------------------------------------------
// MVP catalog
// ---------------------------------------------------------------------------

export const REQUEST_TYPE_CATALOG: Record<RequestTypeCode, RequestTypeMeta> = {
  // -------------------------------------------------------------------------
  // Vacaciones / Ausencias
  // -------------------------------------------------------------------------
  vacation: {
    code: "vacation",
    icon: IconCalendar,
    iconBg: "bg-info",
    fields: [
      {
        key: "vacation_type",
        label: "Tipo de ausencia",
        type: "select",
        required: true,
        options: [
          { value: "vacation",  label: "Vacaciones" },
          { value: "personal",  label: "Permiso personal" },
          { value: "medical",   label: "Incapacidad médica" },
          { value: "other",     label: "Otro" },
        ],
      },
      {
        key: "start_date",
        label: "Fecha de inicio",
        type: "date",
        required: true,
      },
      {
        key: "end_date",
        label: "Fecha de fin",
        type: "date",
        required: true,
      },
      {
        key: "days_requested",
        label: "Días solicitados",
        type: "number",
        required: true,
        min: 1,
        max: 365,
        helperText: "Número de días hábiles",
      },
      {
        key: "notes",
        label: "Comentarios adicionales",
        type: "textarea",
        required: false,
        placeholder: "Motivo o información extra (opcional)",
      },
    ],
    validate(values) {
      const errors: Record<string, string> = {};
      const start = values.start_date as string;
      const end = values.end_date as string;
      if (start && end && end < start) {
        errors.end_date = "La fecha de fin no puede ser anterior a la fecha de inicio";
      }
      const days = Number(values.days_requested);
      if (!isNaN(days) && days < 1) {
        errors.days_requested = "Debes solicitar al menos 1 día";
      }
      return errors;
    },
  },

  // -------------------------------------------------------------------------
  // Constancia de empleo
  // -------------------------------------------------------------------------
  employment_letter: {
    code: "employment_letter",
    icon: IconDocument,
    iconBg: "bg-success",
    fields: [
      {
        key: "purpose",
        label: "Propósito de la constancia",
        type: "select",
        required: true,
        options: [
          { value: "general",  label: "General" },
          { value: "visa",     label: "Solicitud de visa" },
          { value: "credit",   label: "Crédito bancario" },
          { value: "rental",   label: "Arrendamiento" },
          { value: "other",    label: "Otro" },
        ],
      },
      {
        key: "include_salary",
        label: "Incluir salario en la carta",
        type: "boolean",
        required: false,
      },
      {
        key: "notes",
        label: "Instrucciones o destinatario",
        type: "textarea",
        required: false,
        placeholder: "Nombre del destinatario o indicaciones especiales (opcional)",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Reposición de tarjeta de nómina
  // -------------------------------------------------------------------------
  card_replacement: {
    code: "card_replacement",
    icon: IconWallet,
    iconBg: "bg-warning",
    fields: [
      {
        key: "reason",
        label: "Motivo",
        type: "select",
        required: true,
        options: [
          { value: "lost",    label: "Extravío" },
          { value: "stolen",  label: "Robo" },
          { value: "damaged", label: "Daño" },
        ],
      },
      {
        key: "last_digits",
        label: "Últimos 4 dígitos de la tarjeta",
        type: "text",
        required: false,
        placeholder: "1234",
        helperText: "Si los recuerdas (solo números)",
      },
      {
        key: "notes",
        label: "Notas",
        type: "textarea",
        required: false,
      },
    ],
    validate(values) {
      const errors: Record<string, string> = {};
      const digits = (values.last_digits as string).trim();
      if (digits && !/^\d{4}$/.test(digits)) {
        errors.last_digits = "Debe ser exactamente 4 dígitos numéricos";
      }
      return errors;
    },
  },

  // -------------------------------------------------------------------------
  // Reposición de gafete
  // -------------------------------------------------------------------------
  badge_replacement: {
    code: "badge_replacement",
    icon: IconIdCard,
    iconBg: "bg-primary/10",
    fields: [
      {
        key: "reason",
        label: "Motivo",
        type: "select",
        required: true,
        options: [
          { value: "lost",    label: "Extravío" },
          { value: "stolen",  label: "Robo" },
          { value: "damaged", label: "Daño" },
          { value: "expired", label: "Vencido" },
        ],
      },
      {
        key: "notes",
        label: "Información adicional",
        type: "textarea",
        required: false,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Tarjeta de estacionamiento
  // -------------------------------------------------------------------------
  parking_card: {
    code: "parking_card",
    icon: IconCar,
    iconBg: "bg-muted",
    fields: [
      {
        key: "reason",
        label: "Motivo",
        type: "select",
        required: true,
        options: [
          { value: "new",         label: "Nueva asignación" },
          { value: "replacement", label: "Reposición" },
          { value: "lost",        label: "Extravío" },
          { value: "damaged",     label: "Daño" },
        ],
      },
      {
        key: "vehicle_plate",
        label: "Placa del vehículo",
        type: "text",
        required: false,
        placeholder: "ABC-1234",
        helperText: "Formato: letras, números y guiones (ej. ABC-123)",
      },
      {
        key: "notes",
        label: "Notas",
        type: "textarea",
        required: false,
      },
    ],
    validate(values) {
      const errors: Record<string, string> = {};
      const plate = (values.vehicle_plate as string).trim();
      if (plate && !/^[A-Za-z0-9\-]{2,10}$/.test(plate)) {
        errors.vehicle_plate = "Formato de placa no válido (letras, números y guiones, 2–10 caracteres)";
      }
      return errors;
    },
  },

  // -------------------------------------------------------------------------
  // Actualización documental
  // -------------------------------------------------------------------------
  document_update: {
    code: "document_update",
    icon: IconFileText,
    iconBg: "bg-accent",
    fields: [
      {
        key: "document_type",
        label: "Tipo de actualización",
        type: "select",
        required: true,
        options: [
          { value: "nss",               label: "Número de Seguro Social (NSS)" },
          { value: "rfc",               label: "RFC" },
          { value: "address",           label: "Domicilio" },
          { value: "emergency_contact", label: "Contacto de emergencia" },
          { value: "bank_info",         label: "Datos bancarios" },
          { value: "other",             label: "Otro" },
        ],
      },
      {
        key: "notes",
        label: "Descripción del cambio",
        type: "textarea",
        required: false,
        placeholder: "Describe brevemente el dato que necesitas actualizar",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Permiso (seeded in TASK-003; no form UI yet — placeholder for TASK-012)
  // -------------------------------------------------------------------------
  permission: {
    code: "permission",
    icon: IconClock,
    iconBg: "bg-muted",
    fields: [
      {
        key: "permission_type",
        label: "Tipo de permiso",
        type: "select",
        required: true,
        options: [
          { value: "medical",     label: "Médico" },
          { value: "personal",    label: "Personal" },
          { value: "bereavement", label: "Duelo" },
          { value: "other",       label: "Otro" },
        ],
      },
      { key: "date",  label: "Fecha",  type: "date",   required: true },
      { key: "hours", label: "Horas",  type: "number", required: true, min: 0.5 },
      { key: "notes", label: "Notas",  type: "textarea", required: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Anticipo de nómina
  // -------------------------------------------------------------------------
  advance_payment: {
    code: "advance_payment",
    icon: IconWallet,
    iconBg: "bg-warning",
    fields: [
      {
        key: "amount",
        label: "Monto solicitado",
        type: "number",
        required: true,
        min: 1,
        helperText: "Máximo 50% del salario del periodo",
      },
      {
        key: "reason",
        label: "Motivo",
        type: "textarea",
        required: false,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Solicitud de documento
  // -------------------------------------------------------------------------
  document_request: {
    code: "document_request",
    icon: IconInbox,
    iconBg: "bg-muted",
    fields: [
      {
        key: "document_type",
        label: "Documento solicitado",
        type: "select",
        required: true,
        options: [
          { value: "contract",        label: "Contrato laboral" },
          { value: "payroll_receipt",  label: "Recibo de nómina" },
          { value: "social_security",  label: "Número de seguridad social" },
          { value: "tax_id",           label: "RFC" },
          { value: "other",            label: "Otro" },
        ],
      },
      {
        key: "notes",
        label: "Indicaciones adicionales",
        type: "textarea",
        required: false,
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the catalog entry for a given code, or undefined if not found. */
export function getRequestTypeMeta(
  code: string,
): RequestTypeMeta | undefined {
  return REQUEST_TYPE_CATALOG[code as RequestTypeCode];
}

/**
 * Ordered list of MVP request types shown in the creation selector.
 * Excludes types that are seeded but not yet surfaced in the UI.
 */
export const MVP_REQUEST_TYPES: RequestTypeCode[] = [
  "vacation",
  "employment_letter",
  "card_replacement",
  "badge_replacement",
  "parking_card",
  "document_update",
];
