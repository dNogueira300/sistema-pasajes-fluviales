// lib/actions/clientes.ts
import { prisma } from "@/lib/prisma";

// Interfaces
interface FiltrosClientes {
  busqueda?: string | null;
  nacionalidad?: string | null;
  page?: number;
  limit?: number;
}

interface CrearClienteData {
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  nacionalidad?: string;
  direccion?: string;
}

interface ActualizarClienteData {
  dni?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  nacionalidad?: string;
  direccion?: string;
}

// Buscar cliente por DNI (función ya existente en ventas.ts, la extraemos aquí)
export async function buscarClientePorDNI(dni: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { dni },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    return cliente;
  } catch (error) {
    console.error("Error buscando cliente por DNI:", error);
    throw new Error("Error al buscar cliente");
  }
}

// Obtener cliente por ID
export async function getClientePorId(clienteId: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    return cliente;
  } catch (error) {
    console.error("Error obteniendo cliente por ID:", error);
    throw new Error("Error al obtener cliente");
  }
}

// Obtener lista de clientes con filtros y paginación
export async function getClientes(filtros: FiltrosClientes = {}) {
  try {
    const { busqueda, nacionalidad, page = 1, limit = 10 } = filtros;
    const skip = (page - 1) * limit;

    // Construir condiciones WHERE
    const where: {
      OR?: Array<{
        dni?: { contains: string; mode: "insensitive" };
        nombre?: { contains: string; mode: "insensitive" };
        apellido?: { contains: string; mode: "insensitive" };
        AND?: Array<{
          nombre?: { contains: string; mode: "insensitive" };
          apellido?: { contains: string; mode: "insensitive" };
        }>;
      }>;
      nacionalidad?: string;
    } = {};

    if (busqueda) {
      where.OR = [
        { dni: { contains: busqueda, mode: "insensitive" as const } },
        { nombre: { contains: busqueda, mode: "insensitive" as const } },
        { apellido: { contains: busqueda, mode: "insensitive" as const } },
        {
          // Búsqueda por nombre completo
          AND: [
            {
              nombre: {
                contains: busqueda.split(" ")[0],
                mode: "insensitive" as const,
              },
            },
            ...(busqueda.split(" ").length > 1
              ? [
                  {
                    apellido: {
                      contains: busqueda.split(" ").slice(1).join(" "),
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        },
      ];
    }

    if (nacionalidad) {
      where.nacionalidad = nacionalidad;
    }

    // Obtener clientes
    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include: {
          _count: {
            select: {
              ventas: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { nombre: "asc" }],
        skip,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ]);

    // Obtener nacionalidades únicas para filtros
    const nacionalidades = await prisma.cliente.findMany({
      select: { nacionalidad: true },
      distinct: ["nacionalidad"],
      orderBy: { nacionalidad: "asc" },
    });

    return {
      clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      nacionalidades: nacionalidades.map((n) => n.nacionalidad),
    };
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    throw new Error("Error al obtener lista de clientes");
  }
}

// Crear nuevo cliente
export async function crearCliente(data: CrearClienteData) {
  try {
    const cliente = await prisma.cliente.create({
      data: {
        dni: data.dni,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono || "",
        email: data.email || "",
        nacionalidad: data.nacionalidad || "Peruana",
        direccion: data.direccion || "",
      },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    return cliente;
  } catch (error) {
    console.error("Error creando cliente:", error);
    throw error; // Re-lanzar para manejar errores específicos en la API
  }
}

// Actualizar cliente
export async function actualizarCliente(
  clienteId: string,
  data: ActualizarClienteData
) {
  try {
    // Verificar que el cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!clienteExistente) {
      throw new Error("Cliente no encontrado");
    }

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        ...(data.dni && { dni: data.dni }),
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.apellido && { apellido: data.apellido }),
        ...(data.telefono !== undefined && { telefono: data.telefono }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.nacionalidad !== undefined && {
          nacionalidad: data.nacionalidad,
        }),
        ...(data.direccion !== undefined && { direccion: data.direccion }),
      },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    return cliente;
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    throw error; // Re-lanzar para manejar errores específicos en la API
  }
}

// Eliminar cliente
export async function eliminarCliente(clienteId: string) {
  try {
    // Verificar que el cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    if (!clienteExistente) {
      throw new Error("Cliente no encontrado");
    }

    // Verificar que no tenga ventas asociadas
    if (clienteExistente._count.ventas > 0) {
      throw new Error(
        "No se puede eliminar el cliente porque tiene ventas asociadas"
      );
    }

    await prisma.cliente.delete({
      where: { id: clienteId },
    });

    return true;
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    throw error; // Re-lanzar para manejar errores específicos en la API
  }
}

// Obtener estadísticas de clientes
export async function getEstadisticasClientes() {
  try {
    const [
      totalClientes,
      clientesConVentas,
      nacionalidadesMasComunes,
      clientesRecientes,
    ] = await Promise.all([
      // Total de clientes
      prisma.cliente.count(),

      // Clientes con ventas
      prisma.cliente.count({
        where: {
          ventas: {
            some: {},
          },
        },
      }),

      // Nacionalidades más comunes
      prisma.cliente.groupBy({
        by: ["nacionalidad"],
        _count: {
          nacionalidad: true,
        },
        orderBy: {
          _count: {
            nacionalidad: "desc",
          },
        },
        take: 5,
      }),

      // Clientes registrados en los últimos 30 días
      prisma.cliente.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalClientes,
      clientesConVentas,
      clientesSinVentas: totalClientes - clientesConVentas,
      nacionalidadesMasComunes,
      clientesRecientes,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de clientes:", error);
    throw new Error("Error al obtener estadísticas");
  }
}
