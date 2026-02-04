"use client";

import { CheckCircle, XCircle, Clock, MapPin } from "lucide-react";
import type { PasajeroEmbarque } from "@/hooks/use-control-embarque";

interface PasajeroCardProps {
  pasajero: PasajeroEmbarque;
  onClick: (pasajero: PasajeroEmbarque) => void;
  embarqueHabilitado?: boolean;
  horaViaje?: string;
}

export default function PasajeroCard({ pasajero, onClick, embarqueHabilitado = true, horaViaje }: PasajeroCardProps) {
  const estado = pasajero.controlEmbarque?.estadoEmbarque || "PENDIENTE";
  // Permitir clic si el embarque está habilitado (tanto para PENDIENTE como para estados ya registrados)
  const puedeInteractuar = embarqueHabilitado;

  const estadoConfig = {
    PENDIENTE: {
      bg: embarqueHabilitado
        ? "bg-slate-800/50 border-slate-700/50 hover:border-blue-600/50"
        : "bg-slate-800/30 border-slate-700/30 opacity-60",
      icon: <Clock className={`h-5 w-5 ${embarqueHabilitado ? "text-slate-400" : "text-slate-500"}`} />,
      badge: embarqueHabilitado ? "bg-slate-700 text-slate-300" : "bg-slate-800 text-slate-500",
      label: embarqueHabilitado ? "Pendiente" : `Disponible a las ${horaViaje || "--:--"}`,
      cursor: embarqueHabilitado ? "cursor-pointer" : "cursor-not-allowed",
    },
    EMBARCADO: {
      bg: embarqueHabilitado
        ? "bg-green-900/10 border-green-700/30 hover:border-green-600/50"
        : "bg-green-900/10 border-green-700/30",
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
      badge: "bg-green-900/40 text-green-400",
      label: "Embarcado",
      cursor: embarqueHabilitado ? "cursor-pointer" : "cursor-default",
    },
    NO_EMBARCADO: {
      bg: embarqueHabilitado
        ? "bg-red-900/10 border-red-700/30 hover:border-red-600/50"
        : "bg-red-900/10 border-red-700/30",
      icon: <XCircle className="h-5 w-5 text-red-400" />,
      badge: "bg-red-900/40 text-red-400",
      label: "No Embarcado",
      cursor: embarqueHabilitado ? "cursor-pointer" : "cursor-default",
    },
  }[estado];

  const handleClick = () => {
    if (puedeInteractuar) {
      onClick(pasajero);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`${estadoConfig.bg} ${estadoConfig.cursor} border rounded-xl p-4 transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 flex-shrink-0">{estadoConfig.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-200 truncate">
              {pasajero.cliente.apellido}, {pasajero.cliente.nombre}
            </p>
            <span className={`${estadoConfig.badge} text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0`}>
              {estadoConfig.label}
            </span>
          </div>

          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs text-slate-400">DNI: {pasajero.cliente.dni}</p>
            <p className="text-xs text-slate-400">N° Venta: {pasajero.numeroVenta}</p>
            <p className="text-xs text-slate-400">Pasajes: {pasajero.cantidadPasajes}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {pasajero.puertoEmbarque.nombre}
            </div>
          </div>

          {/* Hora de registro */}
          {pasajero.controlEmbarque?.horaRegistro && (
            <p className="mt-1.5 text-xs text-slate-500">
              Registrado: {new Date(pasajero.controlEmbarque.horaRegistro).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          {/* Observaciones */}
          {pasajero.controlEmbarque?.observaciones && (
            <p className="mt-1 text-xs text-slate-500 italic">
              {pasajero.controlEmbarque.observaciones}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
