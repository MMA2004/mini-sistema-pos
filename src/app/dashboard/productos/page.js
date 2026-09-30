import { prisma } from '@/lib/prisma'
import ProductosClient from './ProductosClient'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
    const [productos, categorias] = await Promise.all([
        prisma.producto.findMany({
            include: { categoria: true },
            orderBy: { nombre: 'asc' },
        }),
        prisma.categoria.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        }),
    ])

    // Convertimos Decimals a tipo Number serializable para componentes cliente de React
    const serializedProductos = productos.map((p) => ({
        ...p,
        precio_unitario: Number(p.precio_unitario),
        porcentaje_iva: Number(p.porcentaje_iva ?? 19),
    }))

    return <ProductosClient initialProductos={serializedProductos} categorias={categorias} />
}
