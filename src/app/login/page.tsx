// ============================================
// login/page.tsx - Con redirección por rol
// ============================================
"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Eye, EyeOff, Ship, User, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { status } = useSession();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Intentando login...");

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("📋 Resultado login:", result);

      if (result?.error) {
        console.log("❌ Error de login:", result.error);
        setError("Usuario o contraseña incorrectos");
        setIsLoading(false);
      } else if (result?.ok) {
        // Esperar a que la sesión se actualice
        // La redirección se manejará en el useEffect cuando la sesión esté lista
        console.log("✅ Login exitoso, esperando datos de sesión...");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      setError("Error de conexión. Intenta nuevamente.");
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // Mostrar loading mientras verifica
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-300">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado, redirigir con window.location
  if (status === "authenticated") {
    // Redirigir inmediatamente
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-300">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Fondo con gradientes animados */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Partículas de fondo */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Contenedor principal con glassmorphism */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Efectos de brillo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10"></div>
          <div className="absolute top-0 left-0 w-40 h-40 bg-blue-600/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-600/20 rounded-full filter blur-3xl"></div>

          {/* Header con logo y título */}
          <div className="relative px-8 py-8 text-center border-b border-slate-600/30">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-blue-700 p-4 rounded-xl">
                  <Ship className="h-25 w-25 text-white mx-auto drop-shadow-lg" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-100 mb-2 relative z-10">
              Alto Impacto Travel
            </h1>
            <p className="text-slate-300 text-sm relative z-10">
              Sistema de Gestión de Pasajes Fluviales
            </p>
            <div className="flex items-center justify-center mt-3 text-xs text-slate-400 relative z-10">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Sistema activo</span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="relative px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Email/Username */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Usuario o Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-slate-200 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-slate-100 placeholder-slate-400 hover:border-slate-500/70"
                    placeholder="Ingresa tu usuario o email"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-slate-200 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-slate-100 placeholder-slate-400 hover:border-slate-500/70"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-600/30 rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="bg-red-900/50 backdrop-blur-sm border border-red-600/50 rounded-xl p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              {/* Botón de Login */}
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="group w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 border border-blue-500/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span className="relative z-10">Iniciar Sesión</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400 text-sm relative z-10">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl p-4">
            <p className="flex items-center justify-center space-x-2">
              <Ship className="h-4 w-4" />
              <span>Jr. Fitzcarrald 513, Iquitos, Loreto</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              © 2025 Alto Impacto Travel
            </p>
            <div className="flex items-center justify-center mt-2 space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>v1.0.0</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>En línea</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
