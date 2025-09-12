import { PrismaClient } from "@prisma/client";
import { EstadoVenta } from "@/types";

interface MetodoPago {
  tipo: string;
  monto: number;
}

// Crear una sola instancia global de Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Generar número único de venta
export async function generateVentaNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");

  // Contar ventas del día
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const ventasHoy = await prisma.venta.count({
    where: {
      fechaVenta: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  const numero = (ventasHoy + 1).toString().padStart(3, "0");
  return `V${year}${month}${day}-${numero}`;
}

// Obtener puertos de embarque activos
export async function getPuertosEmbarque() {
  return await prisma.puertoEmbarque.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });
}

// Obtener rutas activas
export async function getRutasActivas() {
  const rutas = await prisma.ruta.findMany({
    where: { activa: true },
    include: {
      embarcacionRutas: {
        where: { activa: true },
        include: {
          embarcacion: true,
        },
      },
    },
    orderBy: { nombre: "asc" },
  });

  // Convertir precios Decimal a number
  return rutas.map((ruta) => ({
    ...ruta,
    precio: parseFloat(ruta.precio.toString()),
  }));
}

// Obtener embarcaciones por ruta
export async function getEmbarcacionesByRuta(rutaId: string) {
  const embarcacionRutas = await prisma.embarcacionRuta.findMany({
    where: {
      rutaId,
      activa: true,
    },
    include: {
      embarcacion: true,
    },
  });

  // Filtrar solo embarcaciones activas
  return embarcacionRutas.filter((er) => er.embarcacion.estado === "ACTIVA");
}

// Verificar disponibilidad de asientos
export async function verificarDisponibilidad(
  embarcacionId: string,
  rutaId: string,
  fechaViaje: Date,
  horaViaje: string,
  cantidadSolicitada: number
) {
  // Obtener capacidad de la embarcación
  const embarcacion = await prisma.embarcacion.findUnique({
    where: { id: embarcacionId },
    select: { capacidad: true, estado: true },
  });

  if (!embarcacion) {
    throw new Error("Embarcación no encontrada");
  }

  if (embarcacion.estado !== "ACTIVA") {
    throw new Error("Embarcación no está activa");
  }

  // Verificar que la embarcación está asignada a la ruta con esa hora
  const embarcacionRuta = await prisma.embarcacionRuta.findFirst({
    where: {
      embarcacionId,
      rutaId,
      activa: true,
      horasSalida: {
        has: horaViaje,
      },
    },
  });

  if (!embarcacionRuta) {
    throw new Error("La embarcación no opera en esa ruta y horario");
  }

  const fechaConsulta = new Date(fechaViaje);

  // Inicio del día (00:00:00)
  const inicioDia = new Date(
    fechaConsulta.getFullYear(),
    fechaConsulta.getMonth(),
    fechaConsulta.getDate(),
    0,
    0,
    0,
    0
  );

  // Fin del día (23:59:59)
  const finDia = new Date(
    fechaConsulta.getFullYear(),
    fechaConsulta.getMonth(),
    fechaConsulta.getDate(),
    23,
    59,
    59,
    999
  );

  console.log("🔍 Verificando disponibilidad:", {
    embarcacionId,
    rutaId,
    fechaViaje: fechaViaje.toISOString(),
    horaViaje,
    inicioDia: inicioDia.toISOString(),
    finDia: finDia.toISOString(),
    cantidadSolicitada,
  });

  // Contar pasajes vendidos para ese viaje específico
  const ventasExistentes = await prisma.venta.findMany({
    where: {
      embarcacionId,
      rutaId,
      fechaViaje: {
        gte: inicioDia,
        lte: finDia,
      },
      horaViaje: horaViaje,
      estado: {
        in: ["CONFIRMADA"], // Solo contar ventas confirmadas
      },
    },
    select: {
      id: true,
      numeroVenta: true,
      cantidadPasajes: true,
      fechaViaje: true,
      horaViaje: true,
      estado: true,
    },
  });

  console.log("📋 Ventas encontradas:", ventasExistentes);

  // Sumar total de pasajes vendidos
  const totalVendidos = ventasExistentes.reduce(
    (sum, venta) => sum + venta.cantidadPasajes,
    0
  );

  const disponibles = embarcacion.capacidad - totalVendidos;

  console.log("📊 Resumen disponibilidad:", {
    capacidadTotal: embarcacion.capacidad,
    totalVendidos,
    disponibles,
    puedeVender: disponibles >= cantidadSolicitada,
  });

  return {
    capacidadTotal: embarcacion.capacidad,
    vendidos: totalVendidos,
    disponibles,
    puedeVender: disponibles >= cantidadSolicitada,
    mensaje:
      disponibles >= cantidadSolicitada
        ? `Hay ${disponibles} asientos disponibles`
        : `Solo quedan ${disponibles} asientos disponibles. No se puede vender ${cantidadSolicitada} pasajes.`,
  };
}

