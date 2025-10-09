// hooks/use-embarcaciones.ts
import { useState, useCallback } from "react";
import {
  FiltrosEmbarcaciones,
  CrearEmbarcacionData,
  ActualizarEmbarcacionData,
  EstadisticasEmbarcaciones,
  EstadoEmbarcacion,
} from "@/types";

export function useEmbarcaciones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener lista de embarcaciones con filtros y paginación
  const obtenerEmbarcaciones = useCallback(
    async (filtros: FiltrosEmbarcaciones = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
        if (filtros.estado) params.append("estado", filtros.estado);
        if (filtros.page) params.append("page", filtros.page.toString());
        if (filtros.limit) params.append("limit", filtros.limit.toString());

        const response = await fetch(`/api/embarcaciones?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener embarcaciones");
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

  // Obtener embarcaciones activas para selección
  const obtenerEmbarcacionesActivas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/embarcaciones/activas");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener embarcaciones activas");
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

  // Crear embarcación
  const crearEmbarcacion = useCallback(
    async (datos: CrearEmbarcacionData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/embarcaciones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear embarcación");
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

  // Actualizar embarcación
  const actualizarEmbarcacion = useCallback(
    async (id: string, datos: ActualizarEmbarcacionData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/embarcaciones/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al actualizar embarcación");
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

  // Eliminar embarcación
  const eliminarEmbarcacion = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/embarcaciones/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al eliminar embarcación");
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

  // Obtener estadísticas
  const obtenerEstadisticas =
    useCallback(async (): Promise<EstadisticasEmbarcaciones | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/embarcaciones/estadisticas");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener estadísticas");
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

  // Cambiar estado
  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoEmbarcacion): Promise<boolean> => {
      return actualizarEmbarcacion(id, { estado });
    },
    [actualizarEmbarcacion]
  );

  return {
    obtenerEmbarcaciones,
    obtenerEmbarcacionesActivas,
    crearEmbarcacion,
    actualizarEmbarcacion,
    eliminarEmbarcacion,
    obtenerEstadisticas,
    cambiarEstado,
    loading,
    error,
    setError,
  };
}
