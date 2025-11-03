// app/api/rutas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener ruta por ID
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

    const ruta = await prisma.ruta.findUnique({
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

    if (!ruta) {
      return NextResponse.json(
        { error: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(ruta);
  } catch (error) {
    console.error("Error obteniendo ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar ruta
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
    const { nombre, puertoOrigen, puertoDestino, precio, activa } = body;

    // Verificar que la ruta existe
    const rutaExistente = await prisma.ruta.findUnique({
      where: { id },
    });

    if (!rutaExistente) {
      return NextResponse.json(
        { error: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    // Si se está actualizando el nombre, verificar que no exista otra ruta con el mismo nombre
    if (nombre && nombre.trim() !== rutaExistente.nombre) {
      const rutaConMismoNombre = await prisma.ruta.findFirst({
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

      if (rutaConMismoNombre) {
        return NextResponse.json(
          { error: "Ya existe una ruta con este nombre" },
          { status: 400 }
        );
      }
    }

    // Validaciones de datos
    if (nombre !== undefined && !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre de la ruta no puede estar vacío" },
        { status: 400 }
      );
    }

    if (puertoOrigen !== undefined && !puertoOrigen.trim()) {
      return NextResponse.json(
        { error: "El puerto de origen no puede estar vacío" },
        { status: 400 }
      );
    }

    if (puertoDestino !== undefined && !puertoDestino.trim()) {
      return NextResponse.json(
        { error: "El puerto de destino no puede estar vacío" },
        { status: 400 }
      );
    }

    if (precio !== undefined && precio <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (precio !== undefined && precio > 1000) {
      return NextResponse.json(
        { error: "El precio no puede ser mayor a 1000 soles" },
        { status: 400 }
      );
    }

    // Validar puertos si se están actualizando
    const nuevoPuertoOrigen =
      puertoOrigen?.trim() || rutaExistente.puertoOrigen;
    const nuevoPuertoDestino =
      puertoDestino?.trim() || rutaExistente.puertoDestino;

    if (nuevoPuertoOrigen.toLowerCase() === nuevoPuertoDestino.toLowerCase()) {
      return NextResponse.json(
        {
          error: "El puerto de origen debe ser diferente al puerto de destino",
        },
        { status: 400 }
      );
    }

    // CRÍTICO: Verificar que no exista otra ruta con la misma combinación origen-destino
    const rutaConMismoTrayecto = await prisma.ruta.findFirst({
      where: {
        AND: [
          {
            puertoOrigen: {
              equals: nuevoPuertoOrigen,
              mode: "insensitive",
            },
          },
          {
            puertoDestino: {
              equals: nuevoPuertoDestino,
              mode: "insensitive",
            },
          },
          {
            id: {
              not: id,
            },
          },
        ],
      },
    });

    if (rutaConMismoTrayecto) {
      return NextResponse.json(
        {
          error: `Ya existe una ruta con origen "${nuevoPuertoOrigen}" y destino "${nuevoPuertoDestino}". No se permiten rutas duplicadas con el mismo trayecto.`,
        },
        { status: 400 }
      );
    }

    // Preparar datos de actualización con tipos explícitos de Prisma
    const datosActualizados: Prisma.RutaUpdateInput = {};

    if (nombre !== undefined) {
      datosActualizados.nombre = nombre.trim();
    }
    if (puertoOrigen !== undefined) {
      datosActualizados.puertoOrigen = puertoOrigen.trim();
    }
    if (puertoDestino !== undefined) {
      datosActualizados.puertoDestino = puertoDestino.trim();
    }
    if (precio !== undefined) {
      datosActualizados.precio = new Prisma.Decimal(precio);
    }
    if (activa !== undefined) {
      datosActualizados.activa = activa;
    }

    const ruta = await prisma.ruta.update({
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

    return NextResponse.json(ruta);
  } catch (error: unknown) {
    console.error("Error actualizando ruta:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una ruta con ese nombre" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar ruta
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

    // Verificar que la ruta existe
    const ruta = await prisma.ruta.findUnique({
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

    if (!ruta) {
      return NextResponse.json(
        { error: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no tenga ventas o embarcaciones asociadas
    if (ruta._count.ventas > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la ruta porque tiene ${ruta._count.ventas} ventas asociadas. Puede desactivarla en su lugar.`,
        },
        { status: 400 }
      );
    }

    if (ruta._count.embarcacionRutas > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la ruta porque tiene ${ruta._count.embarcacionRutas} embarcaciones asociadas. Puede desactivarla en su lugar.`,
        },
        { status: 400 }
      );
    }

    await prisma.ruta.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Ruta eliminada exitosamente",
      ruta: {
        id: ruta.id,
        nombre: ruta.nombre,
      },
    });
  } catch (error) {
    console.error("Error eliminando ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
