import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import MetodosPagoClient from './MetodosPagoClient'

export default async function MetodosPagoPage() {
    const user = await getCurrentUser()

    if (!user || user.rol !== 'SUPERVISOR') {
        redirect('/dashboard')
    }

    const metodos = await prisma.metodoPagoConfig.findMany({
        orderBy: { orden: 'asc' },
    })

    return <MetodosPagoClient initialMetodos={metodos} />
}
