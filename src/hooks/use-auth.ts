"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/types";

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si requireAuth es true y no hay sesión, redirigir al login
    if (requireAuth && status === "unauthenticated") {
      router.push("/login");
    }

    // Si requireAuth es false y hay sesión, redirigir al dashboard
    if (!requireAuth && status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, requireAuth, router]);

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",

    // Helpers para roles
    isAdmin: session?.user?.role === "ADMINISTRADOR",
    isVendedor: session?.user?.role === "VENDEDOR",

    // Función para verificar si tiene un rol específico
    hasRole: (role: UserRole) => {
      return session?.user?.role === role;
    },

    // Función para verificar si tiene alguno de los roles especificados
    hasAnyRole: (roles: UserRole[]) => {
      return roles.includes(session?.user?.role as UserRole);
    },
  };
}

// Hook específico para páginas que requieren autenticación
export function useRequireAuth() {
  return useAuth(true);
}

// Hook específico para páginas públicas (login, etc.)
export function usePublicRoute() {
  return useAuth(false);
}
