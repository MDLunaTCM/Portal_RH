"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { Modal, Select, SearchInput } from "@/components/ui/shared";
import {
  IconWallet,
  IconDownload,
  IconFileText,
  IconCalendar,
  IconAlertCircle,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useMyPayroll,
  type PayrollReceipt,
  type PayrollConcept,
} from "@/modules/payroll/hooks/use-my-payroll";
import { getSignedUrl } from "@/modules/storage/actions";
import { STORAGE_BUCKETS } from "@/modules/storage/paths";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "2026-03" → "Marzo 2026" */
function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return period;
  return `${MONTHS_ES[monthIndex]} ${year}`;
}

const PERIOD_TYPE_CONFIG: Record<
  string,
  { label: string; variant: "outline" | "info" | "success" | "warning" | "error" }
> = {
  quincenal:  { label: "Quincenal",  variant: "outline" },
  mensual:    { label: "Mensual",    variant: "outline" },
  aguinaldo:  { label: "Aguinaldo",  variant: "success" },
  finiquito:  { label: "Finiquito",  variant: "warning" },
  bono:       { label: "Bono",       variant: "info" },
  vacaciones: { label: "Vacaciones", variant: "info" },
};

function getPeriodTypeBadge(periodType: string) {
  const config = PERIOD_TYPE_CONFIG[periodType.toLowerCase()];
  if (!config) return <Badge variant="outline">{periodType}</Badge>;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Receipt rows */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-error-border bg-error/30">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mb-4">
            <IconAlertCircle className="w-8 h-8 text-error-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error al cargar recibos
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            No pudimos cargar tus recibos de nómina. Verifica tu conexión e intenta de nuevo.
          </p>
          <Button onClick={onRetry}>Intentar de nuevo</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Receipt detail (rendered inside Modal)
// ---------------------------------------------------------------------------

function ReceiptDetail({ receipt }: { receipt: PayrollReceipt }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const earnings: PayrollConcept[] = receipt.concepts.filter((c) => c.type === "earning");
  const deductions: PayrollConcept[] = receipt.concepts.filter((c) => c.type === "deduction");

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    const { signedUrl, error } = await getSignedUrl(
      STORAGE_BUCKETS.PAYROLL,
      receipt.storagePath,
      300,
    );

    setIsDownloading(false);

    if (error || !signedUrl) {
      setDownloadError("No se pudo generar el enlace de descarga. Inténtalo de nuevo.");
      return;
    }

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Net pay header */}
      <div className="p-4 rounded-lg bg-primary text-primary-foreground">
        <p className="text-sm opacity-80">Neto a recibir</p>
        <p className="text-3xl font-bold">{formatCurrency(receipt.netAmount)}</p>
        <p className="text-sm opacity-80 mt-1">
          {formatPeriod(receipt.period)} · {PERIOD_TYPE_CONFIG[receipt.periodType.toLowerCase()]?.label ?? receipt.periodType}
        </p>
      </div>

      {/* Date */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
        <div>
          <p className="text-xs text-muted-foreground">Tipo</p>
          <div className="mt-1">{getPeriodTypeBadge(receipt.periodType)}</div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Fecha de pago</p>
          <p className="text-sm font-medium text-foreground">{formatDate(receipt.issuedAt)}</p>
        </div>
      </div>

      {/* Earnings */}
      {earnings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Percepciones</h4>
          <div className="space-y-0">
            {earnings.map((item, i) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.concept}</span>
                <span className="text-sm font-medium text-success-foreground">
                  +{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-medium">
              <span className="text-foreground">Total percepciones</span>
              <span className="text-foreground">{formatCurrency(receipt.grossAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Deductions */}
      {deductions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Deducciones</h4>
          <div className="space-y-0">
            {deductions.map((item, i) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.concept}</span>
                <span className="text-sm font-medium text-error-foreground">
                  -{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-medium">
              <span className="text-foreground">Total deducciones</span>
              <span className="text-error-foreground">
                -{formatCurrency(receipt.grossAmount - receipt.netAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Net summary */}
      <div className="p-4 rounded-lg bg-success/10 border border-success-border">
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Neto a recibir</span>
          <span className="text-xl font-bold text-success-foreground">
            {formatCurrency(receipt.netAmount)}
          </span>
        </div>
      </div>

      {/* Download error */}
      {downloadError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error-border text-error-foreground text-sm">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Download actions */}
      <div className="space-y-3">
        <Button
          className="w-full"
          leftIcon={<IconDownload className="w-4 h-4" />}
          onClick={handleDownloadPdf}
          isLoading={isDownloading}
          disabled={isDownloading}
        >
          Descargar PDF
        </Button>
        <Button
          variant="outline"
          className="w-full"
          leftIcon={<IconFileText className="w-4 h-4" />}
          disabled
        >
          Descargar XML (CFDI) — No disponible
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PayrollReceiptsPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const userId = user?.id ?? null;

  const { receipts, isLoading, error, refetch } = useMyPayroll(userId);

  const [selectedReceipt, setSelectedReceipt] = useState<PayrollReceipt | null>(null);
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Derive available years from receipts
  const years = Array.from(
    new Set(receipts.map((r) => r.issuedAt.substring(0, 4))),
  )
    .sort((a, b) => b.localeCompare(a))
    .map((y) => ({ value: y, label: y }));

  const yearOptions = [{ value: "", label: "Todos los años" }, ...years];

  const monthOptions = [
    { value: "", label: "Todos los meses" },
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const filteredReceipts = receipts.filter((r) => {
    const matchesYear = !yearFilter || r.issuedAt.startsWith(yearFilter);
    const matchesMonth = !monthFilter || r.period.substring(5, 7) === monthFilter;
    const matchesSearch =
      !searchQuery || formatPeriod(r.period).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesMonth && matchesSearch;
  });

  const currentYear = new Date().getFullYear().toString();
  const ytdNetPay = receipts
    .filter((r) => r.issuedAt.startsWith(currentYear))
    .reduce((sum, r) => sum + r.netAmount, 0);

  const latestReceipt = receipts[0] ?? null;

  const showLoading = sessionLoading || isLoading;

  if (showLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recibos de nómina</h1>
        <p className="text-muted-foreground">
          Consulta y descarga tus recibos de pago
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <IconWallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Neto acumulado {currentYear}</p>
                <p className="text-xl font-bold text-foreground">
                  {receipts.length === 0 ? "—" : formatCurrency(ytdNetPay)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/20">
                <IconFileText className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recibos disponibles</p>
                <p className="text-xl font-bold text-foreground">{receipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/20">
                <IconCalendar className="w-6 h-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último pago</p>
                <p className="text-xl font-bold text-foreground">
                  {latestReceipt ? formatDate(latestReceipt.issuedAt) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt list with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Historial de recibos</CardTitle>
              <CardDescription>Todos tus recibos de nómina</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                options={yearOptions}
                value={yearFilter}
                onChange={setYearFilter}
                className="w-full sm:w-36"
              />
              <Select
                options={monthOptions}
                value={monthFilter}
                onChange={setMonthFilter}
                className="w-full sm:w-40"
              />
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar periodo..."
                className="w-full sm:w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <EmptyState
              icon={<IconWallet className="w-12 h-12" />}
              title={
                receipts.length === 0
                  ? "No tienes recibos de nómina"
                  : "Sin resultados"
              }
              description={
                receipts.length === 0
                  ? "Aquí aparecerán tus recibos cuando RH los suba al sistema."
                  : "No hay recibos que coincidan con los filtros seleccionados."
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredReceipts.map((receipt) => (
                <button
                  key={receipt.id}
                  type="button"
                  onClick={() => setSelectedReceipt(receipt)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors gap-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconFileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">
                          {formatPeriod(receipt.period)}
                        </p>
                        {getPeriodTypeBadge(receipt.periodType)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fecha de pago: {formatDate(receipt.issuedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(receipt.netAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Neto</p>
                    </div>
                    <Button variant="ghost" size="sm" tabIndex={-1}>
                      <IconDownload className="w-4 h-4" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt detail modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={
          selectedReceipt
            ? `Recibo — ${formatPeriod(selectedReceipt.period)}`
            : "Detalle de recibo"
        }
        size="md"
      >
        {selectedReceipt && <ReceiptDetail receipt={selectedReceipt} />}
      </Modal>
    </div>
  );
}
