// src/app/api/ventas/estadisticas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEstadisticasVentas } from "@/lib/actions/ventas";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const estadisticas = await getEstadisticasVentas();
    return NextResponse.json(estadisticas);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error obteniendo estadísticas de ventas:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
