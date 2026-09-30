'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/auth/actions'

export async function obtenerReporteVentas({
    periodo = 'hoy', // 'hoy' | 'ayer' | 'semana' | 'mes' | 'personalizado'
    fechaInicio = '',
    fechaFin = '',
    idVendedor = '',
    estado = '',
}) {
    try {
        const user = await getCurrentUser()
        if (!user || user.rol !== 'SUPERVISOR') {
            return { ok: false, error: 'No autorizado. Se requiere rol SUPERVISOR.' }
        }

        const ahora = new Date()
        let inicio = new Date()
        let fin = new Date()

        if (periodo === 'hoy') {
            inicio.setHours(0, 0, 0, 0)
            fin.setHours(23, 59, 59, 999)
        } else if (periodo === 'ayer') {
            inicio.setDate(ahora.getDate() - 1)
            inicio.setHours(0, 0, 0, 0)
            fin.setDate(ahora.getDate() - 1)
            fin.setHours(23, 59, 59, 999)
        } else if (periodo === 'semana') {
            inicio.setDate(ahora.getDate() - 7)
            inicio.setHours(0, 0, 0, 0)
            fin.setHours(23, 59, 59, 999)
        } else if (periodo === 'mes') {
            inicio.setDate(1)
            inicio.setHours(0, 0, 0, 0)
            fin.setHours(23, 59, 59, 999)
        } else if (periodo === 'personalizado') {
            if (fechaInicio) {
                inicio = new Date(fechaInicio)
                inicio.setHours(0, 0, 0, 0)
            } else {
                inicio.setHours(0, 0, 0, 0)
            }
            if (fechaFin) {
                fin = new Date(fechaFin)
                fin.setHours(23, 59, 59, 999)
            } else {
                fin.setHours(23, 59, 59, 999)
            }
        }

        const where = {
            fecha: {
                gte: inicio,
                lte: fin,
            },
        }

        if (idVendedor) {
            where.id_vendedor = idVendedor
        }

        if (estado) {
            where.estado = estado
        }

        const [ventas, vendedores] = await Promise.all([
            prisma.venta.findMany({
                where,
                orderBy: { fecha: 'desc' },
                include: {
                    vendedor: {
                        select: { id: true, nombre: true, apellido: true, correo: true },
                    },
                    pagos: {
                        include: { metodoPago: true },
                    },
                    productos: {
                        include: {
                            producto: {
                                select: { nombre: true, codigo: true, categoria: { select: { nombre: true } } },
                            },
                        },
                    },
                },
            }),
            prisma.usuario.findMany({
                where: { estado: 'ACTIVO' },
                select: { id: true, nombre: true, apellido: true },
                orderBy: { nombre: 'asc' },
            }),
        ])

        // Métricas de Resumen
        let volumenTotalVendido = 0
        let totalImpuestosRecaudados = 0
        let totalDescuentosOtorgados = 0
        let ventasCompletadasCount = 0
        let ventasAnuladasCount = 0

        const desgloseMetodos = {}
        const mapaTopProductos = {}

        for (const v of ventas) {
            const totalVenta = Number(v.total)
            const impuesto = Number(v.impuesto)
            const descuento = Number(v.descuento)

            if (v.estado === 'COMPLETADA') {
                volumenTotalVendido += totalVenta
                totalImpuestosRecaudados += impuesto
                totalDescuentosOtorgados += descuento
                ventasCompletadasCount += 1

                // Desglose por método de pago
                for (const p of v.pagos) {
                    const cod = p.metodoPago?.codigo || 'OTRO'
                    const nom = p.metodoPago?.nombre || 'Otro'
                    const monto = Number(p.monto)

                    if (!desgloseMetodos[cod]) {
                        desgloseMetodos[cod] = { codigo: cod, nombre: nom, total: 0, count: 0 }
                    }
                    desgloseMetodos[cod].total += monto
                    desgloseMetodos[cod].count += 1
                }

                // Top productos
                for (const item of v.productos) {
                    const cod = item.cod_producto
                    const nom = item.producto?.nombre || cod
                    const cat = item.producto?.categoria?.nombre || 'General'
                    const cant = item.unidades
                    const tot = Number(item.total)

                    if (!mapaTopProductos[cod]) {
                        mapaTopProductos[cod] = { codigo: cod, nombre: nom, categoria: cat, unidades: 0, total: 0 }
                    }
                    mapaTopProductos[cod].unidades += cant
                    mapaTopProductos[cod].total += tot
                }
            } else if (v.estado === 'ANULADA') {
                ventasAnuladasCount += 1
            }
        }

        const ticketPromedio =
            ventasCompletadasCount > 0 ? volumenTotalVendido / ventasCompletadasCount : 0

        const topProductos = Object.values(mapaTopProductos)
            .sort((a, b) => b.unidades - a.unidades)
            .slice(0, 5)

        return {
            ok: true,
            kpis: {
                volumenTotalVendido,
                ventasCompletadasCount,
                ventasAnuladasCount,
                ticketPromedio,
                totalImpuestosRecaudados,
                totalDescuentosOtorgados,
                desgloseMetodos: Object.values(desgloseMetodos),
                topProductos,
            },
            ventas: ventas.map((v) => ({
                id_venta: v.id_venta,
                numero_ticket: v.numero_ticket || `#${v.id_venta}`,
                fecha: v.fecha,
                estado: v.estado,
                vendedor: `${v.vendedor.nombre} ${v.vendedor.apellido}`,
                ced_cliente: v.ced_cliente,
                nombre_cliente: v.nombre_cliente,
                subtotal: Number(v.subtotal),
                descuento: Number(v.descuento),
                impuesto: Number(v.impuesto),
                total: Number(v.total),
                motivo_anulacion: v.motivo_anulacion,
                pagos: v.pagos.map((p) => ({
                    metodo: p.metodoPago?.nombre || 'Otro',
                    monto: Number(p.monto),
                    referencia: p.referencia,
                })),
                productos: v.productos.map((it) => ({
                    codigo: it.cod_producto,
                    nombre: it.producto?.nombre || it.cod_producto,
                    unidades: it.unidades,
                    total: Number(it.total),
                })),
            })),
            vendedores,
        }
    } catch (e) {
        console.error('Error al obtener reporte de ventas:', e)
        return { ok: false, error: 'Error al generar reporte de ventas' }
    }
}
