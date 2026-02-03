// ============================================
// proxy.ts (antes middleware.ts)
// Next.js 16: middleware renombrado a proxy
// ============================================
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("🔍 Proxy:", {
      pathname,
      hasToken: !!token,
      role: token?.role,
    });

    // Si no hay token y está intentando acceder a rutas protegidas
    if (!token && pathname.startsWith("/dashboard")) {
      console.log("⛔ Sin token, redirigiendo a login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Si hay token y está intentando acceder al login, redirigir según rol
    if (token && pathname === "/login") {
      let redirectPath = "/dashboard/ventas";
      if (token.role === "ADMINISTRADOR") redirectPath = "/dashboard";
      else if (token.role === "OPERADOR_EMBARCACION") redirectPath = "/dashboard/control-embarque";
      console.log("✅ Con token en login, redirigiendo a:", redirectPath);
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // Proteger dashboard principal - solo administradores
    if (pathname === "/dashboard" && token?.role !== "ADMINISTRADOR") {
      if (token?.role === "OPERADOR_EMBARCACION") {
        return NextResponse.redirect(new URL("/dashboard/control-embarque", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard/ventas", req.url));
    }

    // Operadores solo pueden acceder a control-embarque
    if (token?.role === "OPERADOR_EMBARCACION") {
      if (!pathname.startsWith("/dashboard/control-embarque")) {
        return NextResponse.redirect(new URL("/dashboard/control-embarque", req.url));
      }
    }

    // Permitir el acceso
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Permitir acceso a rutas públicas
        if (pathname === "/login" || pathname === "/") {
          return true;
        }

        // Para rutas protegidas, requiere token
        return !!token;
      },
    },
  }
);

// Exportar como "proxy" para Next.js 16+
export function proxy(req: Parameters<typeof authMiddleware>[0], event: Parameters<typeof authMiddleware>[1]) {
  return authMiddleware(req, event);
}

// Configurar qué rutas deben pasar por el proxy
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon\\.png).*)"],
};
