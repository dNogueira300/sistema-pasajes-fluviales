import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sanitizeText,
  sanitizeDni,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumber,
  sanitizeSearch,
} from "../sanitize";

// ============================================================
// PAYLOADS DE ATAQUE - SQL Injection
// ============================================================
const SQL_INJECTION_PAYLOADS = [
  "' OR 1=1 --",
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users --",
  "1; DELETE FROM ventas",
  "admin'--",
  "' OR ''='",
  "'; EXEC xp_cmdshell('dir'); --",
  "1' AND 1=1 UNION ALL SELECT 1,2,3,table_name FROM information_schema.tables--",
  "' OR 1=1#",
  "') OR ('1'='1",
  "'; WAITFOR DELAY '0:0:10'--",
  "1 AND (SELECT COUNT(*) FROM users) > 0",
];

// ============================================================
// PAYLOADS DE ATAQUE - XSS (Cross-Site Scripting)
// ============================================================
const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  '<svg onload=alert("xss")>',
  "javascript:alert('xss')",
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert("xss")>',
  '"><script>alert(document.cookie)</script>',
  "' onfocus='alert(1)' autofocus='",
  '<a href="javascript:alert(1)">click</a>',
  '<div style="background:url(javascript:alert(1))">',
  "<marquee onstart=alert(1)>",
  "<details open ontoggle=alert(1)>",
  "${alert(1)}",
  '{{constructor.constructor("alert(1)")()}}',
];

// ============================================================
// Tests: escapeHtml
// ============================================================
describe("escapeHtml", () => {
  it("escapa caracteres HTML peligrosos", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    expect(escapeHtml("it's")).toBe("it&#x27;s");
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("no modifica texto seguro", () => {
    expect(escapeHtml("texto normal")).toBe("texto normal");
    expect(escapeHtml("Juan Pérez")).toBe("Juan Pérez");
    expect(escapeHtml("123456")).toBe("123456");
  });

  it("neutraliza todos los payloads XSS", () => {
    for (const payload of XSS_PAYLOADS) {
      const result = escapeHtml(payload);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    }
  });
});

// ============================================================
// Tests: sanitizeText
// ============================================================
describe("sanitizeText", () => {
  it("hace trim y colapsa espacios múltiples", () => {
    expect(sanitizeText("  hola   mundo  ")).toBe("hola mundo");
    expect(sanitizeText("  Juan   Carlos  ")).toBe("Juan Carlos");
  });

  it("escapa HTML en el texto", () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("neutraliza payloads de SQL injection en texto", () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const result = sanitizeText(payload);
      // Las comillas simples deben estar escapadas
      expect(result).not.toContain("'");
    }
  });

  it("neutraliza payloads de XSS en texto", () => {
    for (const payload of XSS_PAYLOADS) {
      const result = sanitizeText(payload);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    }
  });
});

// ============================================================
// Tests: sanitizeDni
// ============================================================
describe("sanitizeDni", () => {
  it("solo permite dígitos", () => {
    expect(sanitizeDni("12345678")).toBe("12345678");
    expect(sanitizeDni("1234-5678")).toBe("12345678");
    expect(sanitizeDni("abc12345678")).toBe("12345678");
  });

  it("limita a 10 caracteres", () => {
    expect(sanitizeDni("123456789012345")).toBe("1234567890");
  });

  it("remueve payloads de SQL injection del DNI", () => {
    expect(sanitizeDni("' OR 1=1 --")).toBe("11");
    expect(sanitizeDni("12345678'; DROP TABLE--")).toBe("12345678");
    expect(sanitizeDni("1' UNION SELECT *--")).toBe("1");
  });

  it("remueve payloads XSS del DNI", () => {
    expect(sanitizeDni('<script>alert("xss")</script>')).toBe("");
    expect(sanitizeDni('12345678<img onerror="alert(1)">')).toBe("123456781");
  });
});

// ============================================================
// Tests: sanitizeEmail
// ============================================================
describe("sanitizeEmail", () => {
  it("convierte a minúsculas y hace trim", () => {
    expect(sanitizeEmail("  ADMIN@MAIL.COM  ")).toBe("admin@mail.com");
    expect(sanitizeEmail("User@Domain.Com")).toBe("user@domain.com");
  });

  it("sanitiza intentos de SQL injection en email", () => {
    const result = sanitizeEmail("admin'--@mail.com");
    expect(result).toBe("admin'--@mail.com");
    // Nota: sanitizeEmail solo hace trim+lowercase.
    // La validación de formato la hace el schema Zod (emailOpcionalSchema)
  });
});

// ============================================================
// Tests: sanitizePhone
// ============================================================
describe("sanitizePhone", () => {
  it("solo permite dígitos y limita a 9", () => {
    expect(sanitizePhone("987654321")).toBe("987654321");
    expect(sanitizePhone("+51 987 654 321")).toBe("519876543");
    expect(sanitizePhone("(01) 234-5678")).toBe("012345678");
  });

  it("remueve payloads de inyección del teléfono", () => {
    expect(sanitizePhone("'; DROP TABLE--")).toBe("");
    expect(sanitizePhone("987654321'; DELETE FROM users--")).toBe("987654321");
  });
});

// ============================================================
// Tests: sanitizeNumber
// ============================================================
describe("sanitizeNumber", () => {
  it("parsea y limita rango", () => {
    expect(sanitizeNumber("50", 0, 100)).toBe(50);
    expect(sanitizeNumber(150, 0, 100)).toBe(100);
    expect(sanitizeNumber(-10, 0, 100)).toBe(0);
  });

  it("retorna null para valores no numéricos", () => {
    expect(sanitizeNumber("abc", 0, 100)).toBeNull();
    expect(sanitizeNumber("' OR 1=1", 0, 100)).toBeNull();
    expect(sanitizeNumber(undefined, 0, 100)).toBeNull();
  });
});

// ============================================================
// Tests: sanitizeSearch
// ============================================================
describe("sanitizeSearch", () => {
  it("hace trim, escapa HTML y limita a 100 caracteres", () => {
    expect(sanitizeSearch("  buscar algo  ")).toBe("buscar algo");
    expect(sanitizeSearch("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("limita longitud a 100 caracteres", () => {
    const longInput = "a".repeat(200);
    expect(sanitizeSearch(longInput).length).toBe(100);
  });

  it("neutraliza payloads de SQL injection en búsquedas", () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const result = sanitizeSearch(payload);
      // Las comillas simples deben estar escapadas como &#x27;
      expect(result).not.toContain("'");
      expect(result.length).toBeLessThanOrEqual(100);
    }
  });

  it("neutraliza payloads de XSS en búsquedas", () => {
    for (const payload of XSS_PAYLOADS) {
      const result = sanitizeSearch(payload);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
      expect(result.length).toBeLessThanOrEqual(100);
    }
  });
});
