import { z } from "zod";
import { textoSchema, precioSchema } from "./schemas";

export const crearRutaSchema = z
  .object({
    nombre: textoSchema(1, 100, "El nombre de la ruta"),
    puertoOrigen: textoSchema(1, 100, "El puerto de origen"),
    puertoDestino: textoSchema(1, 100, "El puerto de destino"),
    precio: precioSchema(0.01, 1000),
    activa: z.boolean().optional().default(true),
  })
  .refine(
    (data) => data.puertoOrigen.toLowerCase() !== data.puertoDestino.toLowerCase(),
    {
      message: "El puerto de origen debe ser diferente al puerto de destino",
      path: ["puertoDestino"],
    },
  );

export const actualizarRutaSchema = z
  .object({
    nombre: textoSchema(1, 100, "El nombre de la ruta").optional(),
    puertoOrigen: textoSchema(1, 100, "El puerto de origen").optional(),
    puertoDestino: textoSchema(1, 100, "El puerto de destino").optional(),
    precio: precioSchema(0.01, 1000).optional(),
    activa: z.boolean().optional(),
  });

export type CrearRutaInput = z.infer<typeof crearRutaSchema>;
export type ActualizarRutaInput = z.infer<typeof actualizarRutaSchema>;
