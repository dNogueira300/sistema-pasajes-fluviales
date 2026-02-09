"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface Cliente {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  nacionalidad: string;
  direccion?: string;
}

interface EditarClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, datos: DatosCliente) => Promise<boolean>;
  cliente: Cliente | null;
  loading?: boolean;
  error?: string | null;
}

interface DatosCliente {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  nacionalidad: string;
  direccion: string;
}

const codigosPaises = [
  { codigo: "+51", pais: "Perú", bandera: "🇵🇪" },
  { codigo: "+55", pais: "Brasil", bandera: "🇧🇷" },
  { codigo: "+57", pais: "Colombia", bandera: "🇨🇴" },
  { codigo: "+593", pais: "Ecuador", bandera: "🇪🇨" },
  { codigo: "+591", pais: "Bolivia", bandera: "🇧🇴" },
  { codigo: "+1", pais: "Estados Unidos", bandera: "🇺🇸" },
  { codigo: "+34", pais: "España", bandera: "🇪🇸" },
  { codigo: "+33", pais: "Francia", bandera: "🇫🇷" },
  { codigo: "+49", pais: "Alemania", bandera: "🇩🇪" },
  { codigo: "+39", pais: "Italia", bandera: "🇮🇹" },
  { codigo: "+54", pais: "Argentina", bandera: "🇦🇷" },
  { codigo: "+56", pais: "Chile", bandera: "🇨🇱" },
  { codigo: "+598", pais: "Uruguay", bandera: "🇺🇾" },
];

const nacionalidadesCompletas = [
  "Peruana",
  "Argentina",
  "Boliviana",
  "Brasileña",
  "Chilena",
  "Colombiana",
  "Ecuatoriana",
  "Paraguaya",
  "Uruguaya",
  "Venezolana",
  "Estadounidense",
  "Canadiense",
  "Mexicana",
  "Española",
  "Francesa",
  "Italiana",
  "Alemana",
  "Británica",
  "Portuguesa",
  "Holandesa",
  "Belga",
  "Suiza",
  "Austriaca",
  "Sueca",
  "Noruega",
  "Danesa",
  "Finlandesa",
  "Rusa",
  "China",
  "Japonesa",
  "Coreana",
  "India",
  "Australiana",
  "Neozelandesa",
  "Sudafricana",
  "Israelí",
  "Turca",
  "Griega",
  "Polaca",
  "Checa",
  "Húngara",
  "Rumana",
  "Búlgara",
  "Croata",
  "Eslovena",
  "Eslovaca",
  "Estonia",
  "Letona",
  "Lituana",
  "Otra",
];

