'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/auth/actions'
import { revalidatePath } from 'next/cache'
import { calcularTotalesOrden } from '@/utils/posCalculations'

function serializarTurno(t, liveTotals = {}) {
    if (!t) return null
    const montoApertura = Number(t.monto_apertura) || 0
    const totalVentas = liveTotals.total_ventas != null ? liveTotals.total_ventas : (Number(t.total_ventas) || 0)
    const totalEfectivo = liveTotals.total_efectivo != null ? liveTotals.total_efectivo : (Number(t.total_efectivo) || 0)
    const totalOtrosMetodos = liveTotals.total_otros_metodos != null ? liveTotals.total_otros_metodos : (Number(t.total_otros_metodos) || 0)
    const efectivoEsperado = liveTotals.efectivo_esperado != null ? liveTotals.efectivo_esperado : (montoApertura + totalEfectivo)

    return {
        id_turno: t.id_turno,
        id_usuario: t.id_usuario,
        fecha_apertura: t.fecha_apertura,
        fecha_cierre: t.fecha_cierre,
        monto_apertura: montoApertura,
        monto_cierre_esperado: t.monto_cierre_esperado != null ? Number(t.monto_cierre_esperado) : null,
        monto_cierre_real: t.monto_cierre_real != null ? Number(t.monto_cierre_real) : null,
        diferencia: t.diferencia != null ? Number(t.diferencia) : null,
        total_ventas: totalVentas,
        total_efectivo: totalEfectivo,
        total_otros_metodos: totalOtrosMetodos,
        efectivo_esperado: efectivoEsperado,
        estado: t.estado,
        observaciones_apertura: t.observaciones_apertura,
        observaciones_cierre: t.observaciones_cierre,
        cantidad_ventas: liveTotals.cantidad_ventas || 0,
    }
}

/**
 * Obtiene el turno activo del cajero en sesión
 */
export async function obtenerTurnoActivo() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { ok: false, error: 'No autenticado' }
        }

        const turno = await prisma.turnoCaja.findFirst({
            where: {
                id_usuario: user.id,
                estado: 'ABIERTO',
            },
            orderBy: {
                fecha_apertura: 'desc',
            },
            include: {
                ventas: {
                    where: { estado: 'COMPLETADA' },
                    include: {
                        pagos: {
                            include: {
                                metodoPago: true,
                            },
                        },
                    },
                },
            },
        })

        if (!turno) {
            return { ok: true, tieneTurnoActivo: false, turno: null }
        }

        // Calcular totales dinámicos en vivo del turno
        let totalVentas = 0
        let totalEfectivo = 0
        let totalOtrosMetodos = 0

        for (const venta of turno.ventas) {
            totalVentas += Number(venta.total)
            for (const pago of venta.pagos) {
                if (pago.metodoPago?.codigo === 'EFECTIVO') {
                    totalEfectivo += Number(pago.monto)
                } else {
                    totalOtrosMetodos += Number(pago.monto)
                }
            }
        }

        const montoApertura = Number(turno.monto_apertura)
        const efectivoEsperado = montoApertura + totalEfectivo

        return {
            ok: true,
            tieneTurnoActivo: true,
            turno: serializarTurno(turno, {
                total_ventas: totalVentas,
                total_efectivo: totalEfectivo,
                total_otros_metodos: totalOtrosMetodos,
                efectivo_esperado: efectivoEsperado,
                cantidad_ventas: turno.ventas.length,
            }),
        }
    } catch (e) {
        console.error('Error al obtener turno activo:', e)
        return { ok: false, error: 'Error al consultar turno de caja' }
    }
}

/**
 * Abre un nuevo turno de caja para el cajero
 */
export async function abrirTurno({ montoApertura, observaciones }) {
    try {
        const user = await getCurrentUser()
        if (!user || user.estado !== 'ACTIVO') {
            return { ok: false, error: 'Usuario no autorizado o inactivo' }
        }

        // Verificar que no tenga ya un turno abierto
        const turnoExistente = await prisma.turnoCaja.findFirst({
            where: {
                id_usuario: user.id,
                estado: 'ABIERTO',
            },
        })

        if (turnoExistente) {
            return { ok: false, error: 'Ya tienes un turno de caja abierto actualmente' }
        }

        const baseInicial = Math.max(0, Number(montoApertura) || 0)

        const nuevoTurno = await prisma.turnoCaja.create({
            data: {
                id_usuario: user.id,
                monto_apertura: baseInicial,
                estado: 'ABIERTO',
                observaciones_apertura: observaciones?.trim() || null,
            },
        })

        revalidatePath('/pos')
        return { ok: true, turno: serializarTurno(nuevoTurno) }
    } catch (e) {
        console.error('Error al abrir turno:', e)
        return { ok: false, error: 'No se pudo abrir el turno de caja' }
    }
}

