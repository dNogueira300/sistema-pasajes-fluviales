// app/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validarActualizarUsuario } from "@/lib/validations/usuario";

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

    // Validación con Zod (doble validación: cliente + servidor)
    const validacion = validarActualizarUsuario(body);
    if (!validacion.success) {
      const primerError = validacion.error.issues[0];
      return NextResponse.json(
        { error: primerError.message },
        { status: 400 }
      );
    }

    const { email, username, password, nombre, apellido, role, activo, embarcacionAsignadaId, estadoOperador } = validacion.data;

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

    // Validaciones de unicidad de email si se está actualizando
    if (email && email !== usuarioExistente.email) {
      const usuarioConMismoEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (usuarioConMismoEmail && usuarioConMismoEmail.id !== id) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este email" },
          { status: 400 }
        );
      }
    }

    // Validaciones de unicidad de username si se está actualizando
    if (username && username !== usuarioExistente.username) {
      const usuarioConMismoUsername = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
      });

      if (usuarioConMismoUsername && usuarioConMismoUsername.id !== id) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este username" },
          { status: 400 }
        );
      }
    }

    // Validaciones específicas para OPERADOR_EMBARCACION
    if (role === "OPERADOR_EMBARCACION" || usuarioExistente.role === "OPERADOR_EMBARCACION") {
      // Si se asigna embarcación, verificar disponibilidad
      if (embarcacionAsignadaId && embarcacionAsignadaId !== usuarioExistente.embarcacionAsignadaId) {
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
            id: { not: id }, // Excluir al usuario actual
          },
        });

        if (operadorExistente) {
          return NextResponse.json(
            { error: "Esta embarcación ya tiene un operador activo asignado" },
            { status: 400 }
          );
        }
      }

      // Validar estadoOperador si se proporciona
      if (estadoOperador && !["ACTIVO", "INACTIVO"].includes(estadoOperador)) {
        return NextResponse.json(
          { error: "Estado de operador no válido" },
          { status: 400 }
        );
      }
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

      // Si cambia de rol a no-operador, limpiar campos de operador
      if (role !== "OPERADOR_EMBARCACION") {
        datosActualizados.embarcacionAsignada = { disconnect: true };
        datosActualizados.estadoOperador = null;
        datosActualizados.fechaAsignacion = null;
      }
    }
    if (activo !== undefined) {
      datosActualizados.activo = activo;
    }

    // Campos específicos para OPERADOR_EMBARCACION
    const esOperador = role === "OPERADOR_EMBARCACION" ||
      (role === undefined && usuarioExistente.role === "OPERADOR_EMBARCACION");

    if (esOperador) {
      // Manejar asignación de embarcación
      if (embarcacionAsignadaId !== undefined) {
        if (embarcacionAsignadaId) {
          datosActualizados.embarcacionAsignada = { connect: { id: embarcacionAsignadaId } };
          // Solo actualizar fecha de asignación si cambió la embarcación
          if (embarcacionAsignadaId !== usuarioExistente.embarcacionAsignadaId) {
            datosActualizados.fechaAsignacion = new Date();
          }
        } else {
          // Desasignar embarcación
          datosActualizados.embarcacionAsignada = { disconnect: true };
          datosActualizados.fechaAsignacion = null;
        }
      }

      // Manejar estado del operador
      if (estadoOperador !== undefined) {
        datosActualizados.estadoOperador = estadoOperador;
      }
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
