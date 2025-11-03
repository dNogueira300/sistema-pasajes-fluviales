// src/app/api/ventas/[id]/comprobante/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MetodoPago,
  generarComprobanteA4,
} from "@/lib/utils/comprobante-utils"; //

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const ventaId = decodeURIComponent(params.id);

    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
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
    });

    if (!venta) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    if (session.user.role === "VENDEDOR" && venta.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    let metodosPagoArray: MetodoPago[] | undefined;
    if (venta.metodosPago) {
      if (typeof venta.metodosPago === "object") {
        metodosPagoArray = venta.metodosPago as unknown as MetodoPago[];
      } else if (typeof venta.metodosPago === "string") {
        try {
          metodosPagoArray = JSON.parse(venta.metodosPago);
        } catch (error) {
          console.error("Error parseando metodosPago:", error);
        }
      }
    }

    const ventaFormateada = {
      id: venta.id,
      numeroVenta: venta.numeroVenta,
      fechaVenta: venta.fechaVenta.toISOString(),
      fechaViaje: venta.fechaViaje.toISOString(),
      horaViaje: venta.horaViaje,
      horaEmbarque: venta.horaEmbarque,
      cantidadPasajes: venta.cantidadPasajes,
      precioUnitario: Number(venta.precioUnitario),
      subtotal: Number(venta.subtotal),
      impuestos: Number(venta.impuestos),
      total: Number(venta.total),
      tipoPago: venta.tipoPago as
        | "EFECTIVO"
        | "TARJETA"
        | "YAPE"
        | "PLIN"
        | "HIBRIDO"
        | "UNICO",
      metodoPago: venta.metodoPago,
      metodosPago: metodosPagoArray,
      estado: venta.estado as "CONFIRMADA" | "ANULADA",
      observaciones: venta.observaciones || undefined,
      // Dirección específica del viaje (puede ser diferente a la ruta)
      puertoOrigen: venta.puertoOrigen,
      puertoDestino: venta.puertoDestino,
      cliente: {
        nombre: venta.cliente.nombre,
        apellido: venta.cliente.apellido,
        dni: venta.cliente.dni,
        telefono: venta.cliente.telefono || undefined,
        email: venta.cliente.email || undefined,
        nacionalidad: venta.cliente.nacionalidad,
      },
      ruta: {
        nombre: venta.ruta.nombre,
        puertoOrigen: venta.ruta.puertoOrigen,
        puertoDestino: venta.ruta.puertoDestino,
      },
      embarcacion: {
        nombre: venta.embarcacion.nombre,
      },
      puertoEmbarque: {
        nombre: venta.puertoEmbarque.nombre,
        direccion: venta.puertoEmbarque.direccion || undefined,
        descripcion: venta.puertoEmbarque.descripcion || undefined,
      },
      vendedor: {
        nombre: venta.vendedor.nombre,
        apellido: venta.vendedor.apellido,
      },
    };

    // ⚡ Generar PDF con jsPDF (compatible con Vercel)
    const pdfBuffer = await generarComprobanteA4(ventaFormateada);

    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${venta.numeroVenta}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generando comprobante:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
