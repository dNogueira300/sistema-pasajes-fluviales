// app/api/rutas/activas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todas las rutas activas con sus embarcaciones relacionadas
    const rutas = await prisma.ruta.findMany({
      where: {
        activa: true,
      },
      orderBy: [
        { nombre: "asc" }, // Ordenar alfabéticamente por nombre
      ],
      include: {
        // Include the actual embarcacionRutas relationship data
        embarcacionRutas: {
          where: {
            activa: true, // Solo incluir relaciones activas
          },
          include: {
            embarcacion: {
              select: {
                id: true,
                nombre: true,
                capacidad: true,
                estado: true,
              },
            },
          },
        },
        // Keep the counts if you need them elsewhere
        _count: {
          select: {
            ventas: true,
            embarcacionRutas: true,
          },
        },
      },
    });

    // Optionally filter out routes that have no active embarcations
    const rutasConEmbarcaciones = rutas.filter(
      (ruta) => ruta.embarcacionRutas.length > 0
    );

    return NextResponse.json(rutasConEmbarcaciones);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error obteniendo rutas activas:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
