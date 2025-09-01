"use client";

import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import NuevaVentaForm from "@/components/ventas/nueva-venta-form";
import { formatearFechaViaje } from "@/lib/utils/fecha-utils";
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
} from "lucide-react";

interface Venta {
  id: string;
  numeroVenta: string;
  fechaVenta: string;
  fechaViaje: string;
  cliente: {
    nombre: string;
    apellido: string;
    dni: string;
  };
  ruta: {
    nombre: string;
    puertoOrigen: string;
    puertoDestino: string;
  };
  embarcacion: {
    nombre: string;
  };
  cantidadPasajes: number;
  total: number;
  estado: "CONFIRMADA" | "ANULADA" | "REEMBOLSADA";
  metodoPago: string;
  vendedor: {
    nombre: string;
    apellido: string;
  };
}

interface Filtros {
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  busqueda: string;
}

export default function VentasPage() {
  useRequireAuth(); // Solo llamamos al hook sin desestructurar
  const [showNuevaVenta, setShowNuevaVenta] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showDetalles, setShowDetalles] = useState(false);

  const [filtros, setFiltros] = useState<Filtros>({
    fechaInicio: "", // Sin filtro inicial - mostrar todas las ventas
    fechaFin: "", // Sin filtro inicial - mostrar todas las ventas
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

  // Cargar ventas al montar el componente
  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const handleFiltroChange = (key: keyof Filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: "", // Sin filtros de fecha
      fechaFin: "",
      estado: "",
      busqueda: "",
    });
  };

  const exportarVentas = async () => {
    try {
      const params = new URLSearchParams({
        export: "true",
        ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio }),
        ...(filtros.fechaFin && { fechaFin: filtros.fechaFin }),
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.busqueda && { busqueda: filtros.busqueda }),
      });

      const response = await fetch(`/api/ventas/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ventas_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exportando ventas:", error);
    }
  };

  const imprimirTicket = async (ventaId: string) => {
    try {
      const response = await fetch(`/api/ventas/${ventaId}/ticket`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error imprimiendo ticket:", error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por cliente, DNI o número de venta..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white shadow-sm"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportarVentas}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
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
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Ruta
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Fecha Viaje
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Pasajes
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {venta.numeroVenta}
                    </div>
                    <div className="text-sm text-gray-500">
                      Venta:{" "}
                      {new Date(venta.fechaVenta).toLocaleDateString("es-PE", {
                        timeZone: "America/Lima",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {venta.cliente.nombre} {venta.cliente.apellido}
                    </div>
                    <div className="text-sm text-gray-500">
                      DNI: {venta.cliente.dni}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {venta.ruta.nombre}
                    </div>
                    <div className="text-sm text-gray-500">
                      {venta.embarcacion.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatearFechaViaje(venta.fechaViaje)}
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
                      {venta.metodoPago}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(
                        venta.estado
                      )}`}
                    >
                      {venta.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedVenta(venta);
                          setShowDetalles(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => imprimirTicket(venta.id)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Imprimir ticket"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

      {/* Modal Detalles de Venta */}
      {showDetalles && selectedVenta && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-xl border border-gray-200">
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
                    <span className="font-medium text-gray-900">
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
                </div>
              </div>

              {/* Información del viaje */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Viaje
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Ruta:</span>
                    <span className="font-medium text-gray-900">
                      {selectedVenta.ruta.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Embarcación:</span>
                    <span className="font-medium text-gray-900">
                      {selectedVenta.embarcacion.nombre}
                    </span>
                  </div>
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
                    <span className="font-medium text-gray-900">
                      {selectedVenta.vendedor.nombre}{" "}
                      {selectedVenta.vendedor.apellido}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => imprimirTicket(selectedVenta.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir Ticket</span>
                </button>
                {selectedVenta.estado === "CONFIRMADA" && (
                  <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <Trash2 className="h-4 w-4" />
                    <span>Anular</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
