"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

interface FilterState {
  estado?: string;
  embarcacionId?: string;
  search?: string;
}

interface EmbarcacionOption {
  id: string;
  nombre: string;
}

interface OperadorFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function OperadorFilters({ onFilterChange }: OperadorFiltersProps) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [embarcacionId, setEmbarcacionId] = useState("");
  const [embarcaciones, setEmbarcaciones] = useState<EmbarcacionOption[]>([]);

  useEffect(() => {
    fetch("/api/embarcaciones/activas")
      .then((res) => res.json())
      .then((data: { success: boolean; data: EmbarcacionOption[] }) => {
        if (data.success) setEmbarcaciones(data.data);
      })
      .catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search: search || undefined, estado: estado || undefined, embarcacionId: embarcacionId || undefined });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, estado, embarcacionId, onFilterChange]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setEstado("");
    setEmbarcacionId("");
  }, []);

  const hasFilters = search || estado || embarcacionId;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o username..."
            className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Estado filter */}
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>

        {/* Embarcacion filter */}
        <select
          value={embarcacionId}
          onChange={(e) => setEmbarcacionId(e.target.value)}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las embarcaciones</option>
          {embarcaciones.map((emb) => (
            <option key={emb.id} value={emb.id}>
              {emb.nombre}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-700/30 border border-slate-600 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
