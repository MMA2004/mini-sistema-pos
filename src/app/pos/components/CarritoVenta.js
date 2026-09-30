'use client'

import { useState } from 'react'
import { formatearMoneda } from '@/utils/posCalculations'

export default function CarritoVenta({
    totales,
    items = [],
    onActualizarCantidad,
    onEliminarItem,
    onLimpiarCarrito,
    onAplicarDescuentoItem,
    descuentoGlobalPorcentaje,
    descuentoGlobalMonto,
    onCambiarDescuentoGlobal,
    onIniciarCobro,
}) {
    const [itemEditandoDescuento, setItemEditandoDescuento] = useState(null)
    const [descuentoTipo, setDescuentoTipo] = useState('porcentaje') // 'porcentaje' | 'monto'
    const [descuentoValorInput, setDescuentoValorInput] = useState('')

    const [mostrarModalDescuentoGlobal, setMostrarModalDescuentoGlobal] = useState(false)
    const [globalTipo, setGlobalTipo] = useState('porcentaje')
    const [globalValorInput, setGlobalValorInput] = useState('')

    const abrirModalDescuentoItem = (item) => {
        setItemEditandoDescuento(item)
        if (item.descuentoPorcentaje > 0) {
            setDescuentoTipo('porcentaje')
            setDescuentoValorInput(item.descuentoPorcentaje.toString())
        } else if (item.descuentoMonto > 0) {
            setDescuentoTipo('monto')
            setDescuentoValorInput(item.descuentoMonto.toString())
        } else {
            setDescuentoTipo('porcentaje')
            setDescuentoValorInput('')
        }
    }

    const guardarDescuentoItem = (e) => {
        e.preventDefault()
        if (!itemEditandoDescuento) return

        const val = Math.max(0, Number(descuentoValorInput) || 0)
        if (descuentoTipo === 'porcentaje') {
            onAplicarDescuentoItem(itemEditandoDescuento.codigo, {
                descuento_porcentaje: Math.min(100, val),
                descuento_monto: 0,
            })
        } else {
            onAplicarDescuentoItem(itemEditandoDescuento.codigo, {
                descuento_porcentaje: 0,
                descuento_monto: val,
            })
        }
        setItemEditandoDescuento(null)
    }

    const guardarDescuentoGlobal = (e) => {
        e.preventDefault()
        const val = Math.max(0, Number(globalValorInput) || 0)
        if (globalTipo === 'porcentaje') {
            onCambiarDescuentoGlobal({
                porcentaje: Math.min(100, val),
                monto: 0,
            })
        } else {
            onCambiarDescuentoGlobal({
                porcentaje: 0,
                monto: val,
            })
        }
        setMostrarModalDescuentoGlobal(false)
    }

    const tieneDescuentoGlobal =
        (Number(descuentoGlobalPorcentaje) > 0) || (Number(descuentoGlobalMonto) > 0)

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
            {/* Cabecera del Carrito */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        {totales.totalArticulos || 0}
                    </span>
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">Orden Actual</h3>
                        <p className="text-2xs text-slate-400">Detalle de compra</p>
                    </div>
                </div>

                {items.length > 0 && (
                    <button
                        type="button"
                        onClick={onLimpiarCarrito}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                        Vaciar
                    </button>
                )}
            </div>

            {/* Lista de Artículos */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
                {items.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-700">El carrito está vacío</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                            Escanea un código de barras o selecciona productos del catálogo
                        </p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.codigo} className="py-2.5 px-2 hover:bg-slate-50/80 rounded-xl transition space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {item.nombre}
                                    </h4>
                                    <p className="text-2xs text-slate-400 font-mono">
                                        {item.codigo} • {formatearMoneda(item.precio_unitario)} c/u
                                        {item.porcentaje_iva > 0 && ` (IVA ${item.porcentaje_iva}%)`}
                                    </p>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono">
                                        {formatearMoneda(item.totalLinea)}
                                    </span>
                                </div>
                            </div>

                            {/* Controles de Cantidad y Descuento */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => onActualizarCantidad(item.codigo, item.unidades - 1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={item.unidades_totales}
                                        value={item.unidades}
                                        onChange={(e) => onActualizarCantidad(item.codigo, parseInt(e.target.value) || 1)}
                                        className="w-10 text-center font-bold text-xs text-slate-900 border-x border-slate-200 py-1 focus:outline-hidden"
                                    />
                                    <button
                                        type="button"
                                        disabled={item.unidades >= item.unidades_totales}
                                        onClick={() => onActualizarCantidad(item.codigo, item.unidades + 1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Botón de Descuento por Ítem */}
                                    <button
                                        type="button"
                                        onClick={() => abrirModalDescuentoItem(item)}
                                        className={`px-2 py-1 rounded-lg text-2xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                            item.descuentoMonto > 0
                                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <span>% Desc.</span>
                                        {item.descuentoMonto > 0 && (
                                            <span>(-{formatearMoneda(item.descuentoMonto)})</span>
                                        )}
                                    </button>

                                    {/* Botón Eliminar */}
                                    <button
                                        type="button"
                                        onClick={() => onEliminarItem(item.codigo)}
                                        title="Eliminar producto"
                                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Resumen Financiero y Botón de Cobro */}
            {items.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                    {/* Botón Descuento Global */}
                    <div className="flex justify-between items-center text-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setGlobalTipo(descuentoGlobalPorcentaje > 0 ? 'porcentaje' : 'monto')
                                setGlobalValorInput(
                                    descuentoGlobalPorcentaje > 0
                                        ? descuentoGlobalPorcentaje.toString()
                                        : descuentoGlobalMonto > 0
                                        ? descuentoGlobalMonto.toString()
                                        : ''
                                )
                                setMostrarModalDescuentoGlobal(true)
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-2xs cursor-pointer transition ${
                                tieneDescuentoGlobal
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {tieneDescuentoGlobal ? 'Descuento Global Aplicado' : '+ Agregar Descuento Global'}
                        </button>

                        {tieneDescuentoGlobal && (
                            <button
                                type="button"
                                onClick={() => onCambiarDescuentoGlobal({ porcentaje: 0, monto: 0 })}
                                className="text-2xs text-red-600 hover:underline font-semibold"
                            >
                                Quitar
                            </button>
                        )}
                    </div>

                    {/* Desglose de totales */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                            <span>Subtotal Bruto:</span>
                            <span className="font-mono font-medium">{formatearMoneda(totales.subtotalBruto)}</span>
                        </div>

                        {totales.descuentoTotal > 0 && (
                            <div className="flex justify-between text-amber-700 font-medium">
                                <span>Descuentos Totales:</span>
                                <span className="font-mono">- {formatearMoneda(totales.descuentoTotal)}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span>Base Neta Imponible:</span>
                            <span className="font-mono">{formatearMoneda(totales.subtotalNeto)}</span>
                        </div>

                        {totales.desgloseImpuestos?.map((imp) => (
                            <div key={imp.tasa} className="flex justify-between text-2xs text-slate-500">
                                <span>IVA ({imp.tasa}%):</span>
                                <span className="font-mono">+ {formatearMoneda(imp.impuesto)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Total a pagar */}
                    <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                            Total a Pagar
                        </span>
                        <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                            {formatearMoneda(totales.total)}
                        </span>
                    </div>

                    {/* Botón de Cobro Principal */}
                    <button
                        type="button"
                        onClick={onIniciarCobro}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base rounded-2xl transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Cobrar {formatearMoneda(totales.total)}</span>
                    </button>
                </div>
            )}

            {/* Modal para Descuento por Ítem */}
            {itemEditandoDescuento && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Descuento de Producto</h4>
                                <p className="text-2xs text-slate-500 truncate max-w-[220px]">
                                    {itemEditandoDescuento.nombre}
                                </p>
                            </div>
                            <button
                                onClick={() => setItemEditandoDescuento(null)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={guardarDescuentoItem} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDescuentoTipo('porcentaje')}
                                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                        descuentoTipo === 'porcentaje'
                                            ? 'bg-amber-600 text-white border-amber-600'
                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    Porcentaje (%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDescuentoTipo('monto')}
                                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                        descuentoTipo === 'monto'
                                            ? 'bg-amber-600 text-white border-amber-600'
                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    Valor Fijo ($)
                                </button>
                            </div>

                            <div>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    autoFocus
                                    placeholder={descuentoTipo === 'porcentaje' ? 'Ej: 10 (%)' : 'Ej: 5000 ($)'}
                                    value={descuentoValorInput}
                                    onChange={(e) => setDescuentoValorInput(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onAplicarDescuentoItem(itemEditandoDescuento.codigo, {
                                            descuento_porcentaje: 0,
                                            descuento_monto: 0,
                                        })
                                        setItemEditandoDescuento(null)
                                    }}
                                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                                >
                                    Quitar Descuento
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Descuento Global */}
            {mostrarModalDescuentoGlobal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <h4 className="font-bold text-slate-900 text-sm">Descuento Global a la Venta</h4>
                            <button
                                onClick={() => setMostrarModalDescuentoGlobal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={guardarDescuentoGlobal} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setGlobalTipo('porcentaje')}
                                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                        globalTipo === 'porcentaje'
                                            ? 'bg-amber-600 text-white border-amber-600'
                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    Porcentaje (%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGlobalTipo('monto')}
                                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                        globalTipo === 'monto'
                                            ? 'bg-amber-600 text-white border-amber-600'
                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    Valor Fijo ($)
                                </button>
                            </div>

                            <div>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    autoFocus
                                    placeholder={globalTipo === 'porcentaje' ? 'Ej: 5 (%)' : 'Ej: 10000 ($)'}
                                    value={globalValorInput}
                                    onChange={(e) => setGlobalValorInput(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setMostrarModalDescuentoGlobal(false)}
                                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                >
                                    Aplicar Descuento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
