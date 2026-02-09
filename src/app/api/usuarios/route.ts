// app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validarCrearUsuario } from "@/lib/validations/usuario";
import { sanitizeSearch } from "@/lib/utils/sanitize";

// GET - Obtener usuarios con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de filtrado
    const busquedaRaw = searchParams.get("busqueda");
    const busqueda = busquedaRaw ? sanitizeSearch(busquedaRaw) : null;
    const role = searchParams.get("role");
    const activo = searchParams.get("activo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Construcción de filtros para búsqueda avanzada con tipos de Prisma
    const where: Prisma.UserWhereInput = {};

    if (busqueda) {
      where.OR = [
        {
          nombre: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          apellido: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
        {
          username: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
      ];
    }

    if (role && ["ADMINISTRADOR", "VENDEDOR", "OPERADOR_EMBARCACION"].includes(role)) {
      where.role = role as "ADMINISTRADOR" | "VENDEDOR" | "OPERADOR_EMBARCACION";
    }

    if (activo !== null && activo !== undefined) {
      where.activo = activo === "true";
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Ejecutar consultas en paralelo
    const [usuarios, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          nombre: true,
          apellido: true,
          role: true,
          activo: true,
          estadoOperador: true,
          embarcacionAsignadaId: true,
          fechaAsignacion: true,
          createdAt: true,
          updatedAt: true,
          embarcacionAsignada: {
            select: {
              id: true,
              nombre: true,
              capacidad: true,
            },
          },
          _count: {
            select: {
              ventas: true,
              anulaciones: true,
            },
          },
        },
        orderBy: [
          { activo: "desc" }, // Primero activos, luego inactivos
          { role: "asc" }, // Luego por rol (ADMINISTRADOR primero)
          { nombre: "asc" }, // Luego por nombre
        ],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      usuarios,
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
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validación con Zod (doble validación: cliente + servidor)
    const validacion = validarCrearUsuario(body);
    if (!validacion.success) {
      const primerError = validacion.error.issues[0];
      return NextResponse.json(
        { error: primerError.message },
        { status: 400 }
      );
    }

    const { email, username, password, nombre, apellido, role, activo, embarcacionAsignadaId, estadoOperador } = validacion.data;

    // Verificar unicidad de email
    const usuarioExistenteEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (usuarioExistenteEmail) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    // Verificar unicidad de username
    const usuarioExistenteUsername = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (usuarioExistenteUsername) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este username" },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Si es OPERADOR_EMBARCACION y tiene embarcación asignada, verificar disponibilidad
    if (role === "OPERADOR_EMBARCACION" && embarcacionAsignadaId) {
      // Verificar que la embarcación existe
      const embarcacion = await prisma.embarcacion.findUnique({
        where: { id: embarcacionAsignadaId },
      });

      if (!embarcacion) {
        return NextResponse.json(
          { error: "La embarcación seleccionada no existe" },
          { status: 400 }
        );
      }

      // Verificar que no haya otro operador ACTIVO para esta embarcación
      const operadorExistente = await prisma.user.findFirst({
        where: {
          embarcacionAsignadaId: embarcacionAsignadaId,
          estadoOperador: "ACTIVO",
          role: "OPERADOR_EMBARCACION",
        },
      });

      if (operadorExistente) {
        return NextResponse.json(
          { error: "Esta embarcación ya tiene un operador activo asignado" },
          { status: 400 }
        );
      }
    }

    // Preparar datos de creación con tipos explícitos
    const datosCreacion: Prisma.UserCreateInput = {
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      role: role || "VENDEDOR",
      activo: activo !== undefined ? activo : true,
      // Campos específicos para OPERADOR_EMBARCACION
      ...(role === "OPERADOR_EMBARCACION" && {
        estadoOperador: estadoOperador || "ACTIVO",
        ...(embarcacionAsignadaId && {
          embarcacionAsignada: { connect: { id: embarcacionAsignadaId } },
          fechaAsignacion: new Date(),
        }),
      }),
    };

    const usuario = await prisma.user.create({
      data: datosCreacion,
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellido: true,
        role: true,
        activo: true,
        estadoOperador: true,
        embarcacionAsignadaId: true,
        fechaAsignacion: true,
        createdAt: true,
        updatedAt: true,
        embarcacionAsignada: {
          select: {
            id: true,
            nombre: true,
            capacidad: true,
          },
        },
        _count: {
          select: {
            ventas: true,
            anulaciones: true,
          },
        },
      },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creando usuario:", error);

    // Verificamos si es un error de Prisma con código P2002 (unique constraint)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email o username" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
