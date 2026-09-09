'use client'

import { useState, useTransition } from 'react'
import { adjustStock } from './actions'

export default function StockClient({ initialProductos, initialMovimientos }) {
    const [activeTab, setActiveTab] = useState('INVENTARIO') // 'INVENTARIO' | 'HISTORIAL'
    const [searchTerm, setSearchTerm] = useState('')
    const [stockFilter, setStockFilter] = useState('ALL') // 'ALL', 'LOW', 'OUT', 'NORMAL'

    const [isPending, startTransition] = useTransition()
    const [statusMessage, setStatusMessage] = useState(null)

    // Modal de ajuste
    const [adjustingProduct, setAdjustingProduct] = useState(null)
    const [newStockValue, setNewStockValue] = useState('')
    const [motivo, setMotivo] = useState('AJUSTE')
    const [observacion, setObservacion] = useState('')

    // Filtrado de productos en inventario
    const filteredProductos = initialProductos.filter((prod) => {
        const query = searchTerm.toLowerCase().trim()
        const matchesSearch =
            !query ||
            prod.codigo.toLowerCase().includes(query) ||
            prod.nombre.toLowerCase().includes(query) ||
            (prod.categoria?.nombre && prod.categoria.nombre.toLowerCase().includes(query))

        let matchesStock = true
        if (stockFilter === 'LOW') {
            matchesStock = prod.unidades_totales > 0 && prod.unidades_totales <= prod.stock_minimo
        } else if (stockFilter === 'OUT') {
            matchesStock = prod.unidades_totales === 0
        } else if (stockFilter === 'NORMAL') {
            matchesStock = prod.unidades_totales > prod.stock_minimo
        }

        return matchesSearch && matchesStock
    })

    // Filtrado de historial
    const filteredMovimientos = initialMovimientos.filter((mov) => {
        const query = searchTerm.toLowerCase().trim()
        if (!query) return true
        return (
            mov.cod_producto.toLowerCase().includes(query) ||
            mov.producto?.nombre.toLowerCase().includes(query) ||
            (mov.usuario?.nombre && mov.usuario.nombre.toLowerCase().includes(query)) ||
            (mov.observacion && mov.observacion.toLowerCase().includes(query)) ||
            mov.motivo.toLowerCase().includes(query)
        )
    })

    const openAdjustModal = (prod) => {
        setStatusMessage(null)
        setAdjustingProduct(prod)
        setNewStockValue(prod.unidades_totales.toString())
        setMotivo('AJUSTE')
        setObservacion('')
    }

    const handleAdjustSubmit = (e) => {
        e.preventDefault()
        if (!adjustingProduct) return

        const formData = new FormData()
        formData.append('codigo', adjustingProduct.codigo)
        formData.append('nuevo_stock', newStockValue)
        formData.append('motivo', motivo)
        formData.append('observacion', observacion)

        startTransition(async () => {
            const res = await adjustStock(formData)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setAdjustingProduct(null)
            }
        })
    }

    // Cálculo dinámico de variación
    const currentUnits = adjustingProduct ? adjustingProduct.unidades_totales : 0
    const enteredUnits = parseInt(newStockValue, 10)
    const difference = isNaN(enteredUnits) ? 0 : enteredUnits - currentUnits

    return (
        <div className="space-y-6">
            {/* Cabecera del módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Control y Actualización de Stock</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ajusta las unidades físicas disponibles de cada producto y revisa la trazabilidad de movimientos.
                    </p>
                </div>

                {/* Switch de Pestañas */}
                <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                        onClick={() => setActiveTab('INVENTARIO')}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            activeTab === 'INVENTARIO'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Inventario de Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORIAL')}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            activeTab === 'HISTORIAL'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Historial de Ajustes
                    </button>
                </div>
            </div>

            {/* Feedback messages */}
            {statusMessage && (
                <div
                    className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
                        statusMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                >
                    <span>{statusMessage.text}</span>
                    <button
                        onClick={() => setStatusMessage(null)}
                        className="text-xs font-bold uppercase tracking-wider hover:opacity-75 cursor-pointer ml-4"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'INVENTARIO'
                                ? 'Buscar producto por SKU, nombre o categoría...'
                                : 'Buscar por producto, supervisor, motivo o nota...'
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    />
                </div>

                {activeTab === 'INVENTARIO' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                            Estado:
                        </span>
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                            <option value="ALL">Todos los Niveles</option>
                            <option value="NORMAL">Stock Normal (&gt; Mínimo)</option>
                            <option value="LOW">Stock Bajo / Crítico (≤ Mínimo)</option>
                            <option value="OUT">Sin Stock (0 unidades)</option>
                        </select>
                    </div>
                )}
            </div>

            {/* TAB 1: INVENTARIO DE PRODUCTOS */}
            {activeTab === 'INVENTARIO' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">Código / SKU</th>
                                    <th className="px-5 py-3.5">Producto</th>
                                    <th className="px-5 py-3.5">Categoría</th>
                                    <th className="px-5 py-3.5 text-center">Stock Mínimo</th>
                                    <th className="px-5 py-3.5 text-center">Stock Disponible</th>
                                    <th className="px-5 py-3.5 text-center">Nivel</th>
                                    <th className="px-5 py-3.5 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProductos.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                                            No se encontraron productos para el filtro aplicado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProductos.map((prod) => {
                                        const isOut = prod.unidades_totales === 0
                                        const isLow = prod.unidades_totales > 0 && prod.unidades_totales <= prod.stock_minimo

                                        return (
                                            <tr key={prod.codigo} className="hover:bg-slate-50/80 transition">
                                                <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                                                    {prod.codigo}
                                                </td>
                                                <td className="px-5 py-4 font-semibold text-slate-900">
                                                    {prod.nombre}
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">
                                                    {prod.categoria?.nombre || 'General'}
                                                </td>
                                                <td className="px-5 py-4 text-center font-mono text-xs text-slate-500">
                                                    {prod.stock_minimo} uds
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="font-extrabold text-base text-slate-900">
                                                        {prod.unidades_totales}
                                                    </span>{' '}
                                                    <span className="text-xs text-slate-500">uds</span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {isOut ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                                            Agotado (0)
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                                            ⚠️ Bajo stock
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            ✓ Óptimo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => openAdjustModal(prod)}
                                                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition shadow-2xs cursor-pointer"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Ajustar Stock
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: HISTORIAL DE AJUSTES / AUDITORÍA */}
            {activeTab === 'HISTORIAL' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">Fecha y Hora</th>
                                    <th className="px-5 py-3.5">Producto</th>
                                    <th className="px-5 py-3.5 text-center">Variación</th>
                                    <th className="px-5 py-3.5 text-center">Motivo</th>
                                    <th className="px-5 py-3.5">Usuario Responsable</th>
                                    <th className="px-5 py-3.5">Observación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredMovimientos.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                            No hay registros de ajustes de stock en el historial.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovimientos.map((mov) => {
                                        const diff = mov.stock_nuevo - mov.stock_original
                                        const isPositive = diff > 0
                                        const isZero = diff === 0

                                        return (
                                            <tr key={mov.id_cambio} className="hover:bg-slate-50/80 transition">
                                                <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap font-mono">
                                                    {new Date(mov.fecha).toLocaleString('es-CO', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'medium',
                                                    })}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {mov.producto?.nombre || 'Producto eliminado'}
                                                    </p>
                                                    <p className="font-mono text-xs text-slate-400">
                                                        SKU: {mov.cod_producto}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-center whitespace-nowrap">
                                                    <span className="text-xs text-slate-400">
                                                        {mov.stock_original} →
                                                    </span>{' '}
                                                    <span className="font-bold text-slate-900">
                                                        {mov.stock_nuevo}
                                                    </span>{' '}
                                                    <span
                                                        className={`inline-block ml-1 font-bold text-xs ${
                                                            isZero
                                                                ? 'text-slate-400'
                                                                : isPositive
                                                                ? 'text-emerald-600'
                                                                : 'text-red-600'
                                                        }`}
                                                    >
                                                        ({isPositive ? `+${diff}` : `${diff}`})
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                                                        {mov.motivo}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {mov.usuario?.nombre} {mov.usuario?.apellido}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{mov.usuario?.correo}</p>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">
                                                    {mov.observacion || <span className="text-slate-300 italic">Sin observación</span>}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL DE AJUSTE RÁPIDO DE STOCK */}
            {adjustingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Ajuste Directo de Stock</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                    {adjustingProduct.nombre} ({adjustingProduct.codigo})
                                </p>
                            </div>
                            <button
                                onClick={() => setAdjustingProduct(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
                            {/* Visualizador de stock actual vs nuevo */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Stock Actual</p>
                                    <p className="text-2xl font-black text-slate-700 mt-1">
                                        {adjustingProduct.unidades_totales}{' '}
                                        <span className="text-xs font-normal text-slate-400">uds</span>
                                    </p>
                                </div>
                                <div className="border-l border-slate-200 pl-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Variación Calculada</p>
                                    <p
                                        className={`text-2xl font-black mt-1 ${
                                            difference === 0
                                                ? 'text-slate-400'
                                                : difference > 0
                                                ? 'text-emerald-600'
                                                : 'text-amber-600'
                                        }`}
                                    >
                                        {difference > 0 ? `+${difference}` : difference}{' '}
                                        <span className="text-xs font-normal text-slate-400">uds</span>
                                    </p>
                                </div>
                            </div>

                            {/* Nuevo conteo físico */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Nuevo Conteo Físico (Unidades en existencia) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={newStockValue}
                                    onChange={(e) => setNewStockValue(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2.5 text-lg font-bold text-slate-900 bg-white border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Ingresa el total exacto verificado físicamente en tienda/almacén (debe ser ≥ 0).
                                </p>
                            </div>

                            {/* Motivo */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Motivo del Ajuste *
                                </label>
                                <select
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                                >
                                    <option value="AJUSTE">Ajuste por Conteo / Auditoría</option>
                                    <option value="COMPRA">Recepción de Compra / Ingreso Mercancía</option>
                                    <option value="MERMA">Merma / Producto Roto o Dañado</option>
                                    <option value="DEVOLUCION">Devolución de Cliente</option>
                                </select>
                            </div>

                            {/* Observación */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Observación o Justificación (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={observacion}
                                    onChange={(e) => setObservacion(e.target.value)}
                                    placeholder="Ej: Inventario semanal, producto quebrado en góndola..."
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setAdjustingProduct(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || newStockValue === '' || parseInt(newStockValue, 10) < 0}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Guardando...' : 'Confirmar y Registrar Ajuste'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
