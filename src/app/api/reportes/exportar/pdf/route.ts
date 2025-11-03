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

    // Helper functions para acceder a propiedades internas de jsPDF
    const getPageHeight = (): number => {
      return (
        pdf as never as { internal: { pageSize: { getHeight(): number } } }
      ).internal.pageSize.getHeight();
    };

    const getPageWidth = (): number => {
      return (
        pdf as never as { internal: { pageSize: { getWidth(): number } } }
      ).internal.pageSize.getWidth();
    };

    const getNumberOfPages = (): number => {
      return (
        pdf as never as { internal: { getNumberOfPages(): number } }
      ).internal.getNumberOfPages();
    };

    // Configuración de fuentes y colores
    const colors = {
      primary: "#1e40af",
      secondary: "#64748b",
      success: "#059669",
      danger: "#dc2626",
      text: "#1f2937",
    };

    let yPosition = 18;
    const margin = 12; // reducir márgenes laterales para más espacio

    // Función para agregar nueva página si es necesario
    const checkPageBreak = (requiredSpace: number): void => {
      if (yPosition + requiredSpace > getPageHeight() - 20) {
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

    // Preparar ventas válidas: filtrar por rango de fechas seleccionado y solo CONFIRMADA
    const ventas: Record<string, unknown>[] = Array.isArray(
      reporte.ventasDetalladas
    )
      ? (reporte.ventasDetalladas as unknown as Record<string, unknown>[])
      : [];
    const startDate =
      reporte.filtros && reporte.filtros.fechaInicio
        ? new Date(String(reporte.filtros.fechaInicio))
        : null;
    const endDate =
      reporte.filtros && reporte.filtros.fechaFin
        ? new Date(String(reporte.filtros.fechaFin))
        : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const ventasEnRango = ventas.filter((v) => {
      if (!v) return false;
      if (!startDate || !endDate) return true;
      const fecha = v.fechaVenta ? new Date(String(v.fechaVenta)) : null;
      if (!fecha) return false;
      return fecha >= startDate && fecha <= endDate;
    });

    const ventasValidas = ventasEnRango.filter((v) => {
      if (!v) return false;
      const estado = String(v.estado || "").toUpperCase();
      if (estado !== "CONFIRMADA") return false;
      return true;
    });

    // Calcular totales válidos (solo confirmadas y en rango)
    const totalConfirmadas = ventasValidas.length;
    const totalRecaudadoConfirmadas = ventasValidas.reduce((s, v) => {
      const vv = v as Record<string, unknown>;
      return s + (Number(vv.total as number | string) || 0);
    }, 0);
    const promedioConfirmadas =
      totalConfirmadas > 0 ? totalRecaudadoConfirmadas / totalConfirmadas : 0;

    // Agregaciones explícitas (tipadas) basadas en ventasValidas
    type RutaAgg = {
      rutaId: string;
      nombreRuta: string;
      totalVentas: number;
      totalRecaudado: number;
      totalPasajes: number;
      porcentaje: number;
    };

    const rutasMap = new Map<string, RutaAgg>();
    ventasValidas.forEach((v) => {
      const vv = v as unknown as Record<string, unknown>;
      const key = String(vv.ruta || vv.nombreRuta || vv.rutaId || "Sin Ruta");
      const totalNum = Number((vv.total as number | string) || 0);
      const pasajesNum = Number((vv.cantidadPasajes as number | string) || 0);
      const existing = rutasMap.get(key);
      if (existing) {
        existing.totalVentas += 1;
        existing.totalRecaudado += totalNum;
        existing.totalPasajes += pasajesNum;
      } else {
        rutasMap.set(key, {
          rutaId: String(vv.rutaId || ""),
          nombreRuta: key,
          totalVentas: 1,
          totalRecaudado: totalNum,
          totalPasajes: pasajesNum,
          porcentaje: 0,
        });
      }
    });
    const porRutaFiltradas = Array.from(rutasMap.values()).sort(
      (a, b) => b.totalRecaudado - a.totalRecaudado
    );

    type VendedorAgg = {
      vendedorId: string;
      nombreVendedor: string;
      totalVentas: number;
      totalRecaudado: number;
      totalPasajes: number;
      porcentaje: number;
    };

    const vendedoresMap = new Map<string, VendedorAgg>();
    ventasValidas.forEach((v) => {
      const vv = v as unknown as Record<string, unknown>;
      const key = String(
        vv.vendedor || vv.nombreVendedor || vv.vendedorId || "Sin Vendedor"
      );
      const totalNum = Number((vv.total as number | string) || 0);
      const pasajesNum = Number((vv.cantidadPasajes as number | string) || 0);
      const existing = vendedoresMap.get(key);
      if (existing) {
        existing.totalVentas += 1;
        existing.totalRecaudado += totalNum;
        existing.totalPasajes += pasajesNum;
      } else {
        vendedoresMap.set(key, {
          vendedorId: String(vv.vendedorId || ""),
          nombreVendedor: key,
          totalVentas: 1,
          totalRecaudado: totalNum,
          totalPasajes: pasajesNum,
          porcentaje: 0,
        });
      }
    });
    const porVendedorFiltradas = Array.from(vendedoresMap.values()).sort(
      (a, b) => b.totalRecaudado - a.totalRecaudado
    );

    type EmbarcacionAgg = {
      embarcacionId: string;
      nombreEmbarcacion: string;
      totalVentas: number;
      totalRecaudado: number;
      totalPasajes: number;
      porcentaje: number;
    };

    const embarcacionesMap = new Map<string, EmbarcacionAgg>();
    ventasValidas.forEach((v) => {
      const vv = v as unknown as Record<string, unknown>;
      const key = String(
        vv.embarcacion ||
          vv.nombreEmbarcacion ||
          vv.embarcacionId ||
          "Sin Embarcación"
      );
      const totalNum = Number((vv.total as number | string) || 0);
      const pasajesNum = Number((vv.cantidadPasajes as number | string) || 0);
      const existing = embarcacionesMap.get(key);
      if (existing) {
        existing.totalVentas += 1;
        existing.totalRecaudado += totalNum;
        existing.totalPasajes += pasajesNum;
      } else {
        embarcacionesMap.set(key, {
          embarcacionId: String(vv.embarcacionId || ""),
          nombreEmbarcacion: key,
          totalVentas: 1,
          totalRecaudado: totalNum,
          totalPasajes: pasajesNum,
          porcentaje: 0,
        });
      }
    });
    const porEmbarcacionFiltradas = Array.from(embarcacionesMap.values()).sort(
      (a, b) => b.totalRecaudado - a.totalRecaudado
    );

    type MetodoAgg = {
      metodoPago: string;
      tipoPago: string;
      totalVentas: number;
      totalRecaudado: number;
      porcentaje: number;
    };

    const metodoMap = new Map<string, MetodoAgg>();
    ventasValidas.forEach((v) => {
      const vv = v as unknown as Record<string, unknown>;
      const key = String(vv.metodoPago || "Sin Método");
      const tipo = String(vv.tipoPago || "");
      const totalNum = Number((vv.total as number | string) || 0);
      const existing = metodoMap.get(key);
      if (existing) {
        existing.totalVentas += 1;
        existing.totalRecaudado += totalNum;
      } else {
        metodoMap.set(key, {
          metodoPago: key,
          tipoPago: tipo,
          totalVentas: 1,
          totalRecaudado: totalNum,
          porcentaje: 0,
        });
      }
    });
    const porMetodoPagoFiltradas = Array.from(metodoMap.values()).sort(
      (a, b) => b.totalRecaudado - a.totalRecaudado
    );

    // Crear tabla de resumen
    const resumenData: [string, string][] = [
      // Mostrar en el resumen los totales válidos (solo confirmadas)
      ["Total de Ventas", totalConfirmadas.toString()],
      ["Total Recaudado", `S/ ${totalRecaudadoConfirmadas.toFixed(2)}`],
      ["Total Pasajes", reporte.resumen.totalPasajes.toString()],
      ["Ventas Confirmadas", reporte.resumen.ventasConfirmadas.toString()],
      ["Ventas Anuladas", reporte.resumen.ventasAnuladas.toString()],
      ["Promedio por Venta", `S/ ${promedioConfirmadas.toFixed(2)}`],
    ];

    // Dibujar tabla de resumen con fondo
    pdf.setFontSize(10);
    resumenData.forEach((row, index) => {
      checkPageBreak(8);

      // Alternar color de fondo
      if (index % 2 === 0) {
        pdf.setFillColor(240, 244, 248);
        pdf.rect(margin - 2, yPosition - 5, 170, 7, "F");
      }

      pdf.setTextColor(colors.text);
      pdf.text(row[0], margin, yPosition);
      pdf.setTextColor(colors.primary);
      pdf.setFont(undefined, "bold");
      pdf.text(row[1], margin + 80, yPosition);
      pdf.setFont(undefined, "normal");
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
    if (reporte.filtros.embarcacionId)
      filtrosTexto.push(`Embarcación específica`);
    if (reporte.filtros.vendedorId) filtrosTexto.push(`Vendedor específico`);
    if (reporte.filtros.metodoPago)
      filtrosTexto.push(`Método: ${reporte.filtros.metodoPago}`);
    if (reporte.filtros.tipoPago)
      filtrosTexto.push(`Tipo: ${reporte.filtros.tipoPago}`);
    if (reporte.filtros.estado)
      filtrosTexto.push(`Estado: ${reporte.filtros.estado}`);

    if (filtrosTexto.length > 0) {
      pdf.text(filtrosTexto.join(" | "), margin, yPosition);
      yPosition += 10;
    } else {
      pdf.text("Sin filtros adicionales aplicados", margin, yPosition);
      yPosition += 10;
    }

    // Reporte por rutas (Top 10) — ahora basado en ventas filtradas y solo confirmadas
    if (porRutaFiltradas.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(
        `Reporte por Rutas (${porRutaFiltradas.length} rutas totales)`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.text("#", margin + 2, yPosition);
      pdf.text("Ruta", margin + 10, yPosition);
      pdf.text("Ventas", margin + 90, yPosition);
      pdf.text("Pasajes", margin + 115, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, "normal");
      yPosition += 10;

      const topRutas = porRutaFiltradas.slice(0, 10);
      topRutas.forEach((ruta, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, "F");
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(`${index + 1}`, margin + 2, yPosition);
        pdf.text(ruta.nombreRuta.substring(0, 35), margin + 10, yPosition);
        pdf.text(ruta.totalVentas.toString(), margin + 90, yPosition);
        pdf.text((ruta.totalPasajes || 0).toString(), margin + 115, yPosition);
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, "bold");
        pdf.text(
          `S/ ${ruta.totalRecaudado.toFixed(2)}`,
          margin + 140,
          yPosition
        );
        pdf.setFont(undefined, "normal");
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Reporte por vendedores (solo confirmadas)
    if (porVendedorFiltradas.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(
        `Reporte por Vendedores (${porVendedorFiltradas.length} vendedores)`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.text("#", margin + 2, yPosition);
      pdf.text("Vendedor", margin + 10, yPosition);
      pdf.text("Ventas", margin + 90, yPosition);
      pdf.text("Pasajes", margin + 115, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, "normal");
      yPosition += 10;

      const topVendedores = porVendedorFiltradas.slice(0, 10);
      topVendedores.forEach((vendedor, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, "F");
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(`${index + 1}`, margin + 2, yPosition);
        pdf.text(
          vendedor.nombreVendedor.substring(0, 35),
          margin + 10,
          yPosition
        );
        pdf.text(vendedor.totalVentas.toString(), margin + 90, yPosition);
        pdf.text(
          (vendedor.totalPasajes || 0).toString(),
          margin + 115,
          yPosition
        );
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, "bold");
        pdf.text(
          `S/ ${vendedor.totalRecaudado.toFixed(2)}`,
          margin + 140,
          yPosition
        );
        pdf.setFont(undefined, "normal");
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Métodos de pago (solo confirmadas)
    if (porMetodoPagoFiltradas.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text("Reporte por Métodos de Pago", margin, yPosition);
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.text("Método", margin + 2, yPosition);
      pdf.text("Tipo", margin + 60, yPosition);
      pdf.text("Ventas", margin + 105, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, "normal");
      yPosition += 10;

      porMetodoPagoFiltradas.forEach((metodo, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, "F");
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(
          String(metodo.metodoPago).substring(0, 25),
          margin + 2,
          yPosition
        );
        pdf.text(
          String(metodo.tipoPago || "").substring(0, 20),
          margin + 60,
          yPosition
        );
        pdf.text(String(metodo.totalVentas || 0), margin + 105, yPosition);
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, "bold");
        pdf.text(
          `S/ ${Number(metodo.totalRecaudado || 0).toFixed(2)}`,
          margin + 140,
          yPosition
        );
        pdf.setFont(undefined, "normal");
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Reporte por embarcaciones (solo confirmadas)
    if (porEmbarcacionFiltradas && porEmbarcacionFiltradas.length > 0) {
      checkPageBreak(50);
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(
        `Reporte por Embarcaciones (${porEmbarcacionFiltradas.length} embarcaciones)`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Encabezado de tabla
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, 170, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.text("#", margin + 2, yPosition);
      pdf.text("Embarcación", margin + 10, yPosition);
      pdf.text("Ventas", margin + 90, yPosition);
      pdf.text("Pasajes", margin + 115, yPosition);
      pdf.text("Recaudado", margin + 140, yPosition);
      pdf.setFont(undefined, "normal");
      yPosition += 10;

      porEmbarcacionFiltradas.forEach((embarcacion, index) => {
        checkPageBreak(8);

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, 170, 7, "F");
        }

        pdf.setTextColor(colors.text);
        pdf.setFontSize(9);
        pdf.text(`${index + 1}`, margin + 2, yPosition);
        pdf.text(
          embarcacion.nombreEmbarcacion.substring(0, 35),
          margin + 10,
          yPosition
        );
        pdf.text(embarcacion.totalVentas.toString(), margin + 90, yPosition);
        pdf.text(
          (embarcacion.totalPasajes || 0).toString(),
          margin + 115,
          yPosition
        );
        pdf.setTextColor(colors.success);
        pdf.setFont(undefined, "bold");
        pdf.text(
          `S/ ${embarcacion.totalRecaudado.toFixed(2)}`,
          margin + 140,
          yPosition
        );
        pdf.setFont(undefined, "normal");
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Detalle de Ventas
    if (reporte.ventasDetalladas && reporte.ventasDetalladas.length > 0) {
      // Agregar nueva página en orientación landscape para la tabla detallada
      pdf.addPage("a4", "landscape");
      yPosition = 20;

      pdf.setFontSize(14);
      pdf.setTextColor(colors.text);
      pdf.text(
        `Detalle de Ventas (${reporte.ventasDetalladas.length} ventas)`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Encabezado de tabla (usar ancho dinámico basado en el tamaño de la página)
      pdf.setFillColor(30, 64, 175);
      const tableWidth = getPageWidth() - margin * 2; // ancho dinámico
      pdf.rect(margin, yPosition - 5, tableWidth, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont(undefined, "bold");

      // Definir posiciones de columnas usando anchura dinámica
      const col = {
        num: margin + 2,
        fechaEmision: margin + 10,
        fechaViaje: margin + 34,
        numEmision: margin + 60,
        cliente: margin + 86,
        dni: margin + 120,
        contacto: margin + 142,
        embarcacion: margin + 162,
        ruta: margin + 190,
        metodoPago: margin + 220,
        estado: margin + 250,
        total: margin + tableWidth - 10,
      };

      pdf.text("N°", col.num, yPosition);
      pdf.text("F.Emisión", col.fechaEmision, yPosition);
      pdf.text("F/H.Viaje", col.fechaViaje, yPosition);
      pdf.text("N°Emisión", col.numEmision, yPosition);
      pdf.text("Cliente", col.cliente, yPosition);
      pdf.text("DNI", col.dni, yPosition);
      pdf.text("Contacto", col.contacto, yPosition);
      pdf.text("Embarcación", col.embarcacion, yPosition);
      pdf.text("Ruta", col.ruta, yPosition);
      pdf.text("M.Pago", col.metodoPago, yPosition);
      pdf.text("Estado", col.estado, yPosition);
      pdf.text("Total", col.total, yPosition);
      pdf.setFont(undefined, "normal");
      yPosition += 10;

      reporte.ventasDetalladas.forEach((venta, index) => {
        // Verificar si necesitamos una nueva página
        if (yPosition + 7 > getPageHeight() - 20) {
          pdf.addPage("a4", "landscape");
          yPosition = 20;
        }

        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(240, 244, 248);
          pdf.rect(margin, yPosition - 5, tableWidth, 7, "F");
        }

        // Determinar si es una venta anulada para usar color rojo
        const esAnulada =
          venta.estado === "ANULADA" || venta.estado === "REEMBOLSADA";
        const colorTexto = esAnulada ? colors.danger : colors.text;

        pdf.setTextColor(colorTexto);
        pdf.setFontSize(6);

        // Formatear fechas con zona horaria de Perú
        const fechaEmision = new Date(venta.fechaVenta).toLocaleString(
          "es-PE",
          {
            timeZone: "America/Lima",
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }
        );
        const fechaViaje = new Date(venta.fechaViaje).toLocaleDateString(
          "es-PE",
          {
            timeZone: "America/Lima",
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }
        );

        // Formatear método de pago (mostrar detalles si es híbrido)
        let metodoPagoTexto = String(venta.metodoPago || "").substring(0, 20);
        if (
          String(venta.tipoPago || "").toUpperCase() === "HIBRIDO" &&
          venta.metodosPago
        ) {
          try {
            const raw = venta.metodosPago;
            const metodos = Array.isArray(raw) ? raw : JSON.parse(String(raw));
            const partes = (metodos || []).map((m: unknown) => {
              if (!m) return "";
              if (typeof m === "string") return m as string;
              if (typeof m === "object" && m !== null) {
                const obj = m as Record<string, unknown>;
                return String(
                  obj.metodo || obj.metodoPago || obj.nombre || ""
                ).trim();
              }
              return String(m);
            });
            metodoPagoTexto =
              partes.filter(Boolean).join(" + ").substring(0, 40) || "HIBRIDO";
          } catch {
            metodoPagoTexto = "HIBRIDO";
          }
        }

        // Renderizar datos
        pdf.text(`${index + 1}`, col.num, yPosition);
        pdf.text(fechaEmision, col.fechaEmision, yPosition);
        pdf.text(`${fechaViaje} ${venta.horaViaje}`, col.fechaViaje, yPosition);
        pdf.text(venta.numeroVenta.substring(0, 8), col.numEmision, yPosition);
        pdf.text(venta.cliente.substring(0, 15), col.cliente, yPosition);
        pdf.text(venta.documentoIdentidad, col.dni, yPosition);
        pdf.text(venta.contacto.substring(0, 10), col.contacto, yPosition);
        pdf.text(
          venta.embarcacion.substring(0, 15),
          col.embarcacion,
          yPosition
        );
        pdf.text(venta.ruta.substring(0, 15), col.ruta, yPosition);
        pdf.text(metodoPagoTexto, col.metodoPago, yPosition);
        pdf.text(venta.estado.substring(0, 8), col.estado, yPosition);
        pdf.setTextColor(esAnulada ? colors.danger : colors.success);
        pdf.setFont(undefined, "bold");
        pdf.text(`S/ ${venta.total.toFixed(2)}`, col.total, yPosition);
        pdf.setFont(undefined, "normal");

        yPosition += 7;
      });

      // Calcular totales
      const totalGeneral = ventasEnRango.reduce((sum, venta) => {
        const vv = venta as Record<string, unknown>;
        return sum + (Number(vv.total as number | string) || 0);
      }, 0);
      const totalValido = totalRecaudadoConfirmadas; // ya calculado arriba a partir de ventasValidas

      // Agregar espacio antes de los totales
      yPosition += 10;

      // Verificar si necesitamos una nueva página para los totales
      if (yPosition + 20 > getPageHeight() - 20) {
        pdf.addPage("a4", "landscape");
        yPosition = 20;
      }

      // Renderizar totales con fondo destacado
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition - 5, tableWidth, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("TOTALES", margin + 5, yPosition);
      pdf.setFont(undefined, "normal");
      yPosition += 12;

      // Total general (confirmadas + anuladas)
      pdf.setFillColor(240, 244, 248);
      pdf.rect(margin, yPosition - 5, tableWidth, 8, "F");
      pdf.setTextColor(colors.text);
      pdf.setFontSize(9);
      pdf.text(
        "Total General (Confirmadas + Anuladas):",
        margin + 5,
        yPosition
      );
      pdf.setTextColor(colors.primary);
      pdf.setFont(undefined, "bold");
      pdf.text(
        `S/ ${totalGeneral.toFixed(2)}`,
        margin + tableWidth - 5,
        yPosition,
        { align: "right" }
      );
      pdf.setFont(undefined, "normal");
      yPosition += 10;

      // Total válido (solo confirmadas)
      pdf.setFillColor(240, 244, 248);
      pdf.rect(margin, yPosition - 5, tableWidth, 8, "F");
      pdf.setTextColor(colors.text);
      pdf.setFontSize(9);
      pdf.text("Total Válido (Solo Confirmadas):", margin + 5, yPosition);
      pdf.setTextColor(colors.success);
      pdf.setFont(undefined, "bold");
      pdf.text(
        `S/ ${totalValido.toFixed(2)}`,
        margin + tableWidth - 5,
        yPosition,
        { align: "right" }
      );
      pdf.setFont(undefined, "normal");
    }

    // Pie de página
    const pageCount = getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(colors.secondary);
      const pageWidth = getPageWidth();
      const pageHeight = getPageHeight();

      pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      pdf.text(
        `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
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
