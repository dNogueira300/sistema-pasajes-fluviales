// lib/actions/rutas.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  Ruta,
  FiltrosRutas,
  CrearRutaData,
  ActualizarRutaData,
  EstadisticasRutas,
  RutasResponse,
} from "@/types";

// Obtener rutas con filtros y paginación
export async function getRutas(
  filtros: FiltrosRutas = {}
): Promise<RutasResponse> {
  const { busqueda, activa, page = 1, limit = 10 } = filtros;

  // Construir condiciones de filtrado con tipos de Prisma
  const where: Prisma.RutaWhereInput = {};

  if (busqueda) {
    where.OR = [
      {
        nombre: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
      {
        puertoOrigen: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
      {
        puertoDestino: {
          contains: busqueda,
          mode: "insensitive",
        },
      },
    ];
  }

  if (activa !== undefined) {
    where.activa = activa;
  }

  // Calcular offset para paginación
  const skip = (page - 1) * limit;

  // Ejecutar consultas en paralelo
  const [rutas, total] = await Promise.all([
    prisma.ruta.findMany({
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
        { activa: "desc" }, // Primero las activas
        { nombre: "asc" }, // Luego por nombre
      ],
      skip,
      take: limit,
    }),
    prisma.ruta.count({ where }),
  ]);

  // Calcular información de paginación
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Convertir Decimal a number para compatibilidad con la interfaz
  const rutasFormateadas = rutas.map((ruta) => ({
    ...ruta,
    precio: Number(ruta.precio),
  }));

  return {
    rutas: rutasFormateadas as Ruta[],
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

// Obtener ruta por ID
export async function getRutaById(id: string): Promise<Ruta | null> {
  const ruta = await prisma.ruta.findUnique({
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

  if (!ruta) return null;

  // Convertir Decimal a number
  return {
    ...ruta,
    precio: Number(ruta.precio),
  } as Ruta;
}

// Crear nueva ruta
export async function crearRuta(datos: CrearRutaData): Promise<Ruta> {
  // Verificar que no exista una ruta con el mismo nombre
  const rutaExistente = await prisma.ruta.findFirst({
    where: {
      nombre: {
        equals: datos.nombre.trim(),
        mode: "insensitive",
      },
    },
  });

  if (rutaExistente) {
    throw new Error("Ya existe una ruta con este nombre");
  }

  // Validar que el puerto origen sea diferente al destino
  if (
    datos.puertoOrigen.trim().toLowerCase() ===
    datos.puertoDestino.trim().toLowerCase()
  ) {
    throw new Error(
      "El puerto de origen debe ser diferente al puerto de destino"
    );
  }

  // Preparar datos para creación con tipos explícitos
  const datosCreacion: Prisma.RutaCreateInput = {
    nombre: datos.nombre.trim(),
    puertoOrigen: datos.puertoOrigen.trim(),
    puertoDestino: datos.puertoDestino.trim(),
    precio: new Prisma.Decimal(datos.precio),
    activa: datos.activa ?? true,
  };

  const ruta = await prisma.ruta.create({
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

  // Convertir Decimal a number
  return {
    ...ruta,
    precio: Number(ruta.precio),
  } as Ruta;
}

// Actualizar ruta
export async function actualizarRuta(
  id: string,
  datos: ActualizarRutaData
): Promise<Ruta> {
  // Verificar que la ruta existe
  const rutaExistente = await prisma.ruta.findUnique({
    where: { id },
  });

  if (!rutaExistente) {
    throw new Error("Ruta no encontrada");
  }

  // Si se está actualizando el nombre, verificar que no exista otra ruta con el mismo nombre
  if (datos.nombre) {
    const rutaConMismoNombre = await prisma.ruta.findFirst({
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

    if (rutaConMismoNombre) {
      throw new Error("Ya existe una ruta con este nombre");
    }
  }

  // Validar puertos si se están actualizando
  const puertoOrigen = datos.puertoOrigen?.trim() || rutaExistente.puertoOrigen;
  const puertoDestino =
    datos.puertoDestino?.trim() || rutaExistente.puertoDestino;

  if (puertoOrigen.toLowerCase() === puertoDestino.toLowerCase()) {
    throw new Error(
      "El puerto de origen debe ser diferente al puerto de destino"
    );
  }

  // Preparar datos de actualización con tipos explícitos
  const datosActualizados: Prisma.RutaUpdateInput = {};

  if (datos.nombre !== undefined) {
    if (!datos.nombre.trim()) {
      throw new Error("El nombre de la ruta no puede estar vacío");
    }
    datosActualizados.nombre = datos.nombre.trim();
  }
  if (datos.puertoOrigen !== undefined) {
    if (!datos.puertoOrigen.trim()) {
      throw new Error("El puerto de origen no puede estar vacío");
    }
    datosActualizados.puertoOrigen = datos.puertoOrigen.trim();
  }
  if (datos.puertoDestino !== undefined) {
    if (!datos.puertoDestino.trim()) {
      throw new Error("El puerto de destino no puede estar vacío");
    }
    datosActualizados.puertoDestino = datos.puertoDestino.trim();
  }
  if (datos.precio !== undefined) {
    if (datos.precio <= 0) {
      throw new Error("El precio debe ser mayor a 0");
    }
    datosActualizados.precio = new Prisma.Decimal(datos.precio);
  }
  if (datos.activa !== undefined) {
    datosActualizados.activa = datos.activa;
  }

  const ruta = await prisma.ruta.update({
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

  // Convertir Decimal a number
  return {
    ...ruta,
    precio: Number(ruta.precio),
  } as Ruta;
}

// Eliminar ruta
export async function eliminarRuta(id: string): Promise<void> {
  // Verificar que la ruta existe
  const ruta = await prisma.ruta.findUnique({
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

  if (!ruta) {
    throw new Error("Ruta no encontrada");
  }

  // Verificar que no tenga ventas o embarcaciones asociadas
  if (ruta._count.ventas > 0) {
    throw new Error(
      `No se puede eliminar la ruta porque tiene ${ruta._count.ventas} ventas asociadas`
    );
  }

  if (ruta._count.embarcacionRutas > 0) {
    throw new Error(
      `No se puede eliminar la ruta porque tiene ${ruta._count.embarcacionRutas} embarcaciones asociadas`
    );
  }

  await prisma.ruta.delete({
    where: { id },
  });
}

// Obtener estadísticas de rutas
export async function getEstadisticasRutas(): Promise<EstadisticasRutas> {
  const [totalRutas, rutasActivas, rutasConVentas, rutasRecientes] =
    await Promise.all([
      // Total de rutas
      prisma.ruta.count(),

      // Rutas activas
      prisma.ruta.count({
        where: { activa: true },
      }),

      // Rutas con ventas
      prisma.ruta.count({
        where: {
          ventas: {
            some: {},
          },
        },
      }),

      // Rutas creadas en los últimos 30 días
      prisma.ruta.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  const rutasInactivas = totalRutas - rutasActivas;

  return {
    totalRutas,
    rutasActivas,
    rutasInactivas,
    rutasConVentas,
    rutasRecientes,
  };
}

// Buscar rutas activas para selección (actualizar la función existente)
export async function getRutasActivas(): Promise<Ruta[]> {
  const rutas = await prisma.ruta.findMany({
    where: { activa: true },
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

  // Convertir Decimal a number
  return rutas.map((ruta) => ({
    ...ruta,
    precio: Number(ruta.precio),
  })) as Ruta[];
}

// Validar si una ruta existe y está activa
export async function validarRutaActiva(id: string): Promise<boolean> {
  const ruta = await prisma.ruta.findFirst({
    where: {
      id,
      activa: true,
    },
  });

  return !!ruta;
}

// Función para buscar rutas por origen y destino
export async function buscarRutasPorTrayecto(
  origen: string,
  destino: string
): Promise<Ruta[]> {
  const rutas = await prisma.ruta.findMany({
    where: {
      AND: [
        {
          puertoOrigen: {
            contains: origen,
            mode: "insensitive",
          },
        },
        {
          puertoDestino: {
            contains: destino,
            mode: "insensitive",
          },
        },
        {
          activa: true,
        },
      ],
    },
    include: {
      _count: {
        select: {
          ventas: true,
          embarcacionRutas: true,
        },
      },
    },
    orderBy: {
      precio: "asc", // Ordenar por precio ascendente
    },
  });

  // Convertir Decimal a number
  return rutas.map((ruta) => ({
    ...ruta,
    precio: Number(ruta.precio),
  })) as Ruta[];
}
