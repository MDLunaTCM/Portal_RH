// Standard path expected by shadcn/ui — do not rename or move this file.
// Once clsx + tailwind-merge are installed (TASK-002), update cn() to use them.

/**
 * Combines CSS class names, filtering out falsy values.
 * TODO: upgrade to `clsx + tailwind-merge` once packages are installed.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats a number as Mexican Peso currency.
 * @example formatCurrency(36500) → "MX$36,500.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/**
 * Formats an ISO date string using Spanish locale.
 * @example formatDate("2026-03-25") → "25 mar. 2026"
 */
export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  return new Date(dateStr).toLocaleDateString("es-MX", options);
}

/**
 * Returns a human-readable relative date string in Spanish.
 * @example formatRelativeTime("2026-03-24") → "Ayer"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return formatDate(dateStr);
}

/**
 * Truncates a string to the specified length, appending "...".
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Returns the initials from a full name (up to 2 characters).
 * @example getInitials("Maria Garcia") → "MG"
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}
