'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/auth/actions'
import { revalidatePath } from 'next/cache'

export async function obtenerMetodosPago() {
    try {
        const metodos = await prisma.metodoPagoConfig.findMany({
            orderBy: { orden: 'asc' },
        })
        return { ok: true, metodos }
    } catch (e) {
        console.error('Error al obtener métodos de pago:', e)
        return { ok: false, error: 'Error al consultar métodos de pago', metodos: [] }
    }
}

export async function toggleMetodoPago(id_metodo, activo) {
    try {
        const user = await getCurrentUser()
        if (!user || user.rol !== 'SUPERVISOR') {
            return { ok: false, error: 'Solo supervisores pueden modificar métodos de pago' }
        }

        const actualizado = await prisma.metodoPagoConfig.update({
            where: { id_metodo: Number(id_metodo) },
            data: { activo: Boolean(activo) },
        })

        revalidatePath('/dashboard/metodos-pago')
        revalidatePath('/pos')
        return { ok: true, metodo: actualizado }
    } catch (e) {
        console.error('Error al alternar estado de método de pago:', e)
        return { ok: false, error: 'No se pudo actualizar el método de pago' }
    }
}

export async function toggleRequiereReferencia(id_metodo, requiere_referencia) {
    try {
        const user = await getCurrentUser()
        if (!user || user.rol !== 'SUPERVISOR') {
            return { ok: false, error: 'Solo supervisores pueden modificar métodos de pago' }
        }

        const actualizado = await prisma.metodoPagoConfig.update({
            where: { id_metodo: Number(id_metodo) },
            data: { requiere_referencia: Boolean(requiere_referencia) },
        })

        revalidatePath('/dashboard/metodos-pago')
        revalidatePath('/pos')
        return { ok: true, metodo: actualizado }
    } catch (e) {
        console.error('Error al cambiar regla de referencia:', e)
        return { ok: false, error: 'No se pudo actualizar la regla de referencia' }
    }
}

export async function crearMetodoPago({ codigo, nombre, requiere_referencia = false, permite_cambio = false }) {
    try {
        const user = await getCurrentUser()
        if (!user || user.rol !== 'SUPERVISOR') {
            return { ok: false, error: 'Solo supervisores pueden crear métodos de pago' }
        }

        const codNormalizado = codigo?.trim().toUpperCase().replace(/\s+/g, '_')
        if (!codNormalizado || !nombre?.trim()) {
            return { ok: false, error: 'Código y nombre son obligatorios' }
        }

        const existente = await prisma.metodoPagoConfig.findUnique({
            where: { codigo: codNormalizado },
        })

        if (existente) {
            return { ok: false, error: 'Ya existe un método con ese código' }
        }

        const conteo = await prisma.metodoPagoConfig.count()

        const nuevo = await prisma.metodoPagoConfig.create({
            data: {
                codigo: codNormalizado,
                nombre: nombre.trim(),
                activo: true,
                requiere_referencia: Boolean(requiere_referencia),
                permite_cambio: Boolean(permite_cambio),
                orden: conteo + 1,
            },
        })

        revalidatePath('/dashboard/metodos-pago')
        revalidatePath('/pos')
        return { ok: true, metodo: nuevo }
    } catch (e) {
        console.error('Error al crear método de pago:', e)
        return { ok: false, error: 'Error al registrar método de pago' }
    }
}
