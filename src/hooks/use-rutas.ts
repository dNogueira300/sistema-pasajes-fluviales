// hooks/use-rutas.ts - Versión mejorada con validaciones
import { useState, useCallback } from "react";
import {
  FiltrosRutas,
  CrearRutaConEmbarcaciones,
  ActualizarRutaConEmbarcaciones,
  EstadisticasRutas,
} from "@/types";
import { useEmbarcacionRutas } from "@/hooks/use-embarcacion-rutas";
import { useEmbarcacionValidation } from "@/hooks/use-embarcacion-validation";

export function useRutas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    crearEmbarcacionRuta,
    eliminarEmbarcacionRuta,
    actualizarEmbarcacionRuta,
  } = useEmbarcacionRutas();

  const { validarMultiplesEmbarcaciones } = useEmbarcacionValidation();

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

  // Validar embarcaciones antes de crear/actualizar ruta
  const validarEmbarcacionesRuta = useCallback(
    async (
      embarcaciones: CrearRutaConEmbarcaciones["embarcaciones"],
      rutaId?: string,
      embarcacionesExistentes: string[] = []
    ): Promise<{ valido: boolean; errores: string[] }> => {
      if (!embarcaciones || embarcaciones.length === 0) {
        return {
          valido: false,
          errores: ["Debe asignar al menos una embarcación a la ruta"],
        };
      }

      const embarcacionIds = embarcaciones
        .map((emb) => emb.embarcacionId)
        .filter(Boolean);

      if (embarcacionIds.length === 0) {
        return {
          valido: false,
          errores: ["Debe seleccionar embarcaciones válidas"],
        };
      }

      // Validar embarcaciones duplicadas en la misma asignación
      const duplicados = embarcacionIds.filter(
        (id, index) => embarcacionIds.indexOf(id) !== index
      );
      if (duplicados.length > 0) {
        return {
          valido: false,
          errores: [
            "No se puede asignar la misma embarcación múltiples veces a una ruta",
          ],
        };
      }

      try {
        const resultado = await validarMultiplesEmbarcaciones(
          embarcacionIds,
          rutaId,
          embarcacionesExistentes
        );

        if (!resultado) {
          return { valido: false, errores: ["Error al validar embarcaciones"] };
        }

        if (!resultado.todasDisponibles) {
          const errores = resultado.resultados
            .filter((r) => !r.disponible)
            .map((r) => r.detalles || r.motivo);

          return { valido: false, errores };
        }

        return { valido: true, errores: [] };
      } catch {
        return {
          valido: false,
          errores: ["Error al validar disponibilidad de embarcaciones"],
        };
      }
    },
    [validarMultiplesEmbarcaciones]
  );

  // Crear ruta con embarcaciones y validaciones
  const crearRuta = useCallback(
    async (datos: CrearRutaConEmbarcaciones): Promise<boolean> => {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      try {
        // Validar embarcaciones antes de crear
        const { valido, errores } = await validarEmbarcacionesRuta(
          datos.embarcaciones
        );

        if (!valido) {
          setValidationErrors(errores);
          setError("Errores de validación en embarcaciones");
          return false;
        }

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
        const erroresEmbarcaciones: string[] = [];

        // Crear las asignaciones de embarcaciones si existen
        if (datos.embarcaciones && datos.embarcaciones.length > 0) {
          const promesasEmbarcaciones = datos.embarcaciones.map(
            async (embarcacionData) => {
              try {
                const resultado = await crearEmbarcacionRuta({
                  ...embarcacionData,
                  rutaId,
                });
                return resultado;
              } catch (err) {
                const errorMsg =
                  err instanceof Error ? err.message : "Error desconocido";
                erroresEmbarcaciones.push(`Error con embarcación: ${errorMsg}`);
                return false;
              }
            }
          );

          const resultadosEmbarcaciones = await Promise.all(
            promesasEmbarcaciones
          );
          const algunaFallo = resultadosEmbarcaciones.some(
            (resultado) => !resultado
          );

          if (algunaFallo || erroresEmbarcaciones.length > 0) {
            // Si alguna asignación falló, mostrar advertencia pero no fallar completamente
            setValidationErrors(erroresEmbarcaciones);
            console.warn(
              "Algunas asignaciones de embarcaciones fallaron:",
              erroresEmbarcaciones
            );

            // La ruta se creó exitosamente, pero hay problemas con las embarcaciones
            if (erroresEmbarcaciones.length > 0) {
              setError(
                `Ruta creada con advertencias: ${erroresEmbarcaciones.join(
                  ", "
                )}`
              );
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
    [crearEmbarcacionRuta, validarEmbarcacionesRuta]
  );

  // Actualizar ruta con embarcaciones y validaciones
  const actualizarRuta = useCallback(
    async (
      id: string,
      datos: ActualizarRutaConEmbarcaciones
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      try {
        // Si se están actualizando embarcaciones, validarlas
        if (datos.embarcaciones) {
          let embarcacionesAValidar: string[] = [];
          let embarcacionesExistentes: string[] = [];

          // Recopilar IDs de embarcaciones a crear
          if (datos.embarcaciones.crear) {
            embarcacionesAValidar = datos.embarcaciones.crear.map(
              (emb) => emb.embarcacionId
            );
          }

          // Recopilar IDs de asignaciones existentes a mantener
          if (datos.embarcaciones.eliminar) {
            embarcacionesExistentes = datos.embarcaciones.eliminar;
          }

          if (embarcacionesAValidar.length > 0) {
            const { valido, errores } = await validarEmbarcacionesRuta(
              datos.embarcaciones.crear || [],
              id,
              embarcacionesExistentes
            );

            if (!valido) {
              setValidationErrors(errores);
              setError("Errores de validación en embarcaciones");
              return false;
            }
          }
        }

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
        const erroresEmbarcaciones: string[] = [];

        if (datos.embarcaciones) {
          const promesas: Promise<boolean>[] = [];

          // Eliminar asignaciones existentes
          if (
            datos.embarcaciones.eliminar &&
            datos.embarcaciones.eliminar.length > 0
          ) {
            datos.embarcaciones.eliminar.forEach((embarcacionRutaId) => {
              promesas.push(
                eliminarEmbarcacionRuta(embarcacionRutaId).catch((err) => {
                  erroresEmbarcaciones.push(
                    `Error eliminando asignación: ${err.message}`
                  );
                  return false;
                })
              );
            });
          }

          // Crear nuevas asignaciones
          if (
            datos.embarcaciones.crear &&
            datos.embarcaciones.crear.length > 0
          ) {
            datos.embarcaciones.crear.forEach((embarcacionData) => {
              promesas.push(
                crearEmbarcacionRuta({
                  ...embarcacionData,
                  rutaId: id,
                }).catch((err) => {
                  erroresEmbarcaciones.push(
                    `Error creando asignación: ${err.message}`
                  );
                  return false;
                })
              );
            });
          }

          // Actualizar asignaciones existentes
          if (
            datos.embarcaciones.actualizar &&
            datos.embarcaciones.actualizar.length > 0
          ) {
            datos.embarcaciones.actualizar.forEach((embarcacionData) => {
              promesas.push(
                actualizarEmbarcacionRuta(embarcacionData.id, {
                  horasSalida: embarcacionData.horasSalida,
                  diasOperacion: embarcacionData.diasOperacion,
                  activa: embarcacionData.activa,
                }).catch((err) => {
                  erroresEmbarcaciones.push(
                    `Error actualizando asignación: ${err.message}`
                  );
                  return false;
                })
              );
            });
          }

          // Ejecutar todas las operaciones de embarcaciones
          if (promesas.length > 0) {
            const resultados = await Promise.all(promesas);
            const algunaFallo = resultados.some((resultado) => !resultado);

            if (algunaFallo || erroresEmbarcaciones.length > 0) {
              setValidationErrors(erroresEmbarcaciones);
              console.warn(
                "Algunas operaciones de embarcaciones fallaron:",
                erroresEmbarcaciones
              );

              if (erroresEmbarcaciones.length > 0) {
                setError(
                  `Ruta actualizada con advertencias: ${erroresEmbarcaciones.join(
                    ", "
                  )}`
                );
              }
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
    [
      crearEmbarcacionRuta,
      eliminarEmbarcacionRuta,
      actualizarEmbarcacionRuta,
      validarEmbarcacionesRuta,
    ]
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

  // Limpiar errores de validación
  const limpiarErroresValidacion = useCallback(() => {
    setValidationErrors([]);
    setError(null);
  }, []);

  return {
    obtenerRutas,
    obtenerRutasActivas,
    crearRuta,
    actualizarRuta,
    eliminarRuta,
    obtenerEstadisticas,
    cambiarEstado,
    validarEmbarcacionesRuta,
    limpiarErroresValidacion,
    loading,
    error,
    validationErrors,
    setError,
  };
}
