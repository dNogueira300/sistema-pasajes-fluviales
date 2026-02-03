// lib/actions/embarcaciones.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  Embarcacion,
  FiltrosEmbarcaciones,
  CrearEmbarcacionData,
  ActualizarEmbarcacionData,
  EstadisticasEmbarcaciones,
  EmbarcacionesResponse,
  EstadoEmbarcacion,
} from "@/types";

// Obtener embarcaciones con filtros y paginación
export async function getEmbarcaciones(
  filtros: FiltrosEmbarcaciones = {}
): Promise<EmbarcacionesResponse> {
  const { busqueda, estado, page = 1, limit = 10 } = filtros;

  // Construir condiciones de filtrado con tipos de Prisma
  const where: Prisma.EmbarcacionWhereInput = {};

  if (busqueda) {
    where.OR = [
      {
        nombre: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
      {
        tipo: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
    ];
  }

  if (estado) {
    where.estado = estado;
  }

  // Calcular offset para paginación
  const skip = (page - 1) * limit;

  // Ejecutar consultas en paralelo
  const [embarcaciones, total] = await Promise.all([
    prisma.embarcacion.findMany({
      where,
      include: {
        _count: {
          select: {
            ventas: true,
            embarcacionRutas: true,
          },
        },
      },
      orderBy: [
        { estado: "asc" }, // Primero ACTIVA, luego MANTENIMIENTO, luego INACTIVA
        { nombre: "asc" }, // Luego por nombre
      ],
      skip,
      take: limit,
    }),
    prisma.embarcacion.count({ where }),
  ]);

  // Calcular información de paginación
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    embarcaciones: embarcaciones as Embarcacion[],
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

// Obtener embarcación por ID
export async function getEmbarcacionById(
  id: string
): Promise<Embarcacion | null> {
  const embarcacion = await prisma.embarcacion.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ventas: true,
          embarcacionRutas: true,
        },
      },
    },
  });

  return embarcacion as Embarcacion | null;
}

// Crear nueva embarcación
export async function crearEmbarcacion(
  datos: CrearEmbarcacionData
): Promise<Embarcacion> {
  // Verificar que no exista una embarcación con el mismo nombre
  const embarcacionExistente = await prisma.embarcacion.findFirst({
    where: {
      nombre: {
        equals: datos.nombre.trim(),
        mode: "insensitive",
      },
    },
  });

  if (embarcacionExistente) {
    throw new Error("Ya existe una embarcación con este nombre");
  }

  // Validaciones
  if (datos.capacidad <= 0) {
    throw new Error("La capacidad debe ser mayor a 0");
  }

  if (datos.capacidad > 500) {
    throw new Error("La capacidad no puede ser mayor a 500 pasajeros");
  }

  // Preparar datos para creación con tipos explícitos
  const datosCreacion: Prisma.EmbarcacionCreateInput = {
    nombre: datos.nombre.trim(),
    capacidad: datos.capacidad,
    estado: datos.estado || "ACTIVA",
    tipo: datos.tipo?.trim() || null,
  };

  const embarcacion = await prisma.embarcacion.create({
    data: datosCreacion,
    include: {
      _count: {
        select: {
          ventas: true,
          embarcacionRutas: true,
        },
      },
    },
  });

  return embarcacion as Embarcacion;
}

// Actualizar embarcación
export async function actualizarEmbarcacion(
  id: string,
  datos: ActualizarEmbarcacionData
): Promise<Embarcacion> {
  // Verificar que la embarcación existe
  const embarcacionExistente = await prisma.embarcacion.findUnique({
    where: { id },
  });

  if (!embarcacionExistente) {
    throw new Error("Embarcación no encontrada");
  }

  // Si se está actualizando el nombre, verificar que no exista otra embarcación con el mismo nombre
  if (datos.nombre) {
    const embarcacionConMismoNombre = await prisma.embarcacion.findFirst({
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

    if (embarcacionConMismoNombre) {
      throw new Error("Ya existe una embarcación con este nombre");
    }
  }

  // Validaciones
  if (datos.capacidad !== undefined) {
    if (datos.capacidad <= 0) {
      throw new Error("La capacidad debe ser mayor a 0");
    }

    if (datos.capacidad > 500) {
      throw new Error("La capacidad no puede ser mayor a 500 pasajeros");
    }
  }

  // Preparar datos de actualización con tipos explícitos
  const datosActualizados: Prisma.EmbarcacionUpdateInput = {};

  if (datos.nombre !== undefined) {
    if (!datos.nombre.trim()) {
      throw new Error("El nombre de la embarcación no puede estar vacío");
    }
    datosActualizados.nombre = datos.nombre.trim();
  }
  if (datos.capacidad !== undefined) {
    datosActualizados.capacidad = datos.capacidad;
  }
  if (datos.estado !== undefined) {
    datosActualizados.estado = datos.estado;
  }
  if (datos.tipo !== undefined) {
    datosActualizados.tipo = datos.tipo?.trim() || null;
  }

  const embarcacion = await prisma.embarcacion.update({
    where: { id },
    data: datosActualizados,
    include: {
      _count: {
        select: {
          ventas: true,
          embarcacionRutas: true,
        },
      },
    },
  });

  return embarcacion as Embarcacion;
}

// Eliminar embarcación
export async function eliminarEmbarcacion(id: string): Promise<void> {
  // Verificar que la embarcación existe
  const embarcacion = await prisma.embarcacion.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ventas: true,
          embarcacionRutas: true,
        },
      },
    },
  });

  if (!embarcacion) {
    throw new Error("Embarcación no encontrada");
  }

  // Verificar que no tenga ventas o rutas asociadas
  if (embarcacion._count.ventas > 0) {
    throw new Error(
      `No se puede eliminar la embarcación porque tiene ${embarcacion._count.ventas} ventas asociadas`
    );
  }

  if (embarcacion._count.embarcacionRutas > 0) {
    throw new Error(
      `No se puede eliminar la embarcación porque tiene ${embarcacion._count.embarcacionRutas} rutas asignadas`
    );
  }

  await prisma.embarcacion.delete({
    where: { id },
  });
}

