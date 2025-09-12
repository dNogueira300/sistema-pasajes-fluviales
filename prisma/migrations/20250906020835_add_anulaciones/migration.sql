-- CreateTable
CREATE TABLE "public"."anulaciones" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "usuarioId" TEXT NOT NULL,
    "fechaAnulacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asientosLiberados" INTEGER NOT NULL,
    "montoReembolso" DECIMAL(10,2),
    "tipoAnulacion" TEXT NOT NULL DEFAULT 'ANULACION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anulaciones_ventaId_key" ON "public"."anulaciones"("ventaId");

-- AddForeignKey
ALTER TABLE "public"."anulaciones" ADD CONSTRAINT "anulaciones_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "public"."ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anulaciones" ADD CONSTRAINT "anulaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