/**
 * Obtiene el resumen detallado para el arqueo de caja
 */
export async function obtenerResumenArqueo(idTurno) {
    try {
        const user = await getCurrentUser()
        if (!user) return { ok: false, error: 'No autenticado' }

        const turno = await prisma.turnoCaja.findUnique({
            where: { id_turno: Number(idTurno) },
            include: {
                cajero: {
                    select: { nombre: true, apellido: true, correo: true },
                },
                ventas: {
                    where: { estado: 'COMPLETADA' },
                    include: {
                        pagos: {
                            include: {
                                metodoPago: true,
                            },
                        },
                    },
                },
            },
        })

        if (!turno) {
            return { ok: false, error: 'Turno no encontrado' }
        }

        const baseInicial = Number(turno.monto_apertura)
        let totalVentas = 0
        let totalEfectivo = 0
        let totalOtros = 0

        // Desglose por método de pago
        const desgloseMetodos = {}

        for (const v of turno.ventas) {
            totalVentas += Number(v.total)
            for (const p of v.pagos) {
                const cod = p.metodoPago?.codigo || 'OTRO'
                const nom = p.metodoPago?.nombre || 'Otro'
                const monto = Number(p.monto)

                if (!desgloseMetodos[cod]) {
                    desgloseMetodos[cod] = {
                        codigo: cod,
                        nombre: nom,
                        total: 0,
                        cantidadTransacciones: 0,
                    }
                }
                desgloseMetodos[cod].total += monto
                desgloseMetodos[cod].cantidadTransacciones += 1

                if (cod === 'EFECTIVO') {
                    totalEfectivo += monto
                } else {
                    totalOtros += monto
                }
            }
        }

        const efectivoEsperado = baseInicial + totalEfectivo

        return {
            ok: true,
            resumen: {
                id_turno: turno.id_turno,
                cajero: `${turno.cajero.nombre} ${turno.cajero.apellido}`,
                fecha_apertura: turno.fecha_apertura,
                baseInicial,
                totalVentas,
                totalEfectivo,
                totalOtros,
                efectivoEsperado,
                cantidadVentas: turno.ventas.length,
                desgloseMetodos: Object.values(desgloseMetodos),
            },
        }
    } catch (e) {
        console.error('Error al obtener arqueo:', e)
        return { ok: false, error: 'Error al generar arqueo de caja' }
    }
}

/**
 * Cierra formalmente el turno de caja y registra el arqueo
 */
export async function cerrarTurno({ idTurno, montoContado, observacionesCierre }) {
    try {
        const user = await getCurrentUser()
        if (!user) return { ok: false, error: 'No autenticado' }

        const turno = await prisma.turnoCaja.findUnique({
            where: { id_turno: Number(idTurno) },
            include: {
                ventas: {
                    where: { estado: 'COMPLETADA' },
                    include: { pagos: { include: { metodoPago: true } } },
                },
            },
        })

        if (!turno || turno.estado === 'CERRADO') {
            return { ok: false, error: 'El turno no existe o ya está cerrado' }
        }

        const baseInicial = Number(turno.monto_apertura)
        let totalVentas = 0
        let totalEfectivo = 0
        let totalOtros = 0

        for (const v of turno.ventas) {
            totalVentas += Number(v.total)
            for (const p of v.pagos) {
                if (p.metodoPago?.codigo === 'EFECTIVO') {
                    totalEfectivo += Number(p.monto)
                } else {
                    totalOtros += Number(p.monto)
                }
            }
        }

        const efectivoEsperado = baseInicial + totalEfectivo
        const efectivoReal = Math.max(0, Number(montoContado) || 0)
        const diferencia = efectivoReal - efectivoEsperado

        const turnoActualizado = await prisma.turnoCaja.update({
            where: { id_turno: turno.id_turno },
            data: {
                fecha_cierre: new Date(),
                monto_cierre_esperado: efectivoEsperado,
                monto_cierre_real: efectivoReal,
                diferencia: diferencia,
                total_ventas: totalVentas,
                total_efectivo: totalEfectivo,
                total_otros_metodos: totalOtros,
                estado: 'CERRADO',
                observaciones_cierre: observacionesCierre?.trim() || null,
            },
        })

        revalidatePath('/pos')
        revalidatePath('/dashboard')

        return {
            ok: true,
            turno: serializarTurno(turnoActualizado),
            resumenCierre: {
                efectivoEsperado,
                efectivoReal,
                diferencia,
                totalVentas,
            },
        }
    } catch (e) {
        console.error('Error al cerrar turno:', e)
        return { ok: false, error: 'Error al procesar cierre de caja' }
    }
}

