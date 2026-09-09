import { prisma } from '@/lib/prisma'
import StockClient from './StockClient'

export const dynamic = 'force-dynamic'

export default async function StockPage() {
    const [productos, movimientos] = await Promise.all([
        prisma.producto.findMany({
            where: { activo: true },
            include: { categoria: true },
            orderBy: { nombre: 'asc' },
        }),
        prisma.historicoCambiosStock.findMany({
            take: 100,
            orderBy: { fecha: 'desc' },
            include: {
                producto: {
                    select: { nombre: true },
                },
                usuario: {
                    select: { nombre: true, apellido: true, correo: true },
                },
            },
        }),
    ])

    const serializedProductos = productos.map((p) => ({
        ...p,
        precio_unitario: Number(p.precio_unitario),
    }))

    return <StockClient initialProductos={serializedProductos} initialMovimientos={movimientos} />
}
