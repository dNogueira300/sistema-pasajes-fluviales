-- CreateTable
CREATE TABLE "public"."contador_ventas" (
    "id" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contador_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contador_ventas_fecha_key" ON "public"."contador_ventas"("fecha");

-- CreateIndex
CREATE INDEX "contador_ventas_fecha_idx" ON "public"."contador_ventas"("fecha");

-- CreateIndex
CREATE INDEX "clientes_dni_idx" ON "public"."clientes"("dni");

-- CreateIndex
CREATE INDEX "clientes_nombre_apellido_idx" ON "public"."clientes"("nombre", "apellido");

-- CreateIndex
CREATE INDEX "ventas_fechaVenta_idx" ON "public"."ventas"("fechaVenta");

-- CreateIndex
CREATE INDEX "ventas_estado_idx" ON "public"."ventas"("estado");

-- CreateIndex
CREATE INDEX "ventas_rutaId_embarcacionId_fechaViaje_horaViaje_estado_idx" ON "public"."ventas"("rutaId", "embarcacionId", "fechaViaje", "horaViaje", "estado");

-- CreateIndex
CREATE INDEX "ventas_clienteId_idx" ON "public"."ventas"("clienteId");

-- CreateIndex
CREATE INDEX "ventas_numeroVenta_idx" ON "public"."ventas"("numeroVenta");

-- CreateIndex
CREATE INDEX "ventas_userId_idx" ON "public"."ventas"("userId");

-- CreateIndex
CREATE INDEX "ventas_fechaVenta_estado_idx" ON "public"."ventas"("fechaVenta", "estado");
