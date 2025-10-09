// app/not-found.tsx
"use client";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search, Ship, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function NotFound() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth(false);

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Icono principal animado */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-slate-600/50 backdrop-blur-sm">
            <div className="relative">
              <Ship className="h-16 w-16 text-blue-400 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Ondas animadas */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-blue-400/30 rounded-full animate-ping"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-40 h-40 border-2 border-blue-400/20 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="space-y-6">
          <div>
            <h1 className="text-6xl font-bold text-slate-100 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-slate-200 mb-4">
              Página no encontrada
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              La página que buscas no existe o ha sido movida. Como una
              embarcación perdida en el río, esta ruta no lleva a ningún
              destino.
            </p>
          </div>

          {/* Sugerencias contextuales */}
          <div className="bg-slate-800/50 border border-slate-600/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-slate-200 font-medium mb-4 flex items-center justify-center">
              <Search className="h-5 w-5 mr-2 text-blue-400" />
              ¿Qué estabas buscando?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => router.push("/dashboard/embarcaciones")}
                    className="text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-slate-100"
                  >
                    <span className="font-medium">Embarcaciones</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Gestionar flota
                    </p>
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/ventas")}
                    className="text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-slate-100"
                  >
                    <span className="font-medium">Ventas</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Realizar ventas
                    </p>
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => router.push("/dashboard/usuarios")}
                        className="text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-slate-100"
                      >
                        <span className="font-medium">Usuarios</span>
                        <p className="text-xs text-slate-400 mt-1">
                          Gestionar usuarios
                        </p>
                      </button>
                      <button
                        onClick={() => router.push("/dashboard/rutas")}
                        className="text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-slate-100"
                      >
                        <span className="font-medium">Rutas</span>
                        <p className="text-xs text-slate-400 mt-1">
                          Configurar rutas
                        </p>
                      </button>
                    </>
                  )}
                </>
              )}
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-slate-100"
                  >
                    <span className="font-medium">Iniciar Sesión</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Acceder al sistema
                    </p>
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-slate-100"
                  >
                    <span className="font-medium">Inicio</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Página principal
                    </p>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="group flex items-center justify-center px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 hover:text-slate-100 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Volver atrás
            </button>

            <button
              onClick={handleGoHome}
              className="group flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
            >
              <Home className="h-5 w-5 mr-2" />
              {isAuthenticated ? "Dashboard" : "Ir al inicio"}
            </button>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-slate-500 mt-8">
            <p>Error 404 - Página no encontrada</p>
            <p className="mt-1">
              Si el problema persiste, contacta al administrador del sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
