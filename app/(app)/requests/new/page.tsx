"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import {
  Select,
  Textarea,
  Checkbox,
  DatePicker,
  FileUpload,
  Stepper,
} from "@/components/ui/shared";
import { IconAlertCircle, IconInbox } from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useRequestTypes,
  type EnrichedRequestType,
} from "@/modules/requests/hooks/use-request-types";
import { MVP_REQUEST_TYPES, type RequestTypeField } from "@/modules/requests/catalog";
import { createRequest } from "@/modules/requests/actions";
import { createClient } from "@/lib/supabase/client";
import {
  STORAGE_BUCKETS,
  requestAttachmentPath,
} from "@/modules/storage/paths";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormValues = Record<string, string | boolean | number>;
type FileValues = Record<string, File[]>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initFormValues(fields: RequestTypeField[]): FormValues {
  return Object.fromEntries(
    fields
      .filter((f) => f.type !== "file")
      .map((f) => [f.key, f.type === "boolean" ? false : ""]),
  );
}

function initFileValues(fields: RequestTypeField[]): FileValues {
  return Object.fromEntries(
    fields.filter((f) => f.type === "file").map((f) => [f.key, []]),
  );
}

function validateForm(
  fields: RequestTypeField[],
  values: FormValues,
  files: FileValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.type === "file") {
      if (field.required && !files[field.key]?.length) {
        errors[field.key] = "Este campo es obligatorio";
      }
      continue;
    }

    if (field.type === "boolean") continue;

    const val = values[field.key];

    if (field.required && (val === "" || val === undefined || val === null)) {
      errors[field.key] = "Este campo es obligatorio";
      continue;
    }

    // Numeric range validation
    if (field.type === "number" && val !== "" && val !== undefined) {
      const num = Number(val);
      if (!isNaN(num)) {
        if (field.min !== undefined && num < field.min) {
          errors[field.key] = `El valor mínimo es ${field.min}`;
        } else if (field.max !== undefined && num > field.max) {
          errors[field.key] = `El valor máximo es ${field.max}`;
        }
      }
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Dynamic field renderer
// ---------------------------------------------------------------------------

function DynamicField({
  field,
  value,
  error,
  onChange,
  onFilesChange,
}: {
  field: RequestTypeField;
  value: string | boolean | number;
  error?: string;
  onChange: (v: string | boolean | number) => void;
  onFilesChange: (files: File[]) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          helperText={field.helperText}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          label={field.label}
          placeholder={field.placeholder}
          value={value === "" ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          min={field.min}
          max={field.max}
          error={error}
          helperText={field.helperText}
        />
      );

    case "date":
      return (
        <DatePicker
          label={field.label}
          value={value as string}
          onChange={(v) => onChange(v)}
          error={error}
        />
      );

    case "select":
      return (
        <Select
          label={field.label}
          options={field.options ?? []}
          value={value as string}
          onChange={(v) => onChange(v)}
          placeholder={field.placeholder ?? "Selecciona una opción..."}
          error={error}
        />
      );

    case "textarea":
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          helperText={field.helperText}
          rows={3}
        />
      );

    case "boolean":
      return (
        <div>
          <Checkbox
            checked={value as boolean}
            onChange={(checked) => onChange(checked)}
            label={field.label}
            description={field.helperText}
          />
          {error && <p className="text-xs text-error-foreground mt-1">{error}</p>}
        </div>
      );

    case "file":
      return (
        <FileUpload
          label={`${field.label}${field.required ? " *" : " (opcional)"}`}
          helperText={field.helperText}
          accept={field.accept ?? "application/pdf,image/*"}
          multiple={field.multiple ?? false}
          onFilesSelected={onFilesChange}
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Type selector
// ---------------------------------------------------------------------------

function TypeSelector({
  types,
  isLoading,
  onSelect,
}: {
  types: EnrichedRequestType[];
  isLoading: boolean;
  onSelect: (type: EnrichedRequestType) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (types.length === 0) {
    return (
      <EmptyState
        icon={<IconInbox className="w-10 h-10" />}
        title="Sin tipos de solicitud disponibles"
        description="No hay tipos de solicitud configurados. Contacta a Recursos Humanos."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {types.map((type) => {
        const Icon = type.meta.icon;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type)}
            className="p-4 rounded-lg border border-border text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
          >
            <div
              className={`w-12 h-12 rounded-lg ${type.meta.iconBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <p className="font-semibold text-foreground">{type.name}</p>
            {type.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {type.description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Dynamic form
// ---------------------------------------------------------------------------

function DynamicForm({
  type,
  values,
  errors,
  submitError,
  isSubmitting,
  onValueChange,
  onFilesChange,
  onBack,
  onSubmit,
}: {
  type: EnrichedRequestType;
  values: FormValues;
  errors: Record<string, string>;
  submitError: string | null;
  isSubmitting: boolean;
  onValueChange: (key: string, value: string | boolean | number) => void;
  onFilesChange: (key: string, newFiles: File[]) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const Icon = type.meta.icon;

  return (
    <div className="space-y-6">
      {/* Selected type header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
        <div
          className={`w-12 h-12 rounded-lg ${type.meta.iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{type.name}</p>
          {type.description && (
            <p className="text-xs text-muted-foreground">{type.description}</p>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {type.meta.fields.map((field) => (
          <DynamicField
            key={field.key}
            field={field}
            value={values[field.key] ?? (field.type === "boolean" ? false : "")}
            error={errors[field.key]}
            onChange={(v) => onValueChange(field.key, v)}
            onFilesChange={(f) => onFilesChange(field.key, f)}
          />
        ))}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error-border text-error-foreground text-sm">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
          ← Cambiar tipo
        </Button>
        <Button
          className="flex-1"
          onClick={onSubmit}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Enviar solicitud
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const STEPS = [
  { id: "type", label: "Tipo de solicitud" },
  { id: "form", label: "Completa los datos" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useSession();
  const {
    types,
    isLoading: typesLoading,
    error: typesError,
    refetch: refetchTypes,
  } = useRequestTypes(MVP_REQUEST_TYPES);

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<EnrichedRequestType | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [fileValues, setFileValues] = useState<FileValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Handlers ---

  const handleSelectType = (type: EnrichedRequestType) => {
    setSelectedType(type);
    setFormValues(initFormValues(type.meta.fields));
    setFileValues(initFileValues(type.meta.fields));
    setErrors({});
    setSubmitError(null);
    setStep(1);
  };

  const handleBack = () => {
    setStep(0);
    setErrors({});
    setSubmitError(null);
  };

  const handleValueChange = (key: string, value: string | boolean | number) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const handleFilesChange = (key: string, newFiles: File[]) => {
    setFileValues((prev) => ({ ...prev, [key]: newFiles }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const handleSubmit = async () => {
    if (!selectedType || !user) return;

    // Required-field + numeric range validation
    const fieldErrors = validateForm(selectedType.meta.fields, formValues, fileValues);
    // Type-specific cross-field validation (defined per catalog entry)
    const typeErrors = selectedType.meta.validate?.(formValues) ?? {};
    const allErrors = { ...fieldErrors, ...typeErrors };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Build metadata (exclude file fields)
    const metadata: Record<string, unknown> = {};
    for (const field of selectedType.meta.fields) {
      if (field.type !== "file") {
        metadata[field.key] = formValues[field.key];
      }
    }

    // 1. Insert request via server action
    const { requestId, error: createError } = await createRequest({
      requestTypeId: selectedType.id,
      metadata,
    });

    if (createError || !requestId) {
      setSubmitError(createError ?? "Error al crear la solicitud. Inténtalo de nuevo.");
      setIsSubmitting(false);
      return;
    }

    // 2. Upload attachments (best-effort — request is already created)
    const supabase = createClient();
    const fileFields = selectedType.meta.fields.filter((f) => f.type === "file");

    for (const field of fileFields) {
      for (const file of fileValues[field.key] ?? []) {
        const storagePath = requestAttachmentPath(requestId, file.name);

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.ATTACHMENTS)
          .upload(storagePath, file, { contentType: file.type });

        if (!uploadError) {
          // Record attachment metadata in the DB.
          // Cast required: `request_attachments` may not be in the locally-generated
          // Supabase types yet — types should be regenerated after running migrations.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("request_attachments").insert({
            request_id: requestId,
            uploaded_by: user.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: storagePath,
          });
        }
        // If upload fails, we continue silently — the request row is committed.
        // The employee can retry attaching files from the detail view (TASK-013).
      }
    }

    // 3. Redirect to the requests list
    router.push("/requests");
  };

  // --- Render ---

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link + page header */}
      <div>
        <Link
          href="/requests"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Mis solicitudes
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Nueva solicitud</h1>
        <p className="text-muted-foreground">
          Selecciona el tipo de solicitud y completa los datos requeridos.
        </p>
      </div>

      {/* Stepper */}
      <Stepper steps={STEPS} currentStep={step} />

      {/* Main card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 0 ? "¿Qué tipo de solicitud necesitas?" : selectedType?.name ?? ""}
          </CardTitle>
          {step === 0 && (
            <CardDescription>
              Selecciona la categoría que mejor describe tu solicitud.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {step === 0 ? (
            typesError ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-14 h-14 rounded-full bg-error/20 flex items-center justify-center mb-3">
                  <IconAlertCircle className="w-7 h-7 text-error-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No se pudieron cargar los tipos de solicitud
                </p>
                <p className="text-xs text-muted-foreground mb-4 max-w-md">
                  {typesError}
                </p>
                <Button onClick={refetchTypes}>Reintentar</Button>
              </div>
            ) : (
              <TypeSelector
                types={types}
                isLoading={typesLoading}
                onSelect={handleSelectType}
              />
            )
          ) : selectedType ? (
            <DynamicForm
              type={selectedType}
              values={formValues}
              errors={errors}
              submitError={submitError}
              isSubmitting={isSubmitting}
              onValueChange={handleValueChange}
              onFilesChange={handleFilesChange}
              onBack={handleBack}
              onSubmit={handleSubmit}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
