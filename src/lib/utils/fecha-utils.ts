// Constante de zona horaria de Perú
const TIMEZONE_PERU = "America/Lima";

export function crearFechaViaje(fechaString: string): Date {
  // Crear fecha a medianoche en zona horaria de Perú
  const [year, month, day] = fechaString.split("-").map(Number);
  // Crear Date directamente sin ajustar manualmente UTC
  // El Date se guarda en UTC automáticamente, solo necesitamos el día correcto
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatearFechaViaje(fecha: Date | string): string {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  return fechaObj.toLocaleDateString("es-PE", {
    timeZone: TIMEZONE_PERU,
  });
}

export function formatearFechaViajeCompleta(fecha: Date | string): string {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  return fechaObj.toLocaleDateString("es-PE", {
    timeZone: TIMEZONE_PERU,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Función helper para obtener fecha/hora actual en Perú
export function obtenerFechaActualPeru(): Date {
  // Retorna la fecha actual - JavaScript la maneja en UTC internamente
  return new Date();
}

// Función para obtener el inicio del día en Perú
export function obtenerInicioDiaPeru(fecha?: Date): Date {
  const fechaBase = fecha || new Date();

  // Convertir a string en zona horaria de Perú y parsearlo
  const fechaEnPeru = new Date(
    fechaBase.toLocaleString("en-US", { timeZone: TIMEZONE_PERU })
  );

  // Establecer a medianoche
  fechaEnPeru.setHours(0, 0, 0, 0);

  return fechaEnPeru;
}

// Función para obtener el fin del día en Perú
export function obtenerFinDiaPeru(fecha?: Date): Date {
  const fechaBase = fecha || new Date();

  // Convertir a string en zona horaria de Perú y parsearlo
  const fechaEnPeru = new Date(
    fechaBase.toLocaleString("en-US", { timeZone: TIMEZONE_PERU })
  );

  // Establecer a 23:59:59.999
  fechaEnPeru.setHours(23, 59, 59, 999);

  return fechaEnPeru;
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

  // Obtener "hoy" en zona horaria de Perú
  const hoyPeru = obtenerInicioDiaPeru();

  if (isNaN(fecha.getTime())) {
    return { esValida: false, error: "Fecha inválida" };
  }

  const fechaSinHora = new Date(fecha);
  fechaSinHora.setHours(0, 0, 0, 0);

  if (fechaSinHora < hoyPeru) {
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

// Para reportes, usar formateo consistente
export function formatearFechaParaReporte(fecha: Date | string): string {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  // Formato para reportes: DD/MM/YYYY
  return fechaObj.toLocaleDateString("es-PE", {
    timeZone: TIMEZONE_PERU,
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
  // Obtener hora actual en Perú
  const ahoraPeru = new Date(
    new Date().toLocaleString("en-US", { timeZone: TIMEZONE_PERU })
  );

  const fechaViaje = new Date(venta.fechaViaje);

  // Extraer horas y minutos de horaViaje (formato "HH:MM")
  const [horas, minutos] = venta.horaViaje.split(":").map(Number);
  fechaViaje.setHours(horas, minutos, 0, 0);

  const tiempoRestante = fechaViaje.getTime() - ahoraPeru.getTime();
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

// Función específica para formatear fechas de inputs date (YYYY-MM-DD)
export function formatearFechaDesdeInput(fechaString: string): string {
  if (!fechaString) return "";

  // Separar el string y crear la fecha directamente sin conversión UTC
  const [year, month, day] = fechaString.split("-").map(Number);
  const fecha = new Date(year, month - 1, day);

  return fecha.toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
