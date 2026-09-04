import { getCurrentUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'

export default async function HomePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    if (user.rol === 'SUPERVISOR') {
        redirect('/dashboard')
    }

    redirect('/pos')
}
