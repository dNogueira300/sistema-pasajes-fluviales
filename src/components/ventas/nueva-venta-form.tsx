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

interface PuertoEmbarque {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
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

interface MetodoPago {
  tipo: string;
  monto: number;
  referencia?: string;
}

interface FormData {
  // Datos del cliente
  cliente: Cliente;
  // Datos del viaje
  rutaId: string;
  embarcacionId: string;
  puertoEmbarqueId: string; // NUEVO CAMPO
  fechaViaje: string;
  horaViaje: string;
  horaEmbarque: string;
  cantidadPasajes: number;
  // Datos adicionales
  tipoPago: "UNICO" | "HIBRIDO";
  metodoPago: string;
  metodosPago: MetodoPago[];
  observaciones: string;
}

interface DisponibilidadInfo {
  capacidadTotal: number;
  vendidos: number;
  disponibles: number;
  puedeVender: boolean;
  mensaje?: string;
}

export default function NuevaVentaForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { user } = useRequireAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [puertosEmbarque, setPuertosEmbarque] = useState<PuertoEmbarque[]>([]); // NUEVO ESTADO
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadInfo | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [codigoPais, setCodigoPais] = useState("+51");

  const codigosPaises = [
    { codigo: "+51", pais: "Perú", bandera: "🇵🇪" },
    { codigo: "+55", pais: "Brasil", bandera: "🇧🇷" },
    { codigo: "+57", pais: "Colombia", bandera: "🇨🇴" },
    { codigo: "+593", pais: "Ecuador", bandera: "🇪🇨" },
    { codigo: "+591", pais: "Bolivia", bandera: "🇧🇴" },
    { codigo: "+1", pais: "Estados Unidos", bandera: "🇺🇸" },
    { codigo: "+34", pais: "España", bandera: "🇪🇸" },
  ];

