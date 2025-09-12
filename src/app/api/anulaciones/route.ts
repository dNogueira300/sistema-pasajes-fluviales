import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnulaciones, crearAnulacion } from "@/lib/actions/anulaciones";
import { TipoAnulacion } from "@/types";

// GET - Obtener anulaciones con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const filtros = {
      fechaInicio: searchParams.get("fechaInicio"),
      fechaFin: searchParams.get("fechaFin"),
      tipoAnulacion: searchParams.get("tipoAnulacion") as TipoAnulacion | null,
      usuarioId:
        session.user.role === "VENDEDOR"
          ? session.user.id
          : searchParams.get("usuarioId"),
      busqueda: searchParams.get("busqueda"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await getAnulaciones(filtros);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error obteniendo anulaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva anulación con validación de fecha
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      ventaId,
      motivo,
      observaciones,
      tipoAnulacion = "ANULACION",
      montoReembolso,
    } = body;

    // Validaciones básicas
    if (!ventaId || !motivo) {
      return NextResponse.json(
        { error: "Venta ID y motivo son requeridos" },
        { status: 400 }
      );
    }

    const resultado = await crearAnulacion({
      ventaId,
      motivo,
      observaciones,
      usuarioId: session.user.id,
      tipoAnulacion,
      montoReembolso,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error creando anulación:", error);

    // Manejo específico del error de fecha pasada
    if (errorMessage.includes("ya pasó la fecha y hora del viaje")) {
      return NextResponse.json(
        {
          error: errorMessage,
          errorType: "FECHA_VIAJE_PASADA",
          title: "No se puede anular la venta",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
