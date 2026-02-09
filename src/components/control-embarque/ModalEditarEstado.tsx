"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Trash2, AlertTriangle } from "lucide-react";
import type { PasajeroEmbarque } from "@/hooks/use-control-embarque";
import Modal from "@/components/ui/Modal";

interface ModalEditarEstadoProps {
  isOpen: boolean;
  pasajero: PasajeroEmbarque;
  onClose: () => void;
  onCambiarEstado: (estado: "EMBARCADO" | "NO_EMBARCADO", observaciones?: string) => Promise<void>;
  onQuitarRegistro: () => Promise<void>;
}

export default function ModalEditarEstado({
  isOpen,
  pasajero,
  onClose,
  onCambiarEstado,
  onQuitarRegistro,
}: ModalEditarEstadoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [observaciones, setObservaciones] = useState("");

  const estadoActual = pasajero.controlEmbarque?.estadoEmbarque || "PENDIENTE";
  const horaRegistro = pasajero.controlEmbarque?.horaRegistro
    ? new Date(pasajero.controlEmbarque.horaRegistro).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const nuevoEstado: "EMBARCADO" | "NO_EMBARCADO" = estadoActual === "EMBARCADO" ? "NO_EMBARCADO" : "EMBARCADO";

  const handleCambiarEstado = async () => {
    setIsSubmitting(true);
    try {
      await onCambiarEstado(nuevoEstado, observaciones || undefined);
      setObservaciones("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuitarRegistro = async () => {
    setIsSubmitting(true);
    try {
      await onQuitarRegistro();
    } finally {
      setIsSubmitting(false);
      setShowConfirmDelete(false);
    }
  };

  const hasChanges = observaciones.trim().length > 0;

  // Vista de confirmación de eliminación
  if (showConfirmDelete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmDelete(false)} />
        <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Confirmar acción</h3>
            </div>

            <p className="text-slate-300 text-sm">
              ¿Seguro que desea quitar el registro? El pasajero volverá a estado{" "}
              <span className="font-semibold text-slate-200">PENDIENTE</span>.
            </p>

            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-200">
                {pasajero.cliente.nombre} {pasajero.cliente.apellido}
              </p>
              <p className="text-xs text-slate-400">DNI: {pasajero.cliente.dni}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 rounded-xl hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuitarRegistro}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Quitar registro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const footerContent = (
    <div className="space-y-3">
      {/* Cambiar estado */}
      <button
        onClick={handleCambiarEstado}
        disabled={isSubmitting}
        className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors ${
          nuevoEstado === "EMBARCADO"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isSubmitting ? (
          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : nuevoEstado === "EMBARCADO" ? (
          <>
            <CheckCircle className="h-5 w-5" />
            Cambiar a EMBARCADO
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5" />
            Cambiar a NO EMBARCADO
          </>
        )}
      </button>

      {/* Quitar registro */}
      <button
        onClick={() => setShowConfirmDelete(true)}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-amber-400 bg-amber-900/20 border border-amber-600/30 rounded-xl hover:bg-amber-900/30 disabled:opacity-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Quitar registro (volver a PENDIENTE)
      </button>

      {/* Cancelar */}
      <button
        onClick={onClose}
        disabled={isSubmitting}
        className="w-full py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen && !showConfirmDelete}
      onClose={onClose}
      title="Editar Estado de Embarque"
      maxWidth="md"
      hasChanges={hasChanges}
      footer={footerContent}
    >
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

        {/* Estado actual */}
        <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/50">
          <p className="text-xs text-slate-400 mb-1">Estado actual</p>
          <div className="flex items-center gap-2">
            {estadoActual === "EMBARCADO" ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            <span
              className={`text-sm font-semibold ${
                estadoActual === "EMBARCADO" ? "text-green-400" : "text-red-400"
              }`}
            >
              {estadoActual === "EMBARCADO" ? "EMBARCADO" : "NO EMBARCADO"}
            </span>
            {horaRegistro && <span className="text-xs text-slate-500">a las {horaRegistro}</span>}
          </div>
        </div>

        {/* Observaciones actuales */}
        {pasajero.controlEmbarque?.observaciones && (
          <div className="text-xs text-slate-500 italic">
            Obs: {pasajero.controlEmbarque.observaciones}
          </div>
        )}

        {/* Nueva observación */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Nueva observación (opcional)
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Agregar observación..."
          />
        </div>
      </div>
    </Modal>
  );
}
