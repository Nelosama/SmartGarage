'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Receipt,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Hash,
  CreditCard
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface FacturaResumen {
  id_factura: number
  id_orden: number
  numero_factura: string
  cliente: string
  placa: string
  marca: string
  modelo: string
  fecha_emision: string
  subtotal_servicios: number
  subtotal_repuestos: number
  impuesto: number
  descuento: number
  total: number
  estado_pago: string
  metodo_pago: string
}

interface OrdenResumen {
  id_orden: number
  vehiculo?: {
    placa: string
    cliente?: {
      usuario?: {
        nombre: string
      }
    }
  }
}

export default function FacturasPage() {
  const { data: session } = useSession()
  const user = session?.user as { id_rol: number; id_usuario: string; nombre: string }
  const id_rol = user ? Number(user.id_rol) : 0
  const canEdit = id_rol === 1 || id_rol === 2
  const isAdmin = id_rol === 1

  const [facturas, setFacturas] = useState<FacturaResumen[]>([])
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState<FacturaResumen | null>(null)

  const [formData, setFormData] = useState({
    id_orden: '',
    numero_factura: '',
    subtotal_servicios: 0,
    subtotal_repuestos: 0,
    impuesto: 0,
    descuento: 0,
    total: 0,
    estado_pago: 'Pendiente',
    metodo_pago: 'Efectivo'
  })

  const [error, setError] = useState('')

  const fetchFacturas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/facturas')
      const data = await res.json()
      setFacturas(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching facturas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrdenes = useCallback(async () => {
    try {
      const res = await fetch('/api/ordenes')
      const data = await res.json()
      setOrdenes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching ordenes:', err)
    }
  }, [])

  useEffect(() => {
    (async () => {
      await fetchFacturas()
      if (canEdit) {
        await fetchOrdenes()
      }
    })()
  }, [fetchFacturas, fetchOrdenes, canEdit])

  // Recalcular total automáticamente
  useEffect(() => {
    const total = Number(formData.subtotal_servicios) +
                  Number(formData.subtotal_repuestos) +
                  Number(formData.impuesto) -
                  Number(formData.descuento)
    setFormData(prev => ({ ...prev, total: total > 0 ? total : 0 }))
  }, [formData.subtotal_servicios, formData.subtotal_repuestos, formData.impuesto, formData.descuento])

  const filteredFacturas = useMemo(() => {
    return facturas.filter(f =>
      f.numero_factura?.toLowerCase().includes(search.toLowerCase()) ||
      f.cliente?.toLowerCase().includes(search.toLowerCase()) ||
      f.placa?.toLowerCase().includes(search.toLowerCase())
    )
  }, [facturas, search])

  const handleOpenModal = (factura: FacturaResumen | null = null) => {
    if (factura) {
      setIsEditing(true)
      setSelectedFactura(factura)
      setFormData({
        id_orden: factura.id_orden.toString(),
        numero_factura: factura.numero_factura || '',
        subtotal_servicios: Number(factura.subtotal_servicios),
        subtotal_repuestos: Number(factura.subtotal_repuestos),
        impuesto: Number(factura.impuesto),
        descuento: Number(factura.descuento),
        total: Number(factura.total),
        estado_pago: factura.estado_pago || 'Pendiente',
        metodo_pago: factura.metodo_pago || 'Efectivo'
      })
    } else {
      setIsEditing(false)
      setSelectedFactura(null)
      setFormData({
        id_orden: '',
        numero_factura: '',
        subtotal_servicios: 0,
        subtotal_repuestos: 0,
        impuesto: 0,
        descuento: 0,
        total: 0,
        estado_pago: 'Pendiente',
        metodo_pago: 'Efectivo'
      })
    }
    setError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const url = isEditing && selectedFactura ? `/api/facturas/${selectedFactura.id_factura}` : '/api/facturas'
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la factura')
      }

      setIsModalOpen(false)
      fetchFacturas()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
    }
  }

  const handleDelete = async (id: number, estado: string) => {
    if (estado === 'Pagado') {
      alert('No se puede eliminar una factura ya pagada.')
      return
    }

    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return

    try {
      const res = await fetch(`/api/facturas/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar la factura')
      }

      fetchFacturas()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      alert(msg)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Receipt className="h-8 w-8 text-orange-600" />
            Gestión de Facturas
          </h1>
          <p className="text-slate-500 text-sm">Registro de cobros y estados de pago.</p>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Nueva Factura
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por factura, cliente o placa..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Factura</th>
                <th className="px-6 py-4">Cliente / Vehículo</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4">Método</th>
                {canEdit && <th className="px-6 py-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-10 w-10 text-slate-200" />
                      <p className="text-slate-500 font-medium">No se encontraron facturas.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredFacturas.map(f => (
                <tr key={f.id_factura} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-slate-400" />
                      <span className="font-bold text-slate-800">{f.numero_factura}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Orden #{f.id_orden}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{f.cliente}</span>
                      <span className="text-xs text-slate-500">{f.marca} {f.modelo} ({f.placa})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(f.fecha_emision)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-orange-600">{formatCurrency(f.total)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      f.estado_pago === 'Pagado' ? 'bg-emerald-50 text-emerald-700' :
                      f.estado_pago === 'Pendiente' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {f.estado_pago}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span className="font-medium text-xs">{f.metodo_pago}</span>
                    </div>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(f)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(f.id_factura, f.estado_pago)}
                            className={`p-2 rounded-lg transition-colors ${f.estado_pago === 'Pagado' ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                            title="Eliminar"
                            disabled={f.estado_pago === 'Pagado'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva/Editar Factura */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                {isEditing ? <Edit2 className="h-6 w-6 text-orange-600" /> : <Plus className="h-6 w-6 text-orange-600" />}
                {isEditing ? 'Editar Factura' : 'Nueva Factura'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Orden de Trabajo</label>
                  <select
                    required
                    disabled={isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white disabled:bg-slate-50"
                    value={formData.id_orden}
                    onChange={(e) => setFormData({...formData, id_orden: e.target.value})}
                  >
                    <option value="">Seleccionar Orden</option>
                    {ordenes.map(o => (
                      <option key={o.id_orden} value={o.id_orden}>
                        #{o.id_orden} - {o.vehiculo?.placa} ({o.vehiculo?.cliente?.usuario?.nombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Número de Factura</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: FAC-001"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={formData.numero_factura}
                    onChange={(e) => setFormData({...formData, numero_factura: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subtotal Servicios (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={formData.subtotal_servicios}
                    onChange={(e) => setFormData({...formData, subtotal_servicios: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subtotal Repuestos (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={formData.subtotal_repuestos}
                    onChange={(e) => setFormData({...formData, subtotal_repuestos: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Impuesto (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={formData.impuesto}
                    onChange={(e) => setFormData({...formData, impuesto: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descuento (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={formData.descuento}
                    onChange={(e) => setFormData({...formData, descuento: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-orange-600">Total Calculado</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 font-black">
                    {formatCurrency(formData.total)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Método de Pago</label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Estado de Pago</label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={formData.estado_pago}
                    onChange={(e) => setFormData({...formData, estado_pago: e.target.value})}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 text-sm font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                  {isEditing ? 'Actualizar Factura' : 'Crear Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
