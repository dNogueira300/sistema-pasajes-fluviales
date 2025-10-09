// hooks/use-usuarios.ts
import { useState, useCallback } from "react";
import {
  UserRole,
  FiltrosUsuarios,
  CrearUsuarioData,
  ActualizarUsuarioData,
  EstadisticasUsuarios,
} from "@/types";

export function useUsuarios() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener lista de usuarios con filtros y paginación
  const obtenerUsuarios = useCallback(async (filtros: FiltrosUsuarios = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
      if (filtros.role) params.append("role", filtros.role);
      if (filtros.activo !== undefined)
        params.append("activo", filtros.activo.toString());
      if (filtros.page) params.append("page", filtros.page.toString());
      if (filtros.limit) params.append("limit", filtros.limit.toString());

      const response = await fetch(`/api/usuarios?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener usuarios");
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener usuario por ID
  const obtenerUsuarioPorId = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usuarios/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener usuario");
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear usuario
  const crearUsuario = useCallback(
    async (datos: CrearUsuarioData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/usuarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear usuario");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar usuario
  const actualizarUsuario = useCallback(
    async (id: string, datos: ActualizarUsuarioData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/usuarios/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al actualizar usuario");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Eliminar usuario
  const eliminarUsuario = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar usuario");
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas
  const obtenerEstadisticas =
    useCallback(async (): Promise<EstadisticasUsuarios | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/usuarios/estadisticas");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener estadísticas");
        }

        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  // Cambiar estado de usuario (activar/desactivar)
  const cambiarEstado = useCallback(
    async (id: string, activo: boolean): Promise<boolean> => {
      return actualizarUsuario(id, { activo });
    },
    [actualizarUsuario]
  );

  // Cambiar rol de usuario
  const cambiarRol = useCallback(
    async (id: string, role: UserRole): Promise<boolean> => {
      return actualizarUsuario(id, { role });
    },
    [actualizarUsuario]
  );

  // Cambiar contraseña
  const cambiarContrasena = useCallback(
    async (id: string, password: string): Promise<boolean> => {
      return actualizarUsuario(id, { password });
    },
    [actualizarUsuario]
  );

  return {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    obtenerEstadisticas,
    cambiarEstado,
    cambiarRol,
    cambiarContrasena,
    loading,
    error,
    setError,
  };
}
