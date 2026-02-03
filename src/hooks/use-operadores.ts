"use client";

import useSWR from "swr";
import { useState } from "react";

interface OperadorFilters {
  page?: number;
  limit?: number;
  estado?: string;
  embarcacionId?: string;
  search?: string;
}

interface Embarcacion {
  id: string;
  nombre: string;
  capacidad: number;
  estado: string;
  tipo?: string | null;
}

interface Operador {
  id: string;
  email: string;
  username: string;
  nombre: string;
  apellido: string;
  role: string;
  activo: boolean;
  estadoOperador: string | null;
  embarcacionAsignadaId: string | null;
  fechaAsignacion: string | null;
  createdAt: string;
  updatedAt: string;
  embarcacionAsignada: Embarcacion | null;
  _count?: { controlesEmbarque: number };
}

interface OperadoresResponse {
  success: boolean;
  data: Operador[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface OperadorResponse {
  success: boolean;
  data: Operador;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

const fetcher = async (url: string): Promise<OperadoresResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData: ErrorResponse = await res.json();
    throw new Error(errorData.error || "Error al cargar datos");
  }
  return res.json();
};

const fetcherSingle = async (url: string): Promise<OperadorResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData: ErrorResponse = await res.json();
    throw new Error(errorData.error || "Error al cargar datos");
  }
  return res.json();
};

export function useOperadores(filters?: OperadorFilters) {
  const params = new URLSearchParams();
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.estado) params.set("estado", filters.estado);
  if (filters?.embarcacionId) params.set("embarcacionId", filters.embarcacionId);
  if (filters?.search) params.set("search", filters.search);

  const queryString = params.toString();
  const url = `/api/operadores${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    operadores: data?.data || [],
    metadata: data?.metadata,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

export function useOperador(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/operadores/${id}` : null,
    fetcherSingle
  );

  return {
    operador: data?.data,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

export function useCrearOperador() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = async (data: {
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    password: string;
    embarcacionAsignadaId?: string;
    estadoOperador?: string;
  }): Promise<OperadorResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/operadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as OperadorResponse | ErrorResponse;
      if (!res.ok || !json.success) {
        const errMsg = "error" in json ? json.error : "Error al crear operador";
        setError(errMsg);
        throw new Error(errMsg);
      }
      return json as OperadorResponse;
    } finally {
      setIsLoading(false);
    }
  };

  return { crear, isLoading, error };
}

export function useActualizarOperador() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualizar = async (
    id: string,
    data: { nombre?: string; apellido?: string; email?: string }
  ): Promise<OperadorResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/operadores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as OperadorResponse | ErrorResponse;
      if (!res.ok || !json.success) {
        const errMsg = "error" in json ? json.error : "Error al actualizar";
        setError(errMsg);
        throw new Error(errMsg);
      }
      return json as OperadorResponse;
    } finally {
      setIsLoading(false);
    }
  };

  return { actualizar, isLoading, error };
}

export function useAsignarEmbarcacion() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asignar = async (id: string, embarcacionId: string): Promise<OperadorResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/operadores/${id}/asignar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embarcacionId }),
      });
      const json = await res.json() as OperadorResponse | ErrorResponse;
      if (!res.ok || !json.success) {
        const errMsg = "error" in json ? json.error : "Error al asignar";
        setError(errMsg);
        throw new Error(errMsg);
      }
      return json as OperadorResponse;
    } finally {
      setIsLoading(false);
    }
  };

  return { asignar, isLoading, error };
}

export function useCambiarEstadoOperador() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiarEstado = async (
    id: string,
    estadoOperador: "ACTIVO" | "INACTIVO"
  ): Promise<OperadorResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/operadores/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoOperador }),
      });
      const json = await res.json() as OperadorResponse | ErrorResponse;
      if (!res.ok || !json.success) {
        const errMsg = "error" in json ? json.error : "Error al cambiar estado";
        setError(errMsg);
        throw new Error(errMsg);
      }
      return json as OperadorResponse;
    } finally {
      setIsLoading(false);
    }
  };

  return { cambiarEstado, isLoading, error };
}

export type { Operador, OperadorFilters, Embarcacion, OperadorResponse, ErrorResponse };
