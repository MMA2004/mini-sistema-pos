'use client'

import { useState, useRef, useEffect } from 'react'
import { formatearMoneda } from '@/utils/posCalculations'

export default function BuscadorProductos({
    productos = [],
    categorias = [],
    onAgregarAlCarrito,
}) {
    const [busqueda, setBusqueda] = useState('')
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
    const [escaneoAlerta, setEscaneoAlerta] = useState(null)
    const inputScannerRef = useRef(null)

    // Enfocar automáticamente el input para capturar el lector de código de barras
    useEffect(() => {
        if (inputScannerRef.current) {
            inputScannerRef.current.focus()
        }
    }, [])

    // Manejar escaneo rápido con lector de código de barras (Enter)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const codigoLimpio = busqueda.trim().toUpperCase()
            if (!codigoLimpio) return

            // Buscar coincidencia exacta por código/SKU
            const coincidenciaExacta = productos.find(
                (p) => p.codigo.toUpperCase() === codigoLimpio
            )

            if (coincidenciaExacta) {
                if (coincidenciaExacta.unidades_totales <= 0) {
                    mostrarAlerta(`"${coincidenciaExacta.nombre}" está agotado`, 'error')
                } else {
                    onAgregarAlCarrito(coincidenciaExacta)
                    mostrarAlerta(`✓ Agregado: ${coincidenciaExacta.nombre}`, 'exito')
                    setBusqueda('')
                }
            } else {
                // Si hay exactamente 1 producto filtrado en pantalla, agregarlo
                if (productosFiltrados.length === 1) {
                    const unico = productosFiltrados[0]
                    if (unico.unidades_totales > 0) {
                        onAgregarAlCarrito(unico)
                        mostrarAlerta(`✓ Agregado: ${unico.nombre}`, 'exito')
                        setBusqueda('')
                    } else {
                        mostrarAlerta(`"${unico.nombre}" está agotado`, 'error')
                    }
                } else {
                    mostrarAlerta(`Código "${codigoLimpio}" no encontrado`, 'error')
                }
            }
        }
    }

    const mostrarAlerta = (texto, tipo) => {
        setEscaneoAlerta({ texto, tipo })
        setTimeout(() => setEscaneoAlerta(null), 2500)
    }

    // Filtrar productos por búsqueda y categoría
    const productosFiltrados = productos.filter((p) => {
        const coincideCat =
            categoriaSeleccionada === null || p.id_categoria === categoriaSeleccionada

        if (!coincideCat) return false

        if (!busqueda.trim()) return true

        const q = busqueda.toLowerCase().trim()
        const matchNombre = p.nombre.toLowerCase().includes(q)
        const matchCodigo = p.codigo.toLowerCase().includes(q)
        const matchCat = p.categoria?.nombre?.toLowerCase().includes(q)

        return matchNombre || matchCodigo || matchCat
    })

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Barra de Búsqueda y Escáner */}
            <div className="space-y-2">
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </span>
                    <input
                        ref={inputScannerRef}
                        type="text"
                        placeholder="Escanear código de barras con pistola o buscar por nombre / SKU... [Enter]"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-11 pr-24 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda('')}
                                className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                            >
                                Limpiar
                            </button>
                        )}
                        <span className="text-2xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                            Escáner listo
                        </span>
                    </div>
                </div>

                {/* Notificación de escaneo / feedback instantáneo */}
                {escaneoAlerta && (
                    <div
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-2 animate-in fade-in ${
                            escaneoAlerta.tipo === 'error'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                    >
                        <span>{escaneoAlerta.texto}</span>
                    </div>
                )}

                {/* Filtros de Categorías rápidas */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setCategoriaSeleccionada(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            categoriaSeleccionada === null
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        Todas ({productos.length})
                    </button>
                    {categorias.map((cat) => (
                        <button
                            key={cat.id_categoria}
                            type="button"
                            onClick={() => setCategoriaSeleccionada(cat.id_categoria)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                categoriaSeleccionada === cat.id_categoria
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {cat.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cuadrícula de Productos */}
            <div className="flex-1 overflow-y-auto pr-1">
                {productosFiltrados.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-700">No se encontraron productos</p>
                        <p className="text-xs text-slate-400 mt-1">Prueba con otro término o categoría</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {productosFiltrados.map((prod) => {
                            const sinStock = prod.unidades_totales <= 0
                            const stockBajo = prod.unidades_totales <= prod.stock_minimo && !sinStock

                            return (
                                <button
                                    key={prod.codigo}
                                    type="button"
                                    disabled={sinStock}
                                    onClick={() => onAgregarAlCarrito(prod)}
                                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between group relative ${
                                        sinStock
                                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                            : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-98'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className="font-mono text-3xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold truncate max-w-[100px]">
                                                {prod.codigo}
                                            </span>
                                            <span
                                                className={`text-3xs font-extrabold px-1.5 py-0.5 rounded-full ${
                                                    sinStock
                                                        ? 'bg-red-100 text-red-700'
                                                        : stockBajo
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }`}
                                            >
                                                {sinStock ? 'Agotado' : `${prod.unidades_totales} disp.`}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                                            {prod.nombre}
                                        </h4>
                                        <p className="text-3xs text-slate-400 mt-0.5">
                                            {prod.categoria?.nombre || 'General'}
                                        </p>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono">
                                            {formatearMoneda(prod.precio_unitario)}
                                        </span>
                                        {prod.porcentaje_iva > 0 && (
                                            <span className="text-3xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                                IVA {prod.porcentaje_iva}%
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
