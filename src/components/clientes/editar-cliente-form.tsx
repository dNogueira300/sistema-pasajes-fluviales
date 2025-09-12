"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

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

      setCodigoPais(codigo);
      setFormulario({
        dni: cliente.dni,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        telefono: telefono,
        email: cliente.email || "",
        nacionalidad: cliente.nacionalidad,
        direccion: cliente.direccion || "",
      });
    }
  }, [isOpen, cliente]);

  const formatearTelefonoCompleto = () => {
    if (!formulario.telefono) return "";
    return `${codigoPais}${formulario.telefono}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente) return;

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
  };

  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Editar Cliente
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI *
              </label>
              <input
                type="text"
                required
                value={formulario.dni}
                onChange={(e) => handleInputChange("dni", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formulario.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={formulario.apellido}
                  onChange={(e) =>
                    handleInputChange("apellido", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <div className="flex">
                <select
                  value={codigoPais}
                  onChange={(e) => setCodigoPais(e.target.value)}
                  className="w-32 px-2 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 border-r-0 text-sm"
                >
                  {codigosPaises.map((item) => (
                    <option key={item.codigo} value={item.codigo}>
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="987654321"
                  maxLength={9}
                />
              </div>
              {formulario.telefono && (
                <div className="mt-1 text-xs text-gray-500">
                  Teléfono completo: {formatearTelefonoCompleto()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formulario.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nacionalidad
              </label>
              <select
                value={formulario.nacionalidad}
                onChange={(e) =>
                  handleInputChange("nacionalidad", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                {nacionalidadesCompletas.map((nacionalidad) => (
                  <option key={nacionalidad} value={nacionalidad}>
                    {nacionalidad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                value={formulario.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Actualizar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
