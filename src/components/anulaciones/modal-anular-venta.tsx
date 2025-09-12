// src/components/anulaciones/modal-anular-venta.tsx - CORREGIDO

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAnulaciones } from "@/hooks/use-anulaciones";
import { TipoAnulacion, Anulacion, Venta } from "@/types";
import {
  formatearFechaViajeCompleta,
  puedeAnularVentaPorFecha,
} from "@/lib/utils/fecha-utils";
import {
  X,
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
} from "lucide-react";

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
  const { data: session } = useSession();
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
        return "bg-green-100 text-green-800";
      case "ANULADA":
        return "bg-red-100 text-red-800";
      case "REEMBOLSADA":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl drop-shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                validacionFecha.puedeAnular ? "bg-blue-100" : "bg-red-100"
              }`}
            >
              {validacionFecha.puedeAnular ? (
                <Shield className="h-6 w-6 text-blue-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Anular Venta - #{venta.numeroVenta}
              </h2>
              <p className="text-sm text-gray-900">
                {validacionFecha.puedeAnular
                  ? "Validación de anulación"
                  : "Anulación no permitida"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del viaje - SIEMPRE VISIBLE */}
          <div
            className={`rounded-lg p-5 border-2 ${
              validacionFecha.puedeAnular
                ? validacionFecha.esUrgente
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`p-2 rounded-lg ${
                  validacionFecha.puedeAnular
                    ? validacionFecha.esUrgente
                      ? "bg-amber-100"
                      : "bg-blue-100"
                    : "bg-red-100"
                }`}
              >
                {validacionFecha.puedeAnular ? (
                  validacionFecha.esUrgente ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  )
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 text-gray-900 ${
                    validacionFecha.puedeAnular
                      ? validacionFecha.esUrgente
                        ? "text-amber-900"
                        : "text-blue-900"
                      : "text-red-900"
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
                    <Calendar className="h-4 w-4 text-gray-700" />
                    <span className="font-medium text-gray-700">
                      Fecha programada:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {validacionFecha.fechaFormateada}
                      {venta.horaViaje && ` a las ${venta.horaViaje}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-700" />
                    <span className="font-medium text-gray-700">
                      {validacionFecha.puedeAnular
                        ? "Tiempo restante:"
                        : "Estado:"}
                    </span>
                    <span
                      className={`font-semibold ${
                        validacionFecha.puedeAnular
                          ? validacionFecha.esUrgente
                            ? "text-amber-700"
                            : "text-blue-700"
                          : "text-red-700"
                      }`}
                    >
                      {validacionFecha.puedeAnular
                        ? `${validacionFecha.horasRestantes} hora(s)`
                        : "Viaje ya iniciado"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-700" />
                    <span className="font-medium text-gray-700">Ruta:</span>
                    <span className="font-semibold text-gray-900">
                      {venta.ruta.nombre}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-700" />
                    <span className="font-medium text-gray-700">Cliente:</span>
                    <span className="font-semibold text-gray-900">
                      {venta.cliente.nombre} {venta.cliente.apellido}
                    </span>
                  </div>
                </div>
                <div
                  className={`mt-3 p-3 rounded-lg ${
                    validacionFecha.puedeAnular
                      ? validacionFecha.esUrgente
                        ? "bg-amber-100"
                        : "bg-blue-100"
                      : "bg-red-100"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      validacionFecha.puedeAnular
                        ? validacionFecha.esUrgente
                          ? "text-amber-800"
                          : "text-blue-800"
                        : "text-red-800"
                    }`}
                  >
                    {validacionFecha.mensaje}
                  </p>
                  {!validacionFecha.puedeAnular && (
                    <p className="text-sm text-red-700 mt-2">
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
              <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No se puede anular esta venta
              </h3>
              <p className="text-gray-600 mb-2 max-w-md mx-auto">
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
              <p className="text-sm text-gray-500 mb-8">
                Las anulaciones deben realizarse antes de la fecha y hora del
                viaje.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Entendido
              </button>
            </div>
          )}

          {step === "formulario" && validacionFecha.puedeAnular && (
            <>
              {/* Información detallada de la venta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información del cliente */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Cliente
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Nombre:</span>
                      <span className="font-medium text-gray-900 text-right">
                        {venta.cliente.nombre} {venta.cliente.apellido}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">DNI:</span>
                      <span className="font-medium text-gray-900">
                        {venta.cliente.dni}
                      </span>
                    </div>
                    {venta.cliente.telefono && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Teléfono:</span>
                        <span className="font-medium text-gray-900">
                          {venta.cliente.telefono}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información de pago */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pago
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Método:</span>
                      <span className="font-medium text-gray-900">
                        {venta.metodoPago}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total:</span>
                      <span className="font-bold text-lg text-gray-900">
                        S/ {Number(venta.total).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Pasajes:</span>
                      <span className="font-medium text-gray-900">
                        {venta.cantidadPasajes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Estado:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(
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
              <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
                {/* Advertencia de urgencia */}
                {validacionFecha.esUrgente && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">
                          Anulación de Último Momento
                        </h4>
                        <p className="text-amber-800 text-sm">
                          El viaje está programado en menos de 2 horas. Procese
                          esta anulación con urgencia para liberar los asientos
                          y notificar al equipo operativo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tipo de anulación */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Tipo de anulación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
                        className="mr-3 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          Anulación
                        </div>
                        <div className="text-sm text-gray-600">
                          Sin reembolso de dinero
                        </div>
                      </div>
                    </label>

                    {session?.user.role === "ADMINISTRADOR" && (
                      <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="tipoAnulacion"
                          value="REEMBOLSO"
                          checked={formData.tipoAnulacion === "REEMBOLSO"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tipoAnulacion: e.target.value as TipoAnulacion,
                            }))
                          }
                          className="mr-3 text-blue-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            Reembolso
                          </div>
                          <div className="text-sm text-gray-600">
                            Con devolución de dinero
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Monto de reembolso */}
                {formData.tipoAnulacion === "REEMBOLSO" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto a reembolsar *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">S/</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={Number(venta.total)}
                        step="0.01"
                        value={formData.montoReembolso}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            montoReembolso: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Máximo: S/ {Number(venta.total).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de anulación *
                  </label>
                  <select
                    value={formData.motivo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        motivo: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    required
                  >
                    <option value="">Seleccionar motivo...</option>
                    {motivosComunes.map((motivo) => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-red-800 whitespace-pre-line">
                        {error}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.motivo.trim()}
                    className={`px-6 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
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
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
