// app/api/reportes/exportar/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jsPDF from "jspdf";
import { ReporteCompleto, ConfiguracionExportacion } from "@/types/reportes";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      reporte,
      configuracion,
    }: {
      reporte: ReporteCompleto;
      configuracion: ConfiguracionExportacion;
    } = await request.json();

    const pdf = new jsPDF({
      orientation: configuracion.orientacion || "portrait",
      unit: "mm",
      format: "a4",
    });

    // Configuración de fuentes y colores
    const colors = {
      primary: "#1e40af",
      secondary: "#64748b",
      success: "#059669",
      danger: "#dc2626",
      text: "#1f2937",
    };

    let yPosition = 20;
    const margin = 20;

    // Función para agregar nueva página si es necesario
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Encabezado del reporte
    pdf.setFontSize(24);
    pdf.setTextColor(colors.primary);
    pdf.text("Reporte de Ventas", margin, yPosition);
    yPosition += 15;

    // Información del reporte
    pdf.setFontSize(12);
    pdf.setTextColor(colors.secondary);
    pdf.text(
      `Fecha de generación: ${format(
        new Date(reporte.fechaGeneracion),
        "dd/MM/yyyy HH:mm",
        { locale: es }
      )}`,
      margin,
      yPosition
    );
    yPosition += 8;
    pdf.text(
      `Período: ${format(new Date(reporte.filtros.fechaInicio), "dd/MM/yyyy", {
        locale: es,
      })} - ${format(new Date(reporte.filtros.fechaFin), "dd/MM/yyyy", {
        locale: es,
      })}`,
      margin,
      yPosition
    );
    yPosition += 15;

    // Resumen ejecutivo
    checkPageBreak(60);
    pdf.setFontSize(16);
    pdf.setTextColor(colors.text);
    pdf.text("Resumen Ejecutivo", margin, yPosition);
    yPosition += 10;

    // Crear tabla de resumen
    const resumenData = [
      ["Total de Ventas", reporte.resumen.totalVentas.toString()],
      ["Total Recaudado", `S/ ${reporte.resumen.totalRecaudado.toFixed(2)}`],
      ["Total Pasajes", reporte.resumen.totalPasajes.toString()],
      ["Ventas Confirmadas", reporte.resumen.ventasConfirmadas.toString()],
      ["Ventas Anuladas", reporte.resumen.ventasAnuladas.toString()],
      ["Promedio por Venta", `S/ ${reporte.resumen.promedioVenta.toFixed(2)}`],
    ];

    // Dibujar tabla de resumen
    pdf.setFontSize(10);
    resumenData.forEach((row) => {
      checkPageBreak(8);
      pdf.setTextColor(colors.text);
      pdf.text(row[0], margin, yPosition);
      pdf.setTextColor(colors.primary);
      pdf.text(row[1], margin + 80, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Reporte por rutas (Top 5)
    if (reporte.porRuta.length > 0) {
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text("Top 5 Rutas", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      const topRutas = reporte.porRuta.slice(0, 5);
      topRutas.forEach((ruta, index) => {
        checkPageBreak(12);
        pdf.setTextColor(colors.text);
        pdf.text(`${index + 1}. ${ruta.nombreRuta}`, margin, yPosition);
        pdf.text(`Ventas: ${ruta.totalVentas}`, margin, yPosition + 4);
        pdf.setTextColor(colors.success);
        pdf.text(
          `S/ ${ruta.totalRecaudado.toFixed(2)}`,
          margin + 100,
          yPosition
        );
        pdf.setTextColor(colors.secondary);
        pdf.text(`${ruta.porcentaje.toFixed(1)}%`, margin + 140, yPosition);
        yPosition += 12;
      });
      yPosition += 10;
    }

    // Reporte por vendedores (Top 5)
    if (reporte.porVendedor.length > 0) {
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text("Top 5 Vendedores", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      const topVendedores = reporte.porVendedor.slice(0, 5);
      topVendedores.forEach((vendedor, index) => {
        checkPageBreak(12);
        pdf.setTextColor(colors.text);
        pdf.text(`${index + 1}. ${vendedor.nombreVendedor}`, margin, yPosition);
        pdf.text(`Ventas: ${vendedor.totalVentas}`, margin, yPosition + 4);
        pdf.setTextColor(colors.success);
        pdf.text(
          `S/ ${vendedor.totalRecaudado.toFixed(2)}`,
          margin + 100,
          yPosition
        );
        pdf.setTextColor(colors.secondary);
        pdf.text(`${vendedor.porcentaje.toFixed(1)}%`, margin + 140, yPosition);
        yPosition += 12;
      });
      yPosition += 10;
    }

    // Métodos de pago
    if (reporte.porMetodoPago.length > 0) {
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text("Métodos de Pago", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      reporte.porMetodoPago.forEach((metodo) => {
        checkPageBreak(12);
        pdf.setTextColor(colors.text);
        pdf.text(
          `${metodo.metodoPago} (${metodo.tipoPago})`,
          margin,
          yPosition
        );
        pdf.text(`Ventas: ${metodo.totalVentas}`, margin, yPosition + 4);
        pdf.setTextColor(colors.success);
        pdf.text(
          `S/ ${metodo.totalRecaudado.toFixed(2)}`,
          margin + 100,
          yPosition
        );
        pdf.setTextColor(colors.secondary);
        pdf.text(`${metodo.porcentaje.toFixed(1)}%`, margin + 140, yPosition);
        yPosition += 12;
      });
    }

    // Generar el PDF como buffer
    const pdfBuffer = pdf.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte_${format(
          new Date(),
          "yyyy-MM-dd"
        )}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
