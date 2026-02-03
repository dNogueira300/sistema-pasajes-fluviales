// app/api/rutas/validar-nombre/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Validar si existe una ruta con el mismo nombre
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("nombre");
    const rutaId = searchParams.get("rutaId"); // ID de la ruta actual (para edición)

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar que no exista una ruta con el mismo nombre
    const rutaExistente = await prisma.ruta.findFirst({
      where: {
        AND: [
          {
            nombre: {
              equals: nombre.trim(),
              mode: "insensitive",
            },
          },
          // Si se proporciona rutaId, excluir esa ruta (para el caso de edición)
          ...(rutaId
            ? [
                {
                  id: {
                    not: rutaId,
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (rutaExistente) {
      return NextResponse.json({
        existe: true,
        ruta: rutaExistente,
        mensaje: `Ya existe una ruta con el nombre "${nombre.trim()}"`,
      });
    }

    return NextResponse.json({
      existe: false,
      mensaje: "El nombre está disponible",
    });
  } catch (error) {
    console.error("Error validando nombre:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
