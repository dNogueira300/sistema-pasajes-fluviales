// Definir tipo específico para método de pago híbrido
export interface MetodoPagoHibrido {
  metodo: string;
  monto: number;
}

// Tipos para filtros de reportes
export interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  rutaId?: string;
  embarcacionId?: string;
  vendedorId?: string;
  metodoPago?: string;
  tipoPago?: string;
  estado?: "CONFIRMADA" | "ANULADA" | "REEMBOLSADA";
}

// Datos resumidos para reportes
export interface ResumenVentas {
  totalVentas: number;
  totalRecaudado: number;
  totalPasajes: number;
  ventasConfirmadas: number;
  ventasAnuladas: number;
  ventasReembolsadas: number;
  promedioVenta: number;
}

// Datos para gráficos
export interface DatosGrafico {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Reportes por categoría
export interface ReportePorRuta {
  rutaId: string;
  nombreRuta: string;
  totalVentas: number;
  totalRecaudado: number;
  totalPasajes: number;
  porcentaje: number;
}

export interface ReportePorEmbarcacion {
  embarcacionId: string;
  nombreEmbarcacion: string;
  totalVentas: number;
  totalRecaudado: number;
  totalPasajes: number;
  porcentaje: number;
}

export interface ReportePorVendedor {
  vendedorId: string;
  nombreVendedor: string;
  totalVentas: number;
  totalRecaudado: number;
  totalPasajes: number;
  porcentaje: number;
}

export interface ReportePorMetodoPago {
  metodoPago: string;
  tipoPago: string;
  totalVentas: number;
  totalRecaudado: number;
  porcentaje: number;
}

export interface ReportePorFecha {
  fecha: string;
  totalVentas: number;
  totalRecaudado: number;
  totalPasajes: number;
}

// Reporte completo
export interface ReporteCompleto {
  resumen: ResumenVentas;
  porRuta: ReportePorRuta[];
  porEmbarcacion: ReportePorEmbarcacion[];
  porVendedor: ReportePorVendedor[];
  porMetodoPago: ReportePorMetodoPago[];
  porFecha: ReportePorFecha[];
  ventasDetalladas: VentaDetallada[];
  filtros: FiltrosReporte;
  fechaGeneracion: string;
}

// Tipos para reporte diario automático
export interface ReporteDiario {
  fecha: string;
  resumen: ResumenVentas;
  ventasDelDia: VentaResumen[];
  topRutas: ReportePorRuta[];
  topVendedores: ReportePorVendedor[];
  metodosPago: ReportePorMetodoPago[];
}

export interface VentaResumen {
  id: string;
  numeroVenta: string;
  cliente: string;
  ruta: string;
  embarcacion: string;
  vendedor: string;
  total: number;
  metodoPago: string;
  tipoPago: string;
  estado: string;
  fechaVenta: string;
}

// Venta detallada para reportes PDF
export interface VentaDetallada {
  numeroVenta: string;
  fechaVenta: string;
  fechaViaje: string;
  horaViaje: string;
  cliente: string;
  documentoIdentidad: string;
  contacto: string;
  embarcacion: string;
  ruta: string;
  tipoPago: string;
  metodoPago: string;
  metodosPago?: MetodoPagoHibrido[] | string; // Array de métodos de pago para pagos híbridos
  estado: string;
  total: number;
}

// Configuración de exportación
export interface ConfiguracionExportacion {
  formato: "PDF" | "EXCEL";
  incluirGraficos: boolean;
  incluirDetalles: boolean;
  orientacion?: "portrait" | "landscape";
}

// Estados del sistema de reportes
export interface EstadoReportes {
  generando: boolean;
  progreso: number;
  error?: string;
  ultimaActualizacion: string;
}

// Opciones para selectores
export interface OpcionSelect {
  value: string;
  label: string;
}

export interface OpcionesReporte {
  rutas: OpcionSelect[];
  embarcaciones: OpcionSelect[];
  vendedores: OpcionSelect[];
  metodosPago: OpcionSelect[];
  tiposPago: OpcionSelect[];
}
