// lib/actions/reportes.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  FiltrosReporte,
  ReporteCompleto,
  ResumenVentas,
  ReportePorRuta,
  ReportePorEmbarcacion,
  ReportePorVendedor,
  ReportePorMetodoPago,
  ReportePorFecha,
  ReporteDiario,
  VentaResumen,
  VentaDetallada,
  OpcionesReporte,
} from "@/types/reportes";
import { format } from "date-fns";

// ============================================
// 🚀 UTILIDADES CENTRALIZADAS
// ============================================

/**
 * Obtener fecha actual en zona horaria de Perú
 */
function obtenerFechaEnPeru(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
  );
}

/**
 * Crear rango de fechas para un día específico en zona horaria de Perú
 */
function crearRangoDia(fecha: Date): { inicio: Date; fin: Date } {
  return {
    inicio: new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
      0,
      0,
      0,
      0
    ),
    fin: new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
      23,
      59,
      59,
      999
    ),
  };
}

/**
 * Convertir Decimal de Prisma a número de forma segura
 */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

// ============================================
// 🚀 FUNCIÓN GENÉRICA PARA REPORTES AGRUPADOS
// ============================================

interface ConfiguracionReporteAgrupado<T extends string> {
  campoAgrupacion: T;
  nombreEntidad: string;
  obtenerNombre: (entidad: { id: string; [key: string]: unknown }) => string;
  queryEntidades: (
    ids: string[]
  ) => Promise<Array<{ id: string; [key: string]: unknown }>>;
}

/**
 * Función genérica para generar reportes agrupados
 * Elimina duplicación de código entre reportes por ruta, embarcación, vendedor, etc.
 */
async function generarReporteAgrupado<
  T extends string,
  R extends {
    totalVentas: number;
    totalRecaudado: number;
    totalPasajes: number;
    porcentaje: number;
  }
>(
  whereConditions: Prisma.VentaWhereInput,
  config: ConfiguracionReporteAgrupado<T>,
  transformarResultado: (
    id: string,
    nombre: string,
    stats: {
      count: number;
      total: number;
      pasajes: number;
      porcentaje: number;
    }
  ) => R
): Promise<R[]> {
  // 1. Agrupar ventas
  const resultados = await prisma.venta.groupBy({
    by: [config.campoAgrupacion] as Array<Prisma.VentaScalarFieldEnum>,
    where: whereConditions,
    _count: true,
    _sum: {
      total: true,
      cantidadPasajes: true,
    },
  });

  if (resultados.length === 0) return [];

  // 2. Obtener IDs y entidades
  const ids = resultados.map(
    (r: Record<string, unknown>) => r[config.campoAgrupacion] as string
  );
  const entidadesArray = await config.queryEntidades(ids);

  // 3. Crear mapa de entidades para lookup O(1)
  const entidadesMap = new Map<string, string>();
  entidadesArray.forEach((entidad) => {
    entidadesMap.set(entidad.id, config.obtenerNombre(entidad));
  });

  // 4. Calcular total general una sola vez
  const totalGeneral = resultados.reduce(
    (sum, r: Record<string, unknown>) =>
      sum + toNumber((r._sum as Record<string, unknown>)?.total),
    0
  );

  // 5. Transformar resultados
  return resultados
    .map((resultado: Record<string, unknown>) => {
      const id = resultado[config.campoAgrupacion] as string;
      const nombre =
        entidadesMap.get(id) || `${config.nombreEntidad} no encontrado`;
      const totalRecaudado = toNumber(
        (resultado._sum as Record<string, unknown>)?.total
      );
      const sumData = resultado._sum as { cantidadPasajes?: number };

      return transformarResultado(id, nombre, {
        count: resultado._count as number,
        total: totalRecaudado,
        pasajes: sumData.cantidadPasajes || 0,
        porcentaje:
          totalGeneral > 0 ? (totalRecaudado / totalGeneral) * 100 : 0,
      });
    })
    .sort((a, b) => b.totalRecaudado - a.totalRecaudado);
}

