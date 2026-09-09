'use client'

import { useState, useTransition } from 'react'
import { createProducto, updateProducto, toggleProductoActivo } from './actions'

export default function ProductosClient({ initialProductos, categorias }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategoria, setSelectedCategoria] = useState('ALL')
    const [selectedEstado, setSelectedEstado] = useState('ALL') // 'ALL', 'ACTIVO', 'INACTIVO'

    const [isPending, startTransition] = useTransition()
    const [statusMessage, setStatusMessage] = useState(null)

    // Modales
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingProducto, setEditingProducto] = useState(null)
    const [togglingProducto, setTogglingProducto] = useState(null)

    // Filtrado interactivo
    const filteredProductos = initialProductos.filter((prod) => {
        const query = searchTerm.toLowerCase().trim()
        const matchesSearch =
            !query ||
            prod.codigo.toLowerCase().includes(query) ||
            prod.nombre.toLowerCase().includes(query) ||
            (prod.descripcion && prod.descripcion.toLowerCase().includes(query))

        const matchesCategoria =
            selectedCategoria === 'ALL' || prod.id_categoria === parseInt(selectedCategoria, 10)

        const matchesEstado =
            selectedEstado === 'ALL' ||
            (selectedEstado === 'ACTIVO' && prod.activo) ||
            (selectedEstado === 'INACTIVO' && !prod.activo)

        return matchesSearch && matchesCategoria && matchesEstado
    })

    const handleCreate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const res = await createProducto(formData)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setIsCreateOpen(false)
            }
        })
    }

    const handleUpdate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const res = await updateProducto(formData)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setEditingProducto(null)
            }
        })
    }

    const handleToggleActivo = () => {
        if (!togglingProducto) return
        startTransition(async () => {
            const res = await toggleProductoActivo(togglingProducto.codigo, !togglingProducto.activo)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setTogglingProducto(null)
            }
        })
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(val)
    }

    return (
        <div className="space-y-6">
            {/* Cabecera del módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Catálogo de Productos</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Consulta, registra y actualiza precios, códigos SKU e información de productos.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStatusMessage(null)
                        setIsCreateOpen(true)
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Producto
                </button>
            </div>

            {/* Mensajes de feedback */}
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

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por código SKU, nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filtro por Categoría */}
                    <select
                        value={selectedCategoria}
                        onChange={(e) => setSelectedCategoria(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="ALL">Todas las Categorías</option>
                        {categorias.map((c) => (
                            <option key={c.id_categoria} value={c.id_categoria}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>

                    {/* Filtro por Estado */}
                    <select
                        value={selectedEstado}
                        onChange={(e) => setSelectedEstado(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Productos */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5">Código / SKU</th>
                                <th className="px-5 py-3.5">Producto</th>
                                <th className="px-5 py-3.5">Categoría</th>
                                <th className="px-5 py-3.5 text-right">Precio Unitario</th>
                                <th className="px-5 py-3.5 text-center">Stock</th>
                                <th className="px-5 py-3.5 text-center">Estado</th>
                                <th className="px-5 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredProductos.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                                        No se encontraron productos que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filteredProductos.map((prod) => {
                                    const isLowStock = prod.unidades_totales <= prod.stock_minimo
                                    return (
                                        <tr key={prod.codigo} className="hover:bg-slate-50/80 transition">
                                            <td className="px-5 py-4 font-mono text-xs font-bold text-indigo-700">
                                                {prod.codigo}
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">{prod.nombre}</p>
                                                {prod.descripcion && (
                                                    <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                                                        {prod.descripcion}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-slate-700">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                                                    {prod.categoria?.nombre || 'Sin categoría'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-semibold text-slate-900">
                                                {formatCurrency(Number(prod.precio_unitario))}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        isLowStock
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                    }`}
                                                >
                                                    {prod.unidades_totales} uds
                                                    {isLowStock && (
                                                        <span title="Bajo stock mínimo" className="text-amber-600">⚠️</span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        prod.activo
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}
                                                >
                                                    {prod.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setStatusMessage(null)
                                                        setEditingProducto(prod)
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setStatusMessage(null)
                                                        setTogglingProducto(prod)
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                                        prod.activo
                                                            ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                                                            : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                                    }`}
                                                >
                                                    {prod.activo ? 'Desactivar' : 'Reactivar'}
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

            {/* MODAL CREAR PRODUCTO */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Producto</h3>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Código / SKU *
                                    </label>
                                    <input
                                        type="text"
                                        name="codigo"
                                        required
                                        placeholder="Ej: BEB-001 o 77012345"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Categoría *
                                    </label>
                                    <select
                                        name="id_categoria"
                                        required
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        <option value="">Seleccionar Categoría...</option>
                                        {categorias.map((cat) => (
                                            <option key={cat.id_categoria} value={cat.id_categoria}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Nombre del Producto *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    placeholder="Ej: Gaseosa Cola 1.5L"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Precio Unitario *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="precio_unitario"
                                        required
                                        min="1"
                                        placeholder="5000"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Stock Inicial
                                    </label>
                                    <input
                                        type="number"
                                        name="stock_inicial"
                                        defaultValue="0"
                                        min="0"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Stock Mínimo
                                    </label>
                                    <input
                                        type="number"
                                        name="stock_minimo"
                                        defaultValue="5"
                                        min="0"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    name="descripcion"
                                    rows="2"
                                    placeholder="Presentación, características o detalles del producto..."
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Guardando...' : 'Registrar Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR PRODUCTO */}
            {editingProducto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Editar Producto</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                    SKU: {editingProducto.codigo}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingProducto(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                            <input type="hidden" name="codigo" value={editingProducto.codigo} />
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Nombre del Producto *
                                </label>
                                <input
                                 type="text"
                                    name="nombre"
                                    required
                                    defaultValue={editingProducto.nombre}
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Categoría *
                                    </label>
                                    <select
                                        name="id_categoria"
                                        required
                                        defaultValue={editingProducto.id_categoria}
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        {categorias.map((cat) => (
                                            <option key={cat.id_categoria} value={cat.id_categoria}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Precio Unitario *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="precio_unitario"
                                        required
                                        min="1"
                                        defaultValue={editingProducto.precio_unitario}
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Stock Mínimo para Alerta
                                </label>
                                <input
                                    type="number"
                                    name="stock_minimo"
                                    defaultValue={editingProducto.stock_minimo}
                                    min="0"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    name="descripcion"
                                    rows="2"
                                    defaultValue={editingProducto.descripcion || ''}
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingProducto(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR DESACTIVACIÓN / REACTIVACIÓN */}
            {togglingProducto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    togglingProducto.activo
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {togglingProducto.activo
                                        ? `Desactivar producto "${togglingProducto.nombre}"`
                                        : `Reactivar producto "${togglingProducto.nombre}"`}
                                </h3>
                                <p className="text-sm text-slate-600 mt-2">
                                    {togglingProducto.activo
                                        ? 'El producto dejará de aparecer en las búsquedas del punto de venta (Caja), pero su histórico de ventas pasadas e inventario se mantendrá intacto.'
                                        : 'El producto volverá a estar disponible para la venta inmediata en caja.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setTogglingProducto(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleToggleActivo}
                                disabled={isPending}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer ${
                                    togglingProducto.activo
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {isPending
                                    ? 'Procesando...'
                                    : togglingProducto.activo
                                    ? 'Sí, desactivar'
                                    : 'Sí, reactivar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
