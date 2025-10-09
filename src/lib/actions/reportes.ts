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
  OpcionesReporte,
} from "@/types/reportes";
import { format } from "date-fns";

// Generar reporte completo
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
  ] = await Promise.all([
    obtenerResumenVentas(whereConditions),
    obtenerReportePorRuta(whereConditions),
    obtenerReportePorEmbarcacion(whereConditions),
    obtenerReportePorVendedor(whereConditions),
    obtenerReportePorMetodoPago(whereConditions),
    obtenerReportePorFecha(whereConditions),
  ]);

  return {
    resumen,
    porRuta,
    porEmbarcacion,
    porVendedor,
    porMetodoPago,
    porFecha,
    filtros,
    fechaGeneracion: new Date().toISOString(),
  };
}

// Construir condiciones WHERE basadas en filtros
function construirCondicionesWhere(
  filtros: FiltrosReporte
): Prisma.VentaWhereInput {
  const where: Prisma.VentaWhereInput = {};

  // Filtro por fechas usando zona horaria de Perú
  if (filtros.fechaInicio && filtros.fechaFin) {
    // Parsear fechas y ajustar a zona horaria de Perú
    const fechaInicio = new Date(filtros.fechaInicio + "T00:00:00");
    const fechaFin = new Date(filtros.fechaFin + "T23:59:59.999");

    where.fechaVenta = {
      gte: fechaInicio,
      lte: fechaFin,
    };
  } else if (filtros.fechaInicio) {
    const fechaInicio = new Date(filtros.fechaInicio + "T00:00:00");
    where.fechaVenta = {
      gte: fechaInicio,
    };
  } else if (filtros.fechaFin) {
    const fechaFin = new Date(filtros.fechaFin + "T23:59:59.999");
    where.fechaVenta = {
      lte: fechaFin,
    };
  }

  // Resto de filtros...
  if (filtros.rutaId) {
    where.rutaId = filtros.rutaId;
  }

  if (filtros.embarcacionId) {
    where.embarcacionId = filtros.embarcacionId;
  }

  if (filtros.vendedorId) {
    where.userId = filtros.vendedorId;
  }

  if (filtros.metodoPago) {
    where.metodoPago = filtros.metodoPago;
  }

  if (filtros.tipoPago) {
    where.tipoPago = filtros.tipoPago;
  }

  if (filtros.estado) {
    where.estado = filtros.estado;
  }

  return where;
}

