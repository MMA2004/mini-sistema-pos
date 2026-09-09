import Header from '@/components/Header'
import { getCurrentUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PosPage() {
    const user = await getCurrentUser()

    if (!user || user.estado !== 'ACTIVO') {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Header user={user} />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {/* Banner de Bienvenida */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                                Terminal de Ventas
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                                ¡Bienvenido, {user.nombre}!
                            </h1>
                            <p className="text-slate-600 text-sm mt-1">
                                Sesión iniciada con rol <span className="font-semibold text-emerald-700">{user.rol}</span>. Todo listo para registrar ventas.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Caja Activa
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de estado / resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Estado de Sesión</h3>
                            <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md">OK</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-2">Autenticado</p>
                        <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Cédula / ID</h3>
                            <span className="text-slate-400 text-xs">Identificación</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-2">{user.cedula || 'No registrada'}</p>
                        <p className="text-xs text-slate-500 mt-1">Identificador de cajero</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Seguridad</h3>
                            <Link href="/actualizar-password" className="text-xs text-indigo-600 hover:underline font-semibold">
                                Cambiar
                            </Link>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-2">Contraseña</p>
                        <p className="text-xs text-slate-500 mt-1">Gestionada con Supabase Auth</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
