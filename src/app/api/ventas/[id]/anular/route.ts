// src/app/api/ventas/[id]/anular/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
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
    const body = await request.json();

    const {
      motivo,
      observaciones,
      tipoAnulacion = "ANULACION",
      montoReembolso,
    } = body;

    // Validación del motivo
    if (!motivo || motivo.trim().length < 3) {
      return NextResponse.json(
        { error: "El motivo debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que la venta existe
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        cliente: true,
        ruta: true,
        embarcacion: true,
        anulacion: true,
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

    // Verificar que la venta puede ser anulada
    if (venta.estado !== "CONFIRMADA") {
      return NextResponse.json(
        { error: `No se puede anular una venta con estado: ${venta.estado}` },
        { status: 400 }
      );
    }

    // Verificar que no esté ya anulada
    if (venta.anulacion) {
      return NextResponse.json(
        { error: "Esta venta ya ha sido anulada anteriormente" },
        { status: 400 }
      );
    }

    // Verificar permisos
    if (session.user.role === "VENDEDOR" && venta.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Solo puedes anular tus propias ventas" },
        { status: 403 }
      );
    }

    // Verificar restricciones de tiempo para vendedores
    const fechaViaje = new Date(venta.fechaViaje);
    const ahora = new Date();
    const horasRestantes =
      (fechaViaje.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    // Vendedores no pueden anular ventas de viajes que ya pasaron
    if (session.user.role === "VENDEDOR" && horasRestantes < 0) {
      return NextResponse.json(
        {
          error:
            "No puedes anular ventas de viajes ya realizados. Contacta al administrador si necesitas procesar un reembolso.",
        },
        { status: 403 }
      );
    }

    // Validar monto de reembolso si aplica
    if (tipoAnulacion === "REEMBOLSO") {
      if (!montoReembolso || montoReembolso <= 0) {
        return NextResponse.json(
          { error: "Debe especificar un monto de reembolso válido" },
          { status: 400 }
        );
      }

      if (montoReembolso > Number(venta.total)) {
        return NextResponse.json(
          {
            error:
              "El monto de reembolso no puede ser mayor al total de la venta",
          },
          { status: 400 }
        );
      }
    }

    // Procesar la anulación en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear el registro de anulación
      const anulacion = await tx.anulacion.create({
        data: {
          ventaId,
          motivo: motivo.trim(),
          observaciones: observaciones?.trim(),
          usuarioId: session.user.id,
          asientosLiberados: venta.cantidadPasajes,
          montoReembolso: tipoAnulacion === "REEMBOLSO" ? montoReembolso : null,
          tipoAnulacion,
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

      // 2. Actualizar el estado de la venta
      const nuevoEstado =
        tipoAnulacion === "REEMBOLSO" ? "REEMBOLSADA" : "ANULADA";
      const nuevasObservaciones = [
        venta.observaciones,
        `[${nuevoEstado}] ${motivo}`,
        observaciones && `Observaciones: ${observaciones}`,
      ]
        .filter(Boolean)
        .join("\n");

      const ventaActualizada = await tx.venta.update({
        where: { id: ventaId },
        data: {
          estado: nuevoEstado,
          observaciones: nuevasObservaciones,
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

    // Log de auditoría
    console.log(
      `✅ Venta ${
        venta.numeroVenta
      } ${tipoAnulacion.toLowerCase()} exitosamente`
    );
    console.log(`👤 Usuario: ${session.user.name} (${session.user.email})`);
    console.log(`📊 Asientos liberados: ${venta.cantidadPasajes}`);
    console.log(`💰 Monto: S/ ${venta.total}`);
    if (tipoAnulacion === "REEMBOLSO") {
      console.log(`💸 Reembolso: S/ ${montoReembolso}`);
    }

    const mensaje =
      tipoAnulacion === "REEMBOLSO"
        ? `Venta ${venta.numeroVenta} reembolsada exitosamente. ${venta.cantidadPasajes} asiento(s) liberado(s). Monto a reembolsar: S/ ${montoReembolso}`
        : `Venta ${venta.numeroVenta} anulada exitosamente. ${venta.cantidadPasajes} asiento(s) liberado(s).`;

    return NextResponse.json({
      success: true,
      anulacion: resultado.anulacion,
      ventaActualizada: resultado.ventaActualizada,
      asientosLiberados: venta.cantidadPasajes,
      mensaje,
    });
  } catch (error) {
    console.error("Error procesando anulación:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor al procesar la anulación",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
