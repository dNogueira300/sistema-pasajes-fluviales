// ============================================
// app/dashboard/configuracion/page.tsx
// ============================================
"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import {
  Save,
  Building2,
  CreditCard,
  Database,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface ConfigData {
  EMPRESA_NOMBRE: string;
  EMPRESA_RUC: string;
  EMPRESA_DIRECCION: string;
  EMPRESA_TELEFONO: string;
  EMPRESA_EMAIL: string;
  EMPRESA_HORARIO: string;
  EMPRESA_LOGO_URL: string;
  PAGO_EFECTIVO_HABILITADO: string;
  PAGO_TARJETA_HABILITADO: string;
  PAGO_YAPE_HABILITADO: string;
  PAGO_PLIN_HABILITADO: string;
  PAGO_TRANSFERENCIA_HABILITADO: string;
  BACKUP_AUTOMATICO_HABILITADO: string;
  BACKUP_FRECUENCIA_DIAS: string;
  BACKUP_HORA: string;
}

export default function ConfiguracionPage() {
  useRequireAuth("ADMINISTRADOR");

  const [config, setConfig] = useState<ConfigData>({
    EMPRESA_NOMBRE: "",
    EMPRESA_RUC: "",
    EMPRESA_DIRECCION: "",
    EMPRESA_TELEFONO: "",
    EMPRESA_EMAIL: "",
    EMPRESA_HORARIO: "",
    EMPRESA_LOGO_URL: "",
    PAGO_EFECTIVO_HABILITADO: "true",
    PAGO_TARJETA_HABILITADO: "false",
    PAGO_YAPE_HABILITADO: "true",
    PAGO_PLIN_HABILITADO: "true",
    PAGO_TRANSFERENCIA_HABILITADO: "true",
    BACKUP_AUTOMATICO_HABILITADO: "false",
    BACKUP_FRECUENCIA_DIAS: "7",
    BACKUP_HORA: "02:00",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch("/api/configuracion");
      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMensaje(null);

    try {
      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMensaje({
          tipo: "success",
          texto: "Configuración guardada exitosamente",
        });
      } else {
        setMensaje({
          tipo: "error",
          texto: "Error al guardar la configuración",
        });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión" });
    } finally {
      setSaving(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const handleChange = (campo: keyof ConfigData, valor: string) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  };

  const toggleMetodoPago = (metodo: keyof ConfigData) => {
    setConfig((prev) => ({
      ...prev,
      [metodo]: prev[metodo] === "true" ? "false" : "true",
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-100">
            Configuración del Sistema
          </h1>
          <p className="text-slate-400 mt-1">
            Gestiona la información de tu empresa y preferencias del sistema
          </p>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
              mensaje.tipo === "success"
                ? "bg-green-900/30 border border-green-600/50 text-green-300"
                : "bg-red-900/30 border border-red-600/50 text-red-300"
            }`}
          >
            {mensaje.tipo === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{mensaje.texto}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la Empresa */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100">
                Información de la Empresa
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la Empresa */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de la Empresa
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={config.EMPRESA_NOMBRE}
                    onChange={(e) =>
                      handleChange("EMPRESA_NOMBRE", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Alto Impacto Travel"
                  />
                </div>
              </div>

              {/* RUC */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  RUC / Número de Identificación
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={config.EMPRESA_RUC}
                    onChange={(e) =>
                      handleChange("EMPRESA_RUC", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={config.EMPRESA_TELEFONO}
                    onChange={(e) =>
                      handleChange("EMPRESA_TELEFONO", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+51 999 999 999"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email de Contacto
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={config.EMPRESA_EMAIL}
                    onChange={(e) =>
                      handleChange("EMPRESA_EMAIL", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dirección Física
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={config.EMPRESA_DIRECCION}
                    onChange={(e) =>
                      handleChange("EMPRESA_DIRECCION", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jr. Fitzcarrald 513, Iquitos"
                  />
                </div>
              </div>

              {/* Horario */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Horario de Atención
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={config.EMPRESA_HORARIO}
                    onChange={(e) =>
                      handleChange("EMPRESA_HORARIO", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lunes a Sábado: 8:00 AM - 6:00 PM"
                  />
                </div>
              </div>

              {/* Logo (placeholder) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Logo de la Empresa
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center bg-slate-700/30">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    Función de carga de logo - Próximamente
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formato recomendado: PNG o JPG, máximo 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-600 p-2 rounded-lg mr-3">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100">
                Métodos de Pago
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  key: "PAGO_EFECTIVO_HABILITADO",
                  label: "Efectivo",
                  icon: "💵",
                },
                {
                  key: "PAGO_TARJETA_HABILITADO",
                  label: "Tarjeta",
                  icon: "💳",
                },
                { key: "PAGO_YAPE_HABILITADO", label: "Yape", icon: "📱" },
                { key: "PAGO_PLIN_HABILITADO", label: "Plin", icon: "💰" },
                {
                  key: "PAGO_TRANSFERENCIA_HABILITADO",
                  label: "Transferencia",
                  icon: "🏦",
                },
              ].map((metodo) => (
                <button
                  key={metodo.key}
                  type="button"
                  onClick={() =>
                    toggleMetodoPago(metodo.key as keyof ConfigData)
                  }
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    config[metodo.key as keyof ConfigData] === "true"
                      ? "border-green-500 bg-green-900/20"
                      : "border-slate-600 bg-slate-700/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{metodo.icon}</span>
                      <span className="font-medium text-slate-100">
                        {metodo.label}
                      </span>
                    </div>
                    {config[metodo.key as keyof ConfigData] === "true" ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Backup Automático */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-600 p-2 rounded-lg mr-3">
                <Database className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100">
                Backup Automático
              </h2>
            </div>

            <div className="space-y-4">
              {/* Habilitar/Deshabilitar */}
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                <div>
                  <h3 className="font-medium text-slate-100">
                    Habilitar Backup Automático
                  </h3>
                  <p className="text-sm text-slate-400">
                    Respalda automáticamente tu base de datos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toggleMetodoPago("BACKUP_AUTOMATICO_HABILITADO")
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.BACKUP_AUTOMATICO_HABILITADO === "true"
                      ? "bg-blue-600"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.BACKUP_AUTOMATICO_HABILITADO === "true"
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {config.BACKUP_AUTOMATICO_HABILITADO === "true" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frecuencia */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Frecuencia (días)
                    </label>
                    <select
                      value={config.BACKUP_FRECUENCIA_DIAS}
                      onChange={(e) =>
                        handleChange("BACKUP_FRECUENCIA_DIAS", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">Diario</option>
                      <option value="7">Semanal</option>
                      <option value="15">Quincenal</option>
                      <option value="30">Mensual</option>
                    </select>
                  </div>

                  {/* Hora */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hora de Ejecución
                    </label>
                    <input
                      type="time"
                      value={config.BACKUP_HORA}
                      onChange={(e) =>
                        handleChange("BACKUP_HORA", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-8 py-3 rounded-xl flex items-center space-x-2 font-medium transition-colors"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? "Guardando..." : "Guardar Configuración"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