// Obtener resumen de ventas
async function obtenerResumenVentas(
  whereConditions: Prisma.VentaWhereInput
): Promise<ResumenVentas> {
  const [estadisticas, totales] = await Promise.all([
    // Contar ventas por estado
    prisma.venta.groupBy({
      by: ["estado"],
      where: whereConditions,
      _count: true,
    }),
    // Obtener totales
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

  const ventasPorEstado = estadisticas.reduce((acc, item) => {
    acc[item.estado] = item._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalVentas: totales._count || 0,
    totalRecaudado: Number(totales._sum.total) || 0,
    totalPasajes: totales._sum.cantidadPasajes || 0,
    ventasConfirmadas: ventasPorEstado.CONFIRMADA || 0,
    ventasAnuladas: ventasPorEstado.ANULADA || 0,
    ventasReembolsadas: ventasPorEstado.REEMBOLSADA || 0,
    promedioVenta: Number(totales._avg.total) || 0,
  };
}

// Obtener reporte por ruta
async function obtenerReportePorRuta(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorRuta[]> {
  const resultados = await prisma.venta.groupBy({
    by: ["rutaId"],
    where: whereConditions,
    _count: true,
    _sum: {
      total: true,
      cantidadPasajes: true,
    },
  });

  // Obtener información de las rutas
  const rutaIds = resultados.map((r) => r.rutaId);
  const rutas = await prisma.ruta.findMany({
    where: { id: { in: rutaIds } },
    select: { id: true, nombre: true },
  });

  const totalGeneral = resultados.reduce(
    (sum, r) => sum + Number(r._sum.total || 0),
    0
  );

  return resultados
    .map((resultado) => {
      const ruta = rutas.find((r) => r.id === resultado.rutaId);
      const totalRecaudado = Number(resultado._sum.total) || 0;

      return {
        rutaId: resultado.rutaId,
        nombreRuta: ruta?.nombre || "Ruta no encontrada",
        totalVentas: resultado._count,
        totalRecaudado,
        totalPasajes: resultado._sum.cantidadPasajes || 0,
        porcentaje:
          totalGeneral > 0 ? (totalRecaudado / totalGeneral) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalRecaudado - a.totalRecaudado);
}

// Obtener reporte por embarcación
async function obtenerReportePorEmbarcacion(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorEmbarcacion[]> {
  const resultados = await prisma.venta.groupBy({
    by: ["embarcacionId"],
    where: whereConditions,
    _count: true,
    _sum: {
      total: true,
      cantidadPasajes: true,
    },
  });

  const embarcacionIds = resultados.map((r) => r.embarcacionId);
  const embarcaciones = await prisma.embarcacion.findMany({
    where: { id: { in: embarcacionIds } },
    select: { id: true, nombre: true },
  });

  const totalGeneral = resultados.reduce(
    (sum, r) => sum + Number(r._sum.total || 0),
    0
  );

  return resultados
    .map((resultado) => {
      const embarcacion = embarcaciones.find(
        (e) => e.id === resultado.embarcacionId
      );
      const totalRecaudado = Number(resultado._sum.total) || 0;

      return {
        embarcacionId: resultado.embarcacionId,
        nombreEmbarcacion: embarcacion?.nombre || "Embarcación no encontrada",
        totalVentas: resultado._count,
        totalRecaudado,
        totalPasajes: resultado._sum.cantidadPasajes || 0,
        porcentaje:
          totalGeneral > 0 ? (totalRecaudado / totalGeneral) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalRecaudado - a.totalRecaudado);
}

// Obtener reporte por vendedor
async function obtenerReportePorVendedor(
  whereConditions: Prisma.VentaWhereInput
): Promise<ReportePorVendedor[]> {
  const resultados = await prisma.venta.groupBy({
    by: ["userId"],
    where: whereConditions,
    _count: true,
    _sum: {
      total: true,
      cantidadPasajes: true,
    },
  });

  const vendedorIds = resultados.map((r) => r.userId);
  const vendedores = await prisma.user.findMany({
    where: { id: { in: vendedorIds } },
    select: { id: true, nombre: true, apellido: true },
  });

  const totalGeneral = resultados.reduce(
    (sum, r) => sum + Number(r._sum.total || 0),
    0
  );

  return resultados
    .map((resultado) => {
      const vendedor = vendedores.find((v) => v.id === resultado.userId);
      const totalRecaudado = Number(resultado._sum.total) || 0;

      return {
        vendedorId: resultado.userId,
        nombreVendedor: vendedor
          ? `${vendedor.nombre} ${vendedor.apellido}`
          : "Vendedor no encontrado",
        totalVentas: resultado._count,
        totalRecaudado,
        totalPasajes: resultado._sum.cantidadPasajes || 0,
        porcentaje:
          totalGeneral > 0 ? (totalRecaudado / totalGeneral) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalRecaudado - a.totalRecaudado);
}

// Obtener reporte por método de pago
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
    (sum, r) => sum + Number(r._sum.total || 0),
    0
  );

  return resultados
    .map((resultado) => {
      const totalRecaudado = Number(resultado._sum.total) || 0;

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

// Obtener reporte por fecha
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

  // Agrupar por fecha
  const ventasPorFecha = ventas.reduce((acc, venta) => {
    const fecha = format(new Date(venta.fechaVenta), "yyyy-MM-dd");

    if (!acc[fecha]) {
      acc[fecha] = {
        totalVentas: 0,
        totalRecaudado: 0,
        totalPasajes: 0,
      };
    }

    acc[fecha].totalVentas += 1;
    acc[fecha].totalRecaudado += Number(venta.total);
    acc[fecha].totalPasajes += venta.cantidadPasajes;

    return acc;
  }, {} as Record<string, { totalVentas: number; totalRecaudado: number; totalPasajes: number }>);

  return Object.entries(ventasPorFecha)
    .map(([fecha, datos]) => ({
      fecha,
      ...datos,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Generar reporte diario automático
export async function generarReporteDiario(
  fechaParam?: string
): Promise<ReporteDiario> {
  // Si no se proporciona fecha, usar hoy en Perú
  let fechaConsulta: string;

  if (fechaParam) {
    fechaConsulta = fechaParam;
  } else {
    // Obtener fecha actual en Perú
    const fechaEnPeru = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    fechaConsulta = format(fechaEnPeru, "yyyy-MM-dd");
  }

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

// Obtener ventas del día con detalles
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
    total: Number(venta.total),
    metodoPago: venta.metodoPago,
    tipoPago: venta.tipoPago,
    estado: venta.estado,
    fechaVenta: venta.fechaVenta.toISOString(),
  }));
}

// Obtener opciones para filtros
export async function obtenerOpcionesReporte(): Promise<OpcionesReporte> {
  const [rutas, embarcaciones, vendedores] = await Promise.all([
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
  ]);

  // Obtener métodos de pago únicos
  const metodosPagoUnicos = await prisma.venta.findMany({
    select: { metodoPago: true },
    distinct: ["metodoPago"],
  });

  // Obtener tipos de pago únicos
  const tiposPagoUnicos = await prisma.venta.findMany({
    select: { tipoPago: true },
    distinct: ["tipoPago"],
  });

  return {
    rutas: rutas.map((r) => ({ value: r.id, label: r.nombre })),
    embarcaciones: embarcaciones.map((e) => ({ value: e.id, label: e.nombre })),
    vendedores: vendedores.map((v) => ({
      value: v.id,
      label: `${v.nombre} ${v.apellido}`,
    })),
    metodosPago: metodosPagoUnicos.map((m) => ({
      value: m.metodoPago,
      label: m.metodoPago,
    })),
    tiposPago: tiposPagoUnicos.map((t) => ({
      value: t.tipoPago,
      label: t.tipoPago,
    })),
  };
}

// Obtener estadísticas rápidas para dashboard
export async function obtenerEstadisticasRapidas() {
  // Obtener fecha actual en Perú
  const fechaEnPeru = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
  );

  const hoy = fechaEnPeru;
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  // Rango del día actual en Perú
  const inicioHoy = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    0,
    0,
    0,
    0
  );
  const finHoy = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23,
    59,
    59,
    999
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
        lte: hoy,
      },
      estado: "CONFIRMADA",
    }),
    obtenerReportePorRuta({
      fechaVenta: {
        gte: inicioMes,
        lte: hoy,
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
