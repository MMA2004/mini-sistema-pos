import Header from '@/components/Header'
import DashboardNav from './DashboardNav'
import { getCurrentUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const isSupervisor = user.rol === 'SUPERVISOR'

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Header user={user} />
            
            {/* Si es Supervisor, mostramos la barra de navegación de módulos */}
            {isSupervisor && <DashboardNav />}

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {/* Banner de restricción si el usuario no es Supervisor */}
                {!isSupervisor && (
                    <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Tu rol actual es <strong>CAJERO</strong>. El panel de administración está reservado para supervisores.</span>
                        </div>
                        <Link href="/pos" className="text-xs font-bold text-amber-900 underline">
                            Ir a Caja
                        </Link>
                    </div>
                )}

                {children}
            </main>
        </div>
    )
}
