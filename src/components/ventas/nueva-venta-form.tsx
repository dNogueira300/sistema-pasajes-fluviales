//src\components\ventas\nueva-venta-form
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { formatearFechaDesdeInput } from "@/lib/utils/fecha-utils";
import {
  User,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  ChevronDown,
  X,
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
    diasOperacion: string[];
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
  cliente: Cliente;
  rutaId: string;
  embarcacionId: string;
  puertoEmbarqueId: string;
  origenSeleccionado: string;
  destinoSeleccionado: string;
  precioFinal: number;
  fechaViaje: string;
  horaViaje: string;
  horaEmbarque: string;
  cantidadPasajes: number;
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
  const [puertosEmbarque, setPuertosEmbarque] = useState<PuertoEmbarque[]>([]);
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadInfo | null>(null);
  const [codigoPais, setCodigoPais] = useState("+51");
  const [diasOperativos, setDiasOperativos] = useState<string[]>([]);
  const [buscandoAutoCliente, setBuscandoAutoCliente] = useState(false);
  const [dniValido, setDniValido] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState("");
  const [rutasFiltradas, setRutasFiltradas] = useState<Ruta[]>([]);
  const [busquedaRuta, setBusquedaRuta] = useState("");
  const [mostrarListaRutas, setMostrarListaRutas] = useState(false);
  const [direccionViaje, setDireccionViaje] = useState<
    "ORIGEN_DESTINO" | "DESTINO_ORIGEN"
  >("ORIGEN_DESTINO");
  const [precioPersonalizado, setPrecioPersonalizado] = useState<number>(0);
  const [usarPrecioPersonalizado, setUsarPrecioPersonalizado] = useState(false);

  const codigosPaises = useMemo(
    () => [
      { codigo: "+51", pais: "Perú", bandera: "🇵🇪" },
      { codigo: "+55", pais: "Brasil", bandera: "🇧🇷" },
      { codigo: "+57", pais: "Colombia", bandera: "🇨🇴" },
      { codigo: "+593", pais: "Ecuador", bandera: "🇪🇨" },
      { codigo: "+591", pais: "Bolivia", bandera: "🇧🇴" },
      { codigo: "+1", pais: "Estados Unidos", bandera: "🇺🇸" },
      { codigo: "+34", pais: "España", bandera: "🇪🇸" },
    ],
    []
  );

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
    puertoEmbarqueId: "",
    origenSeleccionado: "",
    destinoSeleccionado: "",
    precioFinal: 0,
    fechaViaje: "",
    horaViaje: "",
    horaEmbarque: "",
    cantidadPasajes: 1,
    tipoPago: "UNICO",
    metodoPago: "EFECTIVO",
    metodosPago: [],
    observaciones: "",
  });

  // Función para actualizar origen, destino y precio cuando cambia la ruta o dirección
  const actualizarDatosRuta = useCallback(
    (ruta: Ruta | null, direccion: "ORIGEN_DESTINO" | "DESTINO_ORIGEN") => {
      if (!ruta) return;

      const esOrigenDestino = direccion === "ORIGEN_DESTINO";
      const origen = esOrigenDestino
        ? limpiarNombrePuerto(ruta.puertoOrigen)
        : limpiarNombrePuerto(ruta.puertoDestino);
      const destino = esOrigenDestino
        ? limpiarNombrePuerto(ruta.puertoDestino)
        : limpiarNombrePuerto(ruta.puertoOrigen);

      setFormData((prev) => ({
        ...prev,
        origenSeleccionado: origen,
        destinoSeleccionado: destino,
        precioFinal: parseFloat(ruta.precio.toString()),
      }));

      setPrecioPersonalizado(parseFloat(ruta.precio.toString()));
      setUsarPrecioPersonalizado(false);
    },
    []
  );

  // Función para buscar automáticamente al ingresar DNI
  const buscarClienteAutomatico = useCallback(
    async (dni: string) => {
      if (dni.length !== 8) return;

      setBuscandoAutoCliente(true);
      setError("");

      try {
        const response = await fetch(`/api/clientes/buscar?dni=${dni}`);
        if (response.ok) {
          const cliente = await response.json();
          if (cliente) {
            let telefono = cliente.telefono || "";
            let codigo = "+51";

            if (telefono) {
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
            setDniValido(true);
          } else {
            setFormData((prev) => ({
              ...prev,
              cliente: {
                ...prev.cliente,
                dni: dni,
                nombre: "",
                apellido: "",
                telefono: "",
                email: "",
                nacionalidad: "Peruana",
              },
            }));
            setDniValido(false);
          }
        }
      } catch (error) {
        console.error("Error buscando cliente:", error);
        setError("Error de conexión al buscar cliente");
      } finally {
        setBuscandoAutoCliente(false);
      }
    },
    [codigosPaises]
  );

  // Efecto para filtrar rutas basado en la búsqueda
  useEffect(() => {
    if (busquedaRuta.trim() === "") {
      setRutasFiltradas(rutas);
    } else {
      const filtradas = rutas.filter((ruta) =>
        ruta.nombre.toLowerCase().includes(busquedaRuta.toLowerCase())
      );
      setRutasFiltradas(filtradas);
    }
  }, [busquedaRuta, rutas]);

  // Función para seleccionar una ruta
  const seleccionarRuta = (ruta: Ruta) => {
    setFormData((prev) => ({
      ...prev,
      rutaId: ruta.id,
      embarcacionId: "",
    }));
    setBusquedaRuta(ruta.nombre);
    setMostrarListaRutas(false);
    setDisponibilidad(null);
  };

  // Función para limpiar la selección
  const limpiarSeleccionRuta = () => {
    setFormData((prev) => ({
      ...prev,
      rutaId: "",
      embarcacionId: "",
    }));
    setBusquedaRuta("");
    setMostrarListaRutas(true);
    setDisponibilidad(null);
  };

  // Efecto para cargar rutas filtradas inicialmente
  useEffect(() => {
    setRutasFiltradas(rutas);
  }, [rutas]);

  // Efecto para cerrar la lista al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".ruta-search-container")) {
        setMostrarListaRutas(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efecto para disparar la búsqueda automática al cambiar el DNI
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.cliente.dni.length === 8) {
        buscarClienteAutomatico(formData.cliente.dni);
      } else {
        setDniValido(false);
        setBuscandoAutoCliente(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.cliente.dni, buscarClienteAutomatico]);

  const formatearTelefonoCompleto = () => {
    if (!formData.cliente.telefono) return "";
    return `${codigoPais}${formData.cliente.telefono}`;
  };

  const calcularTotales = (metodosP: MetodoPago[] = formData.metodosPago) => {
    const totalVenta = formData.precioFinal * formData.cantidadPasajes;
    const totalPagado = metodosP.reduce((sum, metodo) => sum + metodo.monto, 0);
    const faltaPagar = totalVenta - totalPagado;
    return { totalVenta, totalPagado, faltaPagar };
  };

  useEffect(() => {
    cargarRutas();
    cargarPuertosEmbarque();
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

  // Función para limpiar el nombre del puerto
  const limpiarNombrePuerto = (nombrePuerto: string): string => {
    return nombrePuerto
      .replace(/^Puerto de\s*/i, "") // Elimina "Puerto de" al inicio
      .replace(/^Puerto\s*/i, "") // Elimina "Puerto" al inicio
      .trim();
  };

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
      const datosVenta = {
        ...formData,
        cliente: {
          ...formData.cliente,
          telefono: formData.cliente.telefono
            ? formatearTelefonoCompleto()
            : "",
        },
        // AGREGAR ESTOS CAMPOS
        precioFinal: formData.precioFinal,
        origenSeleccionado: formData.origenSeleccionado,
        destinoSeleccionado: formData.destinoSeleccionado,
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
          puertoEmbarqueId: "",
          origenSeleccionado: "",
          destinoSeleccionado: "",
          precioFinal: 0,
          fechaViaje: "",
          horaViaje: "",
          horaEmbarque: "",
          cantidadPasajes: 1,
          tipoPago: "UNICO",
          metodoPago: "EFECTIVO",
          metodosPago: [],
          observaciones: "",
        });

        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-green-900/80 border border-green-600/50 text-green-100 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 backdrop-blur-md";
        notification.innerHTML = `
          <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-medium">¡Venta creada exitosamente!</p>
            <p class="text-sm text-green-300">Número de venta: ${venta.numeroVenta}</p>
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

  // 1. Agregar función auxiliar para normalizar días (eliminar acentos y trim)
  const normalizarDia = (dia: string): string => {
    return dia
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
      .trim();
  };

  // Función para obtener el día de la semana desde una fecha
  const obtenerDiaSemana = (fecha: string): string => {
    const date = new Date(fecha + "T00:00:00");
    const diasMap: { [key: number]: string } = {
      0: "DOMINGO",
      1: "LUNES",
      2: "MARTES",
      3: "MIERCOLES",
      4: "JUEVES",
      5: "VIERNES",
      6: "SABADO",
    };
    return diasMap[date.getDay()];
  };

  // Función para validar si una fecha es válida
  const esFechaValida = (fecha: string): boolean => {
    if (!fecha || diasOperativos.length === 0) return true;

    const diaSemana = obtenerDiaSemana(fecha);

    // Normalizar el día calculado
    const diaNormalizado = normalizarDia(diaSemana);

    // Normalizar TODOS los días operativos para la comparación
    const diasOperativosNormalizados = diasOperativos.map((d) =>
      normalizarDia(d)
    );

    // Comparar con días normalizados (sin acentos, sin espacios, uppercase)
    return diasOperativosNormalizados.includes(diaNormalizado);
  };

  // Función para deshabilitar días en el input de fecha
  const obtenerFechaMinima = (): string => {
    return new Date().toISOString().split("T")[0];
  };

  // Modificar el manejo del cambio de fecha
  const handleFechaChange = (fecha: string) => {
    // PASO 1: Siempre actualizar el estado primero
    setFormData((prev) => ({ ...prev, fechaViaje: fecha }));

    // PASO 2: Si la fecha está vacía, limpiar error y salir
    if (!fecha) {
      setError("");
      return;
    }

    // PASO 3: Validar solo si hay días operativos configurados
    if (diasOperativos.length > 0) {
      const esValida = esFechaValida(fecha);

      if (!esValida) {
        // Fecha NO válida: mostrar error
        const diaSemana = obtenerDiaSemana(fecha);
        setError(
          `La embarcación seleccionada no opera los días ${diaSemana}. ` +
            `Esta ruta opera: ${diasOperativos.join(", ")}`
        );
      } else {
        // Fecha válida: limpiar error de días (si existe)
        setError((prevError) => {
          if (prevError.includes("no opera")) {
            return "";
          }
          return prevError;
        });
      }
    } else {
      // No hay restricciones de días: limpiar cualquier error de días
      setError((prevError) => {
        if (prevError.includes("no opera")) {
          return "";
        }
        return prevError;
      });
    }
  };

  // Componente auxiliar para mostrar días operativos
  const DiasOperativosInfo = () => {
    if (diasOperativos.length === 0) return null;

    const diasCompletos: { [key: string]: string } = {
      LUNES: "Lunes",
      MARTES: "Martes",
      MIERCOLES: "Miércoles", // CON acento para display
      MIÉRCOLES: "Miércoles", // Fallback si viene con acento
      JUEVES: "Jueves",
      VIERNES: "Viernes",
      SABADO: "Sábado", // CON acento para display
      SÁBADO: "Sábado", // Fallback si viene con acento
      DOMINGO: "Domingo",
    };

    return (
      <div className="mt-2 p-3 bg-blue-900/30 border border-blue-600/50 rounded-xl">
        <p className="text-sm text-blue-200 font-medium mb-2">
          📅 Días de operación:
        </p>
        <div className="flex flex-wrap gap-2">
          {diasOperativos.map((dia) => {
            // Normalizar para la key, pero mostrar con acento
            const diaNormalizado = normalizarDia(dia);
            const displayName =
              diasCompletos[dia] || diasCompletos[diaNormalizado] || dia;

            return (
              <span
                key={dia}
                className="px-2 py-1 text-xs bg-blue-600/50 text-blue-100 rounded-lg border border-blue-500/50"
              >
                {displayName}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // Actualizar días operativos al cambiar ruta o embarcación
  useEffect(() => {
    if (formData.rutaId && formData.embarcacionId) {
      const rutaSeleccionada = rutas.find((r) => r.id === formData.rutaId);
      const embarcacionRuta = rutaSeleccionada?.embarcacionRutas.find(
        (er) => er.embarcacion.id === formData.embarcacionId
      );

      if (embarcacionRuta) {
        const nuevosDiasOperativos = embarcacionRuta.diasOperacion || [];
        setDiasOperativos(nuevosDiasOperativos);

        // IMPORTANTE: Si ya hay una fecha seleccionada, revalidarla
        if (formData.fechaViaje && nuevosDiasOperativos.length > 0) {
          // Verificar si la fecha actual es válida con los nuevos días
          const diaSemana = obtenerDiaSemana(formData.fechaViaje);
          const diaNormalizado = normalizarDia(diaSemana);
          const diasNormalizados = nuevosDiasOperativos.map((d) =>
            normalizarDia(d)
          );

          const esValida = diasNormalizados.includes(diaNormalizado);

          if (!esValida) {
            // La fecha ya no es válida con la nueva embarcación
            setError(
              `La embarcación seleccionada no opera los días ${diaSemana}. ` +
                `Esta ruta opera: ${nuevosDiasOperativos.join(", ")}`
            );
          } else {
            // La fecha sigue siendo válida, limpiar error usando forma funcional
            setError((prevError) => {
              if (prevError.includes("no opera")) {
                return "";
              }
              return prevError;
            });
          }
        }
      }
    } else {
      // Si no hay ruta o embarcación, limpiar días operativos
      setDiasOperativos([]);
      setError((prevError) => {
        if (prevError.includes("no opera")) {
          return "";
        }
        return prevError;
      });
    }
  }, [formData.rutaId, formData.embarcacionId, formData.fechaViaje, rutas]);

  // Función para calcular diferencia en horas entre dos horarios
  const calcularDiferenciaHoras = (
    horaInicio: string,
    horaFin: string
  ): number => {
    if (!horaInicio || !horaFin) return 0;

    const [horasInicio, minutosInicio] = horaInicio.split(":").map(Number);
    const [horasFin, minutosFin] = horaFin.split(":").map(Number);

    const fechaInicio = new Date();
    fechaInicio.setHours(horasInicio, minutosInicio, 0, 0);

    const fechaFin = new Date();
    fechaFin.setHours(horasFin, minutosFin, 0, 0);

    // Si la hora de fin es menor, asumimos que es del día siguiente
    if (fechaFin < fechaInicio) {
      fechaFin.setDate(fechaFin.getDate() + 1);
    }

    const diferencia = fechaFin.getTime() - fechaInicio.getTime();
    return diferencia / (1000 * 60 * 60); // Convertir a horas
  };

  // Manejar estado de error de hora de embarque
  useEffect(() => {
    // Validar horarios cuando ambos campos estén llenos
    if (formData.horaViaje && formData.horaEmbarque) {
      if (formData.horaEmbarque >= formData.horaViaje) {
        if (!error || !error.includes("Hora de embarque")) {
          setError("La hora de embarque debe ser ANTES de la hora de viaje");
        }
      } else {
        // Validar diferencia mínima de 1 hora
        const diferenciaHoras = calcularDiferenciaHoras(
          formData.horaEmbarque,
          formData.horaViaje
        );

        if (diferenciaHoras < 1) {
          setError(
            "La hora de embarque debe ser al menos 1 hora antes de la hora de viaje"
          );
        } else {
          // Solo limpiar error si era un error de horarios
          if (
            error &&
            (error.includes("Hora de embarque") ||
              error.includes("al menos 1 hora"))
          ) {
            setError("");
          }
        }
      }
    }
  }, [formData.horaViaje, formData.horaEmbarque, error]);

  // Agregar este useEffect para limpiar errores cuando se cambie la embarcación o ruta
  useEffect(() => {
    setErrorHorarios("");
  }, [formData.rutaId, formData.embarcacionId]);

  return (
    <div className="max-w-4xl mx-auto bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-600/50">
      {/* Header con steps */}
      <div className="p-6 border-b border-slate-600/50 sticky top-0 bg-slate-800/95 backdrop-blur-md rounded-t-2xl z-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-100">Nueva Venta</h2>
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-200 ${
                  s === step
                    ? "bg-blue-600 text-white shadow-lg"
                    : s < step
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-slate-600/50 text-slate-300"
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-sm text-slate-400">
          <span className={step === 1 ? "font-semibold text-blue-400" : ""}>
            1. Datos del Cliente
          </span>
          <span className={step === 2 ? "font-semibold text-blue-400" : ""}>
            2. Detalles del Viaje
          </span>
          <span className={step === 3 ? "font-semibold text-blue-400" : ""}>
            3. Confirmación
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: Datos del Cliente */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Doc. Identidad *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cliente.dni}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/\D/g, "");
                      const dniLimitado = soloNumeros.slice(0, 10);
                      setFormData((prev) => ({
                        ...prev,
                        cliente: { ...prev.cliente, dni: dniLimitado },
                      }));
                    }}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800 ${
                      formData.cliente.dni.length === 8
                        ? dniValido
                          ? "border-green-500/50"
                          : buscandoAutoCliente
                          ? "border-blue-500/50"
                          : "border-yellow-500/50"
                        : "border-slate-600/50"
                    }`}
                    placeholder="12345678"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />

                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {buscandoAutoCliente && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    )}
                    {!buscandoAutoCliente &&
                      formData.cliente.dni.length === 8 &&
                      dniValido && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    {!buscandoAutoCliente &&
                      formData.cliente.dni.length === 8 &&
                      !dniValido && (
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                      )}
                  </div>
                </div>

                <div className="mt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    {formData.cliente.dni.length}/10 caracteres
                  </span>

                  {buscandoAutoCliente && (
                    <span className="text-blue-400">Buscando...</span>
                  )}
                  {!buscandoAutoCliente &&
                    formData.cliente.dni.length === 8 &&
                    dniValido && (
                      <span className="text-green-400">Cliente encontrado</span>
                    )}
                  {!buscandoAutoCliente &&
                    formData.cliente.dni.length === 8 &&
                    !dniValido && (
                      <span className="text-yellow-400">Cliente nuevo</span>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                >
                  <option
                    value="Peruana"
                    className="bg-slate-800 text-slate-100"
                  >
                    Peruana
                  </option>
                  <option
                    value="Brasileña"
                    className="bg-slate-800 text-slate-100"
                  >
                    Brasileña
                  </option>
                  <option
                    value="Colombiana"
                    className="bg-slate-800 text-slate-100"
                  >
                    Colombiana
                  </option>
                  <option
                    value="Ecuatoriana"
                    className="bg-slate-800 text-slate-100"
                  >
                    Ecuatoriana
                  </option>
                  <option value="Otra" className="bg-slate-800 text-slate-100">
                    Otra
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                  placeholder="Juan Carlos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                  placeholder="Pérez García"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Teléfono
                </label>
                <div className="flex">
                  <select
                    value={codigoPais}
                    onChange={(e) => setCodigoPais(e.target.value)}
                    className="w-32 px-3 py-3 border border-slate-600/50 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 border-r-0 text-sm backdrop-blur-md transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                  >
                    {codigosPaises.map((item) => (
                      <option
                        key={item.codigo}
                        value={item.codigo}
                        className="bg-slate-800 text-slate-100"
                      >
                        {item.bandera} {item.codigo}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    value={formData.cliente.telefono}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        cliente: { ...prev.cliente, telefono: value },
                      }));
                    }}
                    className="flex-1 px-4 py-3 border border-slate-600/50 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-md transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                    placeholder="987654321"
                    maxLength={9}
                  />
                </div>
                {formData.cliente.telefono && (
                  <div className="mt-2 text-xs text-slate-400">
                    Teléfono completo:{" "}
                    <span className="text-slate-300">
                      {formatearTelefonoCompleto()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
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
                  !formData.cliente.apellido ||
                  buscandoAutoCliente
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Detalles del Viaje */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Detalles del Viaje
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reemplaza todo el bloque del select de Ruta por esto: */}
              {/* Sección de Ruta con Origen/Destino separados */}
              <div className="md:col-span-2 ruta-search-container">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ruta *
                </label>
                <div className="relative">
                  {/* Input de búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={busquedaRuta}
                      onChange={(e) => {
                        setBusquedaRuta(e.target.value);
                        setMostrarListaRutas(true);
                        if (!e.target.value) {
                          setFormData((prev) => ({
                            ...prev,
                            rutaId: "",
                            embarcacionId: "",
                            origenSeleccionado: "",
                            destinoSeleccionado: "",
                            precioFinal: 0,
                          }));
                        }
                      }}
                      onFocus={() => setMostrarListaRutas(true)}
                      placeholder="Buscar ruta por nombre..."
                      className="w-full pl-10 pr-10 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                    />

                    {/* Botón para limpiar/desplegar */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      {formData.rutaId && (
                        <button
                          type="button"
                          onClick={limpiarSeleccionRuta}
                          className="p-1 hover:bg-slate-600/50 rounded-lg transition-colors"
                        >
                          <X className="h-3 w-3 text-slate-400" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setMostrarListaRutas(!mostrarListaRutas)}
                        className="p-1 hover:bg-slate-600/50 rounded-lg transition-colors"
                      >
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            mostrarListaRutas ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Lista desplegable de rutas */}
                  {mostrarListaRutas && rutasFiltradas.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl backdrop-blur-md">
                      {rutasFiltradas.map((ruta) => (
                        <div
                          key={ruta.id}
                          onClick={() => {
                            seleccionarRuta(ruta);
                            actualizarDatosRuta(ruta, direccionViaje);
                          }}
                          className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b border-slate-700/50 last:border-b-0 ${
                            formData.rutaId === ruta.id
                              ? "bg-blue-600/20 text-blue-300"
                              : "hover:bg-slate-700/50 text-slate-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{ruta.nombre}</span>
                            <span className="text-sm bg-blue-600/30 text-blue-300 px-2 py-1 rounded-lg">
                              S/ {parseFloat(ruta.precio.toString()).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {ruta.puertoOrigen} ↔ {ruta.puertoDestino}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mensaje cuando no hay resultados */}
                  {mostrarListaRutas &&
                    busquedaRuta &&
                    rutasFiltradas.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 p-4 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl backdrop-blur-md">
                        <div className="text-center text-slate-400">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No se encontraron rutas con {busquedaRuta}</p>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Configuración de Origen/Destino y Precio cuando hay ruta seleccionada */}
              {formData.rutaId && rutaSeleccionada && (
                <div className="md:col-span-2 space-y-4">
                  {/* Selector de Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Dirección del viaje
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDireccionViaje("ORIGEN_DESTINO");
                          actualizarDatosRuta(
                            rutaSeleccionada,
                            "ORIGEN_DESTINO"
                          );
                        }}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          direccionViaje === "ORIGEN_DESTINO"
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-200"
                            : "bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium text-lg">
                            {limpiarNombrePuerto(rutaSeleccionada.puertoOrigen)}{" "}
                            →{" "}
                            {limpiarNombrePuerto(
                              rutaSeleccionada.puertoDestino
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDireccionViaje("DESTINO_ORIGEN");
                          actualizarDatosRuta(
                            rutaSeleccionada,
                            "DESTINO_ORIGEN"
                          );
                        }}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          direccionViaje === "DESTINO_ORIGEN"
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-200"
                            : "bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium text-lg">
                            {limpiarNombrePuerto(
                              rutaSeleccionada.puertoDestino
                            )}{" "}
                            →{" "}
                            {limpiarNombrePuerto(rutaSeleccionada.puertoOrigen)}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Configuración de Precio */}
                  <div className="bg-slate-700/20 border border-slate-600/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">
                        Precio del viaje
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">
                          Precio base:
                        </span>
                        <span className="text-sm font-semibold text-green-400">
                          S/{" "}
                          {parseFloat(
                            rutaSeleccionada.precio.toString()
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="precio-base"
                          name="precio"
                          checked={!usarPrecioPersonalizado}
                          onChange={() => {
                            setUsarPrecioPersonalizado(false);
                            setFormData((prev) => ({
                              ...prev,
                              precioFinal: parseFloat(
                                rutaSeleccionada.precio.toString()
                              ),
                            }));
                          }}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="precio-base"
                          className="text-sm text-slate-300"
                        >
                          Usar precio base (S/{" "}
                          {parseFloat(
                            rutaSeleccionada.precio.toString()
                          ).toFixed(2)}
                          )
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="precio-personalizado"
                          name="precio"
                          checked={usarPrecioPersonalizado}
                          onChange={() => setUsarPrecioPersonalizado(true)}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="precio-personalizado"
                          className="text-sm text-slate-300"
                        >
                          Precio personalizado
                        </label>
                        <input
                          type="number"
                          value={precioPersonalizado}
                          onChange={(e) => {
                            const nuevoPrecio = parseFloat(e.target.value) || 0;
                            setPrecioPersonalizado(nuevoPrecio);
                            if (usarPrecioPersonalizado) {
                              setFormData((prev) => ({
                                ...prev,
                                precioFinal: nuevoPrecio,
                              }));
                            }
                          }}
                          onFocus={() => setUsarPrecioPersonalizado(true)}
                          step="0.01"
                          min="0"
                          disabled={!usarPrecioPersonalizado}
                          className="w-24 px-3 py-1 text-sm border border-slate-600/50 rounded-lg bg-slate-700/50 text-slate-100 disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {usarPrecioPersonalizado && (
                      <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                        <p className="text-xs text-yellow-300">
                          💡 Este precio solo se aplicará a esta venta. El
                          precio base de la ruta no se modificará.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Resumen de la configuración actual */}
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-100">
                          {formData.origenSeleccionado} →{" "}
                          {formData.destinoSeleccionado}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {rutaSeleccionada.nombre}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-300">
                          S/ {formData.precioFinal.toFixed(2)}
                        </div>
                        {usarPrecioPersonalizado && (
                          <div className="text-xs text-yellow-400">
                            Precio personalizado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {rutaSeleccionada && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                    required
                  >
                    <option value="">Seleccionar embarcación...</option>
                    {rutaSeleccionada.embarcacionRutas.map((er) => (
                      <option
                        key={er.embarcacion.id}
                        value={er.embarcacion.id}
                        className="bg-slate-800 text-slate-100"
                      >
                        {er.embarcacion.nombre} (Capacidad:{" "}
                        {er.embarcacion.capacidad})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                  required
                >
                  <option value="">Seleccionar puerto de embarque...</option>
                  {puertosEmbarque.map((puerto) => (
                    <option
                      key={puerto.id}
                      value={puerto.id}
                      className="bg-slate-800 text-slate-100"
                    >
                      {puerto.nombre}
                      {puerto.direccion && ` - ${puerto.direccion}`}
                    </option>
                  ))}
                </select>
                {puertoSeleccionado?.descripcion && (
                  <p className="mt-1 text-sm text-slate-400">
                    {puertoSeleccionado.descripcion}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha de Viaje *
                </label>
                <input
                  type="date"
                  value={formData.fechaViaje}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  min={obtenerFechaMinima()}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 ${
                    error && error.includes("no opera")
                      ? "border-red-500/50"
                      : "border-slate-600/50"
                  }`}
                  required
                />

                {/* Mostrar información de días operativos */}
                {formData.embarcacionId && <DiasOperativosInfo />}

                {/* Mensaje de error específico para días no válidos */}
                {error && error.includes("no opera") && (
                  <div className="mt-2 p-3 bg-red-900/30 border border-red-600/50 rounded-xl">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}
              </div>

              {embarcacionSeleccionada && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hora de Viaje *
                  </label>
                  <select
                    value={formData.horaViaje}
                    onChange={(e) => {
                      const nuevaHoraViaje = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        horaViaje: nuevaHoraViaje,
                      }));

                      // Validar contra la hora de embarque existente
                      if (formData.horaEmbarque && nuevaHoraViaje) {
                        if (formData.horaEmbarque >= nuevaHoraViaje) {
                          setErrorHorarios(
                            "La hora de embarque debe ser ANTES de la hora de viaje"
                          );
                        } else {
                          // Validar diferencia mínima de 1 hora
                          const diferenciaHoras = calcularDiferenciaHoras(
                            formData.horaEmbarque,
                            nuevaHoraViaje
                          );

                          if (diferenciaHoras < 1) {
                            setErrorHorarios(
                              "La hora de embarque debe ser al menos 1 hora antes de la hora de viaje"
                            );
                          } else {
                            setErrorHorarios(""); // Limpiar error si es válido
                          }
                        }
                      } else {
                        setErrorHorarios(""); // Limpiar error si falta algún campo
                      }
                    }}
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                    required
                  >
                    <option value="">Seleccionar hora...</option>
                    {embarcacionSeleccionada.horasSalida.map((hora) => (
                      <option
                        key={hora}
                        value={hora}
                        className="bg-slate-800 text-slate-100"
                      >
                        {hora}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hora de Embarque *
                </label>
                <input
                  type="time"
                  value={formData.horaEmbarque}
                  onChange={(e) => {
                    const nuevaHoraEmbarque = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      horaEmbarque: nuevaHoraEmbarque,
                    }));

                    // Validar que la hora de embarque no sea después ni igual a la hora de viaje
                    if (formData.horaViaje && nuevaHoraEmbarque) {
                      if (nuevaHoraEmbarque >= formData.horaViaje) {
                        setErrorHorarios(
                          "La hora de embarque debe ser ANTES de la hora de viaje"
                        );
                      } else {
                        // Validar diferencia mínima de 1 hora
                        const diferenciaHoras = calcularDiferenciaHoras(
                          nuevaHoraEmbarque,
                          formData.horaViaje
                        );

                        if (diferenciaHoras < 1) {
                          setErrorHorarios(
                            "La hora de embarque debe ser al menos 1 hora antes de la hora de viaje"
                          );
                        } else {
                          setErrorHorarios(""); // Limpiar error si es válido
                        }
                      }
                    } else {
                      setErrorHorarios(""); // Limpiar error si falta algún campo
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 ${
                    errorHorarios ? "border-red-500/50" : "border-slate-600/50"
                  }`}
                  required
                />
                {/* Mensaje de ayuda - Solo mostrar si hay hora de viaje y NO hay error */}
                {formData.horaViaje && !errorHorarios && (
                  <div className="mt-1 text-xs text-slate-400">
                    La hora de embarque debe ser al menos 1 hora antes de:{" "}
                    {formData.horaViaje}
                  </div>
                )}
                {/* Mensaje de error específico para horarios */}
                {errorHorarios && (
                  <div className="mt-1 text-xs text-red-400">
                    {errorHorarios}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    setDisponibilidad(null);
                  }}
                  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                  >
                    <option
                      value="UNICO"
                      className="bg-slate-800 text-slate-100"
                    >
                      Pago Único
                    </option>
                    <option
                      value="HIBRIDO"
                      className="bg-slate-800 text-slate-100"
                    >
                      Pago Híbrido
                    </option>
                  </select>
                </div>

                {formData.tipoPago === "UNICO" ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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
                      className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                    >
                      <option
                        value="EFECTIVO"
                        className="bg-slate-800 text-slate-100"
                      >
                        Efectivo
                      </option>
                      <option
                        value="TARJETA"
                        className="bg-slate-800 text-slate-100"
                      >
                        Tarjeta
                      </option>
                      <option
                        value="TRANSFERENCIA"
                        className="bg-slate-800 text-slate-100"
                      >
                        Transferencia
                      </option>
                      <option
                        value="YAPE"
                        className="bg-slate-800 text-slate-100"
                      >
                        Yape
                      </option>
                      <option
                        value="PLIN"
                        className="bg-slate-800 text-slate-100"
                      >
                        Plin
                      </option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-300">
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
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                      >
                        + Agregar método
                      </button>
                    </div>

                    {formData.metodosPago.map((metodo, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        {/* SELECT para el tipo de método */}
                        <div className="flex-1">
                          <select
                            value={metodo.tipo}
                            onChange={(e) => {
                              const newMetodosPago = [...formData.metodosPago];
                              newMetodosPago[index].tipo = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                metodosPago: newMetodosPago,
                              }));
                            }}
                            className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                          >
                            <option
                              value="EFECTIVO"
                              className="bg-slate-800 text-slate-100"
                            >
                              Efectivo
                            </option>
                            <option
                              value="TARJETA"
                              className="bg-slate-800 text-slate-100"
                            >
                              Tarjeta
                            </option>
                            <option
                              value="TRANSFERENCIA"
                              className="bg-slate-800 text-slate-100"
                            >
                              Transferencia
                            </option>
                            <option
                              value="YAPE"
                              className="bg-slate-800 text-slate-100"
                            >
                              Yape
                            </option>
                            <option
                              value="PLIN"
                              className="bg-slate-800 text-slate-100"
                            >
                              Plin
                            </option>
                          </select>
                        </div>

                        {/* INPUT para el monto */}
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
                            placeholder="Monto (S/)"
                            className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                          />
                        </div>

                        {/* Botón eliminar */}
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
                          className="px-2 py-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                          title="Eliminar método"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-red-400">
                            <span className="text-lg font-medium leading-none relative -top-0.5">
                              -
                            </span>
                          </span>
                        </button>
                      </div>
                    ))}

                    {/* Resumen de pago híbrido */}
                    {formData.metodosPago.length > 0 && (
                      <div className="mt-4 p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Total de la venta:
                            </span>
                            <span className="font-medium text-slate-200">
                              S/ {calcularTotales().totalVenta.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Total pagado:
                            </span>
                            <span className="font-medium text-slate-200">
                              S/ {calcularTotales().totalPagado.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t border-slate-600/50 pt-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                {calcularTotales().faltaPagar > 0
                                  ? "Falta pagar:"
                                  : "Diferencia:"}
                              </span>
                              <span
                                className={`font-bold ${
                                  Math.abs(calcularTotales().faltaPagar) < 0.01
                                    ? "text-green-400"
                                    : calcularTotales().faltaPagar > 0
                                    ? "text-red-400"
                                    : "text-yellow-400"
                                }`}
                              >
                                S/{" "}
                                {Math.abs(calcularTotales().faltaPagar).toFixed(
                                  2
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mensaje de validación */}
                        {Math.abs(calcularTotales().faltaPagar) < 0.01 ? (
                          <div className="mt-3 flex items-center text-green-400 text-sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            El pago está completo
                          </div>
                        ) : calcularTotales().faltaPagar > 0 ? (
                          <div className="mt-3 flex items-center text-red-400 text-sm">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Falta completar el pago
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center text-yellow-400 text-sm">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            El total pagado excede el monto de la venta
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 resize-none backdrop-blur-sm transition-all duration-200"
                  rows={3}
                  placeholder="Notas adicionales sobre el viaje..."
                />
              </div>
            </div>

            {/* Información de disponibilidad */}
            {disponibilidad && (
              <div
                className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-200 ${
                  disponibilidad.puedeVender
                    ? "bg-green-900/30 border-green-600/50"
                    : "bg-red-900/30 border-red-600/50"
                }`}
              >
                <div className="flex items-start">
                  {disponibilidad.puedeVender ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4
                      className={`font-semibold text-lg mb-2 ${
                        disponibilidad.puedeVender
                          ? "text-green-200"
                          : "text-red-200"
                      }`}
                    >
                      {disponibilidad.puedeVender
                        ? "¡Asientos Disponibles!"
                        : "Capacidad Insuficiente"}
                    </h4>

                    {/* Información de la embarcación */}
                    <div className="mb-3 p-3 bg-slate-800/30 rounded-lg border border-slate-600/20">
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-slate-200">
                          🚢 {embarcacionSeleccionada?.embarcacion.nombre}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Capacidad:</span>
                          <div className="font-bold text-slate-200">
                            {disponibilidad.capacidadTotal}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Vendidos:</span>
                          <div
                            className={`font-bold ${
                              disponibilidad.vendidos > 0
                                ? "text-orange-400"
                                : "text-slate-500"
                            }`}
                          >
                            {disponibilidad.vendidos}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Disponibles:</span>
                          <div
                            className={`font-bold text-lg ${
                              disponibilidad.disponibles > 0
                                ? "text-green-400"
                                : "text-red-400"
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
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        📅{" "}
                        <strong>
                          {formatearFechaDesdeInput(formData.fechaViaje)}
                        </strong>{" "}
                        a las <strong>{formData.horaViaje}</strong>
                      </p>
                      <p
                        className={`font-medium ${
                          disponibilidad.puedeVender
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {disponibilidad.puedeVender
                          ? `✅ Puedes vender ${formData.cantidadPasajes} pasaje(s)`
                          : `❌ Solo ${disponibilidad.disponibles} asientos libres, necesitas ${formData.cantidadPasajes}`}
                      </p>
                    </div>

                    {/* Barra visual de ocupación */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
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
                      <div className="w-full bg-slate-600/50 rounded-full h-2">
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
            {/* {error && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 backdrop-blur-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                  <span className="text-sm text-red-200">{error}</span>
                </div>
              </div>
            )} */}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700/50 backdrop-blur-sm transition-all duration-200"
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
                  !formData.horaEmbarque ||
                  !!errorHorarios || // Usar el nuevo estado de error
                  !!(error && error.includes("no opera"))
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmación */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirmar Venta
            </h3>

            {/* Resumen de la venta */}
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6 shadow-lg backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-100 mb-3">
                    Información del Cliente
                  </h4>
                  <div className="space-y-2 text-sm text-slate-200">
                    <p>
                      <span className="text-slate-400">Doc. Identidad:</span>{" "}
                      {formData.cliente.dni}
                    </p>
                    <p>
                      <span className="text-slate-400">Nombre:</span>{" "}
                      {formData.cliente.nombre} {formData.cliente.apellido}
                    </p>
                    <p>
                      <span className="text-slate-400">Teléfono:</span>{" "}
                      {formData.cliente.telefono || "No proporcionado"}
                    </p>
                    <p>
                      <span className="text-slate-400">Email:</span>{" "}
                      {formData.cliente.email || "No proporcionado"}
                    </p>
                    <p>
                      <span className="text-slate-400">Nacionalidad:</span>{" "}
                      {formData.cliente.nacionalidad}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-100 mb-3">
                    Detalles del Viaje
                  </h4>
                  <div className="space-y-2 text-sm text-slate-200">
                    <p>
                      <span className="text-slate-400">Ruta:</span>{" "}
                      {rutaSeleccionada?.nombre}
                    </p>
                    <p>
                      <span className="text-slate-400">Embarcación:</span>{" "}
                      {embarcacionSeleccionada?.embarcacion.nombre}
                    </p>
                    <p className="flex items-center">
                      <span className="text-slate-400">
                        Puerto de embarque:{" "}
                      </span>
                      {puertoSeleccionado?.nombre}
                    </p>
                    <p>
                      <span className="text-slate-400">Fecha:</span>{" "}
                      {formatearFechaDesdeInput(formData.fechaViaje)}
                    </p>
                    <p>
                      <span className="text-slate-400">Hora de viaje:</span>{" "}
                      {formData.horaViaje}
                    </p>
                    <p>
                      <span className="text-slate-400">Hora de embarque:</span>{" "}
                      {formData.horaEmbarque}
                    </p>
                    <p>
                      <span className="text-slate-400">Cantidad:</span>{" "}
                      {formData.cantidadPasajes} pasaje(s)
                    </p>
                    <p>
                      <span className="text-slate-400">Tipo de pago:</span>{" "}
                      {formData.tipoPago === "UNICO"
                        ? "Pago Único"
                        : "Pago Híbrido"}
                    </p>
                    {formData.tipoPago === "UNICO" ? (
                      <p>
                        <span className="text-slate-400">Método de pago:</span>{" "}
                        {formData.metodoPago}
                      </p>
                    ) : (
                      <div className="mt-2">
                        <span className="text-slate-400">Métodos de pago:</span>
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
                <div className="mt-4 pt-4 border-t border-slate-600/50">
                  <h4 className="font-semibold text-slate-100 mb-2">
                    Observaciones
                  </h4>
                  <p className="text-sm text-slate-200">
                    {formData.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* Resumen financiero */}
            <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-600/50 backdrop-blur-md">
              <h4 className="font-semibold text-blue-200 mb-3">
                Resumen de Pago
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Precio unitario:</span>
                  <span className="text-blue-100">
                    S/ {formData.precioFinal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Cantidad:</span>
                  <span className="text-blue-100">
                    {formData.cantidadPasajes}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Subtotal:</span>
                  <span className="text-blue-100">
                    S/{" "}
                    {(formData.precioFinal * formData.cantidadPasajes).toFixed(
                      2
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Impuestos:</span>
                  <span className="text-blue-100">S/ 0.00</span>
                </div>
                <div className="border-t border-blue-500/50 pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-blue-100">Total:</span>
                    <span className="text-blue-100">
                      S/{" "}
                      {(
                        formData.precioFinal * formData.cantidadPasajes
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700/50 backdrop-blur-sm transition-all duration-200"
              >
                Anterior
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
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
