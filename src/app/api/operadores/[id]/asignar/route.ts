import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/middleware/auth";
import { asignarEmbarcacionSchema } from "@/lib/validations/operador";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/operadores/:id/asignar - Asignar embarcación a operador
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMINISTRADOR"]);

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = asignarEmbarcacionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { embarcacionId } = parsed.data;

    // Verificar que el operador existe
    const operador = await prisma.user.findFirst({
      where: { id, role: "OPERADOR_EMBARCACION" },
    });

    if (!operador) {
      return NextResponse.json(
        { success: false, error: "Operador no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la embarcación existe
    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id: embarcacionId },
    });

    if (!embarcacion) {
      return NextResponse.json(
        { success: false, error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no tenga otro operador ACTIVO asignado
    const operadorActivo = await prisma.user.findFirst({
      where: {
        embarcacionAsignadaId: embarcacionId,
        estadoOperador: "ACTIVO",
        role: "OPERADOR_EMBARCACION",
        id: { not: id },
      },
    });

    if (operadorActivo) {
      return NextResponse.json(
        { success: false, error: "La embarcación ya tiene un operador activo asignado" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        embarcacionAsignadaId: embarcacionId,
        fechaAsignacion: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellido: true,
        role: true,
        activo: true,
        estadoOperador: true,
        embarcacionAsignadaId: true,
        fechaAsignacion: true,
        embarcacionAsignada: {
          select: {
            id: true,
            nombre: true,
            capacidad: true,
            estado: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Embarcación asignada exitosamente",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Rol no autorizado") {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }
    console.error("Error al asignar embarcación:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
