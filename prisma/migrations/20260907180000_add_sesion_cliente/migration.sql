-- AlterTable
ALTER TABLE "Sesion" ADD COLUMN     "clienteId" TEXT;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
