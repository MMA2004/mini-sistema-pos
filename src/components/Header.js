'use client'

import Link from 'next/link'
import { logout } from '@/app/auth/actions'
import { useTransition } from 'react'

export default function Header({ user }) {
    const [isPending, startTransition] = useTransition()

    const handleLogout = () => {
        startTransition(async () => {
            await logout()
        })
    }

    const isSupervisor = user?.rol === 'SUPERVISOR'

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logotipo y Título */}
                    <div className="flex items-center gap-6">
                        <Link href={isSupervisor ? '/dashboard' : '/pos'} className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-emerald-700 transition">
                                P
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 text-lg leading-tight block">POS Express</span>
                                <span className="text-xs text-gray-500 font-medium">Sistema Punto de Venta</span>
                            </div>
                        </Link>

                        {/* Enlaces de navegación */}
                        <nav className="hidden md:flex items-center gap-1 ml-4">
                            <Link
                                href="/pos"
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-md transition"
                            >
                                Caja / Ventas
                            </Link>
                            {isSupervisor && (
                                <Link
                                    href="/dashboard"
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition"
                                >
                                    Panel Supervisor
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* Información de Usuario y Acciones */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-gray-900 leading-none">{user.nombre}</p>
                                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                                </div>

                                {/* Badge de Rol */}
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                        isSupervisor
                                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                >
                                    {user.rol}
                                </span>

                                {/* Menú de Opciones: Cambiar Contraseña y Logout */}
                                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                    <Link
                                        href="/actualizar-password"
                                        title="Cambiar contraseña"
                                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        disabled={isPending}
                                        title="Cerrar sesión"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-50 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>{isPending ? 'Saliendo...' : 'Salir'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition"
                            >
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
