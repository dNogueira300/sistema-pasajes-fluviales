"use client";

import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import NuevaVentaForm from "@/components/ventas/nueva-venta-form";
import { formatearFechaViaje } from "@/lib/utils/fecha-utils";
import ModalAnularVenta from "@/components/anulaciones/modal-anular-venta";
import { Venta, AnulacionResponse } from "@/types";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
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
} from "lucide-react";

interface Filtros {
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  busqueda: string;
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

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  // Efecto para cerrar los menús de impresión cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const printMenus = document.querySelectorAll(".print-menu");
      const moreMenus = document.querySelectorAll(".more-menu");

      // Cerrar menús de impresión
      printMenus.forEach((menu) => {
        if (
          !menu.contains(event.target as Node) &&
          !menu.previousElementSibling?.contains(event.target as Node)
        ) {
          menu.classList.add("hidden");
        }
      });

      // Cerrar menús de más opciones
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
            printWindow.focus();
            printWindow.print();

            // Cerrar muy rápido después de mostrar el diálogo
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
            }, 800); // 800ms es suficiente para que aparezca el diálogo
          };
        }
      }
    } catch (error) {
      console.error("Error imprimiendo ticket:", error);
    }
  };

  // Función para imprimir comprobante A4
  const imprimirComprobanteA4 = async (ventaId: string) => {
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
            printWindow.print();
          };

          // Cerrar la ventana y limpiar recursos cuando se cierre
          printWindow.onafterprint = () => {
            printWindow.close();
            URL.revokeObjectURL(url);
          };
        }
      } else {
        console.error("Error al generar comprobante A4");
      }
    } catch (error) {
      console.error("Error imprimiendo comprobante A4:", error);
    }
  };

  // Función para descargar comprobante A4 como PDF
  // Función actualizada para descargar PDF
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

  // Función actualizada para descargar imagen
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
      const response = await fetch(
        `/api/ventas/${venta.id}/comprobante-imagen`
      );
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
          "Imagen descargada correctamente",
          nombreArchivo
        );
      } else {
        removerNotificacion(notificacionDescarga);
        mostrarNotificacion(
          "error",
          "Error al generar imagen",
          "Por favor, intenta nuevamente"
        );
      }
    } catch (error) {
      console.error("Error descargando imagen del comprobante:", error);
      removerNotificacion(notificacionDescarga);
      mostrarNotificacion(
        "error",
        "Error de conexión",
        "No se pudo descargar la imagen"
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
  };

  // Función helper para mostrar notificaciones
  const mostrarNotificacion = (
    tipo: "descargando" | "exito" | "error",
    mensaje: string,
    detalle?: string
  ) => {
    const notification = document.createElement("div");

    const colores = {
      descargando: "bg-blue-50 border-blue-200 text-blue-800",
      exito: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
    };

    const iconos = {
      descargando: `<svg class="h-5 w-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
    </svg>`,
      exito: `<svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>`,
      error: `<svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`,
    };

    notification.className = `fixed top-4 right-4 ${colores[tipo]} px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 transition-all duration-300`;
    notification.innerHTML = `
    ${iconos[tipo]}
    <div>
      <p class="font-medium">${mensaje}</p>
      ${detalle ? `<p class="text-sm">${detalle}</p>` : ""}
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
        return "bg-green-100 text-green-800";
      case "ANULADA":
        return "bg-red-100 text-red-800";
      case "REEMBOLSADA":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Ventas
          </h1>
          <p className="text-gray-600">
            Administra las ventas de pasajes fluviales
          </p>
        </div>

        <button
          onClick={() => setShowNuevaVenta(true)}
          className="group bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-3 font-medium shadow-md hover:shadow-xl transition-all duration-200 ease-out border-2 border-blue-600 hover:border-blue-700 w-full sm:w-auto justify-center sm:justify-start touch-manipulation hover:-translate-y-1 active:translate-y-0 active:shadow-md"
        >
          <div className="bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700 p-1.5 rounded-md transition-colors duration-200">
            <Plus className="h-4 w-4" />
          </div>
          <span>Nueva Venta</span>
          <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80 lg:w-96">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por cliente, DNI o número de venta"
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white shadow-sm w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFiltros && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) =>
                    handleFiltroChange("fechaInicio", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) =>
                    handleFiltroChange("fechaFin", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange("estado", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de ventas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ventas ({pagination.total})
              </h3>
              {(filtros.fechaInicio || filtros.fechaFin) && (
                <p className="text-sm text-gray-500 mt-1">
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

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando ventas...</span>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                No se encontraron ventas con los filtros aplicados
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[120px]">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[160px]">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[180px]">
                    Ruta
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[180px]">
                    Puerto Embarque
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider  min-w-[120px]">
                    Fecha Viaje
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[80px]">
                    Pasajes
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider min-w-[120px]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {venta.numeroVenta}
                      </div>
                      <div className="text-sm text-gray-500">
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
                      <div className="font-medium text-gray-900">
                        <TruncatedText
                          text={`${venta.cliente.nombre} ${venta.cliente.apellido}`}
                          maxLength={25}
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        DNI: {venta.cliente.dni}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        <TruncatedText
                          text={venta.ruta.nombre}
                          maxLength={22}
                        />
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
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
                          <div className="font-medium text-gray-900">
                            <TruncatedText
                              text={venta.puertoEmbarque.nombre}
                              maxLength={20}
                              className="block"
                            />
                          </div>
                          {venta.puertoEmbarque.direccion && (
                            <div className="text-xs text-gray-500 mt-1">
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
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {formatearFechaViaje(venta.fechaViaje)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="h-4 w-4 mr-1" />
                        {venta.cantidadPasajes}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        S/ {venta.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <TruncatedText text={venta.metodoPago} maxLength={12} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getEstadoColor(
                          venta.estado
                        )}`}
                      >
                        {venta.estado}
                      </span>
                    </td>
                    {/* Columna de acciones actualizada en la tabla */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => {
                            setSelectedVenta(venta);
                            setShowDetalles(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const target = e.currentTarget.nextElementSibling;
                              if (target) {
                                target.classList.toggle("hidden");
                              }
                              // Cerrar otros menús abiertos
                              document
                                .querySelectorAll(".print-menu")
                                .forEach((menu) => {
                                  if (menu !== target) {
                                    menu.classList.add("hidden");
                                  }
                                });
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Opciones de impresión"
                          >
                            <Printer className="h-5 w-5" />
                          </button>

                          {/* Menú desplegable de impresión */}
                          <div className="print-menu hidden absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-44">
                            <button
                              onClick={() => {
                                imprimirTicket(venta.id);
                                document
                                  .querySelectorAll(".print-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Printer className="h-5 w-5 mr-2 text-emerald-600" />
                              Ticket 80mm
                            </button>
                            <button
                              onClick={() => {
                                imprimirComprobanteA4(venta.id);
                                document
                                  .querySelectorAll(".print-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Printer className="h-5 w-5 mr-2 text-emerald-600" />
                              Comprobante A4
                            </button>
                          </div>
                        </div>

                        {/* NUEVO: Menú de más opciones (3 puntos) */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const target = e.currentTarget.nextElementSibling;
                              if (target) {
                                target.classList.toggle("hidden");
                              }
                              // Cerrar otros menús abiertos
                              document
                                .querySelectorAll(".more-menu")
                                .forEach((menu) => {
                                  if (menu !== target) {
                                    menu.classList.add("hidden");
                                  }
                                });
                            }}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Más opciones"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {/* Menú desplegable de más opciones */}
                          <div className="more-menu hidden absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-48">
                            <button
                              onClick={() => {
                                descargarComprobanteA4(venta);
                                document
                                  .querySelectorAll(".more-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Download className="h-5 w-5 mr-2 text-blue-600" />
                              Descargar PDF
                            </button>
                            <button
                              onClick={() => {
                                descargarComprobanteImagen(venta);
                                document
                                  .querySelectorAll(".more-menu")
                                  .forEach((menu) =>
                                    menu.classList.add("hidden")
                                  );
                              }}
                              className="w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Download className="h-5 w-5 mr-2 text-green-600" />
                              Descargar Imagen
                            </button>

                            {/* Separador */}
                            <div className="border-t border-gray-200 my-1"></div>

                            {venta.estado === "CONFIRMADA" && (
                              <button
                                // Reemplazar el onClick del botón Anular Venta:
                                onClick={() => handleAnularVenta(venta)}
                                className="w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Anular Venta
                              </button>
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

          {ventas.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                No se encontraron ventas con los filtros aplicados
              </div>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando página {pagination.currentPage} de{" "}
              {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage - 1,
                  }))
                }
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
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
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Venta */}
      {showNuevaVenta && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                Nueva Venta
              </h2>
              <button
                onClick={() => setShowNuevaVenta(false)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <NuevaVentaForm
                onSuccess={() => {
                  setShowNuevaVenta(false);
                  cargarVentas();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles de Venta MEJORADO */}
      {showDetalles && selectedVenta && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Detalles de Venta - {selectedVenta.numeroVenta}
              </h2>
              <button
                onClick={() => setShowDetalles(false)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
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
                      {selectedVenta.cliente.nombre}{" "}
                      {selectedVenta.cliente.apellido}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">DNI:</span>
                    <span className="font-medium text-gray-900">
                      {selectedVenta.cliente.dni}
                    </span>
                  </div>
                  {selectedVenta.cliente.telefono && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Teléfono:</span>
                      <span className="font-medium text-gray-900">
                        {selectedVenta.cliente.telefono}
                      </span>
                    </div>
                  )}
                  {selectedVenta.cliente.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Email:</span>
                      <span className="font-medium text-gray-900">
                        {selectedVenta.cliente.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del viaje */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Viaje
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Ruta:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
                      {selectedVenta.ruta.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Embarcación:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
                      {selectedVenta.embarcacion.nombre}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-700">Puerto de Embarque:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
                      {selectedVenta.puertoEmbarque.nombre}
                    </span>
                  </div>
                  {selectedVenta.puertoEmbarque.direccion && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        Dirección del Puerto:
                      </span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
                        {selectedVenta.puertoEmbarque.direccion}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-700">Fecha de viaje:</span>
                    <span className="font-medium text-gray-900">
                      {formatearFechaViaje(selectedVenta.fechaViaje)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cantidad de pasajes:</span>
                    <span className="font-medium text-gray-900">
                      {selectedVenta.cantidadPasajes}
                    </span>
                  </div>
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
                    <span className="text-gray-700">Método de pago:</span>
                    <span className="font-medium text-gray-900">
                      {selectedVenta.metodoPago}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total:</span>
                    <span className="font-bold text-lg text-gray-900">
                      S/ {selectedVenta.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Estado:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Información Adicional
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Fecha de venta:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedVenta.fechaVenta).toLocaleString(
                        "es-PE"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Vendedor:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
                      {selectedVenta.vendedor.nombre}{" "}
                      {selectedVenta.vendedor.apellido}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => {
                      const dropdownMenu =
                        document.getElementById("print-dropdown");
                      if (dropdownMenu) {
                        dropdownMenu.classList.toggle("hidden");
                      }
                    }}
                  >
                    <Printer className="h-4 w-4" />
                    <span>Opciones</span>
                  </button>

                  {/* Menú desplegable de opciones completo */}
                  <div
                    id="print-dropdown"
                    className="absolute right-0 mt-2 hidden bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 w-48"
                  >
                    {/* Opciones de impresión */}
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Imprimir
                    </div>
                    <button
                      onClick={() => {
                        imprimirTicket(selectedVenta.id);
                        document
                          .getElementById("print-dropdown")
                          ?.classList.add("hidden");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Ticket 80mm
                    </button>
                    <button
                      onClick={() => {
                        imprimirComprobanteA4(selectedVenta.id);
                        document
                          .getElementById("print-dropdown")
                          ?.classList.add("hidden");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Comprobante A4
                    </button>

                    {/* Separador */}
                    <div className="border-t border-gray-200"></div>

                    {/* Opciones de descarga */}
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Descargar
                    </div>
                    <button
                      onClick={() => {
                        descargarComprobanteA4(selectedVenta);
                        document
                          .getElementById("print-dropdown")
                          ?.classList.add("hidden");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2 text-blue-600" />
                      Descargar PDF
                    </button>
                    <button
                      onClick={() => {
                        descargarComprobanteImagen(selectedVenta);
                        document
                          .getElementById("print-dropdown")
                          ?.classList.add("hidden");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2 text-green-600" />
                      Descargar Imagen
                    </button>
                  </div>
                </div>

                {selectedVenta.estado === "CONFIRMADA" && (
                  <button
                    onClick={() => {
                      // Cerrar el modal de detalles primero
                      setShowDetalles(false);
                      // Abrir el modal de anulación
                      handleAnularVenta(selectedVenta);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Anular</span>
                  </button>
                )}
              </div>
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
