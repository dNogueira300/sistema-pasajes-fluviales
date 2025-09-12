// src/hooks/use-anulaciones.ts
import { useState, useCallback } from "react";
import {
  CrearAnulacionData,
  AnulacionResponse,
  FiltrosAnulaciones,
  EstadisticasAnulaciones,
} from "@/types";

export function useAnulaciones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anular una venta
  const anularVenta = useCallback(
    async (
      ventaId: string,
      datos: Omit<CrearAnulacionData, "ventaId">
    ): Promise<AnulacionResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/ventas/${ventaId}/anular`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al anular la venta");
        }

        return data as AnulacionResponse;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Obtener lista de anulaciones
  const obtenerAnulaciones = useCallback(
    async (filtros: FiltrosAnulaciones = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filtros.fechaInicio)
          params.append("fechaInicio", filtros.fechaInicio);
        if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
        if (filtros.tipoAnulacion)
          params.append("tipoAnulacion", filtros.tipoAnulacion);
        if (filtros.usuarioId) params.append("usuarioId", filtros.usuarioId);
        if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
        if (filtros.page) params.append("page", filtros.page.toString());
        if (filtros.limit) params.append("limit", filtros.limit.toString());

        const response = await fetch(`/api/anulaciones?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener anulaciones");
        }

        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Obtener estadísticas de anulaciones
  const obtenerEstadisticas = useCallback(
    async (
      periodo: "dia" | "semana" | "mes" | "anio" = "mes"
    ): Promise<EstadisticasAnulaciones | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/anulaciones/estadisticas?periodo=${periodo}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener estadísticas");
        }

        return data as EstadisticasAnulaciones;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Validar si una venta puede ser anulada
  const puedeAnularVenta = useCallback(
    (
      venta: {
        estado: string;
        anulacion?: unknown;
        userId: string;
        fechaViaje: string | Date;
      },
      userRole: string,
      userId: string
    ) => {
      // Verificar estado de la venta
      if (venta.estado !== "CONFIRMADA") {
        return {
          puede: false,
          razon: `No se puede anular una venta con estado: ${venta.estado}`,
        };
      }

      // Verificar si ya está anulada
      if (venta.anulacion) {
        return {
          puede: false,
          razon: "Esta venta ya ha sido anulada",
        };
      }

      // Verificar permisos del usuario
      if (userRole === "VENDEDOR" && venta.userId !== userId) {
        return {
          puede: false,
          razon: "Solo puedes anular tus propias ventas",
        };
      }

      // Verificar restricciones de tiempo para vendedores
      const fechaViaje = new Date(venta.fechaViaje);
      const ahora = new Date();
      const horasRestantes =
        (fechaViaje.getTime() - ahora.getTime()) / (1000 * 60 * 60);

      if (userRole === "VENDEDOR" && horasRestantes < 0) {
        return {
          puede: false,
          razon: "No puedes anular ventas de viajes ya realizados",
        };
      }

      // Advertencia si quedan pocas horas
      if (horasRestantes > 0 && horasRestantes < 2) {
        return {
          puede: true,
          advertencia: `El viaje es en ${horasRestantes.toFixed(
            1
          )} horas. La anulación debe procesarse con urgencia.`,
        };
      }

      return { puede: true };
    },
    []
  );

  // Obtener motivos comunes para anulación
  const motivosComunes = [
    "Cambio de planes del pasajero",
    "Problema de salud del pasajero",
    "Cancelación por parte de la empresa",
    "Error en la reserva",
    "Solicitud de cambio de fecha",
    "Problema con el método de pago",
    "Condiciones climáticas adversas",
    "Problema técnico de la embarcación",
    "Otro motivo",
  ];

  return {
    anularVenta,
    obtenerAnulaciones,
    obtenerEstadisticas,
    puedeAnularVenta,
    motivosComunes,
    loading,
    error,
    setError,
  };
}
