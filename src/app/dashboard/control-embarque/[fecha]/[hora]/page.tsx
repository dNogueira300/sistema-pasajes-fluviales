"use client";

import { use, useState, useCallback, useMemo } from "react";
import { ArrowLeft, Ship, MapPin, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  useListaPasajeros,
  useEstadisticas,
  useActualizarEstadoEmbarque,
} from "@/hooks/use-control-embarque";
import type { PasajeroEmbarque } from "@/hooks/use-control-embarque";
import EstadisticasPanel from "@/components/control-embarque/EstadisticasPanel";
import BuscadorPasajero from "@/components/control-embarque/BuscadorPasajero";
import PasajeroCard from "@/components/control-embarque/PasajeroCard";
import ModalCambiarEstado from "@/components/control-embarque/ModalCambiarEstado";
import GenerarReportePDF from "@/components/control-embarque/GenerarReportePDF";

interface PageProps {
  params: Promise<{ fecha: string; hora: string }>;
}

export default function ListaPasajerosPage({ params }: PageProps) {
  const { fecha, hora: horaEncoded } = use(params);
  const hora = decodeURIComponent(horaEncoded);

  const { pasajeros, isLoading, mutate: mutatePasajeros } = useListaPasajeros(fecha, hora);
  const { estadisticas, mutate: mutateEstadisticas } = useEstadisticas(fecha, hora);
  const { actualizar } = useActualizarEstadoEmbarque();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPasajero, setSelectedPasajero] = useState<PasajeroEmbarque | null>(null);

  // Filter pasajeros by search
  const filteredPasajeros = useMemo(() => {
    if (!searchQuery) return pasajeros;
    const q = searchQuery.toLowerCase();
    return pasajeros.filter(
      (p) =>
        p.cliente.nombre.toLowerCase().includes(q) ||
        p.cliente.apellido.toLowerCase().includes(q) ||
        p.cliente.dni.includes(q) ||
        p.numeroVenta.toLowerCase().includes(q)
    );
  }, [pasajeros, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePasajeroClick = useCallback((pasajero: PasajeroEmbarque) => {
    setSelectedPasajero(pasajero);
  }, []);

  const handleConfirmEstado = useCallback(
    async (estado: "EMBARCADO" | "NO_EMBARCADO", observaciones?: string) => {
      if (!selectedPasajero?.controlEmbarque) return;

      try {
        await actualizar(selectedPasajero.controlEmbarque.id, estado, observaciones);
        toast.success(
          estado === "EMBARCADO" ? "Pasajero marcado como embarcado" : "Pasajero marcado como no embarcado"
        );
        setSelectedPasajero(null);
        mutatePasajeros();
        mutateEstadisticas();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al actualizar estado");
      }
    },
    [selectedPasajero, actualizar, mutatePasajeros, mutateEstadisticas]
  );

  // Get first pasajero data for header info
  const firstPasajero = pasajeros[0];
  const fechaFormatted = format(new Date(fecha + "T12:00:00"), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {/* Back link */}
      <Link
        href="/dashboard/control-embarque"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a viajes
      </Link>

      {/* Header with trip info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
          {firstPasajero && (
            <>
              <div className="flex items-center gap-1.5">
                <Ship className="h-4 w-4 text-blue-400" />
                <span className="font-medium">{firstPasajero.embarcacion.nombre}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>{firstPasajero.ruta.puertoOrigen} → {firstPasajero.ruta.puertoDestino}</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span>{fechaFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="font-medium">{hora}</span>
          </div>
        </div>
      </div>

      {/* Statistics panel */}
      {estadisticas && (
        <div className="mb-4 sticky top-0 z-20 bg-slate-900 pb-2 pt-1">
          <EstadisticasPanel estadisticas={estadisticas} />
        </div>
      )}

      {/* Search bar + PDF button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <BuscadorPasajero onSearch={handleSearch} />
        </div>
        <GenerarReportePDF fecha={fecha} hora={hora} />
      </div>

      {/* Pasajeros list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPasajeros.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-slate-400">
            {searchQuery ? "No se encontraron pasajeros con esa búsqueda" : "No hay pasajeros para este viaje"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPasajeros.map((p) => (
            <PasajeroCard key={p.id} pasajero={p} onClick={handlePasajeroClick} />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedPasajero && (
        <ModalCambiarEstado
          isOpen={!!selectedPasajero}
          pasajero={selectedPasajero}
          onClose={() => setSelectedPasajero(null)}
          onConfirm={handleConfirmEstado}
        />
      )}
    </div>
  );
}
