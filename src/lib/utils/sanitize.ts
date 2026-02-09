// src/lib/utils/sanitize.ts - Funciones de sanitización reutilizables

/**
 * Escapa caracteres HTML peligrosos por sus entidades
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Sanitiza texto libre: trim + colapsar espacios múltiples + escapar HTML
 */
export function sanitizeText(value: string): string {
  return escapeHtml(value.trim().replace(/\s+/g, " "));
}

/**
 * Sanitiza DNI: solo dígitos, validar longitud 8-10
 */
export function sanitizeDni(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

/**
 * Sanitiza email: trim + lowercase + validar formato básico
 */
export function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Sanitiza teléfono: solo dígitos, max 9
 */
export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

/**
 * Sanitiza número: parsear y limitar rango
 */
export function sanitizeNumber(
  value: unknown,
  min: number,
  max: number,
): number | null {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return null;
  return Math.min(Math.max(num, min), max);
}

/**
 * Sanitiza queries de búsqueda: trim + escapar HTML + limitar longitud
 */
export function sanitizeSearch(value: string): string {
  return escapeHtml(value.trim()).slice(0, 100);
}
