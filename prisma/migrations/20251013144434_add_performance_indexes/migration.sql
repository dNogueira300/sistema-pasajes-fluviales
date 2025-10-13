-- CreateIndex
CREATE INDEX "clientes_apellido_idx" ON "public"."clientes"("apellido");

-- CreateIndex
CREATE INDEX "configuraciones_clave_idx" ON "public"."configuraciones"("clave");

-- CreateIndex
CREATE INDEX "embarcaciones_estado_idx" ON "public"."embarcaciones"("estado");

-- CreateIndex
CREATE INDEX "puertos_embarque_activo_idx" ON "public"."puertos_embarque"("activo");

-- CreateIndex
CREATE INDEX "puertos_embarque_orden_idx" ON "public"."puertos_embarque"("orden");

-- CreateIndex
CREATE INDEX "rutas_activa_idx" ON "public"."rutas"("activa");

-- CreateIndex
CREATE INDEX "rutas_puertoOrigen_puertoDestino_idx" ON "public"."rutas"("puertoOrigen", "puertoDestino");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_username_idx" ON "public"."usuarios"("username");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "public"."usuarios"("activo");

-- CreateIndex
CREATE INDEX "usuarios_email_activo_idx" ON "public"."usuarios"("email", "activo");

-- CreateIndex
CREATE INDEX "usuarios_username_activo_idx" ON "public"."usuarios"("username", "activo");

-- CreateIndex
CREATE INDEX "ventas_userId_fechaVenta_idx" ON "public"."ventas"("userId", "fechaVenta");

-- CreateIndex
CREATE INDEX "ventas_rutaId_idx" ON "public"."ventas"("rutaId");

-- CreateIndex
CREATE INDEX "ventas_embarcacionId_idx" ON "public"."ventas"("embarcacionId");