/**
 * Obtiene los datos iniciales para el funcionamiento del POS
 */
export async function obtenerDatosInicialesPOS() {
    try {
        const [productos, categorias, metodosPago] = await Promise.all([
            prisma.producto.findMany({
                where: { activo: true },
                select: {
                    codigo: true,
                    nombre: true,
                    descripcion: true,
                    precio_unitario: true,
                    porcentaje_iva: true,
                    unidades_totales: true,
                    stock_minimo: true,
                    id_categoria: true,
                    categoria: {
                        select: {
                            id_categoria: true,
                            nombre: true,
                        },
                    },
                },
                orderBy: { nombre: 'asc' },
            }),
            prisma.categoria.findMany({
                where: { activo: true },
                select: {
                    id_categoria: true,
                    nombre: true,
                },
                orderBy: { nombre: 'asc' },
            }),
            prisma.metodoPagoConfig.findMany({
                where: { activo: true },
                orderBy: { orden: 'asc' },
            }),
        ])

        return {
            ok: true,
            productos: productos.map((p) => ({
                ...p,
                precio_unitario: Number(p.precio_unitario),
                porcentaje_iva: Number(p.porcentaje_iva ?? 19),
            })),
            categorias,
            metodosPago,
        }
    } catch (e) {
        console.error('Error al cargar datos iniciales del POS:', e)
        return { ok: false, error: 'Error al cargar catálogo del POS', productos: [], categorias: [], metodosPago: [] }
    }
}

/**
 * Procesa formalmente una venta con transacción atómica en BD
 */
