// app/api/usuarios/estadisticas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Ejecutar todas las consultas en paralelo para mejor rendimiento
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

    const estadisticas = {
      totalUsuarios,
      usuariosActivos,
      usuariosInactivos,
      usuariosAdministradores,
      usuariosVendedores,
      usuariosConVentas,
      usuariosRecientes,
    };

    return NextResponse.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas de usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
