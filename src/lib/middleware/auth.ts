import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function requireOperadorActivo() {
  const session = await requireAuth();
  const userId = session.user.id;

  // Consultar datos frescos del operador desde la BD
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      username: true,
      role: true,
      estadoOperador: true,
      embarcacionAsignadaId: true,
      activo: true,
    },
  });

  if (!user || !user.activo) {
    throw new Error("Usuario no encontrado o inactivo");
  }

  if (user.role !== "OPERADOR_EMBARCACION") {
    throw new Error("Usuario no es operador");
  }

  if (user.estadoOperador !== "ACTIVO") {
    throw new Error("Operador inactivo");
  }

  if (!user.embarcacionAsignadaId) {
    throw new Error("Operador sin embarcación asignada");
  }

  return user;
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new Error("Rol no autorizado");
  }
  return session;
}
