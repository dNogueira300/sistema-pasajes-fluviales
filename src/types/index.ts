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
  _count?: {
    ventas: number;
  };
}

// Datos para crear un cliente
export interface CrearClienteData {
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  nacionalidad?: string;
  direccion?: string;
}

// Datos para actualizar un cliente
export interface ActualizarClienteData {
  dni?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  nacionalidad?: string;
  direccion?: string;
}

// Filtros para buscar clientes
export interface FiltrosClientes {
  busqueda?: string;
  nacionalidad?: string;
  page?: number;
  limit?: number;
}

// Respuesta de la API de clientes
export interface ClientesResponse {
  clientes: Cliente[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  nacionalidades: string[];
}

// Estadísticas de clientes
export interface EstadisticasClientes {
  totalClientes: number;
  clientesConVentas: number;
  clientesSinVentas: number;
  nacionalidadesMasComunes: Array<{
    nacionalidad: string;
    _count: { nacionalidad: number };
  }>;
  clientesRecientes: number;
}

// Tipos para ventas
export type EstadoVenta = "CONFIRMADA" | "ANULADA" | "REEMBOLSADA";

export interface Venta {
  id: string;
  numeroVenta: string;
  fechaVenta: string;
  fechaViaje: string;
  horaViaje: string;
  cliente: {
    nombre: string;
    apellido: string;
    dni: string;
    telefono?: string;
    email?: string;
  };
  ruta: {
    nombre: string;
    puertoOrigen: string;
    puertoDestino: string;
  };
  embarcacion: {
    nombre: string;
  };
  puertoEmbarque: {
    nombre: string;
    direccion?: string;
    descripcion?: string;
  };
  cantidadPasajes: number;
  total: number;
  estado: "CONFIRMADA" | "ANULADA" | "REEMBOLSADA";
  metodoPago: string;
  vendedor: {
    nombre: string;
    apellido: string;
  };
  userId: string;
  anulacion?: {
    id: string;
    motivo: string;
    fechaAnulacion: string;
    usuario: {
      nombre: string;
      apellido: string;
    };
  };
}

// Tipos para anulaciones
export type TipoAnulacion = "ANULACION" | "REEMBOLSO";

export interface Anulacion {
  id: string;
  ventaId: string;
  motivo: string;
  observaciones?: string;
  usuarioId: string;
  fechaAnulacion: Date | string;
  asientosLiberados: number;
  montoReembolso?: number;
  tipoAnulacion: TipoAnulacion;

  // Relaciones populadas
  venta?: VentaConRelaciones;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    username: string;
  };

  createdAt: Date | string;
  updatedAt: Date | string;
}

// Datos para crear una anulación
export interface CrearAnulacionData {
  ventaId: string;
  motivo: string;
  observaciones?: string;
  tipoAnulacion?: TipoAnulacion;
  montoReembolso?: number;
}

// Respuesta de la API de anulación
export interface AnulacionResponse {
  success: boolean;
  anulacion: Anulacion;
  ventaActualizada: Venta; // Usa el mismo tipo Venta
  asientosLiberados: number;
  mensaje: string;
}

// Filtros para buscar anulaciones
export interface FiltrosAnulaciones {
  fechaInicio?: string;
  fechaFin?: string;
  tipoAnulacion?: TipoAnulacion;
  usuarioId?: string;
  busqueda?: string; // Para buscar por número de venta o cliente
  page?: number;
  limit?: number;
}

// Estadísticas de anulaciones
export interface EstadisticasAnulaciones {
  totalAnulaciones: number;
  totalAnulacionesHoy: number;
  totalReembolsos: number;
  montoTotalReembolsado: number;
  asientosTotalesLiberados: number;
  motivosComunes: {
    motivo: string;
    cantidad: number;
  }[];
}

// Tipo extendido de Venta con relaciones para anulaciones
export interface VentaConRelaciones {
  id: string;
  numeroVenta: string;
  total: number;
  fechaViaje: string | Date;
  cliente: {
    nombre: string;
    apellido: string;
    dni: string;
  };
  ruta: {
    nombre: string;
  };
  embarcacion: {
    nombre: string;
  };
  vendedor: {
    nombre: string;
    apellido: string;
  };
}

// Tipos para puertos de embarque
export interface Puerto {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    ventas: number;
  };
}

export interface FiltrosPuertos {
  busqueda?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

export interface CrearPuertoData {
  nombre: string;
  descripcion?: string;
  direccion?: string;
  activo?: boolean;
}

export interface ActualizarPuertoData {
  nombre?: string;
  descripcion?: string;
  direccion?: string;
  activo?: boolean;
}

export interface EstadisticasPuertos {
  totalPuertos: number;
  puertosActivos: number;
  puertosInactivos: number;
  puertosConVentas: number;
  puertosRecientes: number;
}

export interface PuertosResponse {
  puertos: Puerto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
