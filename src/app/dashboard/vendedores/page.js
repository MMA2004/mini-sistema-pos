import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/auth/actions'
import UsuariosClient from './UsuariosClient'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
    const currentUser = await getCurrentUser()

    const usuarios = await prisma.usuario.findMany({
        include: {
            ventas: {
                select: { id_venta: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return <UsuariosClient initialUsuarios={usuarios} currentUserId={currentUser?.id} />
}
