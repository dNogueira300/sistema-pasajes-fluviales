import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verificarDisponibilidad } from "@/lib/actions/ventas";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { embarcacionId, rutaId, fechaViaje, horaViaje, cantidadSolicitada } =
      body;

    if (
      !embarcacionId ||
      !rutaId ||
      !fechaViaje ||
      !horaViaje ||
      !cantidadSolicitada
    ) {
      return NextResponse.json(
        { error: "Parámetros faltantes" },
        { status: 400 }
      );
    }

    const disponibilidad = await verificarDisponibilidad(
      embarcacionId,
      rutaId,
      new Date(fechaViaje),
      horaViaje,
      cantidadSolicitada
    );

    return NextResponse.json(disponibilidad);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error verificando disponibilidad:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
