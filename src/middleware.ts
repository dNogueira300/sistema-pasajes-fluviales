// ============================================
// middleware.ts
// ============================================
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("🔍 Middleware:", {
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
      const redirectPath =
        token.role === "ADMINISTRADOR" ? "/dashboard" : "/dashboard/ventas";
      console.log("✅ Con token en login, redirigiendo a:", redirectPath);
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // Proteger dashboard principal - solo administradores
    if (pathname === "/dashboard" && token?.role !== "ADMINISTRADOR") {
      console.log("⛔ Acceso denegado al dashboard: usuario no es admin");
      return NextResponse.redirect(new URL("/dashboard/ventas", req.url));
    }

    // // Verificar roles para rutas específicas de administrador
    // if (pathname.startsWith("/admin")) {
    //   if (token?.role !== "ADMINISTRADOR") {
    //     return NextResponse.redirect(new URL("/dashboard", req.url));
    //   }
    // }

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

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon\\.png).*)"],
};
