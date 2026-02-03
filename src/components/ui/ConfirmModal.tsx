"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";

export type ConfirmModalVariant = "warning" | "danger" | "success" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  isLoading?: boolean;
}

const variantConfig: Record<
  ConfirmModalVariant,
  {
    icon: typeof AlertTriangle;
    iconBg: string;
    iconColor: string;
    confirmBg: string;
    confirmHover: string;
  }
> = {
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-600/20",
    iconColor: "text-yellow-400",
    confirmBg: "bg-yellow-600",
    confirmHover: "hover:bg-yellow-700",
  },
  danger: {
    icon: XCircle,
    iconBg: "bg-red-600/20",
    iconColor: "text-red-400",
    confirmBg: "bg-red-600",
    confirmHover: "hover:bg-red-700",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-green-600/20",
    iconColor: "text-green-400",
    confirmBg: "bg-green-600",
    confirmHover: "hover:bg-green-700",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
    confirmBg: "bg-blue-600",
    confirmHover: "hover:bg-blue-700",
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
  isLoading = false,
}: ConfirmModalProps) {
  // Escape para cerrar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-md w-full shadow-2xl border border-slate-600/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header con botón de cerrar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className="text-slate-300 text-center leading-relaxed">{message}</p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 p-4 pt-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${config.confirmBg} ${config.confirmHover}`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
