// lib/utils/comprobante-utils.ts
import jsPDF from "jspdf";
import { formatearFechaViaje } from "./fecha-utils";
import { getConfiguracionEmpresa } from "@/lib/actions/configuracion";

export interface MetodoPago {
  tipo: string;
  monto: number;
}

interface VentaComprobante {
  id: string;
  numeroVenta: string;
  fechaVenta: string;
  fechaViaje: string;
  horaViaje: string;
  horaEmbarque: string;
  cantidadPasajes: number;
  precioUnitario: number;
  subtotal: number;
  impuestos: number;
  total: number;
  tipoPago: "EFECTIVO" | "TARJETA" | "YAPE" | "PLIN" | "HIBRIDO";
  metodoPago: string;
  metodosPago?: MetodoPago[];
  estado: "CONFIRMADA" | "ANULADA" | "REEMBOLSADA";
  observaciones?: string;
  cliente: {
    nombre: string;
    apellido: string;
    dni: string;
    telefono?: string;
    email?: string;
    nacionalidad: string;
  };
  ruta: {
    nombre: string;
    puertoOrigen: string;
    puertoDestino: string;
  };
  embarcacion: {
    nombre: string;
  };
  puertoEmbarque: {
    nombre: string;
    direccion?: string;
    descripcion?: string;
  };
  vendedor: {
    nombre: string;
    apellido: string;
  };
}

