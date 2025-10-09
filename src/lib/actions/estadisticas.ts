// lib/actions/estadisticas.ts - VERSIÓN ULTRA OPTIMIZADA
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  subMonths,
} from "date-fns";

interface StatsVentas {
  total_ventas: number;
  ventas_hoy: number;
  ventas_confirmadas: number;
  ventas_anuladas: number;
  ventas_reembolsadas: number;
  total_recaudado: number;
  ventas_mes_actual: number;
  ventas_mes_anterior: number;
}

interface VentasPorDia {
  fecha: string;
  ventas: number;
  ingresos: number;
}

interface VentasPorMes {
  mes: string;
  ventas: number;
  ingresos: number;
}

interface RutasVendidas {
  ruta: string;
  ventas: number;
  ingresos: number;
}

interface VentasPorEstado {
  estado: string;
  cantidad: number;
}

export async function getEstadisticasVentas() {
  const hoy = new Date();
  const inicioDia = startOfDay(hoy);
  const finDia = endOfDay(hoy);
  const inicioMesActual = startOfMonth(hoy);
  const inicioMesAnterior = startOfMonth(subMonths(hoy, 1));
  const hace6Meses = startOfMonth(subMonths(hoy, 5));
  const hace7Dias = startOfDay(subDays(hoy, 6));

  try {
    // EJECUTAR TODAS LAS CONSULTAS EN PARALELO
    const [
      statsResult,
      ventasPorDiaResult,
      ventasPorMesResult,
      rutasMasVendidasResult,
    ] = await Promise.all([
      // Query 1: Estadísticas principales
      prisma.$queryRaw<StatsVentas[]>`
        SELECT 
          COUNT(*)::int as total_ventas,
          COUNT(CASE WHEN "fechaVenta" >= ${inicioDia} AND "fechaVenta" <= ${finDia} THEN 1 END)::int as ventas_hoy,
          COUNT(CASE WHEN estado = 'CONFIRMADA' THEN 1 END)::int as ventas_confirmadas,
          COUNT(CASE WHEN estado = 'ANULADA' THEN 1 END)::int as ventas_anuladas,
          COUNT(CASE WHEN estado = 'REEMBOLSADA' THEN 1 END)::int as ventas_reembolsadas,
          COALESCE(SUM(CASE WHEN estado = 'CONFIRMADA' THEN total ELSE 0 END), 0)::numeric as total_recaudado,
          COUNT(CASE WHEN "fechaVenta" >= ${inicioMesActual} AND estado = 'CONFIRMADA' THEN 1 END)::int as ventas_mes_actual,
          COUNT(CASE WHEN "fechaVenta" >= ${inicioMesAnterior} AND "fechaVenta" < ${inicioMesActual} AND estado = 'CONFIRMADA' THEN 1 END)::int as ventas_mes_anterior
        FROM ventas
      `,

      // Query 2: Ventas por día (últimos 7 días) - CON GENERATE_SERIES
      prisma.$queryRaw<VentasPorDia[]>`
        WITH dias AS (
          SELECT generate_series(
            ${hace7Dias}::timestamp,
            ${hoy}::timestamp,
            '1 day'::interval
          )::date as fecha
        )
        SELECT 
          TO_CHAR(dias.fecha, 'Dy') as fecha,
          COALESCE(COUNT(v.id), 0)::int as ventas,
          COALESCE(SUM(CASE WHEN v.estado = 'CONFIRMADA' THEN v.total ELSE 0 END), 0)::numeric as ingresos
        FROM dias
        LEFT JOIN ventas v ON DATE(v."fechaVenta") = dias.fecha
        GROUP BY dias.fecha
        ORDER BY dias.fecha ASC
      `,

      // Query 3: Ventas por mes (últimos 6 meses) - CON GENERATE_SERIES
      prisma.$queryRaw<VentasPorMes[]>`
        WITH meses AS (
          SELECT generate_series(
            ${hace6Meses}::timestamp,
            ${hoy}::timestamp,
            '1 month'::interval
          )::date as mes
        )
        SELECT 
          TO_CHAR(meses.mes, 'Mon') as mes,
          COALESCE(COUNT(v.id), 0)::int as ventas,
          COALESCE(SUM(CASE WHEN v.estado = 'CONFIRMADA' THEN v.total ELSE 0 END), 0)::numeric as ingresos
        FROM meses
        LEFT JOIN ventas v ON DATE_TRUNC('month', v."fechaVenta") = DATE_TRUNC('month', meses.mes::timestamp)
        GROUP BY meses.mes
        ORDER BY meses.mes ASC
      `,

      // Query 4: Rutas más vendidas con JOIN
      prisma.$queryRaw<RutasVendidas[]>`
        SELECT 
          r.nombre as ruta,
          COUNT(v.id)::int as ventas,
          COALESCE(SUM(v.total), 0)::numeric as ingresos
        FROM ventas v
        INNER JOIN rutas r ON v."rutaId" = r.id
        WHERE v.estado = 'CONFIRMADA'
        GROUP BY r.id, r.nombre
        ORDER BY ventas DESC
        LIMIT 5
      `,
    ]);

    const stats = statsResult[0];
    const cambio =
      stats.ventas_mes_anterior > 0
        ? ((stats.ventas_mes_actual - stats.ventas_mes_anterior) /
            stats.ventas_mes_anterior) *
          100
        : 0;

    // Procesar resultados (ya vienen formateados desde SQL)
    const ventasPorDia = ventasPorDiaResult.map((v) => ({
      fecha: v.fecha.trim().substring(0, 3), // Primeras 3 letras del día
      ventas: v.ventas,
      ingresos: Number(v.ingresos),
    }));

    const ventasPorMes = ventasPorMesResult.map((v) => ({
      mes: v.mes.trim(),
      ventas: v.ventas,
      ingresos: Number(v.ingresos),
    }));

    const rutasMasVendidas = rutasMasVendidasResult.map((r) => ({
      ruta: r.ruta,
      ventas: r.ventas,
      ingresos: Number(r.ingresos),
    }));

    const ventasPorEstado: VentasPorEstado[] = [
      { estado: "Confirmadas", cantidad: stats.ventas_confirmadas },
      { estado: "Anuladas", cantidad: stats.ventas_anuladas },
      { estado: "Reembolsadas", cantidad: stats.ventas_reembolsadas },
    ];

    return {
      totalVentas: stats.total_ventas,
      ventasHoy: stats.ventas_hoy,
      ventasConfirmadas: stats.ventas_confirmadas,
      ventasAnuladas: stats.ventas_anuladas,
      ventasReembolsadas: stats.ventas_reembolsadas,
      totalRecaudado: Number(stats.total_recaudado),
      ventasPorDia,
      ventasPorMes,
      ventasPorEstado,
      rutasMasVendidas,
      tendenciaVentas: {
        actual: stats.ventas_mes_actual,
        anterior: stats.ventas_mes_anterior,
        cambio: Number(cambio.toFixed(1)),
      },
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de ventas:", error);
    throw new Error("Error al cargar estadísticas de ventas");
  }
}

export async function getEstadisticasClientes() {
  try {
    const hace30Dias = subDays(new Date(), 30);

    const stats = await prisma.$queryRaw<
      {
        total_clientes: number;
        clientes_con_ventas: number;
        clientes_recientes: number;
      }[]
    >`
      SELECT 
        COUNT(*)::int as total_clientes,
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM ventas v 
          WHERE v."clienteId" = clientes.id 
          AND v.estado = 'CONFIRMADA'
        ) THEN 1 END)::int as clientes_con_ventas,
        COUNT(CASE WHEN "createdAt" >= ${hace30Dias} THEN 1 END)::int as clientes_recientes
      FROM clientes
    `;

    const statsData = stats[0];

    return {
      totalClientes: statsData.total_clientes,
      clientesConVentas: statsData.clientes_con_ventas,
      clientesSinVentas:
        statsData.total_clientes - statsData.clientes_con_ventas,
      clientesRecientes: statsData.clientes_recientes,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de clientes:", error);
    throw new Error("Error al cargar estadísticas de clientes");
  }
}
