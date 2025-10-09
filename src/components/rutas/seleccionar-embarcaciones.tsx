// components/rutas/seleccionar-embarcaciones.tsx
"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Ship, Clock, Calendar } from "lucide-react";
import { useEmbarcaciones } from "@/hooks/use-embarcaciones";
import {
  Embarcacion,
  CrearEmbarcacionRutaData,
  DIAS_SEMANA,
  DiaSemana,
} from "@/types";

interface SeleccionarEmbarcacionesProps {
  embarcacionesSeleccionadas: CrearEmbarcacionRutaData[];
  onChange: (embarcaciones: CrearEmbarcacionRutaData[]) => void;
  rutaId?: string; // Para modo edición
}

interface EmbarcacionFormulario extends CrearEmbarcacionRutaData {
  tempId: string; // ID temporal para el formulario
}

export default function SeleccionarEmbarcaciones({
  embarcacionesSeleccionadas,
  onChange,
  rutaId,
}: SeleccionarEmbarcacionesProps) {
  const { obtenerEmbarcacionesActivas, loading } = useEmbarcaciones();
  const [embarcacionesDisponibles, setEmbarcacionesDisponibles] = useState<
    Embarcacion[]
  >([]);
  const [embarcacionesFormulario, setEmbarcacionesFormulario] = useState<
    EmbarcacionFormulario[]
  >([]);

  // Cargar embarcaciones disponibles
  useEffect(() => {
    const cargarEmbarcaciones = async () => {
      const resultado = await obtenerEmbarcacionesActivas();
      if (resultado) {
        setEmbarcacionesDisponibles(resultado);
      }
    };

    cargarEmbarcaciones();
  }, [obtenerEmbarcacionesActivas]);

  // Sincronizar con embarcaciones seleccionadas externas
  useEffect(() => {
    const embarcacionesConId = embarcacionesSeleccionadas.map((emb, index) => ({
      ...emb,
      tempId: `temp-${index}-${Date.now()}`,
    }));
    setEmbarcacionesFormulario(embarcacionesConId);
  }, [embarcacionesSeleccionadas]);

  const agregarEmbarcacion = () => {
    const nuevaEmbarcacion: EmbarcacionFormulario = {
      tempId: `temp-${Date.now()}`,
      embarcacionId: "",
      rutaId: rutaId || "",
      horasSalida: [""],
      diasOperacion: [],
      activa: true,
    };

    const nuevasEmbarcaciones = [...embarcacionesFormulario, nuevaEmbarcacion];
    setEmbarcacionesFormulario(nuevasEmbarcaciones);
    onChange(nuevasEmbarcaciones);
  };

  const eliminarEmbarcacion = (tempId: string) => {
    const nuevasEmbarcaciones = embarcacionesFormulario.filter(
      (emb) => emb.tempId !== tempId
    );
    setEmbarcacionesFormulario(nuevasEmbarcaciones);
    onChange(nuevasEmbarcaciones);
  };

  const actualizarEmbarcacion = (
    tempId: string,
    cambios: Partial<EmbarcacionFormulario>
  ) => {
    const nuevasEmbarcaciones = embarcacionesFormulario.map((emb) =>
      emb.tempId === tempId ? { ...emb, ...cambios } : emb
    );
    setEmbarcacionesFormulario(nuevasEmbarcaciones);
    onChange(nuevasEmbarcaciones);
  };

  const agregarHora = (tempId: string) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion) {
      const nuevasHoras = [...embarcacion.horasSalida, ""];
      actualizarEmbarcacion(tempId, { horasSalida: nuevasHoras });
    }
  };

  const eliminarHora = (tempId: string, indiceHora: number) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion && embarcacion.horasSalida.length > 1) {
      const nuevasHoras = embarcacion.horasSalida.filter(
        (_, index) => index !== indiceHora
      );
      actualizarEmbarcacion(tempId, { horasSalida: nuevasHoras });
    }
  };

  const actualizarHora = (tempId: string, indiceHora: number, hora: string) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion) {
      const nuevasHoras = embarcacion.horasSalida.map((h, index) =>
        index === indiceHora ? hora : h
      );
      actualizarEmbarcacion(tempId, { horasSalida: nuevasHoras });
    }
  };

  const toggleDia = (tempId: string, dia: DiaSemana) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion) {
      const nuevosDisas = embarcacion.diasOperacion.includes(dia)
        ? embarcacion.diasOperacion.filter((d) => d !== dia)
        : [...embarcacion.diasOperacion, dia];
      actualizarEmbarcacion(tempId, { diasOperacion: nuevosDisas });
    }
  };

  const obtenerEmbarcacionesYaSeleccionadas = () => {
    return embarcacionesFormulario
      .map((emb) => emb.embarcacionId)
      .filter(Boolean);
  };

  const obtenerNombreEmbarcacion = (id: string) => {
    const embarcacion = embarcacionesDisponibles.find((emb) => emb.id === id);
    return embarcacion?.nombre || "Embarcación no encontrada";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-100">
          Embarcaciones Asignadas
        </h3>
        <button
          type="button"
          onClick={agregarEmbarcacion}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Embarcación</span>
        </button>
      </div>

      {embarcacionesFormulario.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay embarcaciones asignadas a esta ruta</p>
          <p className="text-sm">
            Haz clic en Agregar Embarcación para comenzar
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {embarcacionesFormulario.map((embarcacionForm) => {
            const embarcacionesYaSeleccionadas =
              obtenerEmbarcacionesYaSeleccionadas();
            const embarcacionesDisponiblesFiltradas =
              embarcacionesDisponibles.filter(
                (emb) =>
                  !embarcacionesYaSeleccionadas.includes(emb.id) ||
                  emb.id === embarcacionForm.embarcacionId
              );

            return (
              <div
                key={embarcacionForm.tempId}
                className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6 space-y-6"
              >
                {/* Header con selección de embarcación y toggle activo */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Embarcación *
                    </label>
                    <select
                      value={embarcacionForm.embarcacionId}
                      onChange={(e) =>
                        actualizarEmbarcacion(embarcacionForm.tempId, {
                          embarcacionId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                      required
                    >
                      <option value="">Seleccionar embarcación</option>
                      {embarcacionesDisponiblesFiltradas.map((embarcacion) => (
                        <option key={embarcacion.id} value={embarcacion.id}>
                          {embarcacion.nombre} - Capacidad:{" "}
                          {embarcacion.capacidad}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Toggle Activo */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          actualizarEmbarcacion(embarcacionForm.tempId, {
                            activa: !embarcacionForm.activa,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          embarcacionForm.activa
                            ? "bg-green-600"
                            : "bg-slate-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            embarcacionForm.activa
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm ${
                          embarcacionForm.activa
                            ? "text-green-400"
                            : "text-slate-400"
                        }`}
                      >
                        {embarcacionForm.activa ? "Activa" : "Inactiva"}
                      </span>
                    </div>

                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() =>
                        eliminarEmbarcacion(embarcacionForm.tempId)
                      }
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                      title="Eliminar asignación"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Horarios de salida */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-300">
                      <Clock className="inline h-4 w-4 mr-2" />
                      Horarios de Salida *
                    </label>
                    <button
                      type="button"
                      onClick={() => agregarHora(embarcacionForm.tempId)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar horario</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {embarcacionForm.horasSalida.map((hora, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={hora}
                          onChange={(e) =>
                            actualizarHora(
                              embarcacionForm.tempId,
                              index,
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 text-sm"
                          required
                        />
                        {embarcacionForm.horasSalida.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              eliminarHora(embarcacionForm.tempId, index)
                            }
                            className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Días de operación */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Días de Operación *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() =>
                          toggleDia(embarcacionForm.tempId, dia.value)
                        }
                        className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                          embarcacionForm.diasOperacion.includes(dia.value)
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                  {embarcacionForm.diasOperacion.length === 0 && (
                    <p className="text-red-400 text-sm mt-2">
                      Debe seleccionar al menos un día de operación
                    </p>
                  )}
                </div>

                {/* Información de la embarcación seleccionada */}
                {embarcacionForm.embarcacionId && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <h4 className="text-sm font-medium text-slate-200 mb-2">
                      Información de la Embarcación
                    </h4>
                    <div className="text-sm text-slate-400">
                      <p>
                        <strong>Nombre:</strong>{" "}
                        {obtenerNombreEmbarcacion(
                          embarcacionForm.embarcacionId
                        )}
                      </p>
                      <p>
                        <strong>Capacidad:</strong>{" "}
                        {
                          embarcacionesDisponibles.find(
                            (emb) => emb.id === embarcacionForm.embarcacionId
                          )?.capacidad
                        }{" "}
                        pasajeros
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resumen */}
      {embarcacionesFormulario.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/30">
          <h4 className="text-sm font-medium text-slate-200 mb-2">
            Resumen de Asignaciones
          </h4>
          <div className="text-sm text-slate-400 space-y-1">
            <p>
              <strong>Total de embarcaciones:</strong>{" "}
              {embarcacionesFormulario.length}
            </p>
            <p>
              <strong>Embarcaciones activas:</strong>{" "}
              {embarcacionesFormulario.filter((emb) => emb.activa).length}
            </p>
            <p>
              <strong>Capacidad total:</strong>{" "}
              {embarcacionesFormulario.reduce((total, embForm) => {
                const embarcacion = embarcacionesDisponibles.find(
                  (emb) => emb.id === embForm.embarcacionId
                );
                return total + (embarcacion?.capacidad || 0);
              }, 0)}{" "}
              pasajeros
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
