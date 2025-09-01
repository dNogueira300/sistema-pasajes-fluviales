/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `rutas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "rutas_nombre_key" ON "public"."rutas"("nombre");
