// src/lib/validations/schemas.ts - Schemas Zod base con sanitización integrada
import { z } from "zod";
import {
  sanitizeText,
  sanitizeDni,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSearch,
} from "@/lib/utils/sanitize";

/**
 * Schema de texto sanitizado con longitud configurable
 */
export function textoSchema(min: number, max: number, campo = "El campo") {
  return z
    .string()
    .min(min, `${campo} debe tener al menos ${min} caracteres`)
    .max(max, `${campo} no puede tener más de ${max} caracteres`)
    .transform(sanitizeText);
}

/**
 * Schema de texto opcional sanitizado
 */
export function textoOpcionalSchema(max: number) {
  return z
    .string()
    .max(max)
    .transform(sanitizeText)
    .optional()
    .or(z.literal("").transform(() => ""));
}

/**
 * Schema de DNI: solo dígitos, 8-10 caracteres
 */
export const dniSchema = z
  .string()
  .min(8, "El DNI debe tener al menos 8 dígitos")
  .max(10, "El DNI no puede tener más de 10 dígitos")
  .transform(sanitizeDni)
  .refine((val) => val.length >= 8, {
    message: "El DNI debe contener al menos 8 dígitos",
  });

/**
 * Schema de email opcional sanitizado
 */
export const emailOpcionalSchema = z
  .string()
  .email("Formato de email inválido")
  .transform(sanitizeEmail)
  .optional()
  .or(z.literal("").transform(() => ""));

/**
 * Schema de teléfono opcional sanitizado
 */
export const telefonoOpcionalSchema = z
  .string()
  .transform(sanitizePhone)
  .optional()
  .or(z.literal("").transform(() => ""));

/**
 * Schema de precio con rango validado
 */
export function precioSchema(min: number, max: number) {
  return z
    .number({ error: "Debe ser un número" })
    .min(min, `El precio debe ser al menos ${min}`)
    .max(max, `El precio no puede ser mayor a ${max}`);
}

/**
 * Schema de observaciones sanitizadas (texto libre, max 500)
 */
export const observacionesSchema = z
  .string()
  .max(500, "Las observaciones no pueden exceder 500 caracteres")
  .transform(sanitizeText)
  .optional()
  .or(z.literal("").transform(() => ""));

/**
 * Schema de búsqueda sanitizada
 */
export const busquedaSchema = z.string().transform(sanitizeSearch);
