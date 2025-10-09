// src/app/api/ventas/disponibilidad/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  verificarDisponibilidad,
  validarDiaOperacion,
} from "@/lib/actions/ventas";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { embarcacionId, rutaId, fechaViaje, horaViaje, cantidadSolicitada } =
      body;

    console.log("🛡️ Datos recibidos en API:", {
      embarcacionId,
      rutaId,
      fechaViaje,
      horaViaje,
      cantidadSolicitada,
    });

    // Validar parámetros requeridos
    if (
      !embarcacionId ||
      !rutaId ||
      !fechaViaje ||
      !horaViaje ||
      !cantidadSolicitada
    ) {
      return NextResponse.json(
        { error: "Parámetros faltantes para verificar disponibilidad" },
        { status: 400 }
      );
    }

    // Validar que cantidadSolicitada es un número positivo
    if (typeof cantidadSolicitada !== "number" || cantidadSolicitada <= 0) {
      return NextResponse.json(
        { error: "La cantidad solicitada debe ser un número mayor a cero" },
        { status: 400 }
      );
    }

    let fechaViajeDate: Date;

    // Si fechaViaje es string (formato YYYY-MM-DD), crear fecha en zona horaria local
    if (typeof fechaViaje === "string") {
      const [year, month, day] = fechaViaje.split("-").map(Number);
      fechaViajeDate = new Date(year, month - 1, day);
    } else {
      fechaViajeDate = new Date(fechaViaje);
    }

    // Validar formato de fecha
    if (isNaN(fechaViajeDate.getTime())) {
      return NextResponse.json(
        { error: "Formato de fecha inválido" },
        { status: 400 }
      );
    }

    // Verificar que la fecha no sea en el pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaViajeDate.setHours(0, 0, 0, 0);

    if (fechaViajeDate < hoy) {
      return NextResponse.json(
        { error: "La fecha de viaje no puede ser anterior a hoy" },
        { status: 400 }
      );
    }

    // ⭐ NUEVO: Validar día de operación
    const validacionDia = await validarDiaOperacion(
      embarcacionId,
      rutaId,
      fechaViajeDate
    );

    if (!validacionDia.valido) {
      return NextResponse.json(
        {
          error: validacionDia.mensaje,
          diasOperativos: validacionDia.diasOperativos,
          puedeVender: false,
        },
        { status: 400 }
      );
    }

    // Verificar disponibilidad
    const disponibilidad = await verificarDisponibilidad(
      embarcacionId,
      rutaId,
      fechaViajeDate,
      horaViaje,
      cantidadSolicitada
    );

    console.log("✅ Disponibilidad calculada:", disponibilidad);

    // Incluir información de días operativos en la respuesta
    return NextResponse.json({
      ...disponibilidad,
      diasOperativos: validacionDia.diasOperativos,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";

    console.error("Error verificando disponibilidad:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Manejar errores específicos
    if (errorMessage.includes("no encontrada")) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    if (
      errorMessage.includes("no está activa") ||
      errorMessage.includes("no opera")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error al verificar disponibilidad de asientos" },
      { status: 500 }
    );
  }
}
