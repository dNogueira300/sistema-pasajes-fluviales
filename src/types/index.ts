// types/index.ts
// Tipos de usuarios y roles
export type UserRole = "ADMINISTRADOR" | "VENDEDOR" | "OPERADOR_EMBARCACION";
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

// Tipo de usuario extendido con información adicional
export interface Usuario {
  id: string;
  email: string;
  username: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  activo: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    ventas: number;
    anulaciones: number;
  };
}

// Filtros para buscar usuarios
export interface FiltrosUsuarios {
  busqueda?: string;
  role?: UserRole;
  activo?: boolean;
  page?: number;
  limit?: number;
}

// Datos para crear un usuario
export interface CrearUsuarioData {
  email: string;
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  role?: UserRole;
  activo?: boolean;
  // Campos específicos para OPERADOR_EMBARCACION
  embarcacionAsignadaId?: string;
  estadoOperador?: "ACTIVO" | "INACTIVO";
}

// Datos para actualizar un usuario
export interface ActualizarUsuarioData {
  email?: string;
  username?: string;
  password?: string;
  nombre?: string;
  apellido?: string;
  role?: UserRole;
  activo?: boolean;
  // Campos específicos para OPERADOR_EMBARCACION
  embarcacionAsignadaId?: string | null;
  estadoOperador?: "ACTIVO" | "INACTIVO";
}

// Estadísticas de usuarios
export interface EstadisticasUsuarios {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  usuariosAdministradores: number;
  usuariosVendedores: number;
  usuariosConVentas: number;
  usuariosRecientes: number;
}

// Respuesta de la API de usuarios
export interface UsuariosResponse {
  usuarios: Usuario[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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
  _count?: {
    ventas: number;
    embarcacionRutas: number;
  };
}

// Filtros para buscar rutas
export interface FiltrosRutas {
  busqueda?: string;
  activa?: boolean;
  page?: number;
  limit?: number;
}

// Datos para crear una ruta
export interface CrearRutaData {
  nombre: string;
  puertoOrigen: string;
  puertoDestino: string;
  precio: number;
  activa?: boolean;
}

// Datos para actualizar una ruta
export interface ActualizarRutaData {
  nombre?: string;
  puertoOrigen?: string;
  puertoDestino?: string;
  precio?: number;
  activa?: boolean;
}

// Estadísticas de rutas
export interface EstadisticasRutas {
  totalRutas: number;
  rutasActivas: number;
  rutasInactivas: number;
  rutasConVentas: number;
  rutasRecientes: number;
}

// Respuesta de la API de rutas
export interface RutasResponse {
  rutas: Ruta[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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
  _count?: {
    ventas: number;
    embarcacionRutas: number;
  };
}

// Filtros para buscar embarcaciones
export interface FiltrosEmbarcaciones {
  busqueda?: string;
  estado?: EstadoEmbarcacion;
  page?: number;
  limit?: number;
}

// Datos para crear una embarcación
export interface CrearEmbarcacionData {
  nombre: string;
  capacidad: number;
  estado?: EstadoEmbarcacion;
  tipo?: string;
}

// Datos para actualizar una embarcación
export interface ActualizarEmbarcacionData {
  nombre?: string;
  capacidad?: number;
  estado?: EstadoEmbarcacion;
  tipo?: string;
}

// Estadísticas de embarcaciones
export interface EstadisticasEmbarcaciones {
  totalEmbarcaciones: number;
  embarcacionesActivas: number;
  embarcacionesMantenimiento: number;
  embarcacionesInactivas: number;
  embarcacionesConVentas: number;
  capacidadTotal: number;
  capacidadPromedio: number;
}

// Respuesta de la API de embarcaciones
export interface EmbarcacionesResponse {
  embarcaciones: Embarcacion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para EmbarcacionRuta
export interface EmbarcacionRuta {
  id: string;
  embarcacionId: string;
  rutaId: string;
  horasSalida: string[];
  diasOperacion: string[];
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
  embarcacion?: Embarcacion;
  ruta?: Ruta;
}

// Datos para crear una asignación embarcación-ruta
export interface CrearEmbarcacionRutaData {
  embarcacionId: string;
  rutaId: string;
  horasSalida: string[];
  diasOperacion: string[];
  activa?: boolean;
}

// Datos para actualizar una asignación embarcación-ruta
export interface ActualizarEmbarcacionRutaData {
  horasSalida?: string[];
  diasOperacion?: string[];
  activa?: boolean;
}

// Filtros para buscar asignaciones embarcación-ruta
export interface FiltrosEmbarcacionRutas {
  rutaId?: string;
  embarcacionId?: string;
  activa?: boolean;
  page?: number;
  limit?: number;
}

// Respuesta de la API de embarcación-rutas
export interface EmbarcacionRutasResponse {
  embarcacionRutas: EmbarcacionRuta[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Embarcación con sus rutas asignadas
export interface EmbarcacionConRutas extends Embarcacion {
  embarcacionRutas: (EmbarcacionRuta & {
    ruta: Ruta;
  })[];
}

// Ruta con sus embarcaciones asignadas
export interface RutaConEmbarcaciones extends Ruta {
  embarcacionRutas: (EmbarcacionRuta & {
    embarcacion: Embarcacion;
  })[];
}

// Actualizar interface Ruta para incluir embarcaciones
export interface CrearRutaConEmbarcaciones extends CrearRutaData {
  embarcaciones?: CrearEmbarcacionRutaData[];
}

export interface ActualizarRutaConEmbarcaciones extends ActualizarRutaData {
  embarcaciones?: {
    crear?: CrearEmbarcacionRutaData[];
    actualizar?: (ActualizarEmbarcacionRutaData & { id: string })[];
    eliminar?: string[];
  };
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

// Constantes para días de la semana
export const DIAS_SEMANA = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number]["value"];

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
  horaEmbarque: string;
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
  // Campos específicos de la venta (pueden ser diferentes a los de la ruta)
  puertoOrigen: string;
  puertoDestino: string;
  embarcacion: {
    nombre: string;
  };
  puertoEmbarque: {
    nombre: string;
    direccion?: string;
    descripcion?: string;
  };
  cantidadPasajes: number;
  precioUnitario: number;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: "CONFIRMADA" | "ANULADA" | "REEMBOLSADA";
  tipoPago: "UNICO" | "HIBRIDO";
  metodoPago: string;
  metodosPago?: Array<{
    tipo: string;
    monto: number;
  }>;
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

// Tipos para estadísticas de ventas
export interface EstadisticasVentas {
  totalVentas: number;
  ventasHoy: number;
  ventasConfirmadas: number;
  ventasAnuladas: number;
  totalRecaudado: number;
  ventasReembolsadas: number;
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
