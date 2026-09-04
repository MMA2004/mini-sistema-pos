'use client'

import { useActionState, useState } from 'react'
import { login } from '@/app/auth/actions'
import Link from 'next/link'

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, null)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-emerald-500/30">
                        POS
                    </div>
                </div>
                <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Acceso al Sistema POS
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Ingresa con tu cuenta de <span className="font-semibold text-emerald-600">Cajero</span> o <span className="font-semibold text-purple-600">Supervisor</span>
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

                    <form action={formAction} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                Correo Electrónico
                            </label>
                            <div className="mt-1 relative rounded-md shadow-xs">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="ejemplo@pos.com"
                                    className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                    Contraseña
                                </label>
                                <Link
                                    href="/recuperar-password"
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="mt-1 relative rounded-md shadow-xs">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    className="block w-full rounded-lg border border-slate-300 pl-3.5 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verificando credenciales...
                                    </span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-600">
                            ¿Aún no tienes cuenta?{' '}
                            <Link href="/registro" className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
