// src/components/ventas/calendario-selector.tsx
// Componente opcional mejorado para selección de fechas con validación visual

"use client";

import { useState } from "react";
import { Calendar, AlertCircle } from "lucide-react";

interface CalendarioSelectorProps {
  value: string;
  onChange: (fecha: string) => void;
  diasOperativos: string[];
  fechaMinima?: string;
  className?: string;
  disabled?: boolean;
}

export default function CalendarioSelector({
  value,
  onChange,
  diasOperativos,
  fechaMinima,
  className = "",
  disabled = false,
}: CalendarioSelectorProps) {
  const [error, setError] = useState<string>("");

  const obtenerDiaSemana = (fecha: string): string => {
    const date = new Date(fecha + "T00:00:00");
    const diasMap: { [key: number]: string } = {
      0: "DOMINGO",
      1: "LUNES",
      2: "MARTES",
      3: "MIERCOLES",
      4: "JUEVES",
      5: "VIERNES",
      6: "SABADO",
    };
    return diasMap[date.getDay()];
  };

  const esFechaValida = (fecha: string): boolean => {
    if (!fecha || diasOperativos.length === 0) return true;
    const diaSemana = obtenerDiaSemana(fecha);
    return diasOperativos.includes(diaSemana);
  };

  const handleFechaChange = (fecha: string) => {
    if (!fecha) {
      setError("");
      onChange("");
      return;
    }

    if (!esFechaValida(fecha)) {
      const diaSemana = obtenerDiaSemana(fecha);
      const diasNombres: { [key: string]: string } = {
        LUNES: "Lunes",
        MARTES: "Martes",
        MIERCOLES: "Miércoles",
        JUEVES: "Jueves",
        VIERNES: "Viernes",
        SABADO: "Sábado",
        DOMINGO: "Domingo",
      };

      setError(
        `Esta ruta no opera los días ${diasNombres[diaSemana]}. ` +
          `Por favor selecciona: ${diasOperativos
            .map((d) => diasNombres[d])
            .join(", ")}`
      );
      return;
    }

    setError("");
    onChange(fecha);
  };

  const obtenerFechaMinima = (): string => {
    return fechaMinima || new Date().toISOString().split("T")[0];
  };

  // Función para generar sugerencia de próxima fecha válida
  const obtenerProximaFechaValida = (): string => {
    if (diasOperativos.length === 0) return "";

    const hoy = new Date();
    // Buscar hasta 14 días adelante
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().split("T")[0];

      if (esFechaValida(fechaStr)) {
        return fechaStr;
      }
    }

    return "";
  };

  const sugerirFechaValida = () => {
    const proximaFecha = obtenerProximaFechaValida();
    if (proximaFecha) {
      handleFechaChange(proximaFecha);
    }
  };

  const diasNombres: { [key: string]: string } = {
    LUNES: "Lunes",
    MARTES: "Martes",
    MIERCOLES: "Miércoles",
    JUEVES: "Jueves",
    VIERNES: "Viernes",
    SABADO: "Sábado",
    DOMINGO: "Domingo",
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => handleFechaChange(e.target.value)}
          min={obtenerFechaMinima()}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 ${
            error
              ? "border-red-500/50 focus:border-red-500"
              : "border-slate-600/50 focus:border-blue-500"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
      </div>

      {/* Mostrar días operativos */}
      {diasOperativos.length > 0 && !error && (
        <div className="p-3 bg-blue-900/30 border border-blue-600/50 rounded-xl">
          <p className="text-sm text-blue-200 font-medium mb-2">
            📅 Esta ruta opera:
          </p>
          <div className="flex flex-wrap gap-2">
            {diasOperativos.map((dia) => (
              <span
                key={dia}
                className="px-2 py-1 text-xs bg-blue-600/50 text-blue-100 rounded-lg border border-blue-500/50"
              >
                {diasNombres[dia] || dia}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje de error con sugerencia */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-600/50 rounded-xl space-y-3">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-200">{error}</p>
              <button
                type="button"
                onClick={sugerirFechaValida}
                className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
              >
                Sugerir próxima fecha disponible
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
