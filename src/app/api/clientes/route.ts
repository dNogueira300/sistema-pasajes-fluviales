// api/clientes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientes, crearCliente } from "@/lib/actions/clientes";

// GET - Obtener clientes con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const filtros = {
      busqueda: searchParams.get("busqueda"),
      nacionalidad: searchParams.get("nacionalidad"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const clientes = await getClientes(filtros);
    return NextResponse.json(clientes);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { dni, nombre, apellido, telefono, email, nacionalidad, direccion } =
      body;

    // Validaciones básicas
    if (!dni || !nombre || !apellido) {
      return NextResponse.json(
        { error: "DNI, nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    // Validar formato de DNI
    if (dni.length < 8) {
      return NextResponse.json(
        { error: "El DNI debe tener al menos 8 dígitos" },
        { status: 400 }
      );
    }

    const cliente = await crearCliente({
      dni,
      nombre,
      apellido,
      telefono: telefono || "",
      email: email || "",
      nacionalidad: nacionalidad || "Peruana",
      direccion: direccion || "",
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Error creando cliente:", error);

    // Manejar error de DNI duplicado
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese DNI" },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
