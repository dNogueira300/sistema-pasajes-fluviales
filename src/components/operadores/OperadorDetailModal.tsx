"use client";

import { useEffect } from "react";
import { X, Mail, User, Ship, Calendar, CheckCircle, XCircle, ClipboardCheck } from "lucide-react";
import type { Operador } from "@/hooks/use-operadores";

interface OperadorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  operador: Operador | null;
}

export default function OperadorDetailModal({ isOpen, onClose, operador }: OperadorDetailModalProps) {
  // Escape to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !operador) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-2xl border border-slate-600/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 sticky top-0 bg-slate-800/95 backdrop-blur-md rounded-t-2xl">
          <h2 className="text-xl font-semibold text-slate-100">Detalle del Operador</h2>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-600/20 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-400">
                {operador.nombre[0]}{operador.apellido[0]}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {operador.nombre} {operador.apellido}
              </h3>
              <p className="text-sm text-slate-400">@{operador.username}</p>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
              <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-slate-200">{operador.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
              <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Estado</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {operador.estadoOperador === "ACTIVO" ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-400">
                      <CheckCircle className="h-3.5 w-3.5" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-red-400">
                      <XCircle className="h-3.5 w-3.5" /> Inactivo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
              <Ship className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Embarcación Asignada</p>
                <p className="text-sm text-slate-200">
                  {operador.embarcacionAsignada
                    ? `${operador.embarcacionAsignada.nombre} (Cap: ${operador.embarcacionAsignada.capacidad})`
                    : "Sin asignar"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
              <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Fecha de Asignación</p>
                <p className="text-sm text-slate-200">
                  {operador.fechaAsignacion
                    ? new Date(operador.fechaAsignacion).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>

            {operador._count?.controlesEmbarque !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <ClipboardCheck className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Controles de Embarque</p>
                  <p className="text-sm text-slate-200">{operador._count.controlesEmbarque} registros</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
              <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Registrado</p>
                <p className="text-sm text-slate-200">
                  {new Date(operador.createdAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
