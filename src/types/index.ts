// Tipos de usuarios y roles
export type UserRole = "ADMINISTRADOR" | "VENDEDOR";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
}

// Estados de loading y errores
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Tipos para las rutas
export interface Ruta {
  id: string;
  nombre: string;
  puertoOrigen: string;
  puertoDestino: string;
  precio: number;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para embarcaciones
export type EstadoEmbarcacion = "ACTIVA" | "MANTENIMIENTO" | "INACTIVA";

export interface Embarcacion {
  id: string;
  nombre: string;
  capacidad: number;
  estado: EstadoEmbarcacion;
  tipo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para clientes
export interface Cliente {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  nacionalidad: string;
  email?: string;
  direccion?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para ventas
export type EstadoVenta = "CONFIRMADA" | "ANULADA" | "REEMBOLSADA";

export interface Venta {
  id: string;
  numeroVenta: string;
  clienteId: string;
  rutaId: string;
  embarcacionId: string;
  userId: string;
  fechaViaje: Date;
  horaEmbarque: string;
  horaViaje: string;
  cantidadPasajes: number;
  puertoOrigen: string;
  puertoDestino: string;
  precioUnitario: number;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: EstadoVenta;
  metodoPago: string;
  observaciones?: string;
  fechaVenta: Date;
  createdAt: Date;
  updatedAt: Date;
}
