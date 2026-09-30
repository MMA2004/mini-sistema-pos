'use client'

import { useState, useTransition } from 'react'
import { formatearMoneda } from '@/utils/posCalculations'
import { obtenerReporteVentas } from './actions'
import ModalTicketVenta from '@/app/pos/components/ModalTicketVenta'

export default function VentasReporteClient({
    initialData,
}) {
    const [periodo, setPeriodo] = useState('hoy')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState('')
    const [estadoSeleccionado, setEstadoSeleccionado] = useState('')
    const [filtroTexto, setFiltroTexto] = useState('')

    const [data, setData] = useState(initialData)
    const [isPending, startTransition] = useTransition()
    const [ticketParaImprimir, setTicketParaImprimir] = useState(null)
    const [ventaDetalleModal, setVentaDetalleModal] = useState(null)

    const aplicarFiltros = (nuevoPeriodo = periodo) => {
        startTransition(async () => {
            const res = await obtenerReporteVentas({
                periodo: nuevoPeriodo,
                fechaInicio,
                fechaFin,
                idVendedor: vendedorSeleccionado,
                estado: estadoSeleccionado,
            })

            if (res.ok) {
                setData(res)
            }
        })
    }

    const handlePeriodoChange = (p) => {
        setPeriodo(p)
        aplicarFiltros(p)
    }

    const { kpis, ventas, vendedores } = data || {
        kpis: {},
        ventas: [],
        vendedores: [],
    }

    // Filtrado en vivo de la tabla por texto (ticket o cliente)
    const ventasFiltradas = ventas.filter((v) => {
        if (!filtroTexto.trim()) return true
        const q = filtroTexto.toLowerCase().trim()
        const matchTicket = v.numero_ticket?.toLowerCase().includes(q)
        const matchCliente = v.nombre_cliente?.toLowerCase().includes(q)
        const matchCed = v.ced_cliente?.toLowerCase().includes(q)
        return matchTicket || matchCliente || matchCed
    })

    // Función de Exportación a CSV compatible con Excel
    const exportarCSV = () => {
        if (ventasFiltradas.length === 0) {
            alert('No hay ventas para exportar con los filtros actuales')
            return
        }

        const headers = [
            'Ticket',
            'Fecha',
            'Vendedor',
            'Cliente',
            'Cedula',
            'Estado',
            'Metodos de Pago',
            'Subtotal',
            'Descuento',
            'IVA',
            'Total',
        ]

        const filas = ventasFiltradas.map((v) => [
            `"${v.numero_ticket}"`,
            `"${new Date(v.fecha).toLocaleString('es-CO')}"`,
            `"${v.vendedor}"`,
            `"${v.nombre_cliente || 'Consumidor Final'}"`,
            `"${v.ced_cliente || ''}"`,
            `"${v.estado}"`,
            `"${v.pagos?.map((p) => `${p.metodo}: $${p.monto}`).join(' / ') || ''}"`,
            v.subtotal,
            v.descuento,
            v.impuesto,
            v.total,
        ])

        const csvContent =
            '\uFEFF' +
            [headers.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const fechaHoy = new Date().toISOString().slice(0, 10)
        link.setAttribute('href', url)
        link.setAttribute('download', `reporte_ventas_${periodo}_${fechaHoy}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            {/* Cabecera y Selector de Periodos */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                        Reportes Comerciales
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900 mt-2">
                        Historial y Reporte Diario de Ventas
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Métricas consolidadas, volumen financiero, desglose impositivo y exportación de datos.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={exportarCSV}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Exportar a Excel (CSV)</span>
                    </button>
                </div>
            </div>

            {/* Pestañas de Periodo Rápido */}
            <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1">
                {[
                    { id: 'hoy', label: 'Ventas de Hoy' },
                    { id: 'ayer', label: 'Ayer' },
                    { id: 'semana', label: 'Últimos 7 Días' },
                    { id: 'mes', label: 'Este Mes' },
                    { id: 'personalizado', label: 'Rango Personalizado' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handlePeriodoChange(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            periodo === tab.id
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Selector de Rango Personalizado si aplica */}
            {periodo === 'personalizado' && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 animate-in fade-in">
                    <div>
                        <label className="block text-2xs uppercase text-slate-400 font-bold mb-1">
                            Fecha Inicial
                        </label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-2xs uppercase text-slate-400 font-bold mb-1">
                            Fecha Final
                        </label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                    </div>
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={() => aplicarFiltros('personalizado')}
                            className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition cursor-pointer"
                        >
                            Filtrar Fechas
                        </button>
                    </div>
                </div>
            )}

            {/* Tarjetas de Métricas Clave (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                    <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                        Volumen Total Vendido
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-1">
                        {formatearMoneda(kpis.volumenTotalVendido || 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {kpis.ventasCompletadasCount || 0} transacciones efectivas
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                    <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                        Ticket Promedio
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">
                        {formatearMoneda(kpis.ticketPromedio || 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Por venta completada
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                    <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                        IVA Recaudado
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono mt-1">
                        {formatearMoneda(kpis.totalImpuestosRecaudados || 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Descuentos: {formatearMoneda(kpis.totalDescuentosOtorgados || 0)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                    <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                        Estatus de Ventas
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-emerald-700">
                            {kpis.ventasCompletadasCount || 0} OK
                        </span>
                        {kpis.ventasAnuladasCount > 0 && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                {kpis.ventasAnuladasCount} anulada(s)
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Balance del periodo</p>
                </div>
            </div>

            {/* Paneles Intermedios: Desglose de Métodos y Top Productos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Desglose por Método de Pago */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                        <span>Recaudo por Medio de Pago</span>
                        <span className="text-2xs text-slate-400">Total ingresos</span>
                    </h3>

                    {kpis.desgloseMetodos?.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">Sin recaudos en este periodo</p>
                    ) : (
                        <div className="space-y-2">
                            {kpis.desgloseMetodos?.map((m) => (
                                <div key={m.codigo} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-bold text-slate-800">{m.nombre}</p>
                                        <p className="text-3xs text-slate-500">{m.count} cobro(s)</p>
                                    </div>
                                    <span className="font-mono font-extrabold text-sm text-slate-900">
                                        {formatearMoneda(m.total)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top 5 Productos Más Vendidos */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                        <span>Top 5 Productos Más Vendidos</span>
                        <span className="text-2xs text-slate-400">Por unidades</span>
                    </h3>

                    {kpis.topProductos?.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">Sin ventas en este periodo</p>
                    ) : (
                        <div className="space-y-2">
                            {kpis.topProductos?.map((p, idx) => (
                                <div key={p.codigo} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-2xs flex items-center justify-center shrink-0">
                                            #{idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-800 truncate max-w-[180px]">{p.nombre}</p>
                                            <p className="text-3xs text-slate-400 font-mono">SKU: {p.codigo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            {p.unidades} uds
                                        </span>
                                        <p className="text-3xs text-slate-500 font-mono mt-0.5">
                                            {formatearMoneda(p.total)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla Detallada de Transacciones */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            Registro de Transacciones ({ventasFiltradas.length})
                        </h2>
                        <p className="text-xs text-slate-500">Historial completo con desglose</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Selector de Vendedor */}
                        <select
                            value={vendedorSeleccionado}
                            onChange={(e) => {
                                setVendedorSeleccionado(e.target.value)
                                aplicarFiltros()
                            }}
                            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
                        >
                            <option value="">Todos los vendedores</option>
                            {vendedores.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.nombre} {v.apellido}
                                </option>
                            ))}
                        </select>

                        {/* Buscador de texto */}
                        <input
                            type="text"
                            placeholder="Buscar ticket o cliente..."
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/70 border-b border-slate-200 text-2xs uppercase tracking-wider text-slate-500 font-bold">
                            <tr>
                                <th className="px-4 py-3">Comprobante</th>
                                <th className="px-4 py-3">Fecha y Hora</th>
                                <th className="px-4 py-3">Cajero</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Medio de Pago</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ventasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-8 text-center text-slate-400">
                                        No hay ventas registradas para este criterio de búsqueda
                                    </td>
                                </tr>
                            ) : (
                                ventasFiltradas.map((v) => (
                                    <tr key={v.id_venta} className="hover:bg-slate-50/80 transition">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                            {v.numero_ticket}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                            {new Date(v.fecha).toLocaleString('es-CO', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            })}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {v.vendedor}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">
                                            {v.nombre_cliente || 'Consumidor Final'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {v.pagos?.map((p) => p.metodo).join(', ') || 'Efectivo'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatearMoneda(v.total)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`text-3xs font-extrabold px-2 py-0.5 rounded-full ${
                                                    v.estado === 'ANULADA'
                                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                }`}
                                            >
                                                {v.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setVentaDetalleModal(v)}
                                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Ver Detalle"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTicketParaImprimir(v)}
                                                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                                    title="Reimprimir Ticket"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detalle Rápido de Venta */}
            {ventaDetalleModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">
                                    Detalle del Comprobante {ventaDetalleModal.numero_ticket}
                                </h3>
                                <p className="text-2xs text-slate-500">
                                    {new Date(ventaDetalleModal.fecha).toLocaleString('es-CO')} • Por {ventaDetalleModal.vendedor}
                                </p>
                            </div>
                            <button
                                onClick={() => setVentaDetalleModal(null)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                {ventaDetalleModal.productos?.map((it, idx) => (
                                    <div key={idx} className="py-1.5 flex justify-between">
                                        <span>{it.unidades}x {it.nombre}</span>
                                        <span className="font-bold font-mono">{formatearMoneda(it.total)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-2xs">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal:</span>
                                    <span className="font-mono">{formatearMoneda(ventaDetalleModal.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>IVA:</span>
                                    <span className="font-mono">+{formatearMoneda(ventaDetalleModal.impuesto)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-xs text-slate-900 pt-1 border-t border-slate-100">
                                    <span>Total:</span>
                                    <span className="font-mono text-emerald-700">{formatearMoneda(ventaDetalleModal.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setTicketParaImprimir(ventaDetalleModal)
                                    setVentaDetalleModal(null)
                                }}
                                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                            >
                                Imprimir Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ticket para Reimpresión */}
            <ModalTicketVenta
                isOpen={Boolean(ticketParaImprimir)}
                venta={ticketParaImprimir}
                onNuevaVenta={() => setTicketParaImprimir(null)}
            />
        </div>
    )
}
