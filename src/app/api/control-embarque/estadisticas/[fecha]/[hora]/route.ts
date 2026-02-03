import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOperadorActivo } from "@/lib/middleware/auth";

interface RouteParams {
  params: Promise<{ fecha: string; hora: string }>;
}

// GET /api/control-embarque/estadisticas/:fecha/:hora
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const operador = await requireOperadorActivo();
    const { fecha, hora } = await params;

    // Validar formato de fecha y crear rango para el día
    const [year, month, day] = fecha.split("-").map(Number);
    if (!year || !month || !day) {
      return NextResponse.json(
        { success: false, error: "Formato de fecha inválido. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);
    const fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);

    const horaDecoded = decodeURIComponent(hora);
    if (!/^\d{2}:\d{2}$/.test(horaDecoded)) {
      return NextResponse.json(
        { success: false, error: "Formato de hora inválido. Use HH:MM" },
        { status: 400 }
      );
    }

    const embarcacionId = operador.embarcacionAsignadaId!;

    // Obtener embarcación para la capacidad
    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id: embarcacionId },
      select: { capacidad: true, nombre: true },
    });

    if (!embarcacion) {
      return NextResponse.json(
        { success: false, error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    // Contar por estado
    const controles = await prisma.controlEmbarque.findMany({
      where: {
        embarcacionId,
        fechaViaje: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        horaViaje: horaDecoded,
      },
      select: {
        estadoEmbarque: true,
      },
    });

    const total = controles.length;
    const embarcados = controles.filter((c) => c.estadoEmbarque === "EMBARCADO").length;
    const pendientes = controles.filter((c) => c.estadoEmbarque === "PENDIENTE").length;
    const noEmbarcados = controles.filter((c) => c.estadoEmbarque === "NO_EMBARCADO").length;
    const porcentajeEmbarcados = total > 0 ? Math.round((embarcados / total) * 100) : 0;
    const capacidadDisponible = embarcacion.capacidad - embarcados;

    return NextResponse.json({
      success: true,
      data: {
        total,
        embarcados,
        pendientes,
        noEmbarcados,
        porcentajeEmbarcados,
        capacidadDisponible,
        embarcacion: embarcacion.nombre,
        capacidadTotal: embarcacion.capacidad,
      },
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
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
