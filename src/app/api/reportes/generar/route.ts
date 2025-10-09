// app/api/reportes/generar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generarReporteCompleto } from "@/lib/actions/reportes";
import { FiltrosReporte } from "@/types/reportes";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const filtros: FiltrosReporte = await request.json();

    // Validar filtros requeridos
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      return NextResponse.json(
        { error: "Las fechas de inicio y fin son requeridas" },
        { status: 400 }
      );
    }

    // Validar que la fecha de inicio no sea posterior a la fecha fin
    if (new Date(filtros.fechaInicio) > new Date(filtros.fechaFin)) {
      return NextResponse.json(
        { error: "La fecha de inicio no puede ser posterior a la fecha fin" },
        { status: 400 }
      );
    }

    const reporte = await generarReporteCompleto(filtros);

    return NextResponse.json(reporte);
  } catch (error) {
    console.error("Error generando reporte:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
