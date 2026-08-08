-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PRO', 'AGENCIA');

-- CreateEnum
CREATE TYPE "Template" AS ENUM ('LANDING', 'SERVICIOS', 'PORTFOLIO', 'RESTAURANTE', 'TIENDA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "Proveedor" AS ENUM ('FLOW', 'MERCADOPAGO', 'PAYPAL', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaPago" TIMESTAMP(3),

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sitio" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "subdominio" TEXT NOT NULL,
    "dominioPropio" TEXT,
    "template" "Template" NOT NULL,
    "configJson" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUpdate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sitio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "proveedor" "Proveedor" NOT NULL,
    "referencia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "historial" JSONB NOT NULL DEFAULT '[]',
    "datosJson" JSONB,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sitio_subdominio_key" ON "Sitio"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "Sitio_dominioPropio_key" ON "Sitio"("dominioPropio");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_sessionId_key" ON "Sesion"("sessionId");

-- AddForeignKey
ALTER TABLE "Sitio" ADD CONSTRAINT "Sitio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
