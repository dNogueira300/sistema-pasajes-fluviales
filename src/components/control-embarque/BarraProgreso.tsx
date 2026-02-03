"use client";

interface BarraProgresoProps {
  porcentaje: number;
}

export default function BarraProgreso({ porcentaje }: BarraProgresoProps) {
  const clampedPct = Math.min(100, Math.max(0, porcentaje));

  const getColor = () => {
    if (clampedPct <= 30) return "from-red-500 to-red-600";
    if (clampedPct <= 70) return "from-yellow-500 to-yellow-600";
    return "from-green-500 to-green-600";
  };

  return (
    <div className="space-y-1">
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 text-center">{clampedPct}% Embarcados</p>
    </div>
  );
}
