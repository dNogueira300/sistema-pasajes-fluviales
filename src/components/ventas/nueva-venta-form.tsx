"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { formatearFechaViaje } from "@/lib/utils/fecha-utils";
import {
  Search,
  User,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface Cliente {
  id?: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  nacionalidad: string;
}

interface Ruta {
  id: string;
  nombre: string;
  puertoOrigen: string;
  puertoDestino: string;
  precio: number;
  embarcacionRutas: {
    id: string;
    horasSalida: string[];
    embarcacion: {
      id: string;
      nombre: string;
      capacidad: number;
    };
  }[];
}

interface FormData {
  // Datos del cliente
  cliente: Cliente;
  // Datos del viaje
  rutaId: string;
  embarcacionId: string;
  fechaViaje: string;
  horaViaje: string;
  horaEmbarque: string;
  cantidadPasajes: number;
  // Datos adicionales
  metodoPago: string;
  observaciones: string;
}

interface DisponibilidadInfo {
  capacidadTotal: number;
  vendidos: number;
  disponibles: number;
  puedeVender: boolean;
}

export default function NuevaVentaForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { user } = useRequireAuth();
  const [step, setStep] = useState(1); // 1: Cliente, 2: Viaje, 3: Confirmación
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadInfo | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    cliente: {
      dni: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      nacionalidad: "Peruana",
    },
    rutaId: "",
    embarcacionId: "",
    fechaViaje: "",
    horaViaje: "",
    horaEmbarque: "",
    cantidadPasajes: 1,
    metodoPago: "EFECTIVO",
    observaciones: "",
  });

  // Cargar rutas al montar el componente
  useEffect(() => {
    cargarRutas();
  }, []);

  const cargarRutas = async () => {
    try {
      const response = await fetch("/api/rutas/activas");
      if (response.ok) {
        const data = await response.json();
        setRutas(data);
      }
    } catch (error) {
      console.error("Error cargando rutas:", error);
    }
  };

  // Buscar cliente por DNI
  const buscarCliente = async () => {
    if (formData.cliente.dni.length < 8) {
      setError("El DNI debe tener al menos 8 dígitos");
      return;
    }

    setBuscandoCliente(true);
    setError("");

    try {
      const response = await fetch(
        `/api/clientes/buscar?dni=${formData.cliente.dni}`
      );
      if (response.ok) {
        const cliente = await response.json();
        if (cliente) {
          setFormData((prev) => ({
            ...prev,
            cliente: {
              ...cliente,
              telefono: cliente.telefono || "",
              email: cliente.email || "",
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error buscando cliente:", error);
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Verificar disponibilidad cuando cambian los datos del viaje
  useEffect(() => {
    const verificarDisponibilidadAsync = async () => {
      if (
        formData.rutaId &&
        formData.embarcacionId &&
        formData.fechaViaje &&
        formData.horaViaje
      ) {
        try {
          const response = await fetch("/api/ventas/disponibilidad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embarcacionId: formData.embarcacionId,
              rutaId: formData.rutaId,
              fechaViaje: formData.fechaViaje,
              horaViaje: formData.horaViaje,
              cantidadSolicitada: formData.cantidadPasajes,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setDisponibilidad(data);
          }
        } catch (error) {
          console.error("Error verificando disponibilidad:", error);
        }
      }
    };

    verificarDisponibilidadAsync();
  }, [
    formData.rutaId,
    formData.embarcacionId,
    formData.fechaViaje,
    formData.horaViaje,
    formData.cantidadPasajes,
  ]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
        }),
      });

      if (response.ok) {
        const venta = await response.json();
        onSuccess?.();
        // Resetear formulario o redirigir
        setStep(1);
        setFormData({
          cliente: {
            dni: "",
            nombre: "",
            apellido: "",
            telefono: "",
            email: "",
            nacionalidad: "Peruana",
          },
          rutaId: "",
          embarcacionId: "",
          fechaViaje: "",
          horaViaje: "",
          horaEmbarque: "",
          cantidadPasajes: 1,
          metodoPago: "EFECTIVO",
          observaciones: "",
        });
        // Mostrar notificación personalizada
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50";
        notification.innerHTML = `
          <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-medium">¡Venta creada exitosamente!</p>
            <p class="text-sm">Número de venta: ${venta.numeroVenta}</p>
          </div>
        `;
        document.body.appendChild(notification);

        // Remover la notificación después de 5 segundos
        setTimeout(() => {
          notification.classList.add("opacity-0", "transition-opacity");
          setTimeout(() => notification.remove(), 300);
        }, 5000);
      } else {
        const error = await response.json();
        setError(error.message || "Error al crear la venta");
      }
    } catch (error) {
      setError("Error de conexión");
      console.error("Error creando venta:", error);
    } finally {
      setLoading(false);
    }
  };

  const rutaSeleccionada = rutas.find((r) => r.id === formData.rutaId);
  const embarcacionSeleccionada = rutaSeleccionada?.embarcacionRutas.find(
    (er) => er.embarcacion.id === formData.embarcacionId
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header con steps */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Nueva Venta</h2>
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  s === step
                    ? "bg-blue-600 text-white"
                    : s < step
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span className={step === 1 ? "font-semibold text-blue-600" : ""}>
            1. Datos del Cliente
          </span>
          <span className={step === 2 ? "font-semibold text-blue-600" : ""}>
            2. Detalles del Viaje
          </span>
          <span className={step === 3 ? "font-semibold text-blue-600" : ""}>
            3. Confirmación
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: Datos del Cliente */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.cliente.dni}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cliente: { ...prev.cliente, dni: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="12345678"
                    maxLength={8}
                  />
                  <button
                    onClick={buscarCliente}
                    disabled={
                      buscandoCliente || formData.cliente.dni.length < 8
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {buscandoCliente ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nacionalidad
                </label>
                <select
                  value={formData.cliente.nacionalidad}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cliente: {
                        ...prev.cliente,
                        nacionalidad: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="Peruana">Peruana</option>
                  <option value="Brasileña">Brasileña</option>
                  <option value="Colombiana">Colombiana</option>
                  <option value="Ecuatoriana">Ecuatoriana</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombres *
                </label>
                <input
                  type="text"
                  value={formData.cliente.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cliente: { ...prev.cliente, nombre: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Juan Carlos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={formData.cliente.apellido}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cliente: { ...prev.cliente, apellido: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Pérez García"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.cliente.telefono}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cliente: { ...prev.cliente, telefono: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="+51987654321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.cliente.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cliente: { ...prev.cliente, email: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="cliente@email.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={
                  !formData.cliente.dni ||
                  !formData.cliente.nombre ||
                  !formData.cliente.apellido
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Detalles del Viaje */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Detalles del Viaje
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruta *
                </label>
                <select
                  value={formData.rutaId}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      rutaId: e.target.value,
                      embarcacionId: "", // Reset embarcación
                    }));
                    setDisponibilidad(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                >
                  <option value="">Seleccionar ruta...</option>
                  {rutas.map((ruta) => (
                    <option key={ruta.id} value={ruta.id}>
                      {ruta.nombre} - S/{" "}
                      {parseFloat(ruta.precio.toString()).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {rutaSeleccionada && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Embarcación *
                  </label>
                  <select
                    value={formData.embarcacionId}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        embarcacionId: e.target.value,
                      }));
                      setDisponibilidad(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  >
                    <option value="">Seleccionar embarcación...</option>
                    {rutaSeleccionada.embarcacionRutas.map((er) => (
                      <option key={er.embarcacion.id} value={er.embarcacion.id}>
                        {er.embarcacion.nombre} (Capacidad:{" "}
                        {er.embarcacion.capacidad})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Viaje *
                </label>
                <input
                  type="date"
                  value={formData.fechaViaje}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaViaje: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                />
              </div>

              {embarcacionSeleccionada && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Viaje *
                  </label>
                  <select
                    value={formData.horaViaje}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        horaViaje: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  >
                    <option value="">Seleccionar hora...</option>
                    {embarcacionSeleccionada.horasSalida.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Embarque *
                </label>
                <input
                  type="time"
                  value={formData.horaEmbarque}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      horaEmbarque: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de Pasajes *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.cantidadPasajes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cantidadPasajes: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={formData.metodoPago}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metodoPago: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="YAPE">Yape</option>
                  <option value="PLIN">Plin</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      observaciones: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  rows={3}
                  placeholder="Notas adicionales sobre el viaje..."
                />
              </div>
            </div>

            {/* Información de disponibilidad */}
            {disponibilidad && (
              <div
                className={`p-4 rounded-lg border ${
                  disponibilidad.puedeVender
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start">
                  {disponibilidad.puedeVender ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                  )}
                  <div>
                    <h4
                      className={`font-semibold ${
                        disponibilidad.puedeVender
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {disponibilidad.puedeVender
                        ? "¡Disponible!"
                        : "Sin disponibilidad suficiente"}
                    </h4>
                    <p
                      className={`text-sm ${
                        disponibilidad.puedeVender
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      Capacidad total: {disponibilidad.capacidadTotal} |
                      Vendidos: {disponibilidad.vendidos} | Disponibles:{" "}
                      {disponibilidad.disponibles}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  !disponibilidad?.puedeVender ||
                  !formData.rutaId ||
                  !formData.embarcacionId ||
                  !formData.fechaViaje ||
                  !formData.horaViaje ||
                  !formData.horaEmbarque
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmación */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirmar Venta
            </h3>

            {/* Resumen de la venta */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Información del Cliente
                  </h4>
                  <div className="space-y-2 text-sm text-gray-800">
                    <p>
                      <span className="text-gray-600">DNI:</span>{" "}
                      {formData.cliente.dni}
                    </p>
                    <p>
                      <span className="text-gray-600">Nombre:</span>{" "}
                      {formData.cliente.nombre} {formData.cliente.apellido}
                    </p>
                    <p>
                      <span className="text-gray-600">Teléfono:</span>{" "}
                      {formData.cliente.telefono || "No proporcionado"}
                    </p>
                    <p>
                      <span className="text-gray-600">Email:</span>{" "}
                      {formData.cliente.email || "No proporcionado"}
                    </p>
                    <p>
                      <span className="text-gray-600">Nacionalidad:</span>{" "}
                      {formData.cliente.nacionalidad}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Detalles del Viaje
                  </h4>
                  <div className="space-y-2 text-sm text-gray-800">
                    <p>
                      <span className="text-gray-600">Ruta:</span>{" "}
                      {rutaSeleccionada?.nombre}
                    </p>
                    <p>
                      <span className="text-gray-600">Embarcación:</span>{" "}
                      {embarcacionSeleccionada?.embarcacion.nombre}
                    </p>
                    <p>
                      <span className="text-gray-600">Fecha:</span>{" "}
                      {formatearFechaViaje(formData.fechaViaje)}
                    </p>
                    <p>
                      <span className="text-gray-600">Hora de viaje:</span>{" "}
                      {formData.horaViaje}
                    </p>
                    <p>
                      <span className="text-gray-600">Hora de embarque:</span>{" "}
                      {formData.horaEmbarque}
                    </p>
                    <p>
                      <span className="text-gray-600">Cantidad:</span>{" "}
                      {formData.cantidadPasajes} pasaje(s)
                    </p>
                    <p>
                      <span className="text-gray-600">Método de pago:</span>{" "}
                      {formData.metodoPago}
                    </p>
                  </div>
                </div>
              </div>

              {formData.observaciones && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Observaciones
                  </h4>
                  <p className="text-sm text-gray-800">
                    {formData.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* Resumen financiero */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">
                Resumen de Pago
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Precio unitario:</span>
                  <span className="text-blue-900">
                    S/{" "}
                    {parseFloat(
                      (rutaSeleccionada?.precio || 0).toString()
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Cantidad:</span>
                  <span className="text-blue-900">
                    {formData.cantidadPasajes}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Subtotal:</span>
                  <span className="text-blue-900">
                    S/{" "}
                    {(
                      parseFloat((rutaSeleccionada?.precio || 0).toString()) *
                      formData.cantidadPasajes
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Impuestos:</span>
                  <span className="text-blue-900">S/ 0.00</span>
                </div>
                <div className="border-t border-blue-300 pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-blue-900">Total:</span>
                    <span className="text-blue-900">
                      S/{" "}
                      {(
                        parseFloat((rutaSeleccionada?.precio || 0).toString()) *
                        formData.cantidadPasajes
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Confirmar Venta
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
