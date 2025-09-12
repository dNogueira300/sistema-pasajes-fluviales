// lib/utils/logo-utils.ts
import fs from "fs";
import path from "path";

/**
 * Obtiene el logo en blanco y negro como string base64
 * @returns Data URL del logo B&W o string vacío si hay error
 */
export function getLogoBWBase64(): string {
  try {
    const logoPath = path.join(
      process.cwd(),
      "src",
      "assets",
      "images",
      "logo-bw.svg"
    );

    if (!fs.existsSync(logoPath)) {
      console.warn("Logo B&W no encontrado en:", logoPath);
      return "";
    }

    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    return `data:image/svg+xml;base64,${logoBase64}`;
  } catch (error) {
    console.error("Error loading BW logo:", error);
    return "";
  }
}

/**
 * Obtiene el logo principal como string base64
 * @returns Data URL del logo o string vacío si hay error
 */
export function getLogoBase64(): string {
  try {
    const logoPath = path.join(
      process.cwd(),
      "src",
      "assets",
      "images",
      "logo.svg"
    );

    if (!fs.existsSync(logoPath)) {
      console.warn("Logo no encontrado en:", logoPath);
      return "";
    }

    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    return `data:image/svg+xml;base64,${logoBase64}`;
  } catch (error) {
    console.error("Error loading logo:", error);
    return "";
  }
}

/**
 * Verifica si un archivo de logo existe
 * @param filename Nombre del archivo (ej: "logo.svg", "logo-bw.svg")
 * @returns true si el archivo existe, false en caso contrario
 */
export function logoExists(filename: string): boolean {
  try {
    const logoPath = path.join(
      process.cwd(),
      "src",
      "assets",
      "images",
      filename
    );
    return fs.existsSync(logoPath);
  } catch {
    return false;
  }
}

/**
 * Obtiene información sobre los logos disponibles
 * @returns Objeto con información sobre qué logos están disponibles
 */
export function getLogoInfo() {
  return {
    hasMainLogo: logoExists("logo.svg"),
    hasBWLogo: logoExists("logo-bw.svg"),
    mainLogoPath: "/api/logo",
    bwLogoPath: "/api/logo/bw", // Para futura implementación
  };
}