// ============================================
// 🚀 CONSTRUCCIÓN DE CONDICIONES WHERE
// ============================================

function construirCondicionesWhere(
  filtros: FiltrosReporte
): Prisma.VentaWhereInput {
  const where: Prisma.VentaWhereInput = {};

  // Filtro por fechas usando zona horaria de Perú (UTC-5)
  // Convertimos las fechas a la zona horaria de Perú para evitar problemas de interpretación
  if (filtros.fechaInicio && filtros.fechaFin) {
    // Crear fechas en zona horaria de Perú
    const fechaInicioStr = `${filtros.fechaInicio}T00:00:00-05:00`;
    const fechaFinStr = `${filtros.fechaFin}T23:59:59.999-05:00`;

    where.fechaVenta = {
      gte: new Date(fechaInicioStr),
      lte: new Date(fechaFinStr),
    };
  } else if (filtros.fechaInicio) {
    const fechaInicioStr = `${filtros.fechaInicio}T00:00:00-05:00`;
    where.fechaVenta = {
      gte: new Date(fechaInicioStr),
    };
  } else if (filtros.fechaFin) {
    const fechaFinStr = `${filtros.fechaFin}T23:59:59.999-05:00`;
    where.fechaVenta = {
      lte: new Date(fechaFinStr),
    };
  }

  // Aplicar resto de filtros
  if (filtros.rutaId) where.rutaId = filtros.rutaId;
  if (filtros.embarcacionId) where.embarcacionId = filtros.embarcacionId;
  if (filtros.vendedorId) where.userId = filtros.vendedorId;
  if (filtros.metodoPago) where.metodoPago = filtros.metodoPago;
  if (filtros.tipoPago) where.tipoPago = filtros.tipoPago;
  if (filtros.estado) where.estado = filtros.estado;

  return where;
}

// ============================================
// 🚀 GENERAR REPORTE COMPLETO
// ============================================

export async function generarReporteCompleto(
  filtros: FiltrosReporte
): Promise<ReporteCompleto> {
  const whereConditions = construirCondicionesWhere(filtros);

  const [
    resumen,
    porRuta,
    porEmbarcacion,
    porVendedor,
    porMetodoPago,
    porFecha,
    ventasDetalladas,
  ] = await Promise.all([
    obtenerResumenVentas(whereConditions),
    obtenerReportePorRuta(whereConditions),
    obtenerReportePorEmbarcacion(whereConditions),
    obtenerReportePorVendedor(whereConditions),
    obtenerReportePorMetodoPago(whereConditions),
    obtenerReportePorFecha(whereConditions),
    obtenerVentasDetalladas(whereConditions),
  ]);

  return {
    resumen,
    porRuta,
    porEmbarcacion,
    porVendedor,
    porMetodoPago,
    porFecha,
    ventasDetalladas,
    filtros,
    fechaGeneracion: new Date().toISOString(),
  };
}

// ============================================
// 🚀 RESUMEN DE VENTAS
// ============================================

