// app/api/embarcacion-rutas/route.ts - Actualizado con validaciones
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Crear nueva asignación con validación mejorada
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { embarcacionId, rutaId, horasSalida, diasOperacion, activa } = body;

    // Validaciones básicas
    if (!embarcacionId || !rutaId) {
      return NextResponse.json(
        { error: "Embarcación y ruta son requeridos" },
        { status: 400 }
      );
    }

    if (
      !horasSalida ||
      !Array.isArray(horasSalida) ||
      horasSalida.length === 0
    ) {
      return NextResponse.json(
        { error: "Al menos una hora de salida es requerida" },
        { status: 400 }
      );
    }

    if (
      !diasOperacion ||
      !Array.isArray(diasOperacion) ||
      diasOperacion.length === 0
    ) {
      return NextResponse.json(
        { error: "Al menos un día de operación es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la embarcación existe y está activa
    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id: embarcacionId },
    });

    if (!embarcacion) {
      return NextResponse.json(
        { error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    if (embarcacion.estado !== "ACTIVA") {
      return NextResponse.json(
        {
          error: "Embarcación no disponible",
          detalles: `La embarcación "${embarcacion.nombre}" está en estado: ${embarcacion.estado} y no se puede asignar`,
        },
        { status: 400 }
      );
    }

    // Verificar que la ruta existe y está activa
    const ruta = await prisma.ruta.findUnique({
      where: { id: rutaId },
    });

    if (!ruta) {
      return NextResponse.json(
        { error: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    // VALIDACIÓN CLAVE: Verificar que no exista ya esta asignación activa
    const asignacionExistente = await prisma.embarcacionRuta.findFirst({
      where: {
        embarcacionId,
        rutaId,
        activa: true,
      },
    });

    if (asignacionExistente) {
      return NextResponse.json(
        {
          error: "Asignación duplicada",
          detalles: `La embarcación "${embarcacion.nombre}" ya está asignada a la ruta "${ruta.nombre}"`,
        },
        { status: 400 }
      );
    }

    // NOTA: Una embarcación PUEDE tener múltiples rutas asignadas
    // Esto permite manejar rutas intermedias (ej: Iquitos → Pucallpa con paradas intermedias)
    // Solo validamos que no exista la misma combinación embarcación-ruta

    // Si todas las validaciones pasan, crear la asignación
    const embarcacionRuta = await prisma.embarcacionRuta.create({
      data: {
        embarcacionId,
        rutaId,
        horasSalida,
        diasOperacion,
        activa: activa !== undefined ? activa : true,
      },
      include: {
        embarcacion: true,
        ruta: true,
      },
    });

    return NextResponse.json(embarcacionRuta, { status: 201 });
  } catch (error) {
    console.error("Error creando asignación embarcación-ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
