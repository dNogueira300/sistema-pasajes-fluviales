"use client";

import { Users, CheckCircle, Clock, XCircle } from "lucide-react";
import BarraProgreso from "./BarraProgreso";

interface EstadisticasPanelProps {
  estadisticas: {
    total: number;
    embarcados: number;
    pendientes: number;
    noEmbarcados: number;
    porcentajeEmbarcados: number;
    capacidadDisponible: number;
  };
}

export default function EstadisticasPanel({ estadisticas }: EstadisticasPanelProps) {
  const cards = [
    {
      label: "Total Pasajeros",
      value: estadisticas.total,
      icon: Users,
      colorClass: "blue",
      ringColor: "ring-blue-500",
      bgGradient: "from-blue-600/10",
      iconBg: "bg-blue-600",
      textColor: "text-blue-400",
    },
    {
      label: "Embarcados",
      value: estadisticas.embarcados,
      icon: CheckCircle,
      colorClass: "green",
      ringColor: "ring-green-500",
      bgGradient: "from-green-600/10",
      iconBg: "bg-green-600",
      textColor: "text-green-400",
    },
    {
      label: "Pendientes",
      value: estadisticas.pendientes,
      icon: Clock,
      colorClass: "yellow",
      ringColor: "ring-yellow-500",
      bgGradient: "from-yellow-600/10",
      iconBg: "bg-yellow-600",
      textColor: "text-yellow-400",
    },
    {
      label: "No Embarcados",
      value: estadisticas.noEmbarcados,
      icon: XCircle,
      colorClass: "red",
      ringColor: "ring-red-500",
      bgGradient: "from-red-600/10",
      iconBg: "bg-red-600",
      textColor: "text-red-400",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-4 lg:p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 ${card.ringColor} hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} to-transparent`}></div>
              <div className="relative flex items-center gap-3 lg:gap-4">
                <div className={`${card.iconBg} p-2.5 lg:p-3 rounded-xl shadow-lg flex-shrink-0`}>
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl lg:text-2xl font-bold text-slate-100">
                    {card.value}
                  </p>
                  <p className="text-xs lg:text-sm font-medium text-slate-300 truncate">
                    {card.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <BarraProgreso porcentaje={estadisticas.porcentajeEmbarcados} />
    </div>
  );
}
