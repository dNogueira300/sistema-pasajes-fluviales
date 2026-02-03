// app/api/embarcaciones/activas/route.ts
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

    // Obtener todas las embarcaciones activas ordenadas por nombre
    const embarcaciones = await prisma.embarcacion.findMany({
      where: {
        estado: "ACTIVA",
      },
      orderBy: [
        { nombre: "asc" }, // Ordenar alfabéticamente por nombre
      ],
      include: {
        _count: {
          select: {
            ventas: true,
            embarcacionRutas: true,
          },
        },
      },
    });

    return NextResponse.json(embarcaciones);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error obteniendo embarcaciones activas:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
