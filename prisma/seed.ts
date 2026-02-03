import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed de datos...");

  // 1. CREAR PUERTOS DE EMBARQUE PRIMERO (necesarios para las ventas)
  const puertos = await Promise.all([
    prisma.puertoEmbarque.upsert({
      where: { nombre: "Puerto Principal - Malecón" },
      update: {},
      create: {
        nombre: "Puerto Principal - Malecón",
        descripcion: "Puerto principal de la ciudad",
        direccion: "Malecón Tarapacá",
        orden: 1,
      },
    }),
    prisma.puertoEmbarque.upsert({
      where: { nombre: "Embarcadero Bella Vista" },
      update: {},
      create: {
        nombre: "Embarcadero Bella Vista",
        descripcion: "Embarcadero en zona Bellavista",
        direccion: "Av. La Marina - Bellavista",
        orden: 2,
      },
    }),
    prisma.puertoEmbarque.upsert({
      where: { nombre: "Puerto Mercado" },
      update: {},
      create: {
        nombre: "Puerto Mercado",
        descripcion: "Puerto cerca al mercado central",
        direccion: "Jr. Próspero",
        orden: 3,
      },
    }),
    prisma.puertoEmbarque.upsert({
      where: { nombre: "Embarcadero Nuevo" },
      update: {},
      create: {
        nombre: "Embarcadero Nuevo",
        descripcion: "Puerto de reciente construcción",
        direccion: "Carretera Iquitos-Nauta",
        orden: 4,
      },
    }),
  ]);

  console.log("✅ Puertos de embarque creados:", puertos.length);

  // 2. CREAR USUARIOS INICIALES
  const adminPassword = await hash("admin123", 12);
  const vendedorPassword = await hash("vendedor123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@altoimpacto.com" },
    update: {},
    create: {
      email: "admin@altoimpacto.com",
      username: "admin",
      password: adminPassword,
      nombre: "Administrador",
      apellido: "Sistema",
      role: "ADMINISTRADOR",
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { email: "vendedor@altoimpacto.com" },
    update: {},
    create: {
      email: "vendedor@altoimpacto.com",
      username: "vendedor1",
      password: vendedorPassword,
      nombre: "Carlos",
      apellido: "Vendedor",
      role: "VENDEDOR",
    },
  });

  console.log("✅ Usuarios creados:", {
    admin: admin.email,
    vendedor: vendedor.email,
  });

  // 3. CREAR RUTAS INICIALES
  const rutas = await Promise.all([
    prisma.ruta.upsert({
      where: { nombre: "Iquitos - Yurimaguas" },
      update: {},
      create: {
        nombre: "Iquitos - Yurimaguas",
        puertoOrigen: "Puerto de Iquitos",
        puertoDestino: "Puerto de Yurimaguas",
        precio: 45.0,
      },
    }),
    prisma.ruta.upsert({
      where: { nombre: "Iquitos - Pucallpa" },
      update: {},
      create: {
        nombre: "Iquitos - Pucallpa",
        puertoOrigen: "Puerto de Iquitos",
        puertoDestino: "Puerto de Pucallpa",
        precio: 65.0,
      },
    }),
    prisma.ruta.upsert({
      where: { nombre: "Yurimaguas - Tarapoto" },
      update: {},
      create: {
        nombre: "Yurimaguas - Tarapoto",
        puertoOrigen: "Puerto de Yurimaguas",
        puertoDestino: "Puerto de Tarapoto",
        precio: 25.0,
      },
    }),
  ]);

  console.log("✅ Rutas creadas:", rutas.length);

  // 4. CREAR EMBARCACIONES
  const embarcaciones = await Promise.all([
    prisma.embarcacion.upsert({
      where: { nombre: "Amazonas Express" },
      update: {},
      create: {
        nombre: "Amazonas Express",
        capacidad: 50,
        tipo: "Ferry",
        estado: "ACTIVA",
      },
    }),
    prisma.embarcacion.upsert({
      where: { nombre: "Rio Veloz" },
      update: {},
      create: {
        nombre: "Rio Veloz",
        capacidad: 30,
        tipo: "Lancha",
        estado: "ACTIVA",
      },
    }),
    prisma.embarcacion.upsert({
      where: { nombre: "Ucayali Navigator" },
      update: {},
      create: {
        nombre: "Ucayali Navigator",
        capacidad: 80,
        tipo: "Ferry",
        estado: "ACTIVA",
      },
    }),
  ]);

  console.log("✅ Embarcaciones creadas:", embarcaciones.length);

  // 5. ASIGNAR EMBARCACIONES A RUTAS
  const embarcacionRutas = await Promise.all([
    // Amazonas Express: Iquitos - Yurimaguas
    prisma.embarcacionRuta.upsert({
      where: {
        embarcacionId_rutaId: {
          embarcacionId: embarcaciones[0].id,
          rutaId: rutas[0].id,
        },
      },
      update: {},
      create: {
        embarcacionId: embarcaciones[0].id,
        rutaId: rutas[0].id,
        horasSalida: ["06:00", "14:00"],
        diasOperacion: ["lunes", "miércoles", "viernes", "domingo"],
      },
    }),
    // Rio Veloz: Yurimaguas - Tarapoto
    prisma.embarcacionRuta.upsert({
      where: {
        embarcacionId_rutaId: {
          embarcacionId: embarcaciones[1].id,
          rutaId: rutas[2].id,
        },
      },
      update: {},
      create: {
        embarcacionId: embarcaciones[1].id,
        rutaId: rutas[2].id,
        horasSalida: ["08:00", "15:00"],
        diasOperacion: ["lunes", "martes", "miércoles", "jueves", "viernes"],
      },
    }),
    // Ucayali Navigator: Iquitos - Pucallpa
    prisma.embarcacionRuta.upsert({
      where: {
        embarcacionId_rutaId: {
          embarcacionId: embarcaciones[2].id,
          rutaId: rutas[1].id,
        },
      },
      update: {},
      create: {
        embarcacionId: embarcaciones[2].id,
        rutaId: rutas[1].id,
        horasSalida: ["07:00"],
        diasOperacion: ["sábado", "domingo"],
      },
    }),
  ]);

  console.log("✅ Embarcación-Rutas asignadas:", embarcacionRutas.length);

  // 6. CLIENTES DE PRUEBA
  const clientes = await Promise.all([
    prisma.cliente.upsert({
      where: { dni: "12345678" },
      update: {},
      create: {
        dni: "12345678",
        nombre: "Juan Carlos",
        apellido: "Pérez García",
        telefono: "+51987654321",
        nacionalidad: "Peruana",
        email: "juan.perez@email.com",
      },
    }),
    prisma.cliente.upsert({
      where: { dni: "87654321" },
      update: {},
      create: {
        dni: "87654321",
        nombre: "María Elena",
        apellido: "Rodriguez Silva",
        telefono: "+51987654322",
        nacionalidad: "Peruana",
        email: "maria.rodriguez@email.com",
      },
    }),
  ]);

  console.log("✅ Clientes creados:", clientes.length);

  // 7. CONFIGURACIONES INICIALES DEL SISTEMA
  const configuraciones = await Promise.all([
    prisma.configuracion.upsert({
      where: { clave: "empresa_nombre" },
      update: {},
      create: {
        clave: "empresa_nombre",
        valor: "Alto Impacto Travel",
        tipo: "STRING",
      },
    }),
    prisma.configuracion.upsert({
      where: { clave: "empresa_direccion" },
      update: {},
      create: {
        clave: "empresa_direccion",
        valor: "Jr. Fitzcarrald 513, Iquitos, Loreto",
        tipo: "STRING",
      },
    }),
    prisma.configuracion.upsert({
      where: { clave: "empresa_telefono" },
      update: {},
      create: {
        clave: "empresa_telefono",
        valor: "+51 65 123456",
        tipo: "STRING",
      },
    }),
    prisma.configuracion.upsert({
      where: { clave: "igv_porcentaje" },
      update: {},
      create: {
        clave: "igv_porcentaje",
        valor: "18",
        tipo: "NUMBER",
      },
    }),
  ]);

  console.log("✅ Configuraciones creadas:", configuraciones.length);

  // 8. VENTAS DE EJEMPLO (OPCIONAL - usando el primer puerto creado)
  const fechaViajeEjemplo = new Date();
  fechaViajeEjemplo.setDate(fechaViajeEjemplo.getDate() + 7); // Una semana desde hoy

  try {
    const ventaEjemplo = await prisma.venta.upsert({
      where: {
        numeroVenta:
          "V" +
          new Date().toISOString().slice(0, 10).replace(/-/g, "") +
          "0001",
      },
      update: {},
      create: {
        numeroVenta:
          "V" +
          new Date().toISOString().slice(0, 10).replace(/-/g, "") +
          "0001",
        clienteId: clientes[0].id,
        rutaId: rutas[0].id,
        embarcacionId: embarcaciones[0].id,
        userId: vendedor.id,
        puertoEmbarqueId: puertos[0].id, // Usar el primer puerto creado
        fechaViaje: fechaViajeEjemplo,
        horaEmbarque: "05:30",
        horaViaje: "06:00",
        cantidadPasajes: 2,
        puertoOrigen: rutas[0].puertoOrigen,
        puertoDestino: rutas[0].puertoDestino,
        precioUnitario: 45.0,
        subtotal: 90.0,
        impuestos: 0.0,
        total: 90.0,
        tipoPago: "UNICO",
        metodoPago: "EFECTIVO",
        estado: "CONFIRMADA",
        observaciones: "Venta de ejemplo creada durante el seed",
      },
    });

    console.log("✅ Venta de ejemplo creada:", ventaEjemplo.numeroVenta);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.log(
      "ℹ️  Venta de ejemplo ya existe o no se pudo crear:",
      errorMessage
    );
  }

  console.log("🎉 Seed completado exitosamente!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
