// app/api/puertos-embarque/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { actualizarPuertoSchema } from "@/lib/validations/puerto";

// GET - Obtener puerto por ID
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

    const puerto = await prisma.puertoEmbarque.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    if (!puerto) {
      return NextResponse.json(
        { error: "Puerto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(puerto);
  } catch (error) {
    console.error("Error obteniendo puerto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar puerto
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

    const validacion = actualizarPuertoSchema.safeParse(body);
    if (!validacion.success) {
      const primerError = validacion.error.issues[0];
      return NextResponse.json(
        { error: primerError.message },
        { status: 400 }
      );
    }

    const { nombre, descripcion, direccion, orden, activo } = validacion.data;

    // Verificar que el puerto existe
    const puertoExistente = await prisma.puertoEmbarque.findUnique({
      where: { id },
    });

    if (!puertoExistente) {
      return NextResponse.json(
        { error: "Puerto no encontrado" },
        { status: 404 }
      );
    }

    // Si se está actualizando el nombre, verificar que no exista otro puerto con el mismo nombre
    if (nombre && nombre !== puertoExistente.nombre) {
      const puertoConMismoNombre = await prisma.puertoEmbarque.findFirst({
        where: {
          nombre: {
            equals: nombre,
            mode: "insensitive",
          },
          id: {
            not: id,
          },
        },
      });

      if (puertoConMismoNombre) {
        return NextResponse.json(
          { error: "Ya existe un puerto con este nombre" },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización con tipos explícitos de Prisma
    const datosActualizados: Prisma.PuertoEmbarqueUpdateInput = {};

    if (nombre !== undefined) {
      datosActualizados.nombre = nombre;
    }
    if (descripcion !== undefined) {
      datosActualizados.descripcion = descripcion || null;
    }
    if (direccion !== undefined) {
      datosActualizados.direccion = direccion || null;
    }
    if (orden !== undefined) {
      datosActualizados.orden = orden;
    }
    if (activo !== undefined) {
      datosActualizados.activo = activo;
    }

    const puerto = await prisma.puertoEmbarque.update({
      where: { id },
      data: datosActualizados,
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    return NextResponse.json(puerto);
  } catch (error: unknown) {
    console.error("Error actualizando puerto:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un puerto con ese nombre" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar puerto
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

    // Verificar que el puerto existe
    const puerto = await prisma.puertoEmbarque.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    if (!puerto) {
      return NextResponse.json(
        { error: "Puerto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no tenga ventas asociadas
    if (puerto._count.ventas > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el puerto porque tiene ${puerto._count.ventas} ventas asociadas. Puede desactivarlo en su lugar.`,
        },
        { status: 400 }
      );
    }

    await prisma.puertoEmbarque.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Puerto eliminado exitosamente",
      puerto: {
        id: puerto.id,
        nombre: puerto.nombre,
      },
    });
  } catch (error) {
    console.error("Error eliminando puerto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
