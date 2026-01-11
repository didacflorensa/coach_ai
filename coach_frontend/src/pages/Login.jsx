import React, { useState } from 'react';
import { Zap, Loader2, LogIn, UserPlus } from 'lucide-react';
import { authService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const data = await authService.login(email, password);
        onLoginSuccess(data);
        navigate('/');
        
    } catch (err) {
        // REVISIÓN DEL ERROR:
        // Si el mensaje contiene "Unauthorized" o el backend devuelve un 401
        // personalizamos el mensaje para el usuario.
        if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        setError('Email o contraseña incorrectos');
        } else if (err.message.includes('Failed to fetch')) {
        setError('No se pudo conectar con el servidor');
        } else {
        setError(err.message || 'Error al intentar iniciar sesión');
        }
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-100 mb-4">
            <Zap size={32} className="text-white" fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">StravaMetrics</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Panel de Rendimiento</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              placeholder="atleta@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Contraseña</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-[10px] font-black uppercase text-center border border-red-100 animate-bounce">
                {error}
            </div>
            )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />} 
            Entrar al Panel
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                ¿Eres nuevo en StravaMetrics?
            </p>
            <Link 
                to="/register" 
                className="inline-flex items-center gap-2 text-blue-600 text-sm font-bold hover:gap-3 transition-all"
            >
                Crear una cuenta nueva <UserPlus size={16} />
            </Link>
            </div>
      </div>
    </div>
  );
};

export default LoginPage;