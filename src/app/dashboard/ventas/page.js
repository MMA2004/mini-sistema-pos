import { getCurrentUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { obtenerReporteVentas } from './actions'
import VentasReporteClient from './VentasReporteClient'

export default async function VentasReportePage() {
    const user = await getCurrentUser()

    if (!user || user.rol !== 'SUPERVISOR') {
        redirect('/dashboard')
    }

    const reporteRes = await obtenerReporteVentas({ periodo: 'hoy' })

    return <VentasReporteClient initialData={reporteRes} />
}
