'use client'
import React, { useState } from 'react'
import { Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
export default function ChangePasswordSection() {
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmarNueva, setConfirmarNueva] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (passwordNueva !== confirmarNueva) {
      setError('Las nuevas contraseñas no coinciden')
      return
    }
    if (passwordNueva.length < 4) {
        setError('La nueva contraseña debe tener al menos 4 caracteres')
        return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios/cambiar-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordActual, passwordNueva })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña')
      }
      setSuccess('Tu contraseña ha sido actualizada correctamente.')
      setPasswordActual('')
      setPasswordNueva('')
      setConfirmarNueva('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {error && (
        <div className="p-3 text-xs rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> {success}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Contraseña Actual</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="password"
            required
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Nueva Contraseña</label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Confirmar Nueva</label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all"
            value={confirmarNueva}
            onChange={(e) => setConfirmarNueva(e.target.value)}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full md:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar Contraseña'}
      </button>
    </form>
  )
}