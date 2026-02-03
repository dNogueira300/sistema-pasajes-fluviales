"use client";

import { useState, useCallback } from "react";
import {
  Anchor,
  Plus,
  Pencil,
  Eye,
  Ship,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import {
  useOperadores,
  useCambiarEstadoOperador,
  useCrearOperador,
  useActualizarOperador,
  useAsignarEmbarcacion,
} from "@/hooks/use-operadores";
import type { Operador } from "@/hooks/use-operadores";
import OperadorFilters from "@/components/operadores/OperadorFilters";
import OperadorForm from "@/components/operadores/OperadorForm";
import OperadorDetailModal from "@/components/operadores/OperadorDetailModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

// Función para mostrar notificaciones con tema oscuro (igual que en otros módulos)
const mostrarNotificacion = (tipo: "success" | "error", texto: string) => {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 ${
    tipo === "success"
      ? "bg-green-900/90 border border-green-700 text-green-100"
      : "bg-red-900/90 border border-red-700 text-red-100"
  } px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 z-50 backdrop-blur-sm`;

  notification.innerHTML = `
    <svg class="h-5 w-5 ${
      tipo === "success" ? "text-green-400" : "text-red-400"
    }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      ${
        tipo === "success"
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
      }
    </svg>
    <div>
      <p class="font-medium">${texto}</p>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("opacity-0", "transition-opacity");
    setTimeout(() => notification.remove(), 300);
  }, 5000);
};

