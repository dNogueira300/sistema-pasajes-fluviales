import { z } from "zod";

export const actualizarEstadoEmbarqueSchema = z.object({
  estadoEmbarque: z.enum(["EMBARCADO", "NO_EMBARCADO"]),
  observaciones: z.string().optional(),
});
