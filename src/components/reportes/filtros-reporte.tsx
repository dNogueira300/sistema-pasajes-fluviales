// components/reportes/filtros-reporte.tsx
"use client";
import { useState, useEffect, Fragment } from "react";
import {
  Calendar,
  Filter,
  X,
  ChevronDown,
  Check,
  Ship,
  User,
  CreditCard,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { FiltrosReporte, OpcionesReporte } from "@/types/reportes";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface FiltrosReporteProps {
  filtros: FiltrosReporte;
  opciones: OpcionesReporte;
  onFiltrosChange: (filtros: FiltrosReporte) => void;
  loading?: boolean;
}

// Presets de fechas comunes
const PRESETS_FECHA = [
  {
    id: "hoy",
    label: "Hoy",
    fechaInicio: () => format(new Date(), "yyyy-MM-dd"),
    fechaFin: () => format(new Date(), "yyyy-MM-dd"),
  },
  {
    id: "ayer",
    label: "Ayer",
    fechaInicio: () => format(subDays(new Date(), 1), "yyyy-MM-dd"),
    fechaFin: () => format(subDays(new Date(), 1), "yyyy-MM-dd"),
  },
  {
    id: "ultimos7",
    label: "Últimos 7 días",
    fechaInicio: () => format(subDays(new Date(), 6), "yyyy-MM-dd"),
    fechaFin: () => format(new Date(), "yyyy-MM-dd"),
  },
  {
    id: "ultimos30",
    label: "Últimos 30 días",
    fechaInicio: () => format(subDays(new Date(), 29), "yyyy-MM-dd"),
    fechaFin: () => format(new Date(), "yyyy-MM-dd"),
  },
  {
    id: "mesActual",
    label: "Mes actual",
    fechaInicio: () => format(startOfMonth(new Date()), "yyyy-MM-dd"),
    fechaFin: () => format(endOfMonth(new Date()), "yyyy-MM-dd"),
  },
  {
    id: "mesAnterior",
    label: "Mes anterior",
    fechaInicio: () =>
      format(startOfMonth(subDays(startOfMonth(new Date()), 1)), "yyyy-MM-dd"),
    fechaFin: () =>
      format(endOfMonth(subDays(startOfMonth(new Date()), 1)), "yyyy-MM-dd"),
  },
];

export default function FiltrosReporteComponent({
  filtros,
  opciones,
  onFiltrosChange,
  loading = false,
}: FiltrosReporteProps) {
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [presetSeleccionado, setPresetSeleccionado] = useState<string | null>(
    null
  );

  // Función para actualizar filtros
  const handleFiltroChange = (
    key: keyof FiltrosReporte,
    value: string | undefined
  ) => {
    const nuevosFiltros = {
      ...filtros,
      [key]: value === "" ? undefined : value,
    };

    onFiltrosChange(nuevosFiltros);

    // Limpiar preset si se cambian las fechas manualmente
    if ((key === "fechaInicio" || key === "fechaFin") && presetSeleccionado) {
      setPresetSeleccionado(null);
    }
  };

  // Aplicar preset de fecha
  const aplicarPreset = (preset: (typeof PRESETS_FECHA)[0]) => {
    setPresetSeleccionado(preset.id);
    const nuevosFiltros = {
      ...filtros,
      fechaInicio: preset.fechaInicio(),
      fechaFin: preset.fechaFin(),
    };
    onFiltrosChange(nuevosFiltros);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const presetDefault = PRESETS_FECHA.find((p) => p.id === "ultimos30")!;
    setPresetSeleccionado("ultimos30");

    const filtrosLimpios: FiltrosReporte = {
      fechaInicio: presetDefault.fechaInicio(),
      fechaFin: presetDefault.fechaFin(),
    };

    onFiltrosChange(filtrosLimpios);
  };

  // Establecer preset por defecto al montar el componente
  useEffect(() => {
    // Solo establecer preset si no hay fechas
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      const presetDefault = PRESETS_FECHA.find((p) => p.id === "hoy")!;
      setPresetSeleccionado(presetDefault.id);
      const filtrosDefault = {
        fechaInicio: presetDefault.fechaInicio(),
        fechaFin: presetDefault.fechaFin(),
      };
      onFiltrosChange(filtrosDefault);
    }
  }, [filtros.fechaInicio, filtros.fechaFin, onFiltrosChange]);

  // Verificar si hay filtros aplicados
  const tieneFiltrosAplicados = () => {
    return !!(
      filtros.rutaId ||
      filtros.embarcacionId ||
      filtros.vendedorId ||
      filtros.metodoPago ||
      filtros.tipoPago ||
      filtros.estado
    );
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">
            Filtros de Reporte
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {mostrarFiltrosAvanzados ? "Ocultar" : "Mostrar"} filtros avanzados
          </button>
          {tieneFiltrosAplicados() && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* Filtros básicos */}
      <div className="space-y-4">
        {/* Presets de fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Período de tiempo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PRESETS_FECHA.map((preset) => (
              <button
                key={preset.id}
                onClick={() => aplicarPreset(preset)}
                className={`px-3 py-2 text-sm rounded-xl border transition-all duration-200 ${
                  presetSeleccionado === preset.id
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fechas manuales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha inicio
            </label>
            <div className="relative">
              <Calendar className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-20" />
              <input
                type="date"
                value={filtros.fechaInicio || ""}
                onChange={(e) =>
                  handleFiltroChange("fechaInicio", e.target.value)
                }
                className="w-full pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha fin
            </label>
            <div className="relative">
              <Calendar className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-20" />
              <input
                type="date"
                value={filtros.fechaFin || ""}
                onChange={(e) => handleFiltroChange("fechaFin", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros avanzados */}
      <Transition
        show={mostrarFiltrosAvanzados}
        as={Fragment}
        enter="transition-all duration-300 ease-out"
        enterFrom="opacity-0 max-h-0"
        enterTo="opacity-100 max-h-[800px]"
        leave="transition-all duration-300 ease-in"
        leaveFrom="opacity-100 max-h-[800px]"
        leaveTo="opacity-0 max-h-0"
      >
        <div className="space-y-4 pt-4 border-t border-slate-600/50 overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 z-10">
            {/* Filtro por ruta */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ruta
              </label>
              <Listbox
                value={filtros.rutaId || ""}
                onChange={(value) => handleFiltroChange("rutaId", value)}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 z-50">
                    <span className="block truncate text-slate-100">
                      {filtros.rutaId
                        ? opciones.rutas.find((r) => r.value === filtros.rutaId)
                            ?.label || "Ruta no encontrada"
                        : "Todas las rutas"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl backdrop-blur-md">
                      <Listbox.Option
                        value=""
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Todas las rutas
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      {opciones.rutas.map((ruta) => (
                        <Listbox.Option
                          key={ruta.value}
                          value={ruta.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                              active ? "bg-slate-700/50" : ""
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected
                                    ? "font-semibold text-blue-400"
                                    : "font-normal text-slate-200"
                                }`}
                              >
                                {ruta.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Filtro por embarcación */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Embarcación
              </label>
              <Listbox
                value={filtros.embarcacionId || ""}
                onChange={(value) => handleFiltroChange("embarcacionId", value)}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-10 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                    <Ship className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <span className="block truncate text-slate-100">
                      {filtros.embarcacionId
                        ? opciones.embarcaciones.find((e) => e.value === filtros.embarcacionId)
                            ?.label || "Embarcación no encontrada"
                        : "Todas las embarcaciones"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl backdrop-blur-md">
                      <Listbox.Option
                        value=""
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Todas las embarcaciones
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      {opciones.embarcaciones.map((embarcacion) => (
                        <Listbox.Option
                          key={embarcacion.value}
                          value={embarcacion.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                              active ? "bg-slate-700/50" : ""
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected
                                    ? "font-semibold text-blue-400"
                                    : "font-normal text-slate-200"
                                }`}
                              >
                                {embarcacion.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Filtro por vendedor */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vendedor
              </label>
              <Listbox
                value={filtros.vendedorId || ""}
                onChange={(value) => handleFiltroChange("vendedorId", value)}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-10 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                    <User className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <span className="block truncate text-slate-100">
                      {filtros.vendedorId
                        ? opciones.vendedores.find((v) => v.value === filtros.vendedorId)
                            ?.label || "Vendedor no encontrado"
                        : "Todos los vendedores"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl backdrop-blur-md">
                      <Listbox.Option
                        value=""
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Todos los vendedores
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      {opciones.vendedores.map((vendedor) => (
                        <Listbox.Option
                          key={vendedor.value}
                          value={vendedor.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                              active ? "bg-slate-700/50" : ""
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected
                                    ? "font-semibold text-blue-400"
                                    : "font-normal text-slate-200"
                                }`}
                              >
                                {vendedor.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>

          {/* Segunda fila de filtros avanzados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por método de pago */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Método de Pago
              </label>
              <Listbox
                value={filtros.metodoPago || ""}
                onChange={(value) => handleFiltroChange("metodoPago", value)}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-10 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                    <CreditCard className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <span className="block truncate text-slate-100">
                      {filtros.metodoPago
                        ? opciones.metodosPago.find((m) => m.value === filtros.metodoPago)
                            ?.label || "Método no encontrado"
                        : "Todos los métodos"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl backdrop-blur-md">
                      <Listbox.Option
                        value=""
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Todos los métodos
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      {opciones.metodosPago.map((metodo) => (
                        <Listbox.Option
                          key={metodo.value}
                          value={metodo.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                              active ? "bg-slate-700/50" : ""
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected
                                    ? "font-semibold text-blue-400"
                                    : "font-normal text-slate-200"
                                }`}
                              >
                                {metodo.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Filtro por tipo de pago */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo de Pago
              </label>
              <Listbox
                value={filtros.tipoPago || ""}
                onChange={(value) => handleFiltroChange("tipoPago", value)}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-10 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                    <Wallet className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <span className="block truncate text-slate-100">
                      {filtros.tipoPago
                        ? opciones.tiposPago.find((t) => t.value === filtros.tipoPago)
                            ?.label || "Tipo no encontrado"
                        : "Todos los tipos"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl backdrop-blur-md">
                      <Listbox.Option
                        value=""
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Todos los tipos
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      {opciones.tiposPago.map((tipo) => (
                        <Listbox.Option
                          key={tipo.value}
                          value={tipo.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                              active ? "bg-slate-700/50" : ""
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected
                                    ? "font-semibold text-blue-400"
                                    : "font-normal text-slate-200"
                                }`}
                              >
                                {tipo.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Estado de Venta
              </label>
              <Listbox
                value={filtros.estado || ""}
                onChange={(value) =>
                  handleFiltroChange(
                    "estado",
                    value as "CONFIRMADA" | "ANULADA" | undefined
                  )
                }
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-10 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                    <CheckCircle className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <span className="block truncate text-slate-100">
                      {filtros.estado === "CONFIRMADA"
                        ? "Confirmadas"
                        : filtros.estado === "ANULADA"
                        ? "Anuladas"
                        : "Todos los estados"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl backdrop-blur-md">
                      <Listbox.Option
                        value=""
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Todos los estados
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      <Listbox.Option
                        value="CONFIRMADA"
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Confirmadas
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      <Listbox.Option
                        value="ANULADA"
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                            active ? "bg-slate-700/50" : ""
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-semibold text-blue-400"
                                  : "font-normal text-slate-200"
                              }`}
                            >
                              Anuladas
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>

          {/* Resumen de filtros aplicados */}
          {tieneFiltrosAplicados() && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-2">
                Filtros aplicados:
              </h4>
              <div className="flex flex-wrap gap-2">
                {filtros.rutaId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-800/50 text-blue-200 text-sm">
                    Ruta:{" "}
                    {
                      opciones.rutas.find((r) => r.value === filtros.rutaId)
                        ?.label
                    }
                    <button
                      onClick={() => handleFiltroChange("rutaId", "")}
                      className="ml-2 text-blue-300 hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filtros.embarcacionId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-800/50 text-blue-200 text-sm">
                    Embarcación:{" "}
                    {
                      opciones.embarcaciones.find(
                        (e) => e.value === filtros.embarcacionId
                      )?.label
                    }
                    <button
                      onClick={() => handleFiltroChange("embarcacionId", "")}
                      className="ml-2 text-blue-300 hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filtros.vendedorId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-800/50 text-blue-200 text-sm">
                    Vendedor:{" "}
                    {
                      opciones.vendedores.find(
                        (v) => v.value === filtros.vendedorId
                      )?.label
                    }
                    <button
                      onClick={() => handleFiltroChange("vendedorId", "")}
                      className="ml-2 text-blue-300 hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filtros.metodoPago && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-800/50 text-blue-200 text-sm">
                    Método: {filtros.metodoPago}
                    <button
                      onClick={() => handleFiltroChange("metodoPago", "")}
                      className="ml-2 text-blue-300 hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filtros.tipoPago && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-800/50 text-blue-200 text-sm">
                    Tipo: {filtros.tipoPago}
                    <button
                      onClick={() => handleFiltroChange("tipoPago", "")}
                      className="ml-2 text-blue-300 hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filtros.estado && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-800/50 text-blue-200 text-sm">
                    Estado: {filtros.estado}
                    <button
                      onClick={() => handleFiltroChange("estado", "")}
                      className="ml-2 text-blue-300 hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Transition>

      {/* Indicador de loading */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-300 text-sm">
            Aplicando filtros...
          </span>
        </div>
      )}
    </div>
  );
}
