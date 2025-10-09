// components/reportes/graficos.tsx
"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  ReportePorRuta,
  ReportePorEmbarcacion,
  ReportePorVendedor,
  ReportePorMetodoPago,
  ReportePorFecha,
} from "@/types/reportes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Colores consistentes para los gráficos
const BACKGROUND_COLORS = [
  "rgba(59, 130, 246, 0.1)",
  "rgba(16, 185, 129, 0.1)",
  "rgba(245, 158, 11, 0.1)",
  "rgba(239, 68, 68, 0.1)",
  "rgba(139, 92, 246, 0.1)",
  "rgba(236, 72, 153, 0.1)",
  "rgba(6, 182, 212, 0.1)",
  "rgba(132, 204, 22, 0.1)",
];

const BORDER_COLORS = [
  "rgba(59, 130, 246, 1)",
  "rgba(16, 185, 129, 1)",
  "rgba(245, 158, 11, 1)",
  "rgba(239, 68, 68, 1)",
  "rgba(139, 92, 246, 1)",
  "rgba(236, 72, 153, 1)",
  "rgba(6, 182, 212, 1)",
  "rgba(132, 204, 22, 1)",
];

// Configuración base para gráficos
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "#e2e8f0",
        font: {
          size: 12,
        },
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      titleColor: "#e2e8f0",
      bodyColor: "#cbd5e1",
      borderColor: "#334155",
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#94a3b8",
        font: {
          size: 11,
        },
      },
      grid: {
        color: "rgba(148, 163, 184, 0.1)",
      },
    },
    y: {
      ticks: {
        color: "#94a3b8",
        font: {
          size: 11,
        },
      },
      grid: {
        color: "rgba(148, 163, 184, 0.1)",
      },
    },
  },
};

interface GraficoVentasPorRutaProps {
  datos: ReportePorRuta[];
  tipo?: "bar" | "pie";
}

export function GraficoVentasPorRuta({
  datos,
  tipo = "bar",
}: GraficoVentasPorRutaProps) {
  const topRutas = datos.slice(0, 8);

  const chartData = {
    labels: topRutas.map((ruta) => ruta.nombreRuta),
    datasets: [
      {
        label: "Recaudación (S/)",
        data: topRutas.map((ruta) => ruta.totalRecaudado),
        backgroundColor:
          tipo === "bar"
            ? BACKGROUND_COLORS[0]
            : BACKGROUND_COLORS.slice(0, topRutas.length),
        borderColor:
          tipo === "bar"
            ? BORDER_COLORS[0]
            : BORDER_COLORS.slice(0, topRutas.length),
        borderWidth: 2,
        borderRadius: tipo === "bar" ? 6 : 0,
      },
    ],
  };

  const options = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      title: {
        display: true,
        text: "Ventas por Ruta",
        color: "#e2e8f0",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: 20,
      },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const ruta = topRutas[context.dataIndex];
            return [
              `Recaudación: S/ ${ruta.totalRecaudado.toFixed(2)}`,
              `Ventas: ${ruta.totalVentas}`,
              `Pasajes: ${ruta.totalPasajes}`,
              `Porcentaje: ${ruta.porcentaje.toFixed(1)}%`,
            ];
          },
        },
      },
    },
  };

  if (tipo === "pie") {
    return (
      <div className="h-96 w-full">
        <Pie data={chartData} options={options as ChartOptions<"pie">} />
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <Bar data={chartData} options={options as ChartOptions<"bar">} />
    </div>
  );
}

interface GraficoVentasPorVendedorProps {
  datos: ReportePorVendedor[];
}

