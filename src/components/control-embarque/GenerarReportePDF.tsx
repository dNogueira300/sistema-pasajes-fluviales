"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useGenerarReporte } from "@/hooks/use-control-embarque";
import type { ReporteData } from "@/hooks/use-control-embarque";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GenerarReportePDFProps {
  fecha: string;
  hora: string;
}

// Configuración de empresa por defecto (consistente con el sistema)
const EMPRESA = {
  nombre: "Alto Impacto Travel",
  direccion: "Jr. Fitzcarrald 513, Iquitos, Loreto",
  telefono: "",
  email: "",
};

export default function GenerarReportePDF({ fecha, hora }: GenerarReportePDFProps) {
  const { generar, isLoading } = useGenerarReporte();
  const [generating, setGenerating] = useState(false);

  const handleGenerar = async () => {
    setGenerating(true);
    const toastId = toast.loading("Generando reporte PDF...");

    try {
      const data: ReporteData = await generar(fecha, hora);

      // Dynamic import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // ============================================
      // HEADER CON FONDO AZUL
      // ============================================
      doc.setFillColor(30, 64, 175); // Azul primario
      doc.rect(0, 0, pageWidth, 40, "F");

      // Logo/Nombre empresa (izquierda)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(EMPRESA.nombre.toUpperCase(), margin, 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("CONTROL DE EMBARQUE - PASAJES FLUVIALES", margin, 21);

      doc.setFontSize(8);
      if (EMPRESA.direccion) {
        doc.text(EMPRESA.direccion, margin, 28);
      }
      if (EMPRESA.telefono || EMPRESA.email) {
        doc.text(
          [EMPRESA.telefono, EMPRESA.email].filter(Boolean).join(" | "),
          margin,
          33
        );
      }

      // Recuadro de título (derecha)
      const boxX = pageWidth - 65;
      const boxY = 6;
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(1);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(boxX, boxY, 50, 28, 2, 2, "FD");

      doc.setTextColor(30, 64, 175);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("LISTA DE", boxX + 25, boxY + 8, { align: "center" });
      doc.text("EMBARQUE", boxX + 25, boxY + 14, { align: "center" });

      doc.setTextColor(220, 38, 38); // Rojo
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const fechaFormateada = format(new Date(fecha + "T12:00:00"), "dd/MM/yyyy", { locale: es });
      doc.text(fechaFormateada, boxX + 25, boxY + 21, { align: "center" });
      doc.text(hora, boxX + 25, boxY + 26, { align: "center" });

      yPos = 45;

      // ============================================
      // INFORMACIÓN DEL VIAJE
      // ============================================
      doc.setFillColor(249, 250, 251);
      doc.rect(0, yPos - 2, pageWidth, 24, "F");

      doc.setTextColor(30, 64, 175);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMACIÓN DEL VIAJE", margin, yPos + 4);

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 6, pageWidth - margin, yPos + 6);

      yPos += 10;
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      // Fila 1
      doc.setFont("helvetica", "bold");
      doc.text("Embarcación:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(data.viaje.embarcacion, margin + 28, yPos);

      doc.setFont("helvetica", "bold");
      doc.text("Ruta:", pageWidth / 2, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(data.viaje.ruta, pageWidth / 2 + 12, yPos);

      yPos += 5;

      // Fila 2
      const fechaViaje = format(new Date(fecha + "T12:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
      doc.setFont("helvetica", "bold");
      doc.text("Fecha:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(fechaViaje, margin + 14, yPos);

      doc.setFont("helvetica", "bold");
      doc.text("Hora salida:", pageWidth / 2, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(hora, pageWidth / 2 + 24, yPos);

      yPos += 10;

      // ============================================
      // ESTADÍSTICAS RESUMEN
      // ============================================
      const statsY = yPos;
      const statsWidth = (pageWidth - 2 * margin - 15) / 4;

      // Total
      doc.setFillColor(59, 130, 246); // Azul
      doc.roundedRect(margin, statsY, statsWidth, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", margin + statsWidth / 2, statsY + 5, { align: "center" });
      doc.setFontSize(12);
      doc.text(String(data.estadisticas.total), margin + statsWidth / 2, statsY + 11, { align: "center" });

      // Embarcados
      doc.setFillColor(34, 197, 94); // Verde
      doc.roundedRect(margin + statsWidth + 5, statsY, statsWidth, 14, 2, 2, "F");
      doc.setFontSize(8);
      doc.text("EMBARCADOS", margin + statsWidth + 5 + statsWidth / 2, statsY + 5, { align: "center" });
      doc.setFontSize(12);
      doc.text(String(data.estadisticas.embarcados), margin + statsWidth + 5 + statsWidth / 2, statsY + 11, { align: "center" });

      // Pendientes
      doc.setFillColor(234, 179, 8); // Amarillo
      doc.roundedRect(margin + (statsWidth + 5) * 2, statsY, statsWidth, 14, 2, 2, "F");
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      doc.text("PENDIENTES", margin + (statsWidth + 5) * 2 + statsWidth / 2, statsY + 5, { align: "center" });
      doc.setFontSize(12);
      doc.text(String(data.estadisticas.pendientes), margin + (statsWidth + 5) * 2 + statsWidth / 2, statsY + 11, { align: "center" });

      // No Embarcados
      doc.setFillColor(239, 68, 68); // Rojo
      doc.roundedRect(margin + (statsWidth + 5) * 3, statsY, statsWidth, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("NO EMBARCADOS", margin + (statsWidth + 5) * 3 + statsWidth / 2, statsY + 5, { align: "center" });
      doc.setFontSize(12);
      doc.text(String(data.estadisticas.noEmbarcados), margin + (statsWidth + 5) * 3 + statsWidth / 2, statsY + 11, { align: "center" });

      yPos = statsY + 20;

      // ============================================
      // TABLA DE PASAJEROS
      // ============================================
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("LISTA DE PASAJEROS", margin, yPos);

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

      yPos += 6;

      // Tabla con autoTable
      autoTable(doc, {
        startY: yPos,
        head: [["N°", "Pasajero", "DNI", "N° Venta", "Cant.", "Estado", "Hora Reg."]],
        body: data.pasajeros.map((p) => [
          p.numero,
          p.nombreCliente,
          p.dni,
          p.numeroVenta,
          p.cantidadPasajes,
          p.estado === "EMBARCADO" ? "Embarcado" : p.estado === "NO_EMBARCADO" ? "No Embarcado" : "Pendiente",
          p.horaRegistro,
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 50 },
          2: { halign: "center", cellWidth: 22 },
          3: { halign: "center", cellWidth: 25 },
          4: { halign: "center", cellWidth: 12 },
          5: { halign: "center", cellWidth: 25 },
          6: { halign: "center", cellWidth: 18 },
        },
        bodyStyles: {
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        didParseCell: (hookData) => {
          // Colorear la columna de estado según el valor
          if (hookData.section === "body" && hookData.column.index === 5) {
            const estado = data.pasajeros[hookData.row.index]?.estado;
            if (estado === "EMBARCADO") {
              hookData.cell.styles.textColor = [22, 163, 74]; // Verde
              hookData.cell.styles.fontStyle = "bold";
            } else if (estado === "NO_EMBARCADO") {
              hookData.cell.styles.textColor = [220, 38, 38]; // Rojo
              hookData.cell.styles.fontStyle = "bold";
            } else {
              hookData.cell.styles.textColor = [161, 161, 170]; // Gris
            }
          }
        },
      });

      // Obtener posición final de la tabla
      const finalY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;

      // ============================================
      // INFORMACIÓN ADICIONAL
      // ============================================
      const infoY = finalY + 8;

      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, infoY, pageWidth - 2 * margin, 18, 2, 2, "S");

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.setFont("helvetica", "bold");
      doc.text("Operador:", margin + 5, infoY + 6);
      doc.setFont("helvetica", "normal");
      doc.text(data.operador, margin + 25, infoY + 6);

      doc.setFont("helvetica", "bold");
      doc.text("Capacidad embarcación:", margin + 5, infoY + 11);
      doc.setFont("helvetica", "normal");
      doc.text(`${data.estadisticas.capacidadEmbarcacion} pasajeros`, margin + 50, infoY + 11);

      const fechaGen = new Date(data.fechaGeneracion).toLocaleString("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFont("helvetica", "bold");
      doc.text("Generado:", pageWidth / 2, infoY + 6);
      doc.setFont("helvetica", "normal");
      doc.text(fechaGen, pageWidth / 2 + 20, infoY + 6);

      doc.setFont("helvetica", "bold");
      doc.text("Espacios disponibles:", pageWidth / 2, infoY + 11);
      doc.setFont("helvetica", "normal");
      doc.text(`${data.estadisticas.capacidadDisponible} asientos`, pageWidth / 2 + 40, infoY + 11);

      // ============================================
      // FOOTER
      // ============================================
      const footerY = pageHeight - 12;
      doc.setFillColor(30, 64, 175);
      doc.rect(0, footerY, pageWidth, 12, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${EMPRESA.nombre.toUpperCase()} | ${EMPRESA.direccion}`,
        pageWidth / 2,
        footerY + 5,
        { align: "center" }
      );
      doc.text(
        `Documento generado automáticamente - IQUITOS, LORETO`,
        pageWidth / 2,
        footerY + 9,
        { align: "center" }
      );

      // ============================================
      // DESCARGAR PDF
      // ============================================
      const embarcacionClean = data.viaje.embarcacion.replace(/\s+/g, "_");
      const fechaClean = fecha.replace(/-/g, "");
      const horaClean = hora.replace(":", "");
      doc.save(`Lista_Embarque_${embarcacionClean}_${fechaClean}_${horaClean}.pdf`);

      toast.success("Reporte PDF descargado correctamente", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar el reporte PDF", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerar}
      disabled={isLoading || generating}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading || generating ? (
        <>
          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Descargar PDF
        </>
      )}
    </button>
  );
}