export default function EditarClienteForm({
  isOpen,
  onClose,
  onSubmit,
  cliente,
  loading = false,
}: EditarClienteFormProps) {
  const [formulario, setFormulario] = useState<DatosCliente>({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    nacionalidad: "Peruana",
    direccion: "",
  });

  const [codigoPais, setCodigoPais] = useState("+51");
  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  // Store initial values for change tracking
  const [initialValues, setInitialValues] = useState<DatosCliente & { codigoPais: string }>({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    nacionalidad: "Peruana",
    direccion: "",
    codigoPais: "+51",
  });

  // Efecto para cargar datos del cliente cuando se abre el modal
  useEffect(() => {
    if (isOpen && cliente) {
      // Separar código de país del teléfono si existe
      let telefono = cliente.telefono || "";
      let codigo = "+51"; // Por defecto Perú

      if (telefono) {
        // Buscar si el teléfono tiene algún código de país conocido
        const codigoEncontrado = codigosPaises.find((item) =>
          telefono.startsWith(item.codigo)
        );

        if (codigoEncontrado) {
          codigo = codigoEncontrado.codigo;
          telefono = telefono.substring(codigoEncontrado.codigo.length);
        }
      }

      const newFormulario = {
        dni: cliente.dni,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        telefono: telefono,
        email: cliente.email || "",
        nacionalidad: cliente.nacionalidad,
        direccion: cliente.direccion || "",
      };

      setCodigoPais(codigo);
      setFormulario(newFormulario);
      setInitialValues({
        ...newFormulario,
        codigoPais: codigo,
      });
    }
  }, [isOpen, cliente]);

  // Track if form has changes
  const hasChanges = useMemo(() => {
    return (
      formulario.dni !== initialValues.dni ||
      formulario.nombre !== initialValues.nombre ||
      formulario.apellido !== initialValues.apellido ||
      formulario.telefono !== initialValues.telefono ||
      formulario.email !== initialValues.email ||
      formulario.nacionalidad !== initialValues.nacionalidad ||
      formulario.direccion !== initialValues.direccion ||
      codigoPais !== initialValues.codigoPais
    );
  }, [formulario, codigoPais, initialValues]);

  const formatearTelefonoCompleto = () => {
    if (!formulario.telefono) return "";
    return `${codigoPais}${formulario.telefono}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente) return;

    // Validar que el DNI tenga al menos 1 carácter
    if (!formulario.dni.trim()) {
      alert("El documento de identidad es obligatorio");
      return;
    }

    // Validar nombre
    if (!formulario.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    } else if (formulario.nombre.trim().length < 2) {
      alert("El nombre debe tener al menos 2 caracteres");
      return;
    } else if (formulario.nombre.trim().length > 50) {
      alert("El nombre no puede tener más de 50 caracteres");
      return;
    }

    // Validar apellido
    if (!formulario.apellido.trim()) {
      alert("El apellido es obligatorio");
      return;
    } else if (formulario.apellido.trim().length < 2) {
      alert("El apellido debe tener al menos 2 caracteres");
      return;
    } else if (formulario.apellido.trim().length > 50) {
      alert("El apellido no puede tener más de 50 caracteres");
      return;
    }

    // Preparar datos con teléfono completo
    const datosCliente = {
      ...formulario,
      telefono: formulario.telefono ? formatearTelefonoCompleto() : "",
    };

    const resultado = await onSubmit(cliente.id, datosCliente);

    if (resultado) {
      onClose();
    }
  };

  const handleInputChange = (field: keyof DatosCliente, value: string) => {
    setFormulario((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validación en tiempo real para nombre y apellido
    if (field === "nombre") {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0 && trimmedValue.length < 2) {
        setErroresValidacion((prev) => ({
          ...prev,
          nombre: "El nombre debe tener al menos 2 caracteres",
        }));
      } else if (trimmedValue.length > 50) {
        setErroresValidacion((prev) => ({
          ...prev,
          nombre: "El nombre no puede tener más de 50 caracteres",
        }));
      } else {
        setErroresValidacion((prev) => ({
          ...prev,
          nombre: "",
        }));
      }
    } else if (field === "apellido") {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0 && trimmedValue.length < 2) {
        setErroresValidacion((prev) => ({
          ...prev,
          apellido: "El apellido debe tener al menos 2 caracteres",
        }));
      } else if (trimmedValue.length > 50) {
        setErroresValidacion((prev) => ({
          ...prev,
          apellido: "El apellido no puede tener más de 50 caracteres",
        }));
      } else {
        setErroresValidacion((prev) => ({
          ...prev,
          apellido: "",
        }));
      }
    }
  };

  // Función específica para manejar el cambio en el campo DNI
  const handleDniChange = (value: string) => {
    // Permitir solo números y máximo 10 caracteres
    const soloNumeros = value.replace(/\D/g, "");
    const dniLimitado = soloNumeros.slice(0, 10);
    handleInputChange("dni", dniLimitado);
  };

  if (!cliente) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Cliente"
      hasChanges={hasChanges}
      footer={
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Actualizar</span>
          </button>
        </div>
      }
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Doc. Identidad *
            </label>
            <input
              type="text"
              required
              value={formulario.dni}
              onChange={(e) => handleDniChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
              placeholder="12345678"
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <div className="mt-1 text-xs text-slate-400">
              {formulario.dni.length}/10 caracteres (solo números)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formulario.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                  erroresValidacion.nombre
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-slate-600/50 focus:border-blue-500"
                }`}
                placeholder="Juan"
              />
              {erroresValidacion.nombre && (
                <p className="mt-1 text-sm text-red-400">
                  {erroresValidacion.nombre}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={formulario.apellido}
                onChange={(e) =>
                  handleInputChange("apellido", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                  erroresValidacion.apellido
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-slate-600/50 focus:border-blue-500"
                }`}
                placeholder="Pérez"
              />
              {erroresValidacion.apellido && (
                <p className="mt-1 text-sm text-red-400">
                  {erroresValidacion.apellido}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Teléfono
            </label>
            <div className="flex">
              <select
                value={codigoPais}
                onChange={(e) => setCodigoPais(e.target.value)}
                className="w-32 px-3 py-3 border border-slate-600/50 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 border-r-0 text-sm backdrop-blur-md transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
              >
                {codigosPaises.map((item) => (
                  <option
                    key={item.codigo}
                    value={item.codigo}
                    className="bg-slate-800 text-slate-100"
                  >
                    {item.bandera} {item.codigo}
                  </option>
                ))}
              </select>

              <input
                type="tel"
                value={formulario.telefono}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  handleInputChange("telefono", value);
                }}
                className="flex-1 px-4 py-3 border border-slate-600/50 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-md transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
                placeholder="987654321"
                maxLength={9}
              />
            </div>

            {formulario.telefono && (
              <div className="mt-2 text-xs text-slate-400">
                Teléfono completo:{" "}
                <span className="text-slate-300">
                  {formatearTelefonoCompleto()}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formulario.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nacionalidad
            </label>
            <select
              value={formulario.nacionalidad}
              onChange={(e) =>
                handleInputChange("nacionalidad", e.target.value)
              }
              className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-md transition-all duration-200 shadow-sm hover:border-slate-500/70 hover:bg-slate-800"
            >
              {nacionalidadesCompletas.map((nacionalidad) => (
                <option
                  key={nacionalidad}
                  value={nacionalidad}
                  className="bg-slate-800 text-slate-100"
                >
                  {nacionalidad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dirección
            </label>
            <textarea
              value={formulario.direccion}
              onChange={(e) => handleInputChange("direccion", e.target.value)}
              className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 resize-none backdrop-blur-sm transition-all duration-200"
              rows={2}
              placeholder="Jr. Los Olivos 123, Lima"
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
