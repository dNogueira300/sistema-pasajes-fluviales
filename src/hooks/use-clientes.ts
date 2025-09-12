// hooks/use-clientes.ts
import { useState, useCallback } from "react";

export interface Cliente {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  nacionalidad: string;
  direccion?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    ventas: number;
  };
}

export interface FiltrosClientes {
  busqueda?: string;
  nacionalidad?: string;
  page?: number;
  limit?: number;
}

export interface CrearClienteData {
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  nacionalidad?: string;
  direccion?: string;
}

export interface ActualizarClienteData {
  dni?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  nacionalidad?: string;
  direccion?: string;
}

export interface EstadisticasClientes {
  totalClientes: number;
  clientesConVentas: number;
  clientesSinVentas: number;
  nacionalidadesMasComunes: Array<{
    nacionalidad: string;
    _count: { nacionalidad: number };
  }>;
  clientesRecientes: number;
}

export function useClientes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener lista de clientes
  const obtenerClientes = useCallback(async (filtros: FiltrosClientes = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
      if (filtros.nacionalidad)
        params.append("nacionalidad", filtros.nacionalidad);
      if (filtros.page) params.append("page", filtros.page.toString());
      if (filtros.limit) params.append("limit", filtros.limit.toString());

      const response = await fetch(`/api/clientes?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener clientes");
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

  // Buscar cliente por DNI
  const buscarClientePorDNI = useCallback(
    async (dni: string): Promise<Cliente | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/clientes/buscar?dni=${dni}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al buscar cliente");
        }

        const cliente = await response.json();
        return cliente;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Obtener cliente por ID
  const obtenerClientePorId = useCallback(
    async (clienteId: string): Promise<Cliente | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/clientes/${clienteId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener cliente");
        }

        return data as Cliente;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Crear cliente
  const crearCliente = useCallback(
    async (datos: CrearClienteData): Promise<Cliente | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/clientes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear cliente");
        }

        return data as Cliente;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar cliente
  const actualizarCliente = useCallback(
    async (
      clienteId: string,
      datos: ActualizarClienteData
    ): Promise<Cliente | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/clientes/${clienteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al actualizar cliente");
        }

        return data as Cliente;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Eliminar cliente
  const eliminarCliente = useCallback(
    async (clienteId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/clientes/${clienteId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al eliminar cliente");
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

  // Obtener estadísticas
  const obtenerEstadisticas =
    useCallback(async (): Promise<EstadisticasClientes | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/clientes/estadisticas");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al obtener estadísticas");
        }

        return data as EstadisticasClientes;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  // Validar DNI
  const validarDNI = useCallback(
    (dni: string): { valido: boolean; mensaje?: string } => {
      if (!dni) {
        return { valido: false, mensaje: "El DNI es requerido" };
      }

      if (dni.length < 8) {
        return {
          valido: false,
          mensaje: "El DNI debe tener al menos 8 dígitos",
        };
      }

      if (!/^\d+$/.test(dni)) {
        return { valido: false, mensaje: "El DNI solo debe contener números" };
      }

      return { valido: true };
    },
    []
  );

  // Formatear nombre completo
  const formatearNombreCompleto = useCallback((cliente: Cliente): string => {
    return `${cliente.nombre} ${cliente.apellido}`;
  }, []);

  return {
    obtenerClientes,
    buscarClientePorDNI,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerEstadisticas,
    validarDNI,
    formatearNombreCompleto,
    loading,
    error,
    setError,
  };
}
