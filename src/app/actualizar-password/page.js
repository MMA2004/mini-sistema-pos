'use client'

import { useActionState, useState } from 'react'
import { updatePassword } from '@/app/auth/actions'
import Link from 'next/link'

export default function ActualizarPasswordPage() {
    const [state, formAction, isPending] = useActionState(updatePassword, null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
                    Establecer Nueva Contraseña
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Ingresa tu nueva contraseña para actualizar el acceso a tu cuenta.
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
                            <div>
                                <p className="font-semibold">{state.success}</p>
                                <p className="mt-1 text-xs text-emerald-700">Ya puedes iniciar sesión o continuar usando el sistema.</p>
                            </div>
                        </div>
                    )}

                    <form action={formAction} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                Nueva Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-xs">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    placeholder="Mínimo 6 caracteres"
                                    className="block w-full rounded-lg border border-slate-300 pl-3.5 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition outline-none"
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
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                                Confirmar Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-xs">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    placeholder="Repite la contraseña"
                                    className="block w-full rounded-lg border border-slate-300 pl-3.5 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showConfirmPassword ? (
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
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden transition disabled:opacity-60 cursor-pointer"
                            >
                                {isPending ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <Link
                                href="/pos"
                                className="text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                                Volver al Sistema
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
