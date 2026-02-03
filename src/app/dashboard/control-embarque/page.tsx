"use client";

import { useRouter } from "next/navigation";
import { ClipboardCheck, Ship, Calendar } from "lucide-react";
import { useViajesOperador } from "@/hooks/use-control-embarque";
import ViajeCard from "@/components/control-embarque/ViajeCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";

export default function ControlEmbarquePage() {
  const router = useRouter();
  const { viajes, isLoading, error } = useViajesOperador();

  // Agrupar viajes por fecha
  const viajesAgrupados = useMemo(() => {
    const grupos = new Map<string, typeof viajes>();
    for (const viaje of viajes) {
      const existing = grupos.get(viaje.fechaViaje) || [];
      existing.push(viaje);
      grupos.set(viaje.fechaViaje, existing);
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [viajes]);

  const handleViajeClick = (fechaViaje: string, horaViaje: string) => {
    router.push(`/dashboard/control-embarque/${fechaViaje}/${encodeURIComponent(horaViaje)}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <ClipboardCheck className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-lg font-medium">Error al cargar viajes</p>
          <p className="text-slate-500 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <ClipboardCheck className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Control de Embarque</h1>
            <p className="text-sm text-slate-400">Selecciona un viaje para gestionar el embarque</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : viajesAgrupados.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Ship className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay viajes programados</p>
          <p className="text-slate-500 text-sm mt-1">Los viajes aparecerán aquí cuando haya ventas confirmadas</p>
        </div>
      ) : (
        <div className="space-y-8">
          {viajesAgrupados.map(([fecha, viajesFecha]) => (
            <div key={fecha}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-200">
                  {format(new Date(fecha + "T12:00:00"), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </h2>
              </div>

              {/* Viajes grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {viajesFecha.map((viaje) => (
                  <ViajeCard
                    key={`${viaje.fechaViaje}-${viaje.horaViaje}`}
                    viaje={viaje}
                    onClick={() => handleViajeClick(viaje.fechaViaje, viaje.horaViaje)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
