import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOperadorActivo } from "@/lib/middleware/auth";
import { actualizarEstadoEmbarqueSchema } from "@/lib/validations/controlEmbarque";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/control-embarque/:id/estado - Actualizar estado de embarque
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const operador = await requireOperadorActivo();
    const { id } = await params;

    const body: unknown = await request.json();
    const parsed = actualizarEstadoEmbarqueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { estadoEmbarque, observaciones } = parsed.data;

    // Verificar que el control existe
    const control = await prisma.controlEmbarque.findUnique({
      where: { id },
      select: {
        id: true,
        operadorId: true,
        embarcacionId: true,
        fechaViaje: true,
        estadoEmbarque: true,
      },
    });

    if (!control) {
      return NextResponse.json(
        { success: false, error: "Registro de embarque no encontrado" },
        { status: 404 }
      );
    }

    // Validar que el operador controla esta embarcación
    if (control.embarcacionId !== operador.embarcacionAsignadaId) {
      return NextResponse.json(
        { success: false, error: "No tiene permisos para esta embarcación" },
        { status: 403 }
      );
    }

    // Validar que la fecha de viaje no ha pasado
    const ahora = new Date();
    const fechaViaje = new Date(control.fechaViaje);
    fechaViaje.setHours(23, 59, 59, 999);
    if (fechaViaje < ahora) {
      return NextResponse.json(
        { success: false, error: "No se puede modificar un viaje pasado" },
        { status: 400 }
      );
    }

    // Validar que el estado sea diferente al actual
    if (control.estadoEmbarque === estadoEmbarque) {
      return NextResponse.json(
        { success: false, error: `El pasajero ya está marcado como ${estadoEmbarque}` },
        { status: 400 }
      );
    }

    const updated = await prisma.controlEmbarque.update({
      where: { id },
      data: {
        estadoEmbarque,
        horaRegistro: new Date(),
        observaciones: observaciones || null,
      },
      select: {
        id: true,
        ventaId: true,
        estadoEmbarque: true,
        horaRegistro: true,
        observaciones: true,
        venta: {
          select: {
            numeroVenta: true,
            cliente: {
              select: {
                nombre: true,
                apellido: true,
                dni: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Estado actualizado a ${estadoEmbarque}`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "No autorizado") {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
      }
      if (
        error.message === "Usuario no es operador" ||
        error.message === "Operador inactivo" ||
        error.message === "Operador sin embarcación asignada"
      ) {
        return NextResponse.json({ success: false, error: error.message }, { status: 403 });
      }
    }
    console.error("Error al actualizar estado de embarque:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
