-- CreateEnum
CREATE TYPE "public"."EstadoEmbarque" AS ENUM ('PENDIENTE', 'EMBARCADO', 'NO_EMBARCADO');

-- CreateEnum
CREATE TYPE "public"."TipoRegistro" AS ENUM ('EMBARQUE', 'DESEMBARQUE');

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'OPERADOR_EMBARCACION';

-- AlterTable
ALTER TABLE "public"."usuarios" ADD COLUMN     "embarcacionAsignadaId" TEXT,
ADD COLUMN     "estadoOperador" TEXT,
ADD COLUMN     "fechaAsignacion" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."control_embarque" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "embarcacionId" TEXT NOT NULL,
    "rutaId" TEXT NOT NULL,
    "fechaViaje" TIMESTAMP(3) NOT NULL,
    "horaViaje" TEXT NOT NULL,
    "estadoEmbarque" "public"."EstadoEmbarque" NOT NULL DEFAULT 'PENDIENTE',
    "tipoRegistro" "public"."TipoRegistro" NOT NULL DEFAULT 'EMBARQUE',
    "horaRegistro" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_embarque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "control_embarque_ventaId_key" ON "public"."control_embarque"("ventaId");

-- CreateIndex
CREATE INDEX "control_embarque_ventaId_idx" ON "public"."control_embarque"("ventaId");

-- CreateIndex
CREATE INDEX "control_embarque_operadorId_idx" ON "public"."control_embarque"("operadorId");

-- CreateIndex
CREATE INDEX "control_embarque_embarcacionId_idx" ON "public"."control_embarque"("embarcacionId");

-- CreateIndex
CREATE INDEX "control_embarque_rutaId_idx" ON "public"."control_embarque"("rutaId");

-- CreateIndex
CREATE INDEX "control_embarque_fechaViaje_idx" ON "public"."control_embarque"("fechaViaje");

-- CreateIndex
CREATE INDEX "control_embarque_horaViaje_idx" ON "public"."control_embarque"("horaViaje");

-- CreateIndex
CREATE INDEX "control_embarque_estadoEmbarque_idx" ON "public"."control_embarque"("estadoEmbarque");

-- CreateIndex
CREATE INDEX "control_embarque_embarcacionId_fechaViaje_horaViaje_idx" ON "public"."control_embarque"("embarcacionId", "fechaViaje", "horaViaje");

-- CreateIndex
CREATE INDEX "control_embarque_embarcacionId_fechaViaje_estadoEmbarque_idx" ON "public"."control_embarque"("embarcacionId", "fechaViaje", "estadoEmbarque");

-- CreateIndex
CREATE INDEX "control_embarque_operadorId_fechaViaje_idx" ON "public"."control_embarque"("operadorId", "fechaViaje");

-- CreateIndex
CREATE INDEX "usuarios_embarcacionAsignadaId_idx" ON "public"."usuarios"("embarcacionAsignadaId");

-- CreateIndex
CREATE INDEX "usuarios_role_estadoOperador_idx" ON "public"."usuarios"("role", "estadoOperador");

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_embarcacionAsignadaId_fkey" FOREIGN KEY ("embarcacionAsignadaId") REFERENCES "public"."embarcaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."control_embarque" ADD CONSTRAINT "control_embarque_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "public"."ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."control_embarque" ADD CONSTRAINT "control_embarque_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."control_embarque" ADD CONSTRAINT "control_embarque_embarcacionId_fkey" FOREIGN KEY ("embarcacionId") REFERENCES "public"."embarcaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."control_embarque" ADD CONSTRAINT "control_embarque_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "public"."rutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
