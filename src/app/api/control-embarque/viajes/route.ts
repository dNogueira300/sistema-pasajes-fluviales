import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOperadorActivo } from "@/lib/middleware/auth";

interface ViajeAgrupado {
  fechaViaje: string;
  horaViaje: string;
  total: number;
  embarcados: number;
  pendientes: number;
  noEmbarcados: number;
  ruta: {
    id: string;
    nombre: string;
    puertoOrigen: string;
    puertoDestino: string;
  } | null;
}

// GET /api/control-embarque/viajes - Viajes del operador
export async function GET() {
  try {
    const operador = await requireOperadorActivo();

    // Obtener inicio del día de hoy en zona horaria local
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);

    // Obtener ventas confirmadas para la embarcación del operador desde hoy en adelante
    const ventas = await prisma.venta.findMany({
      where: {
        embarcacionId: operador.embarcacionAsignadaId!,
        fechaViaje: { gte: hoy },
        estado: "CONFIRMADA",
      },
      select: {
        id: true,
        fechaViaje: true,
        horaViaje: true,
        cantidadPasajes: true,
        rutaId: true,
        ruta: {
          select: {
            id: true,
            nombre: true,
            puertoOrigen: true,
            puertoDestino: true,
          },
        },
        controlEmbarque: {
          select: {
            estadoEmbarque: true,
          },
        },
      },
      orderBy: [{ fechaViaje: "asc" }, { horaViaje: "asc" }],
    });

    // Agrupar por fechaViaje + horaViaje
    const viajesMap = new Map<string, ViajeAgrupado>();

    for (const venta of ventas) {
      const fechaStr = venta.fechaViaje.toISOString().split("T")[0];
      const key = `${fechaStr}_${venta.horaViaje}`;

      if (!viajesMap.has(key)) {
        viajesMap.set(key, {
          fechaViaje: fechaStr,
          horaViaje: venta.horaViaje,
          total: 0,
          embarcados: 0,
          pendientes: 0,
          noEmbarcados: 0,
          ruta: venta.ruta,
        });
      }

      const viaje = viajesMap.get(key)!;
      viaje.total += venta.cantidadPasajes;

      if (venta.controlEmbarque) {
        switch (venta.controlEmbarque.estadoEmbarque) {
          case "EMBARCADO":
            viaje.embarcados += venta.cantidadPasajes;
            break;
          case "NO_EMBARCADO":
            viaje.noEmbarcados += venta.cantidadPasajes;
            break;
          default:
            viaje.pendientes += venta.cantidadPasajes;
        }
      } else {
        viaje.pendientes += venta.cantidadPasajes;
      }
    }

    const viajes = Array.from(viajesMap.values());

    return NextResponse.json({ success: true, data: viajes });
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
    console.error("Error al obtener viajes:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
