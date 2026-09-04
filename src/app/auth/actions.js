'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/**
 * HU-01: Iniciar sesión de usuario (Cajero o Supervisor)
 */
export async function login(prevState, formData) {
    const email = formData.get('email')?.toString().trim()
    const password = formData.get('password')?.toString().trim()

    if (!email || !password) {
        return { error: 'Por favor, ingresa tu correo y contraseña.' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error || !data.user) {
        return { error: 'Credenciales inválidas o correo no registrado.' }
    }

    // Verificar estado y rol en la tabla Usuario
    let redirectPath = '/pos'
    try {
        const dbUser = await prisma.usuario.findUnique({
            where: { id: data.user.id },
        })

        if (dbUser) {
            if (dbUser.estado !== 'ACTIVO') {
                await supabase.auth.signOut()
                return { error: 'Tu cuenta está inactiva o bloqueada. Comunícate con un supervisor.' }
            }

            if (dbUser.rol === 'SUPERVISOR') {
                redirectPath = '/dashboard'
            } else {
                redirectPath = '/pos'
            }
        }
    } catch (err) {
        console.error('Error al consultar perfil de usuario en Prisma:', err)
        // Si la tabla no tiene el registro aún, dejamos ingresar al POS por defecto
    }

    redirect(redirectPath)
}

/**
 * HU-01: Registro de nuevo usuario (Cajero o Supervisor)
 */
export async function register(prevState, formData) {
    const nombre = formData.get('nombre')?.toString().trim()
    const apellido = formData.get('apellido')?.toString().trim()
    const cedula = formData.get('cedula')?.toString().trim() || null
    const email = formData.get('email')?.toString().trim()
    const password = formData.get('password')?.toString()
    const confirmPassword = formData.get('confirmPassword')?.toString()
    // Por seguridad, todo auto-registro público se asigna únicamente como CAJERO
    const rol = 'CAJERO'

    if (!nombre || !apellido || !email || !password) {
        return { error: 'Por favor, completa todos los campos obligatorios.' }
    }

    if (password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' }
    }

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden.' }
    }

    // Si proporcionó cédula, verificar que no esté repetida en Prisma
    if (cedula) {
        try {
            const existingCedula = await prisma.usuario.findUnique({
                where: { cedula },
            })
            if (existingCedula) {
                return { error: 'Ya existe un usuario registrado con esa cédula.' }
            }
        } catch (e) {
            console.error('Error al verificar cédula:', e)
        }
    }

    const supabase = await createClient()

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nombre,
                apellido,
                rol,
            },
        },
    })

    if (authError || !authData.user) {
        return { error: authError?.message || 'Error al registrar el usuario en el sistema de autenticación.' }
    }

    // 2. Crear perfil en la tabla Usuario de Prisma
    try {
        await prisma.usuario.upsert({
            where: { id: authData.user.id },
            update: {
                correo: email,
                nombre,
                apellido,
                cedula,
                rol,
                estado: 'ACTIVO',
            },
            create: {
                id: authData.user.id,
                correo: email,
                nombre,
                apellido,
                cedula,
                rol,
                estado: 'ACTIVO',
            },
        })
    } catch (dbErr) {
        console.error('Error al guardar el perfil en Prisma:', dbErr)
        return { error: 'Se creó el usuario en Auth pero hubo un error en la base de datos. Intenta iniciar sesión.' }
    }

    // Si Supabase devuelve sesión activa directamente
    if (authData.session) {
        redirect('/pos')
    }

    return {
        success: '¡Usuario registrado exitosamente! Ya puedes iniciar sesión con tus credenciales.',
    }
}

/**
 * HU-02: Cerrar sesión
 */
export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

/**
 * HU-03: Actualizar contraseña (usuario autenticado)
 */
export async function updatePassword(prevState, formData) {
    const password = formData.get('password')?.toString()
    const confirmPassword = formData.get('confirmPassword')?.toString()

    if (!password || password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' }
    }

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
        password: password,
    })

    if (error) {
        return { error: error.message || 'No se pudo actualizar la contraseña.' }
    }

    return { success: '¡Contraseña actualizada con éxito!' }
}

/**
 * HU-03: Solicitar correo de recuperación de contraseña
 */
export async function requestPasswordReset(prevState, formData) {
    const email = formData.get('email')?.toString().trim()

    if (!email) {
        return { error: 'Por favor, ingresa tu correo electrónico.' }
    }

    const headerList = await headers()
    const host = headerList.get('host') || 'localhost:3000'
    const protocol = headerList.get('x-forwarded-proto') || 'http'
    const origin = `${protocol}://${host}`

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/actualizar-password`,
    })

    if (error) {
        return { error: error.message || 'Error al enviar el correo de recuperación.' }
    }

    return { success: 'Se ha enviado un enlace a tu correo para restablecer tu contraseña.' }
}

/**
 * Helper: Obtener usuario actual con su perfil de Prisma
 */
export async function getCurrentUser() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return null

        const dbUser = await prisma.usuario.findUnique({
            where: { id: user.id },
        })

        return {
            id: user.id,
            email: user.email,
            nombre: dbUser ? `${dbUser.nombre} ${dbUser.apellido}` : user.email.split('@')[0],
            rol: dbUser?.rol || 'CAJERO',
            estado: dbUser?.estado || 'ACTIVO',
            cedula: dbUser?.cedula || null,
        }
    } catch (err) {
        console.error('Error al obtener usuario actual:', err)
        return null
    }
}
