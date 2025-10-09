// hooks/use-reportes.ts
import { useState, useCallback } from "react";
import {
  FiltrosReporte,
  ReporteCompleto,
  ReporteDiario,
  OpcionesReporte,
  ConfiguracionExportacion,
  EstadoReportes,
} from "@/types/reportes";

export function useReportes() {
  const [estado, setEstado] = useState<EstadoReportes>({
    generando: false,
    progreso: 0,
    ultimaActualizacion: new Date().toISOString(),
  });

  // Generar reporte completo
  const generarReporte = useCallback(async (filtros: FiltrosReporte) => {
    setEstado((prev) => ({
      ...prev,
      generando: true,
      progreso: 0,
      error: undefined,
    }));

    try {
      setEstado((prev) => ({ ...prev, progreso: 20 }));

      const response = await fetch("/api/reportes/generar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filtros),
      });

      setEstado((prev) => ({ ...prev, progreso: 60 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar reporte");
      }

      const reporte: ReporteCompleto = await response.json();

      setEstado((prev) => ({
        ...prev,
        progreso: 100,
        ultimaActualizacion: new Date().toISOString(),
      }));

      return reporte;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setEstado((prev) => ({ ...prev, error: errorMessage, progreso: 0 }));
      return null;
    } finally {
      setTimeout(() => {
        setEstado((prev) => ({ ...prev, generando: false, progreso: 0 }));
      }, 1000);
    }
  }, []);

  // Generar reporte diario
  const generarReporteDiario = useCallback(async (fecha?: string) => {
    setEstado((prev) => ({
      ...prev,
      generando: true,
      progreso: 0,
      error: undefined,
    }));

    try {
      setEstado((prev) => ({ ...prev, progreso: 30 }));

      const params = fecha ? `?fecha=${fecha}` : "";
      const response = await fetch(`/api/reportes/diario${params}`);

      setEstado((prev) => ({ ...prev, progreso: 70 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar reporte diario");
      }

      const reporte: ReporteDiario = await response.json();

      setEstado((prev) => ({
        ...prev,
        progreso: 100,
        ultimaActualizacion: new Date().toISOString(),
      }));

      return reporte;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setEstado((prev) => ({ ...prev, error: errorMessage, progreso: 0 }));
      return null;
    } finally {
      setTimeout(() => {
        setEstado((prev) => ({ ...prev, generando: false, progreso: 0 }));
      }, 1000);
    }
  }, []);

  // Obtener opciones para filtros
  const obtenerOpciones =
    useCallback(async (): Promise<OpcionesReporte | null> => {
      try {
        const response = await fetch("/api/reportes/opciones");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al obtener opciones");
        }

        const opciones: OpcionesReporte = await response.json();
        return opciones;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setEstado((prev) => ({ ...prev, error: errorMessage }));
        return null;
      }
    }, []);

  // Exportar reporte a PDF
  const exportarPDF = useCallback(
    async (
      reporte: ReporteCompleto,
      configuracion: ConfiguracionExportacion = {
        formato: "PDF",
        incluirGraficos: true,
        incluirDetalles: true,
        orientacion: "portrait",
      }
    ) => {
      setEstado((prev) => ({
        ...prev,
        generando: true,
        progreso: 0,
        error: undefined,
      }));

      try {
        setEstado((prev) => ({ ...prev, progreso: 20 }));

        const response = await fetch("/api/reportes/exportar/pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reporte, configuracion }),
        });

        setEstado((prev) => ({ ...prev, progreso: 60 }));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al exportar PDF");
        }

        const blob = await response.blob();

        setEstado((prev) => ({ ...prev, progreso: 90 }));

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setEstado((prev) => ({ ...prev, progreso: 100 }));
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setEstado((prev) => ({ ...prev, error: errorMessage, progreso: 0 }));
        return false;
      } finally {
        setTimeout(() => {
          setEstado((prev) => ({ ...prev, generando: false, progreso: 0 }));
        }, 1000);
      }
    },
    []
  );

  // Exportar reporte a Excel
  const exportarExcel = useCallback(
    async (
      reporte: ReporteCompleto,
      configuracion: ConfiguracionExportacion = {
        formato: "EXCEL",
        incluirGraficos: false,
        incluirDetalles: true,
      }
    ) => {
      setEstado((prev) => ({
        ...prev,
        generando: true,
        progreso: 0,
        error: undefined,
      }));

      try {
        setEstado((prev) => ({ ...prev, progreso: 20 }));

        const response = await fetch("/api/reportes/exportar/excel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reporte, configuracion }),
        });

        setEstado((prev) => ({ ...prev, progreso: 60 }));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al exportar Excel");
        }

        const blob = await response.blob();

        setEstado((prev) => ({ ...prev, progreso: 90 }));

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setEstado((prev) => ({ ...prev, progreso: 100 }));
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setEstado((prev) => ({ ...prev, error: errorMessage, progreso: 0 }));
        return false;
      } finally {
        setTimeout(() => {
          setEstado((prev) => ({ ...prev, generando: false, progreso: 0 }));
        }, 1000);
      }
    },
    []
  );

  // Obtener estadísticas rápidas
  const obtenerEstadisticasRapidas = useCallback(async () => {
    try {
      const response = await fetch("/api/reportes/estadisticas-rapidas");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al obtener estadísticas");
      }

      const estadisticas = await response.json();
      return estadisticas;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setEstado((prev) => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  // Limpiar errores
  const limpiarError = useCallback(() => {
    setEstado((prev) => ({ ...prev, error: undefined }));
  }, []);

  return {
    estado,
    generarReporte,
    generarReporteDiario,
    obtenerOpciones,
    exportarPDF,
    exportarExcel,
    obtenerEstadisticasRapidas,
    limpiarError,
  };
}
