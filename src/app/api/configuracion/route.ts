// ============================================
// app/api/configuracion/route.ts
// ============================================
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getTodasConfiguraciones,
  actualizarVariasConfiguraciones,
} from "@/lib/actions/configuracion";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const configs = await getTodasConfiguraciones();
    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error obteniendo configuraciones:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    await actualizarVariasConfiguraciones(body);

    return NextResponse.json({
      message: "Configuración actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando configuraciones:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
