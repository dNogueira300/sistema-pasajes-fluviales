// lib/actions/usuarios.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import {
  Usuario,
  FiltrosUsuarios,
  CrearUsuarioData,
  ActualizarUsuarioData,
  EstadisticasUsuarios,
  UsuariosResponse,
  UserRole,
} from "@/types";

// Obtener usuarios con filtros y paginación
export async function getUsuarios(
  filtros: FiltrosUsuarios = {}
): Promise<UsuariosResponse> {
  const { busqueda, role, activo, page = 1, limit = 10 } = filtros;

  // Construir condiciones de filtrado con tipos de Prisma
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

  if (role) {
    where.role = role;
  }

  if (activo !== undefined) {
    where.activo = activo;
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

  return {
    usuarios: usuarios as Usuario[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

// Obtener usuario por ID
export async function getUsuarioById(id: string): Promise<Usuario | null> {
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

  return usuario as Usuario | null;
}

// Crear nuevo usuario
export async function crearUsuario(datos: CrearUsuarioData): Promise<Usuario> {
  // Verificar que no exista un usuario con el mismo email
  const usuarioExistenteEmail = await prisma.user.findUnique({
    where: { email: datos.email.trim().toLowerCase() },
  });

  if (usuarioExistenteEmail) {
    throw new Error("Ya existe un usuario con este email");
  }

  // Verificar que no exista un usuario con el mismo username
  const usuarioExistenteUsername = await prisma.user.findUnique({
    where: { username: datos.username.trim().toLowerCase() },
  });

  if (usuarioExistenteUsername) {
    throw new Error("Ya existe un usuario con este username");
  }

  // Validaciones
  if (!datos.email || !datos.email.trim()) {
    throw new Error("El email es requerido");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(datos.email)) {
    throw new Error("Formato de email inválido");
  }

  if (!datos.username || datos.username.trim().length < 3) {
    throw new Error("El username debe tener al menos 3 caracteres");
  }

  if (!datos.password || datos.password.length < 12) {
    throw new Error("La contraseña debe tener al menos 12 caracteres");
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
  if (!passwordRegex.test(datos.password)) {
    throw new Error(
      "La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número"
    );
  }

  if (!datos.nombre || datos.nombre.trim().length < 2) {
    throw new Error("El nombre debe tener al menos 2 caracteres");
  }

  if (!datos.apellido || datos.apellido.trim().length < 2) {
    throw new Error("El apellido debe tener al menos 2 caracteres");
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(datos.password, 12);

  // Preparar datos para creación con tipos explícitos
  const datosCreacion: Prisma.UserCreateInput = {
    email: datos.email.trim().toLowerCase(),
    username: datos.username.trim().toLowerCase(),
    password: hashedPassword,
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    role: datos.role || "VENDEDOR",
    activo: datos.activo !== undefined ? datos.activo : true,
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

  return usuario as Usuario;
}

// Actualizar usuario
export async function actualizarUsuario(
  id: string,
  datos: ActualizarUsuarioData
): Promise<Usuario> {
  // Verificar que el usuario existe
  const usuarioExistente = await prisma.user.findUnique({
    where: { id },
  });

  if (!usuarioExistente) {
    throw new Error("Usuario no encontrado");
  }

  // Si se está actualizando el email, verificar que no exista otro usuario con el mismo email
  if (datos.email && datos.email !== usuarioExistente.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.email)) {
      throw new Error("Formato de email inválido");
    }

    const usuarioConMismoEmail = await prisma.user.findUnique({
      where: { email: datos.email.trim().toLowerCase() },
    });

    if (usuarioConMismoEmail && usuarioConMismoEmail.id !== id) {
      throw new Error("Ya existe un usuario con este email");
    }
  }

  // Si se está actualizando el username, verificar que no exista otro usuario con el mismo username
  if (datos.username && datos.username !== usuarioExistente.username) {
    if (datos.username.trim().length < 3) {
      throw new Error("El username debe tener al menos 3 caracteres");
    }

    const usuarioConMismoUsername = await prisma.user.findUnique({
      where: { username: datos.username.trim().toLowerCase() },
    });

    if (usuarioConMismoUsername && usuarioConMismoUsername.id !== id) {
      throw new Error("Ya existe un usuario con este username");
    }
  }

  // Validaciones de otros campos
  if (datos.nombre !== undefined) {
    if (!datos.nombre.trim() || datos.nombre.trim().length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }
  }

  if (datos.apellido !== undefined) {
    if (!datos.apellido.trim() || datos.apellido.trim().length < 2) {
      throw new Error("El apellido debe tener al menos 2 caracteres");
    }
  }

  // Validar contraseña si se proporciona
  let hashedPassword: string | undefined;
  if (datos.password) {
    if (datos.password.length < 12) {
      throw new Error("La contraseña debe tener al menos 12 caracteres");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(datos.password)) {
      throw new Error(
        "La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número"
      );
    }

    hashedPassword = await bcrypt.hash(datos.password, 12);
  }

  // Preparar datos de actualización con tipos explícitos
  const datosActualizados: Prisma.UserUpdateInput = {};

  if (datos.email !== undefined) {
    datosActualizados.email = datos.email.trim().toLowerCase();
  }
  if (datos.username !== undefined) {
    datosActualizados.username = datos.username.trim().toLowerCase();
  }
  if (hashedPassword) {
    datosActualizados.password = hashedPassword;
  }
  if (datos.nombre !== undefined) {
    datosActualizados.nombre = datos.nombre.trim();
  }
  if (datos.apellido !== undefined) {
    datosActualizados.apellido = datos.apellido.trim();
  }
  if (datos.role !== undefined) {
    datosActualizados.role = datos.role;
  }
  if (datos.activo !== undefined) {
    datosActualizados.activo = datos.activo;
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

  return usuario as Usuario;
}

// Eliminar usuario (verificar dependencias)
export async function eliminarUsuario(id: string): Promise<void> {
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
    throw new Error("Usuario no encontrado");
  }

  // Verificar que no tenga actividad en el sistema
  if (usuario._count.ventas > 0 || usuario._count.anulaciones > 0) {
    throw new Error(
      `No se puede eliminar el usuario porque tiene ${usuario._count.ventas} ventas y ${usuario._count.anulaciones} anulaciones registradas`
    );
  }

  await prisma.user.delete({
    where: { id },
  });
}

// Obtener estadísticas de usuarios
export async function getEstadisticasUsuarios(): Promise<EstadisticasUsuarios> {
  const [
    totalUsuarios,
    usuariosActivos,
    usuariosAdministradores,
    usuariosVendedores,
    usuariosConVentas,
    usuariosRecientes,
  ] = await Promise.all([
    // Total de usuarios
    prisma.user.count(),

    // Usuarios activos
    prisma.user.count({
      where: { activo: true },
    }),

    // Usuarios administradores
    prisma.user.count({
      where: { role: "ADMINISTRADOR" },
    }),

    // Usuarios vendedores
    prisma.user.count({
      where: { role: "VENDEDOR" },
    }),

    // Usuarios con ventas
    prisma.user.count({
      where: {
        ventas: {
          some: {},
        },
      },
    }),

    // Usuarios creados en los últimos 30 días
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const usuariosInactivos = totalUsuarios - usuariosActivos;

  return {
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos,
    usuariosAdministradores,
    usuariosVendedores,
    usuariosConVentas,
    usuariosRecientes,
  };
}

// Validar si un usuario existe y está activo
export async function validarUsuarioActivo(id: string): Promise<boolean> {
  const usuario = await prisma.user.findFirst({
    where: {
      id,
      activo: true,
    },
  });

  return !!usuario;
}

// Función para obtener usuarios por rol
export async function getUsuariosPorRol(role: UserRole): Promise<Usuario[]> {
  const usuarios = await prisma.user.findMany({
    where: { role, activo: true },
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
    orderBy: {
      nombre: "asc",
    },
  });

  return usuarios as Usuario[];
}

// Función para buscar usuarios por email
export async function buscarUsuarioPorEmail(
  email: string
): Promise<Usuario | null> {
  const usuario = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
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

  return usuario as Usuario | null;
}

// Función para buscar usuarios por username
export async function buscarUsuarioPorUsername(
  username: string
): Promise<Usuario | null> {
  const usuario = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
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

  return usuario as Usuario | null;
}

// Función para cambiar estado de usuario
export async function cambiarEstadoUsuario(
  id: string,
  activo: boolean
): Promise<Usuario> {
  return actualizarUsuario(id, { activo });
}

// Función para cambiar rol de usuario
export async function cambiarRolUsuario(
  id: string,
  role: UserRole
): Promise<Usuario> {
  return actualizarUsuario(id, { role });
}

// Función para cambiar contraseña
export async function cambiarContrasenaUsuario(
  id: string,
  nuevaContrasena: string
): Promise<Usuario> {
  return actualizarUsuario(id, { password: nuevaContrasena });
}
