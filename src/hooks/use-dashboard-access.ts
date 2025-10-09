// ============================================
// hooks/use-dashboard-access.ts - NUEVO
// ============================================
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useDashboardAccess() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si está cargado y el usuario no es admin, redirigir a ventas
    if (status === "authenticated" && session?.user?.role !== "ADMINISTRADOR") {
      console.log("⚠️ Usuario sin permisos de admin, redirigiendo a ventas");
      router.replace("/dashboard/ventas");
    }
  }, [status, session, router]);

  return {
    hasAccess: session?.user?.role === "ADMINISTRADOR",
    isLoading: status === "loading",
  };
}
