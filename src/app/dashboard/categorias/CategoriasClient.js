'use client'

import { useState, useTransition } from 'react'
import { createCategoria, updateCategoria, deleteCategoria } from './actions'

export default function CategoriasClient({ initialCategorias }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isPending, startTransition] = useTransition()
    const [statusMessage, setStatusMessage] = useState(null) // { type: 'success' | 'error', text: '' }

    // Modales
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingCategoria, setEditingCategoria] = useState(null)
    const [deletingCategoria, setDeletingCategoria] = useState(null)

    // Filtrado en memoria
    const filteredCategorias = initialCategorias.filter((cat) => {
        const query = searchTerm.toLowerCase().trim()
        if (!query) return true
        return (
            cat.nombre.toLowerCase().includes(query) ||
            (cat.descripcion && cat.descripcion.toLowerCase().includes(query))
        )
    })

    const handleCreate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const res = await createCategoria(formData)
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
            const res = await updateCategoria(formData)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setEditingCategoria(null)
            }
        })
    }

    const handleDelete = () => {
        if (!deletingCategoria) return
        startTransition(async () => {
            const res = await deleteCategoria(deletingCategoria.id_categoria)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setDeletingCategoria(null)
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Cabecera del módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Categorías</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Organiza y clasifica los productos de tu catálogo en categorías.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStatusMessage(null)
                        setIsCreateOpen(true)
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Categoría
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

            {/* Buscador */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar categoría por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                </div>
            </div>

            {/* Tabla de Categorías */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5">ID</th>
                                <th className="px-6 py-3.5">Nombre</th>
                                <th className="px-6 py-3.5">Descripción</th>
                                <th className="px-6 py-3.5 text-center">Productos Asociados</th>
                                <th className="px-6 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredCategorias.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                        No se encontraron categorías registradas.
                                    </td>
                                </tr>
                            ) : (
                                filteredCategorias.map((cat) => {
                                    const prodCount = cat._count?.productos ?? 0
                                    return (
                                        <tr key={cat.id_categoria} className="hover:bg-slate-50/80 transition">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                                #{cat.id_categoria}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {cat.nombre}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                                {cat.descripcion || <span className="text-slate-400 italic">Sin descripción</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        prodCount > 0
                                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {prodCount} {prodCount === 1 ? 'producto' : 'productos'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setStatusMessage(null)
                                                        setEditingCategoria(cat)
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setStatusMessage(null)
                                                        setDeletingCategoria(cat)
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition cursor-pointer"
                                                >
                                                    Eliminar
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

            {/* MODAL CREAR CATEGORÍA */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Nueva Categoría</h3>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Nombre de la Categoría *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    placeholder="Ej: Bebidas, Snacks, Limpieza"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    name="descripcion"
                                    rows="3"
                                    placeholder="Breve detalle de los productos pertenecientes a esta categoría..."
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
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
                                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Guardando...' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR CATEGORÍA */}
            {editingCategoria && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Editar Categoría</h3>
                            <button
                                onClick={() => setEditingCategoria(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                            <input type="hidden" name="id_categoria" value={editingCategoria.id_categoria} />
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Nombre de la Categoría *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    defaultValue={editingCategoria.nombre}
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    name="descripcion"
                                    rows="3"
                                    defaultValue={editingCategoria.descripcion || ''}
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingCategoria(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Actualizando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR ELIMINACIÓN */}
            {deletingCategoria && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Eliminar Categoría &ldquo;{deletingCategoria.nombre}&rdquo;
                                </h3>

                                {(deletingCategoria._count?.productos ?? 0) > 0 ? (
                                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                        <p className="font-semibold">⚠️ Acción Bloqueada:</p>
                                        <p className="mt-1">
                                            Esta categoría tiene{' '}
                                            <strong>{deletingCategoria._count.productos}</strong> producto(s) asociado(s).
                                            Para mantener la integridad del catálogo, no se puede eliminar mientras tenga productos vinculados.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 mt-2">
                                        ¿Estás seguro de que deseas eliminar permanentemente esta categoría? Esta acción no se puede deshacer.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setDeletingCategoria(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                                {(deletingCategoria._count?.productos ?? 0) > 0 ? 'Entendido' : 'Cancelar'}
                            </button>
                            {(deletingCategoria._count?.productos ?? 0) === 0 && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
