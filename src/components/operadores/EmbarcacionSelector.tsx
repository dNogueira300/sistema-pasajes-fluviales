"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Ship, AlertCircle, CheckCircle, ChevronDown, Search, X } from "lucide-react";

interface EmbarcacionOption {
  id: string;
  nombre: string;
  capacidad: number;
  estado: string;
  tipo: string | null;
}

interface EmbarcacionSelectorProps {
  value: string;
  onChange: (embarcacionId: string) => void;
  error?: string;
  excludeOperadorId?: string;
}

export default function EmbarcacionSelector({
  value,
  onChange,
  error,
  excludeOperadorId,
}: EmbarcacionSelectorProps) {
  const [embarcaciones, setEmbarcaciones] = useState<EmbarcacionOption[]>([]);
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calcular posición del dropdown
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Actualizar posición cuando se abre o cambia el scroll
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen]);

  // Cargar embarcaciones con verificación de ocupación en paralelo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resEmb = await fetch("/api/embarcaciones/activas");
        const dataEmb: EmbarcacionOption[] | { error: string } = await resEmb.json();

        if (Array.isArray(dataEmb)) {
          setEmbarcaciones(dataEmb);

          // Cargar todas las verificaciones de ocupación en paralelo
          const ocupadasPromises = dataEmb.map(async (emb) => {
            const resOp = await fetch(
              `/api/operadores?embarcacionId=${emb.id}&estado=ACTIVO&limit=1`
            );
            const dataOp = (await resOp.json()) as {
              success: boolean;
              data: { id: string }[];
            };
            if (dataOp.success && dataOp.data.length > 0) {
              const operadorId = dataOp.data[0].id;
              if (operadorId !== excludeOperadorId) {
                return emb.id;
              }
            }
            return null;
          });

          const ocupadasResults = await Promise.all(ocupadasPromises);
          const ocupadasSet = new Set<string>(
            ocupadasResults.filter((id): id is string => id !== null)
          );
          setOcupadas(ocupadasSet);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [excludeOperadorId]);

  // Filtrar embarcaciones por búsqueda
  const filteredEmbarcaciones = embarcaciones.filter(
    (emb) =>
      emb.nombre.toLowerCase().includes(search.toLowerCase()) ||
      emb.tipo?.toLowerCase().includes(search.toLowerCase())
  );

  // Obtener la embarcación seleccionada
  const selectedEmb = embarcaciones.find((e) => e.id === value);

  const handleSelect = (embId: string) => {
    onChange(embId);
    setIsOpen(false);
    setSearch("");
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse h-12 bg-slate-700/50 rounded-xl flex items-center px-4 gap-3">
          <span className="h-4 w-4 bg-slate-600 rounded" />
          <span className="h-4 flex-1 bg-slate-600 rounded" />
        </div>
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="h-3 w-3 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
          Cargando embarcaciones disponibles...
        </span>
      </div>
    );
  }

  const dropdownContent = isOpen && (
    <div
      ref={containerRef}
      className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden"
      style={{
        position: "fixed",
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
    >
      {/* Buscador */}
      <div className="p-2 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar embarcación..."
            className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Lista de opciones */}
      <div className="max-h-60 overflow-y-auto">
        {/* Opción: Sin embarcación */}
        <button
          type="button"
          onClick={() => handleSelect("")}
          className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
            !value
              ? "bg-blue-600/20 text-blue-400"
              : "text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          <X className="h-4 w-4 text-slate-400" />
          <span>Sin embarcación asignada</span>
        </button>

        {/* Lista de embarcaciones */}
        {filteredEmbarcaciones.length === 0 ? (
          <div className="px-4 py-6 text-center text-slate-500 text-sm">
            No se encontraron embarcaciones
          </div>
        ) : (
          filteredEmbarcaciones.map((emb) => {
            const isOcupada = ocupadas.has(emb.id);
            const isSelected = value === emb.id;
            return (
              <button
                key={emb.id}
                type="button"
                onClick={() => !isOcupada && handleSelect(emb.id)}
                disabled={isOcupada}
                className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                  isSelected
                    ? "bg-blue-600/20 text-blue-400"
                    : isOcupada
                    ? "text-slate-500 cursor-not-allowed bg-slate-800"
                    : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                <Ship className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-blue-400" : isOcupada ? "text-slate-600" : "text-slate-400"}`} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={`truncate ${isOcupada ? "text-slate-500" : ""}`}>
                      {emb.nombre}
                    </span>
                    {isOcupada ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-900/40 text-red-400 rounded border border-red-700/50 flex-shrink-0">
                        Ocupada
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-900/40 text-green-400 rounded border border-green-700/50 flex-shrink-0">
                        Disponible
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Capacidad: {emb.capacidad} personas
                    {emb.tipo && ` — ${emb.tipo}`}
                  </span>
                </span>
                {isSelected && <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {/* Botón selector */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          updateDropdownPosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center justify-between gap-2 ${
          error ? "border-red-500" : "border-slate-600 hover:border-slate-500"
        }`}
      >
        <span className="flex items-center gap-3 flex-1 min-w-0">
          <Ship className={`h-4 w-4 flex-shrink-0 ${selectedEmb ? "text-blue-400" : "text-slate-400"}`} />
          {selectedEmb ? (
            <span className="text-slate-200 truncate">
              {selectedEmb.nombre}
              <span className="text-slate-400 ml-2">
                Cap: {selectedEmb.capacidad}
                {selectedEmb.tipo && ` — ${selectedEmb.tipo}`}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">Sin embarcación asignada</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown con portal para evitar problemas de overflow */}
      {typeof window !== "undefined" && dropdownContent && createPortal(dropdownContent, document.body)}

      {/* Indicador de estado */}
      {value && (
        <span className="flex items-center gap-1.5 text-xs">
          {ocupadas.has(value) ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-400">Embarcación con operador activo</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Embarcación disponible</span>
            </>
          )}
        </span>
      )}

      {!value && (
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Ship className="h-3.5 w-3.5" />
          <span>Puede asignar embarcación después</span>
        </span>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
