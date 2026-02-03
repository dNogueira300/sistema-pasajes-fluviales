import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOperadorActivo } from "@/lib/middleware/auth";

interface RouteParams {
  params: Promise<{ fecha: string; hora: string }>;
}

interface PasajeroReporte {
  numero: number;
  nombreCliente: string;
  dni: string;
  numeroVenta: string;
  cantidadPasajes: number;
  estado: string;
  horaRegistro: string;
}

// GET /api/control-embarque/reporte/:fecha/:hora - Generar datos para reporte PDF
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

    // Obtener embarcación
    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id: embarcacionId },
      select: { nombre: true, capacidad: true },
    });

    if (!embarcacion) {
      return NextResponse.json(
        { success: false, error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    // Obtener controles con datos completos
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
        id: true,
        estadoEmbarque: true,
        horaRegistro: true,
        venta: {
          select: {
            numeroVenta: true,
            cantidadPasajes: true,
            cliente: {
              select: {
                nombre: true,
                apellido: true,
                dni: true,
              },
            },
          },
        },
        ruta: {
          select: {
            nombre: true,
            puertoOrigen: true,
            puertoDestino: true,
          },
        },
      },
      orderBy: [{ estadoEmbarque: "asc" }],
    });

    // Estadísticas
    const total = controles.length;
    const embarcados = controles.filter((c) => c.estadoEmbarque === "EMBARCADO").length;
    const pendientes = controles.filter((c) => c.estadoEmbarque === "PENDIENTE").length;
    const noEmbarcados = controles.filter((c) => c.estadoEmbarque === "NO_EMBARCADO").length;

    // Formatear datos para el reporte
    const pasajeros: PasajeroReporte[] = controles.map((c, index) => ({
      numero: index + 1,
      nombreCliente: `${c.venta.cliente.apellido}, ${c.venta.cliente.nombre}`,
      dni: c.venta.cliente.dni,
      numeroVenta: c.venta.numeroVenta,
      cantidadPasajes: c.venta.cantidadPasajes,
      estado: c.estadoEmbarque,
      horaRegistro: c.horaRegistro
        ? new Date(c.horaRegistro).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
    }));

    const ruta = controles[0]?.ruta;

    const reporte = {
      titulo: "LISTA DE EMBARQUE",
      viaje: {
        embarcacion: embarcacion.nombre,
        ruta: ruta ? `${ruta.puertoOrigen} → ${ruta.puertoDestino}` : "N/A",
        rutaNombre: ruta?.nombre || "N/A",
        fecha,
        hora: horaDecoded,
      },
      pasajeros,
      estadisticas: {
        total,
        embarcados,
        pendientes,
        noEmbarcados,
        capacidadEmbarcacion: embarcacion.capacidad,
        capacidadDisponible: embarcacion.capacidad - embarcados,
      },
      operador: `${operador.nombre} ${operador.apellido}`,
      fechaGeneracion: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: reporte });
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
    console.error("Error al generar reporte:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