// Buscar o crear cliente
export async function buscarOCrearCliente(clienteData: {
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  nacionalidad?: string;
}) {
  // Buscar cliente existente por DNI
  let cliente = await prisma.cliente.findUnique({
    where: { dni: clienteData.dni },
  });

  // Si no existe, crearlo
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        dni: clienteData.dni,
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        telefono: clienteData.telefono || "",
        email: clienteData.email || "",
        nacionalidad: clienteData.nacionalidad || "Peruana",
      },
    });
  } else {
    // Si existe, actualizar información si es necesaria
    const datosAActualizar: Partial<{
      nombre: string;
      apellido: string;
      telefono: string;
      email: string;
      nacionalidad: string;
    }> = {};

    if (clienteData.nombre !== cliente.nombre) {
      datosAActualizar.nombre = clienteData.nombre;
    }
    if (clienteData.apellido !== cliente.apellido) {
      datosAActualizar.apellido = clienteData.apellido;
    }
    if (clienteData.telefono && cliente.telefono !== clienteData.telefono) {
      datosAActualizar.telefono = clienteData.telefono;
    }
    if (clienteData.email && cliente.email !== clienteData.email) {
      datosAActualizar.email = clienteData.email;
    }
    if (
      clienteData.nacionalidad &&
      cliente.nacionalidad !== clienteData.nacionalidad
    ) {
      datosAActualizar.nacionalidad = clienteData.nacionalidad;
    }

    if (Object.keys(datosAActualizar).length > 0) {
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: datosAActualizar,
      });
    }
  }

  return cliente;
}

