// app/api/embarcacion-rutas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET - Obtener asignación por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const embarcacionRuta = await prisma.embarcacionRuta.findUnique({
      where: { id },
      include: {
        embarcacion: true,
        ruta: true,
      },
    });

    if (!embarcacionRuta) {
      return NextResponse.json(
        { error: "Asignación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(embarcacionRuta);
  } catch (error) {
    console.error("Error obteniendo asignación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar asignación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { horasSalida, diasOperacion, activa } = body;

    // Verificar que la asignación existe
    const asignacionExistente = await prisma.embarcacionRuta.findUnique({
      where: { id },
    });

    if (!asignacionExistente) {
      return NextResponse.json(
        { error: "Asignación no encontrada" },
        { status: 404 }
      );
    }

    // Validaciones
    if (
      horasSalida &&
      (!Array.isArray(horasSalida) || horasSalida.length === 0)
    ) {
      return NextResponse.json(
        { error: "Al menos una hora de salida es requerida" },
        { status: 400 }
      );
    }

    if (
      diasOperacion &&
      (!Array.isArray(diasOperacion) || diasOperacion.length === 0)
    ) {
      return NextResponse.json(
        { error: "Al menos un día de operación es requerido" },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const datosActualizados: Prisma.EmbarcacionRutaUpdateInput = {};

    if (horasSalida !== undefined) datosActualizados.horasSalida = horasSalida;
    if (diasOperacion !== undefined)
      datosActualizados.diasOperacion = diasOperacion;
    if (activa !== undefined) datosActualizados.activa = activa;

    const embarcacionRuta = await prisma.embarcacionRuta.update({
      where: { id },
      data: datosActualizados,
      include: {
        embarcacion: true,
        ruta: true,
      },
    });

    return NextResponse.json(embarcacionRuta);
  } catch (error) {
    console.error("Error actualizando asignación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar asignación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la asignación existe
    const asignacion = await prisma.embarcacionRuta.findUnique({
      where: { id },
      include: {
        embarcacion: true,
        ruta: true,
      },
    });

    if (!asignacion) {
      return NextResponse.json(
        { error: "Asignación no encontrada" },
        { status: 404 }
      );
    }

    // TODO: Verificar si tiene ventas asociadas antes de eliminar
    // Esto se podría implementar cuando se tenga el modelo de ventas completo

    await prisma.embarcacionRuta.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Asignación eliminada exitosamente",
      asignacion: {
        id: asignacion.id,
        embarcacion: asignacion.embarcacion.nombre,
        ruta: asignacion.ruta.nombre,
      },
    });
  } catch (error) {
    console.error("Error eliminando asignación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
