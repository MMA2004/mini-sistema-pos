'use client'

import { useRef } from 'react'
import { formatearMoneda } from '@/utils/posCalculations'

export default function ModalTicketVenta({
    isOpen,
    venta,
    onNuevaVenta,
}) {
    const ticketRef = useRef(null)

    if (!isOpen || !venta) return null

    const handleImprimir = () => {
        window.print()
    }

    const fechaFormateada = venta.fecha
        ? new Date(venta.fecha).toLocaleString('es-CO', {
            dateStyle: 'short',
            timeStyle: 'medium',
        })
        : ''

    const totales = venta.totales || {}
    const items = totales.items || venta.productos || []
    const pagos = venta.pagos || []

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 text-slate-800 my-8">
                {/* Cabecera modal (Oculta al imprimir) */}
                <div className="print:hidden flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                            ✓
                        </span>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">Venta Completada</h3>
                            <p className="text-2xs text-slate-500">Ticket generado exitosamente</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onNuevaVenta}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Comprobante Térmico POS (Estilizado para 80mm e impresión directa) */}
                <div
                    ref={ticketRef}
                    id="ticket-imprimible"
                    className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3 print:border-none print:p-0 print:m-0 print:bg-white print:text-black print:w-[80mm]"
                >
                    {/* Encabezado Comercio */}
                    <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                        <h2 className="text-base font-black tracking-tight uppercase">POS Express</h2>
                        <p className="text-3xs text-slate-600">NIT: 901.845.293-1</p>
                        <p className="text-3xs text-slate-600">Carrera 45 # 12-34, Bogotá D.C.</p>
                        <p className="text-3xs text-slate-600">Tel: (601) 789 4521</p>
                        <p className="text-3xs font-bold text-slate-700 mt-1">
                            RÉGIMEN COMÚN / FACTURA POS
                        </p>
                    </div>

                    {/* Metadata de Transacción */}
                    <div className="text-2xs space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                        <div className="flex justify-between font-bold">
                            <span>TICKET:</span>
                            <span>{venta.numero_ticket || `#${venta.id_venta}`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>FECHA:</span>
                            <span>{fechaFormateada}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>CLIENTE:</span>
                            <span className="truncate max-w-[180px]">
                                {venta.nombre_cliente || 'Consumidor Final'}
                            </span>
                        </div>
                        {venta.ced_cliente && (
                            <div className="flex justify-between">
                                <span>DOC/NIT:</span>
                                <span>{venta.ced_cliente}</span>
                            </div>
                        )}
                    </div>

                    {/* Detalle de Productos */}
                    <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
                        <div className="flex justify-between text-3xs font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                            <span>Cant. Producto</span>
                            <span>Total</span>
                        </div>

                        {items.map((it, idx) => (
                            <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between items-baseline font-bold text-2xs">
                                    <span className="truncate max-w-[200px]">
                                        {it.unidades} x {it.nombre}
                                    </span>
                                    <span>{formatearMoneda(it.totalLinea || it.total)}</span>
                                </div>
                                <div className="flex justify-between text-3xs text-slate-500">
                                    <span>SKU: {it.codigo} ({formatearMoneda(it.precioUnitario || it.precio_unitario)} c/u)</span>
                                    {it.descuentoMonto > 0 && (
                                        <span className="text-amber-800">Desc: -{formatearMoneda(it.descuentoMonto)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totales e Impuestos */}
                    <div className="text-2xs space-y-1 border-b border-dashed border-slate-300 pb-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatearMoneda(totales.subtotalBruto || venta.subtotal)}</span>
                        </div>

                        {(totales.descuentoTotal > 0 || Number(venta.descuento) > 0) && (
                            <div className="flex justify-between text-amber-900 font-bold">
                                <span>Descuento:</span>
                                <span>- {formatearMoneda(totales.descuentoTotal || venta.descuento)}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span>Base Imponible:</span>
                            <span>{formatearMoneda(totales.subtotalNeto || (Number(venta.subtotal) - Number(venta.descuento)))}</span>
                        </div>

                        {totales.desgloseImpuestos?.map((imp) => (
                            <div key={imp.tasa} className="flex justify-between text-3xs text-slate-600">
                                <span>IVA {imp.tasa}%:</span>
                                <span>+ {formatearMoneda(imp.impuesto)}</span>
                            </div>
                        ))}

                        <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                            <span>TOTAL:</span>
                            <span>{formatearMoneda(totales.total || venta.total)}</span>
                        </div>
                    </div>

                    {/* Métodos de Pago y Cambio */}
                    <div className="text-2xs space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                        <p className="text-3xs font-bold uppercase text-slate-500 mb-1">
                            VÍAS DE PAGO:
                        </p>
                        {pagos.map((p, idx) => (
                            <div key={idx} className="flex justify-between">
                                <span>{p.nombreMetodo || p.metodo || 'Pago'}:</span>
                                <span className="font-bold">{formatearMoneda(p.monto)}</span>
                            </div>
                        ))}

                        {pagos.some((p) => Number(p.cambio_devuelto) > 0) && (
                            <div className="flex justify-between font-bold text-emerald-800 pt-1">
                                <span>CAMBIO / VUELTO:</span>
                                <span>
                                    {formatearMoneda(
                                        pagos.reduce((acc, p) => acc + (Number(p.cambio_devuelto) || 0), 0)
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Pie de Ticket */}
                    <div className="text-center text-3xs text-slate-500 pt-1 space-y-1">
                        <p className="font-bold text-slate-700">¡GRACIAS POR SU COMPRA!</p>
                        <p>Conserve este ticket para cualquier cambio o garantía.</p>
                        <p className="text-4xs text-slate-400">Software POS Express v2.0</p>
                    </div>
                </div>

                {/* Acciones del Modal (Ocultas al imprimir) */}
                <div className="print:hidden space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleImprimir}
                            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Imprimir Ticket</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleImprimir}
                            className="py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Guardar PDF</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onNuevaVenta}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Iniciar Nueva Venta</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
