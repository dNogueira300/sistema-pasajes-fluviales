// app/api/puertos-embarque/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET - Obtener puertos de embarque con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de filtrado
    const busqueda = searchParams.get("busqueda");
    const activo = searchParams.get("activo");
    const soloActivos = searchParams.get("solo_activos"); // Para compatibilidad con uso anterior
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Si se pide solo activos (compatibilidad con implementación anterior)
    if (
      soloActivos === "true" ||
      (!busqueda && !activo && !searchParams.get("page"))
    ) {
      const puertos = await prisma.puertoEmbarque.findMany({
        where: {
          activo: true,
        },
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      });
      return NextResponse.json(puertos);
    }

    // Construcción de filtros para búsqueda avanzada con tipos de Prisma
    const where: Prisma.PuertoEmbarqueWhereInput = {};

    if (busqueda) {
      where.OR = [
        {
          nombre: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          direccion: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          descripcion: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
      ];
    }

    if (activo !== null && activo !== undefined && activo !== "") {
      where.activo = activo === "true";
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Ejecutar consultas en paralelo
    const [puertos, total] = await Promise.all([
      prisma.puertoEmbarque.findMany({
        where,
        include: {
          _count: {
            select: {
              ventas: true,
            },
          },
        },
        orderBy: [
          { activo: "desc" }, // Primero los activos
          { orden: "asc" }, // Luego por orden
          { nombre: "asc" }, // Finalmente por nombre
        ],
        skip,
        take: limit,
      }),
      prisma.puertoEmbarque.count({ where }),
    ]);

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      puertos,
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
    console.error("Error obteniendo puertos de embarque:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo puerto de embarque
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, direccion, orden, activo } = body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre del puerto es requerido" },
        { status: 400 }
      );
    }

    // Verificar que no exista un puerto con el mismo nombre
    const puertoExistente = await prisma.puertoEmbarque.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
          mode: "insensitive",
        },
      },
    });

    if (puertoExistente) {
      return NextResponse.json(
        { error: "Ya existe un puerto con este nombre" },
        { status: 400 }
      );
    }

    // Preparar datos de creación con tipos explícitos
    const datosCreacion: Prisma.PuertoEmbarqueCreateInput = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      direccion: direccion?.trim() || null,
      orden: orden || 0,
      activo: activo !== undefined ? activo : true,
    };

    const puerto = await prisma.puertoEmbarque.create({
      data: datosCreacion,
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    return NextResponse.json(puerto, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creando puerto de embarque:", error);

    // Verificamos si es un error de Prisma con código P2002
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un puerto con ese nombre" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
