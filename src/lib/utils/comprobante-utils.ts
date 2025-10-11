// lib/utils/comprobante-utils.ts
import puppeteer, { Browser, Page } from "puppeteer";
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

// ============================================
// 🚀 OPTIMIZACIÓN: SINGLETON PATTERN
// ============================================
let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;
let isClosing = false;

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    return browserPromise;
  }

  if (browserInstance && browserInstance.connected && !isClosing) {
    return browserInstance;
  }

  console.log("🚀 Creando nueva instancia de browser...");
  browserPromise = puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--disable-extensions",
    ],
  });

  try {
    browserInstance = await browserPromise;
    browserPromise = null;

    browserInstance.on("disconnected", () => {
      console.log("🔴 Browser desconectado inesperadamente");
      browserInstance = null;
      browserPromise = null;
      isClosing = false;
    });

    console.log("✅ Browser creado exitosamente");
    return browserInstance;
  } catch (error) {
    console.error("❌ Error creando browser:", error);
    browserPromise = null;
    throw error;
  }
}

// ============================================
// 🚀 FUNCIÓN OPTIMIZADA CON MEJOR MANEJO DE ERRORES
// ============================================
export async function generarComprobanteA4(
  venta: VentaComprobante
): Promise<Buffer> {
  const empresa = await getConfiguracionEmpresa();
  const html = generarHTMLComprobante(venta, empresa);

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (resourceType === "document" || request.url().startsWith("data:")) {
        request.continue();
      } else {
        request.abort();
      }
    });

    await page.setViewport({ width: 794, height: 1123 });

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return Buffer.from(pdf);
  } catch (error) {
    console.error("❌ Error generando PDF:", error);

    if (browserInstance) {
      try {
        isClosing = true;
        await browserInstance.close();
        browserInstance = null;
        browserPromise = null;
      } catch (closeError) {
        console.error("Error cerrando browser:", closeError);
      } finally {
        isClosing = false;
      }
    }

    throw error;
  } finally {
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (closeError) {
        console.error("Error cerrando página:", closeError);
      }
    }
  }
}

// ============================================
// CERRAR BROWSER MANUALMENTE
// ============================================
export async function closeBrowser(): Promise<void> {
  if (browserInstance && !isClosing) {
    try {
      isClosing = true;
      await browserInstance.close();
      browserInstance = null;
      browserPromise = null;
      console.log("🔴 Browser cerrado manualmente");
    } catch (error) {
      console.error("Error cerrando browser:", error);
    } finally {
      isClosing = false;
    }
  }
}

