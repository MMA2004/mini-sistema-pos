'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/auth/actions'
import { revalidatePath } from 'next/cache'

/**
 * Crear nuevo producto con código SKU único, categoría, precio, descripción y stock inicial
 */
export async function createProducto(formData) {
    const user = await getCurrentUser()
    if (!user) {
        return { error: 'No autorizado. Por favor inicia sesión.' }
    }

    const codigo = formData.get('codigo')?.toString().trim().toUpperCase()
    const nombre = formData.get('nombre')?.toString().trim()
    const id_categoria = parseInt(formData.get('id_categoria'), 10)
    const precio_unitario = parseFloat(formData.get('precio_unitario'))
    const descripcion = formData.get('descripcion')?.toString().trim() || null
    const stock_inicial = parseInt(formData.get('stock_inicial') || '0', 10)
    const stock_minimo = parseInt(formData.get('stock_minimo') || '5', 10)

    if (!codigo || !nombre || isNaN(id_categoria) || isNaN(precio_unitario)) {
        return { error: 'Por favor completa todos los campos obligatorios.' }
    }

    if (precio_unitario <= 0) {
        return { error: 'El precio unitario debe ser mayor a 0.' }
    }

    if (stock_inicial < 0 || stock_minimo < 0) {
        return { error: 'El stock no puede ser un valor negativo.' }
    }

    try {
        const existing = await prisma.producto.findUnique({
            where: { codigo },
        })

        if (existing) {
            return { error: `Ya existe un producto con el código o SKU "${codigo}".` }
        }

        // Crear producto y opcionalmente movimiento inicial de stock
        await prisma.$transaction(async (tx) => {
            const prod = await tx.producto.create({
                data: {
                    codigo,
                    nombre,
                    descripcion,
                    id_categoria,
                    precio_unitario,
                    unidades_totales: stock_inicial,
                    stock_minimo,
                    activo: true,
                },
            })

            if (stock_inicial > 0) {
                await tx.historicoCambiosStock.create({
                    data: {
                        id_usuario: user.id,
                        cod_producto: prod.codigo,
                        stock_original: 0,
                        stock_nuevo: stock_inicial,
                        motivo: 'AJUSTE',
                        observacion: 'Inventario inicial al dar de alta el producto',
                    },
                })
            }
        })

        revalidatePath('/dashboard/productos')
        revalidatePath('/dashboard/stock')
        revalidatePath('/dashboard')
        revalidatePath('/pos')

        return { success: `Producto "${nombre}" registrado con éxito.` }
    } catch (error) {
        console.error('Error al crear producto:', error)
        return { error: 'Ocurrió un error al guardar el producto.' }
    }
}

/**
 * Actualizar datos de un producto (nombre, descripción, precio, categoría, stock mínimo)
 */
export async function updateProducto(formData) {
    const user = await getCurrentUser()
    if (!user) {
        return { error: 'No autorizado. Por favor inicia sesión.' }
    }

    const codigo = formData.get('codigo')?.toString().trim().toUpperCase()
    const nombre = formData.get('nombre')?.toString().trim()
    const id_categoria = parseInt(formData.get('id_categoria'), 10)
    const precio_unitario = parseFloat(formData.get('precio_unitario'))
    const descripcion = formData.get('descripcion')?.toString().trim() || null
    const stock_minimo = parseInt(formData.get('stock_minimo') || '5', 10)

    if (!codigo || !nombre || isNaN(id_categoria) || isNaN(precio_unitario)) {
        return { error: 'Por favor completa todos los campos obligatorios.' }
    }

    if (precio_unitario <= 0) {
        return { error: 'El precio unitario debe ser mayor a 0.' }
    }

    if (stock_minimo < 0) {
        return { error: 'El stock mínimo no puede ser negativo.' }
    }

    try {
        await prisma.producto.update({
            where: { codigo },
            data: {
                nombre,
                id_categoria,
                precio_unitario,
                descripcion,
                stock_minimo,
            },
        })

        revalidatePath('/dashboard/productos')
        revalidatePath('/dashboard/stock')
        revalidatePath('/dashboard')
        revalidatePath('/pos')

        return { success: 'Producto actualizado con éxito.' }
    } catch (error) {
        console.error('Error al actualizar producto:', error)
        return { error: 'Ocurrió un error al actualizar el producto.' }
    }
}

/**
 * Desactivación / Reactivación lógica de producto (activo = false / true)
 */
export async function toggleProductoActivo(codigo, nuevoEstado) {
    const user = await getCurrentUser()
    if (!user) {
        return { error: 'No autorizado. Por favor inicia sesión.' }
    }

    try {
        await prisma.producto.update({
            where: { codigo },
            data: { activo: nuevoEstado },
        })

        revalidatePath('/dashboard/productos')
        revalidatePath('/dashboard/stock')
        revalidatePath('/dashboard')
        revalidatePath('/pos')

        return {
            success: nuevoEstado
                ? 'Producto reactivado en el catálogo y punto de venta.'
                : 'Producto desactivado lógicamente (se preserva en el historial de ventas).',
        }
    } catch (error) {
        console.error('Error al cambiar estado del producto:', error)
        return { error: 'Ocurrió un error al cambiar el estado del producto.' }
    }
}