// Obtener estadísticas de embarcaciones
export async function getEstadisticasEmbarcaciones(): Promise<EstadisticasEmbarcaciones> {
  const [
    totalEmbarcaciones,
    embarcacionesActivas,
    embarcacionesMantenimiento,
    embarcacionesConVentas,
    capacidades,
  ] = await Promise.all([
    // Total de embarcaciones
    prisma.embarcacion.count(),

    // Embarcaciones activas
    prisma.embarcacion.count({
      where: { estado: "ACTIVA" },
    }),

    // Embarcaciones en mantenimiento
    prisma.embarcacion.count({
      where: { estado: "MANTENIMIENTO" },
    }),

    // Embarcaciones con ventas
    prisma.embarcacion.count({
      where: {
        ventas: {
          some: {},
        },
      },
    }),

    // Obtener capacidades para calcular totales y promedio
    prisma.embarcacion.findMany({
      select: {
        capacidad: true,
      },
    }),
  ]);

  const embarcacionesInactivas =
    totalEmbarcaciones - embarcacionesActivas - embarcacionesMantenimiento;

  // Calcular capacidad total y promedio
  const capacidadTotal = capacidades.reduce((sum, e) => sum + e.capacidad, 0);
  const capacidadPromedio =
    totalEmbarcaciones > 0
      ? Math.round(capacidadTotal / totalEmbarcaciones)
      : 0;

  return {
    totalEmbarcaciones,
    embarcacionesActivas,
    embarcacionesMantenimiento,
    embarcacionesInactivas,
    embarcacionesConVentas,
    capacidadTotal,
    capacidadPromedio,
  };
}

// Buscar embarcaciones activas para selección
export async function getEmbarcacionesActivas(): Promise<Embarcacion[]> {
  const embarcaciones = await prisma.embarcacion.findMany({
    where: { estado: "ACTIVA" },
    orderBy: [
      { nombre: "asc" }, // Ordenar por nombre
    ],
    include: {
      _count: {
        select: {
          ventas: true,
          embarcacionRutas: true,
        },
      },
    },
  });

  return embarcaciones as Embarcacion[];
}

// Validar si una embarcación existe y está activa
export async function validarEmbarcacionActiva(id: string): Promise<boolean> {
  const embarcacion = await prisma.embarcacion.findFirst({
    where: {
      id,
      estado: "ACTIVA",
    },
  });

  return !!embarcacion;
}

// Función para obtener embarcaciones por estado
export async function getEmbarcacionesPorEstado(
  estado: EstadoEmbarcacion
): Promise<Embarcacion[]> {
  const embarcaciones = await prisma.embarcacion.findMany({
    where: { estado },
    include: {
      _count: {
        select: {
          ventas: true,
          embarcacionRutas: true,
        },
      },
    },
    orderBy: {
      nombre: "asc",
    },
  });

  return embarcaciones as Embarcacion[];
}

// Función para verificar disponibilidad de asientos
export async function verificarDisponibilidadAsientos(
  embarcacionId: string,
  fechaViaje: Date,
  cantidadPasajes: number
): Promise<{
  disponible: boolean;
  asientosDisponibles: number;
  capacidadTotal: number;
}> {
  // Obtener la embarcación y su capacidad
  const embarcacion = await prisma.embarcacion.findUnique({
    where: { id: embarcacionId },
    select: { capacidad: true, estado: true },
  });

  if (!embarcacion) {
    throw new Error("Embarcación no encontrada");
  }

  if (embarcacion.estado !== "ACTIVA") {
    throw new Error("La embarcación no está activa");
  }

  // Calcular asientos ocupados para esa fecha y embarcación
  const ventasExistentes = await prisma.venta.aggregate({
    where: {
      embarcacionId,
      fechaViaje: {
        gte: new Date(
          fechaViaje.getFullYear(),
          fechaViaje.getMonth(),
          fechaViaje.getDate()
        ),
        lt: new Date(
          fechaViaje.getFullYear(),
          fechaViaje.getMonth(),
          fechaViaje.getDate() + 1
        ),
      },
      estado: {
        not: "ANULADA", // No contar ventas anuladas
      },
    },
    _sum: {
      cantidadPasajes: true,
    },
  });

  const asientosOcupados = ventasExistentes._sum.cantidadPasajes || 0;
  const asientosDisponibles = embarcacion.capacidad - asientosOcupados;
  const disponible = asientosDisponibles >= cantidadPasajes;

  return {
    disponible,
    asientosDisponibles,
    capacidadTotal: embarcacion.capacidad,
  };
}
