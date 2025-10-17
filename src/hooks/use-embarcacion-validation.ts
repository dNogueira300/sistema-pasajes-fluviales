// hooks/use-embarcacion-validation.ts
import { useState, useCallback } from "react";

interface ValidacionEmbarcacion {
  embarcacionId: string;
  disponible: boolean;
  motivo: string;
  detalles: string;
  embarcacion?: {
    id: string;
    nombre: string;
    capacidad?: number;
    activa?: boolean;
  };
  rutasAsignadas?: Array<{
    id: string;
    nombre: string;
    trayecto: string;
    activa?: boolean;
    fechaAsignacion?: string;
  }>;
  conflictos?: number;
}

interface ValidacionMultiple {
  resumen: {
    total: number;
    disponibles: number;
    noDisponibles: number;
  };
  resultados: ValidacionEmbarcacion[];
  todasDisponibles: boolean;
}

export function useEmbarcacionValidation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validar una sola embarcación
  const validarEmbarcacion = useCallback(
    async (
      embarcacionId: string,
      rutaId?: string,
      embarcacionRutaId?: string
    ): Promise<ValidacionEmbarcacion | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("embarcacionId", embarcacionId);
        if (rutaId) params.append("rutaId", rutaId);
        if (embarcacionRutaId)
          params.append("embarcacionRutaId", embarcacionRutaId);

        const response = await fetch(
          `/api/embarcacion-rutas/validar-disponibilidad?${params}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al validar embarcación");
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

  // Validar múltiples embarcaciones
  const validarMultiplesEmbarcaciones = useCallback(
    async (
      embarcacionIds: string[],
      rutaId?: string,
      excluirAsignaciones: string[] = []
    ): Promise<ValidacionMultiple | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/embarcacion-rutas/validar-disponibilidad",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embarcacionIds,
              rutaId,
              excluirAsignaciones,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al validar embarcaciones");
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

  return {
    validarEmbarcacion,
    validarMultiplesEmbarcaciones,
    loading,
    error,
    setError,
  };
}
