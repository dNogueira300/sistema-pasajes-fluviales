// app/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const usuario = await prisma.user.findUnique({
      where: { id },
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

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { email, username, password, nombre, apellido, role, activo } = body;

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { id },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Prevenir que el usuario se desactive a sí mismo
    if (session.user.id === id && activo === false) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propia cuenta" },
        { status: 400 }
      );
    }

    // Validaciones de email si se está actualizando
    if (email && email !== usuarioExistente.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Formato de email inválido" },
          { status: 400 }
        );
      }

      const usuarioConMismoEmail = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (usuarioConMismoEmail && usuarioConMismoEmail.id !== id) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este email" },
          { status: 400 }
        );
      }
    }

    // Validaciones de username si se está actualizando
    if (username && username !== usuarioExistente.username) {
      if (username.trim().length < 3) {
        return NextResponse.json(
          { error: "El username debe tener al menos 3 caracteres" },
          { status: 400 }
        );
      }

      const usuarioConMismoUsername = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });

      if (usuarioConMismoUsername && usuarioConMismoUsername.id !== id) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este username" },
          { status: 400 }
        );
      }
    }

    // Validaciones de otros campos
    if (nombre !== undefined && nombre.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (apellido !== undefined && apellido.trim().length < 2) {
      return NextResponse.json(
        { error: "El apellido debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (role && !["ADMINISTRADOR", "VENDEDOR"].includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    // Validar contraseña si se proporciona
    let hashedPassword: string | undefined;
    if (password) {
      if (password.length < 8) {
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

      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Preparar datos de actualización con tipos explícitos de Prisma
    const datosActualizados: Prisma.UserUpdateInput = {};

    if (email !== undefined) {
      datosActualizados.email = email.trim().toLowerCase();
    }
    if (username !== undefined) {
      datosActualizados.username = username.trim().toLowerCase();
    }
    if (hashedPassword) {
      datosActualizados.password = hashedPassword;
    }
    if (nombre !== undefined) {
      datosActualizados.nombre = nombre.trim();
    }
    if (apellido !== undefined) {
      datosActualizados.apellido = apellido.trim();
    }
    if (role !== undefined) {
      datosActualizados.role = role;
    }
    if (activo !== undefined) {
      datosActualizados.activo = activo;
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: datosActualizados,
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

    return NextResponse.json(usuario);
  } catch (error: unknown) {
    console.error("Error actualizando usuario:", error);

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

// DELETE - Eliminar usuario (desactivar lógicamente)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el usuario existe
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ventas: true,
            anulaciones: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Prevenir que el usuario se elimine a sí mismo
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    // Verificar si tiene actividad en el sistema
    if (usuario._count.ventas > 0 || usuario._count.anulaciones > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el usuario porque tiene ${usuario._count.ventas} ventas y ${usuario._count.anulaciones} anulaciones registradas. Puedes desactivarlo en su lugar.`,
        },
        { status: 400 }
      );
    }

    // Eliminación física si no tiene actividad
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Usuario eliminado exitosamente",
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
      },
    });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