export async function procesarVenta({
    idTurno,
    cedCliente,
    nombreCliente,
    items,
    descuentoGlobalPorcentaje = 0,
    descuentoGlobalMonto = 0,
    pagos = [],
}) {
    try {
        const user = await getCurrentUser()
        if (!user || user.estado !== 'ACTIVO') {
            return { ok: false, error: 'Usuario no autorizado' }
        }

        if (!items || items.length === 0) {
            return { ok: false, error: 'El carrito no tiene productos' }
        }

        if (!pagos || pagos.length === 0) {
            return { ok: false, error: 'Debe especificar al menos un método de pago' }
        }

        // Verificar turno activo
        const turno = await prisma.turnoCaja.findFirst({
            where: {
                id_turno: Number(idTurno),
                id_usuario: user.id,
                estado: 'ABIERTO',
            },
        })

        if (!turno) {
            return { ok: false, error: 'No hay un turno de caja abierto válido para registrar la venta' }
        }

        // Transacción atómica en Prisma
        const resultadoVenta = await prisma.$transaction(async (tx) => {
            // 1. Validar existencias de todos los productos y bloquear
            for (const item of items) {
                const prod = await tx.producto.findUnique({
                    where: { codigo: item.codigo },
                })

                if (!prod || !prod.activo) {
                    throw new Error(`El producto "${item.nombre || item.codigo}" ya no está disponible`)
                }

                if (prod.unidades_totales < item.unidades) {
                    throw new Error(
                        `Stock insuficiente para "${prod.nombre}". Disponibles: ${prod.unidades_totales}, Solicitadas: ${item.unidades}`
                    )
                }
            }

            // 2. Calcular totales oficiales en el servidor
            const totales = calcularTotalesOrden(items, descuentoGlobalPorcentaje, descuentoGlobalMonto)

            // Validar que los pagos cubran el total
            const totalPagado = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
            if (totalPagado < totales.total - 0.01) {
                throw new Error(
                    `El monto total de los pagos (${totalPagado}) no cubre el valor de la venta (${totales.total})`
                )
            }

            // 3. Generar número de ticket consecutivo único
            const conteoVentas = await tx.venta.count()
            const ahora = new Date()
            const anio = ahora.getFullYear()
            const mes = String(ahora.getMonth() + 1).padStart(2, '0')
            const consecutivo = String(conteoVentas + 1).padStart(6, '0')
            const numeroTicket = `TICK-${anio}${mes}-${consecutivo}`

            // Determinar método de pago principal para retrocompatibilidad
            let metodoPagoEnum = 'EFECTIVO'
            if (pagos.length === 1) {
                const codMetodo = pagos[0].codigoMetodo
                if (['TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'].includes(codMetodo)) {
                    metodoPagoEnum = codMetodo
                } else if (codMetodo !== 'EFECTIVO') {
                    metodoPagoEnum = 'OTRO'
                }
            } else {
                metodoPagoEnum = 'OTRO'
            }

            // 4. Crear registro Venta
            const venta = await tx.venta.create({
                data: {
                    numero_ticket: numeroTicket,
                    id_turno: turno.id_turno,
                    id_vendedor: user.id,
                    ced_cliente: cedCliente?.trim() || null,
                    nombre_cliente: nombreCliente?.trim() || null,
                    metodo_pago: metodoPagoEnum,
                    estado: 'COMPLETADA',
                    subtotal: totales.subtotalBruto,
                    descuento_porcentaje: totales.descuentoGlobalPorcentaje,
                    descuento: totales.descuentoTotal,
                    impuesto: totales.impuestoTotal,
                    total: totales.total,
                },
            })

            // 5. Crear VentaProducto y descontar inventario
            for (const it of totales.items) {
                await tx.ventaProducto.create({
                    data: {
                        id_venta: venta.id_venta,
                        cod_producto: it.codigo,
                        precio_unitario: it.precioUnitario,
                        unidades: it.unidades,
                        descuento_porcentaje: it.descuentoPorcentaje,
                        descuento_monto: it.descuentoMonto,
                        impuesto_porcentaje: it.porcentajeIva,
                        impuesto_monto: it.impuestoMonto,
                        subtotal: it.subtotalNeto,
                        total: it.totalLinea,
                    },
                })

                // Descontar inventario
                const prodActual = await tx.producto.findUnique({
                    where: { codigo: it.codigo },
                    select: { unidades_totales: true },
                })

                const stockOriginal = prodActual.unidades_totales
                const stockNuevo = stockOriginal - it.unidades

                await tx.producto.update({
                    where: { codigo: it.codigo },
                    data: { unidades_totales: stockNuevo },
                })

                // Registrar auditoría de stock
                await tx.historicoCambiosStock.create({
                    data: {
                        id_usuario: user.id,
                        cod_producto: it.codigo,
                        stock_original: stockOriginal,
                        stock_nuevo: stockNuevo,
                        motivo: 'VENTA',
                        observacion: `Venta #${venta.id_venta} (${numeroTicket})`,
                    },
                })
            }

            // 6. Crear VentaPago
            for (const p of pagos) {
                await tx.ventaPago.create({
                    data: {
                        id_venta: venta.id_venta,
                        id_metodo: Number(p.id_metodo),
                        monto: Number(p.monto),
                        monto_recibido: p.monto_recibido ? Number(p.monto_recibido) : null,
                        cambio_devuelto: p.cambio_devuelto ? Number(p.cambio_devuelto) : null,
                        referencia: p.referencia?.trim() || null,
                    },
                })
            }

            return {
                id_venta: venta.id_venta,
                numero_ticket: numeroTicket,
                fecha: venta.fecha,
                totales,
                ced_cliente: venta.ced_cliente,
                nombre_cliente: venta.nombre_cliente,
                pagos,
            }
        })

        revalidatePath('/pos')
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/stock')

        return { ok: true, venta: resultadoVenta }
    } catch (e) {
        console.error('Error al procesar venta:', e)
        return { ok: false, error: e.message || 'Error al completar la venta' }
    }
}

/**
 * Consulta de transacciones históricas con filtros
 */