export function GraficoVentasPorVendedor({
  datos,
}: GraficoVentasPorVendedorProps) {
  const topVendedores = datos.slice(0, 6);

  const chartData = {
    labels: topVendedores.map((vendedor) => vendedor.nombreVendedor),
    datasets: [
      {
        label: "Recaudación (S/)",
        data: topVendedores.map((vendedor) => vendedor.totalRecaudado),
        backgroundColor: BACKGROUND_COLORS[1],
        borderColor: BORDER_COLORS[1],
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: "Número de Ventas",
        data: topVendedores.map((vendedor) => vendedor.totalVentas),
        backgroundColor: BACKGROUND_COLORS[2],
        borderColor: BORDER_COLORS[2],
        borderWidth: 2,
        borderRadius: 6,
        yAxisID: "y1",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      title: {
        display: true,
        text: "Rendimiento por Vendedor",
        color: "#e2e8f0",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: 20,
      },
    },
    scales: {
      ...baseOptions.scales,
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="h-96 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface GraficoMetodosPagoProps {
  datos: ReportePorMetodoPago[];
}

export function GraficoMetodosPago({ datos }: GraficoMetodosPagoProps) {
  const chartData = {
    labels: datos.map((metodo) => `${metodo.metodoPago} (${metodo.tipoPago})`),
    datasets: [
      {
        label: "Recaudación por Método",
        data: datos.map((metodo) => metodo.totalRecaudado),
        backgroundColor: BACKGROUND_COLORS.slice(0, datos.length),
        borderColor: BORDER_COLORS.slice(0, datos.length),
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#e2e8f0",
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: "Distribución por Método de Pago",
        color: "#e2e8f0",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#e2e8f0",
        bodyColor: "#cbd5e1",
        borderColor: "#334155",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const metodo = datos[context.dataIndex];
            return [
              `Recaudación: S/ ${metodo.totalRecaudado.toFixed(2)}`,
              `Ventas: ${metodo.totalVentas}`,
              `Porcentaje: ${metodo.porcentaje.toFixed(1)}%`,
            ];
          },
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

interface GraficoTendenciaVentasProps {
  datos: ReportePorFecha[];
}

export function GraficoTendenciaVentas({ datos }: GraficoTendenciaVentasProps) {
  const chartData = {
    labels: datos.map((fecha) => {
      const date = new Date(fecha.fecha);
      return date.toLocaleDateString("es-PE", {
        month: "short",
        day: "numeric",
      });
    }),
    datasets: [
      {
        label: "Recaudación Diaria (S/)",
        data: datos.map((fecha) => fecha.totalRecaudado),
        borderColor: BORDER_COLORS[0],
        backgroundColor: BACKGROUND_COLORS[0],
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: BORDER_COLORS[0],
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
      {
        label: "Número de Ventas",
        data: datos.map((fecha) => fecha.totalVentas),
        borderColor: BORDER_COLORS[1],
        backgroundColor: BACKGROUND_COLORS[1],
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: BORDER_COLORS[1],
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        yAxisID: "y1",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#e2e8f0",
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: "Tendencia de Ventas",
        color: "#e2e8f0",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#e2e8f0",
        bodyColor: "#cbd5e1",
        borderColor: "#334155",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="h-96 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}

interface GraficoEmbarcacionesProps {
  datos: ReportePorEmbarcacion[];
}

export function GraficoEmbarcaciones({ datos }: GraficoEmbarcacionesProps) {
  const topEmbarcaciones = datos.slice(0, 6);

  const chartData = {
    labels: topEmbarcaciones.map((emb) => emb.nombreEmbarcacion),
    datasets: [
      {
        label: "Recaudación (S/)",
        data: topEmbarcaciones.map((emb) => emb.totalRecaudado),
        backgroundColor: BACKGROUND_COLORS[3],
        borderColor: BORDER_COLORS[3],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#e2e8f0",
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: "Ventas por Embarcación",
        color: "#e2e8f0",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#e2e8f0",
        bodyColor: "#cbd5e1",
        borderColor: "#334155",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const embarcacion = topEmbarcaciones[context.dataIndex];
            return [
              `Recaudación: S/ ${embarcacion.totalRecaudado.toFixed(2)}`,
              `Ventas: ${embarcacion.totalVentas}`,
              `Pasajes: ${embarcacion.totalPasajes}`,
              `Porcentaje: ${embarcacion.porcentaje.toFixed(1)}%`,
            ];
          },
        },
      },
    },
    indexAxis: "y" as const,
    scales: {
      x: {
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
      },
    },
  };

  return (
    <div className="h-96 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface ExportableChartProps {
  children: React.ReactNode;
  chartId: string;
  title: string;
}

export function ExportableChart({
  children,
  chartId,
  title,
}: ExportableChartProps) {
  return (
    <div
      id={chartId}
      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}
