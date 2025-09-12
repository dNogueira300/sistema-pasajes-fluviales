// hooks/usePuertos.ts
import { useState, useCallback } from "react";
import {
  FiltrosPuertos,
  CrearPuertoData,
  ActualizarPuertoData,
  EstadisticasPuertos,
} from "@/types";

export function usePuertos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener lista de puertos (actualizado para usar tu API)
  const obtenerPuertos = useCallback(async (filtros: FiltrosPuertos = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
      if (filtros.activo !== undefined)
        params.append("activo", filtros.activo.toString());
      if (filtros.page) params.append("page", filtros.page.toString());
      if (filtros.limit) params.append("limit", filtros.limit.toString());

      // Usar tu endpoint existente
      const response = await fetch(`/api/puertos-embarque?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener puertos");
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

  // Obtener puertos activos para selección (compatibilidad con implementación anterior)
  const obtenerPuertosActivos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Usar tu endpoint existente con parámetro para solo activos
      const response = await fetch("/api/puertos-embarque?solo_activos=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener puertos activos");
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

  // Crear puerto
  const crearPuerto = useCallback(
    async (datos: CrearPuertoData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/puertos-embarque", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear puerto");
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

  // Actualizar puerto
  const actualizarPuerto = useCallback(
    async (id: string, datos: ActualizarPuertoData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/puertos-embarque/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al actualizar puerto");
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

  // Eliminar puerto
  const eliminarPuerto = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/puertos-embarque/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar puerto");
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
  }, []);

  // Obtener estadísticas
  const obtenerEstadisticas =
    useCallback(async (): Promise<EstadisticasPuertos | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/puertos-embarque/estadisticas");
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

  // Cambiar estado activo
  const cambiarEstado = useCallback(
    async (id: string, activo: boolean): Promise<boolean> => {
      return actualizarPuerto(id, { activo });
    },
    [actualizarPuerto]
  );

  return {
    obtenerPuertos,
    obtenerPuertosActivos, // Función adicional para compatibilidad
    crearPuerto,
    actualizarPuerto,
    eliminarPuerto,
    obtenerEstadisticas,
    cambiarEstado,
    loading,
    error,
    setError,
  };
}
