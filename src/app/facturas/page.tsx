'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Receipt,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Printer,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface FacturaResumen {
  id_factura: number
  numero_factura: string
  id_orden: number
  cliente?: string
  placa?: string
  marca?: string
  modelo?: string
  fecha_emision: string
  total: number
  estado_pago: string
  metodo_pago: string
  subtotal_servicios: number
  subtotal_repuestos: number
  impuesto: number
  descuento: number
  orden?: any
}

interface Orden {
  id_orden: number
  vehiculo: {
    placa: string
    marca?: string
    modelo?: string
    cliente: {
      usuario: {
        nombre: string
      }
    }
  }
}

const emptyForm = {
  id_orden: '',
  numero_factura: '',
  subtotal_servicios: 0,
  subtotal_repuestos: 0,
  impuesto: 0,
  descuento: 0,
  estado_pago: 'Pendiente',
  metodo_pago: '',
}

export default function FacturasPage() {
  const { data: session, status } = useSession()
  const user = session?.user as { id_rol: number; id_usuario: string; nombre: string } | null

  const [facturas, setFacturas] = useState<FacturaResumen[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [currentFactura, setCurrentFactura] = useState<FacturaResumen | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const getCliente = (f: any) => {
    return (
      f.cliente ||
      f.orden?.vehiculo?.cliente?.usuario?.nombre ||
      'Cliente no registrado'
    )
  }

  const getPlaca = (f: any) => {
    return f.placa || f.orden?.vehiculo?.placa || 'Sin placa'
  }

  const getMarca = (f: any) => {
    return f.marca || f.orden?.vehiculo?.marca || ''
  }

  const getModelo = (f: any) => {
    return f.modelo || f.orden?.vehiculo?.modelo || ''
  }

  const normalizarEstadoPagoVista = (estado: string) => {
    if (!estado) return 'Pendiente'
    if (estado === 'Pagado') return 'Pagada'
    return estado
  }

  const totalCalculated = useMemo(() => {
    return (
      Number(formData.subtotal_servicios) +
      Number(formData.subtotal_repuestos) +
      Number(formData.impuesto) -
      Number(formData.descuento)
    )
  }, [formData])

  const fetchFacturas = useCallback(async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/facturas')
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setFacturas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching facturas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrdenes = useCallback(async () => {
    try {
      const res = await fetch('/api/ordenes')
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setOrdenes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching ordenes:', error)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    if (status === 'authenticated' && user) {
      ;(async () => {
        if (!mounted) return

        await fetchFacturas()

        const roleId = Number(user.id_rol)

        if (roleId === 1 || roleId === 2) {
          await fetchOrdenes()
        }
      })()
    }

    return () => {
      mounted = false
    }
  }, [status, user, fetchFacturas, fetchOrdenes])

  const filteredFacturas = useMemo(() => {
    return facturas.filter((f) => {
      const text = `
        ${f.numero_factura || ''}
        ${getCliente(f)}
        ${getPlaca(f)}
        ${getMarca(f)}
        ${getModelo(f)}
        ${f.id_orden || ''}
        ${f.estado_pago || ''}
        ${f.metodo_pago || ''}
      `.toLowerCase()

      return text.includes(search.toLowerCase())
    })
  }, [facturas, search])

  const resetForm = useCallback(() => {
    setFormData(emptyForm)
    setCurrentFactura(null)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, total: totalCalculated }),
      })

      if (res.ok) {
        setShowCreateModal(false)
        await fetchFacturas()
        resetForm()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Error al crear factura')
      }
    } catch (error) {
      console.error('Error creating factura:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentFactura) return

    try {
      const res = await fetch(`/api/facturas/${currentFactura.id_factura}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, total: totalCalculated }),
      })

      if (res.ok) {
        setShowEditModal(false)
        await fetchFacturas()
        resetForm()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Error al actualizar factura')
      }
    } catch (error) {
      console.error('Error updating factura:', error)
    }
  }

  const handleGuardarEImprimir = async () => {
    if (!currentFactura) return

    try {
      const res = await fetch(`/api/facturas/${currentFactura.id_factura}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total: totalCalculated,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        alert(errorData?.error || 'Error al guardar la factura antes de imprimir')
        return
      }

      const facturaActualizada = await res.json()

      setFacturas((prev) =>
        prev.map((f) =>
          f.id_factura === facturaActualizada.id_factura ? facturaActualizada : f
        )
      )

      setCurrentFactura(facturaActualizada)

      imprimirFactura(facturaActualizada)

      await fetchFacturas()
    } catch (error) {
      console.error('Error al guardar e imprimir factura:', error)
      alert('Error al guardar e imprimir factura')
    }
  }

  const handleDelete = async () => {
    if (!currentFactura) return

    try {
      const res = await fetch(`/api/facturas/${currentFactura.id_factura}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setShowDeleteModal(false)
        await fetchFacturas()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Error al eliminar factura')
      }
    } catch (error) {
      console.error('Error deleting factura:', error)
    }
  }

  const openEdit = (f: FacturaResumen) => {
    setCurrentFactura(f)

    setFormData({
      id_orden: f.id_orden?.toString() || '',
      numero_factura: f.numero_factura || '',
      subtotal_servicios: Number(f.subtotal_servicios) || 0,
      subtotal_repuestos: Number(f.subtotal_repuestos) || 0,
      impuesto: Number(f.impuesto) || 0,
      descuento: Number(f.descuento) || 0,
      estado_pago: normalizarEstadoPagoVista(f.estado_pago || 'Pendiente'),
      metodo_pago: f.metodo_pago || '',
    })

    setShowEditModal(true)
  }

  const imprimirFactura = (factura: FacturaResumen) => {
    const ventana = window.open('', '_blank')

    if (!ventana) {
      alert('El navegador bloqueó la ventana de impresión.')
      return
    }

    const cliente = getCliente(factura)
    const marca = getMarca(factura)
    const modelo = getModelo(factura)
    const placa = getPlaca(factura)
    const fecha = factura.fecha_emision ? formatDate(factura.fecha_emision) : 'Sin fecha'

    ventana.document.write(`
      <html>
        <head>
          <title>Factura ${factura.numero_factura}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #111827;
              background: #ffffff;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #f97316;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }

            .brand h1 {
              color: #f97316;
              margin: 0;
              font-size: 30px;
            }

            .brand p {
              margin: 4px 0 0;
              color: #64748b;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .invoice-info {
              text-align: right;
              font-size: 13px;
              color: #334155;
            }

            .invoice-info strong {
              color: #111827;
            }

            .section {
              margin-top: 20px;
              padding: 16px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              background: #f8fafc;
            }

            .section h2 {
              margin: 0 0 10px;
              font-size: 16px;
              color: #1e293b;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 14px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 22px;
              font-size: 14px;
            }

            th {
              background: #f1f5f9;
              color: #475569;
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }

            td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }

            .amount {
              text-align: right;
              font-weight: bold;
            }

            .total-box {
              margin-top: 26px;
              margin-left: auto;
              width: 320px;
              border: 2px solid #fed7aa;
              background: #fff7ed;
              border-radius: 14px;
              padding: 18px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
            }

            .grand-total {
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #fdba74;
              padding-top: 12px;
              margin-top: 12px;
              color: #f97316;
              font-size: 22px;
              font-weight: 900;
            }

            .status {
              display: inline-block;
              padding: 6px 10px;
              border-radius: 999px;
              background: ${
                normalizarEstadoPagoVista(factura.estado_pago) === 'Pagada'
                  ? '#ecfdf5'
                  : '#fffbeb'
              };
              color: ${
                normalizarEstadoPagoVista(factura.estado_pago) === 'Pagada'
                  ? '#047857'
                  : '#b45309'
              };
              font-weight: 800;
            }

            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 14px;
            }

            @media print {
              button {
                display: none;
              }

              body {
                padding: 20px;
              }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="brand">
              <h1>SmartGarage</h1>
              <p>Taller Mecánico</p>
            </div>

            <div class="invoice-info">
              <p><strong>Factura:</strong> ${factura.numero_factura}</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
              <p><strong>Orden:</strong> #${factura.id_orden}</p>
              <p><strong>Estado:</strong> <span class="status">${normalizarEstadoPagoVista(factura.estado_pago)}</span></p>
            </div>
          </div>

          <div class="section">
            <h2>Datos del cliente</h2>
            <div class="grid">
              <div><strong>Cliente:</strong> ${cliente}</div>
              <div><strong>Método de pago:</strong> ${factura.metodo_pago || 'No definido'}</div>
              <div><strong>Vehículo:</strong> ${marca} ${modelo}</div>
              <div><strong>Placa:</strong> ${placa}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th class="amount">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Subtotal servicios</td>
                <td class="amount">L ${Number(factura.subtotal_servicios || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Subtotal repuestos</td>
                <td class="amount">L ${Number(factura.subtotal_repuestos || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Impuesto</td>
                <td class="amount">L ${Number(factura.impuesto || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Descuento</td>
                <td class="amount">L ${Number(factura.descuento || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row">
              <span>Subtotal servicios</span>
              <strong>L ${Number(factura.subtotal_servicios || 0).toFixed(2)}</strong>
            </div>

            <div class="total-row">
              <span>Subtotal repuestos</span>
              <strong>L ${Number(factura.subtotal_repuestos || 0).toFixed(2)}</strong>
            </div>

            <div class="total-row">
              <span>Impuesto</span>
              <strong>L ${Number(factura.impuesto || 0).toFixed(2)}</strong>
            </div>

            <div class="total-row">
              <span>Descuento</span>
              <strong>L ${Number(factura.descuento || 0).toFixed(2)}</strong>
            </div>

            <div class="grand-total">
              <span>Total</span>
              <span>L ${Number(factura.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            Gracias por confiar en SmartGarage.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)

    ventana.document.close()
  }

  const getStatusColor = (estado: string) => {
    const estadoNormalizado = normalizarEstadoPagoVista(estado)

    switch (estadoNormalizado) {
      case 'Pagada':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'Pendiente':
        return 'bg-amber-50 text-amber-700 border-amber-100'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 text-center text-slate-400 font-bold animate-pulse">
        Cargando datos de sesión...
      </div>
    )
  }

  const roleId = Number(user?.id_rol)
  const canManage = roleId === 1 || roleId === 2
  const canDelete = roleId === 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Receipt className="h-8 w-8 text-orange-600" />
            Facturación
          </h1>
          <p className="text-slate-500 text-sm">
            Gestiona los pagos y comprobantes del taller.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="h-5 w-5" />
            Nueva Factura
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

            <input
              type="text"
              placeholder="Buscar por factura, cliente, placa o ID de orden..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Factura #</th>
                <th className="px-6 py-4">Orden / Vehículo</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-10 w-10 text-slate-200" />
                      <p className="text-slate-500 font-medium">
                        No se encontraron facturas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFacturas.map((f) => (
                  <tr key={f.id_factura} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {f.numero_factura}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">
                        Orden #{f.id_orden}
                      </div>
                      <div className="text-xs text-slate-500">
                        {getMarca(f)} {getModelo(f)} ({getPlaca(f)})
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {getCliente(f)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-black text-orange-600">
                        {formatCurrency(f.total)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(f.fecha_emision)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(f.estado_pago)}`}
                      >
                        {normalizarEstadoPagoVista(f.estado_pago)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {f.metodo_pago || 'No definido'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => imprimirFactura(f)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Imprimir factura"
                          aria-label="Imprimir factura"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {canManage && (
                          <button
                            onClick={() => openEdit(f)}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Editar factura"
                            aria-label="Editar factura"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => {
                              setCurrentFactura(f)
                              setShowDeleteModal(true)
                            }}
                            disabled={normalizarEstadoPagoVista(f.estado_pago) === 'Pagada'}
                            className={`p-2 rounded-lg transition-all ${
                              normalizarEstadoPagoVista(f.estado_pago) === 'Pagada'
                                ? 'opacity-30 cursor-not-allowed text-slate-300'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              normalizarEstadoPagoVista(f.estado_pago) === 'Pagada'
                                ? 'No se puede eliminar una factura pagada'
                                : 'Eliminar factura'
                            }
                            aria-label="Eliminar factura"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">
                Generar Nueva Factura
              </h2>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="id_orden" className="text-sm font-bold text-slate-700">
                    Orden de Trabajo
                  </label>

                  <select
                    id="id_orden"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.id_orden}
                    onChange={(e) => setFormData({ ...formData, id_orden: e.target.value })}
                  >
                    <option value="">Seleccione una orden...</option>

                    {ordenes
                      .filter((o) => !facturas.some((f) => f.id_orden === o.id_orden))
                      .map((o) => (
                        <option key={o.id_orden} value={o.id_orden}>
                          Orden #{o.id_orden} - {o.vehiculo?.placa} (
                          {o.vehiculo?.cliente?.usuario?.nombre})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="numero_factura" className="text-sm font-bold text-slate-700">
                    Número de Factura
                  </label>

                  <input
                    id="numero_factura"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    placeholder="FAC-001"
                    value={formData.numero_factura}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_factura: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subtotal_servicios" className="text-sm font-bold text-slate-700">
                    Subtotal Servicios (L)
                  </label>

                  <input
                    id="subtotal_servicios"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_servicios}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subtotal_servicios: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subtotal_repuestos" className="text-sm font-bold text-slate-700">
                    Subtotal Repuestos (L)
                  </label>

                  <input
                    id="subtotal_repuestos"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_repuestos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subtotal_repuestos: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="impuesto" className="text-sm font-bold text-slate-700">
                    Impuesto (L)
                  </label>

                  <input
                    id="impuesto"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.impuesto}
                    onChange={(e) =>
                      setFormData({ ...formData, impuesto: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="descuento" className="text-sm font-bold text-slate-700">
                    Descuento (L)
                  </label>

                  <input
                    id="descuento"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.descuento}
                    onChange={(e) =>
                      setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="estado_pago" className="text-sm font-bold text-slate-700">
                    Estado de Pago
                  </label>

                  <select
                    id="estado_pago"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.estado_pago}
                    onChange={(e) =>
                      setFormData({ ...formData, estado_pago: e.target.value })
                    }
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagada">Pagada</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="metodo_pago" className="text-sm font-bold text-slate-700">
                    Método de Pago
                  </label>

                  <select
                    id="metodo_pago"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.metodo_pago}
                    onChange={(e) =>
                      setFormData({ ...formData, metodo_pago: e.target.value })
                    }
                  >
                    <option value="">Seleccione método...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 p-6 bg-orange-50 rounded-2xl flex items-center justify-between border border-orange-100">
                <span className="text-orange-800 font-bold uppercase tracking-wider text-sm">
                  Total a Facturar
                </span>
                <span className="text-3xl font-black text-orange-600">
                  {formatCurrency(totalCalculated)}
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Generar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">
                Editar Factura: {currentFactura?.numero_factura}
              </h2>

              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="edit_numero_factura" className="text-sm font-bold text-slate-700">
                    Número de Factura
                  </label>

                  <input
                    id="edit_numero_factura"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.numero_factura}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_factura: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit_estado_pago" className="text-sm font-bold text-slate-700">
                    Estado de Pago
                  </label>

                  <select
                    id="edit_estado_pago"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.estado_pago}
                    onChange={(e) =>
                      setFormData({ ...formData, estado_pago: e.target.value })
                    }
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagada">Pagada</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit_subtotal_servicios" className="text-sm font-bold text-slate-700">
                    Subtotal Servicios (L)
                  </label>

                  <input
                    id="edit_subtotal_servicios"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_servicios}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subtotal_servicios: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit_subtotal_repuestos" className="text-sm font-bold text-slate-700">
                    Subtotal Repuestos (L)
                  </label>

                  <input
                    id="edit_subtotal_repuestos"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_repuestos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subtotal_repuestos: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit_impuesto" className="text-sm font-bold text-slate-700">
                    Impuesto (L)
                  </label>

                  <input
                    id="edit_impuesto"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.impuesto}
                    onChange={(e) =>
                      setFormData({ ...formData, impuesto: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit_descuento" className="text-sm font-bold text-slate-700">
                    Descuento (L)
                  </label>

                  <input
                    id="edit_descuento"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.descuento}
                    onChange={(e) =>
                      setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="edit_metodo_pago" className="text-sm font-bold text-slate-700">
                    Método de Pago
                  </label>

                  <select
                    id="edit_metodo_pago"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.metodo_pago}
                    onChange={(e) =>
                      setFormData({ ...formData, metodo_pago: e.target.value })
                    }
                  >
                    <option value="">Seleccione método...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 p-6 bg-orange-50 rounded-2xl flex items-center justify-between border border-orange-100">
                <span className="text-orange-800 font-bold uppercase tracking-wider text-sm">
                  Total Actualizado
                </span>
                <span className="text-3xl font-black text-orange-600">
                  {formatCurrency(totalCalculated)}
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleGuardarEImprimir}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Guardar e Imprimir
                </button>

                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8" />
              </div>

              <h2 className="text-xl font-black text-slate-800 mb-2">
                ¿Eliminar Factura?
              </h2>

              <p className="text-slate-500 mb-8">
                Esta acción no se puede deshacer. La factura{' '}
                <span className="font-bold text-slate-700">
                  {currentFactura?.numero_factura}
                </span>{' '}
                será eliminada permanentemente.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-all"
                >
                  No, mantener
                </button>

                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}