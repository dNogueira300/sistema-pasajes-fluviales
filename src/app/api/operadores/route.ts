import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/middleware/auth";
import { crearOperadorSchema } from "@/lib/validations/operador";
import { hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

// GET /api/operadores - Listar operadores
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRADOR"]);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const estado = searchParams.get("estado");
    const embarcacionId = searchParams.get("embarcacionId");
    const search = searchParams.get("search");

    const where: Prisma.UserWhereInput = {
      role: "OPERADOR_EMBARCACION",
    };

    if (estado) {
      where.estadoOperador = estado;
    }

    if (embarcacionId) {
      where.embarcacionAsignadaId = embarcacionId;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    const [operadores, total] = await Promise.all([
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
              estado: true,
              tipo: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: operadores,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Rol no autorizado") {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }
    console.error("Error al listar operadores:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/operadores - Crear operador
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRADOR"]);

    const body: unknown = await request.json();
    const parsed = crearOperadorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { nombre, apellido, email, username, password, embarcacionAsignadaId, estadoOperador } = parsed.data;

    // Validar email único
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    // Validar username único
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: "El username ya está registrado" },
        { status: 400 }
      );
    }

    // Si se asigna embarcación, validar que no tenga otro operador ACTIVO
    if (embarcacionAsignadaId) {
      const embarcacion = await prisma.embarcacion.findUnique({
        where: { id: embarcacionAsignadaId },
      });
      if (!embarcacion) {
        return NextResponse.json(
          { success: false, error: "Embarcación no encontrada" },
          { status: 404 }
        );
      }

      const operadorActivo = await prisma.user.findFirst({
        where: {
          embarcacionAsignadaId,
          estadoOperador: "ACTIVO",
          role: "OPERADOR_EMBARCACION",
        },
      });
      if (operadorActivo) {
        return NextResponse.json(
          { success: false, error: "La embarcación ya tiene un operador activo asignado" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hash(password, 10);

    const operador = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        username,
        password: hashedPassword,
        role: "OPERADOR_EMBARCACION",
        estadoOperador: estadoOperador || "ACTIVO",
        embarcacionAsignadaId: embarcacionAsignadaId || null,
        fechaAsignacion: embarcacionAsignadaId ? new Date() : null,
      },
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
        embarcacionAsignada: {
          select: {
            id: true,
            nombre: true,
            capacidad: true,
            estado: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: operador, message: "Operador creado exitosamente" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Rol no autorizado") {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }
    console.error("Error al crear operador:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
