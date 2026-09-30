'use client'

import { useState, useEffect, useTransition } from 'react'
import { buscarVentas, anularVenta } from '@/app/pos/actions'
import { formatearMoneda } from '@/utils/posCalculations'

export default function ModalHistorialVentas({
    isOpen,
    onClose,
    idTurnoActual,
    onReimprimirTicket,
    onVentaAnulada,
}) {
    const [termino, setTermino] = useState('')
    const [filtrarSoloEsteTurno, setFiltrarSoloEsteTurno] = useState(false)
    const [ventas, setVentas] = useState([])
    const [cargando, setCargando] = useState(false)
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
    const [motivoAnulacion, setMotivoAnulacion] = useState('')
    const [mostrarPromptAnular, setMostrarPromptAnular] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [isPending, startTransition] = useTransition()

    const recargarVentas = () => {
        setCargando(true)
        buscarVentas({
            termino,
            idTurno: filtrarSoloEsteTurno ? idTurnoActual : null,
            limite: 40,
        })
            .then((res) => {
                if (res.ok) {
                    setVentas(res.ventas)
                    if (ventaSeleccionada) {
                        const actualizada = res.ventas.find((v) => v.id_venta === ventaSeleccionada.id_venta)
                        if (actualizada) setVentaSeleccionada(actualizada)
                    }
                }
            })
            .finally(() => setCargando(false))
    }

    useEffect(() => {
        let activo = true

        if (isOpen) {
            buscarVentas({
                termino: '',
                idTurno: filtrarSoloEsteTurno ? idTurnoActual : null,
                limite: 40,
            })
                .then((res) => {
                    if (!activo) return
                    if (res.ok) {
                        setVentas(res.ventas)
                    }
                })
                .finally(() => {
                    if (activo) setCargando(false)
                })
        }

        return () => {
            activo = false
        }
    }, [isOpen, filtrarSoloEsteTurno, idTurnoActual])

    if (!isOpen) return null

    const handleBuscar = (e) => {
        e.preventDefault()
        recargarVentas()
    }

    const notificar = (tipo, texto) => {
        setMensaje({ tipo, texto })
        setTimeout(() => setMensaje(null), 4000)
    }

    const handleConfirmarAnulacion = (e) => {
        e.preventDefault()
        if (!motivoAnulacion.trim()) {
            notificar('error', 'El motivo de anulación es obligatorio')
            return
        }

        startTransition(async () => {
            const res = await anularVenta({
                idVenta: ventaSeleccionada.id_venta,
                motivo: motivoAnulacion,
            })

            if (res.ok) {
                notificar('exito', 'Venta anulada correctamente. Stock restablecido.')
                setMostrarPromptAnular(false)
                setMotivoAnulacion('')
                recargarVentas()
                if (onVentaAnulada) onVentaAnulada()
            } else {
                notificar('error', res.error || 'Error al anular venta')
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full p-5 sm:p-7 space-y-4 text-slate-800 my-6 max-h-[92vh] flex flex-col">
                {/* Cabecera */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Consulta de Ventas y Comprobantes
                            </h2>
                            <p className="text-xs text-slate-500">
                                Búsqueda histórica, detalle completo, reimpresión y anulaciones
                            </p>
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

                {/* Notificaciones */}
                {mensaje && (
                    <div
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shrink-0 ${
                            mensaje.tipo === 'error'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                    >
                        <span>{mensaje.texto}</span>
                        <button onClick={() => setMensaje(null)} className="underline ml-2">
                            Cerrar
                        </button>
                    </div>
                )}

                {/* Filtros de búsqueda */}
                <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por # ticket (ej: TICK-...), cédula o cliente..."
                            value={termino}
                            onChange={(e) => setTermino(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {idTurnoActual && (
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold px-2 py-1.5 bg-slate-100 rounded-xl cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={filtrarSoloEsteTurno}
                                    onChange={(e) => setFiltrarSoloEsteTurno(e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                                <span>Solo mi turno</span>
                            </label>
                        )}

                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                            Buscar
                        </button>
                    </div>
                </form>

                {/* Contenido en dos columnas: Lista a la izquierda, Detalle a la derecha */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden min-h-0">
                    {/* Lista de Transacciones */}
                    <div className="md:col-span-5 border border-slate-200 rounded-2xl overflow-y-auto divide-y divide-slate-100 bg-white">
                        {cargando ? (
                            <div className="py-12 text-center text-xs text-slate-500">
                                Cargando transacciones...
                            </div>
                        ) : ventas.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400 p-4">
                                No se encontraron ventas con los filtros aplicados.
                            </div>
                        ) : (
                            ventas.map((v) => {
                                const esSeleccionada = ventaSeleccionada?.id_venta === v.id_venta
                                const esAnulada = v.estado === 'ANULADA'

                                return (
                                    <button
                                        key={v.id_venta}
                                        type="button"
                                        onClick={() => {
                                            setVentaSeleccionada(v)
                                            setMostrarPromptAnular(false)
                                        }}
                                        className={`w-full p-3 text-left transition cursor-pointer flex flex-col gap-1 ${
                                            esSeleccionada
                                                ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-xs text-slate-900">
                                                {v.numero_ticket || `#${v.id_venta}`}
                                            </span>
                                            <span
                                                className={`text-3xs font-extrabold px-1.5 py-0.5 rounded-full ${
                                                    esAnulada
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}
                                            >
                                                {v.estado}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-2xs text-slate-500">
                                            <span className="truncate max-w-[130px]">
                                                {v.nombre_cliente || 'Consumidor Final'}
                                            </span>
                                            <span className="font-bold font-mono text-slate-900 text-xs">
                                                {formatearMoneda(v.total)}
                                            </span>
                                        </div>

                                        <p className="text-3xs text-slate-400">
                                            {new Date(v.fecha).toLocaleString('es-CO', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            })} • {v.vendedor}
                                        </p>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Detalle de la Transacción Seleccionada */}
                    <div className="md:col-span-7 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between overflow-y-auto">
                        {ventaSeleccionada ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                    <div>
                                        <span className="font-mono font-extrabold text-sm text-slate-900">
                                            {ventaSeleccionada.numero_ticket}
                                        </span>
                                        <p className="text-2xs text-slate-500">
                                            Vendedor: {ventaSeleccionada.vendedor} • Fecha: {new Date(ventaSeleccionada.fecha).toLocaleString('es-CO')}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            ventaSeleccionada.estado === 'ANULADA'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                    >
                                        {ventaSeleccionada.estado}
                                    </span>
                                </div>

                                {ventaSeleccionada.estado === 'ANULADA' && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-2xs text-red-800 space-y-0.5">
                                        <p className="font-bold">VENTA ANULADA</p>
                                        <p>Motivo: {ventaSeleccionada.motivo_anulacion}</p>
                                        <p className="opacity-80">
                                            Fecha: {new Date(ventaSeleccionada.fecha_anulacion).toLocaleString('es-CO')}
                                        </p>
                                    </div>
                                )}

                                {/* Lista de productos de la venta */}
                                <div className="space-y-1.5">
                                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                                        Productos Facturados ({ventaSeleccionada.productos?.length || 0})
                                    </p>
                                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                                        {ventaSeleccionada.productos?.map((p, idx) => (
                                            <div key={idx} className="p-2 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-slate-800">{p.nombre}</p>
                                                    <p className="text-3xs text-slate-400 font-mono">
                                                        {p.unidades} ud(s) x {formatearMoneda(p.precio_unitario)}
                                                    </p>
                                                </div>
                                                <span className="font-bold font-mono text-slate-900">
                                                    {formatearMoneda(p.total)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Desglose financiero */}
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-2xs space-y-1">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">{formatearMoneda(ventaSeleccionada.subtotal)}</span>
                                    </div>
                                    {ventaSeleccionada.descuento > 0 && (
                                        <div className="flex justify-between text-amber-700">
                                            <span>Descuentos:</span>
                                            <span className="font-mono">- {formatearMoneda(ventaSeleccionada.descuento)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-600">
                                        <span>IVA:</span>
                                        <span className="font-mono">+ {formatearMoneda(ventaSeleccionada.impuesto)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-xs text-slate-900 pt-1 border-t border-slate-100">
                                        <span>Total:</span>
                                        <span className="font-mono text-emerald-700">{formatearMoneda(ventaSeleccionada.total)}</span>
                                    </div>
                                </div>

                                {/* Formulario para Anulación */}
                                {mostrarPromptAnular ? (
                                    <form onSubmit={handleConfirmarAnulacion} className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2">
                                        <h5 className="font-bold text-xs text-red-900">
                                            Confirmar Anulación de Venta
                                        </h5>
                                        <p className="text-3xs text-red-700">
                                            Esta acción revertirá las existencias vendidas al inventario y marcará el ticket como anulado.
                                        </p>
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            placeholder="Ingresa el motivo obligatorio de la anulación..."
                                            value={motivoAnulacion}
                                            onChange={(e) => setMotivoAnulacion(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                                        />
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setMostrarPromptAnular(false)}
                                                className="px-3 py-1 text-2xs text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isPending}
                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-2xs rounded-lg shadow-xs disabled:opacity-50"
                                            >
                                                {isPending ? 'Anulando...' : 'Confirmar Anulación'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Acciones de detalle */
                                    <div className="flex items-center justify-between pt-2">
                                        {ventaSeleccionada.estado === 'COMPLETADA' && (
                                            <button
                                                type="button"
                                                onClick={() => setMostrarPromptAnular(true)}
                                                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition cursor-pointer"
                                            >
                                                Anular Venta
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => onReimprimirTicket(ventaSeleccionada)}
                                            className="ml-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            <span>Reimprimir Comprobante</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                <svg className="w-10 h-10 mb-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                <p className="text-xs font-semibold">Selecciona una venta de la lista para ver el desglose completo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
