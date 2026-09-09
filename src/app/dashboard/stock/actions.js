'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/auth/actions'
import { revalidatePath } from 'next/cache'

/**
 * Ajuste directo de stock físico con registro en histórico de auditoría
 */
export async function adjustStock(formData) {
    const user = await getCurrentUser()
    if (!user) {
        return { error: 'No autorizado. Por favor inicia sesión.' }
    }

    const codigo = formData.get('codigo')?.toString().trim()
    const nuevoStockRaw = formData.get('nuevo_stock')?.toString().trim()
    const motivo = formData.get('motivo')?.toString().trim() || 'AJUSTE'
    const observacion = formData.get('observacion')?.toString().trim() || null

    if (!codigo || nuevoStockRaw === '' || nuevoStockRaw === undefined) {
        return { error: 'Debes especificar el producto y la nueva cantidad de stock.' }
    }

    const nuevo_stock = parseInt(nuevoStockRaw, 10)

    if (isNaN(nuevo_stock) || nuevo_stock < 0) {
        return { error: 'El stock ingresado debe ser un número entero no negativo (>= 0).' }
    }

    const motivosValidos = ['AJUSTE', 'COMPRA', 'MERMA', 'DEVOLUCION', 'VENTA']
    if (!motivosValidos.includes(motivo)) {
        return { error: 'El motivo seleccionado no es válido.' }
    }

    try {
        const producto = await prisma.producto.findUnique({
            where: { codigo },
        })

        if (!producto) {
            return { error: 'El producto seleccionado no existe en el catálogo.' }
        }

        const stock_original = producto.unidades_totales

        // Ejecutar actualización de inventario y registro de histórico atómicamente
        await prisma.$transaction(async (tx) => {
            await tx.producto.update({
                where: { codigo },
                data: {
                    unidades_totales: nuevo_stock,
                },
            })

            await tx.historicoCambiosStock.create({
                data: {
                    id_usuario: user.id,
                    cod_producto: codigo,
                    stock_original,
                    stock_nuevo: nuevo_stock,
                    motivo,
                    observacion: observacion || `Ajuste manual de inventario (${stock_original} -> ${nuevo_stock})`,
                },
            })
        })

        revalidatePath('/dashboard/stock')
        revalidatePath('/dashboard/productos')
        revalidatePath('/dashboard')
        revalidatePath('/pos')

        const diferencia = nuevo_stock - stock_original
        const difSigno = diferencia >= 0 ? `+${diferencia}` : `${diferencia}`

        return {
            success: `Stock de "${producto.nombre}" actualizado correctamente de ${stock_original} a ${nuevo_stock} unidades (${difSigno}).`,
        }
    } catch (error) {
        console.error('Error al ajustar stock:', error)
        return { error: 'Ocurrió un error al registrar el ajuste de stock.' }
    }
}
