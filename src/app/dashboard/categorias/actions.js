'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Crear nueva categoría
 */
export async function createCategoria(formData) {
    const nombre = formData.get('nombre')?.toString().trim()
    const descripcion = formData.get('descripcion')?.toString().trim() || null

    if (!nombre) {
        return { error: 'El nombre de la categoría es obligatorio.' }
    }

    try {
        const existing = await prisma.categoria.findUnique({
            where: { nombre },
        })

        if (existing) {
            return { error: 'Ya existe una categoría registrada con ese nombre.' }
        }

        await prisma.categoria.create({
            data: {
                nombre,
                descripcion,
                activo: true,
            },
        })

        revalidatePath('/dashboard/categorias')
        revalidatePath('/dashboard/productos')
        revalidatePath('/dashboard')

        return { success: 'Categoría creada con éxito.' }
    } catch (error) {
        console.error('Error al crear categoría:', error)
        return { error: 'Ocurrió un error al guardar la categoría.' }
    }
}

/**
 * Actualizar categoría existente
 */
export async function updateCategoria(formData) {
    const id_categoria = parseInt(formData.get('id_categoria'), 10)
    const nombre = formData.get('nombre')?.toString().trim()
    const descripcion = formData.get('descripcion')?.toString().trim() || null

    if (!id_categoria || !nombre) {
        return { error: 'Nombre e ID de categoría son obligatorios.' }
    }

    try {
        // Verificar duplicidad de nombre en otra categoría
        const existing = await prisma.categoria.findFirst({
            where: {
                nombre,
                NOT: { id_categoria },
            },
        })

        if (existing) {
            return { error: 'Ya existe otra categoría registrada con ese nombre.' }
        }

        await prisma.categoria.update({
            where: { id_categoria },
            data: {
                nombre,
                descripcion,
            },
        })

        revalidatePath('/dashboard/categorias')
        revalidatePath('/dashboard/productos')
        revalidatePath('/dashboard')

        return { success: 'Categoría actualizada con éxito.' }
    } catch (error) {
        console.error('Error al actualizar categoría:', error)
        return { error: 'Ocurrió un error al actualizar la categoría.' }
    }
}

/**
 * Eliminar categoría (bloquea si tiene productos asociados)
 */
export async function deleteCategoria(id_categoria) {
    const id = parseInt(id_categoria, 10)

    if (!id) {
        return { error: 'ID de categoría inválido.' }
    }

    try {
        // Contar productos asociados
        const productosCount = await prisma.producto.count({
            where: { id_categoria: id },
        })

        if (productosCount > 0) {
            return {
                error: `No se puede eliminar la categoría porque tiene ${productosCount} producto(s) asociado(s). Reasigna o elimina los productos primero.`,
            }
        }

        await prisma.categoria.delete({
            where: { id_categoria: id },
        })

        revalidatePath('/dashboard/categorias')
        revalidatePath('/dashboard/productos')
        revalidatePath('/dashboard')

        return { success: 'Categoría eliminada exitosamente.' }
    } catch (error) {
        console.error('Error al eliminar categoría:', error)
        return { error: 'Ocurrió un error al intentar eliminar la categoría.' }
    }
}
