import { z } from "zod";

export const crearOperadorSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto").max(100),
  apellido: z.string().min(2, "Apellido muy corto").max(100),
  email: z.string().email("Email inválido"),
  username: z.string().min(4, "Username muy corto").max(50),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe tener una mayúscula")
    .regex(/[a-z]/, "Debe tener una minúscula")
    .regex(/[0-9]/, "Debe tener un número"),
  embarcacionAsignadaId: z.string().optional(),
  estadoOperador: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

export const actualizarOperadorSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  apellido: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

export const asignarEmbarcacionSchema = z.object({
  embarcacionId: z.string().min(1, "Embarcación requerida"),
});

export const cambiarEstadoOperadorSchema = z.object({
  estadoOperador: z.enum(["ACTIVO", "INACTIVO"]),
});
