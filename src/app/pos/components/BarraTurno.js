'use client'

import { formatearMoneda } from '@/utils/posCalculations'

export default function BarraTurno({
    turno,
    onCerrarTurnoClick,
    onConsultarVentasClick,
    cajeroNombre,
}) {
    if (!turno) return null

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-2xs">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
                {/* Info del Cajero y Turno */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Turno #{turno.id_turno} Activo
                    </span>
                    <span className="text-slate-600 text-xs sm:text-sm font-medium">
                        Cajero: <strong className="text-slate-800">{cajeroNombre}</strong>
                    </span>
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="text-slate-500 text-xs hidden sm:inline">
                        Inició: {new Date(turno.fecha_apertura).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Métricas rápidas del turno en curso */}
                <div className="flex items-center gap-3 sm:gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                        <p className="text-2xs text-slate-400 font-semibold uppercase tracking-wider">Fondo Base</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-700">
                            {formatearMoneda(turno.monto_apertura)}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-2xs text-slate-400 font-semibold uppercase tracking-wider">Ventas Turno</p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-600">
                            {formatearMoneda(turno.total_ventas)}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-2xs text-slate-400 font-semibold uppercase tracking-wider">Efectivo en Caja</p>
                        <p className="text-xs sm:text-sm font-bold text-indigo-700">
                            {formatearMoneda(turno.efectivo_esperado)}
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                        <button
                            type="button"
                            onClick={onConsultarVentasClick}
                            title="Historial de Ventas y Comprobantes"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Historial</span>
                        </button>

                        <button
                            type="button"
                            onClick={onCerrarTurnoClick}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition cursor-pointer shadow-2xs"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Arqueo / Cierre
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
