// app/api/embarcaciones/estadisticas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Ejecutar todas las consultas en paralelo para mejor rendimiento
    const [
      totalEmbarcaciones,
      embarcacionesActivas,
      embarcacionesMantenimiento,
      embarcacionesConVentas,
      capacidades,
    ] = await Promise.all([
      // Total de embarcaciones
      prisma.embarcacion.count(),

      // Embarcaciones activas
      prisma.embarcacion.count({
        where: { estado: "ACTIVA" },
      }),

      // Embarcaciones en mantenimiento
      prisma.embarcacion.count({
        where: { estado: "MANTENIMIENTO" },
      }),

      // Embarcaciones con ventas
      prisma.embarcacion.count({
        where: {
          ventas: {
            some: {},
          },
        },
      }),

      // Obtener capacidades para calcular totales y promedio
      prisma.embarcacion.findMany({
        select: {
          capacidad: true,
        },
      }),
    ]);

    const embarcacionesInactivas =
      totalEmbarcaciones - embarcacionesActivas - embarcacionesMantenimiento;

    // Calcular capacidad total y promedio
    const capacidadTotal = capacidades.reduce((sum, e) => sum + e.capacidad, 0);
    const capacidadPromedio =
      totalEmbarcaciones > 0
        ? Math.round(capacidadTotal / totalEmbarcaciones)
        : 0;

    const estadisticas = {
      totalEmbarcaciones,
      embarcacionesActivas,
      embarcacionesMantenimiento,
      embarcacionesInactivas,
      embarcacionesConVentas,
      capacidadTotal,
      capacidadPromedio,
    };

    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas de embarcaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
