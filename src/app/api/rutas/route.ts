// app/api/rutas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener rutas con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de filtrado
    const busqueda = searchParams.get("busqueda");
    const activa = searchParams.get("activa");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Construcción de filtros para búsqueda avanzada con tipos de Prisma
    const where: Prisma.RutaWhereInput = {};

    if (busqueda) {
      where.OR = [
        {
          nombre: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          puertoOrigen: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          puertoDestino: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
      ];
    }

    if (activa !== null && activa !== undefined && activa !== "") {
      where.activa = activa === "true";
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Ejecutar consultas en paralelo
    const [rutas, total] = await Promise.all([
      prisma.ruta.findMany({
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
          { activa: "desc" }, // Primero las activas
          { nombre: "asc" }, // Luego por nombre
        ],
        skip,
        take: limit,
      }),
      prisma.ruta.count({ where }),
    ]);

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      rutas,
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
    console.error("Error obteniendo rutas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva ruta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, puertoOrigen, puertoDestino, precio, activa } = body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la ruta es requerido" },
        { status: 400 }
      );
    }

    if (!puertoOrigen || puertoOrigen.trim().length === 0) {
      return NextResponse.json(
        { error: "El puerto de origen es requerido" },
        { status: 400 }
      );
    }

    if (!puertoDestino || puertoDestino.trim().length === 0) {
      return NextResponse.json(
        { error: "El puerto de destino es requerido" },
        { status: 400 }
      );
    }

    if (!precio || precio <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (precio > 1000) {
      return NextResponse.json(
        { error: "El precio no puede ser mayor a 1000 soles" },
        { status: 400 }
      );
    }

    // Validar que el puerto origen sea diferente al destino
    if (
      puertoOrigen.trim().toLowerCase() === puertoDestino.trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: "El puerto de origen debe ser diferente al puerto de destino",
        },
        { status: 400 }
      );
    }

    // Verificar que no exista una ruta con el mismo nombre
    const rutaExistentePorNombre = await prisma.ruta.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
          mode: "insensitive",
        },
      },
    });

    if (rutaExistentePorNombre) {
      return NextResponse.json(
        { error: "Ya existe una ruta con este nombre" },
        { status: 400 }
      );
    }

    // CRÍTICO: Verificar que no exista una ruta con la misma combinación origen-destino
    const rutaExistentePorTrayecto = await prisma.ruta.findFirst({
      where: {
        AND: [
          {
            puertoOrigen: {
              equals: puertoOrigen.trim(),
              mode: "insensitive",
            },
          },
          {
            puertoDestino: {
              equals: puertoDestino.trim(),
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (rutaExistentePorTrayecto) {
      return NextResponse.json(
        {
          error: `Ya existe una ruta con origen "${puertoOrigen.trim()}" y destino "${puertoDestino.trim()}". No se permiten rutas duplicadas con el mismo trayecto.`,
        },
        { status: 400 }
      );
    }

    // Preparar datos de creación con tipos explícitos
    const datosCreacion: Prisma.RutaCreateInput = {
      nombre: nombre.trim(),
      puertoOrigen: puertoOrigen.trim(),
      puertoDestino: puertoDestino.trim(),
      precio: new Prisma.Decimal(precio),
      activa: activa !== undefined ? activa : true,
    };

    const ruta = await prisma.ruta.create({
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

    return NextResponse.json(ruta, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creando ruta:", error);

    // Verificamos si es un error de Prisma con código P2002
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una ruta con ese nombre" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
