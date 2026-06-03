export default function Clientes() {
  const clientes = [
    { id: 1, nombre: "Carlos Reyes", telefono: "9999-1234", correo: "carlos@gmail.com" },
    { id: 2, nombre: "María López", telefono: "8888-5678", correo: "maria@gmail.com" },
    { id: 3, nombre: "Juan Pérez", telefono: "7777-9012", correo: "juan@gmail.com" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Taller Mecánico — Clientes</h1>
        <a href="/dashboard" className="text-sm underline">← Volver al Dashboard</a>
      </nav>

      <div className="p-6">

        {/* Add button */}
        <div className="flex justify-end mb-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            + Agregar Cliente
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Teléfono</th>
                <th className="px-6 py-3 text-left">Correo</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{cliente.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{cliente.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{cliente.telefono}</td>
                  <td className="px-6 py-4 text-gray-600">{cliente.correo}</td>
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