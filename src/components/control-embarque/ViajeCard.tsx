"use client";

import { Clock, MapPin, Users, CheckCircle } from "lucide-react";
import BarraProgreso from "./BarraProgreso";
import type { ViajeInfo } from "@/hooks/use-control-embarque";

interface ViajeCardProps {
  viaje: ViajeInfo;
  onClick: () => void;
}

export default function ViajeCard({ viaje, onClick }: ViajeCardProps) {
  const porcentaje = viaje.total > 0 ? Math.round((viaje.embarcados / viaje.total) * 100) : 0;

  const getBadge = () => {
    if (viaje.pendientes === 0 && viaje.total > 0) {
      return { label: "Completado", className: "bg-green-900/40 text-green-400 border-green-700/50" };
    }
    if (viaje.embarcados > 0) {
      return { label: "En proceso", className: "bg-yellow-900/40 text-yellow-400 border-yellow-700/50" };
    }
    return { label: "Pendiente", className: "bg-slate-700 text-slate-300 border-slate-600" };
  };

  const badge = getBadge();

  return (
    <div
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-blue-600/50 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="text-lg font-bold text-slate-100">{viaje.horaViaje}</span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Ruta */}
      {viaje.ruta && (
        <div className="flex items-center gap-1.5 mb-3 text-sm text-slate-300">
          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">{viaje.ruta.puertoOrigen} → {viaje.ruta.puertoDestino}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-lg font-bold text-slate-100">{viaje.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            <p className="text-lg font-bold text-green-400">{viaje.embarcados}</p>
          </div>
          <p className="text-xs text-slate-500">Embarcados</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1">
            <Users className="h-3.5 w-3.5 text-yellow-400" />
            <p className="text-lg font-bold text-yellow-400">{viaje.pendientes}</p>
          </div>
          <p className="text-xs text-slate-500">Pendientes</p>
        </div>
      </div>

      {/* Progress bar */}
      <BarraProgreso porcentaje={porcentaje} />
    </div>
  );
}
