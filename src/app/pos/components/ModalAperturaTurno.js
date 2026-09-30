'use client'

import { useState, useTransition } from 'react'
import { abrirTurno } from '@/app/pos/actions'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'

export default function ModalAperturaTurno({
    isOpen,
    onTurnoIniciado,
    cajeroNombre,
    esSupervisor = false,
}) {
    const [montoApertura, setMontoApertura] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [error, setError] = useState(null)
    const [isPending, startTransition] = useTransition()
    const [isLoggingOut, startLogoutTransition] = useTransition()

    if (!isOpen) return null

    const handleLogout = () => {
        startLogoutTransition(async () => {
            await logout()
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError(null)

        const baseNum = Number(montoApertura)
        if (isNaN(baseNum) || baseNum < 0) {
            setError('Ingresa un monto válido para el fondo base')
            return
        }

        startTransition(async () => {
            const res = await abrirTurno({
                montoApertura: baseNum,
                observaciones,
            })

            if (res.ok) {
                onTurnoIniciado(res.turno)
            } else {
                setError(res.error || 'No se pudo abrir el turno')
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-6 text-slate-800 relative">
                {/* Botón superior de Cerrar Sesión */}
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Cerrar sesión y salir del sistema"
                    className="absolute right-5 top-5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                </button>

                <div className="text-center space-y-2 pt-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Inicio de Jornada
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Apertura de Turno de Caja
                    </h2>
                    <p className="text-sm text-slate-500">
                        ¡Hola, <strong className="text-slate-700">{cajeroNombre}</strong>! Para comenzar a vender, registra el fondo inicial o base de efectivo en caja.
                    </p>
                </div>

                {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Fondo Inicial en Efectivo (Base de Caja) *
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                                $
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                required
                                autoFocus
                                placeholder="0"
                                value={montoApertura}
                                onChange={(e) => setMontoApertura(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition"
                            />
                        </div>
                        <p className="text-2xs text-slate-400 mt-1">
                            Monto físico disponible en gaveta para dar cambio.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Observaciones de Apertura (Opcional)
                        </label>
                        <textarea
                            rows="2"
                            placeholder="Ej: Turno mañana, billetes de baja denominación..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition resize-none"
                        />
                    </div>

                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Iniciando turno...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Abrir Caja y Comenzar</span>
                                </>
                            )}
                        </button>

                        {esSupervisor && (
                            <div className="pt-3 text-center">
                                <Link
                                    href="/dashboard"
                                    className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                                >
                                    ← Ir al Panel de Supervisor
                                </Link>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
