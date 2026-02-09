import { z } from "zod";
import { sanitizeText } from "@/lib/utils/sanitize";

export const actualizarEstadoEmbarqueSchema = z.object({
  estadoEmbarque: z.enum(["EMBARCADO", "NO_EMBARCADO"]),
  observaciones: z
    .string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .transform(sanitizeText)
    .optional(),
});
