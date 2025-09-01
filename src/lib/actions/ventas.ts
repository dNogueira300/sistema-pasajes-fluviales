import { PrismaClient } from "@prisma/client";
import { EstadoVenta } from "@/types";

const prisma = new PrismaClient();

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
  });

  if (!embarcacion) {
    throw new Error("Embarcación no encontrada");
  }

  // Contar pasajes vendidos para ese viaje específico
  const pasajesVendidos = await prisma.venta.aggregate({
    where: {
      embarcacionId,
      rutaId,
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
      horaViaje,
      estado: {
        in: ["CONFIRMADA"],
      },
    },
    _sum: {
      cantidadPasajes: true,
    },
  });

  const totalVendidos = pasajesVendidos._sum.cantidadPasajes || 0;
  const disponibles = embarcacion.capacidad - totalVendidos;

  return {
    capacidadTotal: embarcacion.capacidad,
    vendidos: totalVendidos,
    disponibles,
    puedeVender: disponibles >= cantidadSolicitada,
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
    if (clienteData.telefono || clienteData.email) {
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          telefono: clienteData.telefono || cliente.telefono,
          email: clienteData.email || cliente.email,
          nombre: clienteData.nombre,
          apellido: clienteData.apellido,
        },
      });
    }
  }

  return cliente;
}

// Crear venta
export async function crearVenta(ventaData: {
  clienteId: string;
  rutaId: string;
  embarcacionId: string;
  userId: string;
  fechaViaje: Date;
  horaEmbarque: string;
  horaViaje: string;
  cantidadPasajes: number;
  puertoOrigen: string;
  puertoDestino: string;
  precioUnitario: number;
  metodoPago?: string;
  observaciones?: string;
}) {
  // Verificar disponibilidad una vez más antes de crear
  const disponibilidad = await verificarDisponibilidad(
    ventaData.embarcacionId,
    ventaData.rutaId,
    ventaData.fechaViaje,
    ventaData.horaViaje,
    ventaData.cantidadPasajes
  );

  if (!disponibilidad.puedeVender) {
    throw new Error(
      `Solo hay ${disponibilidad.disponibles} asientos disponibles`
    );
  }

  // Calcular totales
  const subtotal = ventaData.precioUnitario * ventaData.cantidadPasajes;
  const impuestos = 0; // Por ahora no aplicamos impuestos
  const total = subtotal + impuestos;

  // Generar número de venta
  const numeroVenta = await generateVentaNumber();

  // Crear la venta
  const venta = await prisma.venta.create({
    data: {
      numeroVenta,
      clienteId: ventaData.clienteId,
      rutaId: ventaData.rutaId,
      embarcacionId: ventaData.embarcacionId,
      userId: ventaData.userId,
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
      metodoPago: ventaData.metodoPago || "EFECTIVO",
      observaciones: ventaData.observaciones,
      estado: "CONFIRMADA",
    },
    include: {
      cliente: true,
      ruta: true,
      embarcacion: true,
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
}

// Obtener ventas con filtros
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
    // Solo aplicar filtro de fecha si ambos campos tienen valor
    const fechaInicio = new Date(filtros.fechaInicio + "T00:00:00-05:00");
    const fechaFin = new Date(filtros.fechaFin + "T23:59:59-05:00");

    whereClause.fechaVenta = {
      gte: fechaInicio,
      lte: fechaFin,
    };
  } else if (filtros?.fechaInicio) {
    // Solo fecha inicio
    const fechaInicio = new Date(filtros.fechaInicio + "T00:00:00-05:00");
    whereClause.fechaVenta = {
      gte: fechaInicio,
    };
  } else if (filtros?.fechaFin) {
    // Solo fecha fin
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
      { numeroVenta: { contains: filtros.busqueda } },
      { cliente: { nombre: { contains: filtros.busqueda } } },
      { cliente: { apellido: { contains: filtros.busqueda } } },
      { cliente: { dni: { contains: filtros.busqueda } } },
    ];
  }

  const [ventas, total] = await Promise.all([
    prisma.venta.findMany({
      where: whereClause,
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
      orderBy: { fechaVenta: "desc" },
      skip,
      take: limit,
    }),
    prisma.venta.count({ where: whereClause }),
  ]);

  // Convertir precios Decimal a number
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
        },
      },
    },
  });
}
