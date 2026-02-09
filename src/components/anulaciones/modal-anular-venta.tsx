// src/components/anulaciones/modal-anular-venta.tsx - DARK THEME

"use client";

import { useState, useEffect, useCallback } from "react";
//import { useSession } from "next-auth/react";
import { useAnulaciones } from "@/hooks/use-anulaciones";
import { TipoAnulacion, Anulacion, Venta } from "@/types";
import {
  formatearFechaViajeCompleta,
  puedeAnularVentaPorFecha,
} from "@/lib/utils/fecha-utils";
import {
  AlertTriangle,
  DollarSign,
  User,
  MapPin,
  CreditCard,
  XCircle,
  Clock,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";

interface AnulacionResult {
  success: boolean;
  mensaje: string;
  anulacion: Anulacion;
  ventaActualizada: Venta;
  asientosLiberados: number;
}

interface ModalAnularVentaProps {
  isOpen: boolean;
  onClose: () => void;
  venta: Venta;
  onSuccess: (resultado: AnulacionResult) => void;
}

export default function ModalAnularVenta({
  isOpen,
  onClose,
  venta,
  onSuccess,
}: ModalAnularVentaProps) {
  //const { data: session } = useSession();
  const { anularVenta, motivosComunes, loading, error, setError } =
    useAnulaciones();

  const [formData, setFormData] = useState({
    motivo: "",
    observaciones: "",
    tipoAnulacion: "ANULACION" as TipoAnulacion,
    montoReembolso: 0,
  });

  const [step, setStep] = useState<"validacion" | "formulario">("validacion");
  const [validacionFecha, setValidacionFecha] = useState<{
    puedeAnular: boolean;
    mensaje: string;
    tiempoRestante?: number;
    horasRestantes?: number;
    fechaFormateada?: string;
    esUrgente?: boolean;
  }>({ puedeAnular: false, mensaje: "" });

  // Función para validar fecha y hora del viaje usando la nueva utilidad
  const validarFechaViaje = useCallback(() => {
    if (!venta.horaViaje) {
      return {
        puedeAnular: false,
        mensaje: "No se puede validar: falta información de hora del viaje",
        fechaFormateada: formatearFechaViajeCompleta(venta.fechaViaje),
      };
    }

    const resultado = puedeAnularVentaPorFecha({
      fechaViaje: venta.fechaViaje,
      horaViaje: venta.horaViaje,
    });

    const fechaFormateada = formatearFechaViajeCompleta(venta.fechaViaje);
    const esUrgente = resultado.horasRestantes <= 2 && resultado.puedeAnular;

    return {
      puedeAnular: resultado.puedeAnular,
      mensaje: resultado.puedeAnular
        ? resultado.mensaje
        : `No se puede anular esta venta porque ya pasó la fecha y hora del viaje programado.`,
      fechaFormateada,
      tiempoRestante: resultado.horasRestantes,
      horasRestantes: resultado.horasRestantes,
      esUrgente,
    };
  }, [venta.fechaViaje, venta.horaViaje]);

  // Validar cuando se abre el modal
  useEffect(() => {
    if (isOpen && venta) {
      const validacion = validarFechaViaje();
      setValidacionFecha(validacion);
      setStep(validacion.puedeAnular ? "formulario" : "validacion");
    }
  }, [isOpen, venta, validarFechaViaje]);

  // Resetear formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        motivo: "",
        observaciones: "",
        tipoAnulacion: "ANULACION",
        montoReembolso: 0,
      });
      setStep("validacion");
      setError(null);
    }
  }, [isOpen, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar fecha nuevamente antes de enviar
    const validacion = validarFechaViaje();
    if (!validacion.puedeAnular) {
      setError(
        "La fecha y hora del viaje ya han pasado. No se puede procesar la anulación."
      );
      return;
    }

    if (!formData.motivo.trim()) {
      setError("El motivo es requerido");
      return;
    }

    if (
      formData.tipoAnulacion === "REEMBOLSO" &&
      formData.montoReembolso <= 0
    ) {
      setError("Debe especificar un monto de reembolso válido");
      return;
    }

    try {
      const resultado = await anularVenta(venta.id, {
        motivo: formData.motivo,
        observaciones: formData.observaciones,
        tipoAnulacion: formData.tipoAnulacion,
        montoReembolso:
          formData.tipoAnulacion === "REEMBOLSO"
            ? formData.montoReembolso
            : undefined,
      });

      if (resultado) {
        const resultadoConvertido: AnulacionResult = {
          success: resultado.success,
          mensaje: resultado.mensaje,
          anulacion: resultado.anulacion,
          ventaActualizada: resultado.ventaActualizada,
          asientosLiberados: resultado.asientosLiberados,
        };

        onSuccess(resultadoConvertido);
        onClose();
      }
    } catch (error) {
      // Manejar errores específicos de fecha
      if (
        error instanceof Error &&
        error.message.includes("ya pasó la fecha y hora del viaje")
      ) {
        setError(error.message);
      }
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "CONFIRMADA":
        return "bg-green-900/50 text-green-300 border-green-700/50";
      case "ANULADA":
        return "bg-red-900/50 text-red-300 border-red-700/50";
      case "REEMBOLSADA":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-700/50";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600/50";
    }
  };

  const hasChanges = formData.motivo.trim().length > 0 || formData.observaciones.trim().length > 0;

  const titleText = `Anular Venta - #${venta.numeroVenta}`;
  const iconElement = validacionFecha.puedeAnular ? (
    <Shield className="h-6 w-6 text-blue-400" />
  ) : (
    <XCircle className="h-6 w-6 text-red-400" />
  );

  const footerContent = step === "validacion" && !validacionFecha.puedeAnular ? (
    <button
      onClick={onClose}
      className="px-8 py-3 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-600/50 font-medium backdrop-blur-sm transition-all duration-200 border border-slate-600/50"
    >
      Entendido
    </button>
  ) : (
    <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600/50">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="px-6 py-3 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700/50 disabled:opacity-50 font-medium backdrop-blur-sm transition-all duration-200"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading || !formData.motivo.trim()}
        onClick={handleSubmit}
        className={`px-6 py-3 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 shadow-lg hover:shadow-xl ${
          validacionFecha.esUrgente
            ? "bg-amber-600 hover:bg-amber-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Procesando...
          </>
        ) : (
          <>
            {formData.tipoAnulacion === "REEMBOLSO"
              ? "Procesar Reembolso"
              : validacionFecha.esUrgente
              ? "Anular Urgente"
              : "Anular Venta"}
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleText}
      icon={iconElement}
      maxWidth="4xl"
      hasChanges={hasChanges}
      footer={footerContent}
    >
      <div className="p-6 space-y-6">
        {/* Información del viaje - SIEMPRE VISIBLE */}
        <div
          className={`rounded-xl p-5 border-2 backdrop-blur-md transition-all duration-200 ${
            validacionFecha.puedeAnular
              ? validacionFecha.esUrgente
                ? "bg-amber-900/30 border-amber-600/50"
                : "bg-blue-900/30 border-blue-600/50"
              : "bg-red-900/30 border-red-600/50"
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-2 rounded-lg backdrop-blur-sm ${
                validacionFecha.puedeAnular
                  ? validacionFecha.esUrgente
                    ? "bg-amber-800/50"
                    : "bg-blue-800/50"
                  : "bg-red-800/50"
              }`}
            >
              {validacionFecha.puedeAnular ? (
                validacionFecha.esUrgente ? (
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                )
              ) : (
                <XCircle className="h-6 w-6 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`font-semibold mb-2 ${
                  validacionFecha.puedeAnular
                    ? validacionFecha.esUrgente
                      ? "text-amber-200"
                      : "text-blue-200"
                    : "text-red-200"
                }`}
              >
                {validacionFecha.puedeAnular
                  ? validacionFecha.esUrgente
                    ? "Anulación Urgente"
                    : "Anulación Permitida"
                  : "Anulación No Permitida"}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-300">
                    Fecha programada:
                  </span>
                  <span className="font-semibold text-slate-100">
                    {validacionFecha.fechaFormateada}
                    {venta.horaViaje && ` a las ${venta.horaViaje}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-300">
                    {validacionFecha.puedeAnular
                      ? "Tiempo restante:"
                      : "Estado:"}
                  </span>
                  <span
                    className={`font-semibold ${
                      validacionFecha.puedeAnular
                        ? validacionFecha.esUrgente
                          ? "text-amber-300"
                          : "text-blue-300"
                        : "text-red-300"
                    }`}
                  >
                    {validacionFecha.puedeAnular
                      ? `${validacionFecha.horasRestantes} hora(s)`
                      : "Viaje ya iniciado"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-300">Ruta:</span>
                  <span className="font-semibold text-slate-100">
                    {venta.ruta.nombre}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-300">Cliente:</span>
                  <span className="font-semibold text-slate-100">
                    {venta.cliente.nombre} {venta.cliente.apellido}
                  </span>
                </div>
              </div>
              <div
                className={`mt-3 p-3 rounded-lg backdrop-blur-sm ${
                  validacionFecha.puedeAnular
                    ? validacionFecha.esUrgente
                      ? "bg-amber-800/30"
                      : "bg-blue-800/30"
                    : "bg-red-800/30"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    validacionFecha.puedeAnular
                      ? validacionFecha.esUrgente
                        ? "text-amber-200"
                        : "text-blue-200"
                      : "text-red-200"
                  }`}
                >
                  {validacionFecha.mensaje}
                </p>
                {!validacionFecha.puedeAnular && (
                  <p className="text-sm text-red-300 mt-2">
                    Las ventas no pueden ser anuladas después de la fecha y
                    hora programada del viaje. Para gestionar esta situación,
                    contacte al administrador del sistema.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido según validación */}
        {step === "validacion" && !validacionFecha.puedeAnular && (
          <div className="text-center py-8">
            <XCircle className="h-20 w-20 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              No se puede anular esta venta
            </h3>
            <p className="text-slate-300 mb-2 max-w-md mx-auto">
              El viaje programado para el{" "}
              <strong>{validacionFecha.fechaFormateada}</strong>
              {venta.horaViaje && (
                <>
                  {" "}
                  a las <strong>{venta.horaViaje}</strong>
                </>
              )}{" "}
              ya ha partido o está en curso.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              Las anulaciones deben realizarse antes de la fecha y hora del
              viaje.
            </p>
          </div>
        )}

        {step === "formulario" && validacionFecha.puedeAnular && (
          <>
            {/* Información detallada de la venta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del cliente */}
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </h3>
                <div className="bg-slate-700/30 rounded-xl p-4 space-y-2 backdrop-blur-md border border-slate-600/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nombre:</span>
                    <span className="font-medium text-slate-100 text-right">
                      {venta.cliente.nombre} {venta.cliente.apellido}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DNI:</span>
                    <span className="font-medium text-slate-100">
                      {venta.cliente.dni}
                    </span>
                  </div>
                  {venta.cliente.telefono && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="font-medium text-slate-100">
                        {venta.cliente.telefono}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de pago */}
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pago
                </h3>
                <div className="bg-slate-700/30 rounded-xl p-4 space-y-2 backdrop-blur-md border border-slate-600/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Método:</span>
                    <span className="font-medium text-slate-100">
                      {venta.metodoPago}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total:</span>
                    <span className="font-bold text-lg text-slate-100">
                      S/ {Number(venta.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pasajes:</span>
                    <span className="font-medium text-slate-100">
                      {venta.cantidadPasajes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getEstadoColor(
                        venta.estado
                      )}`}
                    >
                      {venta.estado}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario de anulación */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 border-t border-slate-600/50 pt-6"
            >
              {/* Advertencia de urgencia */}
              {validacionFecha.esUrgente && (
                <div className="bg-amber-900/30 border border-amber-600/50 rounded-xl p-4 backdrop-blur-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-200 mb-1">
                        Anulación de Último Momento
                      </h4>
                      <p className="text-amber-300 text-sm">
                        El viaje está programado en menos de 2 horas. Procese
                        esta anulación con urgencia para liberar los asientos
                        y notificar al equipo operativo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tipo de anulación y Motivo - en la misma fila */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de anulación */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Tipo de anulación
                    </h3>
                    <label className="flex items-center p-4 border-2 border-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-700/30 transition-all duration-200 backdrop-blur-sm flex-1">
                      <input
                        type="radio"
                        name="tipoAnulacion"
                        value="ANULACION"
                        checked={formData.tipoAnulacion === "ANULACION"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tipoAnulacion: e.target.value as TipoAnulacion,
                          }))
                        }
                        className="mr-3 text-blue-600 bg-slate-700 border-slate-600"
                      />
                      <div>
                        <div className="font-medium text-slate-100">
                          Anulación
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Motivo */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Motivo de anulación *
                    </h3>
                    <select
                      value={formData.motivo}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          motivo: e.target.value,
                        }))
                      }
                      className="flex-1 w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                      required
                    >
                      <option value="">Seleccionar motivo...</option>
                      {motivosComunes.map((motivo) => (
                        <option
                          key={motivo}
                          value={motivo}
                          className="bg-slate-800 text-slate-100"
                        >
                          {motivo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Observaciones adicionales
                  {formData.motivo === "Otro motivo" && " *"}
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      observaciones: e.target.value,
                    }))
                  }
                  rows={3}
                  className="block w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 resize-none backdrop-blur-sm transition-all duration-200"
                  placeholder={
                    formData.motivo === "Otro motivo"
                      ? "Especificar el motivo..."
                      : "Información adicional (opcional)..."
                  }
                  required={formData.motivo === "Otro motivo"}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 backdrop-blur-md">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-red-200 whitespace-pre-line">
                      {error}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
