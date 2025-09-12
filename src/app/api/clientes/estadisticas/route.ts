// app/api/clientes/estadisticas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEstadisticasClientes } from "@/lib/actions/clientes";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const estadisticas = await getEstadisticasClientes();
    return NextResponse.json(estadisticas);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error obteniendo estadísticas de clientes:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
