import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOperadorActivo } from "@/lib/middleware/auth";

interface RouteParams {
  params: Promise<{ fecha: string; hora: string }>;
}

// GET /api/control-embarque/lista/:fecha/:hora - Lista de pasajeros
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const operador = await requireOperadorActivo();
    const { fecha, hora } = await params;

    // Validar formato de fecha y crear rango para el día
    const [year, month, day] = fecha.split("-").map(Number);
    if (!year || !month || !day) {
      return NextResponse.json(
        { success: false, error: "Formato de fecha inválido. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Crear rango de fecha para cubrir todo el día sin importar zona horaria
    const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);
    const fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Validar formato de hora (HH:MM)
    const horaDecoded = decodeURIComponent(hora);
    if (!/^\d{2}:\d{2}$/.test(horaDecoded)) {
      return NextResponse.json(
        { success: false, error: "Formato de hora inválido. Use HH:MM" },
        { status: 400 }
      );
    }

    const embarcacionId = operador.embarcacionAsignadaId!;

    // Obtener ventas confirmadas para este viaje
    const ventas = await prisma.venta.findMany({
      where: {
        embarcacionId,
        fechaViaje: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        horaViaje: horaDecoded,
        estado: "CONFIRMADA",
      },
      select: {
        id: true,
        numeroVenta: true,
        cantidadPasajes: true,
        cliente: {
          select: {
            id: true,
            dni: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
        puertoEmbarque: {
          select: {
            id: true,
            nombre: true,
          },
        },
        ruta: {
          select: {
            id: true,
            nombre: true,
            puertoOrigen: true,
            puertoDestino: true,
          },
        },
        embarcacion: {
          select: {
            id: true,
            nombre: true,
            capacidad: true,
          },
        },
        controlEmbarque: {
          select: {
            id: true,
            estadoEmbarque: true,
            horaRegistro: true,
            observaciones: true,
            operador: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
      orderBy: [
        { controlEmbarque: { estadoEmbarque: "asc" } },
      ],
    });

    // Si no hay registros de controlEmbarque, crearlos automáticamente
    const ventasSinControl = ventas.filter((v) => !v.controlEmbarque);

    if (ventasSinControl.length > 0) {
      // Obtener rutaId de la primera venta
      const rutaId = ventas[0]?.ruta.id;

      if (rutaId) {
        await prisma.controlEmbarque.createMany({
          data: ventasSinControl.map((v) => ({
            ventaId: v.id,
            operadorId: operador.id,
            embarcacionId,
            rutaId,
            fechaViaje: fechaInicio,
            horaViaje: horaDecoded,
            estadoEmbarque: "PENDIENTE" as const,
            tipoRegistro: "EMBARQUE" as const,
          })),
          skipDuplicates: true,
        });

        // Re-consultar con los controles creados
        const ventasActualizadas = await prisma.venta.findMany({
          where: {
            embarcacionId,
            fechaViaje: {
              gte: fechaInicio,
              lte: fechaFin,
            },
            horaViaje: horaDecoded,
            estado: "CONFIRMADA",
          },
          select: {
            id: true,
            numeroVenta: true,
            cantidadPasajes: true,
            cliente: {
              select: {
                id: true,
                dni: true,
                nombre: true,
                apellido: true,
                telefono: true,
              },
            },
            puertoEmbarque: {
              select: {
                id: true,
                nombre: true,
              },
            },
            ruta: {
              select: {
                id: true,
                nombre: true,
                puertoOrigen: true,
                puertoDestino: true,
              },
            },
            embarcacion: {
              select: {
                id: true,
                nombre: true,
                capacidad: true,
              },
            },
            controlEmbarque: {
              select: {
                id: true,
                estadoEmbarque: true,
                horaRegistro: true,
                observaciones: true,
                operador: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
        });

        return NextResponse.json({ success: true, data: ventasActualizadas });
      }
    }

    return NextResponse.json({ success: true, data: ventas });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "No autorizado") {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
      }
      if (
        error.message === "Usuario no es operador" ||
        error.message === "Operador inactivo" ||
        error.message === "Operador sin embarcación asignada"
      ) {
        return NextResponse.json({ success: false, error: error.message }, { status: 403 });
      }
    }
    console.error("Error al obtener lista de pasajeros:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
