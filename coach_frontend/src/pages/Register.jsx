import React, { useState } from 'react';
import { Zap, Loader2, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    id: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false); // Estado para éxito
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.register(
        formData.email, 
        formData.password, 
        formData.id, 
        formData.name
      );

      setIsRegistered(true);
      // Esperamos 2 segundos para que vea el mensaje de éxito y redirigimos
      setTimeout(() => navigate('/login'), 2500);
      
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-slate-100 text-center animate-in zoom-in-95">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">¡Cuenta creada!</h2>
          <p className="text-slate-400 text-sm font-bold">Redirigiéndote al acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
        
        <Link to="/login" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft size={14} /> Volver al Login
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-100 mb-4">
            <Zap size={32} className="text-white" fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Únete ahora</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre</label>
              <input name="name" type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all" placeholder="Marc" onChange={handleChange} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Athlete ID</label>
              <input name="athleteId" type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all" placeholder="12345" onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email</label>
            <input name="email" type="email" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all" placeholder="atleta@ejemplo.com" onChange={handleChange} required />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Contraseña</label>
            <input name="password" type="password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all" placeholder="••••••••" onChange={handleChange} required />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-[10px] font-black uppercase text-center border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />} 
            Crear Cuenta
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;