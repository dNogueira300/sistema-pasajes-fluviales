import { z } from "zod";
import {
  textoSchema,
  textoOpcionalSchema,
  dniSchema,
  emailOpcionalSchema,
  telefonoOpcionalSchema,
} from "./schemas";

export const crearClienteSchema = z.object({
  dni: dniSchema,
  nombre: textoSchema(2, 100, "El nombre"),
  apellido: textoSchema(2, 100, "El apellido"),
  telefono: telefonoOpcionalSchema,
  email: emailOpcionalSchema,
  nacionalidad: textoOpcionalSchema(50),
  direccion: textoOpcionalSchema(200),
});

export const actualizarClienteSchema = crearClienteSchema;

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
