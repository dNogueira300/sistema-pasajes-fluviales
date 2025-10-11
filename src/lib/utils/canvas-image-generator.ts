// src/lib/utils/canvas-image-generator.ts
import { formatearFechaViaje } from "./fecha-utils";
import type { Venta } from "@/types";

interface VentaExtendida extends Venta {
  precioUnitario?: number;
  subtotal?: number;
  impuestos?: number;
  horaEmbarque?: string;
  tipoPago?: "EFECTIVO" | "TARJETA" | "YAPE" | "PLIN" | "HIBRIDO";
  metodosPago?: MetodoPago[];
}

interface VentaConHoraEmbarque extends Venta {
  horaEmbarque?: string;
}

interface ClienteConNacionalidad {
  nacionalidad?: string;
}

interface MetodoPago {
  tipo: string;
  monto: number;
}

export async function generarComprobanteImagen(
  ventaInput: Venta
): Promise<Blob> {
  const ventaConHora = ventaInput as VentaConHoraEmbarque;

  const venta: VentaExtendida = {
    ...ventaInput,
    precioUnitario: ventaInput.total / ventaInput.cantidadPasajes,
    subtotal: ventaInput.total,
    impuestos: 0,
    horaEmbarque: ventaConHora.horaEmbarque || ventaInput.horaViaje,
  };

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
  const blueLight = "#dbeafe";

  let yPos = 0;

  // ============================================
  // HEADER CON GRADIENTE AZUL
  // ============================================

  // Crear gradiente azul
  const gradient = ctx.createLinearGradient(0, 0, 794, 0);
  gradient.addColorStop(0, primaryColor);
  gradient.addColorStop(1, primaryLight);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 794, 150);

  // Lado izquierdo del header
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";

  // Nombre empresa
  ctx.font = "bold 26px Arial";
  ctx.fillText("ALTO IMPACTO TRAVEL", 30, 40);

  // Subtítulo
  ctx.font = "bold 12px Arial";
  ctx.fillText("VENTA DE PASAJES FLUVIALES", 30, 60);

  // Cobertura
  ctx.font = "9px Arial";
  ctx.globalAlpha = 0.95;
  ctx.fillText("IQUITOS, YURIMAGUAS, PUCALLPA, SANTA ROSA, INTUTO,", 30, 78);
  ctx.fillText(
    "SAN LORENZO, TROMPETEROS, PANTOJA, REQUENA Y PUERTOS INTERMEDIOS",
    30,
    90
  );

  // Info empresa
  ctx.globalAlpha = 0.9;
  ctx.fillText(
    "Jr. Fitzcarrald 513 | altoimpactotravel@gmail.com | Cel: 960 527 195",
    30,
    108
  );
  ctx.fillText("IQUITOS - MAYNAS - LORETO", 30, 120);

  ctx.globalAlpha = 1.0;

  // Lado derecho - Recuadro de comprobante
  const boxX = 614; // 794 - 160 - 20 (margen)
  const boxY = 40;
  const boxWidth = 160;
  const boxHeight = 85;

  // Fondo blanco del recuadro
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();

  // Borde del recuadro
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
  ctx.stroke();

  // Texto dentro del recuadro
  ctx.fillStyle = primaryColor;
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("COMPROBANTE", boxX + boxWidth / 2, boxY + 25);
  ctx.fillText("DE VENTA", boxX + boxWidth / 2, boxY + 40);

  // Número de venta
  ctx.fillStyle = redColor;
  ctx.font = "bold 14px Arial";
  ctx.fillText(`N° ${venta.numeroVenta}`, boxX + boxWidth / 2, boxY + 65);

  yPos = 150;

  // ============================================
  // LÍNEA DIVISORIA
  // ============================================
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, yPos, 794, 2);
  yPos += 2;

  // ============================================
  // FECHA DE EMISIÓN
  // ============================================
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

  yPos += 40;

  // ============================================
  // DATOS DEL CLIENTE
  // ============================================
  yPos += 20;
  ctx.textAlign = "left";

  // Título sección
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = primaryColor;
  ctx.fillText("DATOS DEL CLIENTE", 30, yPos);
  yPos += 3;

  // Línea debajo del título
  ctx.strokeStyle = lightBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, yPos);
  ctx.lineTo(764, yPos);
  ctx.stroke();
  yPos += 15;

  // Datos del cliente
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
  drawInfoRow(ctx, "Ruta:", venta.ruta.nombre, 30, yPos, grayText, darkText);
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
    "Fecha:",
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
  // DOS COLUMNAS: DATOS DE LA VENTA Y RESUMEN DE PAGO
  // ============================================
  yPos += 15;

  const colWidth = 362; // (794 - 60 - 20) / 2
  const col1X = 30;
  const col2X = 402;
  const colHeight = 230; // Aumentado de 200 a 230 para dar más espacio
  const colStartY = yPos;

  // COLUMNA 1: DATOS DE LA VENTA
  // Header azul
  ctx.fillStyle = primaryColor;
  roundRectTop(ctx, col1X, colStartY, colWidth, 30, 8);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("DATOS DE LA VENTA", col1X + colWidth / 2, colStartY + 20);

  // Borde de la columna
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, col1X, colStartY, colWidth, colHeight, 8);
  ctx.stroke();

  // Contenido columna 1
  ctx.textAlign = "left";
  ctx.font = "10px Arial";
  let col1Y = colStartY + 50;

  drawInfoRow(
    ctx,
    "Cantidad:",
    `${venta.cantidadPasajes} pasaje(s)`,
    col1X + 15,
    col1Y,
    grayText,
    darkText
  );
  col1Y += 20;

  drawInfoRow(
    ctx,
    "Vendedor:",
    `${venta.vendedor.nombre} ${venta.vendedor.apellido}`,
    col1X + 15,
    col1Y,
    grayText,
    darkText
  );
  col1Y += 20;

  // Estado con badge
  ctx.fillStyle = grayText;
  ctx.fillText("Estado:", col1X + 15, col1Y);

  const estadoBgColor = venta.estado === "CONFIRMADA" ? "#d1fae5" : "#fee2e2";
  const estadoTextColor = venta.estado === "CONFIRMADA" ? "#065f46" : "#991b1b";
  const estadoBorderColor =
    venta.estado === "CONFIRMADA" ? "#059669" : redColor;

  // Badge del estado
  const badgeX = col1X + 15 + ctx.measureText("Estado:").width + 5;
  const badgeY = col1Y - 12;
  const badgeWidth = 90;
  const badgeHeight = 18;

  ctx.fillStyle = estadoBgColor;
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 12);
  ctx.fill();

  ctx.strokeStyle = estadoBorderColor;
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 12);
  ctx.stroke();

  ctx.fillStyle = estadoTextColor;
  ctx.font = "bold 9px Arial";
  ctx.textAlign = "center";
  ctx.fillText(venta.estado, badgeX + badgeWidth / 2, badgeY + 13);

  // COLUMNA 2: RESUMEN DE PAGO
  // Header azul
  ctx.fillStyle = primaryColor;
  roundRectTop(ctx, col2X, colStartY, colWidth, 30, 8);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("RESUMEN DE PAGO", col2X + colWidth / 2, colStartY + 20);

  // Borde de la columna
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, col2X, colStartY, colWidth, colHeight, 8);
  ctx.stroke();

  // Contenido columna 2 (fondo blanco)
  ctx.textAlign = "left";
  ctx.font = "10px Arial";
  let col2Y = colStartY + 50;

  // Precio unitario
  ctx.fillStyle = darkText;
  ctx.fillText("Precio unitario", col2X + 15, col2Y);
  ctx.textAlign = "right";
  ctx.fillText(
    `S/. ${venta.precioUnitario!.toFixed(2)}`,
    col2X + colWidth - 15,
    col2Y
  );
  col2Y += 18;

  // Subtotal
  ctx.textAlign = "left";
  ctx.fillText("Subtotal:", col2X + 15, col2Y);
  ctx.textAlign = "right";
  ctx.fillText(
    `S/. ${venta.subtotal!.toFixed(2)}`,
    col2X + colWidth - 15,
    col2Y
  );
  col2Y += 18;

  // Impuestos
  ctx.textAlign = "left";
  ctx.fillText("Impuestos:", col2X + 15, col2Y);
  ctx.textAlign = "right";
  ctx.fillText(
    `S/. ${venta.impuestos!.toFixed(2)}`,
    col2X + colWidth - 15,
    col2Y
  );
  col2Y += 15;

  // Separador
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(col2X + 15, col2Y);
  ctx.lineTo(col2X + colWidth - 15, col2Y);
  ctx.stroke();
  col2Y += 15;

  // Caja del total
  const totalBoxX = col2X + 15;
  const totalBoxY = col2Y - 5;
  const totalBoxWidth = colWidth - 30;
  const totalBoxHeight = 30;

  ctx.fillStyle = blueLight;
  roundRect(ctx, totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 6);
  ctx.fill();

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 6);
  ctx.stroke();

  ctx.fillStyle = primaryColor;
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL PAGADO", totalBoxX + 10, totalBoxY + 20);
  ctx.textAlign = "right";
  ctx.fillText(
    `S/. ${venta.total.toFixed(2)}`,
    totalBoxX + totalBoxWidth - 10,
    totalBoxY + 20
  );

  col2Y += 40;

  // Métodos de pago
  ctx.textAlign = "left";
  ctx.fillStyle = grayText;
  ctx.font = "bold 10px Arial";
  ctx.fillText("Método(s) de pago:", col2X + 15, col2Y);
  col2Y += 15;

  // Mostrar métodos de pago
  const metodosPago = venta.metodosPago;

  if (venta.tipoPago === "HIBRIDO" && metodosPago && metodosPago.length > 0) {
    metodosPago.forEach((metodo) => {
      const metodoBadgeX = col2X + 15;
      const metodoBadgeY = col2Y - 12;
      const metodoBadgeWidth = 110;
      const metodoBadgeHeight = 20;

      ctx.fillStyle = "#e0f2fe";
      roundRect(
        ctx,
        metodoBadgeX,
        metodoBadgeY,
        metodoBadgeWidth,
        metodoBadgeHeight,
        6
      );
      ctx.fill();

      ctx.fillStyle = darkText;
      ctx.font = "9px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        `${metodo.tipo}: S/ ${metodo.monto.toFixed(2)}`,
        metodoBadgeX + 10,
        metodoBadgeY + 14
      );

      col2Y += 25;
    });
  } else {
    const metodoBadgeX = col2X + 15;
    const metodoBadgeY = col2Y - 12;
    const metodoBadgeWidth = 100;
    const metodoBadgeHeight = 20;

    ctx.fillStyle = "#e0f2fe";
    roundRect(
      ctx,
      metodoBadgeX,
      metodoBadgeY,
      metodoBadgeWidth,
      metodoBadgeHeight,
      6
    );
    ctx.fill();

    ctx.fillStyle = darkText;
    ctx.font = "9px Arial";
    ctx.textAlign = "left";
    ctx.fillText(venta.metodoPago, metodoBadgeX + 10, metodoBadgeY + 14);
  }

  yPos = colStartY + colHeight + 20;

  // ============================================
  // TÉRMINOS Y CONDICIONES
  // ============================================
  const terminosBoxX = 30;
  const terminosBoxY = yPos;
  const terminosBoxWidth = 734;
  const terminosBoxHeight = 100;

  // Fondo gris claro
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

  // Borde
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

  // Título
  ctx.fillStyle = primaryColor;
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "left";
  ctx.fillText("TÉRMINOS Y CONDICIONES:", terminosBoxX + 15, terminosBoxY + 20);

  // Lista de términos
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

  yPos = terminosBoxY + terminosBoxHeight + 20;

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
