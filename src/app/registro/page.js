'use client'

import { useActionState, useState } from 'react'
import { register } from '@/app/auth/actions'
import Link from 'next/link'

export default function RegistroPage() {
    const [state, formAction, isPending] = useActionState(register, null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-emerald-500/30">
                        P
                    </div>
                </div>
                <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Registro de Cajero
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Crea tu cuenta de empleado para acceder al terminal de caja
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
                    {state?.error && (
                        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{state.error}</span>
                        </div>
                    )}

                    {state?.success ? (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">¡Registro enviado con éxito!</h3>
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                    Tu cuenta de cajero ha sido creada y se encuentra en estado{' '}
                                    <strong className="text-amber-700 font-semibold">Pendiente de Aprobación</strong>.
                                </p>
                                <div className="mt-3 text-xs text-amber-900 bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 leading-relaxed text-left flex items-start gap-2.5">
                                    <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Un supervisor debe autorizar tu usuario en el módulo de <strong>Vendedores</strong> del sistema antes de que puedas iniciar sesión y acceder al punto de venta.
                                    </span>
                                </div>
                            </div>
                            <div className="pt-2">
                                <Link
                                    href="/login"
                                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                                >
                                    Ir a Iniciar Sesión →
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form action={formAction} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-semibold text-slate-700">
                                    Nombre *
                                </label>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    required
                                    placeholder="Carlos"
                                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="apellido" className="block text-sm font-semibold text-slate-700">
                                    Apellido *
                                </label>
                                <input
                                    id="apellido"
                                    name="apellido"
                                    type="text"
                                    required
                                    placeholder="Pérez"
                                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="cedula" className="block text-sm font-semibold text-slate-700">
                                Cédula / Documento de Identidad
                            </label>
                            <input
                                id="cedula"
                                name="cedula"
                                type="text"
                                placeholder="1098765432"
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                Correo Electrónico *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="empleado@pos.com"
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                    Contraseña *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-xs">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        placeholder="Mínimo 6 caracteres"
                                        className="block w-full rounded-lg border border-slate-300 pl-3.5 pr-10 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                                    Confirmar Contraseña *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-xs">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        placeholder="Repite la contraseña"
                                        className="block w-full rounded-lg border border-slate-300 pl-3.5 pr-10 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm transition outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                        title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden transition disabled:opacity-60 cursor-pointer"
                            >
                                {isPending ? 'Registrando usuario...' : 'Registrar Cuenta'}
                            </button>
                        </div>
                    </form>
                    )}

                    <div className="mt-6 text-center border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-600">
                            ¿Ya tienes una cuenta registrada?{' '}
                            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
