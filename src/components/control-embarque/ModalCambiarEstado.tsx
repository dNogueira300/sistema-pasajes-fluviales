"use client";

import { useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import type { PasajeroEmbarque } from "@/hooks/use-control-embarque";

interface ModalCambiarEstadoProps {
  isOpen: boolean;
  pasajero: PasajeroEmbarque;
  onClose: () => void;
  onConfirm: (estado: "EMBARCADO" | "NO_EMBARCADO", observaciones?: string) => Promise<void>;
}

export default function ModalCambiarEstado({
  isOpen,
  pasajero,
  onClose,
  onConfirm,
}: ModalCambiarEstadoProps) {
  const [observaciones, setObservaciones] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async (estado: "EMBARCADO" | "NO_EMBARCADO") => {
    setIsSubmitting(true);
    try {
      await onConfirm(estado, observaciones || undefined);
      setObservaciones("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">Registrar Embarque</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Pasajero info */}
          <div className="bg-slate-700/30 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-slate-200">
              {pasajero.cliente.nombre} {pasajero.cliente.apellido}
            </p>
            <p className="text-xs text-slate-400">DNI: {pasajero.cliente.dni}</p>
            <p className="text-xs text-slate-400">N° Venta: {pasajero.numeroVenta}</p>
            <p className="text-xs text-slate-400">Pasajes: {pasajero.cantidadPasajes}</p>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Agregar observación..."
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleConfirm("EMBARCADO")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              Embarcado
            </button>
            <button
              onClick={() => handleConfirm("NO_EMBARCADO")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              No Embarcado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
