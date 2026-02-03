import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/middleware/auth";
import { actualizarOperadorSchema } from "@/lib/validations/operador";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/operadores/:id - Obtener operador por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMINISTRADOR"]);

    const { id } = await params;

    const operador = await prisma.user.findFirst({
      where: { id, role: "OPERADOR_EMBARCACION" },
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
        createdAt: true,
        updatedAt: true,
        embarcacionAsignada: {
          select: {
            id: true,
            nombre: true,
            capacidad: true,
            estado: true,
            tipo: true,
          },
        },
        _count: {
          select: { controlesEmbarque: true },
        },
      },
    });

    if (!operador) {
      return NextResponse.json(
        { success: false, error: "Operador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: operador });
  } catch (error) {
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Rol no autorizado") {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }
    console.error("Error al obtener operador:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/operadores/:id - Actualizar operador
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMINISTRADOR"]);

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = actualizarOperadorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verificar que el operador existe
    const existing = await prisma.user.findFirst({
      where: { id, role: "OPERADOR_EMBARCACION" },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Operador no encontrado" },
        { status: 404 }
      );
    }

    const { email, nombre, apellido } = parsed.data;

    // Si cambia el email, validar unicidad
    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "El email ya está registrado" },
          { status: 400 }
        );
      }
    }

    const dataToUpdate: { nombre?: string; apellido?: string; email?: string } = {};
    if (nombre) dataToUpdate.nombre = nombre;
    if (apellido) dataToUpdate.apellido = apellido;
    if (email) dataToUpdate.email = email;

    const operador = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
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
        createdAt: true,
        updatedAt: true,
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
      data: operador,
      message: "Operador actualizado exitosamente",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Rol no autorizado") {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }
    console.error("Error al actualizar operador:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
