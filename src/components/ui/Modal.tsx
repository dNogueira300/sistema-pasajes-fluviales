"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { X } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

type MaxWidth = "md" | "lg" | "2xl" | "4xl" | "5xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  maxWidth?: MaxWidth;
  hasChanges?: boolean;
  zIndex?: number;
}

const maxWidthClasses: Record<MaxWidth, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = "2xl",
  hasChanges = false,
  zIndex = 50,
}: ModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowConfirm(false);
    onClose();
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    setShowConfirm(false);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, handleClose]);

  // Block body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-${zIndex}`}
      style={{ zIndex }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-slate-800/95 backdrop-blur-md rounded-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[95vh] flex flex-col shadow-2xl drop-shadow-2xl border border-slate-600/50 animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-slate-800/95 backdrop-blur-md rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        <div className="border-t border-slate-600/50 bg-slate-800/95 backdrop-blur-md p-6 rounded-b-2xl flex-shrink-0">
          {footer}
        </div>
      </div>

      {/* Confirm close modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Estás seguro de que deseas cerrar sin guardar?"
        confirmText="Sí, cerrar"
        cancelText="Seguir editando"
        variant="warning"
      />
    </div>
  );
}
