// lib/actions/puertos.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  Puerto,
  FiltrosPuertos,
  CrearPuertoData,
  ActualizarPuertoData,
  EstadisticasPuertos,
  PuertosResponse,
} from "@/types";

// Obtener puertos con filtros y paginación
export async function getPuertos(
  filtros: FiltrosPuertos = {}
): Promise<PuertosResponse> {
  const { busqueda, activo, page = 1, limit = 10 } = filtros;

  // Construir condiciones de filtrado con tipos de Prisma
  const where: Prisma.PuertoEmbarqueWhereInput = {};

  if (busqueda) {
    where.OR = [
      {
        nombre: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
      {
        direccion: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
      {
        descripcion: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
    ];
  }

  if (activo !== undefined) {
    where.activo = activo;
  }

  // Calcular offset para paginación
  const skip = (page - 1) * limit;

  // Ejecutar consultas en paralelo
  const [puertos, total] = await Promise.all([
    prisma.puertoEmbarque.findMany({
      where,
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
      orderBy: [
        { activo: "desc" }, // Primero los activos
        { orden: "asc" }, // Luego por orden (si existe)
        { nombre: "asc" }, // Finalmente por nombre
      ],
      skip,
      take: limit,
    }),
    prisma.puertoEmbarque.count({ where }),
  ]);

  // Calcular información de paginación
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    puertos: puertos as Puerto[],
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

// Obtener puerto por ID
export async function getPuertoById(id: string): Promise<Puerto | null> {
  const puerto = await prisma.puertoEmbarque.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ventas: true,
        },
      },
    },
  });

  return puerto as Puerto | null;
}

// Crear nuevo puerto
export async function crearPuerto(datos: CrearPuertoData): Promise<Puerto> {
  // Verificar que no exista un puerto con el mismo nombre
  const puertoExistente = await prisma.puertoEmbarque.findFirst({
    where: {
      nombre: {
        equals: datos.nombre.trim(),
        mode: "insensitive",
      },
    },
  });

  if (puertoExistente) {
    throw new Error("Ya existe un puerto con este nombre");
  }

  // Preparar datos para creación con tipos explícitos
  const datosCreacion: Prisma.PuertoEmbarqueCreateInput = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion?.trim() || null,
    direccion: datos.direccion?.trim() || null,
    activo: datos.activo ?? true,
    orden: 0, // Valor por defecto para orden
  };

  const puerto = await prisma.puertoEmbarque.create({
    data: datosCreacion,
    include: {
      _count: {
        select: {
          ventas: true,
        },
      },
    },
  });

  return puerto as Puerto;
}

// Actualizar puerto
export async function actualizarPuerto(
  id: string,
  datos: ActualizarPuertoData
): Promise<Puerto> {
  // Verificar que el puerto existe
  const puertoExistente = await prisma.puertoEmbarque.findUnique({
    where: { id },
  });

  if (!puertoExistente) {
    throw new Error("Puerto no encontrado");
  }

  // Si se está actualizando el nombre, verificar que no exista otro puerto con el mismo nombre
  if (datos.nombre) {
    const puertoConMismoNombre = await prisma.puertoEmbarque.findFirst({
      where: {
        nombre: {
          equals: datos.nombre.trim(),
          mode: "insensitive",
        },
        id: {
          not: id,
        },
      },
    });

    if (puertoConMismoNombre) {
      throw new Error("Ya existe un puerto con este nombre");
    }
  }

  // Preparar datos de actualización con tipos explícitos
  const datosActualizados: Prisma.PuertoEmbarqueUpdateInput = {};

  if (datos.nombre !== undefined) {
    datosActualizados.nombre = datos.nombre.trim();
  }
  if (datos.descripcion !== undefined) {
    datosActualizados.descripcion = datos.descripcion?.trim() || null;
  }
  if (datos.direccion !== undefined) {
    datosActualizados.direccion = datos.direccion?.trim() || null;
  }
  if (datos.activo !== undefined) {
    datosActualizados.activo = datos.activo;
  }

  const puerto = await prisma.puertoEmbarque.update({
    where: { id },
    data: datosActualizados,
    include: {
      _count: {
        select: {
          ventas: true,
        },
      },
    },
  });

  return puerto as Puerto;
}

// Eliminar puerto
export async function eliminarPuerto(id: string): Promise<void> {
  // Verificar que el puerto existe
  const puerto = await prisma.puertoEmbarque.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ventas: true,
        },
      },
    },
  });

  if (!puerto) {
    throw new Error("Puerto no encontrado");
  }

  // Verificar que no tenga ventas asociadas
  if (puerto._count.ventas > 0) {
    throw new Error(
      `No se puede eliminar el puerto porque tiene ${puerto._count.ventas} ventas asociadas`
    );
  }

  await prisma.puertoEmbarque.delete({
    where: { id },
  });
}

// Obtener estadísticas de puertos
export async function getEstadisticasPuertos(): Promise<EstadisticasPuertos> {
  const [totalPuertos, puertosActivos, puertosConVentas, puertosRecientes] =
    await Promise.all([
      // Total de puertos
      prisma.puertoEmbarque.count(),

      // Puertos activos
      prisma.puertoEmbarque.count({
        where: { activo: true },
      }),

      // Puertos con ventas
      prisma.puertoEmbarque.count({
        where: {
          ventas: {
            some: {},
          },
        },
      }),

      // Puertos creados en los últimos 30 días
      prisma.puertoEmbarque.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  const puertosInactivos = totalPuertos - puertosActivos;

  return {
    totalPuertos,
    puertosActivos,
    puertosInactivos,
    puertosConVentas,
    puertosRecientes,
  };
}

// Buscar puertos activos para selección
export async function getPuertosActivos(): Promise<Puerto[]> {
  const puertos = await prisma.puertoEmbarque.findMany({
    where: { activo: true },
    orderBy: [
      { orden: "asc" }, // Primero por orden
      { nombre: "asc" }, // Luego por nombre
    ],
    include: {
      _count: {
        select: {
          ventas: true,
        },
      },
    },
  });

  return puertos as Puerto[];
}

// Validar si un puerto existe y está activo
export async function validarPuertoActivo(id: string): Promise<boolean> {
  const puerto = await prisma.puertoEmbarque.findFirst({
    where: {
      id,
      activo: true,
    },
  });

  return !!puerto;
}

// Función adicional: Actualizar orden de puertos
export async function actualizarOrdenPuertos(
  puertosConOrden: Array<{ id: string; orden: number }>
): Promise<void> {
  // Usar transacción para actualizar múltiples puertos
  await prisma.$transaction(
    puertosConOrden.map(({ id, orden }) =>
      prisma.puertoEmbarque.update({
        where: { id },
        data: { orden },
      })
    )
  );
}
