import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRutasActivas } from "@/lib/actions/ventas";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rutas = await getRutasActivas();
    return NextResponse.json(rutas);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error obteniendo rutas activas:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
