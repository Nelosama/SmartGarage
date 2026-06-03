export default function Ordenes() {
  const ordenes = [
    { id: 1, vehiculo: "ABC-1234 — Toyota Corolla", cliente: "Carlos Reyes", servicio: "Cambio de aceite", estado: "En progreso", fecha: "2024-05-20" },
    { id: 2, vehiculo: "XYZ-5678 — Honda Civic", cliente: "María López", servicio: "Revisión de frenos", estado: "Pendiente", fecha: "2024-05-21" },
    { id: 3, vehiculo: "LMN-9012 — Hyundai Tucson", cliente: "Juan Pérez", servicio: "Alineación y balanceo", estado: "Completado", fecha: "2024-05-19" },
  ];

  const estadoColor = (estado) => {
    if (estado === "Completado") return "bg-green-100 text-green-700";
    if (estado === "En progreso") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Taller Mecánico — Órdenes de Trabajo</h1>
        <a href="/dashboard" className="text-sm underline">← Volver al Dashboard</a>
      </nav>

      <div className="p-6">

        {/* Add button */}
        <div className="flex justify-end mb-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            + Nueva Orden
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Vehículo</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Servicio</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{orden.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{orden.vehiculo}</td>
                  <td className="px-6 py-4 text-gray-600">{orden.cliente}</td>
                  <td className="px-6 py-4 text-gray-600">{orden.servicio}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor(orden.estado)}`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{orden.fecha}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-xs font-semibold">
                      Editar
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}