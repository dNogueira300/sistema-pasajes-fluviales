// app/api/embarcaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET - Obtener embarcaciones con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de filtrado
    const busqueda = searchParams.get("busqueda");
    const estado = searchParams.get("estado");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Construcción de filtros para búsqueda avanzada con tipos de Prisma
    const where: Prisma.EmbarcacionWhereInput = {};

    if (busqueda) {
      where.OR = [
        {
          nombre: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          tipo: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
      ];
    }

    if (estado && ["ACTIVA", "MANTENIMIENTO", "INACTIVA"].includes(estado)) {
      where.estado = estado as "ACTIVA" | "MANTENIMIENTO" | "INACTIVA";
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Ejecutar consultas en paralelo
    const [embarcaciones, total] = await Promise.all([
      prisma.embarcacion.findMany({
        where,
        include: {
          _count: {
            select: {
              ventas: true,
              embarcacionRutas: true,
            },
          },
        },
        orderBy: [
          { estado: "asc" }, // Primero ACTIVA, luego MANTENIMIENTO, luego INACTIVA
          { nombre: "asc" }, // Luego por nombre
        ],
        skip,
        take: limit,
      }),
      prisma.embarcacion.count({ where }),
    ]);

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      embarcaciones,
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
    console.error("Error obteniendo embarcaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva embarcación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, capacidad, estado, tipo } = body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la embarcación es requerido" },
        { status: 400 }
      );
    }

    if (!capacidad || capacidad <= 0) {
      return NextResponse.json(
        { error: "La capacidad debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (capacidad > 500) {
      return NextResponse.json(
        { error: "La capacidad no puede ser mayor a 500 pasajeros" },
        { status: 400 }
      );
    }

    if (estado && !["ACTIVA", "MANTENIMIENTO", "INACTIVA"].includes(estado)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    // Verificar que no exista una embarcación con el mismo nombre
    const embarcacionExistente = await prisma.embarcacion.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
          mode: "insensitive",
        },
      },
    });

    if (embarcacionExistente) {
      return NextResponse.json(
        { error: "Ya existe una embarcación con este nombre" },
        { status: 400 }
      );
    }

    // Preparar datos de creación con tipos explícitos
    const datosCreacion: Prisma.EmbarcacionCreateInput = {
      nombre: nombre.trim(),
      capacidad: parseInt(capacidad),
      estado: estado || "ACTIVA",
      tipo: tipo?.trim() || null,
    };

    const embarcacion = await prisma.embarcacion.create({
      data: datosCreacion,
      include: {
        _count: {
          select: {
            ventas: true,
            embarcacionRutas: true,
          },
        },
      },
    });

    return NextResponse.json(embarcacion, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creando embarcación:", error);

    // Verificamos si es un error de Prisma con código P2002
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una embarcación con ese nombre" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
