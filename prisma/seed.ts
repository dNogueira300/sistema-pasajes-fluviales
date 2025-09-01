import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos...");

  // 1. CREAR USUARIOS INICIALES
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

  // 2. CREAR RUTAS INICIALES
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

  // 3. CREAR EMBARCACIONES
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

  // 4. ASIGNAR EMBARCACIONES A RUTAS
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

  // 5. CLIENTES DE PRUEBA
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

  // 6. CONFIGURACIONES INICIALES DEL SISTEMA
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