export async function buscarVentas({
    termino = '',
    fechaInicio = '',
    fechaFin = '',
    idTurno = null,
    estado = '',
    limite = 30,
}) {
    try {
        const where = {}

        if (idTurno) {
            where.id_turno = Number(idTurno)
        }

        if (estado) {
            where.estado = estado
        }

        if (termino?.trim()) {
            const query = termino.trim()
            where.OR = [
                { numero_ticket: { contains: query, mode: 'insensitive' } },
                { nombre_cliente: { contains: query, mode: 'insensitive' } },
                { ced_cliente: { contains: query, mode: 'insensitive' } },
            ]
        }

        if (fechaInicio || fechaFin) {
            where.fecha = {}
            if (fechaInicio) {
                const inicio = new Date(fechaInicio)
                inicio.setHours(0, 0, 0, 0)
                where.fecha.gte = inicio
            }
            if (fechaFin) {
                const fin = new Date(fechaFin)
                fin.setHours(23, 59, 59, 999)
                where.fecha.lte = fin
            }
        }

        const ventas = await prisma.venta.findMany({
            where,
            take: Number(limite) || 30,
            orderBy: { fecha: 'desc' },
            include: {
                vendedor: {
                    select: { nombre: true, apellido: true, correo: true },
                },
                pagos: {
                    include: { metodoPago: true },
                },
                productos: {
                    include: {
                        producto: {
                            select: { nombre: true, codigo: true },
                        },
                    },
                },
            },
        })

        return {
            ok: true,
            ventas: ventas.map((v) => ({
                id_venta: v.id_venta,
                numero_ticket: v.numero_ticket,
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
                fecha_anulacion: v.fecha_anulacion,
                pagos: v.pagos.map((p) => ({
                    id_pago: p.id_pago,
                    metodo: p.metodoPago?.nombre || 'Otro',
                    codigoMetodo: p.metodoPago?.codigo || 'OTRO',
                    monto: Number(p.monto),
                    referencia: p.referencia,
                    cambio_devuelto: Number(p.cambio_devuelto || 0),
                })),
                productos: v.productos.map((it) => ({
                    codigo: it.cod_producto,
                    nombre: it.producto?.nombre || it.cod_producto,
                    unidades: it.unidades,
                    precio_unitario: Number(it.precio_unitario),
                    descuento_monto: Number(it.descuento_monto),
                    impuesto_monto: Number(it.impuesto_monto),
                    subtotal: Number(it.subtotal),
                    total: Number(it.total),
                })),
            })),
        }
    } catch (e) {
        console.error('Error al buscar ventas:', e)
        return { ok: false, error: 'Error al consultar historial de ventas', ventas: [] }
    }
}

/**
 * Anula una venta previamente completada y reincorpora el stock al inventario
 */
export async function anularVenta({ idVenta, motivo }) {
    try {
        const user = await getCurrentUser()
        if (!user || user.estado !== 'ACTIVO') {
            return { ok: false, error: 'Usuario no autorizado' }
        }

        if (!motivo?.trim()) {
            return { ok: false, error: 'Debe ingresar un motivo obligatorio para la anulación' }
        }

        const venta = await prisma.venta.findUnique({
            where: { id_venta: String(idVenta) },
            include: {
                productos: true,
            },
        })

        if (!venta) {
            return { ok: false, error: 'Venta no encontrada' }
        }

        if (venta.estado === 'ANULADA') {
            return { ok: false, error: 'La venta ya fue anulada previamente' }
        }

        // Transacción atómica de anulación y reversión de inventario
        await prisma.$transaction(async (tx) => {
            // 1. Marcar venta como ANULADA
            await tx.venta.update({
                where: { id_venta: venta.id_venta },
                data: {
                    estado: 'ANULADA',
                    motivo_anulacion: motivo.trim(),
                    fecha_anulacion: new Date(),
                    id_usuario_anulacion: user.id,
                },
            })

            // 2. Reincorporar stock a cada producto y registrar auditoría
            for (const it of venta.productos) {
                const prod = await tx.producto.findUnique({
                    where: { codigo: it.cod_producto },
                    select: { unidades_totales: true },
                })

                if (prod) {
                    const stockOriginal = prod.unidades_totales
                    const stockNuevo = stockOriginal + it.unidades

                    await tx.producto.update({
                        where: { codigo: it.cod_producto },
                        data: { unidades_totales: stockNuevo },
                    })

                    await tx.historicoCambiosStock.create({
                        data: {
                            id_usuario: user.id,
                            cod_producto: it.cod_producto,
                            stock_original: stockOriginal,
                            stock_nuevo: stockNuevo,
                            motivo: 'DEVOLUCION',
                            observacion: `Anulación venta #${venta.id_venta} (${venta.numero_ticket || 'S/N'}). Motivo: ${motivo.trim()}`,
                        },
                    })
                }
            }
        })

        revalidatePath('/pos')
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/stock')

        return { ok: true, mensaje: 'Venta anulada correctamente e inventario restablecido' }
    } catch (e) {
        console.error('Error al anular venta:', e)
        return { ok: false, error: e.message || 'Error al anular la venta' }
    }
}
