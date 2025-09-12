import { PrismaClient } from "@prisma/client";
import { TipoAnulacion } from "@/types";

// Crear una sola instancia global de Prisma (igual que en ventas.ts)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Interfaces
interface FiltrosAnulaciones {
  fechaInicio?: string | null; // Cambiar a string | null
  fechaFin?: string | null; // Cambiar a string | null
  tipoAnulacion?: TipoAnulacion | null; // Cambiar a TipoAnulacion | null
  usuarioId?: string | null; // Cambiar a string | null
  busqueda?: string | null; // Cambiar a string | null
  page: number;
  limit: number;
}

interface MotivoComun {
  motivo: string;
  cantidad: number;
}

interface AnulacionPorDia {
  fecha: string;
  cantidad: number;
  asientos_liberados: number;
}

// Obtener anulaciones con filtros
export async function getAnulaciones(filtros: FiltrosAnulaciones) {
  try {
    const page = filtros.page || 1;
    const limit = filtros.limit || 10;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const whereConditions: Record<string, unknown> = {};

    // Filtro por fechas
    if (filtros.fechaInicio || filtros.fechaFin) {
      whereConditions.fechaAnulacion = {};
      if (filtros.fechaInicio) {
        (whereConditions.fechaAnulacion as Record<string, unknown>).gte =
          new Date(filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        const fechaFin = new Date(filtros.fechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        (whereConditions.fechaAnulacion as Record<string, unknown>).lte =
          fechaFin;
      }
    }

    // Filtro por tipo de anulación
    if (filtros.tipoAnulacion) {
      whereConditions.tipoAnulacion = filtros.tipoAnulacion;
    }

    // Filtro por usuario
    if (filtros.usuarioId) {
      whereConditions.usuarioId = filtros.usuarioId;
    }

    // Filtro por búsqueda (número de venta o nombre de cliente)
    if (filtros.busqueda) {
      whereConditions.OR = [
        {
          venta: {
            numeroVenta: {
              contains: filtros.busqueda,
              mode: "insensitive",
            },
          },
        },
        {
          venta: {
            cliente: {
              OR: [
                {
                  nombre: {
                    contains: filtros.busqueda,
                    mode: "insensitive",
                  },
                },
                {
                  apellido: {
                    contains: filtros.busqueda,
                    mode: "insensitive",
                  },
                },
                {
                  dni: {
                    contains: filtros.busqueda,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ];
    }

    // Obtener anulaciones y total
    const [anulaciones, total] = await Promise.all([
      prisma.anulacion.findMany({
        where: whereConditions,
        include: {
          venta: {
            include: {
              cliente: true,
              ruta: true,
              embarcacion: true,
              vendedor: {
                select: {
                  nombre: true,
                  apellido: true,
                },
              },
            },
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: {
          fechaAnulacion: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.anulacion.count({
        where: whereConditions,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      anulaciones,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Error en getAnulaciones:", error);
    throw error;
  }
}

// Obtener estadísticas de anulaciones
export async function getEstadisticasAnulaciones(
  periodo: string = "mes",
  usuarioId?: string
) {
  try {
    // Calcular fechas según el período
    const ahora = new Date();
    let fechaInicio: Date;

    switch (periodo) {
      case "dia":
        fechaInicio = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate()
        );
        break;
      case "semana":
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        break;
      case "mes":
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      case "anio":
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        break;
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    // Condiciones base
    const whereConditions: Record<string, unknown> = {
      fechaAnulacion: {
        gte: fechaInicio,
        lte: ahora,
      },
    };

    if (usuarioId) {
      whereConditions.usuarioId = usuarioId;
    }

    // Obtener estadísticas básicas
    const [
      totalAnulaciones,
      totalAnulacionesHoy,
      totalReembolsos,
      motivosComunes,
      resumenMontos,
    ] = await Promise.all([
      prisma.anulacion.count({ where: whereConditions }),
      prisma.anulacion.count({
        where: {
          ...whereConditions,
          fechaAnulacion: {
            gte: new Date(
              ahora.getFullYear(),
              ahora.getMonth(),
              ahora.getDate()
            ),
            lte: ahora,
          },
        },
      }),
      prisma.anulacion.count({
        where: { ...whereConditions, tipoAnulacion: "REEMBOLSO" },
      }),
      prisma.anulacion.groupBy({
        by: ["motivo"],
        where: whereConditions,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.anulacion.aggregate({
        where: whereConditions,
        _sum: { montoReembolso: true, asientosLiberados: true },
      }),
    ]);

    const motivosFormateados: MotivoComun[] = motivosComunes.map((item) => ({
      motivo: item.motivo,
      cantidad: item._count.id,
    }));

    return {
      totalAnulaciones,
      totalAnulacionesHoy,
      totalReembolsos,
      montoTotalReembolsado: Number(resumenMontos._sum.montoReembolso || 0),
      asientosTotalesLiberados: resumenMontos._sum.asientosLiberados || 0,
      motivosComunes: motivosFormateados,
      anulacionesPorDia: [] as AnulacionPorDia[], // Por ahora vacío, puedes implementar después
      periodo,
    };
  } catch (error) {
    console.error("Error en getEstadisticasAnulaciones:", error);
    throw error;
  }
}

// Crear anulación
export async function crearAnulacion(anulacionData: {
  ventaId: string;
  motivo: string;
  observaciones?: string;
  usuarioId: string;
  tipoAnulacion: TipoAnulacion;
  montoReembolso?: number;
}) {
  try {
    // Verificar que la venta existe y está confirmada
    const venta = await prisma.venta.findUnique({
      where: { id: anulacionData.ventaId },
      include: {
        cliente: true,
        anulacion: true,
        ruta: true,
        embarcacion: true,
      },
    });

    if (!venta) {
      throw new Error("Venta no encontrada");
    }

    if (venta.estado !== "CONFIRMADA") {
      throw new Error("Solo se pueden anular ventas confirmadas");
    }

    if (venta.anulacion) {
      throw new Error("Esta venta ya ha sido anulada");
    }

    // Verificar que no haya pasado la fecha y hora del viaje
    const ahora = new Date();
    const fechaViaje = new Date(venta.fechaViaje);

    // Crear la fecha y hora completa del viaje
    const [horas, minutos] = venta.horaViaje.split(":").map(Number);
    fechaViaje.setHours(horas, minutos, 0, 0);

    // Verificar si ya pasó la fecha y hora del viaje
    if (ahora >= fechaViaje) {
      const fechaFormateada = fechaViaje.toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      throw new Error(
        `No se puede anular esta venta porque ya pasó la fecha y hora del viaje programado.\n\n` +
          `Fecha del viaje: ${fechaFormateada} a las ${venta.horaViaje}\n` +
          `Ruta: ${venta.ruta.nombre}\n` +
          `Embarcación: ${venta.embarcacion.nombre}\n\n` +
          `Para gestionar esta situación, por favor contacte al administrador del sistema.`
      );
    }

    // Calcular tiempo restante hasta el viaje (para información adicional)
    const tiempoRestante = fechaViaje.getTime() - ahora.getTime();
    const horasRestantes = Math.ceil(tiempoRestante / (1000 * 60 * 60));

    // Usar transacción para la anulación
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear registro de anulación
      const anulacion = await tx.anulacion.create({
        data: {
          ventaId: anulacionData.ventaId,
          motivo: anulacionData.motivo,
          observaciones: anulacionData.observaciones,
          usuarioId: anulacionData.usuarioId,
          asientosLiberados: venta.cantidadPasajes,
          montoReembolso:
            anulacionData.tipoAnulacion === "REEMBOLSO"
              ? anulacionData.montoReembolso
              : null,
          tipoAnulacion: anulacionData.tipoAnulacion,
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              username: true,
            },
          },
        },
      });

      // 2. Actualizar estado de la venta
      const ventaActualizada = await tx.venta.update({
        where: { id: anulacionData.ventaId },
        data: {
          estado:
            anulacionData.tipoAnulacion === "REEMBOLSO"
              ? "REEMBOLSADA"
              : "ANULADA",
          observaciones: anulacionData.observaciones
            ? `${venta.observaciones || ""}\n[ANULADA] ${
                anulacionData.observaciones
              }`.trim()
            : `${venta.observaciones || ""}\n[ANULADA] ${
                anulacionData.motivo
              }`.trim(),
        },
        include: {
          cliente: true,
          ruta: true,
          embarcacion: true,
          vendedor: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
          anulacion: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                  apellido: true,
                },
              },
            },
          },
        },
      });

      return { anulacion, ventaActualizada };
    });

    console.log(`✅ Venta ${venta.numeroVenta} anulada exitosamente`);
    console.log(`📊 Asientos liberados: ${venta.cantidadPasajes}`);
    console.log(`⏰ Tiempo restante hasta el viaje: ${horasRestantes} horas`);

    return {
      success: true,
      anulacion: resultado.anulacion,
      ventaActualizada: resultado.ventaActualizada,
      asientosLiberados: venta.cantidadPasajes,
      mensaje: `Venta ${venta.numeroVenta} anulada exitosamente. ${venta.cantidadPasajes} asiento(s) liberado(s).`,
    };
  } catch (error) {
    console.error("Error en crearAnulacion:", error);
    throw error;
  }
}
