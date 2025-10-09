// hooks/use-embarcacion-rutas.ts
import { useState, useCallback } from "react";
import {
  FiltrosEmbarcacionRutas,
  CrearEmbarcacionRutaData,
  ActualizarEmbarcacionRutaData,
} from "@/types";

export function useEmbarcacionRutas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener asignaciones embarcación-ruta con filtros
  const obtenerEmbarcacionRutas = useCallback(
    async (filtros: FiltrosEmbarcacionRutas = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filtros.rutaId) params.append("rutaId", filtros.rutaId);
        if (filtros.embarcacionId)
          params.append("embarcacionId", filtros.embarcacionId);
        if (filtros.activa !== undefined)
          params.append("activa", filtros.activa.toString());
        if (filtros.page) params.append("page", filtros.page.toString());
        if (filtros.limit) params.append("limit", filtros.limit.toString());

        const response = await fetch(`/api/embarcacion-rutas?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener asignaciones");
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

  // Obtener embarcaciones por ruta
  const obtenerEmbarcacionesPorRuta = useCallback(async (rutaId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/embarcacion-rutas/por-ruta/${rutaId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Error al obtener embarcaciones de la ruta"
        );
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
  }, []);

  // Crear asignación embarcación-ruta
  const crearEmbarcacionRuta = useCallback(
    async (datos: CrearEmbarcacionRutaData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/embarcacion-rutas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear asignación");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar asignación embarcación-ruta
  const actualizarEmbarcacionRuta = useCallback(
    async (
      id: string,
      datos: ActualizarEmbarcacionRutaData
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/embarcacion-rutas/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al actualizar asignación");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Eliminar asignación embarcación-ruta
  const eliminarEmbarcacionRuta = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/embarcacion-rutas/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al eliminar asignación");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Cambiar estado activo
  const cambiarEstadoEmbarcacionRuta = useCallback(
    async (id: string, activa: boolean): Promise<boolean> => {
      return actualizarEmbarcacionRuta(id, { activa });
    },
    [actualizarEmbarcacionRuta]
  );

  return {
    obtenerEmbarcacionRutas,
    obtenerEmbarcacionesPorRuta,
    crearEmbarcacionRuta,
    actualizarEmbarcacionRuta,
    eliminarEmbarcacionRuta,
    cambiarEstadoEmbarcacionRuta,
    loading,
    error,
    setError,
  };
}
