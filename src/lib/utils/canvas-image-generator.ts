// src/lib/utils/canvas-image-generator.ts
import { formatearFechaViaje } from "./fecha-utils";
import type { Venta } from "@/types";

interface ClienteConNacionalidad {
  nacionalidad?: string;
}

export async function generarComprobanteImagen(
  ventaInput: Venta
): Promise<Blob> {
  const venta = ventaInput;

  // Crear canvas con tamaño A4 (794x1123 px a 96 DPI)
  const canvas = document.createElement("canvas");
  const scale = 2; // Para mayor calidad
  canvas.width = 794 * scale;
  canvas.height = 1123 * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Fondo blanco
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 794, 1123);

  // Colores del diseño
  const primaryColor = "#1e40af";
  const primaryLight = "#3b82f6";
  const redColor = "#dc2626";
  const grayText = "#6b7280";
  const darkText = "#1f2937";
  const lightBorder = "#d1d5db";
  const lightBg = "#f9fafb";

  let yPos = 0;

  // ============================================
  // HEADER CON GRADIENTE AZUL
  // ============================================
  const gradient = ctx.createLinearGradient(0, 0, 794, 0);
  gradient.addColorStop(0, primaryColor);
  gradient.addColorStop(1, primaryLight);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 794, 150);

  // Lado izquierdo del header
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";

  ctx.font = "bold 26px Arial";
  ctx.fillText("ALTO IMPACTO TRAVEL", 30, 40);

  ctx.font = "bold 12px Arial";
  ctx.fillText("VENTA DE PASAJES FLUVIALES", 30, 60);

  ctx.font = "9px Arial";
  ctx.globalAlpha = 0.95;
  ctx.fillText("IQUITOS, YURIMAGUAS, PUCALLPA, SANTA ROSA, INTUTO,", 30, 78);
  ctx.fillText("SAN LORENZO, TROMPETEROS, PANTOJA, REQUENA", 30, 90);

  ctx.globalAlpha = 0.9;
  ctx.fillText(
    "Jr. Fitzcarrald 513 | altoimpactotravel@gmail.com | Cel: 960 527 195",
    30,
    108
  );
  ctx.fillText("IQUITOS - MAYNAS - LORETO", 30, 120);
  ctx.globalAlpha = 1.0;

  // Lado derecho - Recuadro de comprobante
  const boxX = 614;
  const boxY = 40;
  const boxWidth = 160;
  const boxHeight = 85;

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
  ctx.stroke();

  ctx.fillStyle = primaryColor;
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("COMPROBANTE", boxX + boxWidth / 2, boxY + 25);
  ctx.fillText("DE VENTA", boxX + boxWidth / 2, boxY + 40);

  ctx.fillStyle = redColor;
  ctx.font = "bold 14px Arial";
  ctx.fillText(`N° ${venta.numeroVenta}`, boxX + boxWidth / 2, boxY + 65);

  // ============================================
  // FECHA DE EMISIÓN (PEGADA AL HEADER)
  // ============================================
  yPos = 150; // Pegado al header

  ctx.fillStyle = lightBg;
  ctx.fillRect(0, yPos, 794, 40);

  const fechaEmision = new Date(venta.fechaVenta).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  ctx.fillStyle = darkText;
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`FECHA DE EMISIÓN: ${fechaEmision}`, 397, yPos + 25);

  yPos += 55;

  // ============================================
  // DATOS DEL CLIENTE
  // ============================================
  ctx.textAlign = "left";
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = primaryColor;
  ctx.fillText("DATOS DEL CLIENTE", 30, yPos);
  yPos += 3;

  ctx.strokeStyle = lightBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, yPos);
  ctx.lineTo(764, yPos);
  ctx.stroke();
  yPos += 15;

  ctx.font = "10px Arial";
  drawInfoRow(
    ctx,
    "Nombre:",
    `${venta.cliente.nombre} ${venta.cliente.apellido}`,
    30,
    yPos,
    grayText,
    darkText
  );
  yPos += 15;

  drawInfoRow(ctx, "DNI:", venta.cliente.dni, 30, yPos, grayText, darkText);
  yPos += 15;

  const clienteConNacionalidad = venta.cliente as typeof venta.cliente &
    ClienteConNacionalidad;
  const nacionalidad = clienteConNacionalidad.nacionalidad || "Peruana";
  drawInfoRow(ctx, "Nacionalidad:", nacionalidad, 30, yPos, grayText, darkText);
  yPos += 15;

  if (venta.cliente.telefono) {
    drawInfoRow(
      ctx,
      "Teléfono:",
      venta.cliente.telefono,
      30,
      yPos,
      grayText,
      darkText
    );
    yPos += 15;
  }

  // ============================================
  // DATOS DEL VIAJE
  // ============================================
  yPos += 15;
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = primaryColor;
  ctx.fillText("DATOS DEL VIAJE", 30, yPos);
  yPos += 3;

  ctx.strokeStyle = lightBorder;
  ctx.beginPath();
  ctx.moveTo(30, yPos);
  ctx.lineTo(764, yPos);
  ctx.stroke();
  yPos += 15;

  ctx.font = "10px Arial";
  drawInfoRow(ctx, "Ruta:", `${venta.puertoOrigen} - ${venta.puertoDestino}`, 30, yPos, grayText, darkText);
  yPos += 15;

  drawInfoRow(
    ctx,
    "Embarcación:",
    venta.embarcacion.nombre,
    30,
    yPos,
    grayText,
    darkText
  );
  yPos += 15;

  drawInfoRow(
    ctx,
    "Fecha de viaje:",
    formatearFechaViaje(venta.fechaViaje),
    30,
    yPos,
    grayText,
    darkText
  );
  yPos += 15;

  drawInfoRow(
    ctx,
    "Hora de embarque:",
    venta.horaEmbarque || venta.horaViaje,
    30,
    yPos,
    grayText,
    darkText
  );
  yPos += 15;

  drawInfoRow(
    ctx,
    "Hora de viaje:",
    venta.horaViaje,
    30,
    yPos,
    grayText,
    darkText
  );
  yPos += 15;

  drawInfoRow(
    ctx,
    "Puerto de embarque:",
    venta.puertoEmbarque.nombre,
    30,
    yPos,
    grayText,
    darkText
  );
  yPos += 15;

  if (venta.puertoEmbarque.direccion) {
    drawInfoRow(
      ctx,
      "Dirección del puerto:",
      venta.puertoEmbarque.direccion,
      30,
      yPos,
      grayText,
      darkText
    );
    yPos += 15;
  }

  // ============================================
  // RESUMEN DE PAGO (CON ALTURA DINÁMICA)
  // ============================================
  yPos += 15;

  // Calcular altura dinámica
  let alturaResumen = 180; // Altura base
  const metodosPago = venta.metodosPago;
  if (venta.tipoPago === "HIBRIDO" && metodosPago && metodosPago.length > 0) {
    alturaResumen += metodosPago.length * 25;
  }

  const resumenStartY = yPos;

  // Borde del recuadro
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, 30, yPos, 734, alturaResumen, 8);
  ctx.stroke();

  // Header azul
  ctx.fillStyle = primaryColor;
  roundRectTop(ctx, 30, yPos, 734, 30, 8);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("RESUMEN DE PAGO", 397, yPos + 20);

  yPos += 45;
  ctx.textAlign = "left";
  ctx.font = "10px Arial";

  // Cantidad
  ctx.fillStyle = darkText;
  ctx.fillText("Cantidad:", 45, yPos);
  ctx.textAlign = "right";
  ctx.fillText(`${venta.cantidadPasajes} pasaje(s)`, 749, yPos);
  yPos += 18;

  // Precio unitario
  ctx.textAlign = "left";
  ctx.fillText("Precio unitario:", 45, yPos);
  ctx.textAlign = "right";
  ctx.fillText(`S/. ${parseFloat(venta.precioUnitario!.toString()).toFixed(2)}`, 749, yPos);
  yPos += 18;

  // Subtotal
  ctx.textAlign = "left";
  ctx.fillText("Subtotal:", 45, yPos);
  ctx.textAlign = "right";
  ctx.fillText(`S/. ${parseFloat(venta.subtotal!.toString()).toFixed(2)}`, 749, yPos);
  yPos += 18;

  // Impuestos
  ctx.textAlign = "left";
  ctx.fillText("Impuestos:", 45, yPos);
  ctx.textAlign = "right";
  ctx.fillText(`S/. ${parseFloat(venta.impuestos!.toString()).toFixed(2)}`, 749, yPos);
  yPos += 15;

  // Separador
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(45, yPos);
  ctx.lineTo(749, yPos);
  ctx.stroke();
  yPos += 15;

  // Total
  ctx.fillStyle = primaryColor;
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL PAGADO:", 45, yPos);
  ctx.textAlign = "right";
  ctx.fillText(`S/. ${parseFloat(venta.total.toString()).toFixed(2)}`, 749, yPos);
  yPos += 18;

  // Métodos de pago (DENTRO del recuadro)
  ctx.textAlign = "left";
  ctx.fillStyle = darkText;
  ctx.font = "bold 10px Arial";
  ctx.fillText("Método(s) de pago:", 45, yPos);
  yPos += 15;

  ctx.font = "9px Arial";
  if (venta.tipoPago === "HIBRIDO" && metodosPago && metodosPago.length > 0) {
    metodosPago.forEach((metodo) => {
      ctx.fillText(
        `• ${metodo.tipo}: S/. ${parseFloat(metodo.monto.toString()).toFixed(2)}`,
        50,
        yPos
      );
      yPos += 15;
    });
  } else {
    ctx.fillText(`• ${venta.metodoPago}`, 50, yPos);
    yPos += 15;
  }

  yPos = resumenStartY + alturaResumen + 15;

  // ============================================
  // INFORMACIÓN DE LA VENTA (Vendedor y Estado)
  // ============================================
  const infoHeight = 68;

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, 30, yPos, 734, infoHeight, 8);
  ctx.stroke();

  // Header azul
  ctx.fillStyle = primaryColor;
  roundRectTop(ctx, 30, yPos, 734, 30, 8);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("INFORMACIÓN DE LA VENTA", 397, yPos + 20);

  yPos += 45;
  ctx.textAlign = "left";
  ctx.font = "10px Arial";
  ctx.fillStyle = darkText;

  // Vendedor
  ctx.fillText("Vendedor:", 45, yPos);
  ctx.textAlign = "right";
  ctx.fillText(
    `${venta.vendedor.nombre} ${venta.vendedor.apellido}`,
    749,
    yPos
  );
  yPos += 18;

  // Estado (texto simple con color)
  ctx.textAlign = "left";
  ctx.fillText("Estado:", 45, yPos);

  // Color según estado
  if (venta.estado === "CONFIRMADA") {
    ctx.fillStyle = "#065f46"; // Verde
  } else if (venta.estado === "ANULADA") {
    ctx.fillStyle = "#991b1b"; // Rojo
  } else if (venta.estado === "REEMBOLSADA") {
    ctx.fillStyle = "#c2410c"; // Naranja
  }

  ctx.textAlign = "right";
  ctx.font = "bold 10px Arial";
  ctx.fillText(venta.estado, 749, yPos);

  yPos += 25;

  // ============================================
  // TÉRMINOS Y CONDICIONES
  // ============================================
  const terminosBoxX = 30;
  const terminosBoxY = yPos;
  const terminosBoxWidth = 734;
  const terminosBoxHeight = 100;

  ctx.fillStyle = lightBg;
  roundRect(
    ctx,
    terminosBoxX,
    terminosBoxY,
    terminosBoxWidth,
    terminosBoxHeight,
    8
  );
  ctx.fill();

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  roundRect(
    ctx,
    terminosBoxX,
    terminosBoxY,
    terminosBoxWidth,
    terminosBoxHeight,
    8
  );
  ctx.stroke();

  ctx.fillStyle = primaryColor;
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "left";
  ctx.fillText("TÉRMINOS Y CONDICIONES:", terminosBoxX + 15, terminosBoxY + 20);

  ctx.fillStyle = grayText;
  ctx.font = "8px Arial";
  let terminosY = terminosBoxY + 35;

  const terminos = [
    "• No se aceptan devoluciones una vez realizada la venta y separado el cupo.",
    "• Si la embarcación partió y Ud. no abordó, perderá su derecho a viajar y el valor del pasaje.",
    "• Equipaje permitido: 15Kg por pasajero.",
    "• Este ticket puede ser cambiado por Boleta de Venta o Factura.",
  ];

  terminos.forEach((termino) => {
    ctx.fillText(termino, terminosBoxX + 15, terminosY);
    terminosY += 14;
  });

  // ============================================
  // FOOTER
  // ============================================
  const footerHeight = 50;
  const footerY = 1123 - footerHeight;

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, footerY, 794, footerHeight);

  const fechaImpresion = new Date().toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "9px Arial";
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.95;
  ctx.fillText(
    "ALTO IMPACTO TRAVEL | Jr. Fitzcarrald 513 | 960 527 195 | altoimpactotravel@gmail.com",
    397,
    footerY + 20
  );

  ctx.globalAlpha = 0.85;
  ctx.font = "8px Arial";
  ctx.fillText(
    `Impreso: ${fechaImpresion} | IQUITOS - MAYNAS - LORETO`,
    397,
    footerY + 35
  );

  ctx.globalAlpha = 1.0;

  // Convertir canvas a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Error generando imagen"));
        }
      },
      "image/png",
      1.0
    );
  });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function drawInfoRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  labelColor: string,
  valueColor: string
) {
  ctx.fillStyle = labelColor;
  ctx.fillText(label, x, y);

  const labelWidth = ctx.measureText(label).width;
  ctx.fillStyle = valueColor;
  ctx.font = "bold 10px Arial";
  ctx.fillText(value, x + labelWidth + 5, y);
  ctx.font = "10px Arial";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function roundRectTop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
