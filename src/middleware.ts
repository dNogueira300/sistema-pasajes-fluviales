import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Si no hay token y está intentando acceder a rutas protegidas
    if (!token && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Si hay token y está intentando acceder al login, redirigir al dashboard
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Verificar roles para rutas específicas de administrador
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMINISTRADOR") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
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

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
