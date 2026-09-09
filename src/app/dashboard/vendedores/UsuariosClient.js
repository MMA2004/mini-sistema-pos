'use client'

import { useState, useTransition } from 'react'
import { createUser, updateUser, toggleUserStatus, resetUserPassword } from './actions'

export default function UsuariosClient({ initialUsuarios, currentUserId }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL') // 'ALL', 'SUPERVISOR', 'CAJERO'
    const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL', 'ACTIVO', 'INACTIVO'

    const [isPending, startTransition] = useTransition()
    const [statusMessage, setStatusMessage] = useState(null)

    // Modales
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [togglingUser, setTogglingUser] = useState(null)
    const [resettingPasswordUser, setResettingPasswordUser] = useState(null)
    const [newPasswordValue, setNewPasswordValue] = useState('')
    const [confirmPasswordValue, setConfirmPasswordValue] = useState('')

    const pendingCount = initialUsuarios.filter((u) => u.estado === 'INACTIVO').length

    // Filtrado de usuarios
    const filteredUsuarios = initialUsuarios.filter((u) => {
        const query = searchTerm.toLowerCase().trim()
        const fullName = `${u.nombre} ${u.apellido}`.toLowerCase()
        const matchesSearch =
            !query ||
            fullName.includes(query) ||
            u.correo.toLowerCase().includes(query) ||
            (u.cedula && u.cedula.toLowerCase().includes(query))

        const matchesRole = roleFilter === 'ALL' || u.rol === roleFilter
        const matchesStatus = statusFilter === 'ALL' || u.estado === statusFilter

        return matchesSearch && matchesRole && matchesStatus
    })

    const handleCreate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const res = await createUser(formData)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setIsCreateOpen(false)
            }
        })
    }

    const handleUpdate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const res = await updateUser(formData)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setEditingUser(null)
            }
        })
    }

    const handleToggleStatus = () => {
        if (!togglingUser) return
        const nextStatus = togglingUser.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'

        startTransition(async () => {
            const res = await toggleUserStatus(togglingUser.id, nextStatus)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setTogglingUser(null)
            }
        })
    }

    const handleResetPassword = (e) => {
        e.preventDefault()
        if (!resettingPasswordUser) return

        if (newPasswordValue.length < 6) {
            setStatusMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' })
            return
        }

        if (newPasswordValue !== confirmPasswordValue) {
            setStatusMessage({ type: 'error', text: 'Las contraseñas no coinciden.' })
            return
        }

        startTransition(async () => {
            const res = await resetUserPassword(resettingPasswordUser.id, newPasswordValue)
            if (res.error) {
                setStatusMessage({ type: 'error', text: res.error })
            } else {
                setStatusMessage({ type: 'success', text: res.success })
                setResettingPasswordUser(null)
                setNewPasswordValue('')
                setConfirmPasswordValue('')
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Cabecera del módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Vendedores y Usuarios</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Crea cuentas de cajeros, asigna roles, modifica datos y gestiona el acceso al sistema.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStatusMessage(null)
                        setIsCreateOpen(true)
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Nuevo Usuario
                </button>
            </div>

            {/* Mensajes de feedback */}
            {statusMessage && (
                <div
                    className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
                        statusMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                >
                    <span>{statusMessage.text}</span>
                    <button
                        onClick={() => setStatusMessage(null)}
                        className="text-xs font-bold uppercase tracking-wider hover:opacity-75 cursor-pointer ml-4"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {/* Alerta de usuarios pendientes de aprobación */}
            {pendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </span>
                        <div>
                            <p className="text-sm font-bold text-amber-950">
                                {pendingCount === 1
                                    ? 'Hay 1 usuario pendiente de aprobación'
                                    : `Hay ${pendingCount} usuarios pendientes de aprobación`}
                            </p>
                            <p className="text-xs text-amber-800 mt-0.5">
                                Revisa las cuentas de cajeros recién registrados y autoriza su acceso al terminal de venta.
                            </p>
                        </div>
                    </div>
                    {statusFilter !== 'INACTIVO' ? (
                        <button
                            onClick={() => setStatusFilter('INACTIVO')}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs whitespace-nowrap cursor-pointer"
                        >
                            Filtrar pendientes ({pendingCount})
                        </button>
                    ) : (
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition shadow-xs whitespace-nowrap cursor-pointer"
                        >
                            Ver todos
                        </button>
                    )}
                </div>
            )}

            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o cédula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filtro por Rol */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                        <option value="ALL">Todos los Roles</option>
                        <option value="SUPERVISOR">Supervisores</option>
                        <option value="CAJERO">Cajeros</option>
                    </select>

                    {/* Filtro por Estado */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">
                            Pendientes / Inactivos {pendingCount > 0 ? `(${pendingCount})` : ''}
                        </option>
                    </select>
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5">Usuario / Nombre</th>
                                <th className="px-5 py-3.5">Cédula / ID</th>
                                <th className="px-5 py-3.5">Correo</th>
                                <th className="px-5 py-3.5 text-center">Rol</th>
                                <th className="px-5 py-3.5 text-center">Estado</th>
                                <th className="px-5 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredUsuarios.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        No se encontraron usuarios registrados con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsuarios.map((u) => {
                                    const isSelf = u.id === currentUserId
                                    const isSupervisor = u.rol === 'SUPERVISOR'
                                    const isActive = u.estado === 'ACTIVO'

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                                                            isSupervisor
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}
                                                    >
                                                        {u.nombre.charAt(0)}
                                                        {u.apellido.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 leading-tight">
                                                            {u.nombre} {u.apellido}
                                                            {isSelf && (
                                                                <span className="ml-2 text-3xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                                    Tú
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                                            {u.ventas?.length ?? 0} ventas registradas
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs text-slate-600">
                                                {u.cedula || <span className="text-slate-300 italic">No registrada</span>}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 font-mono text-xs">
                                                {u.correo}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        isSupervisor
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}
                                                >
                                                    {u.rol}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        isActive
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            isActive ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                                        }`}
                                                    />
                                                    {isActive ? 'Activo' : 'Pendiente / Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                                                {/* Editar datos */}
                                                <button
                                                    onClick={() => {
                                                        setStatusMessage(null)
                                                        setEditingUser(u)
                                                    }}
                                                    title="Editar datos"
                                                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                                >
                                                    Editar
                                                </button>

                                                {/* Restablecer Contraseña */}
                                                <button
                                                    onClick={() => {
                                                        setStatusMessage(null)
                                                        setResettingPasswordUser(u)
                                                        setNewPasswordValue('')
                                                        setConfirmPasswordValue('')
                                                    }}
                                                    title="Restablecer contraseña"
                                                    className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition cursor-pointer"
                                                >
                                                    Clave
                                                </button>

                                                {/* Desactivar / Aprobar o Activar */}
                                                {!isSelf && (
                                                    <button
                                                        onClick={() => {
                                                            setStatusMessage(null)
                                                            setTogglingUser(u)
                                                        }}
                                                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer inline-flex items-center gap-1 ${
                                                            isActive
                                                                ? 'text-red-700 hover:bg-red-50 border border-red-200'
                                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                                        }`}
                                                        title={isActive ? 'Desactivar acceso' : 'Aprobar y activar acceso'}
                                                    >
                                                        {!isActive && (
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        {isActive ? 'Desactivar' : 'Aprobar / Activar'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR USUARIO */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Usuario / Vendedor</h3>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        required
                                        placeholder="Ej: Carlos"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Apellido *
                                    </label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        required
                                        placeholder="Ej: Gómez"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Cédula / Documento ID
                                    </label>
                                    <input
                                        type="text"
                                        name="cedula"
                                        placeholder="Ej: 1020304050"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Rol de Acceso *
                                    </label>
                                    <select
                                        name="rol"
                                        defaultValue="CAJERO"
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                                    >
                                        <option value="CAJERO">CAJERO (Acceso al Punto de Venta)</option>
                                        <option value="SUPERVISOR">SUPERVISOR (Acceso Administrativo Completo)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Correo Electrónico (Username) *
                                </label>
                                <input
                                    type="email"
                                    name="correo"
                                    required
                                    placeholder="cajero@mitienda.com"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Contraseña Inicial *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    El usuario podrá iniciar sesión de inmediato con esta contraseña.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR DATOS DE USUARIO */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Editar Usuario</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{editingUser.correo}</p>
                            </div>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                            <input type="hidden" name="id" value={editingUser.id} />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        required
                                        defaultValue={editingUser.nombre}
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        Apellido *
                                    </label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        required
                                        defaultValue={editingUser.apellido}
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Cédula / Documento ID
                                </label>
                                <input
                                    type="text"
                                    name="cedula"
                                    defaultValue={editingUser.cedula || ''}
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Rol de Acceso *
                                </label>
                                <select
                                    name="rol"
                                    defaultValue={editingUser.rol}
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                                >
                                    <option value="CAJERO">CAJERO</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL RESTABLECER CONTRASEÑA */}
            {resettingPasswordUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Restablecer Contraseña</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Para {resettingPasswordUser.nombre} {resettingPasswordUser.apellido} ({resettingPasswordUser.correo})
                                </p>
                            </div>
                            <button
                                onClick={() => setResettingPasswordUser(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Nueva Contraseña *
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPasswordValue}
                                    onChange={(e) => setNewPasswordValue(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Confirmar Nueva Contraseña *
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={confirmPasswordValue}
                                    onChange={(e) => setConfirmPasswordValue(e.target.value)}
                                    placeholder="Repite la nueva contraseña"
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setResettingPasswordUser(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || !newPasswordValue || newPasswordValue !== confirmPasswordValue}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? 'Actualizando...' : 'Restablecer Clave'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR DESACTIVACIÓN / ACTIVACIÓN LÓGICA */}
            {togglingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    togglingUser.estado === 'ACTIVO'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}
                            >
                                {togglingUser.estado === 'ACTIVO' ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {togglingUser.estado === 'ACTIVO'
                                        ? `Desactivar usuario "${togglingUser.nombre} ${togglingUser.apellido}"`
                                        : `Aprobar y activar acceso a "${togglingUser.nombre} ${togglingUser.apellido}"`}
                                </h3>
                                <p className="text-sm text-slate-600 mt-2">
                                    {togglingUser.estado === 'ACTIVO'
                                        ? 'La cuenta quedará deshabilitada y el usuario no podrá iniciar sesión en el POS. Todo su historial de ventas pasadas y movimientos de inventario se preservará intacto.'
                                        : 'Al autorizar esta cuenta, el usuario pasará a estado ACTIVO y podrá iniciar sesión de inmediato con sus credenciales para operar el terminal de ventas (POS).'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setTogglingUser(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleToggleStatus}
                                disabled={isPending}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer ${
                                    togglingUser.estado === 'ACTIVO'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {isPending
                                    ? 'Procesando...'
                                    : togglingUser.estado === 'ACTIVO'
                                    ? 'Sí, desactivar acceso'
                                    : 'Sí, aprobar y autorizar acceso'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
