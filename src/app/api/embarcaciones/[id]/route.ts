// app/api/embarcaciones/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET - Obtener embarcación por ID
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

    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ventas: true,
            embarcacionRutas: true,
          },
        },
      },
    });

    if (!embarcacion) {
      return NextResponse.json(
        { error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(embarcacion);
  } catch (error) {
    console.error("Error obteniendo embarcación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar embarcación
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
    const { nombre, capacidad, estado, tipo } = body;

    // Verificar que la embarcación existe
    const embarcacionExistente = await prisma.embarcacion.findUnique({
      where: { id },
    });

    if (!embarcacionExistente) {
      return NextResponse.json(
        { error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    // Si se está actualizando el nombre, verificar que no exista otra embarcación con el mismo nombre
    if (nombre && nombre.trim() !== embarcacionExistente.nombre) {
      const embarcacionConMismoNombre = await prisma.embarcacion.findFirst({
        where: {
          nombre: {
            equals: nombre.trim(),
            mode: "insensitive",
          },
          id: {
            not: id,
          },
        },
      });

      if (embarcacionConMismoNombre) {
        return NextResponse.json(
          { error: "Ya existe una embarcación con este nombre" },
          { status: 400 }
        );
      }
    }

    // Validaciones de datos
    if (nombre !== undefined && !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre de la embarcación no puede estar vacío" },
        { status: 400 }
      );
    }

    if (capacidad !== undefined && capacidad <= 0) {
      return NextResponse.json(
        { error: "La capacidad debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (capacidad !== undefined && capacidad > 500) {
      return NextResponse.json(
        { error: "La capacidad no puede ser mayor a 500 pasajeros" },
        { status: 400 }
      );
    }

    if (estado && !["ACTIVA", "MANTENIMIENTO", "INACTIVA"].includes(estado)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    // Preparar datos de actualización con tipos explícitos de Prisma
    const datosActualizados: Prisma.EmbarcacionUpdateInput = {};

    if (nombre !== undefined) {
      datosActualizados.nombre = nombre.trim();
    }
    if (capacidad !== undefined) {
      datosActualizados.capacidad = parseInt(capacidad);
    }
    if (estado !== undefined) {
      datosActualizados.estado = estado;
    }
    if (tipo !== undefined) {
      datosActualizados.tipo = tipo?.trim() || null;
    }

    const embarcacion = await prisma.embarcacion.update({
      where: { id },
      data: datosActualizados,
      include: {
        _count: {
          select: {
            ventas: true,
            embarcacionRutas: true,
          },
        },
      },
    });

    return NextResponse.json(embarcacion);
  } catch (error: unknown) {
    console.error("Error actualizando embarcación:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una embarcación con ese nombre" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar embarcación
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

    // Verificar que la embarcación existe
    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ventas: true,
            embarcacionRutas: true,
          },
        },
      },
    });

    if (!embarcacion) {
      return NextResponse.json(
        { error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no tenga ventas o rutas asociadas
    if (embarcacion._count.ventas > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la embarcación porque tiene ${embarcacion._count.ventas} ventas asociadas. Puede cambiar su estado a inactiva en su lugar.`,
        },
        { status: 400 }
      );
    }

    if (embarcacion._count.embarcacionRutas > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la embarcación porque tiene ${embarcacion._count.embarcacionRutas} rutas asignadas. Puede cambiar su estado a inactiva en su lugar.`,
        },
        { status: 400 }
      );
    }

    await prisma.embarcacion.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Embarcación eliminada exitosamente",
      embarcacion: {
        id: embarcacion.id,
        nombre: embarcacion.nombre,
      },
    });
  } catch (error) {
    console.error("Error eliminando embarcación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
