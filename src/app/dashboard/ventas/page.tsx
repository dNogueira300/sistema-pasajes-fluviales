//src\app\dashboard\ventas\page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import NuevaVentaForm from "@/components/ventas/nueva-venta-form";
import { formatearFechaViaje } from "@/lib/utils/fecha-utils";
import ModalAnularVenta from "@/components/anulaciones/modal-anular-venta";
import { generarComprobanteImagen } from "@/lib/utils/canvas-image-generator";
import { Venta, AnulacionResponse } from "@/types";
import {
  Plus,
  Search,
  Filter,
  Download,
  X,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Clock,
  MoreVertical,
  Trash2,
  Printer,
  Ship,
  ChevronDown,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
} from "lucide-react";

interface Filtros {
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  busqueda: string;
}

interface EstadisticasVentas {
  totalVentas: number;
  ventasHoy: number;
  ventasConfirmadas: number;
  ventasAnuladas: number;
  totalRecaudado: number;
  ventasReembolsadas: number;
}

export default function VentasPage() {
  useRequireAuth();
  const [showNuevaVenta, setShowNuevaVenta] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [ventaAAnular, setVentaAAnular] = useState<Venta | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasVentas | null>(
    null
  );

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [filtros, setFiltros] = useState<Filtros>({
    fechaInicio: "",
    fechaFin: "",
    estado: "",
    busqueda: "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  // Función para cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const response = await fetch("/api/ventas/estadisticas");
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, []);

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "10",
        ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio }),
        ...(filtros.fechaFin && { fechaFin: filtros.fechaFin }),
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.busqueda && { busqueda: filtros.busqueda }),
      });

      const response = await fetch(`/api/ventas?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVentas(data.ventas);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          total: data.total,
        });
      }
    } catch (error) {
      console.error("Error cargando ventas:", error);
    } finally {
      setLoading(false);
    }
  }, [filtros, pagination.currentPage]);

  // Effect para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    // Solo agregar el listener si el dropdown está abierto
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup del event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // También cerrar el dropdown cuando se cierre el modal
  useEffect(() => {
    if (!showDetalles) {
      setShowDropdown(false);
    }
  }, [showDetalles]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Efecto para cerrar los menús cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const moreMenus = document.querySelectorAll(".more-menu");

      // Cerrar menús de opciones
      moreMenus.forEach((menu) => {
        if (
          !menu.contains(event.target as Node) &&
          !menu.previousElementSibling?.contains(event.target as Node)
        ) {
          menu.classList.add("hidden");
        }
      });
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleFiltroChange = (key: keyof Filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: "",
      fechaFin: "",
      estado: "",
      busqueda: "",
    });
  };

  // Función para imprimir ticket
  const imprimirTicket = async (ventaId: string) => {
    // Mostrar notificación de carga
    const notificacionCarga = mostrarNotificacion(
      "descargando",
      "Preparando ticket...",
      "Por favor espera"
    );

    try {
      const response = await fetch(`/api/ventas/${ventaId}/ticket`);
      if (response.ok) {
        const html = await response.text();

        const printWindow = window.open("", "_blank");

        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();

          printWindow.onload = () => {
            // Remover notificación de carga
            removerNotificacion(notificacionCarga);

            printWindow.focus();
            printWindow.print();

            // Cerrar muy rápido después de mostrar el diálogo
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
            }, 800); // 800ms es suficiente para que aparezca el diálogo
          };
        } else {
          // Si no se pudo abrir la ventana
          removerNotificacion(notificacionCarga);
          mostrarNotificacion(
            "error",
            "No se pudo abrir la ventana de impresión",
            "Verifica que los pop-ups no estén bloqueados"
          );
        }
      } else {
        removerNotificacion(notificacionCarga);
        mostrarNotificacion(
          "error",
          "Error al generar el ticket",
          "Por favor, intenta nuevamente"
        );
      }
    } catch (error) {
      console.error("Error imprimiendo ticket:", error);
      removerNotificacion(notificacionCarga);
      mostrarNotificacion(
        "error",
        "Error de conexión",
        "No se pudo generar el ticket"
      );
    }
  };

  // Función para imprimir comprobante A4
  const imprimirComprobanteA4 = async (ventaId: string) => {
    // Mostrar notificación de carga
    const notificacionCarga = mostrarNotificacion(
      "descargando",
      "Preparando comprobante A4...",
      "Por favor espera"
    );

    try {
      const response = await fetch(`/api/ventas/${ventaId}/comprobante`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Abrir el PDF en una nueva ventana
        const printWindow = window.open(url, "_blank");

        if (printWindow) {
          // Esperar a que se cargue el PDF y mostrar el diálogo de impresión
          printWindow.onload = () => {
            // Remover notificación de carga
            removerNotificacion(notificacionCarga);
            printWindow.print();
          };

          // Cerrar la ventana y limpiar recursos cuando se cierre
          printWindow.onafterprint = () => {
            printWindow.close();
            URL.revokeObjectURL(url);
          };
        } else {
          // Si no se pudo abrir la ventana
          removerNotificacion(notificacionCarga);
          mostrarNotificacion(
            "error",
            "No se pudo abrir la ventana de impresión",
            "Verifica que los pop-ups no estén bloqueados"
          );
        }
      } else {
        removerNotificacion(notificacionCarga);
        mostrarNotificacion(
          "error",
          "Error al generar comprobante A4",
          "Por favor, intenta nuevamente"
        );
      }
    } catch (error) {
      console.error("Error imprimiendo comprobante A4:", error);
      removerNotificacion(notificacionCarga);
      mostrarNotificacion(
        "error",
        "Error de conexión",
        "No se pudo generar el comprobante A4"
      );
    }
  };

  // Función para descargar comprobante A4 como PDF
  const descargarComprobanteA4 = async (venta: Venta) => {
    const nombreCliente = `${venta.cliente.nombre} ${venta.cliente.apellido}`;
    const nombreArchivo = `${nombreCliente} - ${venta.numeroVenta}.pdf`;

    // Mostrar notificación de descarga
    const notificacionDescarga = mostrarNotificacion(
      "descargando",
      "Preparando descarga...",
      `Comprobante PDF: ${venta.numeroVenta}`
    );

    try {
      const response = await fetch(`/api/ventas/${venta.id}/comprobante`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Crear enlace de descarga
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();

        // Limpiar
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Remover notificación de descarga y mostrar éxito
        removerNotificacion(notificacionDescarga);
        mostrarNotificacion(
          "exito",
          "PDF descargado correctamente",
          nombreArchivo
        );
      } else {
        removerNotificacion(notificacionDescarga);
        mostrarNotificacion(
          "error",
          "Error al generar PDF",
          "Por favor, intenta nuevamente"
        );
      }
    } catch (error) {
      console.error("Error descargando comprobante A4:", error);
      removerNotificacion(notificacionDescarga);
      mostrarNotificacion(
        "error",
        "Error de conexión",
        "No se pudo descargar el PDF"
      );
    }
  };

  // Función para descargar comprobante como imagen PNG
  const descargarComprobanteImagen = async (venta: Venta) => {
    const nombreCliente = `${venta.cliente.nombre} ${venta.cliente.apellido}`;
    const nombreArchivo = `${nombreCliente} - ${venta.numeroVenta}.png`;

    // Mostrar notificación de descarga
    const notificacionDescarga = mostrarNotificacion(
      "descargando",
      "Generando imagen...",
      `Comprobante PNG: ${venta.numeroVenta}`
    );

    try {
      // ✅ Generar imagen directamente usando Canvas (INSTANTÁNEO)
      console.time("Image Generation");
      const blob = await generarComprobanteImagen(venta);
      console.timeEnd("Image Generation");

      const url = URL.createObjectURL(blob);

      // Crear enlace de descarga
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();

      // Limpiar
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Remover notificación de descarga y mostrar éxito
      removerNotificacion(notificacionDescarga);
      mostrarNotificacion(
        "exito",
        "Imagen descargada correctamente",
        nombreArchivo
      );
    } catch (error) {
      console.error("Error generando imagen del comprobante:", error);
      removerNotificacion(notificacionDescarga);
      mostrarNotificacion(
        "error",
        "Error al generar imagen",
        "Por favor, intenta nuevamente"
      );
    }
  };

  // Función para abrir modal de anulación
  const handleAnularVenta = (venta: Venta) => {
    setVentaAAnular(venta);
    setShowAnularModal(true);
    // Cerrar otros menús
    document.querySelectorAll(".more-menu").forEach((menu) => {
      menu.classList.add("hidden");
    });
  };

  // Función para manejar el éxito de la anulación
  const handleAnulacionSuccess = (resultado: AnulacionResponse) => {
    // Actualizar la venta en la lista
    setVentas((prev) =>
      prev.map((venta) =>
        venta.id === resultado.ventaActualizada.id
          ? ({
              ...venta,
              estado: resultado.ventaActualizada.estado,
              anulacion: resultado.anulacion, // Esto ahora es compatible
            } as Venta)
          : venta
      )
    );

    // Mostrar notificación de éxito
    mostrarNotificacion(
      "exito",
      "Venta anulada exitosamente",
      resultado.mensaje
    );

    // Cerrar modales
    setShowAnularModal(false);
    setVentaAAnular(null);

    // Recargar estadísticas
    cargarEstadisticas();
  };

  // Función helper para mostrar notificaciones
  const mostrarNotificacion = (
    tipo: "descargando" | "exito" | "error",
    mensaje: string,
    detalle?: string
  ) => {
    const notification = document.createElement("div");

    const colores = {
      descargando: "bg-blue-900/90 border-blue-700 text-blue-100",
      exito: "bg-green-900/90 border-green-700 text-green-100",
      error: "bg-red-900/90 border-red-700 text-red-100",
    };

    const iconos = {
      descargando: `<svg class="h-5 w-5 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
    </svg>`,
      exito: `<svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>`,
      error: `<svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`,
    };

    notification.className = `fixed top-4 right-4 ${colores[tipo]} px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 z-50 transition-all duration-300 backdrop-blur-sm border`;
    notification.innerHTML = `
    ${iconos[tipo]}
    <div>
      <p class="font-medium">${mensaje}</p>
      ${detalle ? `<p class="text-sm opacity-90">${detalle}</p>` : ""}
    </div>
  `;

    document.body.appendChild(notification);

    // Auto-remover después de un tiempo (excepto para "descargando")
    if (tipo !== "descargando") {
      setTimeout(() => {
        notification.classList.add("opacity-0", "transition-opacity");
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }

    return notification;
  };

  // Función para remover notificación específica
  const removerNotificacion = (notification: HTMLElement) => {
    if (document.body.contains(notification)) {
      notification.classList.add("opacity-0", "transition-opacity");
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "CONFIRMADA":
        return "bg-green-900/40 text-green-300 border-green-700/50";
      case "ANULADA":
        return "bg-red-900/40 text-red-300 border-red-700/50";
      case "REEMBOLSADA":
        return "bg-yellow-900/40 text-yellow-300 border-yellow-700/50";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600/50";
    }
  };

  // Función helper para truncar texto con tooltip
  const TruncatedText = ({
    text,
    maxLength = 20,
    className = "",
  }: {
    text: string;
    maxLength?: number;
    className?: string;
  }) => {
    if (text.length <= maxLength) {
      return <span className={className}>{text}</span>;
    }

    return (
      <span className={`cursor-help ${className}`} title={text}>
        {text.substring(0, maxLength)}...
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">
            Gestión de Ventas
          </h1>
          <p className="text-slate-300 mt-1">
            Administra las ventas de pasajes fluviales
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <button
            onClick={() => setShowNuevaVenta(true)}
            className="group bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-6 py-3 rounded-xl flex items-center justify-center space-x-3 font-medium shadow-lg hover:shadow-2xl transition-all duration-200 ease-out border-2 border-blue-600 hover:border-blue-700 w-full lg:w-auto touch-manipulation hover:-translate-y-1 active:translate-y-0 active:shadow-lg hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 hover:ring-offset-slate-800"
          >
            <div className="bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700 p-1.5 rounded-lg transition-colors duration-200">
              <Plus className="h-4 w-4" />
            </div>
            <span className="whitespace-nowrap">Nueva Venta</span>
            <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>

      {/* Botón flotante de Nueva Venta con efecto de borde animado */}
      <button
        onClick={() => setShowNuevaVenta(true)}
        className="fab-button group fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 ease-out z-50 hover:scale-110 active:scale-95"
        title="Nueva Venta"
      >
        <div className="fab-spinner"></div>
        <Plus className="h-6 w-6 relative z-10" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl border border-slate-600">
          Nueva Venta
        </span>
      </button>

      <style jsx>{`
        .fab-button {
          position: relative;
          overflow: visible;
        }

        .fab-spinner {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 270deg,
            #60a5fa 270deg,
            #3b82f6 360deg
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .fab-button:hover .fab-spinner {
          opacity: 1;
          animation: spin-border 1.5s linear infinite;
        }

        @keyframes spin-border {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Estadísticas con tema oscuro y glassmorphism */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
          {/* Total Ventas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Total Ventas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalVentas}
                </p>
              </div>
            </div>
          </div>

          {/* Ventas Hoy */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Ventas Hoy
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.ventasHoy}
                </p>
              </div>
            </div>
          </div>

          {/* Ventas Confirmadas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-emerald-600 p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Confirmadas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.ventasConfirmadas}
                </p>
              </div>
            </div>
          </div>

          {/* Ventas Anuladas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-red-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-red-600 p-3 rounded-xl shadow-lg">
                <X className="h-6 w-6 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Anuladas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.ventasAnuladas}
                </p>
              </div>
            </div>
          </div>

          {/* Total Recaudado - Solo Confirmadas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-yellow-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent"></div>
            <div className="relative flex items-center">
              <div className="bg-yellow-600 p-3 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Recaudado
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  S/ {estadisticas.totalRecaudado?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-yellow-400">Solo confirmadas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros integrados con la tabla */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50">
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-4 flex-1">
              {/* Campo de búsqueda - se adapta en móvil */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300 z-10" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, Doc. Identidad o número de venta..."
                    value={filtros.busqueda}
                    onChange={(e) =>
                      handleFiltroChange("busqueda", e.target.value)
                    }
                    className="w-full sm:w-80 pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Botón de filtros - se adapta en móvil */}
              <div className="w-full sm:w-auto">
                <button
                  onClick={() => setShowFiltros(!showFiltros)}
                  className="w-full sm:w-auto flex items-center justify-center px-4 py-3 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200 whitespace-nowrap"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                  <ChevronDown
                    className={`h-4 w-4 ml-2 transform transition-transform ${
                      showFiltros ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {showFiltros && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) =>
                      handleFiltroChange("fechaInicio", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) =>
                      handleFiltroChange("fechaFin", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={filtros.estado}
                    onChange={(e) =>
                      handleFiltroChange("estado", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                  >
                    <option value="">Todos los estados</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="ANULADA">Anulada</option>
                    <option value="REEMBOLSADA">Reembolsada</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full px-6 py-3 bg-slate-600/50 text-slate-200 rounded-xl hover:bg-slate-500/50 transition-all duration-200 backdrop-blur-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información de resultados */}
        <div className="px-6 py-4 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                Ventas ({pagination.total})
              </h3>
              {(filtros.fechaInicio || filtros.fechaFin) && (
                <p className="text-sm text-slate-400 mt-1">
                  {filtros.fechaInicio && filtros.fechaFin
                    ? `Del ${filtros.fechaInicio} al ${filtros.fechaFin}`
                    : filtros.fechaInicio
                    ? `Desde ${filtros.fechaInicio}`
                    : `Hasta ${filtros.fechaFin}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de ventas */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-300">Cargando ventas...</span>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                No se encontraron ventas
              </h3>
              <p className="text-slate-400">
                Las ventas aparecerán aquí una vez que las registres.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[120px]">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[160px]">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[180px]">
                    Ruta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[180px]">
                    Puerto Embarque
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider  min-w-[120px]">
                    Fecha Viaje
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[80px]">
                    Pasajes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[100px]">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[100px]">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider min-w-[120px]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-600">
                {ventas.map((venta) => (
                  <tr
                    key={venta.id}
                    onClick={() => {
                      setSelectedVenta(venta);
                      setShowDetalles(true);
                    }}
                    className="hover:bg-slate-700/30 transition-colors align-top cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">
                        {venta.numeroVenta}
                      </div>
                      <div className="text-sm text-slate-400">
                        Venta:{" "}
                        {new Date(venta.fechaVenta).toLocaleDateString(
                          "es-PE",
                          {
                            timeZone: "America/Lima",
                          }
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">
                        <TruncatedText
                          text={`${venta.cliente.nombre} ${venta.cliente.apellido}`}
                          maxLength={25}
                        />
                      </div>
                      <div className="text-sm text-slate-400">
                        Doc. Identidad: {venta.cliente.dni}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">
                        <TruncatedText
                          text={`${venta.puertoOrigen} - ${venta.puertoDestino}`}
                          maxLength={22}
                        />
                      </div>
                      <div className="text-sm text-slate-400 flex items-center">
                        <Ship className="h-4 w-4 mr-1 flex-shrink-0" />
                        <TruncatedText
                          text={venta.embarcacion.nombre}
                          maxLength={20}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start space-x-1">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-100">
                            <TruncatedText
                              text={venta.puertoEmbarque.nombre}
                              maxLength={20}
                              className="block"
                            />
                          </div>
                          {venta.puertoEmbarque.direccion && (
                            <div className="text-xs text-slate-400 mt-1">
                              <TruncatedText
                                text={venta.puertoEmbarque.direccion}
                                maxLength={18}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-slate-200">
                        <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {formatearFechaViaje(venta.fechaViaje)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-slate-200">
                        <User className="h-4 w-4 mr-1" />
                        {venta.cantidadPasajes}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">
                        S/ {venta.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-400">
                        {venta.tipoPago === "HIBRIDO" && venta.metodosPago ? (
                          <div className="space-y-0.5">
                            {venta.metodosPago.map((metodo, idx) => (
                              <div key={idx}>
                                {metodo.tipo}: S/ {metodo.monto.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <TruncatedText text={venta.metodoPago} maxLength={12} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium whitespace-nowrap border ${getEstadoColor(
                          venta.estado
                        )}`}
                      >
                        {venta.estado}
                      </span>
                    </td>
                    {/* Columna de acciones actualizada */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        {/* Menú unificado de acciones (3 puntos) */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const button = e.currentTarget;
                              const target =
                                button.nextElementSibling as HTMLElement | null;
                              if (target) {
                                const isHidden =
                                  target.classList.contains("hidden");

                                // Cerrar otros menús abiertos
                                document
                                  .querySelectorAll(".more-menu")
                                  .forEach((menu) => {
                                    menu.classList.add("hidden");
                                  });

                                // Mostrar/ocultar con posicionamiento CSS absoluto relativo al padre
                                if (isHidden) {
                                  target.classList.remove("hidden");
                                }
                              }
                            }}
                            className="p-2 text-slate-400 hover:bg-slate-700/50 rounded-xl transition-colors"
                            title="Opciones"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {/* Menú desplegable unificado */}
                          <div
                            className="more-menu hidden absolute right-0 mt-2 bg-slate-800/95 border border-slate-600/50 rounded-xl shadow-xl py-1 z-50 w-56 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Sección: Imprimir comprobante */}
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-700/50">
                              Imprimir comprobante
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                imprimirComprobanteA4(venta.id);
                                document
                                  .querySelectorAll(".more-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                            >
                              <Printer className="h-5 w-5 mr-2 text-emerald-400" />
                              A4
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                imprimirTicket(venta.id);
                                document
                                  .querySelectorAll(".more-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                            >
                              <Printer className="h-5 w-5 mr-2 text-emerald-400" />
                              Ticket
                            </button>

                            {/* Separador */}
                            <div className="border-t border-slate-600/50 my-1"></div>

                            {/* Sección: Descargar comprobante */}
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-700/50">
                              Descargar comprobante
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                descargarComprobanteA4(venta);
                                document
                                  .querySelectorAll(".more-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                            >
                              <Download className="h-5 w-5 mr-2 text-blue-400" />
                              PDF
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                descargarComprobanteImagen(venta);
                                document
                                  .querySelectorAll(".more-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                            >
                              <Download className="h-5 w-5 mr-2 text-green-400" />
                              Imagen
                            </button>

                            {/* Separador */}
                            {venta.estado === "CONFIRMADA" && (
                              <>
                                <div className="border-t border-slate-600/50 my-1"></div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnularVenta(venta);
                                  }}
                                  className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-red-900/30 flex items-center transition-colors"
                                >
                                  <Trash2 className="h-5 w-5 mr-2" />
                                  Anular
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-5 border-t border-slate-600/50 flex items-center justify-between">
            <div className="text-sm text-slate-300">
              Mostrando página {pagination.currentPage} de{" "}
              {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage - 1,
                  }))
                }
                disabled={pagination.currentPage <= 1}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-slate-300 flex items-center">
                {pagination.currentPage} de {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Venta */}
      {showNuevaVenta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl drop-shadow-2xl border border-slate-600/50 flex flex-col">
            {" "}
            {/* Cambios aquí: overflow-hidden y flex flex-col */}
            {/* Header sticky */}
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50 sticky top-0 bg-slate-800/95 backdrop-blur-md z-10">
              {" "}
              {/* Agregar z-10 */}
              <h2 className="text-xl font-semibold text-slate-100">
                Nueva Venta - Alto Impacto Travel
              </h2>
              <button
                onClick={() => setShowNuevaVenta(false)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto">
              {" "}
              {/* Este div hace scroll */}
              <div className="p-6">
                <NuevaVentaForm
                  onSuccess={() => {
                    setShowNuevaVenta(false);
                    cargarVentas();
                    cargarEstadisticas();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles de Venta */}
      {showDetalles && selectedVenta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl drop-shadow-2xl border border-slate-600/50 flex flex-col">
            {/* Header fijo */}
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-slate-800/95 backdrop-blur-md rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-semibold text-slate-100">
                Detalles de Venta - {selectedVenta.numeroVenta}
              </h2>
              <button
                onClick={() => setShowDetalles(false)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Información del cliente */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Cliente
                  </h3>
                  <div className="bg-slate-700/50 rounded-xl p-4 space-y-3 backdrop-blur-sm border border-slate-600/50">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Nombre:</span>
                      <span className="font-medium text-slate-100 text-right">
                        {selectedVenta.cliente.nombre}{" "}
                        {selectedVenta.cliente.apellido}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Doc. Identidad:</span>
                      <span className="font-medium text-slate-100">
                        {selectedVenta.cliente.dni}
                      </span>
                    </div>
                    {selectedVenta.cliente.telefono && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Teléfono:</span>
                        <span className="font-medium text-slate-100">
                          {selectedVenta.cliente.telefono}
                        </span>
                      </div>
                    )}
                    {selectedVenta.cliente.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Email:</span>
                        <span className="font-medium text-slate-100">
                          {selectedVenta.cliente.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del viaje */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Viaje
                  </h3>
                  <div className="bg-slate-700/50 rounded-xl p-4 space-y-3 backdrop-blur-sm border border-slate-600/50">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Ruta:</span>
                      <span className="font-medium text-slate-100 text-right max-w-[60%] break-words">
                        {selectedVenta.puertoOrigen} - {selectedVenta.puertoDestino}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Embarcación:</span>
                      <span className="font-medium text-slate-100 text-right max-w-[60%] break-words">
                        {selectedVenta.embarcacion.nombre}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-300">
                        Puerto de Embarque:
                      </span>
                      <span className="font-medium text-slate-100 text-right max-w-[60%] break-words">
                        {selectedVenta.puertoEmbarque.nombre}
                      </span>
                    </div>
                    {selectedVenta.puertoEmbarque.direccion && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Dirección del Puerto:
                        </span>
                        <span className="font-medium text-slate-100 text-right max-w-[60%] break-words">
                          {selectedVenta.puertoEmbarque.direccion}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-300">Fecha de viaje:</span>
                      <span className="font-medium text-slate-100">
                        {formatearFechaViaje(selectedVenta.fechaViaje)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">
                        Cantidad de pasajes:
                      </span>
                      <span className="font-medium text-slate-100">
                        {selectedVenta.cantidadPasajes}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de pago */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pago
                  </h3>
                  <div className="bg-slate-700/50 rounded-xl p-4 space-y-3 backdrop-blur-sm border border-slate-600/50">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Método de pago:</span>
                      <div className="text-right">
                        {selectedVenta.tipoPago === "HIBRIDO" && selectedVenta.metodosPago ? (
                          <div className="space-y-1">
                            {selectedVenta.metodosPago.map((metodo, idx) => (
                              <div key={idx} className="font-medium text-slate-100">
                                {metodo.tipo}: S/ {metodo.monto.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="font-medium text-slate-100">
                            {selectedVenta.metodoPago}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total:</span>
                      <span className="font-bold text-xl text-slate-100">
                        S/ {selectedVenta.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Estado:</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium border ${getEstadoColor(
                          selectedVenta.estado
                        )}`}
                      >
                        {selectedVenta.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Información Adicional
                  </h3>
                  <div className="bg-slate-700/50 rounded-xl p-4 space-y-3 backdrop-blur-sm border border-slate-600/50">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Fecha de venta:</span>
                      <span className="font-medium text-slate-100">
                        {new Date(selectedVenta.fechaVenta).toLocaleString(
                          "es-PE"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Vendedor:</span>
                      <span className="font-medium text-slate-100 text-right max-w-[60%] break-words">
                        {selectedVenta.vendedor.nombre}{" "}
                        {selectedVenta.vendedor.apellido}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Espaciado adicional para evitar que el contenido se oculte detrás del footer */}
                <div className="h-6"></div>
              </div>
            </div>

            {/* Footer fijo */}
            <div className="flex justify-end space-x-4 p-6 border-t border-slate-600/50 bg-slate-800/95 backdrop-blur-md flex-shrink-0 rounded-b-2xl">
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <Printer className="h-4 w-4" />
                  <span>Opciones</span>
                </button>

                {/* Menú desplegable de opciones completo */}
                {showDropdown && (
                  <div className="absolute right-0 bottom-full mb-2 bg-slate-800/95 border border-slate-600/50 rounded-xl shadow-xl overflow-hidden z-50 w-48 backdrop-blur-sm">
                    {/* Opciones de impresión */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-700/50">
                      Imprimir
                    </div>
                    <button
                      onClick={() => {
                        imprimirTicket(selectedVenta.id);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Ticket 80mm
                    </button>
                    <button
                      onClick={() => {
                        imprimirComprobanteA4(selectedVenta.id);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Comprobante A4
                    </button>

                    {/* Separador */}
                    <div className="border-t border-slate-600/50"></div>

                    {/* Opciones de descarga */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-700/50">
                      Descargar
                    </div>
                    <button
                      onClick={() => {
                        descargarComprobanteA4(selectedVenta);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2 text-blue-400" />
                      Descargar PDF
                    </button>
                    <button
                      onClick={() => {
                        descargarComprobanteImagen(selectedVenta);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700/50 flex items-center transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2 text-green-400" />
                      Descargar Imagen
                    </button>
                  </div>
                )}
              </div>

              {selectedVenta.estado === "CONFIRMADA" && (
                <button
                  onClick={() => {
                    // Cerrar el modal de detalles primero
                    setShowDetalles(false);
                    // Abrir el modal de anulación
                    handleAnularVenta(selectedVenta);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Anular</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Anular Venta */}
      {showAnularModal && ventaAAnular && (
        <ModalAnularVenta
          isOpen={showAnularModal}
          onClose={() => {
            setShowAnularModal(false);
            setVentaAAnular(null);
          }}
          venta={ventaAAnular}
          onSuccess={handleAnulacionSuccess}
        />
      )}
    </div>
  );
}
