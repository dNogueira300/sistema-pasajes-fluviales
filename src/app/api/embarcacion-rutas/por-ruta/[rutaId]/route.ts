// app/api/embarcacion-rutas/por-ruta/[rutaId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rutaId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { rutaId } = await params;

    const embarcacionRutas = await prisma.embarcacionRuta.findMany({
      where: {
        rutaId,
        activa: true,
      },
      include: {
        embarcacion: true,
      },
      orderBy: {
        embarcacion: {
          nombre: "asc",
        },
      },
    });

    return NextResponse.json(embarcacionRutas);
  } catch (error) {
    console.error("Error obteniendo embarcaciones de la ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
