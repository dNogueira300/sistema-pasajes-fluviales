// ============================================
// app/page.tsx - Con redirección por rol
// ============================================
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Ship } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [particles, setParticles] = useState<
    Array<{
      left: number;
      top: number;
      width: number;
      height: number;
      duration: number;
      delay: number;
    }>
  >([]);

  // Generar partículas solo en el cliente
  useEffect(() => {
    const newParticles = [...Array(8)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  // Redirección basada en rol
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const redirectPath =
        session.user.role === "ADMINISTRADOR"
          ? "/dashboard"
          : "/dashboard/ventas";

      console.log("🔄 Redirigiendo usuario a:", redirectPath);
      router.push(redirectPath);
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Fondo con gradientes animados */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-6000"></div>
      </div>

      {/* Partículas de fondo */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-10"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 text-center">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-600/40 rounded-3xl p-12 shadow-2xl relative overflow-hidden max-w-md mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-transparent to-purple-600/15"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/20 rounded-full filter blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full filter blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-8">
              <div className="bg-slate-600/50 backdrop-blur-sm border border-slate-400/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-400"></div>
                <div className="relative z-10">
                  <Ship className="h-25 w-25 text-white mx-auto animate-pulse drop-shadow-lg" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-slate-100 mb-3">
              Alto Impacto Travel
            </h1>

            <p className="text-slate-300 text-sm mb-8">
              Sistema de Gestión de Pasajes Fluviales
            </p>

            <div className="bg-slate-700/40 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
                <span className="text-lg text-slate-200 font-medium">
                  Cargando sistema...
                </span>
              </div>

              <div className="w-full bg-slate-600/50 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full animate-pulse"></div>
              </div>

              <div className="flex items-center justify-center mt-4 space-x-2 text-xs text-slate-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Verificando autenticación</span>
              </div>
            </div>

            <div className="mt-6 text-xs text-slate-500">
              <p>Jr. Fitzcarrald 513, Iquitos, Loreto</p>
              <p className="mt-1">© 2025 Alto Impacto Travel</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-6">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl px-4 py-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-300">Conectando</span>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl px-4 py-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-slate-300">Seguro</span>
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

        .animation-delay-6000 {
          animation-delay: 6s;
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
