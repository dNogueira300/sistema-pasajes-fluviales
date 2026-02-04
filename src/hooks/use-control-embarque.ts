"use client";

import useSWR from "swr";
import { useState, useCallback } from "react";

interface RutaInfo {
  id: string;
  nombre: string;
  puertoOrigen: string;
  puertoDestino: string;
}

interface ViajeInfo {
  fechaViaje: string;
  horaViaje: string;
  total: number;
  embarcados: number;
  pendientes: number;
  noEmbarcados: number;
  ruta: RutaInfo | null;
}

interface ClienteEmbarque {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
}

interface ControlEmbarqueInfo {
  id: string;
  estadoEmbarque: "PENDIENTE" | "EMBARCADO" | "NO_EMBARCADO";
  horaRegistro: string | null;
  observaciones: string | null;
  operador: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

interface PasajeroEmbarque {
  id: string;
  numeroVenta: string;
  cantidadPasajes: number;
  cliente: ClienteEmbarque;
  puertoEmbarque: { id: string; nombre: string };
  ruta: RutaInfo;
  embarcacion: { id: string; nombre: string; capacidad: number };
  controlEmbarque: ControlEmbarqueInfo | null;
}

interface EstadisticasEmbarque {
  total: number;
  embarcados: number;
  pendientes: number;
  noEmbarcados: number;
  porcentajeEmbarcados: number;
  capacidadDisponible: number;
  embarcacion: string;
  capacidadTotal: number;
}

interface PasajeroReporte {
  numero: number;
  nombreCliente: string;
  dni: string;
  numeroVenta: string;
  cantidadPasajes: number;
  estado: string;
  horaRegistro: string;
}

interface ReporteData {
  titulo: string;
  viaje: {
    embarcacion: string;
    ruta: string;
    rutaNombre: string;
    fecha: string;
    hora: string;
  };
  pasajeros: PasajeroReporte[];
  estadisticas: {
    total: number;
    embarcados: number;
    pendientes: number;
    noEmbarcados: number;
    capacidadEmbarcacion: number;
    capacidadDisponible: number;
  };
  operador: string;
  fechaGeneracion: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json() as { error?: string };
    throw new Error(errorData.error || "Error al cargar datos");
  }
  const json = await res.json() as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || "Error en la respuesta");
  }
  return json.data;
};

export function useViajesOperador() {
  const { data, error, isLoading, mutate } = useSWR<ViajeInfo[]>(
    "/api/control-embarque/viajes",
    (url: string) => fetcher<ViajeInfo[]>(url),
    { refreshInterval: 30000 }
  );

  return {
    viajes: data || [],
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

export function useListaPasajeros(fecha: string | null, hora: string | null) {
  const url =
    fecha && hora
      ? `/api/control-embarque/lista/${fecha}/${encodeURIComponent(hora)}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<PasajeroEmbarque[]>(
    url,
    (url: string) => fetcher<PasajeroEmbarque[]>(url),
    { refreshInterval: 5000 }
  );

  return {
    pasajeros: data || [],
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

export function useEstadisticas(fecha: string | null, hora: string | null) {
  const url =
    fecha && hora
      ? `/api/control-embarque/estadisticas/${fecha}/${encodeURIComponent(hora)}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<EstadisticasEmbarque>(
    url,
    (url: string) => fetcher<EstadisticasEmbarque>(url),
    { refreshInterval: 5000 }
  );

  return {
    estadisticas: data,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

export function useActualizarEstadoEmbarque() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualizar = useCallback(
    async (
      id: string,
      estadoEmbarque: "EMBARCADO" | "NO_EMBARCADO",
      observaciones?: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/control-embarque/${id}/estado`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estadoEmbarque, observaciones }),
        });
        const json = (await res.json()) as ApiResponse<unknown>;
        if (!res.ok || !json.success) {
          const errMsg = json.error || "Error al actualizar estado";
          setError(errMsg);
          throw new Error(errMsg);
        }
        return json;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { actualizar, isLoading, error };
}

export function useEliminarRegistroEmbarque() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminar = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/control-embarque/${id}/estado`, {
        method: "DELETE",
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !json.success) {
        const errMsg = json.error || "Error al eliminar registro";
        setError(errMsg);
        throw new Error(errMsg);
      }
      return json;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { eliminar, isLoading, error };
}

export function useGenerarReporte() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = useCallback(async (fecha: string, hora: string): Promise<ReporteData> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/control-embarque/reporte/${fecha}/${encodeURIComponent(hora)}`
      );
      const json = (await res.json()) as ApiResponse<ReporteData>;
      if (!res.ok || !json.success) {
        const errMsg = json.error || "Error al generar reporte";
        setError(errMsg);
        throw new Error(errMsg);
      }
      return json.data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generar, isLoading, error };
}

export type {
  ViajeInfo,
  PasajeroEmbarque,
  ClienteEmbarque,
  ControlEmbarqueInfo,
  EstadisticasEmbarque,
  ReporteData,
  PasajeroReporte,
  RutaInfo,
};
