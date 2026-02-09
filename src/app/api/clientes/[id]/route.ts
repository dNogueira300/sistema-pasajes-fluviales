// api/clientes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getClientePorId,
  actualizarCliente,
  eliminarCliente,
} from "@/lib/actions/clientes";
import { actualizarClienteSchema } from "@/lib/validations/cliente";

// GET - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const clienteId = params.id;

    const cliente = await getClientePorId(clienteId);

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error obteniendo cliente:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const clienteId = params.id;
    const body = await request.json();

    const validacion = actualizarClienteSchema.safeParse(body);
    if (!validacion.success) {
      const primerError = validacion.error.issues[0];
      return NextResponse.json(
        { error: primerError.message },
        { status: 400 }
      );
    }

    const { dni, nombre, apellido, telefono, email, nacionalidad, direccion } =
      validacion.data;

    const cliente = await actualizarCliente(clienteId, {
      dni,
      nombre,
      apellido,
      telefono,
      email,
      nacionalidad,
      direccion,
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error actualizando cliente:", error);

    // Manejar error de DNI duplicado
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe otro cliente con ese DNI" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Cliente no encontrado") {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden eliminar clientes
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar clientes" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const clienteId = params.id;

    await eliminarCliente(clienteId);

    return NextResponse.json({
      success: true,
      mensaje: "Cliente eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando cliente:", error);

    if (error instanceof Error && error.message === "Cliente no encontrado") {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("tiene ventas asociadas")
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el cliente porque tiene ventas asociadas",
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
