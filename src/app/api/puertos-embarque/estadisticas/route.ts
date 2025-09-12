// app/api/puertos-embarque/estadisticas/route.ts
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
    const [totalPuertos, puertosActivos, puertosConVentas, puertosRecientes] =
      await Promise.all([
        // Total de puertos
        prisma.puertoEmbarque.count(),

        // Puertos activos
        prisma.puertoEmbarque.count({
          where: { activo: true },
        }),

        // Puertos con ventas
        prisma.puertoEmbarque.count({
          where: {
            ventas: {
              some: {},
            },
          },
        }),

        // Puertos creados en los últimos 30 días
        prisma.puertoEmbarque.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    const puertosInactivos = totalPuertos - puertosActivos;

    const estadisticas = {
      totalPuertos,
      puertosActivos,
      puertosInactivos,
      puertosConVentas,
      puertosRecientes,
    };

    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas de puertos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
