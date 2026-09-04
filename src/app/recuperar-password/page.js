'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from '@/app/auth/actions'
import Link from 'next/link'

export default function RecuperarPasswordPage() {
    const [state, formAction, isPending] = useActionState(requestPasswordReset, null)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
                    Recuperar Contraseña
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Ingresa tu correo electrónico registrado y te enviaremos un enlace de recuperación.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
                    {state?.error && (
                        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{state.error}</span>
                        </div>
                    )}

                    {state?.success && (
                        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
                            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{state.success}</span>
                        </div>
                    )}

                    <form action={formAction} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                Correo Electrónico
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="ejemplo@pos.com"
                                    className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-hidden transition disabled:opacity-60 cursor-pointer"
                            >
                                {isPending ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                            >
                                ← Volver a Iniciar Sesión
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
