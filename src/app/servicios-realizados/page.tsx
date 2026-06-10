'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  ClipboardList,
  Wrench,
  DollarSign,
  Package,
  X,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface Vehiculo {
  placa: string
  marca: string
  modelo: string
  cliente: {
    usuario: {
      nombre: string
    }
  }
}

interface Orden {
  id_orden: number
  motivo_ingreso: string
  estado_actual: {
    nombre_estado: string
  }
  vehiculo: Vehiculo
}

interface ServicioRealizado {
  id_orden_servicio: number
  id_orden: number
  id_servicio: number
  servicio: {
    nombre_servicio: string
    descripcion?: string
  }
  cantidad: number
  precio_unitario: number
  subtotal: number
  observaciones?: string
  orden: Orden
}

function ServiciosRealizadosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const filterOrdenId = searchParams.get('ordenId')

  const [servicios, setServicios] = useState<ServicioRealizado[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [catalogoServicios, setCatalogoServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] = useState<ServicioRealizado | null>(null)

  // Form states
  const [idServicio, setIdServicio] = useState<string>('')
  const [ordenId, setOrdenId] = useState<string>('')
  const [cantidad, setCantidad] = useState<number>(1)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [observaciones, setObservaciones] = useState('')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch performed services, orders and service catalog
  const fetchData = async (query = '') => {
    try {
      setLoading(true)
      const servURL = `/api/servicios-realizados${filterOrdenId ? `?ordenId=${filterOrdenId}` : ''}${query ? `${filterOrdenId ? '&' : '?'}q=${encodeURIComponent(query)}` : ''}`
      
      const [servRes, ordRes, catRes] = await Promise.all([
        fetch(servURL),
        fetch('/api/ordenes'),
        fetch('/api/servicios')
      ])

      if (!servRes.ok) throw new Error('Error al conectar con el servidor')

      setServicios(await servRes.json())
      setOrdenes(await ordRes.json())
      setCatalogoServicios(await catRes.json())
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterOrdenId])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    fetchData(val)
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedServicio(null)
    setIdServicio(catalogoServicios[0]?.id_servicio?.toString() || '')
    setCantidad(1)
    setPrecioUnitario(catalogoServicios[0]?.precio_base || 0)
    setObservaciones('')
    setOrdenId(filterOrdenId || ordenes[0]?.id_orden.toString() || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (srv: ServicioRealizado) => {
    setModalMode('edit')
    setSelectedServicio(srv)
    setIdServicio(srv.id_servicio.toString())
    setCantidad(srv.cantidad)
    setPrecioUnitario(srv.precio_unitario)
    setObservaciones(srv.observaciones || '')
    setOrdenId(srv.id_orden.toString())
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleCatalogServiceChange = (id: string) => {
     setIdServicio(id)
     const srv = catalogoServicios.find(s => s.id_servicio === parseInt(id, 10))
     if (srv) setPrecioUnitario(srv.precio_base)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idServicio || !ordenId) {
      setFormError('Debe seleccionar un servicio y una orden')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/servicios-realizados' : `/api/servicios-realizados/${selectedServicio?.id_orden_servicio}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_servicio: parseInt(idServicio, 10),
          id_orden: parseInt(ordenId, 10),
          cantidad: Number(cantidad),
          precio_unitario: Number(precioUnitario),
          observaciones
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error || 'Ocurrió un error')
      }

      setIsModalOpen(false)
      fetchData(search)
    } catch (err: any) {
      console.error(err)
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro?')) return
    try {
      const res = await fetch(`/api/servicios-realizados/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchData(search)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const clearFilter = () => {
    router.push('/servicios-realizados')
  }

  const totalCosto = servicios.reduce((sum, s) => sum + Number(s.subtotal), 0)

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {filterOrdenId && (
              <button onClick={clearFilter} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"><ArrowLeft className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /></button>
            )}
            <h2 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Servicios Aplicados</h2>
          </div>
          <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Control de trabajos y costos por orden</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
        >
          <Plus className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /> Registrar Trabajo
        </button>
      </div>

      <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"><DollarSign className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /></div>
          <div>
            <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Costo Total</p>
            <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">L {totalCosto.toFixed(2)}</p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"><ClipboardList className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /></div>
          <div>
            <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Trabajos Realizados</p>
            <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">{servicios.length}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <AlertCircle className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /> {error}
        </div>
      )}

      {loading ? (
        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <Loader2 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
          <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Cargando...</p>
        </div>
      ) : (
        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
            <table className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
              <thead>
                <tr className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Orden / Vehículo</th>
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Servicio</th>
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Subtotal</th>
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Acciones</th>
                </tr>
              </thead>
              <tbody className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                {servicios.map((srv) => (
                  <tr key={srv.id_orden_servicio} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <div>
                        <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Orden #{srv.id_orden}</p>
                        <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">{srv.orden.vehiculo.placa} ({srv.orden.vehiculo.cliente.usuario.nombre})</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">{srv.servicio.nombre_servicio}</p>
                      <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">{srv.observaciones}</p>
                    </td>
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <span className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">L {Number(srv.subtotal).toFixed(2)}</span>
                      <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">{srv.cantidad} x L {Number(srv.precio_unitario).toFixed(2)}</p>
                    </td>
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                        <button onClick={() => openEditModal(srv)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"><Edit2 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /></button>
                        <button onClick={() => handleDelete(srv.id_orden_servicio)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"><Trash2 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
            <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
              <h3 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                {modalMode === 'create' ? 'Registrar Trabajo Realizado' : 'Editar Detalle de Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Orden de Trabajo</label>
                <select value={ordenId} onChange={(e) => setOrdenId(e.target.value)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                   {ordenes.map(o => (
                      <option key={o.id_orden} value={o.id_orden}>Orden #{o.id_orden} - {o.vehiculo.placa} ({o.vehiculo.cliente.usuario.nombre})</option>
                   ))}
                </select>
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Servicio Realizado</label>
                <select value={idServicio} onChange={(e) => handleCatalogServiceChange(e.target.value)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                   {catalogoServicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre_servicio} (Base: L {Number(s.precio_base).toFixed(2)})</option>
                   ))}
                </select>
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Cantidad</label>
                  <input type="number" required min="1" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value, 10))} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"/>
                </div>
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Precio Unitario (L)</label>
                  <input type="number" required step="0.01" value={precioUnitario} onChange={(e) => setPrecioUnitario(parseFloat(e.target.value))} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"/>
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Observaciones Específicas</label>
                <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {formSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    modalMode === 'create' ? 'Guardar' : 'Actualizar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ServiciosRealizadosPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Cargando...</div>}>
      <ServiciosRealizadosContent />
    </Suspense>
  )
}
