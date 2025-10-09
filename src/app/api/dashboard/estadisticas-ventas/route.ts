// src/app/api/dashboard/estadisticas-ventas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEstadisticasVentas } from "@/lib/actions/estadisticas"; // ← Nueva función

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const estadisticas = await getEstadisticasVentas();
    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas dashboard:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
