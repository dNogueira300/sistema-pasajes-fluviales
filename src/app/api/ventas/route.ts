// src/app/api/ventas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearFechaViaje } from "@/lib/utils/fecha-utils";
import {
  getVentas,
  crearVenta,
  buscarOCrearCliente,
} from "@/lib/actions/ventas";
import { EstadoVenta } from "@/types";

interface MetodoPago {
  tipo: string;
  monto: number;
}

// GET - Obtener ventas con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const filtros = {
      fechaInicio: searchParams.get("fechaInicio")
        ? new Date(searchParams.get("fechaInicio")!)
        : undefined,
      fechaFin: searchParams.get("fechaFin")
        ? new Date(searchParams.get("fechaFin")!)
        : undefined,
      estado: (searchParams.get("estado") as EstadoVenta) || undefined,
      busqueda: searchParams.get("busqueda") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      // Si no es admin, solo mostrar sus propias ventas
      userId: session.user.role === "VENDEDOR" ? session.user.id : undefined,
    };

    const result = await getVentas(filtros);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva venta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      cliente: clienteData,
      rutaId,
      embarcacionId,
      puertoEmbarqueId,
      fechaViaje,
      horaViaje,
      horaEmbarque,
      cantidadPasajes,
      tipoPago,
      metodoPago,
      metodosPago,
      observaciones,
      precioFinal,
      origenSeleccionado,
      destinoSeleccionado,
    } = body;

    // Validaciones básicas
    if (!clienteData.dni || !clienteData.nombre || !clienteData.apellido) {
      return NextResponse.json(
        { error: "Datos del cliente incompletos" },
        { status: 400 }
      );
    }

    if (
      !rutaId ||
      !embarcacionId ||
      !puertoEmbarqueId ||
      !fechaViaje ||
      !horaViaje ||
      !horaEmbarque
    ) {
      return NextResponse.json(
        { error: "Datos del viaje incompletos" },
        { status: 400 }
      );
    }

    if (!cantidadPasajes || cantidadPasajes < 1) {
      return NextResponse.json(
        { error: "Cantidad de pasajes inválida" },
        { status: 400 }
      );
    }

    // Validaciones para método de pago
    if (!tipoPago || (tipoPago !== "UNICO" && tipoPago !== "HIBRIDO")) {
      return NextResponse.json(
        { error: "Tipo de pago inválido" },
        { status: 400 }
      );
    }

    if (tipoPago === "UNICO" && !metodoPago) {
      return NextResponse.json(
        { error: "Método de pago requerido para pago único" },
        { status: 400 }
      );
    }

    if (tipoPago === "HIBRIDO") {
      if (
        !metodosPago ||
        !Array.isArray(metodosPago) ||
        metodosPago.length === 0
      ) {
        return NextResponse.json(
          { error: "Métodos de pago requeridos para pago híbrido" },
          { status: 400 }
        );
      }

      // Validar que cada método tenga los campos requeridos
      for (const metodo of metodosPago) {
        if (!metodo.tipo || !metodo.monto || metodo.monto <= 0) {
          return NextResponse.json(
            { error: "Datos incompletos en métodos de pago" },
            { status: 400 }
          );
        }
      }
    }

    // Buscar o crear cliente
    const cliente = await buscarOCrearCliente(clienteData);

    // Obtener información de la ruta para el precio
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const ruta = await prisma.ruta.findUnique({
      where: { id: rutaId },
    });

    if (!ruta) {
      return NextResponse.json(
        { error: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    // Validar que se envió el precio final
    if (!precioFinal || precioFinal <= 0) {
      return NextResponse.json(
        { error: "Precio final inválido" },
        { status: 400 }
      );
    }

    // Calcular total esperado usando el precio personalizado
    const totalEsperado = precioFinal * cantidadPasajes;

    // Validar montos para pago híbrido
    if (tipoPago === "HIBRIDO") {
      const totalPagado = metodosPago.reduce(
        (sum: number, metodo: MetodoPago) => sum + metodo.monto,
        0
      );

      // Permitir una diferencia mínima por redondeo (0.01)
      if (Math.abs(totalPagado - totalEsperado) > 0.01) {
        return NextResponse.json(
          {
            error: `El total de los métodos de pago (S/ ${totalPagado.toFixed(
              2
            )}) no coincide con el total de la venta (S/ ${totalEsperado.toFixed(
              2
            )})`,
          },
          { status: 400 }
        );
      }
    }

    // Validar que la fecha de viaje no sea anterior a hoy
    const fechaViajeObj = crearFechaViaje(fechaViaje);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaViajeObj < hoy) {
      return NextResponse.json(
        { error: "La fecha de viaje no puede ser anterior a hoy" },
        { status: 400 }
      );
    }

    // Preparar datos para la creación de venta
    const datosVenta = {
      clienteId: cliente.id,
      rutaId,
      embarcacionId,
      userId: session.user.id,
      puertoEmbarqueId,
      fechaViaje: crearFechaViaje(fechaViaje),
      horaEmbarque,
      horaViaje,
      cantidadPasajes,
      // USAR LOS VALORES PERSONALIZADOS EN LUGAR DE LOS DE LA RUTA
      puertoOrigen: origenSeleccionado || ruta.puertoOrigen,
      puertoDestino: destinoSeleccionado || ruta.puertoDestino,
      precioUnitario: precioFinal, // Usar precio personalizado
      tipoPago,
      metodoPago: tipoPago === "UNICO" ? metodoPago : "HIBRIDO",
      metodosPago: tipoPago === "HIBRIDO" ? metodosPago : null,
      observaciones,
    };

    // Crear la venta
    const venta = await crearVenta(datosVenta);

    return NextResponse.json(venta, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error creando venta:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
