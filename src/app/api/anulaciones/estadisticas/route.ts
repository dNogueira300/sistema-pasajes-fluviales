import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEstadisticasAnulaciones } from "@/lib/actions/anulaciones";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "mes";

    // Si es vendedor, solo sus estadísticas
    const usuarioId =
      session.user.role === "VENDEDOR" ? session.user.id : undefined;

    const estadisticas = await getEstadisticasAnulaciones(periodo, usuarioId);
    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas de anulaciones:", error);
    return NextResponse.json({
      totalAnulaciones: 0,
      totalAnulacionesHoy: 0,
      totalReembolsos: 0,
      montoTotalReembolsado: 0,
      asientosTotalesLiberados: 0,
      motivosComunes: [],
      anulacionesPorDia: [],
      periodo: "mes",
    });
  }
}
