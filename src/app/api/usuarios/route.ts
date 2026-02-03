// app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - Obtener usuarios con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de filtrado
    const busqueda = searchParams.get("busqueda");
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

    if (role && ["ADMINISTRADOR", "VENDEDOR"].includes(role)) {
      where.role = role as "ADMINISTRADOR" | "VENDEDOR";
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
          createdAt: true,
          updatedAt: true,
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
    const { email, username, password, nombre, apellido, role, activo } = body;

    // Validaciones básicas
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: "El username debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    // Validar contraseña (mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número)
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número",
        },
        { status: 400 }
      );
    }

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (!apellido || apellido.trim().length < 2) {
      return NextResponse.json(
        { error: "El apellido debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (role && !["ADMINISTRADOR", "VENDEDOR"].includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

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

    // Preparar datos de creación con tipos explícitos
    const datosCreacion: Prisma.UserCreateInput = {
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      role: role || "VENDEDOR",
      activo: activo !== undefined ? activo : true,
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
        createdAt: true,
        updatedAt: true,
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
