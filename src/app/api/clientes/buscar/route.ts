import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarClientePorDNI } from "@/lib/actions/ventas";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");

    if (!dni) {
      return NextResponse.json({ error: "DNI es requerido" }, { status: 400 });
    }

    const cliente = await buscarClientePorDNI(dni);

    if (!cliente) {
      return NextResponse.json(null);
    }

    return NextResponse.json(cliente);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error buscando cliente:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
