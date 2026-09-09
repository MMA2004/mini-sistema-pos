'use server'

import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/utils/supabase/admin'
import { getCurrentUser } from '@/app/auth/actions'
import { revalidatePath } from 'next/cache'

/**
 * Crear nuevo usuario en Supabase Auth y registrar su perfil en Prisma
 */
export async function createUser(formData) {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.rol !== 'SUPERVISOR') {
        return { error: 'No tienes permisos de supervisor para crear usuarios.' }
    }

    const nombre = formData.get('nombre')?.toString().trim()
    const apellido = formData.get('apellido')?.toString().trim()
    const cedula = formData.get('cedula')?.toString().trim() || null
    const correo = formData.get('correo')?.toString().trim().toLowerCase()
    const password = formData.get('password')?.toString()
    const rol = formData.get('rol')?.toString().trim() || 'CAJERO'

    if (!nombre || !apellido || !correo || !password) {
        return { error: 'Nombre, apellido, correo y contraseña inicial son obligatorios.' }
    }

    if (password.length < 6) {
        return { error: 'La contraseña inicial debe contener al menos 6 caracteres.' }
    }

    if (!['CAJERO', 'SUPERVISOR'].includes(rol)) {
        return { error: 'El rol especificado es inválido.' }
    }

    try {
        // Verificar correo repetido en base de datos
        const existingEmail = await prisma.usuario.findUnique({
            where: { correo },
        })
        if (existingEmail) {
            return { error: 'Ya existe un usuario registrado con este correo electrónico.' }
        }

        // Verificar cédula si fue proporcionada
        if (cedula) {
            const existingCedula = await prisma.usuario.findUnique({
                where: { cedula },
            })
            if (existingCedula) {
                return { error: 'Ya existe un usuario registrado con esta cédula / ID.' }
            }
        }

        // 1. Crear en Supabase Auth usando cliente administrativo
        const adminClient = createAdminClient()
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email: correo,
            password: password,
            email_confirm: true,
            user_metadata: {
                nombre,
                apellido,
                rol,
            },
        })

        if (authError || !authUser.user) {
            return { error: authError?.message || 'Error al registrar el usuario en Supabase Auth.' }
        }

        // 2. Crear registro en tabla Usuario de Prisma
        try {
            await prisma.usuario.create({
                data: {
                    id: authUser.user.id,
                    correo,
                    nombre,
                    apellido,
                    cedula,
                    rol,
                    estado: 'ACTIVO',
                },
            })
        } catch (dbError) {
            console.error('Error guardando en Prisma, eliminando de Auth para mantener consistencia:', dbError)
            await adminClient.auth.admin.deleteUser(authUser.user.id)
            return { error: 'Error al registrar el usuario en la base de datos.' }
        }

        revalidatePath('/dashboard/vendedores')
        revalidatePath('/dashboard')

        return { success: `Usuario "${nombre} ${apellido}" creado exitosamente como ${rol}.` }
    } catch (error) {
        console.error('Error al crear usuario:', error)
        return { error: error.message || 'Ocurrió un error inesperado al crear el usuario.' }
    }
}

/**
 * Modificar datos de usuario (nombre, apellido, cédula, rol)
 */
export async function updateUser(formData) {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.rol !== 'SUPERVISOR') {
        return { error: 'No tienes permisos de supervisor para modificar usuarios.' }
    }

    const id = formData.get('id')?.toString().trim()
    const nombre = formData.get('nombre')?.toString().trim()
    const apellido = formData.get('apellido')?.toString().trim()
    const cedula = formData.get('cedula')?.toString().trim() || null
    const rol = formData.get('rol')?.toString().trim()

    if (!id || !nombre || !apellido) {
        return { error: 'ID, nombre y apellido son obligatorios.' }
    }

    if (!['CAJERO', 'SUPERVISOR'].includes(rol)) {
        return { error: 'El rol especificado es inválido.' }
    }

    try {
        if (cedula) {
            const existingCedula = await prisma.usuario.findFirst({
                where: {
                    cedula,
                    NOT: { id },
                },
            })
            if (existingCedula) {
                return { error: 'Ya existe otro usuario registrado con esa cédula / ID.' }
            }
        }

        await prisma.usuario.update({
            where: { id },
            data: {
                nombre,
                apellido,
                cedula,
                rol,
            },
        })

        // Sincronizar metadata en Supabase Auth
        try {
            const adminClient = createAdminClient()
            await adminClient.auth.admin.updateUserById(id, {
                user_metadata: { nombre, apellido, rol },
            })
        } catch (e) {
            console.error('Error sincronizando metadata en Supabase:', e)
        }

        revalidatePath('/dashboard/vendedores')
        revalidatePath('/dashboard')

        return { success: 'Datos de usuario actualizados correctamente.' }
    } catch (error) {
        console.error('Error al actualizar usuario:', error)
        return { error: 'Ocurrió un error al actualizar los datos del usuario.' }
    }
}

/**
 * Desactivación / Reactivación lógica de usuario
 */
export async function toggleUserStatus(id, nuevoEstado) {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.rol !== 'SUPERVISOR') {
        return { error: 'No tienes permisos para cambiar el estado de usuarios.' }
    }

    if (currentUser.id === id) {
        return { error: 'Por seguridad, no puedes desactivar tu propia cuenta de supervisor.' }
    }

    if (!['ACTIVO', 'INACTIVO'].includes(nuevoEstado)) {
        return { error: 'Estado no válido.' }
    }

    try {
        const userToUpdate = await prisma.usuario.findUnique({
            where: { id },
            select: { nombre: true, apellido: true, estado: true },
        })

        await prisma.usuario.update({
            where: { id },
            data: { estado: nuevoEstado },
        })

        revalidatePath('/dashboard/vendedores')
        revalidatePath('/dashboard')

        return {
            success:
                nuevoEstado === 'ACTIVO'
                    ? `Usuario "${userToUpdate?.nombre || ''} ${userToUpdate?.apellido || ''}". Acceso aprobado y activado exitosamente. Ya puede ingresar al punto de venta.`
                    : `Usuario "${userToUpdate?.nombre || ''} ${userToUpdate?.apellido || ''}" desactivado lógicamente. Su acceso está deshabilitado y su trazabilidad histórica protegida.`,
        }
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error)
        return { error: 'Ocurrió un error al modificar el estado del usuario.' }
    }
}

/**
 * Restablecer contraseña de un usuario directamente
 */
export async function resetUserPassword(id, newPassword) {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.rol !== 'SUPERVISOR') {
        return { error: 'No tienes permisos para restablecer contraseñas de otros usuarios.' }
    }

    if (!newPassword || newPassword.length < 6) {
        return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
    }

    try {
        const adminClient = createAdminClient()
        const { error } = await adminClient.auth.admin.updateUserById(id, {
            password: newPassword,
        })

        if (error) {
            return { error: error.message || 'Error al actualizar la contraseña en Supabase Auth.' }
        }

        return { success: 'Contraseña restablecida exitosamente. El usuario ya puede ingresar con su nueva clave.' }
    } catch (error) {
        console.error('Error al restablecer contraseña:', error)
        return { error: error.message || 'Error al restablecer la contraseña.' }
    }
}
