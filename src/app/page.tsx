"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Ship } from "lucide-react";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Mostrar loading mientras verifica la sesión
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full p-6">
            <Ship className="h-16 w-16 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Alto Impacto Travel</h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          <span className="text-lg">Cargando sistema...</span>
        </div>
        <p className="mt-4 text-blue-100">
          Sistema de Gestión de Pasajes Fluviales
        </p>
      </div>
    </div>
  );
}