async function obtenerResumenVentas(
  whereConditions: Prisma.VentaWhereInput
): Promise<ResumenVentas> {
  const [estadisticas, totales] = await Promise.all([
    prisma.venta.groupBy({
      by: ["estado"],
      where: whereConditions,
      _count: true,
    }),
    prisma.venta.aggregate({
      where: whereConditions,
      _sum: {
        total: true,
        cantidadPasajes: true,
      },
      _count: true,
      _avg: {
        total: true,
      },
    }),
  ]);

  // Crear mapa de estados para lookup O(1)
  const ventasPorEstado = estadisticas.reduce((acc, item) => {
    acc[item.estado] = item._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalVentas: totales._count || 0,
    totalRecaudado: toNumber(totales._sum.total),
    totalPasajes: totales._sum.cantidadPasajes || 0,
    ventasConfirmadas: ventasPorEstado.CONFIRMADA || 0,
    ventasAnuladas: ventasPorEstado.ANULADA || 0,
    ventasReembolsadas: ventasPorEstado.REEMBOLSADA || 0,
    promedioVenta: toNumber(totales._avg.total),
  };
}

// ============================================
// 🚀 REPORTES POR ENTIDAD (USANDO FUNCIÓN GENÉRICA)
// ============================================

async function obtenerReportePorRuta(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorRuta[]> {
  return generarReporteAgrupado<"rutaId", ReportePorRuta>(
    whereConditions,
    {
      campoAgrupacion: "rutaId",
      nombreEntidad: "Ruta",
      obtenerNombre: (entidad) =>
        (entidad.nombre as string) || "Ruta no encontrada",
      queryEntidades: async (ids) => {
        const rutas = await prisma.ruta.findMany({
          where: { id: { in: ids } },
          select: { id: true, nombre: true },
        });
        return rutas;
      },
    },
    (id, nombre, stats) => ({
      rutaId: id,
      nombreRuta: nombre,
      totalVentas: stats.count,
      totalRecaudado: stats.total,
      totalPasajes: stats.pasajes,
      porcentaje: stats.porcentaje,
    })
  );
}

async function obtenerReportePorEmbarcacion(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorEmbarcacion[]> {
  return generarReporteAgrupado<"embarcacionId", ReportePorEmbarcacion>(
    whereConditions,
    {
      campoAgrupacion: "embarcacionId",
      nombreEntidad: "Embarcación",
      obtenerNombre: (entidad) =>
        (entidad.nombre as string) || "Embarcación no encontrada",
      queryEntidades: async (ids) => {
        const embarcaciones = await prisma.embarcacion.findMany({
          where: { id: { in: ids } },
          select: { id: true, nombre: true },
        });
        return embarcaciones;
      },
    },
    (id, nombre, stats) => ({
      embarcacionId: id,
      nombreEmbarcacion: nombre,
      totalVentas: stats.count,
      totalRecaudado: stats.total,
      totalPasajes: stats.pasajes,
      porcentaje: stats.porcentaje,
    })
  );
}

async function obtenerReportePorVendedor(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorVendedor[]> {
  return generarReporteAgrupado<"userId", ReportePorVendedor>(
    whereConditions,
    {
      campoAgrupacion: "userId",
      nombreEntidad: "Vendedor",
      obtenerNombre: (entidad) => {
        const nombre = entidad.nombre as string;
        const apellido = entidad.apellido as string;
        return `${nombre} ${apellido}`;
      },
      queryEntidades: async (ids) => {
        const vendedores = await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, nombre: true, apellido: true },
        });
        return vendedores;
      },
    },
    (id, nombre, stats) => ({
      vendedorId: id,
      nombreVendedor: nombre,
      totalVentas: stats.count,
      totalRecaudado: stats.total,
      totalPasajes: stats.pasajes,
      porcentaje: stats.porcentaje,
    })
  );
}

// ============================================
// 🚀 REPORTE POR MÉTODO DE PAGO
// ============================================

async function obtenerReportePorMetodoPago(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorMetodoPago[]> {
  const resultados = await prisma.venta.groupBy({
    by: ["metodoPago", "tipoPago"],
    where: whereConditions,
    _count: true,
    _sum: {
      total: true,
    },
  });

  const totalGeneral = resultados.reduce(
    (sum, r) => sum + toNumber(r._sum.total),
    0
  );

  return resultados
    .map((resultado) => {
      const totalRecaudado = toNumber(resultado._sum.total);

      return {
        metodoPago: resultado.metodoPago,
        tipoPago: resultado.tipoPago,
        totalVentas: resultado._count,
        totalRecaudado,
        porcentaje:
          totalGeneral > 0 ? (totalRecaudado / totalGeneral) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalRecaudado - a.totalRecaudado);
}

// ============================================
// 🚀 REPORTE POR FECHA
// ============================================

async function obtenerReportePorFecha(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorFecha[]> {
  const ventas = await prisma.venta.findMany({
    where: whereConditions,
    select: {
      fechaVenta: true,
      total: true,
      cantidadPasajes: true,
    },
  });

  // Agrupar por fecha usando Map para mejor rendimiento
  const ventasPorFecha = new Map<
    string,
    { totalVentas: number; totalRecaudado: number; totalPasajes: number }
  >();

  ventas.forEach((venta) => {
    const fecha = format(new Date(venta.fechaVenta), "yyyy-MM-dd");
    const datos = ventasPorFecha.get(fecha) || {
      totalVentas: 0,
      totalRecaudado: 0,
      totalPasajes: 0,
    };

    datos.totalVentas += 1;
    datos.totalRecaudado += toNumber(venta.total);
    datos.totalPasajes += venta.cantidadPasajes;

    ventasPorFecha.set(fecha, datos);
  });

  return Array.from(ventasPorFecha.entries())
    .map(([fecha, datos]) => ({
      fecha,
      ...datos,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ============================================
// 🚀 REPORTE DIARIO
// ============================================

export async function generarReporteDiario(
  fechaParam?: string
): Promise<ReporteDiario> {
  const fechaConsulta =
    fechaParam || format(obtenerFechaEnPeru(), "yyyy-MM-dd");

  const filtros: FiltrosReporte = {
    fechaInicio: fechaConsulta,
    fechaFin: fechaConsulta,
  };

  const whereConditions = construirCondicionesWhere(filtros);

  const [resumen, ventasDelDia, topRutas, topVendedores, metodosPago] =
    await Promise.all([
      obtenerResumenVentas(whereConditions),
      obtenerVentasDelDia(whereConditions),
      obtenerReportePorRuta(whereConditions),
      obtenerReportePorVendedor(whereConditions),
      obtenerReportePorMetodoPago(whereConditions),
    ]);

  return {
    fecha: fechaConsulta,
    resumen,
    ventasDelDia,
    topRutas: topRutas.slice(0, 5),
    topVendedores: topVendedores.slice(0, 5),
    metodosPago,
  };
}

// ============================================
// 🚀 VENTAS DEL DÍA
// ============================================

async function obtenerVentasDelDia(
  whereConditions: Prisma.VentaWhereInput
): Promise<VentaResumen[]> {
  const ventas = await prisma.venta.findMany({
    where: whereConditions,
    select: {
      id: true,
      numeroVenta: true,
      total: true,
      metodoPago: true,
      tipoPago: true,
      estado: true,
      fechaVenta: true,
      cliente: {
        select: {
          nombre: true,
          apellido: true,
        },
      },
      ruta: {
        select: {
          nombre: true,
        },
      },
      embarcacion: {
        select: {
          nombre: true,
        },
      },
      vendedor: {
        select: {
          nombre: true,
          apellido: true,
        },
      },
    },
    orderBy: {
      fechaVenta: "desc",
    },
  });

  return ventas.map((venta) => ({
    id: venta.id,
    numeroVenta: venta.numeroVenta,
    cliente: `${venta.cliente.nombre} ${venta.cliente.apellido}`,
    ruta: venta.ruta.nombre,
    embarcacion: venta.embarcacion.nombre,
    vendedor: `${venta.vendedor.nombre} ${venta.vendedor.apellido}`,
    total: toNumber(venta.total),
    metodoPago: venta.metodoPago,
    tipoPago: venta.tipoPago,
    estado: venta.estado,
    fechaVenta: venta.fechaVenta.toISOString(),
  }));
}

// ============================================
// 🚀 VENTAS DETALLADAS PARA REPORTES
// ============================================

async function obtenerVentasDetalladas(
  whereConditions: Prisma.VentaWhereInput
): Promise<VentaDetallada[]> {
  const ventas = await prisma.venta.findMany({
    where: whereConditions,
    select: {
      numeroVenta: true,
      fechaVenta: true,
      fechaViaje: true,
      horaViaje: true,
      total: true,
      metodoPago: true,
      tipoPago: true,
      metodosPago: true,
      estado: true,
      cliente: {
        select: {
          nombre: true,
          apellido: true,
          dni: true,
          telefono: true,
        },
      },
      ruta: {
        select: {
          nombre: true,
        },
      },
      embarcacion: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: {
      fechaVenta: "desc",
    },
  });

  return ventas.map((venta) => ({
    numeroVenta: venta.numeroVenta,
    fechaVenta: venta.fechaVenta.toISOString(),
    fechaViaje: venta.fechaViaje.toISOString(),
    horaViaje: venta.horaViaje,
    cliente: `${venta.cliente.nombre} ${venta.cliente.apellido}`,
    documentoIdentidad: venta.cliente.dni,
    contacto: venta.cliente.telefono || "N/A",
    embarcacion: venta.embarcacion.nombre,
    ruta: venta.ruta.nombre,
    tipoPago: venta.tipoPago,
    metodoPago: venta.metodoPago,
    metodosPago: venta.metodosPago,
    estado: venta.estado,
    total: toNumber(venta.total),
  }));
}

// ============================================
// 🚀 OPCIONES PARA FILTROS
// ============================================

export async function obtenerOpcionesReporte(): Promise<OpcionesReporte> {
  const [rutas, embarcaciones, vendedores, metodosTiposPago] =
    await Promise.all([
      prisma.ruta.findMany({
        where: { activa: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.embarcacion.findMany({
        where: { estado: "ACTIVA" },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.user.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, apellido: true },
        orderBy: { nombre: "asc" },
      }),
      // 🚀 OPTIMIZACIÓN: Una sola query para obtener métodos y tipos de pago únicos
      prisma.venta.findMany({
        select: {
          metodoPago: true,
          tipoPago: true,
        },
        distinct: ["metodoPago", "tipoPago"],
      }),
    ]);

  // Extraer valores únicos usando Set
  const metodosPagoUnicos = new Set<string>();
  const tiposPagoUnicos = new Set<string>();

  metodosTiposPago.forEach((venta) => {
    metodosPagoUnicos.add(venta.metodoPago);
    tiposPagoUnicos.add(venta.tipoPago);
  });

  return {
    rutas: rutas.map((r) => ({ value: r.id, label: r.nombre })),
    embarcaciones: embarcaciones.map((e) => ({ value: e.id, label: e.nombre })),
    vendedores: vendedores.map((v) => ({
      value: v.id,
      label: `${v.nombre} ${v.apellido}`,
    })),
    metodosPago: Array.from(metodosPagoUnicos).map((m) => ({
      value: m,
      label: m,
    })),
    tiposPago: Array.from(tiposPagoUnicos).map((t) => ({
      value: t,
      label: t,
    })),
  };
}

// ============================================
// 🚀 ESTADÍSTICAS RÁPIDAS PARA DASHBOARD
// ============================================

export async function obtenerEstadisticasRapidas() {
  const fechaEnPeru = obtenerFechaEnPeru();
  const { inicio: inicioHoy, fin: finHoy } = crearRangoDia(fechaEnPeru);
  const inicioMes = new Date(
    fechaEnPeru.getFullYear(),
    fechaEnPeru.getMonth(),
    1
  );

  const [ventasHoy, ventasMes, topRutasMes] = await Promise.all([
    obtenerResumenVentas({
      fechaVenta: {
        gte: inicioHoy,
        lte: finHoy,
      },
      estado: "CONFIRMADA",
    }),
    obtenerResumenVentas({
      fechaVenta: {
        gte: inicioMes,
        lte: fechaEnPeru,
      },
      estado: "CONFIRMADA",
    }),
    obtenerReportePorRuta({
      fechaVenta: {
        gte: inicioMes,
        lte: fechaEnPeru,
      },
      estado: "CONFIRMADA",
    }),
  ]);

  return {
    ventasHoy,
    ventasMes,
    topRutasMes: topRutasMes.slice(0, 3),
    fechaActualizacion: new Date().toISOString(),
  };
}
