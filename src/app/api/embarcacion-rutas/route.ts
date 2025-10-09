// app/api/embarcacion-rutas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener asignaciones embarcación-ruta con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rutaId = searchParams.get("rutaId");
    const embarcacionId = searchParams.get("embarcacionId");
    const activa = searchParams.get("activa");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Prisma.EmbarcacionRutaWhereInput = {};

    if (rutaId) where.rutaId = rutaId;
    if (embarcacionId) where.embarcacionId = embarcacionId;
    if (activa !== null && activa !== undefined && activa !== "") {
      where.activa = activa === "true";
    }

    const skip = (page - 1) * limit;

    const [embarcacionRutas, total] = await Promise.all([
      prisma.embarcacionRuta.findMany({
        where,
        include: {
          embarcacion: true,
          ruta: true,
        },
        orderBy: [{ activa: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.embarcacionRuta.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      embarcacionRutas,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error("Error obteniendo asignaciones embarcación-ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva asignación embarcación-ruta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { embarcacionId, rutaId, horasSalida, diasOperacion, activa } = body;

    // Validaciones
    if (!embarcacionId || !rutaId) {
      return NextResponse.json(
        { error: "Embarcación y ruta son requeridos" },
        { status: 400 }
      );
    }

    if (
      !horasSalida ||
      !Array.isArray(horasSalida) ||
      horasSalida.length === 0
    ) {
      return NextResponse.json(
        { error: "Al menos una hora de salida es requerida" },
        { status: 400 }
      );
    }

    if (
      !diasOperacion ||
      !Array.isArray(diasOperacion) ||
      diasOperacion.length === 0
    ) {
      return NextResponse.json(
        { error: "Al menos un día de operación es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la embarcación existe y está activa
    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id: embarcacionId },
    });

    if (!embarcacion) {
      return NextResponse.json(
        { error: "Embarcación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la ruta existe y está activa
    const ruta = await prisma.ruta.findUnique({
      where: { id: rutaId },
    });

    if (!ruta) {
      return NextResponse.json(
        { error: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no exista ya esta asignación
    const asignacionExistente = await prisma.embarcacionRuta.findFirst({
      where: {
        embarcacionId,
        rutaId,
      },
    });

    if (asignacionExistente) {
      return NextResponse.json(
        { error: "Esta embarcación ya está asignada a esta ruta" },
        { status: 400 }
      );
    }

    const embarcacionRuta = await prisma.embarcacionRuta.create({
      data: {
        embarcacionId,
        rutaId,
        horasSalida,
        diasOperacion,
        activa: activa !== undefined ? activa : true,
      },
      include: {
        embarcacion: true,
        ruta: true,
      },
    });

    return NextResponse.json(embarcacionRuta, { status: 201 });
  } catch (error) {
    console.error("Error creando asignación embarcación-ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
