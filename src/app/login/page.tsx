"use client";
import { useState } from "react";
import { Wrench, Lock, Mail, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", { correo, password, redirect: false });
      if (result?.error) {
        setError("Credenciales inválidas. Por favor, intente de nuevo.");
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrió un error al iniciar sesión.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20 mb-6">
          <Wrench className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">SmartGarage</h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">Taller Mecánico • Panel de Control</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200 transition-colors">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="correo" className="block text-sm font-semibold text-slate-700">Correo Electrónico</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                <input id="correo" name="correo" type="email" required autoFocus value={correo} onChange={(e) => setCorreo(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all" placeholder="ejemplo@smartgarage.com" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Contraseña</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all" placeholder="•••••" />
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                <div className="flex">
                  <div className="flex-shrink-0"><AlertCircle className="h-5 w-5 text-red-400" /></div>
                  <div className="ml-3"><p className="text-sm font-medium text-red-800">{error}</p></div>
                </div>
              </div>
            )}
            <div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                {isLoading ? "Iniciando sesión..." : "Entrar al Sistema"}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} SmartGarage Software de Gestión.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
