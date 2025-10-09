// src/app/api/dashboard/estadisticas-clientes/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEstadisticasClientes } from "@/lib/actions/estadisticas"; // ← Nueva función

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const estadisticas = await getEstadisticasClientes();
    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas clientes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
