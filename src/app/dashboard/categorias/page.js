import { prisma } from '@/lib/prisma'
import CategoriasClient from './CategoriasClient'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
    const categorias = await prisma.categoria.findMany({
        include: {
            _count: {
                select: { productos: true },
            },
        },
        orderBy: { nombre: 'asc' },
    })

    return <CategoriasClient initialCategorias={categorias} />
}
