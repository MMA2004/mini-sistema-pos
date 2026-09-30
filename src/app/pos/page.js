import { getCurrentUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { obtenerTurnoActivo, obtenerDatosInicialesPOS } from './actions'
import PosClient from './PosClient'

export default async function PosPage() {
    const user = await getCurrentUser()

    if (!user || user.estado !== 'ACTIVO') {
        redirect('/login')
    }

    const [turnoRes, datosPOS] = await Promise.all([
        obtenerTurnoActivo(),
        obtenerDatosInicialesPOS(),
    ])

    return (
        <PosClient
            user={user}
            initialTurno={turnoRes.ok ? turnoRes.turno : null}
            initialProductos={datosPOS.productos || []}
            initialCategorias={datosPOS.categorias || []}
            initialMetodosPago={datosPOS.metodosPago || []}
        />
    )
}
