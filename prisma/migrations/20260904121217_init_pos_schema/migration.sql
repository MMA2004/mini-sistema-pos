/*
  Warnings:

  - You are about to drop the `TestConnection` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CAJERO', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('VENTA', 'COMPRA', 'AJUSTE', 'MERMA', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'OTRO');

-- DropTable
DROP TABLE "TestConnection";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "correo" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "apellido" VARCHAR(50) NOT NULL,
    "cedula" VARCHAR(20),
    "rol" "Rol" NOT NULL DEFAULT 'CAJERO',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "Producto" (
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(15,2) NOT NULL,
    "unidades_totales" INTEGER NOT NULL DEFAULT 0,
    "unidades_reservadas" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "HistoricoCambiosStock" (
    "id_cambio" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" UUID NOT NULL,
    "cod_producto" VARCHAR(50) NOT NULL,
    "stock_original" INTEGER NOT NULL,
    "stock_nuevo" INTEGER NOT NULL,
    "motivo" "TipoMovimientoStock" NOT NULL DEFAULT 'AJUSTE',
    "observacion" VARCHAR(200),

    CONSTRAINT "HistoricoCambiosStock_pkey" PRIMARY KEY ("id_cambio")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id_venta" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_vendedor" UUID NOT NULL,
    "ced_cliente" VARCHAR(20),
    "nombre_cliente" VARCHAR(80),
    "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id_venta")
);

-- CreateTable
CREATE TABLE "VentaProducto" (
    "id_venta" INTEGER NOT NULL,
    "cod_producto" VARCHAR(50) NOT NULL,
    "precio_unitario" DECIMAL(15,2) NOT NULL,
    "unidades" INTEGER NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "VentaProducto_pkey" PRIMARY KEY ("id_venta","cod_producto")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cedula_key" ON "Usuario"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE INDEX "Producto_id_categoria_idx" ON "Producto"("id_categoria");

-- CreateIndex
CREATE INDEX "Producto_nombre_idx" ON "Producto"("nombre");

-- CreateIndex
CREATE INDEX "HistoricoCambiosStock_cod_producto_idx" ON "HistoricoCambiosStock"("cod_producto");

-- CreateIndex
CREATE INDEX "HistoricoCambiosStock_fecha_idx" ON "HistoricoCambiosStock"("fecha");

-- CreateIndex
CREATE INDEX "Venta_fecha_idx" ON "Venta"("fecha");

-- CreateIndex
CREATE INDEX "Venta_id_vendedor_idx" ON "Venta"("id_vendedor");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "Categoria"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoCambiosStock" ADD CONSTRAINT "HistoricoCambiosStock_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoCambiosStock" ADD CONSTRAINT "HistoricoCambiosStock_cod_producto_fkey" FOREIGN KEY ("cod_producto") REFERENCES "Producto"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_id_vendedor_fkey" FOREIGN KEY ("id_vendedor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaProducto" ADD CONSTRAINT "VentaProducto_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "Venta"("id_venta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaProducto" ADD CONSTRAINT "VentaProducto_cod_producto_fkey" FOREIGN KEY ("cod_producto") REFERENCES "Producto"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;
