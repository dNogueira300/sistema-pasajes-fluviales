import { z } from "zod";
import { textoSchema, textoOpcionalSchema } from "./schemas";

export const crearPuertoSchema = z.object({
  nombre: textoSchema(1, 100, "El nombre del puerto"),
  descripcion: textoOpcionalSchema(300),
  direccion: textoOpcionalSchema(200),
  orden: z.number().int().min(0).optional().default(0),
  activo: z.boolean().optional().default(true),
});

export const actualizarPuertoSchema = z.object({
  nombre: textoSchema(1, 100, "El nombre del puerto").optional(),
  descripcion: textoOpcionalSchema(300),
  direccion: textoOpcionalSchema(200),
  orden: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

export type CrearPuertoInput = z.infer<typeof crearPuertoSchema>;
export type ActualizarPuertoInput = z.infer<typeof actualizarPuertoSchema>;
