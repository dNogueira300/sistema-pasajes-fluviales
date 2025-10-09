// app/api/reportes/estadisticas-rapidas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerEstadisticasRapidas } from "@/lib/actions/reportes";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const estadisticas = await obtenerEstadisticasRapidas();

    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas rápidas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
