import { z } from "zod";
import { textoSchema, observacionesSchema } from "./schemas";

export const anularVentaSchema = z.object({
  motivo: textoSchema(3, 500, "El motivo"),
  observaciones: observacionesSchema,
  tipoAnulacion: z.enum(["ANULACION", "REEMBOLSO"]).optional().default("ANULACION"),
  montoReembolso: z.number().positive("El monto debe ser mayor a 0").optional(),
});

export type AnularVentaInput = z.infer<typeof anularVentaSchema>;
