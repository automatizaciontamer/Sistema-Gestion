
import React, { useState } from 'react';
import { Lock, User as UserIcon, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { supabase } from '../services/supabaseMock';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDbStatus(null);

    try {
      const user = await supabase.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Acceso denegado.');
        setDbStatus('Verifique usuario y contraseña. El sistema ahora acepta mayúsculas/minúsculas para el nombre de usuario.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
      setDbStatus('Revisa la consola (F12) para detalles técnicos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-2xl shadow-blue-500/20 border border-blue-400/20">
            <span className="text-4xl font-black text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Sistema Gestion</h1>
          <p className="text-slate-400">Tamer Industrial S.A.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
              {dbStatus && (
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/50 p-4 rounded-xl text-blue-300 text-[11px] leading-relaxed">
                  <HelpCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{dbStatus}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de Usuario</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="Ingrese su usuario"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>Iniciar Sesión</>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 NexoSync Industrial Systems. v2.4.5
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
