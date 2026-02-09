import { z } from "zod";
import { textoSchema, textoOpcionalSchema } from "./schemas";

const estadoEmbarcacion = z.enum(["ACTIVA", "MANTENIMIENTO", "INACTIVA"], {
  message: "Estado no válido",
});

export const crearEmbarcacionSchema = z.object({
  nombre: textoSchema(1, 100, "El nombre de la embarcación"),
  capacidad: z
    .number({ error: "La capacidad debe ser un número" })
    .int("La capacidad debe ser un número entero")
    .min(1, "La capacidad debe ser mayor a 0")
    .max(500, "La capacidad no puede ser mayor a 500 pasajeros"),
  estado: estadoEmbarcacion.optional().default("ACTIVA"),
  tipo: textoOpcionalSchema(50),
});

export const actualizarEmbarcacionSchema = z.object({
  nombre: textoSchema(1, 100, "El nombre de la embarcación").optional(),
  capacidad: z
    .number({ error: "La capacidad debe ser un número" })
    .int("La capacidad debe ser un número entero")
    .min(1, "La capacidad debe ser mayor a 0")
    .max(500, "La capacidad no puede ser mayor a 500 pasajeros")
    .optional(),
  estado: estadoEmbarcacion.optional(),
  tipo: textoOpcionalSchema(50),
});

export type CrearEmbarcacionInput = z.infer<typeof crearEmbarcacionSchema>;
export type ActualizarEmbarcacionInput = z.infer<typeof actualizarEmbarcacionSchema>;
