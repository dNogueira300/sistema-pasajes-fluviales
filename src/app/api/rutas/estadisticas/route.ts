// app/api/rutas/estadisticas/route.ts
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

    const [totalRutas, rutasActivas, rutasConVentas, rutasRecientes] =
      await Promise.all([
        // Total de rutas
        prisma.ruta.count(),

        // Rutas activas
        prisma.ruta.count({
          where: { activa: true },
        }),

        // Rutas con ventas
        prisma.ruta.count({
          where: {
            ventas: {
              some: {},
            },
          },
        }),

        // Rutas creadas en los últimos 30 días
        prisma.ruta.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    const rutasInactivas = totalRutas - rutasActivas;

    const estadisticas = {
      totalRutas,
      rutasActivas,
      rutasInactivas,
      rutasConVentas,
      rutasRecientes,
    };

    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas de rutas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
