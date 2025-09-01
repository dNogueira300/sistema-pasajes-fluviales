-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMINISTRADOR', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "public"."EstadoEmbarcacion" AS ENUM ('ACTIVA', 'MANTENIMIENTO', 'INACTIVA');

-- CreateEnum
CREATE TYPE "public"."EstadoVenta" AS ENUM ('CONFIRMADA', 'ANULADA', 'REEMBOLSADA');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'VENDEDOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rutas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "puertoOrigen" TEXT NOT NULL,
    "puertoDestino" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."embarcaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "estado" "public"."EstadoEmbarcacion" NOT NULL DEFAULT 'ACTIVA',
    "tipo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embarcaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."embarcacion_rutas" (
    "id" TEXT NOT NULL,
    "embarcacionId" TEXT NOT NULL,
    "rutaId" TEXT NOT NULL,
    "horasSalida" TEXT[],
    "diasOperacion" TEXT[],
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embarcacion_rutas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clientes" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "nacionalidad" TEXT NOT NULL DEFAULT 'Peruana',
    "email" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ventas" (
    "id" TEXT NOT NULL,
    "numeroVenta" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "rutaId" TEXT NOT NULL,
    "embarcacionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fechaViaje" TIMESTAMP(3) NOT NULL,
    "horaEmbarque" TEXT NOT NULL,
    "horaViaje" TEXT NOT NULL,
    "cantidadPasajes" INTEGER NOT NULL DEFAULT 1,
    "puertoOrigen" TEXT NOT NULL,
    "puertoDestino" TEXT NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "public"."EstadoVenta" NOT NULL DEFAULT 'CONFIRMADA',
    "metodoPago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "observaciones" TEXT,
    "fechaVenta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."configuraciones" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'STRING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "public"."usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "embarcaciones_nombre_key" ON "public"."embarcaciones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "embarcacion_rutas_embarcacionId_rutaId_key" ON "public"."embarcacion_rutas"("embarcacionId", "rutaId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_dni_key" ON "public"."clientes"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_numeroVenta_key" ON "public"."ventas"("numeroVenta");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "public"."configuraciones"("clave");

-- AddForeignKey
ALTER TABLE "public"."embarcacion_rutas" ADD CONSTRAINT "embarcacion_rutas_embarcacionId_fkey" FOREIGN KEY ("embarcacionId") REFERENCES "public"."embarcaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."embarcacion_rutas" ADD CONSTRAINT "embarcacion_rutas_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "public"."rutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ventas" ADD CONSTRAINT "ventas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ventas" ADD CONSTRAINT "ventas_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "public"."rutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ventas" ADD CONSTRAINT "ventas_embarcacionId_fkey" FOREIGN KEY ("embarcacionId") REFERENCES "public"."embarcaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ventas" ADD CONSTRAINT "ventas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
