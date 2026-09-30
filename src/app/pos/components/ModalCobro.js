'use client'

import { useState, useTransition } from 'react'
import { formatearMoneda, calcularCambio } from '@/utils/posCalculations'

export default function ModalCobro({
    isOpen,
    onClose,
    totales,
    metodosPago = [],
    onConfirmarVenta,
}) {
    const totalVenta = Number(totales?.total) || 0
    const [cedCliente, setCedCliente] = useState('')
    const [nombreCliente, setNombreCliente] = useState('')
    const [error, setError] = useState(null)
    const [isPending, startTransition] = useTransition()

    // Inicializar con método de pago principal (Efectivo por defecto)
    const [lineasPago, setLineasPago] = useState(() => {
        const efectivoMetodo =
            metodosPago?.find((m) => m.codigo === 'EFECTIVO') || metodosPago?.[0]
        if (!efectivoMetodo) return []
        return [
            {
                id_metodo: efectivoMetodo.id_metodo,
                codigoMetodo: efectivoMetodo.codigo,
                nombreMetodo: efectivoMetodo.nombre,
                permite_cambio: efectivoMetodo.permite_cambio,
                requiere_referencia: efectivoMetodo.requiere_referencia,
                monto: totalVenta,
                monto_recibido: efectivoMetodo.permite_cambio ? totalVenta : null,
                cambio_devuelto: 0,
                referencia: '',
            },
        ]
    })

    if (!isOpen) return null

    // Métodos de pago activos
    const metodosActivos = metodosPago.filter((m) => m.activo)

    // Calcular suma total cubierta por los pagos
    const totalCubierto = lineasPago.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
    const saldoPendiente = Math.max(0, totalVenta - totalCubierto)
    const estaCubierto = totalCubierto >= totalVenta - 0.01

    // Cambiar el método de pago de una línea existente
    const cambiarMetodoLinea = (index, nuevoIdMetodo) => {
        const metodo = metodosActivos.find((m) => m.id_metodo === nuevoIdMetodo)
        if (!metodo) return

        setLineasPago((prev) => {
            const copia = [...prev]
            const linea = { ...copia[index] }
            linea.id_metodo = metodo.id_metodo
            linea.codigoMetodo = metodo.codigo
            linea.nombreMetodo = metodo.nombre
            linea.permite_cambio = metodo.permite_cambio
            linea.requiere_referencia = metodo.requiere_referencia

            if (metodo.permite_cambio) {
                linea.monto_recibido = linea.monto
                linea.cambio_devuelto = 0
            } else {
                linea.monto_recibido = null
                linea.cambio_devuelto = 0
            }

            copia[index] = linea
            return copia
        })
    }

    // Selección rápida de método principal
    const seleccionarMetodoRapido = (metodo) => {
        if (lineasPago.length <= 1) {
            cambiarMetodoLinea(0, metodo.id_metodo)
        } else {
            // Si ya hay pagos divididos, agregar nueva línea con el saldo pendiente si lo hay
            agregarMetodoPago(metodo)
        }
    }

    // Agregar nueva vía de cobro (pago dividido / mixto)
    const agregarMetodoPago = (metodo) => {
        const montoPorDefecto = saldoPendiente > 0 ? saldoPendiente : 0

        setLineasPago((prev) => [
            ...prev,
            {
                id_metodo: metodo.id_metodo,
                codigoMetodo: metodo.codigo,
                nombreMetodo: metodo.nombre,
                permite_cambio: metodo.permite_cambio,
                requiere_referencia: metodo.requiere_referencia,
                monto: montoPorDefecto,
                monto_recibido: metodo.permite_cambio ? montoPorDefecto : null,
                cambio_devuelto: 0,
                referencia: '',
            },
        ])
    }

    const eliminarLineaPago = (index) => {
        if (lineasPago.length <= 1) return
        setLineasPago((prev) => prev.filter((_, i) => i !== index))
    }

    const actualizarLinea = (index, campo, valor) => {
        setLineasPago((prev) => {
            const copia = [...prev]
            const linea = { ...copia[index] }

            if (campo === 'monto') {
                const nuevoMonto = Math.max(0, Number(valor) || 0)
                linea.monto = nuevoMonto
                if (linea.permite_cambio) {
                    const calc = calcularCambio(nuevoMonto, linea.monto_recibido)
                    linea.cambio_devuelto = calc.cambio
                }
            } else if (campo === 'monto_recibido') {
                const recibido = Math.max(0, Number(valor) || 0)
                linea.monto_recibido = recibido
                const calc = calcularCambio(linea.monto, recibido)
                linea.cambio_devuelto = calc.cambio
            } else if (campo === 'referencia') {
                linea.referencia = valor
            }

            copia[index] = linea
            return copia
        })
    }

    const handleConfirmar = (e) => {
        e.preventDefault()
        setError(null)

        if (!estaCubierto) {
            setError(`Faltan ${formatearMoneda(saldoPendiente)} para cubrir el total de la venta`)
            return
        }

        // Validar referencias obligatorias
        for (const p of lineasPago) {
            if (p.requiere_referencia && !p.referencia?.trim()) {
                setError(`Debes ingresar el número de comprobante o referencia para ${p.nombreMetodo}`)
                return
            }
            if (p.permite_cambio && (p.monto_recibido || 0) < p.monto) {
                setError(`El dinero recibido en ${p.nombreMetodo} es menor al monto a pagar`)
                return
            }
        }

        startTransition(async () => {
            const res = await onConfirmarVenta({
                cedCliente,
                nombreCliente,
                pagos: lineasPago,
            })

            if (!res.ok) {
                setError(res.error || 'Error al procesar la venta')
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 space-y-5 text-slate-800 my-8">
                {/* Cabecera */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Caja y Facturación
                        </span>
                        <h2 className="text-xl font-bold text-slate-900 mt-1">
                            Procesar Pago de la Venta
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Gran Total a Pagar */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            Total a Cobrar
                        </p>
                        <p className="text-3xl font-black font-mono tracking-tight text-emerald-400 mt-0.5">
                            {formatearMoneda(totalVenta)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            Artículos
                        </p>
                        <p className="text-xl font-bold text-slate-200">
                            {totales?.totalArticulos || 0} unidades
                        </p>
                    </div>
                </div>

                {/* Botones de Selección Rápida de Métodos de Pago */}
                <div className="space-y-1.5">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500">
                        Seleccionar Vía de Cobro:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {metodosActivos.map((m) => {
                            const esMetodoActual =
                                lineasPago.length === 1 && lineasPago[0].id_metodo === m.id_metodo

                            const icono = m.permite_cambio
                                ? '💵'
                                : m.codigo.includes('TARJETA')
                                ? '💳'
                                : m.codigo === 'TRANSFERENCIA'
                                ? '🏦'
                                : '📱'

                            return (
                                <button
                                    key={m.id_metodo}
                                    type="button"
                                    onClick={() => seleccionarMetodoRapido(m)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                        esMetodoActual
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <span>{icono}</span>
                                    <span>{m.nombre}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleConfirmar} className="space-y-4">
                    {/* Datos del Cliente (Opcionales) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <div>
                            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Cédula / NIT Cliente (Opcional)
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: 222222222222"
                                value={cedCliente}
                                onChange={(e) => setCedCliente(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Nombre / Razón Social (Opcional)
                            </label>
                            <input
                                type="text"
                                placeholder="Consumidor Final"
                                value={nombreCliente}
                                onChange={(e) => setNombreCliente(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Vías de Cobro Aplicadas (Soporte Pagos Divididos / Mixtos) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Desglose de Pago ({lineasPago.length})
                            </h3>
                            {saldoPendiente > 0 && (
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                                    Falta por cubrir: {formatearMoneda(saldoPendiente)}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {lineasPago.map((linea, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </span>

                                            {/* Selector desplegable para cambiar el método de esta línea */}
                                            <select
                                                value={linea.id_metodo}
                                                onChange={(e) => cambiarMetodoLinea(idx, Number(e.target.value))}
                                                className="font-bold text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                            >
                                                {metodosActivos.map((m) => (
                                                    <option key={m.id_metodo} value={m.id_metodo}>
                                                        {m.nombre} {m.permite_cambio ? '(Efectivo)' : ''}
                                                    </option>
                                                ))}
                                            </select>

                                            {linea.permite_cambio && (
                                                <span className="text-3xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                    Calcula vuelto
                                                </span>
                                            )}
                                        </div>

                                        {lineasPago.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => eliminarLineaPago(idx)}
                                                className="text-slate-400 hover:text-red-600 text-xs font-semibold cursor-pointer px-2 py-1 rounded hover:bg-red-50"
                                            >
                                                Quitar
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                                                Monto a Cubrir con este medio
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={linea.monto}
                                                    onChange={(e) => actualizarLinea(idx, 'monto', e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                                />
                                            </div>
                                        </div>

                                        {linea.permite_cambio ? (
                                            <div>
                                                <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                                                    Efectivo Recibido (Cliente)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                                        $
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        placeholder="0"
                                                        value={linea.monto_recibido}
                                                        onChange={(e) => actualizarLinea(idx, 'monto_recibido', e.target.value)}
                                                        className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                                                    Voucher / Referencia {linea.requiere_referencia && '*'}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Aprobación #123456"
                                                    value={linea.referencia}
                                                    onChange={(e) => actualizarLinea(idx, 'referencia', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Indicador de Vuelto si es efectivo */}
                                    {linea.permite_cambio && (
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-600">Cambio / Vuelto:</span>
                                            <span className="font-mono font-black text-sm text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                                {formatearMoneda(linea.cambio_devuelto)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Botón para Dividir / Agregar otro Método de Pago (Pago Mixto) */}
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    const disponible =
                                        metodosActivos.find((m) => !lineasPago.some((lp) => lp.id_metodo === m.id_metodo)) ||
                                        metodosActivos[0]
                                    if (disponible) agregarMetodoPago(disponible)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>+ Dividir pago con otro método (Pago Mixto)</span>
                            </button>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                            disabled={isPending || !estaCubierto}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Registrando venta...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Confirmar Venta y Emitir Ticket</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
