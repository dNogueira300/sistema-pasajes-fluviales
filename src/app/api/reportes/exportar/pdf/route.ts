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
    checkPageBreak(80);
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

    // Dibujar tabla de resumen con fondo
    pdf.setFontSize(10);
    resumenData.forEach((row, index) => {
      checkPageBreak(8);

      // Alternar color de fondo
      if (index % 2 === 0) {
        pdf.setFillColor(240, 244, 248);
        pdf.rect(margin - 2, yPosition - 5, 170, 7, 'F');
      }

      pdf.setTextColor(colors.text);
      pdf.text(row[0], margin, yPosition);
      pdf.setTextColor(colors.primary);
      pdf.setFont(undefined, 'bold');
      pdf.text(row[1], margin + 80, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 8;
    });

    yPosition += 10;

    // Información adicional de filtros aplicados
    checkPageBreak(30);
    pdf.setFontSize(12);
    pdf.setTextColor(colors.secondary);
    pdf.text("Filtros Aplicados:", margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    const filtrosTexto: string[] = [];
    if (reporte.filtros.rutaId) filtrosTexto.push(`Ruta específica`);
    if (reporte.filtros.embarcacionId) filtrosTexto.push(`Embarcación específica`);
    if (reporte.filtros.vendedorId) filtrosTexto.push(`Vendedor específico`);
    if (reporte.filtros.metodoPago) filtrosTexto.push(`Método: ${reporte.filtros.metodoPago}`);
    if (reporte.filtros.tipoPago) filtrosTexto.push(`Tipo: ${reporte.filtros.tipoPago}`);
    if (reporte.filtros.estado) filtrosTexto.push(`Estado: ${reporte.filtros.estado}`);

    if (filtrosTexto.length > 0) {
      pdf.text(filtrosTexto.join(" | "), margin, yPosition);
      yPosition += 10;
    } else {
      pdf.text("Sin filtros adicionales aplicados", margin, yPosition);
      yPosition += 10;
    }

    // Reporte por rutas (Top 10)
    if (reporte.porRuta.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(`Reporte por Rutas (${reporte.porRuta.length} rutas totales)`, margin, yPosition);
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text("#", margin + 2, yPosition);
      pdf.text("Ruta", margin + 10, yPosition);
      pdf.text("Ventas", margin + 90, yPosition);
      pdf.text("Pasajes", margin + 115, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 10;

      const topRutas = reporte.porRuta.slice(0, 10);
      topRutas.forEach((ruta, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, 'F');
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(`${index + 1}`, margin + 2, yPosition);
        pdf.text(ruta.nombreRuta.substring(0, 35), margin + 10, yPosition);
        pdf.text(ruta.totalVentas.toString(), margin + 90, yPosition);
        pdf.text(ruta.totalPasajes.toString(), margin + 115, yPosition);
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, 'bold');
        pdf.text(`S/ ${ruta.totalRecaudado.toFixed(2)}`, margin + 140, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Reporte por vendedores
    if (reporte.porVendedor.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(`Reporte por Vendedores (${reporte.porVendedor.length} vendedores)`, margin, yPosition);
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text("#", margin + 2, yPosition);
      pdf.text("Vendedor", margin + 10, yPosition);
      pdf.text("Ventas", margin + 90, yPosition);
      pdf.text("Pasajes", margin + 115, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 10;

      const topVendedores = reporte.porVendedor.slice(0, 10);
      topVendedores.forEach((vendedor, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, 'F');
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(`${index + 1}`, margin + 2, yPosition);
        pdf.text(vendedor.nombreVendedor.substring(0, 35), margin + 10, yPosition);
        pdf.text(vendedor.totalVentas.toString(), margin + 90, yPosition);
        pdf.text(vendedor.totalPasajes.toString(), margin + 115, yPosition);
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, 'bold');
        pdf.text(`S/ ${vendedor.totalRecaudado.toFixed(2)}`, margin + 140, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Métodos de pago
    if (reporte.porMetodoPago.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text("Reporte por Métodos de Pago", margin, yPosition);
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text("Método", margin + 2, yPosition);
      pdf.text("Tipo", margin + 50, yPosition);
      pdf.text("Ventas", margin + 90, yPosition);
      pdf.text("Pasajes", margin + 115, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 10;

      reporte.porMetodoPago.forEach((metodo, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, 'F');
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(metodo.metodoPago.substring(0, 20), margin + 2, yPosition);
        pdf.text(metodo.tipoPago.substring(0, 15), margin + 50, yPosition);
        pdf.text(metodo.totalVentas.toString(), margin + 90, yPosition);
        pdf.text(metodo.totalPasajes.toString(), margin + 115, yPosition);
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, 'bold');
        pdf.text(`S/ ${metodo.totalRecaudado.toFixed(2)}`, margin + 140, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Reporte por embarcaciones
    if (reporte.porEmbarcacion && reporte.porEmbarcacion.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(`Reporte por Embarcaciones (${reporte.porEmbarcacion.length} embarcaciones)`, margin, yPosition);
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text("#", margin + 2, yPosition);
      pdf.text("Embarcación", margin + 10, yPosition);
      pdf.text("Ventas", margin + 90, yPosition);
      pdf.text("Pasajes", margin + 115, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 10;

      reporte.porEmbarcacion.forEach((embarcacion, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, 'F');
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(`${index + 1}`, margin + 2, yPosition);
        pdf.text(embarcacion.nombreEmbarcacion.substring(0, 35), margin + 10, yPosition);
        pdf.text(embarcacion.totalVentas.toString(), margin + 90, yPosition);
        pdf.text(embarcacion.totalPasajes.toString(), margin + 115, yPosition);
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, 'bold');
        pdf.text(`S/ ${embarcacion.totalRecaudado.toFixed(2)}`, margin + 140, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Pie de página
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(colors.secondary);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      pdf.text(
        `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        pdf.internal.pageSize.getWidth() - margin,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
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