// Crear venta - VERSIÓN SIMPLIFICADA SIN TRANSACCIONES COMPLEJAS
export async function crearVenta(ventaData: {
  clienteId: string;
  rutaId: string;
  embarcacionId: string;
  userId: string;
  puertoEmbarqueId: string;
  fechaViaje: Date;
  horaEmbarque: string;
  horaViaje: string;
  cantidadPasajes: number;
  puertoOrigen: string;
  puertoDestino: string;
  precioUnitario: number;
  tipoPago: "UNICO" | "HIBRIDO";
  metodoPago?: string;
  metodosPago?: MetodoPago[];
  observaciones?: string;
}) {
  try {
    // 1. Verificaciones previas sin transacción
    const puertoEmbarque = await prisma.puertoEmbarque.findUnique({
      where: { id: ventaData.puertoEmbarqueId },
    });

    if (!puertoEmbarque || !puertoEmbarque.activo) {
      throw new Error("Puerto de embarque no válido");
    }

    // 2. Verificar disponibilidad una vez más
    const disponibilidad = await verificarDisponibilidad(
      ventaData.embarcacionId,
      ventaData.rutaId,
      ventaData.fechaViaje,
      ventaData.horaViaje,
      ventaData.cantidadPasajes
    );

    if (!disponibilidad.puedeVender) {
      throw new Error(
        `Solo hay ${disponibilidad.disponibles} asientos disponibles. No se puede vender ${ventaData.cantidadPasajes} pasajes.`
      );
    }

    // 3. Calcular totales
    const subtotal = ventaData.precioUnitario * ventaData.cantidadPasajes;
    const impuestos = 0;
    const total = subtotal + impuestos;

    // 4. Validar totales para pago híbrido
    if (ventaData.tipoPago === "HIBRIDO" && ventaData.metodosPago) {
      const totalPagado = ventaData.metodosPago.reduce(
        (sum: number, metodo: MetodoPago) => sum + metodo.monto,
        0
      );
      if (Math.abs(totalPagado - total) > 0.01) {
        throw new Error(
          `El total de los métodos de pago (S/ ${totalPagado.toFixed(
            2
          )}) no coincide con el total de la venta (S/ ${total.toFixed(2)})`
        );
      }
    }

    // 5. Generar número de venta
    const numeroVenta = await generateVentaNumber();

    // 6. Crear la venta directamente (sin transacción por ahora)
    const venta = await prisma.venta.create({
      data: {
        numeroVenta,
        clienteId: ventaData.clienteId,
        rutaId: ventaData.rutaId,
        embarcacionId: ventaData.embarcacionId,
        userId: ventaData.userId,
        puertoEmbarqueId: ventaData.puertoEmbarqueId,
        fechaViaje: ventaData.fechaViaje,
        horaEmbarque: ventaData.horaEmbarque,
        horaViaje: ventaData.horaViaje,
        cantidadPasajes: ventaData.cantidadPasajes,
        puertoOrigen: ventaData.puertoOrigen,
        puertoDestino: ventaData.puertoDestino,
        precioUnitario: ventaData.precioUnitario,
        subtotal,
        impuestos,
        total,
        tipoPago: ventaData.tipoPago,
        metodoPago:
          ventaData.metodoPago ||
          (ventaData.tipoPago === "HIBRIDO" ? "HIBRIDO" : "EFECTIVO"),
        metodosPago: ventaData.metodosPago
          ? JSON.parse(JSON.stringify(ventaData.metodosPago))
          : null,
        observaciones: ventaData.observaciones,
        estado: "CONFIRMADA",
      },
      include: {
        cliente: true,
        ruta: true,
        embarcacion: true,
        puertoEmbarque: true,
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    return venta;
  } catch (error) {
    console.error("Error en crearVenta:", error);
    throw error;
  }
}

// Resto de funciones sin cambios...
export async function getVentas(filtros?: {
  fechaInicio?: Date;
  fechaFin?: Date;
  estado?: EstadoVenta;
  clienteId?: string;
  rutaId?: string;
  userId?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}) {
  const page = filtros?.page || 1;
  const limit = filtros?.limit || 10;
  const skip = (page - 1) * limit;

  const whereClause: import("@prisma/client").Prisma.VentaWhereInput = {};

  if (filtros?.fechaInicio && filtros?.fechaFin) {
    const fechaInicio = new Date(filtros.fechaInicio + "T00:00:00-05:00");
    const fechaFin = new Date(filtros.fechaFin + "T23:59:59-05:00");

    whereClause.fechaVenta = {
      gte: fechaInicio,
      lte: fechaFin,
    };
  } else if (filtros?.fechaInicio) {
    const fechaInicio = new Date(filtros.fechaInicio + "T00:00:00-05:00");
    whereClause.fechaVenta = {
      gte: fechaInicio,
    };
  } else if (filtros?.fechaFin) {
    const fechaFin = new Date(filtros.fechaFin + "T23:59:59-05:00");
    whereClause.fechaVenta = {
      lte: fechaFin,
    };
  }

  if (filtros?.estado) {
    whereClause.estado = filtros.estado;
  }

  if (filtros?.clienteId) {
    whereClause.clienteId = filtros.clienteId;
  }

  if (filtros?.rutaId) {
    whereClause.rutaId = filtros.rutaId;
  }

  if (filtros?.userId) {
    whereClause.userId = filtros.userId;
  }

  if (filtros?.busqueda) {
    whereClause.OR = [
      { numeroVenta: { contains: filtros.busqueda, mode: "insensitive" } },
      {
        cliente: {
          nombre: { contains: filtros.busqueda, mode: "insensitive" },
        },
      },
      {
        cliente: {
          apellido: { contains: filtros.busqueda, mode: "insensitive" },
        },
      },
      { cliente: { dni: { contains: filtros.busqueda, mode: "insensitive" } } },
    ];
  }

  const [ventas, total] = await Promise.all([
    prisma.venta.findMany({
      where: whereClause,
      include: {
        cliente: true,
        ruta: true,
        embarcacion: true,
        puertoEmbarque: true,
        vendedor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { fechaVenta: "desc" },
      skip,
      take: limit,
    }),
    prisma.venta.count({ where: whereClause }),
  ]);

  const ventasConPreciosConvertidos = ventas.map((venta) => ({
    ...venta,
    precioUnitario: parseFloat(venta.precioUnitario.toString()),
    subtotal: parseFloat(venta.subtotal.toString()),
    impuestos: parseFloat(venta.impuestos.toString()),
    total: parseFloat(venta.total.toString()),
    ruta: {
      ...venta.ruta,
      precio: parseFloat(venta.ruta.precio.toString()),
    },
  }));

  return {
    ventas: ventasConPreciosConvertidos,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// Anular venta
export async function anularVenta(ventaId: string, motivo?: string) {
  return await prisma.venta.update({
    where: { id: ventaId },
    data: {
      estado: "ANULADA",
      observaciones: motivo ? `ANULADA: ${motivo}` : "ANULADA",
    },
    include: {
      cliente: true,
      ruta: true,
      embarcacion: true,
      puertoEmbarque: true,
    },
  });
}

// Buscar cliente por DNI
export async function buscarClientePorDNI(dni: string) {
  return await prisma.cliente.findUnique({
    where: { dni },
    include: {
      ventas: {
        orderBy: { fechaVenta: "desc" },
        take: 5,
        include: {
          ruta: true,
          puertoEmbarque: true,
        },
      },
    },
  });
}
