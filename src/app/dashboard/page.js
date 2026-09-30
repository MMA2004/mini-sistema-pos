import { getCurrentUser } from '@/app/auth/actions'
import { prisma } from '@/lib/prisma'
import { formatearMoneda } from '@/utils/posCalculations'
import Link from 'next/link'

export default async function DashboardPage() {
    const user = await getCurrentUser()

    // Métricas y datos operativos en tiempo real
    let totalUsuarios = 0
    let usuariosPendientes = 0
    let totalCategorias = 0
    let totalProductos = 0
    let productosBajoStockList = []
    let ultimosMovimientos = []
    let totalVentasHoy = 0
    let cantidadVentasHoy = 0
    let turnosActivosCount = 0

    try {
        const inicioHoy = new Date()
        inicioHoy.setHours(0, 0, 0, 0)

        const [
            usuariosCount,
            usuariosPendientesCount,
            categoriasCount,
            productos,
            movimientos,
            ventasHoy,
            turnosAbiertos,
        ] = await Promise.all([
            prisma.usuario.count(),
            prisma.usuario.count({ where: { estado: 'INACTIVO' } }),
            prisma.categoria.count({ where: { activo: true } }),
            prisma.producto.findMany({
                where: { activo: true },
                include: { categoria: { select: { nombre: true } } },
                orderBy: { nombre: 'asc' },
            }),
            prisma.historicoCambiosStock.findMany({
                take: 5,
                orderBy: { fecha: 'desc' },
                include: {
                    producto: { select: { nombre: true } },
                    usuario: { select: { nombre: true, apellido: true } },
                },
            }),
            prisma.venta.findMany({
                where: {
                    fecha: { gte: inicioHoy },
                    estado: 'COMPLETADA',
                },
                select: { total: true },
            }),
            prisma.turnoCaja.count({
                where: { estado: 'ABIERTO' },
            }),
        ])

        totalUsuarios = usuariosCount
        usuariosPendientes = usuariosPendientesCount
        totalCategorias = categoriasCount
        totalProductos = productos.length
        productosBajoStockList = productos.filter((p) => p.unidades_totales <= p.stock_minimo)
        ultimosMovimientos = movimientos
        cantidadVentasHoy = ventasHoy.length
        totalVentasHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0)
        turnosActivosCount = turnosAbiertos
    } catch (e) {
        console.error('Error al cargar datos del dashboard:', e)
    }

    return (
        <div className="space-y-6">
            {/* Banner de Bienvenida */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
                            Panel de Control Administrativo
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                            Supervisor: {user?.nombre || 'Administrador'}
                        </h1>
                        <p className="text-slate-600 text-sm mt-1">
                            Supervisión de inventario, ventas del día, arqueos y canales de pago.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/pos"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Abrir Punto de Venta
                        </Link>
                    </div>
                </div>
            </div>

            {/* Banner de Aprobaciones Pendientes */}
            {usuariosPendientes > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-950">
                                {usuariosPendientes === 1
                                    ? 'Hay 1 usuario pendiente de aprobación'
                                    : `Hay ${usuariosPendientes} usuarios pendientes de aprobación`}
                            </h3>
                            <p className="text-xs text-amber-800 mt-0.5">
                                Los nuevos cajeros registrados necesitan autorización de un supervisor para acceder al punto de venta.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/vendedores"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
                    >
                        Revisar y Aprobar →
                    </Link>
                </div>
            )}

            {/* Tarjetas de Métricas Operativas y Financieras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Ventas de Hoy */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas de Hoy</p>
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-2">
                        {formatearMoneda(totalVentasHoy)}
                    </p>
                    <Link href="/dashboard/ventas" className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 mt-2">
                        {cantidadVentasHoy} transacciones • Ver reporte →
                    </Link>
                </div>

                {/* 2. Cajas / Turnos Activos */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-indigo-300 transition">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cajas Activas</p>
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-3xl font-extrabold text-slate-900">{turnosActivosCount}</p>
                        <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Turno(s) en curso
                        </span>
                    </div>
                    <Link href="/pos" className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 mt-2">
                        Ir a terminal de caja →
                    </Link>
                </div>

                {/* 3. Alerta Stock Crítico */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-amber-300 transition">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alerta Stock Crítico</p>
                        <span className={`p-2 rounded-lg ${productosBajoStockList.length > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </span>
                    </div>
                    <p className={`text-3xl font-extrabold mt-2 ${productosBajoStockList.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {productosBajoStockList.length}
                    </p>
                    <Link href="/dashboard/stock" className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1 mt-2">
                        Ajustar existencias →
                    </Link>
                </div>

                {/* 4. Catálogo Activo */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-purple-300 transition">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos Activos</p>
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalProductos}</p>
                    <Link href="/dashboard/productos" className="text-xs font-bold text-purple-600 hover:underline inline-flex items-center gap-1 mt-2">
                        Ver catálogo ({totalCategorias} categorías) →
                    </Link>
                </div>
            </div>

            {/* Paneles Operativos de Monitoreo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Alertas de Stock Crítico */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <h2 className="text-base font-bold text-slate-900">
                                    Productos con Stock Crítico
                                </h2>
                            </div>
                            <Link href="/dashboard/stock" className="text-xs font-semibold text-amber-700 hover:underline">
                                Ir a Control de Stock →
                            </Link>
                        </div>

                        {productosBajoStockList.length === 0 ? (
                            <div className="py-10 text-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Todo el inventario está en niveles óptimos
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    No hay productos con existencias por debajo del mínimo establecido.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 mt-2">
                                {productosBajoStockList.slice(0, 5).map((prod) => (
                                    <div key={prod.codigo} className="py-3 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{prod.nombre}</p>
                                            <p className="text-xs text-slate-400 font-mono">
                                                SKU: {prod.codigo} • {prod.categoria?.nombre || 'General'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                                prod.unidades_totales === 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {prod.unidades_totales} uds (mín: {prod.stock_minimo})
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Últimos Movimientos de Inventario */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                <h2 className="text-base font-bold text-slate-900">
                                    Últimos Ajustes de Inventario
                                </h2>
                            </div>
                            <Link href="/dashboard/stock" className="text-xs font-semibold text-indigo-600 hover:underline">
                                Ver historial completo →
                            </Link>
                        </div>

                        {ultimosMovimientos.length === 0 ? (
                            <div className="py-10 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Sin movimientos de stock registrados
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Los ajustes manuales o recepciones de compra aparecerán aquí.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 mt-2">
                                {ultimosMovimientos.map((mov) => {
                                    const diff = mov.stock_nuevo - mov.stock_original
                                    const isPositive = diff > 0
                                    const isZero = diff === 0

                                    return (
                                        <div key={mov.id_cambio} className="py-3 flex items-center justify-between gap-3 text-sm">
                                            <div>
                                                <p className="font-semibold text-slate-900 text-xs">
                                                    {mov.producto?.nombre || mov.cod_producto}
                                                </p>
                                                <p className="text-2xs text-slate-400 mt-0.5">
                                                    Por {mov.usuario?.nombre} • {new Date(mov.fecha).toLocaleDateString('es-CO')}
                                                </p>
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <span className={`text-xs font-bold ${
                                                    isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {mov.stock_original} → {mov.stock_nuevo} ({isPositive ? `+${diff}` : diff})
                                                </span>
                                                <p className="text-2xs text-slate-400 uppercase font-semibold">
                                                    {mov.motivo}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
