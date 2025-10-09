// lib/utils/comprobante-utils.ts
import puppeteer from "puppeteer";
import { formatearFechaViaje } from "./fecha-utils";
import { getLogoBase64 } from "@/lib/utils/logo-utils";
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
  estado: "CONFIRMADA" | "ANULADA";
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

export async function generarComprobanteA4(
  venta: VentaComprobante
): Promise<Buffer> {
  // Obtener configuración de la empresa
  const empresa = await getConfiguracionEmpresa();

  const html = generarHTMLComprobante(venta, empresa);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export function generarHTMLComprobante(
  venta: VentaComprobante,
  empresa: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string;
    horario: string;
    logoUrl: string;
  }
): string {
  const fechaEmision = new Date(venta.fechaVenta).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const logoBase64 = getLogoBase64();

  const metodosPagoHTML =
    venta.tipoPago === "HIBRIDO" && venta.metodosPago
      ? venta.metodosPago
          .map(
            (metodo: MetodoPago) =>
              `<div class="metodo-pago">
          <span>${metodo.tipo}: S/ ${metodo.monto.toFixed(2)}</span>
        </div>`
          )
          .join("")
      : `<div class="metodo-pago"><span>${venta.metodoPago}</span></div>`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprobante de Venta - ${venta.numeroVenta}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 10px;
          line-height: 1.3;
          color: #333;
          background: #fff;
        }
        
        .comprobante {
          max-width: 21cm;
          margin: 0 auto;
          padding: 15px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-content {
          flex: 1;
          text-align: center;
        }
        
        .logo-container {
          width: 100px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        .empresa {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .empresa-subtitulo {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .empresa-cobertura {
          font-size: 10px;
          color: #333;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .empresa-info {
          font-size: 10px;
          color: #333;
          margin-bottom: 3px;
        }
        
        .comprobante-titulo {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
          margin: 10px 0;
        }
        
        .numero-venta {
          font-size: 14px;
          font-weight: bold;
          color: #dc2626;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-section {
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        
        .info-section h3 {
          font-size: 12px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 8px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10px;
        }
        
        .label {
          font-weight: 600;
          color: #475569;
        }
        
        .value {
          color: #1f2937;
          text-align: right;
        }
        
        .detalles-viaje {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .detalles-columna {
          flex: 1;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 10px;
        }
        
        .resumen-pago {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 15px;
        }
        
        .pago-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10px;
        }
        
        .pago-total {
          border-top: 1px solid #0ea5e9;
          padding-top: 5px;
          margin-top: 5px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .metodo-pago {
          background: #e0f2fe;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 3px;
          font-size: 10px;
        }
        
        .observaciones {
          background: #fefce8;
          border: 1px solid #eab308;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        .footer {
          border-top: 1px solid #d1d5db;
          padding-top: 10px;
          text-align: center;
          font-size: 9px;
          color: #6b7280;
        }
        
        .estado {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .estado.confirmada {
          background: #d1fae5;
          color: #065f46;
        }
        
        .estado.anulada {
          background: #fee2e2;
          color: #991b1b;
        }
        
        @media print {
          body { margin: 0; }
          .comprobante { box-shadow: none; }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="comprobante">
        <!-- Header -->
        <div class="header">
          <div class="logo-container">
            <img src="${logoBase64}" 
                 alt="Logo ${empresa.nombre}" 
                 class="logo" />
          </div>
          <div class="header-content">
            <div class="empresa">${empresa.nombre}</div>
            <div class="empresa-subtitulo">VENTA DE PASAJES FLUVIALES</div>
            <div class="empresa-cobertura">IQUITOS, YURIMAGUAS, PUCALLPA, SANTA ROSA, INTUTO, SAN LORENZO, 
            TROMPETEROS, PANTOJA, REQUENA, Y PUERTOS INTERMEDIOS</div>
            <div class="empresa-info">Dirección: ${empresa.direccion}</div>
            <div class="empresa-info">Correo: ${empresa.email}</div>
            <div class="empresa-info">Celular: ${
              empresa.telefono
            }</div>            
            <div class="empresa-info">IQUITOS - MAYNAS - LORETO</div>
          </div>
          <div style="width: 80px;"></div> <!-- Espacio para balance visual -->
        </div>

        <div class="comprobante-titulo">COMPROBANTE DE VENTA N° ${
          venta.numeroVenta
        }</div>

        <!-- Información del cliente y venta -->
        <div class="info-grid">
          <div class="info-section">
            <h3>Datos del Cliente</h3>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${venta.cliente.nombre} ${
    venta.cliente.apellido
  }</span>
            </div>
            <div class="info-row">
              <span class="label">DNI:</span>
              <span class="value">${venta.cliente.dni}</span>
            </div>
            <div class="info-row">
              <span class="label">Nacionalidad:</span>
              <span class="value">${venta.cliente.nacionalidad}</span>
            </div>
            ${
              venta.cliente.telefono
                ? `
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">${venta.cliente.telefono}</span>
            </div>`
                : ""
            }
            ${
              venta.cliente.email
                ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${venta.cliente.email}</span>
            </div>`
                : ""
            }
          </div>

          <div class="info-section">
            <h3>Datos del Viaje</h3>
            <div class="info-row">
              <span class="label">Ruta:</span>
              <span class="value">${venta.ruta.nombre}</span>
            </div>
            <div class="info-row">
              <span class="label">Embarcación:</span>
              <span class="value">${venta.embarcacion.nombre}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${formatearFechaViaje(
                venta.fechaViaje
              )}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora embarque:</span>
              <span class="value">${venta.horaEmbarque}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora viaje:</span>
              <span class="value">${venta.horaViaje}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Datos de la Venta</h3>
            <div class="info-row">
              <span class="label">Fecha emisión:</span>
              <span class="value">${fechaEmision}</span>
            </div>
            <div class="info-row">
              <span class="label">Vendedor:</span>
              <span class="value">${venta.vendedor.nombre} ${
    venta.vendedor.apellido
  }</span>
            </div>
            <div class="info-row">
              <span class="label">Cantidad:</span>
              <span class="value">${venta.cantidadPasajes} pasaje(s)</span>
            </div>
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="value">
                <span class="estado ${venta.estado.toLowerCase()}">${
    venta.estado
  }</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Detalles de pago -->
        <div class="detalles-viaje">
          <div class="detalles-columna">
            <div class="info-row">
              <span class="label">Puerto de embarque:</span>
              <span class="value">${venta.puertoEmbarque.nombre}</span>
            </div>
            ${
              venta.puertoEmbarque.direccion
                ? `
            <div class="info-row">
              <span class="label">Dirección:</span>
              <span class="value">${venta.puertoEmbarque.direccion}</span>
            </div>`
                : ""
            }
            ${
              venta.puertoEmbarque.descripcion
                ? `
            <div class="info-row">
              <span class="label">Notas:</span>
              <span class="value">${venta.puertoEmbarque.descripcion}</span>
            </div>`
                : ""
            }
          </div>

          <div class="detalles-columna">
            <div class="resumen-pago">
              <div class="pago-row">
                <span>Precio unitario:</span>
                <span>S/ ${venta.precioUnitario.toFixed(2)}</span>
              </div>
              <div class="pago-row">
                <span>Subtotal:</span>
                <span>S/ ${venta.subtotal.toFixed(2)}</span>
              </div>
              <div class="pago-row">
                <span>Impuestos:</span>
                <span>S/ ${venta.impuestos.toFixed(2)}</span>
              </div>
              <div class="pago-row pago-total">
                <span>TOTAL PAGADO:</span>
                <span>S/ ${venta.total.toFixed(2)}</span>
              </div>
              <div class="metodos-pago">
                <strong>Método(s) de pago:</strong>
                ${metodosPagoHTML}
              </div>
            </div>
          </div>
        </div>

        ${
          venta.observaciones
            ? `
        <div class="observaciones">
          <strong>Observaciones:</strong>
          <p>${venta.observaciones}</p>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="footer">
          <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9;">
            <p style="font-weight: bold; margin-bottom: 5px;">TÉRMINOS Y CONDICIONES:</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li>• La empresa no aceptará devoluciones una vez realizada la venta y separado el cupo.</li>
              <li>• En caso que la embarcación haya partido y Ud. no abordó, perderá su derecho a viajar y el valor de su pasaje.</li>
              <li>• Equipaje permitido: 15Kg por pasajero.</li>
              <li>• Este ticket puede ser cambiado por Boleta de Venta o Factura.</li>
            </ul>
          </div>
          <p>Para consultas: ${empresa.email} | Celular: ${empresa.telefono}</p>
          <p>${empresa.nombre.toUpperCase()} | ${empresa.direccion}</p>
          <p>Fecha y hora de emisión: ${new Date().toLocaleString("es-PE", {
            timeZone: "America/Lima",
          })}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
