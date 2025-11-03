// lib/utils/ticket-utils.ts
import { formatearFechaViaje } from "./fecha-utils";
import { getConfiguracionEmpresa } from "@/lib/actions/configuracion";

interface MetodoPago {
  tipo: string;
  monto: number;
}

interface VentaTicket {
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

export async function generarTicketTermico(
  venta: VentaTicket
): Promise<string> {
  // Obtener configuración de la empresa
  const empresa = await getConfiguracionEmpresa();
  // Formatear la fecha de emisión
  const fechaEmision = new Date(venta.fechaVenta).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const metodosPagoTexto =
    venta.tipoPago === "HIBRIDO" && venta.metodosPago
      ? venta.metodosPago
          .map(
            (metodo: MetodoPago) =>
              `${metodo.tipo}: S/${metodo.monto.toFixed(2)}`
          )
          .join("\n")
      : venta.metodoPago;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket - ${venta.numeroVenta}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            background: #fff;
            width: 80mm;
            margin: 0;
            padding: 8mm 5mm;
          }
          
          .ticket {
            width: 100%;
            max-width: 70mm;
            margin: 0 auto;
          }        .logo-container {
          width: 50px;
          margin: 0 auto 5px;
        }
        
        .logo {
          width: 100%;
          height: auto;
        }
        
        .center {
          text-align: center;
        }
        
        .left {
          text-align: left;
        }
        
