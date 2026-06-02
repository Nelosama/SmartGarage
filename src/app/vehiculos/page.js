export default function Vehiculos() {
  const vehiculos = [
    { id: 1, placa: "ABC-1234", marca: "Toyota", modelo: "Corolla", anio: 2019, cliente: "Carlos Reyes" },
    { id: 2, placa: "XYZ-5678", marca: "Honda", modelo: "Civic", anio: 2021, cliente: "María López" },
    { id: 3, placa: "LMN-9012", marca: "Hyundai", modelo: "Tucson", anio: 2020, cliente: "Juan Pérez" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Taller Mecánico — Vehículos</h1>
        <a href="/dashboard" className="text-sm underline">← Volver al Dashboard</a>
      </nav>

      <div className="p-6">

        {/* Add button */}
        <div className="flex justify-end mb-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            + Agregar Vehículo
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Placa</th>
                <th className="px-6 py-3 text-left">Marca</th>
                <th className="px-6 py-3 text-left">Modelo</th>
                <th className="px-6 py-3 text-left">Año</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehiculos.map((vehiculo) => (
                <tr key={vehiculo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{vehiculo.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{vehiculo.placa}</td>
                  <td className="px-6 py-4 text-gray-600">{vehiculo.marca}</td>
                  <td className="px-6 py-4 text-gray-600">{vehiculo.modelo}</td>
                  <td className="px-6 py-4 text-gray-600">{vehiculo.anio}</td>
                  <td className="px-6 py-4 text-gray-600">{vehiculo.cliente}</td>
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