// ⚡ FUNCIÓN OPTIMIZADA CON jsPDF
export async function generarComprobanteA4(
  venta: VentaComprobante
): Promise<Buffer> {
  const empresa = await getConfiguracionEmpresa();

  // Crear documento PDF
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
  doc.rect(0, 0, pageWidth, 45, "F");

  // Logo/Nombre empresa (izquierda)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(empresa.nombre.toUpperCase(), margin, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("VENTA DE PASAJES FLUVIALES", margin, 22);

  doc.setFontSize(7);
  doc.text("IQUITOS, YURIMAGUAS, PUCALLPA, SANTA ROSA, INTUTO,", margin, 27);
  doc.text("SAN LORENZO, TROMPETEROS, PANTOJA, REQUENA", margin, 30);

  doc.setFontSize(8);
  doc.text(`${empresa.direccion} | ${empresa.telefono}`, margin, 37);
  doc.text(`${empresa.email} | IQUITOS - LORETO`, margin, 41);

  // ✅ FIX: Recuadro comprobante con el número correcto de argumentos
  const boxX = pageWidth - 60;
  const boxY = 8;
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.setFillColor(255, 255, 255);
  // roundedRect(x, y, width, height, radiusX, radiusY, style)
  doc.roundedRect(boxX, boxY, 45, 28, 2, 2, "FD");

  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROBANTE", boxX + 22.5, boxY + 7, { align: "center" });
  doc.text("DE VENTA", boxX + 22.5, boxY + 12, { align: "center" });

  doc.setTextColor(220, 38, 38); // Rojo
  doc.setFontSize(12);
  doc.text(`N° ${venta.numeroVenta}`, boxX + 22.5, boxY + 22, {
    align: "center",
  });

  yPos = 45;

  // ============================================
  // FECHA DE EMISIÓN
  // ============================================
  const fechaEmision = new Date(venta.fechaVenta).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  doc.setFillColor(249, 250, 251);
  doc.rect(0, yPos, pageWidth, 10, "F");
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`FECHA DE EMISIÓN: ${fechaEmision}`, pageWidth / 2, yPos + 6, {
    align: "center",
  });

  yPos += 15;

  // ============================================
  // DATOS DEL CLIENTE
  // ============================================
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", margin, yPos);

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);

  yPos += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Nombre: ${venta.cliente.nombre} ${venta.cliente.apellido}`,
    margin,
    yPos
  );
  yPos += 5;
  doc.text(`DNI: ${venta.cliente.dni}`, margin, yPos);
  yPos += 5;
  doc.text(`Nacionalidad: ${venta.cliente.nacionalidad}`, margin, yPos);
  if (venta.cliente.telefono) {
    yPos += 5;
    doc.text(`Teléfono: ${venta.cliente.telefono}`, margin, yPos);
  }

  yPos += 10;

  // ============================================
  // DATOS DEL VIAJE
  // ============================================
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL VIAJE", margin, yPos);

  doc.setDrawColor(209, 213, 219);
  doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);

  yPos += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text(`Ruta: ${venta.puertoOrigen} - ${venta.puertoDestino}`, margin, yPos);
  yPos += 5;
  doc.text(`Embarcación: ${venta.embarcacion.nombre}`, margin, yPos);
  yPos += 5;
  doc.text(
    `Fecha de viaje: ${formatearFechaViaje(venta.fechaViaje)}`,
    margin,
    yPos
  );
  yPos += 5;
  doc.text(`Hora de embarque: ${venta.horaEmbarque}`, margin, yPos);
  yPos += 5;
  doc.text(`Hora de viaje: ${venta.horaViaje}`, margin, yPos);
  yPos += 5;
  doc.text(`Puerto de embarque: ${venta.puertoEmbarque.nombre}`, margin, yPos);

  yPos += 10;

  // ============================================
  // RESUMEN DE PAGO (RECUADRO DINÁMICO)
  // ============================================

  // Calcular altura dinámica del recuadro
  let alturaRecuadro = 45; // Altura base
  if (venta.tipoPago === "HIBRIDO" && venta.metodosPago) {
    alturaRecuadro += venta.metodosPago.length * 4; // +4mm por cada método
  }

  const recuadroStartY = yPos;

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.roundedRect(
    margin,
    yPos,
    pageWidth - 2 * margin,
    alturaRecuadro,
    2,
    2,
    "S"
  );

  // Header del recuadro
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN DE PAGO", pageWidth / 2, yPos + 5, { align: "center" });

  yPos += 12;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text("Cantidad:", margin + 5, yPos);
  doc.text(`${venta.cantidadPasajes} pasaje(s)`, pageWidth - margin - 5, yPos, {
    align: "right",
  });
  yPos += 5;

  doc.text("Precio unitario:", margin + 5, yPos);
  doc.text(
    `S/. ${venta.precioUnitario.toFixed(2)}`,
    pageWidth - margin - 5,
    yPos,
    { align: "right" }
  );
  yPos += 5;

  doc.text("Subtotal:", margin + 5, yPos);
  doc.text(`S/. ${venta.subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, {
    align: "right",
  });
  yPos += 5;

  doc.text("Impuestos:", margin + 5, yPos);
  doc.text(`S/. ${venta.impuestos.toFixed(2)}`, pageWidth - margin - 5, yPos, {
    align: "right",
  });
  yPos += 6;

  // Línea separadora
  doc.setDrawColor(30, 64, 175);
  doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
  yPos += 4;

  // Total
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("TOTAL PAGADO:", margin + 5, yPos);
  doc.text(`S/. ${venta.total.toFixed(2)}`, pageWidth - margin - 5, yPos, {
    align: "right",
  });

  yPos += 6;

  // Métodos de pago (DENTRO del recuadro)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Método(s) de pago:", margin + 5, yPos);
  yPos += 4;

  doc.setFont("helvetica", "normal");
  if (venta.tipoPago === "HIBRIDO" && venta.metodosPago) {
    venta.metodosPago.forEach((metodo) => {
      doc.text(
        `• ${metodo.tipo}: S/. ${metodo.monto.toFixed(2)}`,
        margin + 7,
        yPos
      );
      yPos += 4;
    });
  } else {
    doc.text(`• ${venta.metodoPago}`, margin + 7, yPos);
    yPos += 4;
  }

  // Ajustar yPos al final del recuadro
  yPos = recuadroStartY + alturaRecuadro + 5;

  // ============================================
  // INFORMACIÓN ADICIONAL (Vendedor y Estado)
  // ============================================
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, "S");

  // Header
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMACIÓN DE LA VENTA", pageWidth / 2, yPos + 5, {
    align: "center",
  });

  yPos += 12;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Vendedor
  doc.text("Vendedor:", margin + 5, yPos);
  doc.text(
    `${venta.vendedor.nombre} ${venta.vendedor.apellido}`,
    pageWidth - margin - 5,
    yPos,
    { align: "right" }
  );

  yPos += 5;

  // Estado en texto simple con color
  doc.text("Estado:", margin + 5, yPos);

  // Aplicar color según el estado
  if (venta.estado === "CONFIRMADA") {
    doc.setTextColor(6, 95, 70); // Verde oscuro
  } else if (venta.estado === "ANULADA") {
    doc.setTextColor(153, 27, 27); // Rojo oscuro
  } else if (venta.estado === "REEMBOLSADA") {
    doc.setTextColor(194, 65, 12); // Naranja oscuro
  }

  doc.setFont("helvetica", "bold");
  doc.text(venta.estado, pageWidth - margin - 5, yPos, { align: "right" });

  yPos += 8;

  // ============================================
  // TÉRMINOS Y CONDICIONES
  // ============================================
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  // ✅ FIX: roundedRect con estilo 'FD' (Fill and Draw)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 2, 2, "FD");

  doc.setTextColor(30, 64, 175);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TÉRMINOS Y CONDICIONES:", margin + 3, yPos + 5);

  yPos += 9;
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  const terminos = [
    "No se aceptan devoluciones una vez realizada la venta.",
    "Si la embarcación partió y Ud. no abordó, perderá su derecho.",
    "Equipaje permitido: 15Kg por pasajero.",
    "Este ticket puede ser cambiado por Boleta o Factura.",
  ];

  terminos.forEach((termino) => {
    doc.text(`• ${termino}`, margin + 5, yPos);
    yPos += 4;
  });

  // ============================================
  // FOOTER
  // ============================================
  const footerY = pageHeight - 15;
  doc.setFillColor(30, 64, 175);
  doc.rect(0, footerY, pageWidth, 15, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${empresa.nombre.toUpperCase()} | ${empresa.direccion} | ${
      empresa.telefono
    }`,
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  const fechaImpresion = new Date().toLocaleString("es-PE", {
    timeZone: "America/Lima",
  });
  doc.setFontSize(7);
  doc.text(
    `Impreso: ${fechaImpresion} | IQUITOS - LORETO`,
    pageWidth / 2,
    footerY + 10,
    { align: "center" }
  );

  // Convertir a buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
