// lib/actions/configuracion.ts - VERSIÓN OPTIMIZADA

import { prisma } from "@/lib/prisma";

export async function getConfiguracion(clave: string) {
  try {
    const config = await prisma.configuracion.findUnique({
      where: { clave },
    });
    return config?.valor || null;
  } catch (error) {
    console.error(`Error obteniendo configuración ${clave}:`, error);
    return null;
  }
}

export async function getTodasConfiguraciones() {
  try {
    const configs = await prisma.configuracion.findMany({
      orderBy: { clave: "asc" },
    });

    const configObj: Record<string, string> = {};
    configs.forEach((config) => {
      configObj[config.clave] = config.valor;
    });

    return configObj;
  } catch (error) {
    console.error("Error obteniendo configuraciones:", error);
    return {};
  }
}

export async function actualizarConfiguracion(
  clave: string,
  valor: string,
  tipo: string = "STRING"
) {
  try {
    const config = await prisma.configuracion.upsert({
      where: { clave },
      update: { valor, tipo },
      create: { clave, valor, tipo },
    });
    return config;
  } catch (error) {
    console.error(`Error actualizando configuración ${clave}:`, error);
    throw error;
  }
}

// VERSIÓN OPTIMIZADA - USA UNA SOLA TRANSACCIÓN
export async function actualizarVariasConfiguraciones(
  configs: Record<string, string>
) {
  try {
    // Usar $transaction para hacer todas las operaciones en una sola conexión
    await prisma.$transaction(
      Object.entries(configs).map(([clave, valor]) =>
        prisma.configuracion.upsert({
          where: { clave },
          update: { valor },
          create: { clave, valor, tipo: "STRING" },
        })
      )
    );
    return true;
  } catch (error) {
    console.error("Error actualizando configuraciones:", error);
    throw error;
  }
}

// Función para obtener configuración de empresa
export async function getConfiguracionEmpresa() {
  try {
    const configs = await getTodasConfiguraciones();

    return {
      nombre: configs.EMPRESA_NOMBRE || CONFIG_DEFAULTS.EMPRESA_NOMBRE,
      ruc: configs.EMPRESA_RUC || CONFIG_DEFAULTS.EMPRESA_RUC,
      direccion: configs.EMPRESA_DIRECCION || CONFIG_DEFAULTS.EMPRESA_DIRECCION,
      telefono: configs.EMPRESA_TELEFONO || CONFIG_DEFAULTS.EMPRESA_TELEFONO,
      email: configs.EMPRESA_EMAIL || CONFIG_DEFAULTS.EMPRESA_EMAIL,
      horario: configs.EMPRESA_HORARIO || CONFIG_DEFAULTS.EMPRESA_HORARIO,
      logoUrl: configs.EMPRESA_LOGO_URL || CONFIG_DEFAULTS.EMPRESA_LOGO_URL,
    };
  } catch (error) {
    console.error("Error obteniendo configuración de empresa:", error);
    return {
      nombre: CONFIG_DEFAULTS.EMPRESA_NOMBRE,
      ruc: CONFIG_DEFAULTS.EMPRESA_RUC,
      direccion: CONFIG_DEFAULTS.EMPRESA_DIRECCION,
      telefono: CONFIG_DEFAULTS.EMPRESA_TELEFONO,
      email: CONFIG_DEFAULTS.EMPRESA_EMAIL,
      horario: CONFIG_DEFAULTS.EMPRESA_HORARIO,
      logoUrl: CONFIG_DEFAULTS.EMPRESA_LOGO_URL,
    };
  }
}

// Valores por defecto del sistema
export const CONFIG_DEFAULTS = {
  EMPRESA_NOMBRE: "Alto Impacto Travel",
  EMPRESA_RUC: "",
  EMPRESA_DIRECCION: "Jr. Fitzcarrald 513, Iquitos, Loreto",
  EMPRESA_TELEFONO: "",
  EMPRESA_EMAIL: "",
  EMPRESA_HORARIO: "Lunes a Sábado: 8:00 AM - 6:00 PM",
  EMPRESA_LOGO_URL: "",
  PAGO_EFECTIVO_HABILITADO: "true",
  PAGO_TARJETA_HABILITADO: "false",
  PAGO_YAPE_HABILITADO: "true",
  PAGO_PLIN_HABILITADO: "true",
  PAGO_TRANSFERENCIA_HABILITADO: "true",
  BACKUP_AUTOMATICO_HABILITADO: "false",
  BACKUP_FRECUENCIA_DIAS: "7",
  BACKUP_HORA: "02:00",
};
