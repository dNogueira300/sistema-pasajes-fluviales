// app/api/reportes/opciones/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerOpcionesReporte } from "@/lib/actions/reportes";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const opciones = await obtenerOpcionesReporte();

    return NextResponse.json(opciones);
  } catch (error) {
    console.error("Error obteniendo opciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
