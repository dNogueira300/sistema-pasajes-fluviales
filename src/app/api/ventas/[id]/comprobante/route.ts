// app/api/ventas/[id]/comprobante/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import {
  MetodoPago,
  generarComprobanteA4,
} from "@/lib/utils/comprobante-utils";

const prisma = new PrismaClient();

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

    // Obtener la venta con todas las relaciones necesarias
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
            email: true,
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

    // Verificar que el usuario puede ver esta venta
    if (session.user.role === "VENDEDOR" && venta.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Formatear los datos de la venta para el comprobante
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
        | "HIBRIDO",
      metodoPago: venta.metodoPago,
      metodosPago: venta.metodosPago
        ? (JSON.parse(venta.metodosPago.toString()) as MetodoPago[])
        : undefined,
      estado: venta.estado as "CONFIRMADA" | "ANULADA",
      observaciones: venta.observaciones || undefined,
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

    // Generar el PDF del comprobante A4
    const pdfBuffer = await generarComprobanteA4(ventaFormateada);

    // Convertir el Buffer a Uint8Array para Next.js Response
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
    console.error("Error generando comprobante A4:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
