'use client'

import { useState, useMemo, useEffect } from 'react'
import Header from '@/components/Header'
import BarraTurno from './components/BarraTurno'
import BuscadorProductos from './components/BuscadorProductos'
import CarritoVenta from './components/CarritoVenta'
import ModalAperturaTurno from './components/ModalAperturaTurno'
import ModalArqueoTurno from './components/ModalArqueoTurno'
import ModalCobro from './components/ModalCobro'
import ModalTicketVenta from './components/ModalTicketVenta'
import ModalHistorialVentas from './components/ModalHistorialVentas'
import { calcularTotalesOrden } from '@/utils/posCalculations'
import { procesarVenta, obtenerTurnoActivo, obtenerDatosInicialesPOS } from './actions'

export default function PosClient({
    user,
    initialTurno,
    initialProductos = [],
    initialCategorias = [],
    initialMetodosPago = [],
}) {
    // Estado del Turno
    const [turno, setTurno] = useState(initialTurno)
    const [mostrarModalApertura, setMostrarModalApertura] = useState(!initialTurno)
    const [mostrarModalArqueo, setMostrarModalArqueo] = useState(false)

    // Catálogo y Datos del POS
    const [productos, setProductos] = useState(initialProductos)
    const [categorias, setCategorias] = useState(initialCategorias)
    const [metodosPago, setMetodosPago] = useState(initialMetodosPago)

    // Estado del Carrito y Descuentos
    const [carrito, setCarrito] = useState([])
    const [descuentoGlobal, setDescuentoGlobal] = useState({ porcentaje: 0, monto: 0 })

    // Modales de Operación
    const [mostrarModalCobro, setMostrarModalCobro] = useState(false)
    const [mostrarModalTicket, setMostrarModalTicket] = useState(false)
    const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false)
    const [ventaEmitida, setVentaEmitida] = useState(null)
    const [notificacion, setNotificacion] = useState(null)

    // Calcular Totales Financieros en Tiempo Real
    const totales = useMemo(() => {
        return calcularTotalesOrden(
            carrito,
            descuentoGlobal.porcentaje,
            descuentoGlobal.monto
        )
    }, [carrito, descuentoGlobal])

    // Atajos de Teclado del POS (F4 para cobrar)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F4') {
                e.preventDefault()
                if (carrito.length > 0 && turno) {
                    setMostrarModalCobro(true)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [carrito.length, turno])

    const notificar = (tipo, texto) => {
        setNotificacion({ tipo, texto })
        setTimeout(() => setNotificacion(null), 3000)
    }

    // Recargar datos frescos del turno
    const refrescarTurno = async () => {
        const res = await obtenerTurnoActivo()
        if (res.ok && res.turno) {
            setTurno(res.turno)
        }
    }

    // Acciones del Carrito
    const handleAgregarAlCarrito = (prod) => {
        if (!turno) {
            setMostrarModalApertura(true)
            return
        }

        setCarrito((prev) => {
            const index = prev.findIndex((item) => item.codigo === prod.codigo)
            if (index >= 0) {
                const itemExistente = prev[index]
                if (itemExistente.unidades >= prod.unidades_totales) {
                    notificar('error', `Stock máximo disponible alcanzado (${prod.unidades_totales} uds)`)
                    return prev
                }
                const copia = [...prev]
                copia[index] = {
                    ...itemExistente,
                    unidades: itemExistente.unidades + 1,
                }
                return copia
            } else {
                return [
                    ...prev,
                    {
                        codigo: prod.codigo,
                        nombre: prod.nombre,
                        precio_unitario: Number(prod.precio_unitario),
                        porcentaje_iva: Number(prod.porcentaje_iva ?? 19),
                        unidades: 1,
                        unidades_totales: prod.unidades_totales,
                        descuento_porcentaje: 0,
                        descuento_monto: 0,
                    },
                ]
            }
        })
    }

    const handleActualizarCantidad = (codigo, nuevaCant) => {
        const cantValida = Math.max(1, Number(nuevaCant) || 1)
        setCarrito((prev) =>
            prev.map((item) => {
                if (item.codigo === codigo) {
                    const cantFinal = Math.min(cantValida, item.unidades_totales)
                    if (cantValida > item.unidades_totales) {
                        notificar('error', `Stock máximo: ${item.unidades_totales} uds`)
                    }
                    return { ...item, unidades: cantFinal }
                }
                return item
            })
        )
    }

    const handleEliminarItem = (codigo) => {
        setCarrito((prev) => prev.filter((it) => it.codigo !== codigo))
    }

    const handleLimpiarCarrito = () => {
        if (confirm('¿Deseas vaciar el carrito actual?')) {
            setCarrito([])
            setDescuentoGlobal({ porcentaje: 0, monto: 0 })
        }
    }

    const handleAplicarDescuentoItem = (codigo, { descuento_porcentaje, descuento_monto }) => {
        setCarrito((prev) =>
            prev.map((it) => {
                if (it.codigo === codigo) {
                    return {
                        ...it,
                        descuento_porcentaje,
                        descuento_monto,
                    }
                }
                return it
            })
        )
    }

    // Confirmación y Procesamiento de la Venta (Transacción Atómica)
    const handleConfirmarVenta = async ({ cedCliente, nombreCliente, pagos }) => {
        const res = await procesarVenta({
            idTurno: turno.id_turno,
            cedCliente,
            nombreCliente,
            items: totales.items,
            descuentoGlobalPorcentaje: descuentoGlobal.porcentaje,
            descuentoGlobalMonto: descuentoGlobal.monto,
            pagos,
        })

        if (res.ok) {
            // Actualizar stock local de los productos vendidos
            setProductos((prev) =>
                prev.map((p) => {
                    const itemVendido = totales.items.find((it) => it.codigo === p.codigo)
                    if (itemVendido) {
                        return {
                            ...p,
                            unidades_totales: p.unidades_totales - itemVendido.unidades,
                        }
                    }
                    return p
                })
            )

            // Preparar datos para emitir el comprobante
            setVentaEmitida({
                ...res.venta,
                totales,
                productos: totales.items,
            })

            // Limpiar orden y abrir modal del ticket
            setCarrito([])
            setDescuentoGlobal({ porcentaje: 0, monto: 0 })
            setMostrarModalCobro(false)
            setMostrarModalTicket(true)

            // Refrescar balance del turno
            refrescarTurno()
            return { ok: true }
        }

        return res
    }

    // Manejo de Turnos
    const handleTurnoIniciado = (nuevoTurno) => {
        setTurno(nuevoTurno)
        setMostrarModalApertura(false)
        notificar('exito', `Turno #${nuevoTurno.id_turno} abierto exitosamente`)
    }

    const handleTurnoCerrado = (turnoFinalizado) => {
        setMostrarModalArqueo(false)
        setTurno(null)
        setCarrito([])
        setMostrarModalApertura(true)
        notificar('exito', `Turno #${turnoFinalizado.id_turno} cerrado exitosamente`)
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header del Sistema */}
            <Header user={user} />

            {/* Barra de Estado del Turno de Caja */}
            <BarraTurno
                turno={turno}
                cajeroNombre={user.nombre}
                onCerrarTurnoClick={() => setMostrarModalArqueo(true)}
                onConsultarVentasClick={() => setMostrarModalHistorial(true)}
            />

            {/* Notificaciones flotantes */}
            {notificacion && (
                <div
                    className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
                        notificacion.tipo === 'error'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                >
                    {notificacion.texto}
                </div>
            )}

            {/* Terminal de Ventas POS (Layout de Dos Columnas) */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-125px)] min-h-[600px]">
                {/* Columna Izquierda (7 cols): Catálogo y Búsqueda */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden">
                    <BuscadorProductos
                        productos={productos}
                        categorias={categorias}
                        onAgregarAlCarrito={handleAgregarAlCarrito}
                    />
                </div>

                {/* Columna Derecha (5 cols): Carrito y Totales */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden">
                    <CarritoVenta
                        totales={totales}
                        items={totales.items}
                        onActualizarCantidad={handleActualizarCantidad}
                        onEliminarItem={handleEliminarItem}
                        onLimpiarCarrito={handleLimpiarCarrito}
                        onAplicarDescuentoItem={handleAplicarDescuentoItem}
                        descuentoGlobalPorcentaje={descuentoGlobal.porcentaje}
                        descuentoGlobalMonto={descuentoGlobal.monto}
                        onCambiarDescuentoGlobal={setDescuentoGlobal}
                        onIniciarCobro={() => setMostrarModalCobro(true)}
                    />
                </div>
            </main>

            {/* Modal Apertura de Turno (Obligatorio si no hay turno activo) */}
            <ModalAperturaTurno
                isOpen={mostrarModalApertura}
                cajeroNombre={user.nombre}
                esSupervisor={user.rol === 'SUPERVISOR'}
                onTurnoIniciado={handleTurnoIniciado}
            />

            {/* Modal de Arqueo y Cierre de Caja */}
            <ModalArqueoTurno
                isOpen={mostrarModalArqueo}
                idTurno={turno?.id_turno}
                onClose={() => setMostrarModalArqueo(false)}
                onTurnoCerradoExitoso={handleTurnoCerrado}
            />

            {/* Modal de Cobro y Pagos Mixtos */}
            {mostrarModalCobro && (
                <ModalCobro
                    isOpen={true}
                    totales={totales}
                    metodosPago={metodosPago}
                    onClose={() => setMostrarModalCobro(false)}
                    onConfirmarVenta={handleConfirmarVenta}
                />
            )}

            {/* Modal de Comprobante / Ticket Térmico POS */}
            <ModalTicketVenta
                isOpen={mostrarModalTicket}
                venta={ventaEmitida}
                onNuevaVenta={() => {
                    setMostrarModalTicket(false)
                    setVentaEmitida(null)
                }}
            />

            {/* Modal de Historial y Consulta de Ventas */}
            <ModalHistorialVentas
                isOpen={mostrarModalHistorial}
                idTurnoActual={turno?.id_turno}
                onClose={() => setMostrarModalHistorial(false)}
                onReimprimirTicket={(venta) => {
                    setVentaEmitida(venta)
                    setMostrarModalTicket(true)
                }}
                onVentaAnulada={() => {
                    refrescarTurno()
                    // Refrescar inventario
                    obtenerDatosInicialesPOS().then((res) => {
                        if (res.ok) setProductos(res.productos)
                    })
                }}
            />
        </div>
    )
}
