// app/api/reportes/diario/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generarReporteDiario } from "@/lib/actions/reportes";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");

    const fecha = fechaParam ? new Date(fechaParam) : new Date();

    const reporte = await generarReporteDiario(fecha);

    return NextResponse.json(reporte);
  } catch (error) {
    console.error("Error generando reporte diario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
