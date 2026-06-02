export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Taller Mecánico — Panel Admin</h1>
        <span className="text-sm">Bienvenido, Isaac</span>
      </nav>

      {/* Stats cards */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Clientes</p>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Vehículos</p>
          <p className="text-3xl font-bold text-green-600">31</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Órdenes activas</p>
          <p className="text-3xl font-bold text-yellow-500">8</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Servicios hoy</p>
          <p className="text-3xl font-bold text-purple-600">5</p>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href="/clientes" className="bg-white rounded-xl shadow p-5 hover:bg-blue-50 transition cursor-pointer">
          <p className="text-lg font-semibold text-gray-700">👤 Clientes</p>
          <p className="text-sm text-gray-400">Ver y gestionar clientes</p>
        </a>
        <a href="/vehiculos" className="bg-white rounded-xl shadow p-5 hover:bg-blue-50 transition cursor-pointer">
          <p className="text-lg font-semibold text-gray-700">🚗 Vehículos</p>
          <p className="text-sm text-gray-400">Ver y gestionar vehículos</p>
        </a>
        <a href="/ordenes" className="bg-white rounded-xl shadow p-5 hover:bg-blue-50 transition cursor-pointer">
          <p className="text-lg font-semibold text-gray-700">🔧 Órdenes</p>
          <p className="text-sm text-gray-400">Ver órdenes de trabajo</p>
        </a>
      </div>

    </div>
  );
}