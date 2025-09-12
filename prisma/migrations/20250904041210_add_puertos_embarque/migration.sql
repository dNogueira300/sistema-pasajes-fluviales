/*
  Warnings:

  - Added the required column `puertoEmbarqueId` to the `ventas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ventas" ADD COLUMN     "metodosPago" JSONB,
ADD COLUMN     "puertoEmbarqueId" TEXT NOT NULL,
ADD COLUMN     "tipoPago" TEXT NOT NULL DEFAULT 'UNICO';

-- CreateTable
CREATE TABLE "public"."puertos_embarque" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puertos_embarque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "puertos_embarque_nombre_key" ON "public"."puertos_embarque"("nombre");

-- AddForeignKey
ALTER TABLE "public"."ventas" ADD CONSTRAINT "ventas_puertoEmbarqueId_fkey" FOREIGN KEY ("puertoEmbarqueId") REFERENCES "public"."puertos_embarque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
