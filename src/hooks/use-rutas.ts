// hooks/use-rutas.ts - Actualizado
import { useState, useCallback } from "react";
import {
  FiltrosRutas,
  CrearRutaConEmbarcaciones,
  ActualizarRutaConEmbarcaciones,
  EstadisticasRutas,
} from "@/types";
import { useEmbarcacionRutas } from "@/hooks/use-embarcacion-rutas";

export function useRutas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    crearEmbarcacionRuta,
    eliminarEmbarcacionRuta,
    actualizarEmbarcacionRuta,
  } = useEmbarcacionRutas();

  // Obtener lista de rutas con filtros y paginación
  const obtenerRutas = useCallback(async (filtros: FiltrosRutas = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
      if (filtros.activa !== undefined)
        params.append("activa", filtros.activa.toString());
      if (filtros.page) params.append("page", filtros.page.toString());
      if (filtros.limit) params.append("limit", filtros.limit.toString());

      const response = await fetch(`/api/rutas?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener rutas");
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

  // Obtener rutas activas para selección
  const obtenerRutasActivas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rutas/activas");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener rutas activas");
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

  // Crear ruta con embarcaciones
  const crearRuta = useCallback(
    async (datos: CrearRutaConEmbarcaciones): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Crear la ruta primero
        const response = await fetch("/api/rutas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: datos.nombre,
            puertoOrigen: datos.puertoOrigen,
            puertoDestino: datos.puertoDestino,
            precio: datos.precio,
            activa: datos.activa,
          }),
        });

        const rutaData = await response.json();

        if (!response.ok) {
          throw new Error(rutaData.error || "Error al crear ruta");
        }

        const rutaId = rutaData.id;

        // Crear las asignaciones de embarcaciones si existen
        if (datos.embarcaciones && datos.embarcaciones.length > 0) {
          const promesasEmbarcaciones = datos.embarcaciones.map(
            (embarcacionData) =>
              crearEmbarcacionRuta({
                ...embarcacionData,
                rutaId,
              })
          );

          const resultadosEmbarcaciones = await Promise.all(
            promesasEmbarcaciones
          );

          // Verificar si todas las asignaciones fueron exitosas
          const algunaFallo = resultadosEmbarcaciones.some(
            (resultado) => !resultado
          );

          if (algunaFallo) {
            // Si alguna asignación falló, se podría considerar eliminar la ruta creada
            // Por simplicidad, solo mostramos un warning
            console.warn("Algunas asignaciones de embarcaciones fallaron");
          }
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
    [crearEmbarcacionRuta]
  );

  // Actualizar ruta con embarcaciones
  const actualizarRuta = useCallback(
    async (
      id: string,
      datos: ActualizarRutaConEmbarcaciones
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Actualizar la ruta primero
        const response = await fetch(`/api/rutas/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: datos.nombre,
            puertoOrigen: datos.puertoOrigen,
            puertoDestino: datos.puertoDestino,
            precio: datos.precio,
            activa: datos.activa,
          }),
        });

        const rutaData = await response.json();

        if (!response.ok) {
          throw new Error(rutaData.error || "Error al actualizar ruta");
        }

        // Manejar las embarcaciones si se proporcionaron
        if (datos.embarcaciones) {
          const promesas: Promise<boolean>[] = [];

          // Eliminar asignaciones existentes
          if (datos.embarcaciones.eliminar) {
            datos.embarcaciones.eliminar.forEach((embarcacionRutaId) => {
              promesas.push(eliminarEmbarcacionRuta(embarcacionRutaId));
            });
          }

          // Crear nuevas asignaciones
          if (datos.embarcaciones.crear) {
            datos.embarcaciones.crear.forEach((embarcacionData) => {
              promesas.push(
                crearEmbarcacionRuta({
                  ...embarcacionData,
                  rutaId: id,
                })
              );
            });
          }

          // Actualizar asignaciones existentes
          if (datos.embarcaciones.actualizar) {
            datos.embarcaciones.actualizar.forEach((embarcacionData) => {
              promesas.push(
                actualizarEmbarcacionRuta(embarcacionData.id, {
                  horasSalida: embarcacionData.horasSalida,
                  diasOperacion: embarcacionData.diasOperacion,
                  activa: embarcacionData.activa,
                })
              );
            });
          }

          // Ejecutar todas las operaciones de embarcaciones
          if (promesas.length > 0) {
            const resultados = await Promise.all(promesas);
            const algunaFallo = resultados.some((resultado) => !resultado);

            if (algunaFallo) {
              console.warn("Algunas operaciones de embarcaciones fallaron");
            }
          }
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
    [crearEmbarcacionRuta, eliminarEmbarcacionRuta, actualizarEmbarcacionRuta]
  );

  // Eliminar ruta
  const eliminarRuta = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rutas/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar ruta");
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
    useCallback(async (): Promise<EstadisticasRutas | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/rutas/estadisticas");
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
    async (id: string, activa: boolean): Promise<boolean> => {
      return actualizarRuta(id, { activa });
    },
    [actualizarRuta]
  );

  return {
    obtenerRutas,
    obtenerRutasActivas,
    crearRuta,
    actualizarRuta,
    eliminarRuta,
    obtenerEstadisticas,
    cambiarEstado,
    loading,
    error,
    setError,
  };
}
