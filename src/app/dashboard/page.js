import Header from '@/components/Header'
import { getCurrentUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const isSupervisor = user.rol === 'SUPERVISOR'

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Header user={user} />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {/* Alerta si no es Supervisor */}
                {!isSupervisor && (
                    <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Tu rol actual es <strong>CAJERO</strong>. El panel de administración está reservado para supervisores.</span>
                        </div>
                        <Link href="/pos" className="text-xs font-bold text-amber-900 underline">
                            Ir a Caja
                        </Link>
                    </div>
                )}

                {/* Banner Supervisor */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
                                Panel de Control
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                                Supervisor: {user.nombre}
                            </h1>
                            <p className="text-slate-600 text-sm mt-1">
                                Gestión de inventario, cajeros, cortes de caja y métricas operativas.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
                                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                Permisos de Administrador / Supervisor
                            </span>
                        </div>
                    </div>
                </div>

                {/* Métricas rápidas / Estado del sistema */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol de Acceso</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">{user.rol}</p>
                        <p className="text-xs text-slate-400 mt-1">Nivel de privilegios alto</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado de Cuenta</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{user.estado}</p>
                        <p className="text-xs text-slate-400 mt-1">Habilitado para operar</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terminales</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">1 Caja</p>
                        <p className="text-xs text-slate-400 mt-1">Disponibles para venta</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seguridad</p>
                        <Link href="/actualizar-password" className="text-xs font-bold text-indigo-600 hover:underline block mt-1">
                            Cambiar clave →
                        </Link>
                        <p className="text-xs text-slate-400 mt-1">Actualizar credenciales</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
