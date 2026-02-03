// app/api/embarcacion-rutas/validar-disponibilidad/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET - Verificar si una embarcación está disponible para asignación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const embarcacionId = searchParams.get("embarcacionId");
    const rutaId = searchParams.get("rutaId"); // Opcional, para excluir en edición
    const embarcacionRutaId = searchParams.get("embarcacionRutaId"); // Para excluir en edición

    if (!embarcacionId) {
      return NextResponse.json(
        { error: "ID de embarcación es requerido" },
        { status: 400 }
      );
    }

    // Verificar si la embarcación existe y está activa
    const embarcacion = await prisma.embarcacion.findUnique({
      where: { id: embarcacionId },
    });

    if (!embarcacion) {
      return NextResponse.json(
        {
          disponible: false,
          motivo: "Embarcación no encontrada",
          detalles: "La embarcación seleccionada no existe",
        },
        { status: 404 }
      );
    }

    // Verificar estado de la embarcación usando el enum EstadoEmbarcacion
    if (embarcacion.estado !== "ACTIVA") {
      return NextResponse.json({
        disponible: false,
        motivo: "Embarcación no disponible",
        detalles: `La embarcación "${embarcacion.nombre}" está en estado: ${embarcacion.estado}`,
        embarcacion: {
          id: embarcacion.id,
          nombre: embarcacion.nombre,
          estado: embarcacion.estado,
        },
      });
    }

    // Construir condiciones para buscar asignaciones existentes usando tipos de Prisma
    const whereConditions: Prisma.EmbarcacionRutaWhereInput = {
      embarcacionId: embarcacionId,
      activa: true, // Solo considerar asignaciones activas
    };

    // Si se proporciona rutaId, excluir esa ruta
    if (rutaId) {
      whereConditions.rutaId = {
        not: rutaId,
      };
    }

    // Si se proporciona embarcacionRutaId, excluir esa asignación específica
    if (embarcacionRutaId) {
      whereConditions.id = {
        not: embarcacionRutaId,
      };
    }

    // Buscar asignaciones existentes
    const asignacionesExistentes = await prisma.embarcacionRuta.findMany({
      where: whereConditions,
      include: {
        ruta: {
          select: {
            id: true,
            nombre: true,
            puertoOrigen: true,
            puertoDestino: true,
            activa: true,
          },
        },
      },
    });

    // CAMBIO: Una embarcación PUEDE tener múltiples rutas asignadas
    // Retornamos disponible: true pero incluimos info de rutas ya asignadas
    const rutasAsignadas = asignacionesExistentes.map((asignacion) => ({
      id: asignacion.ruta.id,
      nombre: asignacion.ruta.nombre,
      trayecto: `${asignacion.ruta.puertoOrigen} → ${asignacion.ruta.puertoDestino}`,
      activa: asignacion.ruta.activa,
      fechaAsignacion: asignacion.createdAt,
    }));

    return NextResponse.json({
      disponible: true,
      motivo: asignacionesExistentes.length > 0
        ? "Embarcación disponible (tiene otras rutas asignadas)"
        : "Embarcación disponible",
      detalles: asignacionesExistentes.length > 0
        ? `La embarcación "${embarcacion.nombre}" está disponible. Actualmente asignada a ${asignacionesExistentes.length} ruta(s)`
        : `La embarcación "${embarcacion.nombre}" está disponible para asignación`,
      embarcacion: {
        id: embarcacion.id,
        nombre: embarcacion.nombre,
        capacidad: embarcacion.capacidad,
        estado: embarcacion.estado,
      },
      rutasAsignadas: rutasAsignadas.length > 0 ? rutasAsignadas : undefined,
      infoAdicional: asignacionesExistentes.length > 0
        ? `Esta embarcación puede operar en múltiples rutas (ej: rutas con destinos intermedios)`
        : undefined,
    });
  } catch (error) {
    console.error("Error verificando disponibilidad de embarcación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Verificar múltiples embarcaciones de una vez
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { embarcacionIds, rutaId, excluirAsignaciones = [] } = body;

    if (!Array.isArray(embarcacionIds) || embarcacionIds.length === 0) {
      return NextResponse.json(
        { error: "Lista de IDs de embarcaciones es requerida" },
        { status: 400 }
      );
    }

    const resultados = await Promise.all(
      embarcacionIds.map(async (embarcacionId: string) => {
        // Verificar embarcación
        const embarcacion = await prisma.embarcacion.findUnique({
          where: { id: embarcacionId },
        });

        if (!embarcacion) {
          return {
            embarcacionId,
            disponible: false,
            motivo: "Embarcación no encontrada",
            detalles: "La embarcación seleccionada no existe",
          };
        }

        if (embarcacion.estado !== "ACTIVA") {
          return {
            embarcacionId,
            disponible: false,
            motivo: "Embarcación no disponible",
            detalles: `La embarcación "${embarcacion.nombre}" está en estado: ${embarcacion.estado}`,
            embarcacion: {
              id: embarcacion.id,
              nombre: embarcacion.nombre,
              estado: embarcacion.estado,
            },
          };
        }

        // Construir condiciones de búsqueda usando tipos de Prisma
        const whereConditions: Prisma.EmbarcacionRutaWhereInput = {
          embarcacionId: embarcacionId,
          activa: true,
        };

        if (rutaId) {
          whereConditions.rutaId = { not: rutaId };
        }

        if (excluirAsignaciones.length > 0) {
          whereConditions.id = { notIn: excluirAsignaciones };
        }

        // Buscar asignaciones existentes
        const asignacionesExistentes = await prisma.embarcacionRuta.findMany({
          where: whereConditions,
          include: {
            ruta: {
              select: {
                id: true,
                nombre: true,
                puertoOrigen: true,
                puertoDestino: true,
                activa: true,
              },
            },
          },
        });

        // CAMBIO: Una embarcación PUEDE tener múltiples rutas asignadas
        const rutasAsignadas = asignacionesExistentes.map((asignacion) => ({
          id: asignacion.ruta.id,
          nombre: asignacion.ruta.nombre,
          trayecto: `${asignacion.ruta.puertoOrigen} → ${asignacion.ruta.puertoDestino}`,
        }));

        return {
          embarcacionId,
          disponible: true,
          motivo: asignacionesExistentes.length > 0
            ? "Embarcación disponible (tiene otras rutas)"
            : "Embarcación disponible",
          detalles: asignacionesExistentes.length > 0
            ? `La embarcación "${embarcacion.nombre}" está disponible. Asignada a ${asignacionesExistentes.length} ruta(s)`
            : `La embarcación "${embarcacion.nombre}" está disponible`,
          embarcacion: {
            id: embarcacion.id,
            nombre: embarcacion.nombre,
            capacidad: embarcacion.capacidad,
          },
          rutasAsignadas: rutasAsignadas.length > 0 ? rutasAsignadas : undefined,
        };
      })
    );

    const disponibles = resultados.filter((r) => r.disponible);
    const noDisponibles = resultados.filter((r) => !r.disponible);

    return NextResponse.json({
      resumen: {
        total: embarcacionIds.length,
        disponibles: disponibles.length,
        noDisponibles: noDisponibles.length,
      },
      resultados,
      todasDisponibles: noDisponibles.length === 0,
    });
  } catch (error) {
    console.error("Error verificando disponibilidad múltiple:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