  const formatearTelefonoCompleto = () => {
    if (!formData.cliente.telefono) return "";
    return `${codigoPais}${formData.cliente.telefono}`;
  };

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
    puertoEmbarqueId: "", // NUEVO CAMPO
    fechaViaje: "",
    horaViaje: "",
    horaEmbarque: "",
    cantidadPasajes: 1,
    tipoPago: "UNICO",
    metodoPago: "EFECTIVO",
    metodosPago: [],
    observaciones: "",
  });

  // Función para calcular totales
  const calcularTotales = (metodosP: MetodoPago[] = formData.metodosPago) => {
    const totalVenta =
      parseFloat((rutaSeleccionada?.precio || 0).toString()) *
      formData.cantidadPasajes;
    const totalPagado = metodosP.reduce((sum, metodo) => sum + metodo.monto, 0);
    const faltaPagar = totalVenta - totalPagado;
    return { totalVenta, totalPagado, faltaPagar };
  };

  // Cargar rutas y puertos al montar el componente
  useEffect(() => {
    cargarRutas();
    cargarPuertosEmbarque(); // NUEVA FUNCIÓN
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

  // NUEVA FUNCIÓN para cargar puertos de embarque
  const cargarPuertosEmbarque = async () => {
    try {
      const response = await fetch("/api/puertos-embarque");
      if (response.ok) {
        const data = await response.json();
        setPuertosEmbarque(data);
      }
    } catch (error) {
      console.error("Error cargando puertos de embarque:", error);
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
          // Separar código de país del teléfono si existe
          let telefono = cliente.telefono || "";
          let codigo = "+51"; // Por defecto Perú

          if (telefono) {
            // Buscar si el teléfono tiene algún código de país conocido
            const codigoEncontrado = codigosPaises.find((item) =>
              telefono.startsWith(item.codigo)
            );

            if (codigoEncontrado) {
              codigo = codigoEncontrado.codigo;
              telefono = telefono.substring(codigoEncontrado.codigo.length);
            }
          }

          setCodigoPais(codigo);
          setFormData((prev) => ({
            ...prev,
            cliente: {
              ...cliente,
              telefono: telefono,
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
          } else {
            const errorData = await response.json();
            setError(errorData.error || "Error verificando disponibilidad");
          }
        } catch (error) {
          console.error("Error verificando disponibilidad:", error);
          setError("Error de conexión al verificar disponibilidad");
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
      // Preparar datos con teléfono completo
      const datosVenta = {
        ...formData,
        cliente: {
          ...formData.cliente,
          telefono: formData.cliente.telefono
            ? formatearTelefonoCompleto()
            : "",
        },
        userId: user?.id,
      };

      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosVenta),
      });

      if (response.ok) {
        const venta = await response.json();
        onSuccess?.();

        // Resetear formulario
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
          puertoEmbarqueId: "", // RESETEAR NUEVO CAMPO
          fechaViaje: "",
          horaViaje: "",
          horaEmbarque: "",
          cantidadPasajes: 1,
          tipoPago: "UNICO",
          metodoPago: "EFECTIVO",
          metodosPago: [],
          observaciones: "",
        });

        // Mostrar notificación de éxito
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

        setTimeout(() => {
          notification.classList.add("opacity-0", "transition-opacity");
          setTimeout(() => notification.remove(), 300);
        }, 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al crear la venta");
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
  const puertoSeleccionado = puertosEmbarque.find(
    (p) => p.id === formData.puertoEmbarqueId
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
                <div className="flex">
                  {/* Select para código de país */}
                  <select
                    value={codigoPais}
                    onChange={(e) => setCodigoPais(e.target.value)}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 border-r-0 text-sm"
                  >
                    {codigosPaises.map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.bandera} {item.codigo}
                      </option>
                    ))}
                  </select>

                  {/* Input para el número */}
                  <input
                    type="tel"
                    value={formData.cliente.telefono}
                    onChange={(e) => {
                      // Solo permitir números
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        cliente: { ...prev.cliente, telefono: value },
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="987654321"
                    maxLength={9} // Máximo para números peruanos
                  />
                </div>
                {/* Mostrar número completo formateado */}
                {formData.cliente.telefono && (
                  <div className="mt-1 text-xs text-gray-500">
                    Teléfono completo: {formatearTelefonoCompleto()}
                  </div>
                )}
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
                      embarcacionId: "",
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

              {/* NUEVO CAMPO: Puerto de Embarque */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 items-center">
                  Puerto de Embarque *
                </label>
                <select
                  value={formData.puertoEmbarqueId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      puertoEmbarqueId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                >
                  <option value="">Seleccionar puerto de embarque...</option>
                  {puertosEmbarque.map((puerto) => (
                    <option key={puerto.id} value={puerto.id}>
                      {puerto.nombre}
                      {puerto.direccion && ` - ${puerto.direccion}`}
                    </option>
                  ))}
                </select>
                {puertoSeleccionado?.descripcion && (
                  <p className="mt-1 text-sm text-gray-600">
                    {puertoSeleccionado.descripcion}
                  </p>
                )}
              </div>

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
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setFormData((prev) => ({
                      ...prev,
                      cantidadPasajes: value,
                    }));
                    setDisponibilidad(null); // Resetear disponibilidad para forzar nueva verificación
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pago
                  </label>
                  <select
                    value={formData.tipoPago}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoPago: e.target.value as "UNICO" | "HIBRIDO",
                        metodosPago: [],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="UNICO">Pago Único</option>
                    <option value="HIBRIDO">Pago Híbrido</option>
                  </select>
                </div>

                {formData.tipoPago === "UNICO" ? (
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
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Métodos de Pago
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const { faltaPagar } = calcularTotales();
                          setFormData((prev) => ({
                            ...prev,
                            metodosPago: [
                              ...prev.metodosPago,
                              {
                                tipo: "EFECTIVO",
                                monto:
                                  prev.metodosPago.length === 0
                                    ? 0
                                    : Math.max(0, faltaPagar),
                              },
                            ],
                          }));
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        + Agregar método
                      </button>
                    </div>

                    {formData.metodosPago.map((metodo, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex-1">
                          <input
                            type="number"
                            value={metodo.monto}
                            onChange={(e) => {
                              const newMetodosPago = [...formData.metodosPago];
                              newMetodosPago[index].monto =
                                parseFloat(e.target.value) || 0;
                              setFormData((prev) => ({
                                ...prev,
                                metodosPago: newMetodosPago,
                              }));
                            }}
                            step="0.01"
                            min="0"
                            placeholder="Monto"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newMetodosPago = formData.metodosPago.filter(
                              (_, i) => i !== index
                            );
                            setFormData((prev) => ({
                              ...prev,
                              metodosPago: newMetodosPago,
                            }));
                          }}
                          className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar método"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-red-600">
                            <span className="text-lg font-medium leading-none relative -top-0.5">
                              -
                            </span>
                          </span>
                        </button>
                      </div>
                    ))}

                    {formData.metodosPago.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Total pagado: S/{" "}
                        {formData.metodosPago
                          .reduce((sum, metodo) => sum + metodo.monto, 0)
                          .toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
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
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4
                      className={`font-semibold text-lg mb-2 ${
                        disponibilidad.puedeVender
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {disponibilidad.puedeVender
                        ? "¡Asientos Disponibles!"
                        : "Capacidad Insuficiente"}
                    </h4>

                    {/* Información de la embarcación */}
                    <div className="mb-3 p-3 bg-white/50 rounded-lg border border-white/20">
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-gray-800">
                          🚢 {embarcacionSeleccionada?.embarcacion.nombre}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Capacidad:</span>
                          <div className="font-bold text-gray-900">
                            {disponibilidad.capacidadTotal}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Vendidos:</span>
                          <div
                            className={`font-bold ${
                              disponibilidad.vendidos > 0
                                ? "text-orange-600"
                                : "text-gray-500"
                            }`}
                          >
                            {disponibilidad.vendidos}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Disponibles:</span>
                          <div
                            className={`font-bold text-lg ${
                              disponibilidad.disponibles > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {disponibilidad.disponibles}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del viaje específico */}
                    <div className="text-sm space-y-1">
                      <p
                        className={`${
                          disponibilidad.puedeVender
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        📅{" "}
                        <strong>
                          {formatearFechaViaje(formData.fechaViaje)}
                        </strong>{" "}
                        a las <strong>{formData.horaViaje}</strong>
                      </p>
                      <p
                        className={`font-medium ${
                          disponibilidad.puedeVender
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {disponibilidad.puedeVender
                          ? `✅ Puedes vender ${formData.cantidadPasajes} pasaje(s)`
                          : `❌ Solo ${disponibilidad.disponibles} asientos libres, necesitas ${formData.cantidadPasajes}`}
                      </p>
                    </div>

                    {/* Barra visual de ocupación */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Ocupación</span>
                        <span>
                          {Math.round(
                            (disponibilidad.vendidos /
                              disponibilidad.capacidadTotal) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            disponibilidad.vendidos === 0
                              ? "bg-green-400"
                              : disponibilidad.vendidos <
                                disponibilidad.capacidadTotal * 0.7
                              ? "bg-green-500"
                              : disponibilidad.vendidos <
                                disponibilidad.capacidadTotal
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${
                              (disponibilidad.vendidos /
                                disponibilidad.capacidadTotal) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error al verificar disponibilidad */}
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
                  !formData.puertoEmbarqueId ||
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
                    <p className="flex items-center">
                      <span className="text-gray-600">
                        Puerto de embarque:{" "}
                      </span>
                      {puertoSeleccionado?.nombre}
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
                      <span className="text-gray-600">Tipo de pago:</span>{" "}
                      {formData.tipoPago === "UNICO"
                        ? "Pago Único"
                        : "Pago Híbrido"}
                    </p>
                    {formData.tipoPago === "UNICO" ? (
                      <p>
                        <span className="text-gray-600">Método de pago:</span>{" "}
                        {formData.metodoPago}
                      </p>
                    ) : (
                      <div className="mt-2">
                        <span className="text-gray-600">Métodos de pago:</span>
                        <ul className="mt-1 space-y-1">
                          {formData.metodosPago.map((metodo, index) => (
                            <li key={index} className="text-sm">
                              {metodo.tipo}: S/ {metodo.monto.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
