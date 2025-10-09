// app/api/reportes/exportar/excel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Workbook } from "exceljs";
import { ReporteCompleto, ConfiguracionExportacion } from "@/types/reportes";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      reporte,
    }: {
      reporte: ReporteCompleto;
      configuracion: ConfiguracionExportacion;
    } = await request.json();

    const workbook = new Workbook();

    // Metadatos del workbook
    workbook.creator = session.user.name || "Sistema de Ventas";
    workbook.lastModifiedBy = session.user.name || "Sistema de Ventas";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Hoja de resumen
    const resumenSheet = workbook.addWorksheet("Resumen");

    // Configurar columnas
    resumenSheet.columns = [
      { header: "Concepto", key: "concepto", width: 25 },
      { header: "Valor", key: "valor", width: 20 },
    ];

    // Estilo para encabezados
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFF" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "1E40AF" },
      },
      alignment: { horizontal: "center" as const },
    };

    // Aplicar estilo a encabezados
    resumenSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Agregar datos de resumen
    const resumenData = [
      {
        concepto: "Período del Reporte",
        valor: `${format(
          new Date(reporte.filtros.fechaInicio),
          "dd/MM/yyyy"
        )} - ${format(new Date(reporte.filtros.fechaFin), "dd/MM/yyyy")}`,
      },
      {
        concepto: "Fecha de Generación",
        valor: format(new Date(reporte.fechaGeneracion), "dd/MM/yyyy HH:mm"),
      },
      { concepto: "", valor: "" }, // Fila vacía
      { concepto: "Total de Ventas", valor: reporte.resumen.totalVentas },
      {
        concepto: "Total Recaudado",
        valor: `S/ ${reporte.resumen.totalRecaudado.toFixed(2)}`,
      },
      { concepto: "Total Pasajes", valor: reporte.resumen.totalPasajes },
      {
        concepto: "Ventas Confirmadas",
        valor: reporte.resumen.ventasConfirmadas,
      },
      { concepto: "Ventas Anuladas", valor: reporte.resumen.ventasAnuladas },
      {
        concepto: "Ventas Reembolsadas",
        valor: reporte.resumen.ventasReembolsadas,
      },
      {
        concepto: "Promedio por Venta",
        valor: `S/ ${reporte.resumen.promedioVenta.toFixed(2)}`,
      },
    ];

    resumenSheet.addRows(resumenData);

    // Hoja de rutas
    if (reporte.porRuta.length > 0) {
      const rutasSheet = workbook.addWorksheet("Por Rutas");
      rutasSheet.columns = [
        { header: "Ruta", key: "ruta", width: 30 },
        { header: "Total Ventas", key: "ventas", width: 15 },
        { header: "Total Recaudado", key: "recaudado", width: 20 },
        { header: "Total Pasajes", key: "pasajes", width: 15 },
        { header: "Porcentaje", key: "porcentaje", width: 15 },
      ];

      rutasSheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const rutasData = reporte.porRuta.map((ruta) => ({
        ruta: ruta.nombreRuta,
        ventas: ruta.totalVentas,
        recaudado: `S/ ${ruta.totalRecaudado.toFixed(2)}`,
        pasajes: ruta.totalPasajes,
        porcentaje: `${ruta.porcentaje.toFixed(2)}%`,
      }));

      rutasSheet.addRows(rutasData);
    }

    // Hoja de embarcaciones
    if (reporte.porEmbarcacion.length > 0) {
      const embarcacionesSheet = workbook.addWorksheet("Por Embarcaciones");
      embarcacionesSheet.columns = [
        { header: "Embarcación", key: "embarcacion", width: 25 },
        { header: "Total Ventas", key: "ventas", width: 15 },
        { header: "Total Recaudado", key: "recaudado", width: 20 },
        { header: "Total Pasajes", key: "pasajes", width: 15 },
        { header: "Porcentaje", key: "porcentaje", width: 15 },
      ];

      embarcacionesSheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const embarcacionesData = reporte.porEmbarcacion.map((embarcacion) => ({
        embarcacion: embarcacion.nombreEmbarcacion,
        ventas: embarcacion.totalVentas,
        recaudado: `S/ ${embarcacion.totalRecaudado.toFixed(2)}`,
        pasajes: embarcacion.totalPasajes,
        porcentaje: `${embarcacion.porcentaje.toFixed(2)}%`,
      }));

      embarcacionesSheet.addRows(embarcacionesData);
    }

    // Hoja de vendedores
    if (reporte.porVendedor.length > 0) {
      const vendedoresSheet = workbook.addWorksheet("Por Vendedores");
      vendedoresSheet.columns = [
        { header: "Vendedor", key: "vendedor", width: 25 },
        { header: "Total Ventas", key: "ventas", width: 15 },
        { header: "Total Recaudado", key: "recaudado", width: 20 },
        { header: "Total Pasajes", key: "pasajes", width: 15 },
        { header: "Porcentaje", key: "porcentaje", width: 15 },
      ];

      vendedoresSheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const vendedoresData = reporte.porVendedor.map((vendedor) => ({
        vendedor: vendedor.nombreVendedor,
        ventas: vendedor.totalVentas,
        recaudado: `S/ ${vendedor.totalRecaudado.toFixed(2)}`,
        pasajes: vendedor.totalPasajes,
        porcentaje: `${vendedor.porcentaje.toFixed(2)}%`,
      }));

      vendedoresSheet.addRows(vendedoresData);
    }

    // Hoja de métodos de pago
    if (reporte.porMetodoPago.length > 0) {
      const pagoSheet = workbook.addWorksheet("Métodos de Pago");
      pagoSheet.columns = [
        { header: "Método de Pago", key: "metodo", width: 20 },
        { header: "Tipo de Pago", key: "tipo", width: 15 },
        { header: "Total Ventas", key: "ventas", width: 15 },
        { header: "Total Recaudado", key: "recaudado", width: 20 },
        { header: "Porcentaje", key: "porcentaje", width: 15 },
      ];

      pagoSheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const pagoData = reporte.porMetodoPago.map((pago) => ({
        metodo: pago.metodoPago,
        tipo: pago.tipoPago,
        ventas: pago.totalVentas,
        recaudado: `S/ ${pago.totalRecaudado.toFixed(2)}`,
        porcentaje: `${pago.porcentaje.toFixed(2)}%`,
      }));

      pagoSheet.addRows(pagoData);
    }

    // Hoja de datos por fecha
    if (reporte.porFecha.length > 0) {
      const fechaSheet = workbook.addWorksheet("Por Fechas");
      fechaSheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Total Ventas", key: "ventas", width: 15 },
        { header: "Total Recaudado", key: "recaudado", width: 20 },
        { header: "Total Pasajes", key: "pasajes", width: 15 },
      ];

      fechaSheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const fechaData = reporte.porFecha.map((fecha) => ({
        fecha: format(new Date(fecha.fecha), "dd/MM/yyyy"),
        ventas: fecha.totalVentas,
        recaudado: `S/ ${fecha.totalRecaudado.toFixed(2)}`,
        pasajes: fecha.totalPasajes,
      }));

      fechaSheet.addRows(fechaData);
    }

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="reporte_${format(
          new Date(),
          "yyyy-MM-dd"
        )}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generando Excel:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
