"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { useGenerarReporte } from "@/hooks/use-control-embarque";
import type { ReporteData } from "@/hooks/use-control-embarque";

interface GenerarReportePDFProps {
  fecha: string;
  hora: string;
}

export default function GenerarReportePDF({ fecha, hora }: GenerarReportePDFProps) {
  const { generar, isLoading } = useGenerarReporte();
  const [generating, setGenerating] = useState(false);

  const handleGenerar = async () => {
    setGenerating(true);
    try {
      const data: ReporteData = await generar(fecha, hora);

      // Dynamic import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(data.titulo, 105, 20, { align: "center" });

      // Viaje info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const infoY = 32;
      doc.text(`Embarcación: ${data.viaje.embarcacion}`, 14, infoY);
      doc.text(`Ruta: ${data.viaje.ruta}`, 14, infoY + 6);
      doc.text(`Fecha: ${data.viaje.fecha}`, 14, infoY + 12);
      doc.text(`Hora: ${data.viaje.hora}`, 105, infoY + 12);

      // Table
      autoTable(doc, {
        startY: infoY + 20,
        head: [["N°", "Pasajero", "DNI", "N° Venta", "Pasajes", "Estado", "Hora"]],
        body: data.pasajeros.map((p) => [
          p.numero,
          p.nombreCliente,
          p.dni,
          p.numeroVenta,
          p.cantidadPasajes,
          p.estado,
          p.horaRegistro,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Footer stats
      const finalY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;
      doc.setFontSize(9);
      doc.text(
        `Total: ${data.estadisticas.total} | Embarcados: ${data.estadisticas.embarcados} | Pendientes: ${data.estadisticas.pendientes} | No Embarcados: ${data.estadisticas.noEmbarcados}`,
        14,
        finalY + 10
      );
      doc.text(`Operador: ${data.operador}`, 14, finalY + 16);
      doc.text(
        `Generado: ${new Date(data.fechaGeneracion).toLocaleString("es-PE")}`,
        14,
        finalY + 22
      );

      // Download
      const embarcacionClean = data.viaje.embarcacion.replace(/\s+/g, "_");
      const fechaClean = fecha.replace(/-/g, "");
      const horaClean = hora.replace(":", "");
      doc.save(`Lista_Embarque_${embarcacionClean}_${fechaClean}_${horaClean}.pdf`);

      toast.success("Reporte PDF generado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerar}
      disabled={isLoading || generating}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {isLoading || generating ? (
        <>
          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Generar PDF
        </>
      )}
    </button>
  );
}
