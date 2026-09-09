import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase con privilegios administrativos (service_role)
 * Se ejecuta exclusivamente del lado del servidor para gestionar usuarios y contraseñas.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en las variables de entorno.')
    }

    if (!serviceRoleKey) {
        throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno. Necesario para gestionar usuarios.')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
