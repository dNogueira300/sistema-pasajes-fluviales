// app/global-error.tsx - Para errores globales
"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error global:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-slate-100 mb-4">
              ¡Algo salió mal!
            </h1>

            <p className="text-slate-300 mb-8 leading-relaxed">
              Ha ocurrido un error inesperado en la aplicación. Puedes intentar
              recargar la página o volver al inicio.
            </p>

            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Intentar de nuevo
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-slate-100 rounded-xl transition-all duration-200 border border-slate-600"
              >
                <Home className="h-5 w-5 mr-2" />
                Ir al inicio
              </button>
            </div>

            {error.digest && (
              <p className="text-xs text-slate-500 mt-6">
                ID del error: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
