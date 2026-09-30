'use client'

import { useState, useEffect, useTransition } from 'react'
import { obtenerResumenArqueo, cerrarTurno } from '@/app/pos/actions'
import { formatearMoneda } from '@/utils/posCalculations'

export default function ModalArqueoTurno({
    isOpen,
    onClose,
    idTurno,
    onTurnoCerradoExitoso,
}) {
    const [cargando, setCargando] = useState(true)
    const [resumen, setResumen] = useState(null)
    const [montoContado, setMontoContado] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [error, setError] = useState(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        let activo = true

        if (isOpen && idTurno) {
            obtenerResumenArqueo(idTurno)
                .then((res) => {
                    if (!activo) return
                    if (res.ok) {
                        setResumen(res.resumen)
                    } else {
                        setError(res.error || 'Error al cargar arqueo')
                    }
                })
                .catch(() => {
                    if (activo) setError('Error al cargar arqueo')
                })
                .finally(() => {
                    if (activo) setCargando(false)
                })
        }

        return () => {
            activo = false
        }
    }, [isOpen, idTurno])

    if (!isOpen) return null

    const contadoNum = Number(montoContado) || 0
    const esperadoNum = resumen ? resumen.efectivoEsperado : 0
    const diferencia = contadoNum - esperadoNum

    const handleConfirmarCierre = (e) => {
        e.preventDefault()
        setError(null)

        if (montoContado === '' || isNaN(contadoNum) || contadoNum < 0) {
            setError('Ingresa el dinero físico contado en la caja')
            return
        }

        startTransition(async () => {
            const res = await cerrarTurno({
                idTurno,
                montoContado: contadoNum,
                observacionesCierre: observaciones,
            })

            if (res.ok) {
                onTurnoCerradoExitoso(res.turno)
            } else {
                setError(res.error || 'No se pudo cerrar el turno')
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 text-slate-800 my-8">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Arqueo y Cierre de Caja</h2>
                            <p className="text-xs text-slate-500">Turno #{idTurno}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {cargando ? (
                    <div className="py-12 text-center space-y-3">
                        <span className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block" />
                        <p className="text-sm font-semibold text-slate-600">Calculando movimientos del turno...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                        {error}
                    </div>
                ) : resumen ? (
                    <form onSubmit={handleConfirmarCierre} className="space-y-5">
                        {/* Resumen de Ventas y Efectivo Esperado */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center text-xs text-slate-600">
                                <span>Fondo Base Inicial:</span>
                                <strong className="text-slate-800 font-mono text-sm">
                                    {formatearMoneda(resumen.baseInicial)}
                                </strong>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-600">
                                <span>Ventas en Efectivo:</span>
                                <strong className="text-emerald-700 font-mono text-sm">
                                    + {formatearMoneda(resumen.totalEfectivo)}
                                </strong>
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Efectivo Esperado en Gaveta:
                                </span>
                                <span className="text-base font-extrabold text-indigo-700 font-mono">
                                    {formatearMoneda(resumen.efectivoEsperado)}
                                </span>
                            </div>
                        </div>

                        {/* Desglose por Otros Métodos */}
                        {resumen.desgloseMetodos && resumen.desgloseMetodos.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                                    Desglose de Cobros del Turno
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {resumen.desgloseMetodos.map((m) => (
                                        <div key={m.codigo} className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                                            <span className="text-slate-600">{m.nombre}:</span>
                                            <span className="font-bold text-slate-800 font-mono">
                                                {formatearMoneda(m.total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Conteo Físico en Caja */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                Efectivo Físico Contado en Caja *
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
                                    placeholder="Ingresa el monto contado"
                                    value={montoContado}
                                    onChange={(e) => setMontoContado(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden transition"
                                />
                            </div>
                        </div>

                        {/* Indicador de Diferencia / Descuadre */}
                        {montoContado !== '' && (
                            <div
                                className={`p-4 rounded-2xl border text-sm flex items-center justify-between transition animate-in fade-in ${
                                    Math.abs(diferencia) < 0.01
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                        : diferencia > 0
                                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                                        : 'bg-red-50 border-red-200 text-red-900'
                                }`}
                            >
                                <div>
                                    <p className="font-bold text-xs uppercase tracking-wider">
                                        {Math.abs(diferencia) < 0.01
                                            ? '✓ Cuadre Perfecto'
                                            : diferencia > 0
                                            ? '↑ Sobrante de Dinero'
                                            : '↓ Faltante de Dinero'}
                                    </p>
                                    <p className="text-2xs opacity-80 mt-0.5">
                                        Contado: {formatearMoneda(contadoNum)} vs Esperado: {formatearMoneda(esperadoNum)}
                                    </p>
                                </div>
                                <span className="text-base font-extrabold font-mono">
                                    {diferencia > 0 ? `+${formatearMoneda(diferencia)}` : formatearMoneda(diferencia)}
                                </span>
                            </div>
                        )}

                        {/* Observaciones de Cierre */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Observaciones de Cierre
                            </label>
                            <textarea
                                rows="2"
                                placeholder="Notas sobre el arqueo, novedades, justificación de descuadres..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition resize-none"
                            />
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isPending}
                                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || montoContado === ''}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Cerrando turno...</span>
                                    </>
                                ) : (
                                    <span>Confirmar Arqueo y Cerrar Caja</span>
                                )}
                            </button>
                        </div>
                    </form>
                ) : null}
            </div>
        </div>
    )
}
