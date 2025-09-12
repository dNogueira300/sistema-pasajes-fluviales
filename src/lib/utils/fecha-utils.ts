export function crearFechaViaje(fechaString: string): Date {
  // Asegurar que la fecha se interprete como mediodia UTC
  // para evitar problemas de zona horaria
  return new Date(fechaString + "T12:00:00.000Z");
}

export function formatearFechaViaje(fecha: Date | string): string {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  // Formatear siempre en zona horaria local sin especificar timezone
  return fechaObj.toLocaleDateString("es-PE");
}

export function formatearFechaViajeCompleta(fecha: Date | string): string {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  return fechaObj.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Nueva función para manejar fechas desde la base de datos
export function parsearFechaDesdeDB(fechaTimestamp: string | Date): Date {
  // Si viene como TIMESTAMP(3) de PostgreSQL, se parsea correctamente
  return new Date(fechaTimestamp);
}

export function validarFechaViaje(fechaString: string): {
  esValida: boolean;
  error?: string;
} {
  const fecha = new Date(fechaString);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (isNaN(fecha.getTime())) {
    return { esValida: false, error: "Fecha inválida" };
  }

  const fechaSinHora = new Date(fecha);
  fechaSinHora.setHours(0, 0, 0, 0);

  if (fechaSinHora < hoy) {
    return { esValida: false, error: "La fecha no puede ser anterior a hoy" };
  }

  // Validar que no sea muy en el futuro (ej: 1 año)
  const unAnoFuturo = new Date();
  unAnoFuturo.setFullYear(unAnoFuturo.getFullYear() + 1);

  if (fecha > unAnoFuturo) {
    return {
      esValida: false,
      error: "La fecha no puede ser mayor a un año en el futuro",
    };
  }

  return { esValida: true };
}
// CORRECCIÓN 8: Para reportes, usar formateo consistente
export function formatearFechaParaReporte(fecha: Date | string): string {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  // Formato para reportes: DD/MM/YYYY
  return fechaObj.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Validar si se puede anular una venta basado en fecha y hora
export function puedeAnularVentaPorFecha(venta: {
  fechaViaje: Date | string;
  horaViaje: string;
}): {
  puedeAnular: boolean;
  tiempoRestante: number; // en milisegundos
  horasRestantes: number;
  mensaje: string;
} {
  const ahora = new Date();
  const fechaViaje = new Date(venta.fechaViaje);

  // Extraer horas y minutos de horaViaje (formato "HH:MM")
  const [horas, minutos] = venta.horaViaje.split(":").map(Number);
  fechaViaje.setHours(horas, minutos, 0, 0);

  const tiempoRestante = fechaViaje.getTime() - ahora.getTime();
  const horasRestantes = Math.ceil(tiempoRestante / (1000 * 60 * 60));

  if (tiempoRestante <= 0) {
    return {
      puedeAnular: false,
      tiempoRestante: 0,
      horasRestantes: 0,
      mensaje: "El viaje ya ha partido o está en curso",
    };
  }

  return {
    puedeAnular: true,
    tiempoRestante,
    horasRestantes,
    mensaje:
      horasRestantes <= 2
        ? `Anulación urgente: ${horasRestantes} hora(s) restante(s)`
        : `Tiempo restante: ${horasRestantes} hora(s)`,
  };
}
