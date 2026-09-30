/**
 * Utilidades financieras y de cálculo para el punto de venta (POS)
 * Maneja redondeos seguros y cálculos consistentes de IVA y descuentos.
 */

/**
 * Formatea un valor numérico o Decimal a formato de moneda (COP por defecto)
 * @param {number|string} valor 
 * @param {boolean} incluirDecimales 
 * @returns {string}
 */
export function formatearMoneda(valor, incluirDecimales = false) {
    const num = Number(valor) || 0
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: incluirDecimales ? 2 : 0,
        maximumFractionDigits: incluirDecimales ? 2 : 0,
    }).format(num)
}

/**
 * Calcula los importes de una línea de producto en el carrito
 * @param {Object} item 
 * @param {number} item.precio_unitario
 * @param {number} item.unidades
 * @param {number} [item.descuento_porcentaje=0]
 * @param {number} [item.descuento_monto=0]
 * @param {number} [item.porcentaje_iva=19]
 */
export function calcularLineaProducto(item) {
    const precioUnitario = Number(item.precio_unitario) || 0
    const unidades = Math.max(1, Number(item.unidades) || 1)
    const subtotalBruto = precioUnitario * unidades

    let descuentoMonto = 0
    const pctDesc = Number(item.descuento_porcentaje) || 0
    const valDesc = Number(item.descuento_monto) || 0

    if (pctDesc > 0) {
        descuentoMonto = Math.min(subtotalBruto, (subtotalBruto * pctDesc) / 100)
    } else if (valDesc > 0) {
        descuentoMonto = Math.min(subtotalBruto, valDesc)
    }

    const subtotalNeto = Math.max(0, subtotalBruto - descuentoMonto)
    const pctIva = Number(item.porcentaje_iva ?? 19)
    const impuestoMonto = (subtotalNeto * pctIva) / 100
    const totalLinea = subtotalNeto + impuestoMonto

    return {
        precioUnitario,
        unidades,
        subtotalBruto: redondear2(subtotalBruto),
        descuentoPorcentaje: pctDesc,
        descuentoMonto: redondear2(descuentoMonto),
        subtotalNeto: redondear2(subtotalNeto),
        porcentajeIva: pctIva,
        impuestoMonto: redondear2(impuestoMonto),
        totalLinea: redondear2(totalLinea),
    }
}

/**
 * Calcula el resumen completo de una orden/carrito
 * @param {Array<Object>} items
 * @param {number} [descuentoGlobalPorcentaje=0]
 * @param {number} [descuentoGlobalMonto=0]
 */
export function calcularTotalesOrden(items = [], descuentoGlobalPorcentaje = 0, descuentoGlobalMonto = 0) {
    let subtotalBrutoAcum = 0
    let descuentoItemsAcum = 0
    let desglosesIva = {} // ej: { "19": { base: 100, impuesto: 19 }, "0": { ... } }

    const itemsCalculados = items.map((item) => {
        const calc = calcularLineaProducto(item)
        subtotalBrutoAcum += calc.subtotalBruto
        descuentoItemsAcum += calc.descuentoMonto

        const tasaKey = calc.porcentajeIva.toString()
        if (!desglosesIva[tasaKey]) {
            desglosesIva[tasaKey] = {
                tasa: calc.porcentajeIva,
                base: 0,
                impuesto: 0,
            }
        }
        desglosesIva[tasaKey].base += calc.subtotalNeto
        desglosesIva[tasaKey].impuesto += calc.impuestoMonto

        return {
            ...item,
            ...calc,
        }
    })

    const baseNetaPreDescuentoGlobal = Math.max(0, subtotalBrutoAcum - descuentoItemsAcum)

    let descuentoGlobalEfectivo = 0
    const pctGlobal = Number(descuentoGlobalPorcentaje) || 0
    const valGlobal = Number(descuentoGlobalMonto) || 0

    if (pctGlobal > 0) {
        descuentoGlobalEfectivo = Math.min(baseNetaPreDescuentoGlobal, (baseNetaPreDescuentoGlobal * pctGlobal) / 100)
    } else if (valGlobal > 0) {
        descuentoGlobalEfectivo = Math.min(baseNetaPreDescuentoGlobal, valGlobal)
    }

    const descuentoTotal = redondear2(descuentoItemsAcum + descuentoGlobalEfectivo)

    // Ajustar impuestos si hubo descuento global proporcional
    let impuestoTotal = 0
    const factorAjusteImpuesto = baseNetaPreDescuentoGlobal > 0
        ? Math.max(0, (baseNetaPreDescuentoGlobal - descuentoGlobalEfectivo) / baseNetaPreDescuentoGlobal)
        : 1

    const desgloseImpuestosFinal = Object.values(desglosesIva).map((grp) => {
        const baseAjustada = redondear2(grp.base * factorAjusteImpuesto)
        const impuestoAjustado = redondear2((baseAjustada * grp.tasa) / 100)
        impuestoTotal += impuestoAjustado
        return {
            tasa: grp.tasa,
            base: baseAjustada,
            impuesto: impuestoAjustado,
        }
    })

    const totalPagar = redondear2(Math.max(0, subtotalBrutoAcum - descuentoTotal + impuestoTotal))

    return {
        items: itemsCalculados,
        subtotalBruto: redondear2(subtotalBrutoAcum),
        descuentoItems: redondear2(descuentoItemsAcum),
        descuentoGlobal: redondear2(descuentoGlobalEfectivo),
        descuentoGlobalPorcentaje: pctGlobal,
        descuentoTotal,
        subtotalNeto: redondear2(subtotalBrutoAcum - descuentoTotal),
        impuestoTotal: redondear2(impuestoTotal),
        desgloseImpuestos: desgloseImpuestosFinal,
        total: totalPagar,
        totalArticulos: items.reduce((acc, it) => acc + (Number(it.unidades) || 1), 0),
    }
}

/**
 * Calcula el vuelto / cambio para un pago en efectivo
 * @param {number} totalAPagar
 * @param {number} montoRecibido
 * @returns {{ cambio: number, esSuficiente: boolean, faltante: number }}
 */
export function calcularCambio(totalAPagar, montoRecibido) {
    const total = Number(totalAPagar) || 0
    const recibido = Number(montoRecibido) || 0
    const cambio = Math.max(0, recibido - total)
    const faltante = Math.max(0, total - recibido)

    return {
        cambio: redondear2(cambio),
        faltante: redondear2(faltante),
        esSuficiente: recibido >= total,
    }
}

function redondear2(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100
}