// ============================================
// GENERADOR DE HTML
// ============================================
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

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
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #1f2937;
          background: #fff;
          padding: 0;
          margin: 0;
        }
        
        .comprobante {
          max-width: 21cm;
          margin: 0 auto;
          padding: 0;
        }
        
        /* ============================================
          HEADER
          ============================================ */
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 20px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 160px;
          flex-shrink: 0;
        }

        .empresa {
          font-size: 26px;
          font-weight: bold;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .empresa-subtitulo {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .empresa-cobertura {
          font-size: 9px;
          opacity: 0.95;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        
        .empresa-info {
          font-size: 9px;
          opacity: 0.9;
          line-height: 1.5;
        }

        /* Recuadro comprobante - CENTRADO HORIZONTAL */
        .comprobante-box {
          background: white;
          border: 2px solid #1e40af;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          width: 160px;
        }

        .comprobante-box-title {
          font-size: 11px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 2px;
        }

        .comprobante-box-numero {
          font-size: 14px;
          font-weight: bold;
          color: #dc2626;
          margin-top: 5px;
        }
        
        /* ============================================
           LÍNEA DIVISORIA
           ============================================ */
        .divider {
          height: 2px;
          background: #1e40af;
          margin: 0;
        }

        /* ============================================
           FECHA DE EMISIÓN
           ============================================ */
        .fecha-emision {
          text-align: center;
          font-size: 11px;
          font-weight: bold;
          color: #1f2937;
          padding: 15px 0;
          background: #f9fafb;
        }

        /* ============================================
           SECCIONES
           ============================================ */
        .section {
          padding: 0 30px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 11px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
          padding-bottom: 3px;
          border-bottom: 1px solid #d1d5db;
        }

        .section-content {
          padding-top: 8px;
        }

        .info-row {
          display: flex;
          margin-bottom: 6px;
          font-size: 10px;
        }

        .info-label {
          color: #6b7280;
          margin-right: 5px;
          min-width: fit-content;
        }

        .info-value {
          color: #1f2937;
          font-weight: 600;
        }

        /* ============================================
           DOS COLUMNAS
           ============================================ */
        .two-columns {
          display: flex;
          gap: 20px;
          padding: 0 30px;
          margin-bottom: 20px;
        }

        .column {
          flex: 1;
          border: 2px solid #1e40af;
          border-radius: 8px;
          overflow: hidden;
        }

        .column-header {
          background: #1e40af;
          color: white;
          font-size: 11px;
          font-weight: bold;
          padding: 10px;
          text-align: center;
        }

        .column-content {
          padding: 15px;
          background: white;
        }

        /* Resumen de pago - SIN FONDO AZUL */
        .resumen-pago {
          background: white;
        }

        .pago-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 10px;
        }

        .pago-separator {
          border-top: 1px solid #1e40af;
          margin: 12px 0;
        }

        .pago-total-box {
          background: #dbeafe;
          border: 2px solid #1e40af;
          border-radius: 6px;
          padding: 10px;
          margin: 12px 0;
        }

        .pago-total {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: bold;
          color: #1e40af;
        }

        .metodos-pago-label {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          margin-top: 10px;
        }

        .metodo-pago {
          background: #e0f2fe;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 5px;
          font-size: 9px;
          display: inline-block;
          margin-right: 8px;
        }

        /* Estado badge - CENTRADO HORIZONTAL */
        .estado-container {
          display: flex;
          align-items: center;
        }

        .estado {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .estado.confirmada {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #059669;
        }
        
        .estado.anulada {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #dc2626;
        }

        /* ============================================
           TÉRMINOS Y CONDICIONES
           ============================================ */
        .terminos {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px 30px;
          margin: 0 30px 20px 30px;
        }

        .terminos-title {
          font-size: 10px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }

        .terminos ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .terminos li {
          font-size: 8px;
          color: #6b7280;
          margin-bottom: 5px;
          padding-left: 15px;
          position: relative;
          line-height: 1.4;
        }

        .terminos li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #1e40af;
          font-weight: bold;
        }

        /* ============================================
           FOOTER
           ============================================ */
        .footer {
          background: #1e40af;
          color: white;
          padding: 15px 30px;
          text-align: center;
        }

        .footer-info {
          font-size: 9px;
          opacity: 0.95;
          margin-bottom: 5px;
          line-height: 1.5;
        }

        .footer-fecha {
          font-size: 8px;
          opacity: 0.85;
        }
        
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: A4; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="comprobante">
        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <div class="empresa">${empresa.nombre}</div>
            <div class="empresa-subtitulo">VENTA DE PASAJES FLUVIALES</div>
            <div class="empresa-cobertura">
              IQUITOS, YURIMAGUAS, PUCALLPA, SANTA ROSA, INTUTO,<br>
              SAN LORENZO, TROMPETEROS, PANTOJA, REQUENA Y PUERTOS INTERMEDIOS
            </div>
            <div class="empresa-info">
              ${empresa.direccion} | ${empresa.email} | Cel: ${
    empresa.telefono
  }<br>
              IQUITOS - MAYNAS - LORETO
            </div>
          </div>
          <div class="header-right">
            <div class="comprobante-box">
              <div class="comprobante-box-title">COMPROBANTE</div>
              <div class="comprobante-box-title">DE VENTA</div>
              <div class="comprobante-box-numero">N° ${venta.numeroVenta}</div>
            </div>
          </div>
        </div>

        <!-- LÍNEA DIVISORIA -->
        <div class="divider"></div>

        <!-- FECHA DE EMISIÓN -->
        <div class="fecha-emision">
          FECHA DE EMISIÓN: ${fechaEmision}
        </div>

        <!-- DATOS DEL CLIENTE -->
        <div class="section">
          <div class="section-title">DATOS DEL CLIENTE</div>
          <div class="section-content">
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span class="info-value">${venta.cliente.nombre} ${
    venta.cliente.apellido
  }</span>
            </div>
            <div class="info-row">
              <span class="info-label">DNI:</span>
              <span class="info-value">${venta.cliente.dni}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nacionalidad:</span>
              <span class="info-value">${venta.cliente.nacionalidad}</span>
            </div>
            ${
              venta.cliente.telefono
                ? `<div class="info-row">
              <span class="info-label">Teléfono:</span>
              <span class="info-value">${venta.cliente.telefono}</span>
            </div>`
                : ""
            }
          </div>
        </div>

        <!-- DATOS DEL VIAJE -->
        <div class="section">
          <div class="section-title">DATOS DEL VIAJE</div>
          <div class="section-content">
            <div class="info-row">
              <span class="info-label">Ruta:</span>
              <span class="info-value">${venta.ruta.nombre}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Embarcación:</span>
              <span class="info-value">${venta.embarcacion.nombre}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span class="info-value">${formatearFechaViaje(
                venta.fechaViaje
              )}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hora de embarque:</span>
              <span class="info-value">${venta.horaEmbarque}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hora de viaje:</span>
              <span class="info-value">${venta.horaViaje}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Puerto de embarque:</span>
              <span class="info-value">${venta.puertoEmbarque.nombre}</span>
            </div>
            ${
              venta.puertoEmbarque.direccion
                ? `<div class="info-row">
              <span class="info-label">Dirección del puerto:</span>
              <span class="info-value">${venta.puertoEmbarque.direccion}</span>
            </div>`
                : ""
            }
          </div>
        </div>

        <!-- DOS COLUMNAS: DATOS DE LA VENTA Y RESUMEN DE PAGO -->
        <div class="two-columns">
          <!-- DATOS DE LA VENTA -->
          <div class="column">
            <div class="column-header">DATOS DE LA VENTA</div>
            <div class="column-content">
              <div class="info-row">
                <span class="info-label">Cantidad:</span>
                <span class="info-value">${
                  venta.cantidadPasajes
                } pasaje(s)</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vendedor:</span>
                <span class="info-value">${venta.vendedor.nombre} ${
    venta.vendedor.apellido
  }</span>
              </div>
              <div class="info-row estado-container">
                <span class="info-label">Estado:</span>
                <span class="info-value">
                  <span class="estado ${venta.estado.toLowerCase()}">${
    venta.estado
  }</span>
                </span>
              </div>
            </div>
          </div>

          <!-- RESUMEN DE PAGO -->
          <div class="column">
            <div class="column-header">RESUMEN DE PAGO</div>
            <div class="column-content resumen-pago">
              <div class="pago-row">
                <span>Precio unitario</span>
                <span>S/. ${venta.precioUnitario.toFixed(2)}</span>
              </div>
              <div class="pago-row">
                <span>Subtotal:</span>
                <span>S/. ${venta.subtotal.toFixed(2)}</span>
              </div>
              <div class="pago-row">
                <span>Impuestos:</span>
                <span>S/. ${venta.impuestos.toFixed(2)}</span>
              </div>
              
              <div class="pago-separator"></div>
              
              <div class="pago-total-box">
                <div class="pago-total">
                  <span>TOTAL PAGADO</span>
                  <span>S/. ${venta.total.toFixed(2)}</span>
                </div>
              </div>

              <div class="metodos-pago-label">Método(s) de pago:</div>
              ${metodosPagoHTML}
            </div>
          </div>
        </div>

        <!-- TÉRMINOS Y CONDICIONES -->
        <div class="terminos">
          <div class="terminos-title">TÉRMINOS Y CONDICIONES:</div>
          <ul>
            <li>No se aceptan devoluciones una vez realizada la venta y separado el cupo.</li>
            <li>Si la embarcación partió y Ud. no abordó, perderá su derecho a viajar y el valor del pasaje.</li>
            <li>Equipaje permitido: 15Kg por pasajero.</li>
            <li>Este ticket puede ser cambiado por Boleta de Venta o Factura.</li>
          </ul>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <div class="footer-info">
            ${empresa.nombre.toUpperCase()} | ${empresa.direccion} | ${
    empresa.telefono
  } | ${empresa.email}
          </div>
          <div class="footer-fecha">
            Impreso: ${fechaImpresion} | IQUITOS - MAYNAS - LORETO
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
