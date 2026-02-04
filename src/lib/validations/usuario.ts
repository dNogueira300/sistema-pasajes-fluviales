import { z } from "zod";

// Validaciones comunes
const emailSchema = z
  .string()
  .min(1, "El email es obligatorio")
  .email("Formato de email inválido")
  .transform((val) => val.toLowerCase().trim());

const usernameSchema = z
  .string()
  .min(3, "El username debe tener al menos 3 caracteres")
  .max(30, "El username no puede tener más de 30 caracteres")
  .regex(/^[a-zA-Z0-9_]+$/, "El username solo puede contener letras, números y guiones bajos")
  .transform((val) => val.toLowerCase().trim());

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número"
  );

const nombreSchema = z
  .string()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(50, "El nombre no puede tener más de 50 caracteres")
  .transform((val) => val.trim());

const apellidoSchema = z
  .string()
  .min(2, "El apellido debe tener al menos 2 caracteres")
  .max(50, "El apellido no puede tener más de 50 caracteres")
  .transform((val) => val.trim());

const roleSchema = z.enum(["ADMINISTRADOR", "VENDEDOR", "OPERADOR_EMBARCACION"], {
  message: "Rol no válido",
});

const estadoOperadorSchema = z.enum(["ACTIVO", "INACTIVO"], {
  message: "Estado de operador no válido",
});

// Schema para crear usuario
export const crearUsuarioSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    nombre: nombreSchema,
    apellido: apellidoSchema,
    role: roleSchema.optional().default("VENDEDOR"),
    activo: z.boolean().optional().default(true),
    // Campos para operador
    embarcacionAsignadaId: z.string().optional(),
    estadoOperador: estadoOperadorSchema.optional().default("ACTIVO"),
  })
  .refine(
    (data) => {
      // Si el rol es OPERADOR_EMBARCACION, estadoOperador debe estar definido
      if (data.role === "OPERADOR_EMBARCACION") {
        return data.estadoOperador !== undefined;
      }
      return true;
    },
    {
      message: "El estado del operador es requerido para operadores de embarcación",
      path: ["estadoOperador"],
    }
  );

// Schema para actualizar usuario
export const actualizarUsuarioSchema = z
  .object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: passwordSchema.optional(),
    nombre: nombreSchema.optional(),
    apellido: apellidoSchema.optional(),
    role: roleSchema.optional(),
    activo: z.boolean().optional(),
    // Campos para operador
    embarcacionAsignadaId: z.string().nullable().optional(),
    estadoOperador: estadoOperadorSchema.optional(),
  })
  .refine(
    (data) => {
      // Si algún campo está presente, al menos debe ser válido
      return Object.values(data).some((val) => val !== undefined);
    },
    {
      message: "Debe proporcionar al menos un campo para actualizar",
    }
  );

// Schema para cambiar contraseña
export const cambiarContrasenaSchema = z.object({
  password: passwordSchema,
  confirmarPassword: z.string().min(1, "Debe confirmar la contraseña"),
}).refine((data) => data.password === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

// Tipos exportados
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
export type CambiarContrasenaInput = z.infer<typeof cambiarContrasenaSchema>;

// Función helper para validar en el servidor
export function validarCrearUsuario(data: unknown) {
  return crearUsuarioSchema.safeParse(data);
}

export function validarActualizarUsuario(data: unknown) {
  return actualizarUsuarioSchema.safeParse(data);
}

export function validarCambiarContrasena(data: unknown) {
  return cambiarContrasenaSchema.safeParse(data);
}