        .right {
          text-align: right;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .empresa {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 2px;
          color: #000;
        }
        
        .empresa-subtitulo {
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 3px;
          color: #000;
        }
        
        .empresa-info {
          font-size: 8px;
          text-align: center;
          margin-bottom: 4px;
          line-height: 1.1;
        }
        
        .separador {
          border-bottom: 1px dashed #000;
          margin: 4px 0;
          height: 1px;
        }
        
        .separador-grueso {
          border-bottom: 1px solid #000;
          margin: 6px 0;
          height: 1px;
        }
        
        .titulo {
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          margin: 4px 0;
        }
        
        .numero-venta {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin: 5px 0;
        }
        
        .fila {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        
        .fila-cliente {
          margin: 3px 0;
          font-size: 11px;
        }
        
        .viaje-info {
          padding: 3px;
          margin: 3px 0;
          border: 1px solid #ccc;
        }
        
        .puerto {
          font-size: 9px;
          margin: 2px 0;
          padding: 2px;
        }
        
        .total {
          font-size: 12px;
          font-weight: bold;
          margin: 3px 0;
        }
        
        .footer {
          font-size: 9px;
          text-align: center;
          margin-top: 10px;
        }
        
        .qr-placeholder {
          width: 60px;
          height: 60px;
          border: 1px solid #000;
          margin: 10px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0 5mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .ticket {
            page-break-inside: avoid;
            padding: 5mm 0;
          }

          /* Ocultar elementos del navegador al imprimir */
          @page {
            margin: 0;
            size: 80mm auto;
            margin-left: 0mm;
            margin-right: 0mm;
          }

          /* Ocultar cabecera y pie de página del navegador */
          @page :first {
            margin-top: 0;
          }
          
          @page :left {
            margin-left: 0;
          }
          
          @page :right {
            margin-right: 0;
          }

          /* Ocultar URL y otros elementos del navegador */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <!-- Header -->
        <div class="empresa">${empresa.nombre}</div>
        <div class="empresa-subtitulo">VENTA DE PASAJES FLUVIALES</div>
        <div class="empresa-info">
          IQUITOS, YURIMAGUAS, PUCALLPA, SANTA ROSA, INTUTO,<br>
          SAN LORENZO, TROMPETEROS, PANTOJA, REQUENA<br>
          Y PUERTOS INTERMEDIOS
        </div>
        <div>${empresa.direccion}</div>
        <div>${empresa.telefono}</div>
        <div>${empresa.email}</div>
        <div class="empresa-info">IQUITOS - MAYNAS - LORETO</div>        
        <div class="separador"></div>
        
        <div class="titulo">TICKET DE VIAJE</div>
        <div class="numero-venta">${venta.numeroVenta}</div>
        <div class="center">${fechaEmision}</div>
        
        <div class="separador"></div>
        
        <!-- Datos del cliente -->
        <div class="bold center">PASAJERO</div>
        <div class="fila-cliente">
          <strong>Nombre:</strong> ${venta.cliente.nombre} ${
    venta.cliente.apellido
  }
        </div>
        <div class="fila-cliente">
          <strong>DNI:</strong> ${venta.cliente.dni}
        </div>
        <div class="fila-cliente">
          <strong>Nacionalidad:</strong> ${venta.cliente.nacionalidad}
        </div>
        
        <div class="separador"></div>
        
        <!-- Información del viaje -->
        <div class="bold center">DETALLES DEL VIAJE</div>
        <div class="fila-cliente">
          <strong>Ruta:</strong> ${venta.puertoOrigen} - ${venta.puertoDestino}
        </div>
        <div class="fila-cliente">
          <strong>Embarcacion:</strong> ${venta.embarcacion.nombre}
        </div>
        
        <div class="puerto">
          <strong>Puerto Embarque:</strong><br>
          ${venta.puertoEmbarque.nombre}
          ${
            venta.puertoEmbarque.direccion
              ? `<br>${venta.puertoEmbarque.direccion}`
              : ""
          }
        </div>
        
        <div class="viaje-info">
          <div class="fila">
            <span>Fecha Viaje:</span>
            <span class="bold">${formatearFechaViaje(venta.fechaViaje)}</span>
          </div>
          <div class="fila">
            <span>Hora Embarque:</span>
            <span class="bold">${venta.horaEmbarque}</span>
          </div>
          <div class="fila">
            <span>Hora Viaje:</span>
            <span class="bold">${venta.horaViaje}</span>
          </div>
          <div class="fila">
            <span>Pasajes:</span>
            <span class="bold">${venta.cantidadPasajes}</span>
          </div>
        </div>
        
        <div class="separador"></div>
        
        <!-- Resumen de pago -->
        <div class="bold center">RESUMEN DE PAGO</div>
        <div class="fila">
          <span>Precio Unit.:</span>
          <span>S/ ${venta.precioUnitario.toFixed(2)}</span>
        </div>
        <div class="fila">
          <span>Cantidad:</span>
          <span>${venta.cantidadPasajes}</span>
        </div>
        <div class="fila">
          <span>Subtotal:</span>
          <span>S/ ${venta.subtotal.toFixed(2)}</span>
        </div>
        <div class="fila">
          <span>Impuestos:</span>
          <span>S/ ${venta.impuestos.toFixed(2)}</span>
        </div>
        
        <div class="separador-grueso"></div>
        
        <div class="fila total">
          <span>TOTAL:</span>
          <span>S/ ${venta.total.toFixed(2)}</span>
        </div>
        
        <div class="separador"></div>
        
        <!-- Método de pago -->
        <div class="bold center">METODO DE PAGO</div>
        <div class="center">${metodosPagoTexto}</div>
        
        ${
          venta.observaciones
            ? `
        <div class="separador"></div>
        <div class="bold center">OBSERVACIONES</div>
        <div class="center" style="font-size: 10px;">
          ${venta.observaciones}
        </div>
        `
            : ""
        }
        
        <div class="separador"></div>
        
        <!-- Estado -->
        <div class="center">
          <strong>Estado: ${venta.estado}</strong>
        </div>
        <div class="center" style="font-size: 10px; margin-top: 5px;">
          Vendedor: ${venta.vendedor.nombre} ${venta.vendedor.apellido}
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 6px; padding: 4px; border: 1px dashed #000; text-align: left; font-size: 7px;">
            <p style="font-weight: bold; margin-bottom: 5px;">TÉRMINOS Y CONDICIONES:</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li>• La empresa no aceptará devoluciones una vez realizada la venta y separado el cupo.</li>
              <li>• En caso que la embarcación haya partido y Ud. no abordó, perderá su derecho a viajar y el valor de su pasaje.</li>
              <li>• Equipaje permitido: 15Kg por pasajero.</li>
              <li>• Este ticket puede ser cambiado por Boleta de Venta o Factura.</li>
            </ul>
          </div>
          <div style="margin-top: 8px; font-size: 8px;">
            ${new Date().toLocaleString("es-PE", {
              timeZone: "America/Lima",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
      
      <script>
        let hasPrinted = false;

        // Función para cerrar la ventana después de imprimir
        function handleAfterPrint() {
          if (hasPrinted) {
            // Si ya se imprimió una vez, cerrar la ventana
            window.close();
          }
          hasPrinted = true;
        }

        // Escuchar el evento afterprint
        window.addEventListener('afterprint', handleAfterPrint);

        // Auto-imprimir cuando se carga la página
        window.onload = function() {
          // Dar tiempo a que el contenido se renderice completamente
          setTimeout(() => {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
}
