'use client'

import { useState, useTransition } from 'react'
import { toggleMetodoPago, toggleRequiereReferencia, crearMetodoPago } from './actions'

export default function MetodosPagoClient({ initialMetodos }) {
    const [metodos, setMetodos] = useState(initialMetodos || [])
    const [isPending, startTransition] = useTransition()
    const [mensaje, setMensaje] = useState(null)
    const [mostrarModalCrear, setMostrarModalCrear] = useState(false)

    // Formulario de creación
    const [nuevoCodigo, setNuevoCodigo] = useState('')
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [nuevoReqRef, setNuevoReqRef] = useState(false)
    const [nuevoPermiteCambio, setNuevoPermiteCambio] = useState(false)

    const notificar = (tipo, texto) => {
        setMensaje({ tipo, texto })
        setTimeout(() => setMensaje(null), 4000)
    }

    const handleToggleActivo = (id_metodo, activoActual) => {
        const nuevoEstado = !activoActual
        // Actualización optimista
        setMetodos((prev) =>
            prev.map((m) => (m.id_metodo === id_metodo ? { ...m, activo: nuevoEstado } : m))
        )

        startTransition(async () => {
            const res = await toggleMetodoPago(id_metodo, nuevoEstado)
            if (!res.ok) {
                // Revertir
                setMetodos((prev) =>
                    prev.map((m) => (m.id_metodo === id_metodo ? { ...m, activo: activoActual } : m))
                )
                notificar('error', res.error || 'Error al cambiar estado')
            } else {
                notificar('exito', `Método ${nuevoEstado ? 'activado' : 'desactivado'} para el POS`)
            }
        })
    }

    const handleToggleRef = (id_metodo, reqActual) => {
        const nuevoEstado = !reqActual
        setMetodos((prev) =>
            prev.map((m) => (m.id_metodo === id_metodo ? { ...m, requiere_referencia: nuevoEstado } : m))
        )

        startTransition(async () => {
            const res = await toggleRequiereReferencia(id_metodo, nuevoEstado)
            if (!res.ok) {
                setMetodos((prev) =>
                    prev.map((m) => (m.id_metodo === id_metodo ? { ...m, requiere_referencia: reqActual } : m))
                )
                notificar('error', res.error || 'Error al actualizar regla')
            } else {
                notificar('exito', `Requisito de referencia ${nuevoEstado ? 'activado' : 'desactivado'}`)
            }
        })
    }

    const handleCrear = (e) => {
        e.preventDefault()
        if (!nuevoCodigo.trim() || !nuevoNombre.trim()) {
            notificar('error', 'Completa código y nombre')
            return
        }

        startTransition(async () => {
            const res = await crearMetodoPago({
                codigo: nuevoCodigo,
                nombre: nuevoNombre,
                requiere_referencia: nuevoReqRef,
                permite_cambio: nuevoPermiteCambio,
            })

            if (res.ok) {
                setMetodos((prev) => [...prev, res.metodo])
                setMostrarModalCrear(false)
                setNuevoCodigo('')
                setNuevoNombre('')
                setNuevoReqRef(false)
                setNuevoPermiteCambio(false)
                notificar('exito', 'Método de pago registrado exitosamente')
            } else {
                notificar('error', res.error || 'Error al crear método')
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Header del módulo */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
                        Configuración de Cobros
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900 mt-2">
                        Gestión de Métodos de Pago
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Controla las vías de cobro habilitadas en la terminal de venta y sus reglas de validación.
                    </p>
                </div>

                <button
                    onClick={() => setMostrarModalCrear(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Método de Pago
                </button>
            </div>

            {/* Mensajes de notificación */}
            {mensaje && (
                <div
                    className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between animate-in fade-in ${
                        mensaje.tipo === 'error'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                >
                    <span>{mensaje.texto}</span>
                    <button onClick={() => setMensaje(null)} className="text-xs font-bold underline ml-2">
                        Cerrar
                    </button>
                </div>
            )}

            {/* Listado de Métodos de Pago */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">
                        Vías de Cobro Disponibles ({metodos.length})
                    </h2>
                    <span className="text-xs text-slate-500">
                        Los cambios se reflejan inmediatamente en el POS
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {metodos.map((metodo) => (
                        <div
                            key={metodo.id_metodo}
                            className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                                metodo.activo ? 'bg-white' : 'bg-slate-50/70 opacity-75'
                            }`}
                        >
                            <div className="flex items-start sm:items-center gap-3.5">
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                        metodo.activo
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                            {metodo.nombre}
                                        </h3>
                                        <span className="font-mono text-2xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                            {metodo.codigo}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        {metodo.permite_cambio && (
                                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-2xs font-semibold border border-emerald-200">
                                                Calcula vuelto en efectivo
                                            </span>
                                        )}
                                        {metodo.requiere_referencia && (
                                            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-2xs font-semibold border border-indigo-200">
                                                Requiere voucher/ref
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Controles de Configuración */}
                            <div className="flex items-center gap-6 justify-between sm:justify-end">
                                {/* Toggle Requiere Referencia */}
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={metodo.requiere_referencia}
                                        disabled={isPending}
                                        onChange={() => handleToggleRef(metodo.id_metodo, metodo.requiere_referencia)}
                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Exigir Referencia</span>
                                </label>

                                {/* Toggle Activo / Inactivo */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs font-bold ${
                                            metodo.activo ? 'text-emerald-600' : 'text-slate-400'
                                        }`}
                                    >
                                        {metodo.activo ? 'Habilitado' : 'Deshabilitado'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActivo(metodo.id_metodo, metodo.activo)}
                                        disabled={isPending}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                            metodo.activo ? 'bg-emerald-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                metodo.activo ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal para Crear Nuevo Método de Pago */}
            {mostrarModalCrear && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">
                                Nuevo Método de Pago
                            </h3>
                            <button
                                onClick={() => setMostrarModalCrear(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCrear} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Nombre Público
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Bono Sodexo, Dale, Cheque..."
                                    value={nuevoNombre}
                                    onChange={(e) => setNuevoNombre(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Código Único (Alfanumérico)
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: BONO_SODEXO"
                                    value={nuevoCodigo}
                                    onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={nuevoReqRef}
                                        onChange={(e) => setNuevoReqRef(e.target.checked)}
                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Exigir número de voucher o comprobante de transacción</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={nuevoPermiteCambio}
                                        onChange={(e) => setNuevoPermiteCambio(e.target.checked)}
                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Permite cálculo de vuelto/cambio</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setMostrarModalCrear(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {isPending ? 'Guardando...' : 'Guardar Método'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