export default function OperadoresPage() {
  const [filters, setFilters] = useState<{
    estado?: string;
    embarcacionId?: string;
    search?: string;
  }>({});
  const [page, setPage] = useState(1);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editOperador, setEditOperador] = useState<Operador | null>(null);
  const [detailOperador, setDetailOperador] = useState<Operador | null>(null);

  // Confirm modal state para cambio de estado
  const [showEstadoConfirm, setShowEstadoConfirm] = useState(false);
  const [operadorToToggle, setOperadorToToggle] = useState<Operador | null>(null);

  const { operadores, metadata, isLoading, mutate } = useOperadores({
    ...filters,
    page,
    limit: 10,
  });

  const { cambiarEstado, isLoading: isChangingState } = useCambiarEstadoOperador();
  const { crear, isLoading: isCreating } = useCrearOperador();
  const { actualizar, isLoading: isUpdating } = useActualizarOperador();
  const { asignar, isLoading: isAssigning } = useAsignarEmbarcacion();

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  // Mostrar modal de confirmación para cambio de estado
  const handleToggleEstadoClick = (operador: Operador) => {
    setOperadorToToggle(operador);
    setShowEstadoConfirm(true);
  };

  // Confirmar cambio de estado
  const handleConfirmToggleEstado = async () => {
    if (!operadorToToggle) return;

    const nuevoEstado = operadorToToggle.estadoOperador === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    try {
      await cambiarEstado(operadorToToggle.id, nuevoEstado);
      mostrarNotificacion("success", `Operador ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"} correctamente`);
      mutate();
      setShowEstadoConfirm(false);
      setOperadorToToggle(null);
    } catch (err) {
      mostrarNotificacion("error", err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  const handleCreate = () => {
    setEditOperador(null);
    setShowFormModal(true);
  };

  const handleEdit = (op: Operador) => {
    setEditOperador(op);
    setShowFormModal(true);
  };

  const handleView = (op: Operador) => {
    setDetailOperador(op);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditOperador(null);
  };

  const handleFormSubmit = async (data: {
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    password?: string;
    confirmPassword?: string;
    embarcacionAsignadaId?: string;
    estadoOperador: string;
  }) => {
    try {
      if (editOperador) {
        await actualizar(editOperador.id, {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
        });
        if (data.embarcacionAsignadaId && data.embarcacionAsignadaId !== (editOperador.embarcacionAsignada?.id ?? "")) {
          await asignar(editOperador.id, data.embarcacionAsignadaId);
        }
        if (data.estadoOperador !== editOperador.estadoOperador) {
          await cambiarEstado(editOperador.id, data.estadoOperador as "ACTIVO" | "INACTIVO");
        }
        mostrarNotificacion("success", "Operador actualizado correctamente");
      } else {
        await crear({
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          username: data.username,
          password: data.password!,
          embarcacionAsignadaId: data.embarcacionAsignadaId || undefined,
          estadoOperador: data.estadoOperador,
        });
        mostrarNotificacion("success", "Operador creado correctamente");
      }
      handleFormClose();
      mutate();
    } catch (err) {
      mostrarNotificacion("error", err instanceof Error ? err.message : "Error al guardar operador");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Anchor className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Operadores de Embarcación</h1>
            <p className="text-sm text-slate-400">Gestión de operadores y asignaciones</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="group bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-6 py-3 rounded-xl flex items-center justify-center space-x-3 font-medium shadow-lg hover:shadow-2xl transition-all duration-200 ease-out border-2 border-blue-600 hover:border-blue-700 w-full lg:w-auto touch-manipulation hover:-translate-y-1 active:translate-y-0 active:shadow-lg hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 hover:ring-offset-slate-800"
        >
          <div className="bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700 p-1.5 rounded-lg transition-colors duration-200">
            <Plus className="h-4 w-4" />
          </div>
          <span className="whitespace-nowrap">Nuevo Operador</span>
          <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <OperadorFilters onFilterChange={handleFilterChange} />
      </div>

      {/* Stats bar */}
      {metadata && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <Users className="h-4 w-4" />
          <span>{metadata.total} operador{metadata.total !== 1 ? "es" : ""} encontrado{metadata.total !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : operadores.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Anchor className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No se encontraron operadores</p>
          <p className="text-slate-500 text-sm mt-1">Crea un nuevo operador para comenzar</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Operador</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Embarcación</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha Asignación</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {operadores.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-600/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-400">
                            {op.nombre[0]}{op.apellido[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{op.nombre} {op.apellido}</p>
                          <p className="text-xs text-slate-500">@{op.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{op.email}</td>
                    <td className="px-4 py-3">
                      {op.embarcacionAsignada ? (
                        <div className="flex items-center gap-1.5">
                          <Ship className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-slate-300">{op.embarcacionAsignada.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleEstadoClick(op)}
                        disabled={isChangingState}
                        className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {op.estadoOperador === "ACTIVO" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-900/40 text-green-400 border border-green-700/50">
                            <CheckCircle className="h-3 w-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-900/40 text-red-400 border border-red-700/50">
                            <XCircle className="h-3 w-3" /> Inactivo
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {op.fechaAsignacion
                        ? new Date(op.fechaAsignacion).toLocaleDateString("es-PE")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(op)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleView(op)}
                          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {operadores.map((op) => (
              <div
                key={op.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-400">
                        {op.nombre[0]}{op.apellido[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{op.nombre} {op.apellido}</p>
                      <p className="text-xs text-slate-500">{op.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleEstadoClick(op)} disabled={isChangingState}>
                    {op.estadoOperador === "ACTIVO" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-900/40 text-green-400 border border-green-700/50">
                        <CheckCircle className="h-3 w-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-900/40 text-red-400 border border-red-700/50">
                        <XCircle className="h-3 w-3" /> Inactivo
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Ship className="h-4 w-4 text-blue-400" />
                  {op.embarcacionAsignada ? op.embarcacionAsignada.nombre : "Sin embarcación"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(op)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-400 bg-blue-600/10 border border-blue-700/30 rounded-lg hover:bg-blue-600/20 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleView(op)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-400 bg-slate-700/30 border border-slate-600/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {metadata && metadata.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 text-sm text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-700/50 transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-400">
                Página {metadata.page} de {metadata.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(metadata.totalPages, p + 1))}
                disabled={page >= metadata.totalPages}
                className="px-3 py-2 text-sm text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-700/50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <OperadorForm
        isOpen={showFormModal}
        onClose={handleFormClose}
        mode={editOperador ? "edit" : "create"}
        defaultValues={
          editOperador
            ? {
                id: editOperador.id,
                nombre: editOperador.nombre,
                apellido: editOperador.apellido,
                email: editOperador.email,
                username: editOperador.username,
                embarcacionAsignadaId: editOperador.embarcacionAsignada?.id ?? "",
                estadoOperador: editOperador.estadoOperador ?? "ACTIVO",
              }
            : undefined
        }
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating || isAssigning}
      />

      <OperadorDetailModal
        isOpen={!!detailOperador}
        onClose={() => setDetailOperador(null)}
        operador={detailOperador}
      />

      {/* Modal de confirmación para cambio de estado */}
      <ConfirmModal
        isOpen={showEstadoConfirm}
        onClose={() => {
          setShowEstadoConfirm(false);
          setOperadorToToggle(null);
        }}
        onConfirm={handleConfirmToggleEstado}
        title={
          operadorToToggle?.estadoOperador === "ACTIVO"
            ? "Desactivar Operador"
            : "Activar Operador"
        }
        message={
          operadorToToggle?.estadoOperador === "ACTIVO"
            ? `¿Estás seguro de desactivar al operador "${operadorToToggle?.nombre} ${operadorToToggle?.apellido}"? No podrá acceder al sistema mientras esté inactivo.`
            : `¿Estás seguro de activar al operador "${operadorToToggle?.nombre} ${operadorToToggle?.apellido}"? Podrá acceder nuevamente al sistema.`
        }
        confirmText={
          operadorToToggle?.estadoOperador === "ACTIVO" ? "Desactivar" : "Activar"
        }
        cancelText="Cancelar"
        variant={operadorToToggle?.estadoOperador === "ACTIVO" ? "danger" : "success"}
        isLoading={isChangingState}
      />
    </div>
  );
}
